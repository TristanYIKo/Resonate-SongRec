import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/serverSupabase'

/**
 * API Route: /api/me
 * Returns current user profile and session information
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    return NextResponse.json({
      user: session.user,
      profile: profile || null,
      session: {
        expires_at: session.expires_at,
        expires_in: session.expires_in
      }
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
