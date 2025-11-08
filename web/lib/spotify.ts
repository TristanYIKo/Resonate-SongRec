/**
 * Spotify API helper functions
 */

export interface SpotifyTrack {
  id: string
  name: string
  artists: string[]
  album: string
  preview_url: string | null
  external_url: string
  image: string | null
  spotify_url?: string // Alias for external_url
}

export interface SpotifyArtist {
  id: string
  name: string
  image: string | null
}

export interface SpotifyPlaylist {
  id: string
  name: string
  owner: string
  total_tracks: number
  image: string | null
}

export interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_at: string
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime()
  const now = Date.now()
  // Consider expired if within 5 minutes of expiry
  return now >= expiryTime - 5 * 60 * 1000
}

/**
 * Refresh a Spotify access token using the refresh token
 */
export async function refreshSpotifyToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Spotify token refresh failed:', error)
    throw new Error(`Failed to refresh Spotify token: ${response.status}`)
  }

  const data = await response.json()
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken, // Spotify may not return a new refresh token
    expires_in: data.expires_in,
  }
}

/**
 * Get user's top tracks from Spotify
 */
export async function getUserTopTracks(
  accessToken: string,
  limit: number = 5,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
): Promise<any[]> {
  const url = `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${timeRange}`
  
  console.log('Fetching top tracks from:', url)
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Failed to fetch top tracks:', response.status, error)
    throw new Error(`Spotify API error: ${response.status}`)
  }

  const data = await response.json()
  return data.items || []
}

/**
 * Get user's recently played tracks from Spotify
 */
export async function getRecentlyPlayedTracks(
  accessToken: string,
  limit: number = 10
): Promise<any[]> {
  const url = `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`
  
  console.log('Fetching recently played from:', url)
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Failed to fetch recently played:', response.status, error)
    throw new Error(`Spotify API error: ${response.status}`)
  }

  const data = await response.json()
  return data.items?.map((item: any) => item.track) || []
}

/**
 * Get recommendations using artist top tracks directly
 * Simpler method that just gets popular tracks from the same artists
 */
