import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getSpotifyTokens, saveSpotifyTokens } from '@/lib/supabase'
import {
  isTokenExpired,
  refreshSpotifyToken,
  testRecommendationsAPI,
} from '@/lib/spotify'

/**
 * API Route: /api/spotify/test-recommendations
 * Tests if the Spotify Recommendations API is available for this user's account
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get Spotify tokens
    let tokens = await getSpotifyTokens(user.id)

    if (!tokens) {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.provider_token && session?.provider_refresh_token) {
        tokens = {
          access_token: session.provider_token,
          refresh_token: session.provider_refresh_token,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }
      } else {
        return NextResponse.json(
          { error: 'No Spotify tokens found. Please log in with Spotify again.' },
          { status: 400 }
        )
      }
    }

    let accessToken = tokens.access_token
    const refreshToken = tokens.refresh_token

    // Refresh token if expired
    if (isTokenExpired(tokens.expires_at)) {
      console.log('Token expired, refreshing...')
      const newTokens = await refreshSpotifyToken(refreshToken)
      accessToken = newTokens.access_token
      
      await saveSpotifyTokens(
        user.id,
        newTokens.access_token,
        newTokens.refresh_token,
        newTokens.expires_in
      )
    }

    // Test the recommendations API
    const isAvailable = await testRecommendationsAPI(accessToken)

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable 
        ? '✅ Spotify Recommendations API is working for your account!' 
        : '❌ Spotify Recommendations API is not available for your account. This is common with free accounts in certain regions. The app will use a fallback method.',
      user_id: user.id,
    })

  } catch (error: any) {
    console.error('Test recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to test recommendations API', details: error.message },
      { status: 500 }
    )
  }
}
