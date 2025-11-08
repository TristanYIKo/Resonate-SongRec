import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getSpotifyTokens, saveSpotifyTokens } from '@/lib/supabase'
import {
  isTokenExpired,
  refreshSpotifyToken,
  getGeneralRecommendations,
  getPlaylistRecommendations,
  getArtistRecommendations,
  getRelatedArtists,
  getArtistSongsRecommendations,
  searchArtist,
  getRecommendationsFromArtistTopTracks,
  getRecommendationsFromRelatedArtists,
  getPlaylistTracks,
  testRecommendationsAPI,
  type SpotifyTrack,
  type SpotifyArtist,
} from '@/lib/spotify'

/**
 * API Route: /api/spotify/recommendations
 * Gets recommendations based on different modes: general, playlist, or artist
 * 
 * Query params:
 * - mode: "general" | "playlist" | "artist"
 * - playlist_id: (required if mode=playlist)
 * - artist_id or artist_name: (required if mode=artist)
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('mode') || 'general'
    const playlistId = searchParams.get('playlist_id')
    const artistId = searchParams.get('artist_id')
    const artistName = searchParams.get('artist_name')

    console.log('Getting recommendations for user:', user.id, 'mode:', mode)

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

    let recommendations: SpotifyTrack[] = []

    // Handle different modes
    if (mode === 'general') {
      // Try to get user's synced data from database
      const { data: syncedData, error: dbError } = await supabase
        .from('user_spotify_data')
        .select('top_tracks, top_artists')
        .eq('user_id', user.id)
        .single()

      let topTrackIds: string[] = []
      let topArtistIds: string[] = []

      // If no synced data, fetch live from Spotify as fallback
      if (dbError || !syncedData) {
        console.log('No synced data found, fetching live from Spotify...')
        
        try {
          // Fetch top tracks live from Spotify - get more for variety
          const topTracksUrl = 'https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term'
          const tracksResponse = await fetch(topTracksUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })

          if (!tracksResponse.ok) {
            console.error('Failed to fetch live top tracks:', tracksResponse.status)
            throw new Error(`Failed to fetch top tracks: ${tracksResponse.status}`)
          }

          const tracksData = await tracksResponse.json()
          topTrackIds = (tracksData.items || []).map((t: any) => t.id)
          
          // Also fetch top artists for better variety
          const artistsUrl = 'https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term'
          const artistsResponse = await fetch(artistsUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })
          
          if (artistsResponse.ok) {
            const artistsData = await artistsResponse.json()
            topArtistIds = (artistsData.items || []).map((a: any) => a.id)
          }
          
          console.log(`✓ Fetched ${topTrackIds.length} top tracks and ${topArtistIds.length} artists live from Spotify`)
        } catch (error: any) {
          // Retry once if 401
          if (error.message?.includes('401') && refreshToken) {
            const newTokens = await refreshSpotifyToken(refreshToken)
            accessToken = newTokens.access_token
            await saveSpotifyTokens(user.id, newTokens.access_token, newTokens.refresh_token, newTokens.expires_in)
            
            const topTracksUrl = 'https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term'
            const tracksResponse = await fetch(topTracksUrl, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            const tracksData = await tracksResponse.json()
            topTrackIds = (tracksData.items || []).map((t: any) => t.id)
            
            const artistsUrl = 'https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term'
            const artistsResponse = await fetch(artistsUrl, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            if (artistsResponse.ok) {
              const artistsData = await artistsResponse.json()
              topArtistIds = (artistsData.items || []).map((a: any) => a.id)
            }
          } else {
            throw error
          }
        }

        if (topTrackIds.length === 0) {
          return NextResponse.json(
            { error: 'No listening history found. Please listen to some songs on Spotify first.' },
            { status: 400 }
          )
        }
      } else {
        // Use synced data
        topTrackIds = (syncedData.top_tracks || []).map((t: any) => t.id)
        topArtistIds = (syncedData.top_artists || []).map((a: any) => a.id)
        console.log(`Using synced data: ${topTrackIds.length} tracks, ${topArtistIds.length} artists`)
      }

      try {
        recommendations = await getGeneralRecommendations(
          accessToken,
          topTrackIds,
          topArtistIds,
          20
        )
      } catch (error: any) {
        console.error('General recommendations error:', error.message)
        
        // If we get a 404 (recommendations API not available), use fallback method
        if (error.message?.includes('404')) {
          console.log('Spotify recommendations API returned 404, using fallback method...')
          
          try {
            // Fetch full track objects for the fallback method - get more for variety
            const topTracksUrl = 'https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term'
            const tracksResponse = await fetch(topTracksUrl, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            
            if (tracksResponse.ok) {
              const tracksData = await tracksResponse.json()
              const fullSeedTracks = tracksData.items || []
              
              console.log('Using SMART fallback: related artists method (similar to Spotify ML)...')
              recommendations = await getRecommendationsFromRelatedArtists(
                accessToken,
                fullSeedTracks,
                20
              )
              console.log(`✅ Got ${recommendations.length} recommendations from smart fallback method`)
            } else {
              throw new Error('Failed to fetch tracks for fallback method')
            }
          } catch (fallbackError: any) {
            console.error('Fallback method also failed:', fallbackError.message)
            return NextResponse.json(
              { 
                error: 'Unable to generate recommendations. Your Spotify account may not have access to the recommendations API.',
                details: error.message
              },
              { status: 500 }
            )
          }
        } else if (error.message?.includes('401') && refreshToken) {
          // Retry once if 401
          const newTokens = await refreshSpotifyToken(refreshToken)
          accessToken = newTokens.access_token
          await saveSpotifyTokens(user.id, newTokens.access_token, newTokens.refresh_token, newTokens.expires_in)
          
          recommendations = await getGeneralRecommendations(
            accessToken,
            topTrackIds,
            topArtistIds,
            20
          )
        } else {
          throw error
        }
      }

    } else if (mode === 'playlist') {
      if (!playlistId) {
        return NextResponse.json(
          { error: 'playlist_id is required for playlist mode' },
          { status: 400 }
        )
      }

      console.log('Getting playlist recommendations for playlist:', playlistId)

      try {
        recommendations = await getPlaylistRecommendations(accessToken, playlistId, 20)
        console.log(`✓ Got ${recommendations.length} playlist recommendations`)
      } catch (error: any) {
        console.error('Playlist recommendations error:', error.message)
        
        // If we get a 404 (recommendations API not available), use fallback method
        if (error.message?.includes('404')) {
          console.log('Spotify recommendations API returned 404, using fallback method for playlist...')
          
          try {
            // Fetch tracks from the playlist
            const trackIds = await getPlaylistTracks(accessToken, playlistId, 50)
            
            if (trackIds.length === 0) {
              return NextResponse.json(
                { error: 'No tracks found in this playlist' },
                { status: 400 }
              )
            }
            
            // Fetch full track objects
            const trackIdsToFetch = trackIds.slice(0, 5).join(',')
            const tracksUrl = `https://api.spotify.com/v1/tracks?ids=${trackIdsToFetch}`
            const tracksResponse = await fetch(tracksUrl, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            })
            
            if (tracksResponse.ok) {
              const tracksData = await tracksResponse.json()
              const fullSeedTracks = tracksData.tracks || []
              
              console.log('Using SMART fallback for playlist: related artists method (similar to Spotify ML)...')
              recommendations = await getRecommendationsFromRelatedArtists(
                accessToken,
                fullSeedTracks,
                20
              )
              console.log(`✅ Got ${recommendations.length} recommendations from smart fallback method`)
            } else {
              throw new Error('Failed to fetch tracks for fallback method')
            }
          } catch (fallbackError: any) {
            console.error('Fallback method also failed:', fallbackError.message)
            return NextResponse.json(
              { 
                error: 'Unable to generate playlist recommendations. Your Spotify account may not have access to the recommendations API.',
                details: error.message
              },
              { status: 500 }
            )
          }
        } else if (error.message?.includes('401') && refreshToken) {
          console.log('Token expired, refreshing and retrying...')
          const newTokens = await refreshSpotifyToken(refreshToken)
          accessToken = newTokens.access_token
          await saveSpotifyTokens(user.id, newTokens.access_token, newTokens.refresh_token, newTokens.expires_in)
          
          recommendations = await getPlaylistRecommendations(accessToken, playlistId, 20)
        } else {
          // Log the full error for debugging
          console.error('Full error:', error)
          throw error
        }
      }

    } else if (mode === 'artist') {
      let finalArtistId = artistId

      // If artist_name is provided, search for the artist
      if (!finalArtistId && artistName) {
        console.log('Searching for artist:', artistName)
        
        try {
          finalArtistId = await searchArtist(accessToken, artistName)
          console.log(`✓ Found artist ID: ${finalArtistId}`)
        } catch (error: any) {
          console.error('Artist search error:', error.message)
          
          if (error.message?.includes('401') && refreshToken) {
            const newTokens = await refreshSpotifyToken(refreshToken)
            accessToken = newTokens.access_token
            await saveSpotifyTokens(user.id, newTokens.access_token, newTokens.refresh_token, newTokens.expires_in)
            
            finalArtistId = await searchArtist(accessToken, artistName)
          } else {
            throw error
          }
        }

        if (!finalArtistId) {
          return NextResponse.json(
            { error: `Artist "${artistName}" not found` },
            { status: 404 }
          )
        }
      }

      if (!finalArtistId) {
        return NextResponse.json(
          { error: 'artist_id or artist_name is required for artist mode' },
          { status: 400 }
        )
      }

      console.log('Getting artist song recommendations for artist:', finalArtistId)

      try {
        // Get personalized song recommendations from this artist
        recommendations = await getArtistSongsRecommendations(accessToken, finalArtistId)
        console.log(`✓ Got ${recommendations.length} artist song recommendations`)
        
        if (recommendations.length === 0) {
          return NextResponse.json({
            error: 'No songs found',
            message: 'This artist may not have any tracks available on Spotify.',
            tracks: []
          }, { status: 404 })
        }
        
      } catch (error: any) {
        console.error('Artist songs recommendations error:', error.message)
        
        if (error.message?.includes('401') && refreshToken) {
          const newTokens = await refreshSpotifyToken(refreshToken)
          accessToken = newTokens.access_token
          await saveSpotifyTokens(user.id, newTokens.access_token, newTokens.refresh_token, newTokens.expires_in)
          
          // Retry
          try {
            recommendations = await getArtistSongsRecommendations(accessToken, finalArtistId)
          } catch (retryError: any) {
            console.error('Artist songs retry failed:', retryError.message)
            return NextResponse.json({
              error: 'Failed to get artist songs',
              message: 'Unable to fetch songs for this artist. Please try again.',
              tracks: []
            }, { status: 500 })
          }
        } else {
          console.error('Full error:', error)
          return NextResponse.json({
            error: 'Failed to get artist songs',
            message: error.message || 'An error occurred while fetching songs.',
            tracks: []
          }, { status: 500 })
        }
      }

      // Return artist songs (tracks array for consistency with other modes)
      return NextResponse.json(recommendations)

    } else {
      return NextResponse.json(
        { error: 'Invalid mode. Must be: general, playlist, or artist' },
        { status: 400 }
      )
    }

    // Return simplified track list
    return NextResponse.json(recommendations)

  } catch (error: any) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations', details: error.message },
      { status: 500 }
    )
  }
}