export async function getRecommendationsFromArtistTopTracks(
  accessToken: string,
  seedTracks: any[],
  limit: number = 20
): Promise<SpotifyTrack[]> {
  console.log('🎵 Using simple recommendation method: artist top tracks')
  console.log('   Seed tracks received:', seedTracks.length)
  
  const recommendations: SpotifyTrack[] = []
  const seenTrackIds = new Set<string>()
  
  // Add seed track IDs to seen set to avoid recommending them
  seedTracks.forEach(track => {
    if (track.id) seenTrackIds.add(track.id)
  })
  
  // Extract artist IDs from seed tracks - use more for variety
  const artistIds = new Set<string>()
  seedTracks.forEach(track => {  // Use all seed tracks
    if (track.artists && Array.isArray(track.artists)) {
      track.artists.forEach((artist: any) => {
        if (artist.id) {
          artistIds.add(artist.id)
          console.log(`   Added artist: ${artist.name} (${artist.id})`)
        }
      })
    }
  })
  
  console.log(`   Found ${artistIds.size} unique artists from seed tracks`)
  
  if (artistIds.size === 0) {
    console.error('❌ No artist IDs found in seed tracks!')
    return []
  }
  
  // Shuffle artists for randomization
  const shuffledArtists = Array.from(artistIds).sort(() => 0.5 - Math.random())
  
  // For each artist, get their top tracks
  for (const artistId of shuffledArtists) {
    if (recommendations.length >= limit) break
    
    try {
      console.log(`   Fetching top tracks for artist ${artistId}...`)
      
      const topTracksUrl = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=from_token`
      const topTracksResponse = await fetch(topTracksUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!topTracksResponse.ok) {
        console.error(`   Failed to fetch top tracks: ${topTracksResponse.status}`)
        const errorText = await topTracksResponse.text()
        console.error('   Error response:', errorText)
        continue
      }
      
      const topTracksData = await topTracksResponse.json()
      const allTracks = topTracksData.tracks || []
      
      // Shuffle and take random subset for variety
      const shuffledTracks = allTracks.sort(() => 0.5 - Math.random())
      const numToTake = Math.floor(Math.random() * 3) + 2 // Random 2-4 tracks
      const tracks = shuffledTracks.slice(0, numToTake)
      
      console.log(`   ✓ Got ${allTracks.length} tracks from artist, adding ${tracks.length}`)
      
      // Add tracks to recommendations (skip ones we already have)
      let added = 0
      tracks.forEach((track: any) => {
        if (!seenTrackIds.has(track.id) && recommendations.length < limit) {
          seenTrackIds.add(track.id)
          recommendations.push(formatTrack(track))
          added++
        }
      })
      
      console.log(`   Added ${added} new tracks (total: ${recommendations.length}/${limit})`)
      
    } catch (error) {
      console.error('   Error fetching top tracks for artist:', error)
    }
  }
  
  console.log(`✅ Generated ${recommendations.length} recommendations from artist top tracks`)
  return recommendations
}

/**
 * Get recommendations using related artists and their top tracks
 * This is an alternative that works when the recommendations endpoint is not available
 * Uses Spotify's ML-powered "Related Artists" to find similar music
 */
export async function getRecommendationsFromRelatedArtists(
  accessToken: string,
  seedTracks: any[],
  limit: number = 20
): Promise<SpotifyTrack[]> {
  console.log('🎵 Using SMART recommendation method: Related Artists (Spotify ML-powered)')
  console.log('   Seed tracks received:', seedTracks.length)
  
  const recommendations: SpotifyTrack[] = []
  const seenTrackIds = new Set<string>()
  
  // Add seed track IDs to seen set to avoid recommending them
  seedTracks.forEach(track => {
    if (track.id) seenTrackIds.add(track.id)
  })
  
  // Extract artist IDs from seed tracks - use more seeds for variety
  const artistIds = new Set<string>()
  seedTracks.slice(0, 10).forEach(track => {  // Increased from 5 to 10
    if (track.artists && Array.isArray(track.artists)) {
      track.artists.forEach((artist: any) => {
        if (artist.id) {
          artistIds.add(artist.id)
          console.log(`   Added artist: ${artist.name} (${artist.id})`)
        }
      })
    }
  })
  
  console.log(`   Found ${artistIds.size} unique artists from seed tracks`)
  
  if (artistIds.size === 0) {
    console.error('❌ No artist IDs found in seed tracks!')
    return []
  }
  
  // Shuffle artists for randomization on each call
  const shuffledArtists = Array.from(artistIds).sort(() => 0.5 - Math.random())
  
  // Process more artists for better variety (up to 5 instead of 3)
  for (const artistId of shuffledArtists.slice(0, 5)) {
    if (recommendations.length >= limit) break
    
    try {
      console.log(`   Fetching related artists for ${artistId}...`)
      
      // Get related artists
      const relatedUrl = `https://api.spotify.com/v1/artists/${artistId}/related-artists`
      const relatedResponse = await fetch(relatedUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!relatedResponse.ok) {
        console.error(`   Failed to fetch related artists: ${relatedResponse.status}`)
        const errorText = await relatedResponse.text()
        console.error('   Error response:', errorText)
        continue
      }
      
      const relatedData = await relatedResponse.json()
      const allRelatedArtists = relatedData.artists || []
      
      // Shuffle related artists for randomization
      const shuffledRelated = allRelatedArtists.sort(() => 0.5 - Math.random())
      
      // Get more related artists for variety (5 instead of 3)
      const relatedArtists = shuffledRelated.slice(0, 5)
      
      console.log(`   ✓ Found ${allRelatedArtists.length} related artists, using ${relatedArtists.length}`)
      
      // For each related artist, get their top tracks
      for (const relatedArtist of relatedArtists) {
        if (recommendations.length >= limit) break
        
        try {
          console.log(`     Fetching top tracks for ${relatedArtist.name}...`)
          
          // Include market parameter from user's account
          const topTracksUrl = `https://api.spotify.com/v1/artists/${relatedArtist.id}/top-tracks?market=from_token`
          const topTracksResponse = await fetch(topTracksUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })
          
          if (!topTracksResponse.ok) {
            console.error(`     Failed to fetch top tracks: ${topTracksResponse.status}`)
            const errorText = await topTracksResponse.text()
            console.error(`     Error: ${errorText}`)
            continue
          }
          
          const topTracksData = await topTracksResponse.json()
          const allTracks = topTracksData.tracks || []
          
          // Shuffle tracks for randomization
          const shuffledTracks = allTracks.sort(() => 0.5 - Math.random())
          
          // Take 2-4 random tracks from each artist (randomized)
          const numTracksToTake = Math.floor(Math.random() * 3) + 2 // Random 2-4
          const tracks = shuffledTracks.slice(0, numTracksToTake)
          
          console.log(`     ✓ Got ${allTracks.length} tracks, adding ${tracks.length} from ${relatedArtist.name}`)
          
          // Add tracks to recommendations
          let added = 0
          tracks.forEach((track: any) => {
            if (!seenTrackIds.has(track.id) && recommendations.length < limit) {
              seenTrackIds.add(track.id)
              recommendations.push(formatTrack(track))
              added++
            }
          })
          
          console.log(`     Added ${added} new tracks (total: ${recommendations.length}/${limit})`)
          
        } catch (error) {
          console.error('     Error fetching top tracks:', error)
        }
      }
      
    } catch (error) {
      console.error('   Error fetching related artists:', error)
    }
  }
  
  console.log(`✅ Generated ${recommendations.length} recommendations from related artists`)
  
  // If we didn't get enough, try to fill with direct artist top tracks
  if (recommendations.length < limit) {
    console.log(`⚠️ Only got ${recommendations.length} recommendations, filling with artist top tracks...`)
    
    for (const artistId of shuffledArtists.slice(0, 3)) {
      if (recommendations.length >= limit) break
      
      try {
        const topTracksUrl = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=from_token`
        const response = await fetch(topTracksUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          const tracks = (data.tracks || []).sort(() => 0.5 - Math.random()).slice(0, 3)
          
          tracks.forEach((track: any) => {
            if (!seenTrackIds.has(track.id) && recommendations.length < limit) {
              seenTrackIds.add(track.id)
              recommendations.push(formatTrack(track))
            }
          })
        }
      } catch (error) {
        console.error('   Error filling with artist tracks:', error)
      }
    }
    
    console.log(`   Filled to ${recommendations.length} recommendations`)
  }
  
  return recommendations
}

/**
 * Get recommendations from Spotify based on seed tracks
 */
export async function getSpotifyRecommendations(
  accessToken: string,
  seedTracks: string[],
  options: {
    limit?: number
    minPopularity?: number
    targetEnergy?: number
    targetDanceability?: number
    targetValence?: number
  } = {}
): Promise<SpotifyTrack[]> {
  const { limit = 20, minPopularity, targetEnergy, targetDanceability, targetValence } = options

  // Ensure we have valid track IDs
  const validSeeds = seedTracks.filter(id => id && id.length > 0).slice(0, 5)
  
  if (validSeeds.length === 0) {
    throw new Error('No valid seed tracks provided')
  }

  console.log('Valid seed tracks:', validSeeds)

  // Build URL with proper encoding
  const baseUrl = 'https://api.spotify.com/v1/recommendations'
  const queryParams = new URLSearchParams()
  
  // Add seed_tracks as comma-separated string (not encoded)
  queryParams.set('seed_tracks', validSeeds.join(','))
  queryParams.set('limit', limit.toString())

  if (minPopularity !== undefined) {
    queryParams.set('min_popularity', minPopularity.toString())
  }
  if (targetEnergy !== undefined) {
    queryParams.set('target_energy', targetEnergy.toString())
  }
  if (targetDanceability !== undefined) {
    queryParams.set('target_danceability', targetDanceability.toString())
  }
  if (targetValence !== undefined) {
    queryParams.set('target_valence', targetValence.toString())
  }

  // Manually construct URL to avoid comma encoding
  const seedParam = `seed_tracks=${validSeeds.join(',')}`
  const limitParam = `limit=${limit}`
  const marketParam = 'market=US' // Add market parameter (required by some Spotify apps)
  
  const otherParams = [limitParam, marketParam]
  
  if (minPopularity !== undefined) {
    otherParams.push(`min_popularity=${minPopularity}`)
  }
  if (targetEnergy !== undefined) {
    otherParams.push(`target_energy=${targetEnergy}`)
  }
  if (targetDanceability !== undefined) {
    otherParams.push(`target_danceability=${targetDanceability}`)
  }
  if (targetValence !== undefined) {
    otherParams.push(`target_valence=${targetValence}`)
  }
  
  const url = `${baseUrl}?${seedParam}&${otherParams.join('&')}`
  
  console.log('Full recommendations URL:', url)
  console.log('Authorization token (first 20 chars):', accessToken.substring(0, 20))
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Failed to fetch recommendations:', response.status, error)
    console.error('Full URL that failed:', url)
    throw new Error(`Spotify recommendations API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const tracks = data.tracks || []

  // Transform to simplified format
  return tracks.map((track: any) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist: any) => artist.name),
    album: track.album.name,
    preview_url: track.preview_url,
    external_url: track.external_urls.spotify,
    image: track.album.images[0]?.url || null,
  }))
}

