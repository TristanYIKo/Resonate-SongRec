'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import RecommendationList from '@/components/RecommendationList'

interface Recommendation {
  spotify_track_id: string
  score: number
  name?: string
  artist?: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        scopes: 'user-read-email user-top-read user-read-recently-played',
        redirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      console.error('Login error:', error)
      setMessage('Failed to login with Spotify')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setRecommendations([])
    setMessage('')
  }

  const handleSyncSpotify = async () => {
    if (!user) return

    setSyncing(true)
    setMessage('Syncing your Spotify data...')

    try {
      const response = await fetch('/api/sync-spotify', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Successfully synced ${data.trackCount} tracks!`)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Sync error:', error)
      setMessage('Failed to sync Spotify data')
    } finally {
      setSyncing(false)
    }
  }

  const handleGetRecommendations = async () => {
    if (!user) return

    setRecommendationLoading(true)
    setMessage('Generating recommendations...')

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/recommend?user_id=${user.id}`)

      const data = await response.json()

      if (response.ok) {
        setRecommendations(data.recommendations || [])
        setMessage(`Generated ${data.recommendations?.length || 0} recommendations!`)
      } else {
        setMessage(`Error: ${data.detail || 'Failed to get recommendations'}`)
      }
    } catch (error) {
      console.error('Recommendation error:', error)
      setMessage('Failed to connect to recommendation service. Is the backend running?')
    } finally {
      setRecommendationLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-bold mb-6">
            Music Recommender
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Get personalized music recommendations based on your Spotify listening history
          </p>
          <button
            onClick={handleLogin}
            className="bg-spotify-green hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors"
          >
            Login with Spotify
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Welcome, {user.user_metadata?.full_name || user.email}!
        </h1>
        <p className="text-gray-400">
          Sync your Spotify data and get personalized recommendations
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 mb-8">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleSyncSpotify}
            disabled={syncing}
            className="bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync My Spotify'}
          </button>
          
          <button
            onClick={handleGetRecommendations}
            disabled={recommendationLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {recommendationLoading ? 'Loading...' : 'Get Recommendations'}
          </button>

          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors ml-auto"
          >
            Logout
          </button>
        </div>

        {message && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <RecommendationList recommendations={recommendations} />
      )}
    </div>
  )
}
