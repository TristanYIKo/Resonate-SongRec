import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/spotify/listening-history
 * Fetches stored listening history from database
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch listening history from database
    const { data: history, error: dbError } = await supabase
      .from('listening_history')
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: true })
      .order('month', { ascending: true })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ history: history || [] })

  } catch (error) {
    console.error('Listening history API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/spotify/listening-history
 * Saves/updates listening data for a specific month
 */
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { year, month, hours, track_count } = body

    if (!year || !month || hours === undefined) {
      return NextResponse.json({ error: 'Missing required fields: year, month, hours' }, { status: 400 })
    }

    // Upsert listening data (insert or update if exists)
    const { data, error: upsertError } = await supabase
      .from('listening_history')
      .upsert({
        user_id: user.id,
        year,
        month,
        hours: parseFloat(hours.toFixed(2)),
        track_count: track_count || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,year,month'
      })
      .select()

    if (upsertError) {
      console.error('Database upsert error:', upsertError)
      return NextResponse.json({ error: 'Failed to save listening data' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Save listening history error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
