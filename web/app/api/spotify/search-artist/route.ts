import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getSpotifyTokens, saveSpotifyTokens } from '@/lib/supabase'
import { isTokenExpired, refreshSpotifyToken } from '@/lib/spotify'

export interface SearchArtistResult {
  id: string
  name: string
  image: string | null
}

/**
 * API Route: GET /api/spotify/search-artist
 * Search for artists by name
 * Query params: ?q=<artist name>
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get query param
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    // If query is empty, return empty array
    if (!query || query.trim() === '') {
      return NextResponse.json([])
    }

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

    // Search for artists
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    // If 401, refresh token and retry once
    if (response.status === 401 && refreshToken) {
      console.log('Got 401, refreshing token and retrying...')
      const newTokens = await refreshSpotifyToken(refreshToken)
      accessToken = newTokens.access_token
      
      await saveSpotifyTokens(
        user.id,
        newTokens.access_token,
        newTokens.refresh_token,
        newTokens.expires_in
      )

      // Retry the search
      const retryResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!retryResponse.ok) {
        console.error('Artist search failed after retry:', retryResponse.status)
        return NextResponse.json({ error: 'Failed to search artists' }, { status: retryResponse.status })
      }

      const retryData = await retryResponse.json()
      const artists = retryData.artists?.items || []
      
      const results: SearchArtistResult[] = artists.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url || null,
      }))

      return NextResponse.json(results)
    }

    if (!response.ok) {
      console.error('Artist search failed:', response.status)
      return NextResponse.json({ error: 'Failed to search artists' }, { status: response.status })
    }

    const data = await response.json()
    const artists = data.artists?.items || []
    
    // Format and return results
    const results: SearchArtistResult[] = artists.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url || null,
    }))

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('Search artist error:', error)
    return NextResponse.json(
      { error: 'Failed to search artists', details: error.message },
      { status: 500 }
    )
  }
}
