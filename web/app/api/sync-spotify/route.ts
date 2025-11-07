import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/serverSupabase'

/**
 * API Route: /api/sync-spotify
 * Fetches user's top tracks from Spotify API and stores them in Supabase
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch Spotify tokens from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('spotify_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ 
        error: 'Spotify tokens not found. Please re-authenticate.' 
      }, { status: 400 })
    }

    // Check if token is expired and refresh if needed
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()
    let accessToken = tokenData.access_token

    if (now >= expiresAt) {
      // Token is expired, refresh it
      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenData.refresh_token
        })
      })

      if (!refreshResponse.ok) {
        return NextResponse.json({ 
          error: 'Failed to refresh Spotify token' 
        }, { status: 400 })
      }

      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token

      // Update token in database
      await supabase
        .from('spotify_tokens')
        .update({
          access_token: refreshData.access_token,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
        })
        .eq('user_id', userId)
    }

    // Fetch top tracks from Spotify
    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!topTracksResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch tracks from Spotify' 
      }, { status: 400 })
    }

    const topTracksData = await topTracksResponse.json()
    const trackIds = topTracksData.items.map((track: any) => track.id)

    // Fetch audio features for tracks
    const audioFeaturesResponse = await fetch(
      `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!audioFeaturesResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch audio features from Spotify' 
      }, { status: 400 })
    }

    const audioFeaturesData = await audioFeaturesResponse.json()

    // Prepare track data for insertion
    const tracksToInsert = topTracksData.items.map((track: any, index: number) => {
      const features = audioFeaturesData.audio_features[index]
      return {
        user_id: userId,
        spotify_track_id: track.id,
        name: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        album: track.album.name,
        danceability: features?.danceability || null,
        energy: features?.energy || null,
        valence: features?.valence || null,
        tempo: features?.tempo || null,
        acousticness: features?.acousticness || null
      }
    })

    // Upsert tracks into database
    const { error: insertError } = await supabase
      .from('user_tracks')
      .upsert(tracksToInsert, {
        onConflict: 'user_id,spotify_track_id'
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ 
        error: 'Failed to save tracks to database' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      trackCount: tracksToInsert.length 
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
