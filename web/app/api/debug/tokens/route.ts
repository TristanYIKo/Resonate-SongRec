import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getSpotifyTokens } from '@/lib/supabase'

/**
 * Debug endpoint to check if Spotify tokens are available
 * DELETE THIS FILE AFTER DEBUGGING
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check session tokens
    const { data: { session } } = await supabase.auth.getSession()
    
    // Check database tokens
    const dbTokens = await getSpotifyTokens(user.id)

    return NextResponse.json({
      userId: user.id,
      hasSessionProviderToken: !!session?.provider_token,
      hasSessionRefreshToken: !!session?.provider_refresh_token,
      hasDbTokens: !!dbTokens,
      sessionProvider: session?.user?.app_metadata?.provider,
      // DO NOT log actual tokens in production
    })
  } catch (error) {
    console.error('Debug tokens error:', error)
    return NextResponse.json({ error: 'Failed to check tokens' }, { status: 500 })
  }
}