/**
 * Format track data for display
 */
export function formatTrack(track: any): SpotifyTrack {
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist: any) => artist.name),
    album: track.album.name,
    preview_url: track.preview_url,
    external_url: track.external_urls.spotify,
    spotify_url: track.external_urls.spotify,
    image: track.album.images[0]?.url || null,
  }
}

/**
 * SYNC FUNCTIONS - Fetch user's Spotify data
 */

/**
 * Get user's top tracks from Spotify (long term)
 */
export async function fetchUserTopTracks(
  accessToken: string,
  limit: number = 100
): Promise<any[]> {
  // Spotify API limits to 50 items per request
  const maxPerRequest = 50
  const allTracks: any[] = []
  
  // If requesting more than 50, we need to make multiple requests
  if (limit > maxPerRequest) {
    // First batch: 50 tracks
    const url1 = `https://api.spotify.com/v1/me/top/tracks?limit=${maxPerRequest}&time_range=long_term`
    const response1 = await fetch(url1, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    
    if (!response1.ok) {
      const errorText = await response1.text()
      console.error('Failed to fetch top tracks (batch 1):', response1.status, errorText)
      throw new Error(`Failed to fetch top tracks: ${response1.status}`)
    }
    
    const data1 = await response1.json()
    allTracks.push(...(data1.items || []))
    
    // Second batch: remaining tracks (up to 50 more)
    const remaining = Math.min(limit - maxPerRequest, maxPerRequest)
    if (remaining > 0) {
      const url2 = `https://api.spotify.com/v1/me/top/tracks?limit=${remaining}&time_range=long_term&offset=${maxPerRequest}`
      const response2 = await fetch(url2, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response2.ok) {
        const data2 = await response2.json()
        allTracks.push(...(data2.items || []))
      }
    }
    
    console.log(`✓ Fetched ${allTracks.length} top tracks from Spotify`)
    return allTracks
  } else {
    // Single request for 50 or fewer tracks
    const url = `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=long_term`
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to fetch top tracks:', response.status, errorText)
      throw new Error(`Failed to fetch top tracks: ${response.status}`)
    }

    const data = await response.json()
    const tracks = data.items || []
    console.log(`✓ Fetched ${tracks.length} top tracks from Spotify`)
    return tracks
  }
}

