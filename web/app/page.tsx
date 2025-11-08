'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { Music, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SpotifyFeatures from '@/components/SpotifyFeatures'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
        scopes: 'user-read-email user-top-read user-read-recently-played playlist-read-private playlist-read-collaborative',
        redirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      console.error('Login error:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-2xl space-y-6">
          <div className="flex justify-center">
            <Music className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Resonate
          </h1>
          <p className="text-xl text-gray-200">
            Discover personalized music recommendations powered by your Spotify listening history
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            className="text-lg px-8 py-6"
          >
            Connect with Spotify
          </Button>
          <p className="text-sm text-gray-300">
            Sign in securely with your Spotify account
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">
          Discover Music
        </h1>
        <p className="text-gray-200">
          Find new songs tailored to your unique taste
        </p>
      </div>

      {/* Spotify Features Component */}
      <SpotifyFeatures />
    </div>
  )
}
