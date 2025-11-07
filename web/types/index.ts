export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  album: string
  danceability: number | null
  energy: number | null
  valence: number | null
  tempo: number | null
  acousticness: number | null
}

export interface UserTrack extends SpotifyTrack {
  user_id: string
  spotify_track_id: string
  created_at: string
}

export interface Recommendation {
  spotify_track_id: string
  score: number
  name?: string
  artist?: string
  album?: string
}

export interface UserProfile {
  user_id: string
  spotify_id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface SpotifyTokens {
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  scope: string | null
  updated_at: string
}

export interface SyncResponse {
  success: boolean
  trackCount: number
  error?: string
}

export interface RecommendationResponse {
  user_id: string
  recommendations: Recommendation[]
  count: number
}