/**
 * Get user's top artists from Spotify (long term)
 */
export async function fetchUserTopArtists(
  accessToken: string,
  limit: number = 50
): Promise<SpotifyArtist[]> {
  const url = `https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=long_term`
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch top artists: ${response.status}`)
  }

  const data = await response.json()
  const artists = data.items || []

  return artists.map((artist: any) => ({
    id: artist.id,
    name: artist.name,
    image: artist.images[0]?.url || null,
  }))
}

/**
 * Get user's playlists from Spotify
 */
export async function fetchUserPlaylists(
  accessToken: string,
  limit: number = 50
): Promise<SpotifyPlaylist[]> {
  const url = `https://api.spotify.com/v1/me/playlists?limit=${limit}`
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch playlists: ${response.status}`)
  }

  const data = await response.json()
  const playlists = data.items || []

  return playlists.map((playlist: any) => ({
    id: playlist.id,
    name: playlist.name,
    owner: playlist.owner.display_name || playlist.owner.id,
    total_tracks: playlist.tracks.total,
    image: playlist.images[0]?.url || null,
  }))
}

/**
 * RECOMMENDATION FUNCTIONS - Get recommendations based on different modes
 */

/**
 * Get recommendations based on user's top tracks and artists (General mode)
 */
export async function getGeneralRecommendations(
  accessToken: string,
  topTrackIds: string[],
  topArtistIds: string[],
  limit: number = 20
): Promise<SpotifyTrack[]> {
  // Validate and filter IDs
  const validTrackIds = topTrackIds.filter(id => id && id.length === 22 && /^[a-zA-Z0-9]+$/.test(id))
  const validArtistIds = topArtistIds.filter(id => id && id.length === 22 && /^[a-zA-Z0-9]+$/.test(id))
  
  console.log('Validating seeds:', {
    tracks: `${validTrackIds.length}/${topTrackIds.length}`,
    artists: `${validArtistIds.length}/${topArtistIds.length}`
  })
  
  if (validTrackIds.length === 0 && validArtistIds.length === 0) {
    throw new Error('No valid track or artist IDs available for recommendations')
  }
  
  // Randomly shuffle and pick seeds for more variety
  // Spotify allows max 5 seeds total (tracks + artists combined)
  const shuffledTracks = [...validTrackIds].sort(() => 0.5 - Math.random())
  const shuffledArtists = [...validArtistIds].sort(() => 0.5 - Math.random())
  
  // Use 3 tracks and 2 artists for good variety
  const seedTracks = shuffledTracks.slice(0, 3)
  const seedArtists = shuffledArtists.slice(0, 2)

  const params = new URLSearchParams({
    limit: limit.toString(),
  })

  if (seedTracks.length > 0) {
    params.set('seed_tracks', seedTracks.join(','))
  }
  if (seedArtists.length > 0) {
    params.set('seed_artists', seedArtists.join(','))
  }

  const url = `https://api.spotify.com/v1/recommendations?${params.toString()}`
  
  console.log('🎵 Calling Spotify Recommendations API (General mode)')
  console.log('   URL:', url)
  console.log('   Seeds:', {
    trackCount: seedTracks.length,
    artistCount: seedArtists.length,
    trackIds: seedTracks,
    artistIds: seedArtists
  })
  
  const response = await fetch(url, {
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Spotify recommendations API error (General mode)')
    console.error('   Status:', response.status)
    console.error('   Status Text:', response.statusText)
    console.error('   Error body:', errorText)
    console.error('   Full URL:', url)
    
    // Try to parse error as JSON for more details
    try {
      const errorJson = JSON.parse(errorText)
      console.error('   Parsed error:', errorJson)
      
      // Check for specific error types
      if (errorJson.error?.message?.includes('invalid id')) {
        console.error('   ⚠️ Invalid seed ID detected!')
        console.error('   Track seeds:', seedTracks)
        console.error('   Artist seeds:', seedArtists)
      }
    } catch (e) {
      // Error wasn't JSON, that's fine
    }
    
    throw new Error(`Failed to get general recommendations: ${response.status}`)
  }

  const data = await response.json()
  console.log(`✅ Received ${data.tracks?.length || 0} recommendations from Spotify API`)
  
  return (data.tracks || []).map(formatTrack)
}

/**
 * Get playlist tracks
 */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit: number = 100
): Promise<string[]> {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}`
  
  console.log('Fetching playlist tracks from:', url)
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Fetch playlist tracks error:', response.status, errorText)
    throw new Error(`Failed to fetch playlist tracks: ${response.status}`)
  }

  const data = await response.json()
  const items = data.items || []
  
  const trackIds = items
    .filter((item: any) => {
      // Filter out local files and invalid tracks
      if (!item.track) return false
      if (!item.track.id) return false
      if (item.track.is_local) return false
      if (!item.track.uri || !item.track.uri.startsWith('spotify:track:')) return false
      return true
    })
    .map((item: any) => item.track.id)
  
  console.log(`✓ Found ${trackIds.length} valid Spotify tracks in playlist (filtered out local/invalid tracks)`)
  
  return trackIds
}

/**
 * Test if Spotify Recommendations API is available for this account
 * Returns true if API works, false if 404
 */
export async function testRecommendationsAPI(accessToken: string): Promise<boolean> {
  // Use a well-known track as seed (Bohemian Rhapsody by Queen)
  const testTrackId = '4u7EnebtmKWzUH433cf5Qv'
  
  const url = `https://api.spotify.com/v1/recommendations?seed_tracks=${testTrackId}&limit=1`
  
  console.log('🧪 Testing Spotify Recommendations API availability...')
  
  try {
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.status === 404) {
      console.log('❌ Recommendations API returned 404 - API not available for this account')
      return false
    }

    if (!response.ok) {
      console.log('⚠️ Recommendations API error:', response.status, response.statusText)
      return false
    }

    const data = await response.json()
    console.log('✅ Recommendations API is working! Received', data.tracks?.length, 'test recommendations')
    return true
  } catch (error) {
    console.error('❌ Error testing Recommendations API:', error)
    return false
  }
}

