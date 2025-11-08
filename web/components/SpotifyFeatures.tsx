'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Music, Disc3, User, Search, RefreshCw, Loader2, Play, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

interface Track {
  id: string
  name: string
  artists: string[]
  album: string
  image: string | null
  spotify_url: string
}

interface Playlist {
  id: string
  name: string
  owner: string
  total_tracks: number
  image: string | null
}

interface Artist {
  id: string
  name: string
  image: string | null
}

export default function SpotifyFeatures() {
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [recommendations, setRecommendations] = useState<Track[]>([])
  const [mode, setMode] = useState<'general' | 'playlist' | 'artist'>('general')
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')
  const [playlistSearch, setPlaylistSearch] = useState('')
  const [artistSearch, setArtistSearch] = useState('')
  const [artistResults, setArtistResults] = useState<Artist[]>([])
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [showArtistDropdown, setShowArtistDropdown] = useState(false)
  const [searchingArtists, setSearchingArtists] = useState(false)
  const artistSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Fetch playlists when playlist mode is selected
  useEffect(() => {
    if (mode === 'playlist' && playlists.length === 0) {
      fetchPlaylists()
    }
  }, [mode])

  // Close artist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowArtistDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced artist search
  const searchArtists = useCallback(async (query: string) => {
    if (!query.trim()) {
      setArtistResults([])
      setShowArtistDropdown(false)
      return
    }

    setSearchingArtists(true)
    
    try {
      const response = await fetch(`/api/spotify/search-artist?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok) {
        setArtistResults(data || [])
        setShowArtistDropdown(true)
      } else {
        console.error('Artist search error:', data.error)
        setArtistResults([])
      }
    } catch (error) {
      console.error('Artist search failed:', error)
      setArtistResults([])
    } finally {
      setSearchingArtists(false)
    }
  }, [])

  // Handle artist search input with debounce
  const handleArtistSearchChange = (value: string) => {
    setArtistSearch(value)
    
    // Clear timeout if exists
    if (artistSearchTimeoutRef.current) {
      clearTimeout(artistSearchTimeoutRef.current)
    }

    // Set new timeout for debounced search
    artistSearchTimeoutRef.current = setTimeout(() => {
      searchArtists(value)
    }, 300)
  }

  const selectArtist = (artist: Artist) => {
    setSelectedArtist(artist)
    setArtistSearch(artist.name)
    setShowArtistDropdown(false)
    setArtistResults([])
  }

  const fetchPlaylists = async () => {
    setLoadingPlaylists(true)
    try {
      const response = await fetch('/api/spotify/playlists')
      const data = await response.json()

      if (response.ok) {
        setPlaylists(data.playlists || [])
        if (data.playlists.length === 0) {
          toast({
            title: 'No playlists found',
            description: 'Your library appears to be empty.',
          })
        }
      } else {
        toast({
          title: 'Error loading playlists',
          description: data.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Fetch playlists error:', error)
      toast({
        title: 'Failed to load playlists',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    
    try {
      const response = await fetch('/api/spotify/sync', { method: 'POST' })
      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Sync successful',
          description: `Synced ${data.stats.top_tracks} tracks, ${data.stats.top_artists} artists, and ${data.stats.playlists} playlists.`,
        })
      } else {
        toast({
          title: 'Sync failed',
          description: data.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast({
        title: 'Sync failed',
        description: 'Unable to sync with Spotify. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleGetRecommendations = async () => {
    setLoading(true)
    setRecommendations([])
    
    try {
      let url = `/api/spotify/recommendations?mode=${mode}`
      
      if (mode === 'playlist') {
        if (!selectedPlaylistId) {
          toast({
            title: 'No playlist selected',
            description: 'Please select a playlist first.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
        url += `&playlist_id=${selectedPlaylistId}`
      } else if (mode === 'artist') {
        if (!selectedArtist) {
          toast({
            title: 'No artist selected',
            description: 'Please search and select an artist.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
        url += `&artist_id=${selectedArtist.id}`
      }

      console.log('Fetching recommendations from:', url)
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        // All modes now return an array of tracks
        setRecommendations(data)
        
        if (mode === 'artist') {
          toast({
            title: 'Songs found',
            description: `Found ${data.length} songs from ${selectedArtist?.name}.`,
          })
        } else {
          toast({
            title: 'Recommendations ready',
            description: `Found ${data.length} songs you might like.`,
          })
        }
      } else {
        console.error('Recommendations error response:', data)
        
        // Show more detailed error message
        if (data.message) {
          toast({
            title: data.error || 'Error',
            description: data.message,
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Failed to get recommendations',
            description: data.error || 'Please try again later.',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      console.error('Recommendations error:', error)
      toast({
        title: 'Failed to get recommendations',
        description: 'Unable to fetch recommendations. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPlaylists = playlists.filter(p => 
    playlistSearch === '' || 
    p.name.toLowerCase().includes(playlistSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Spotify Data
          </CardTitle>
          <CardDescription>
            Pull your latest listening data from Spotify to improve recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleSync} 
            disabled={syncing}
            className="w-full sm:w-auto"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync My Spotify
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Get Recommendations
          </CardTitle>
          <CardDescription>
            Discover new music based on your taste and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">
                <Music className="mr-2 h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="playlist">
                <Disc3 className="mr-2 h-4 w-4" />
                Playlist
              </TabsTrigger>
              <TabsTrigger value="artist">
                <User className="mr-2 h-4 w-4" />
                Artist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get personalized recommendations based on your overall listening history.
              </p>
              <Button 
                onClick={handleGetRecommendations} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding songs...
                  </>
                ) : (
                  'Get Recommendations'
                )}
              </Button>
            </TabsContent>

            <TabsContent value="playlist" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlist-search">Select a Playlist</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="playlist-search"
                    type="text"
                    placeholder="Search playlists..."
                    value={playlistSearch}
                    onChange={(e) => setPlaylistSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {loadingPlaylists ? (
                  <div className="space-y-2 p-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredPlaylists.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="mb-2">No playlists found</p>
                    <Button variant="ghost" size="sm" onClick={fetchPlaylists}>
                      Refresh
                    </Button>
                  </div>
                ) : (
                  filteredPlaylists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => setSelectedPlaylistId(playlist.id)}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors ${
                        selectedPlaylistId === playlist.id ? 'bg-accent' : ''
                      }`}
                    >
                      {playlist.image ? (
                        <img
                          src={playlist.image}
                          alt={playlist.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Disc3 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm line-clamp-1">{playlist.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {playlist.owner} · {playlist.total_tracks} tracks
                        </p>
                      </div>
                      {selectedPlaylistId === playlist.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))
                )}
              </div>

              <Button 
                onClick={handleGetRecommendations} 
                disabled={loading || !selectedPlaylistId}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding songs...
                  </>
                ) : (
                  'Get Recommendations'
                )}
              </Button>
            </TabsContent>

            <TabsContent value="artist" className="space-y-4">
              <div className="space-y-2 relative" ref={dropdownRef}>
                <Label htmlFor="artist-search">Search for an Artist</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="artist-search"
                    type="text"
                    placeholder="Search for an artist..."
                    value={artistSearch}
                    onChange={(e) => handleArtistSearchChange(e.target.value)}
                    onFocus={() => {
                      if (artistResults.length > 0) {
                        setShowArtistDropdown(true)
                      }
                    }}
                    className="pl-9"
                  />
                  {searchingArtists && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showArtistDropdown && artistResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {artistResults.map((artist) => (
                      <button
                        key={artist.id}
                        onClick={() => selectArtist(artist)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 transition-colors text-left"
                      >
                        {artist.image ? (
                          <img 
                            src={artist.image} 
                            alt={artist.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">{artist.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Artist Display */}
                {selectedArtist && (
                  <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-md">
                    {selectedArtist.image ? (
                      <img 
                        src={selectedArtist.image} 
                        alt={selectedArtist.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-teal-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{selectedArtist.name}</p>
                      <p className="text-xs text-gray-600">Selected artist</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedArtist(null)
                        setArtistSearch('')
                      }}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleGetRecommendations} 
                disabled={loading || !selectedArtist}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding songs...
                  </>
                ) : (
                  'Get Song Recommendations'
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-48 w-full rounded-md" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Show track recommendations for general/playlist modes */}
      {!loading && recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">
            {mode === 'artist' 
              ? `Songs by ${selectedArtist?.name} (${recommendations.length} tracks)` 
              : `Recommended for you (${recommendations.length} songs)`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommendations.map((track) => (
              <Card key={track.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  {track.image ? (
                    <img
                      src={track.image}
                      alt={track.album}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <Music className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <h4 className="font-semibold line-clamp-1 mb-1">{track.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                    {track.artists.join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {track.album}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    asChild
                    variant="default"
                    className="w-full"
                    size="sm"
                  >
                    <a
                      href={track.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Play className="mr-2 h-3 w-3" fill="currentColor" />
                      Play on Spotify
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
