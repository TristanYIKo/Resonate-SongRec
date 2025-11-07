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
    console.log('User ID:', userId)

    // Get provider token from session
    // Supabase stores provider tokens in the session's provider_token
    let accessToken = session.provider_token

    if (!accessToken) {
      // Try to get a fresh token from Supabase
      const { data, error } = await supabase.auth.refreshSession()
      if (error || !data.session?.provider_token) {
        return NextResponse.json({ 
          error: 'Spotify tokens not found. Please log out and log back in.' 
        }, { status: 400 })
      }
      accessToken = data.session.provider_token
    }

    console.log('Using access token for Spotify API (first 20 chars):', accessToken?.substring(0, 20))

    // Fetch top tracks from Spotify
    console.log('Fetching top tracks from Spotify...')
    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!topTracksResponse.ok) {
      const errorText = await topTracksResponse.text()
      console.error('Spotify top tracks error:', topTracksResponse.status, errorText)
      return NextResponse.json({ 
        error: `Failed to fetch tracks from Spotify: ${topTracksResponse.status}` 
      }, { status: 400 })
    }

    const topTracksData = await topTracksResponse.json()
    console.log('Fetched tracks count:', topTracksData.items?.length)
    
    if (!topTracksData.items || topTracksData.items.length === 0) {
      return NextResponse.json({ 
        error: 'No tracks found in your Spotify listening history' 
      }, { status: 400 })
    }
    
    const trackIds = topTracksData.items.map((track: any) => track.id)

    // For now, we'll save tracks without audio features to avoid the 403 error
    // Audio features endpoint requires additional Spotify app permissions
    // We'll use basic track info instead
    const tracksToInsert = topTracksData.items.map((track: any) => {
      return {
        user_id: userId,
        spotify_track_id: track.id,
        name: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        album: track.album.name,
        danceability: null,
        energy: null,
        valence: null,
        tempo: null,
        acousticness: null
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