/**
 * Get recommendations based on playlist tracks (Playlist mode)
 */
export async function getPlaylistRecommendations(
  accessToken: string,
  playlistId: string,
  limit: number = 20
): Promise<SpotifyTrack[]> {
  console.log('Getting playlist recommendations for playlist:', playlistId)
  
  // Fetch tracks from the playlist
  const trackIds = await getPlaylistTracks(accessToken, playlistId, 50)
  
  if (trackIds.length === 0) {
    throw new Error('No valid Spotify tracks found in playlist (may contain only local files)')
  }

  // Randomly select up to 5 track IDs for variety
  const shuffled = trackIds.sort(() => 0.5 - Math.random())
  const seedTracks = shuffled.slice(0, 5)

  // Validate seed tracks (should be 22-character alphanumeric IDs)
  const validSeeds = seedTracks.filter(id => id && id.length === 22 && /^[a-zA-Z0-9]+$/.test(id))
  
  if (validSeeds.length === 0) {
    throw new Error('No valid track IDs found for recommendations')
  }

  console.log('🎵 Calling Spotify Recommendations API (Playlist mode)')
  console.log('   Valid seed tracks:', validSeeds.length, '/', seedTracks.length)
  console.log('   Track IDs:', validSeeds)

  const url = `https://api.spotify.com/v1/recommendations?seed_tracks=${validSeeds.join(',')}&limit=${limit}`
  
  console.log('   Full URL:', url)
  
  const response = await fetch(url, {
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Spotify playlist recommendations error')
    console.error('   Status:', response.status)
    console.error('   Status Text:', response.statusText)
    console.error('   Error body:', errorText)
    console.error('   Full URL:', url)
    console.error('   Seed tracks used:', validSeeds)
    
    // Try to parse error as JSON for more details
    try {
      const errorJson = JSON.parse(errorText)
      console.error('   Parsed error:', errorJson)
      
      // Check if error message indicates invalid seeds
      if (errorJson.error?.message?.includes('invalid id')) {
        console.error('   ⚠️ Invalid track ID detected in seeds!')
      }
    } catch (e) {
      // Error wasn't JSON
    }
    
    throw new Error(`Failed to get playlist recommendations: ${response.status}`)
  }

  const data = await response.json()
  console.log(`✅ Received ${data.tracks?.length || 0} recommendations from Spotify API`)
  
  return (data.tracks || []).map(formatTrack)
}

/**
 * Search for an artist by name
 */
export async function searchArtist(
  accessToken: string,
  artistName: string
): Promise<string | null> {
  const url = `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(artistName)}&limit=1`
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    throw new Error(`Failed to search for artist: ${response.status}`)
  }

  const data = await response.json()
  const artists = data.artists?.items || []
  
  return artists.length > 0 ? artists[0].id : null
}

/**
 * Get recommendations based on an artist (Artist mode)
 */
export async function getArtistRecommendations(
  accessToken: string,
  artistId: string,
  limit: number = 20
): Promise<SpotifyTrack[]> {
  console.log('Getting artist recommendations for artist:', artistId)
  
  const url = `https://api.spotify.com/v1/recommendations?seed_artists=${artistId}&limit=${limit}`
  
  console.log('Calling Spotify recommendations API for artist')
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Spotify artist recommendations error:', response.status, errorText)
    console.error('Full URL that failed:', url)
    throw new Error(`Failed to get artist recommendations: ${response.status}`)
  }

  const data = await response.json()
  console.log(`✓ Received ${data.tracks?.length || 0} recommendations from Spotify`)
  
  return (data.tracks || []).map(formatTrack)
}
