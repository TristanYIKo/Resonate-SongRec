import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getSpotifyTokens, saveSpotifyTokens } from '@/lib/supabase'

/**
 * GET /api/spotify/recently-played
 * Fetches user's recently played tracks from Spotify
 */
export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Spotify access token
    const tokens = await getSpotifyTokens(user.id)
    let accessToken = tokens?.access_token
    
    if (!accessToken) {
      // Try to get token from session
      const { data: { session } } = await supabase.auth.getSession()
      accessToken = session?.provider_token || null
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'No Spotify access token found' }, { status: 401 })
    }

    // Get limit from query params (default 50, max 50)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50)

    // Fetch recently played tracks from Spotify
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (response.status === 401) {
      // Token expired, try to refresh
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.provider_token) {
        const newToken = session.provider_token
        
        // Retry the request with new token
        const retryResponse = await fetch(
          `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${newToken}`,
            },
          }
        )
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text()
          console.error('Spotify recently-played error after refresh:', retryResponse.status, errorText)
          return NextResponse.json({ 
            error: 'Failed to fetch recently played tracks',
            details: errorText 
          }, { status: retryResponse.status })
        }
        
        const data = await retryResponse.json()
        return NextResponse.json(data)
      }
      
      return NextResponse.json({ error: 'Token expired and refresh failed' }, { status: 401 })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Spotify recently-played error:', response.status, errorText)
      return NextResponse.json({ 
        error: 'Failed to fetch recently played tracks',
        details: errorText 
      }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Recently-played API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
