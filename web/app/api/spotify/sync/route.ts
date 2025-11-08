import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getSpotifyTokens, saveSpotifyTokens } from '@/lib/supabase'
import {
  isTokenExpired,
  refreshSpotifyToken,
  fetchUserTopTracks,
  fetchUserTopArtists,
  fetchUserPlaylists,
  formatTrack,
} from '@/lib/spotify'

/**
 * API Route: /api/spotify/sync
 * Syncs user's Spotify data (top tracks, top artists, playlists) to the database
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Syncing Spotify data for user:', user.id)

    // Get session first
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'No active session. Please log in with Spotify again.' },
        { status: 401 }
      )
    }

    // Try to get token from session first (most reliable on Vercel)
    let accessToken = session.provider_token
    let refreshToken = session.provider_refresh_token
    
    console.log('Session provider:', session.user?.app_metadata?.provider)
    console.log('Has provider_token:', !!accessToken)
    console.log('Has provider_refresh_token:', !!refreshToken)

    // Fallback to database tokens if session doesn't have them
    if (!accessToken || !refreshToken) {
      console.log('Session tokens not found, checking database...')
      const tokens = await getSpotifyTokens(user.id)
      
      if (tokens) {
        accessToken = tokens.access_token
        refreshToken = tokens.refresh_token
        console.log('Using database tokens')
      } else {
        console.error('No tokens found in session or database')
        return NextResponse.json(
          { error: 'No Spotify tokens found. Please log out and log in with Spotify again.' },
          { status: 401 }
        )
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing Spotify access token. Please log out and log in again.' },
        { status: 401 }
      )
    }

    // Refresh token if expired
    // Note: We can't reliably check expiry without the expires_at timestamp
    // The token might work as-is from the session
    
    // Try to use the token, if it fails we'll get a 401 from Spotify

    // Fetch data from Spotify
    console.log('Fetching top tracks...')
    let topTracksRaw
    try {
      topTracksRaw = await fetchUserTopTracks(accessToken, 300)
      console.log(`✓ Fetched ${topTracksRaw.length} top tracks`)
    } catch (error: any) {
      console.error('Error fetching top tracks:', error.message)
      throw error
    }
    
    const topTracks = topTracksRaw.map(formatTrack)

    console.log('Fetching top artists...')
    let topArtists
    try {
      topArtists = await fetchUserTopArtists(accessToken, 75)
      console.log(`✓ Fetched ${topArtists.length} top artists`)
    } catch (error: any) {
      console.error('Error fetching top artists:', error.message)
      throw error
    }

    console.log('Fetching playlists...')
    let playlists
    try {
      playlists = await fetchUserPlaylists(accessToken, 50)
      console.log(`✓ Fetched ${playlists.length} playlists`)
    } catch (error: any) {
      console.error('Error fetching playlists:', error.message)
      throw error
    }

    // Save to database
    console.log('Saving to database...')
    
    // Save as JSON in a user_spotify_data table (or update existing structure)
    const { error: upsertError } = await supabase
      .from('user_spotify_data')
      .upsert({
        user_id: user.id,
        top_tracks: topTracks,
        top_artists: topArtists,
        playlists: playlists,
        synced_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      console.error('Database error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save data to database', details: upsertError.message },
        { status: 500 }
      )
    }

    console.log('Sync complete!')

    return NextResponse.json({
      success: true,
      stats: {
        top_tracks: topTracks.length,
        top_artists: topArtists.length,
        playlists: playlists.length,
      }
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    
    // Handle 401 specifically
    if (error.message?.includes('401')) {
      return NextResponse.json(
        { error: 'Spotify authentication failed. Please log in again.' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to sync Spotify data', details: error.message },
      { status: 500 }
    )
  }
}
