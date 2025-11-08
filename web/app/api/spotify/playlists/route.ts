import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getSpotifyTokens, saveSpotifyTokens } from '@/lib/supabase'
import {
  isTokenExpired,
  refreshSpotifyToken,
  fetchUserPlaylists,
  type SpotifyPlaylist,
} from '@/lib/spotify'

/**
 * API Route: /api/spotify/playlists
 * Gets the user's Spotify playlists
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Fetching playlists for user:', user.id)

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

    // Fallback to database tokens if session doesn't have them
    if (!accessToken || !refreshToken) {
      const tokens = await getSpotifyTokens(user.id)
      
      if (tokens) {
        accessToken = tokens.access_token
        refreshToken = tokens.refresh_token
      } else {
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

    // Fetch playlists
    let playlists: SpotifyPlaylist[] = []

    try {
      playlists = await fetchUserPlaylists(accessToken, 50)
      console.log(`✓ Fetched ${playlists.length} playlists`)
    } catch (error: any) {
      console.error('Fetch playlists error:', error.message)
      
      // Retry once if 401
      if (error.message?.includes('401') && refreshToken) {
        console.log('Token expired, refreshing and retrying...')
        const newTokens = await refreshSpotifyToken(refreshToken)
        accessToken = newTokens.access_token
        
        await saveSpotifyTokens(
          user.id,
          newTokens.access_token,
          newTokens.refresh_token,
          newTokens.expires_in
        )
        
        playlists = await fetchUserPlaylists(accessToken, 50)
      } else {
        throw error
      }
    }

    if (playlists.length === 0) {
      return NextResponse.json(
        { message: 'No playlists found', playlists: [] },
        { status: 200 }
      )
    }

    return NextResponse.json({ playlists })

  } catch (error: any) {
    console.error('Playlists API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlists', details: error.message },
      { status: 500 }
    )
  }
}
