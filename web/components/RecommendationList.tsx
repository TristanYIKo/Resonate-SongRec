'use client'

interface Recommendation {
  spotify_track_id: string
  score: number
  name?: string
  artist?: string
}

interface RecommendationListProps {
  recommendations: Recommendation[]
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  const openSpotifyTrack = (trackId: string) => {
    window.open(`https://open.spotify.com/track/${trackId}`, '_blank')
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Your Recommendations</h2>
      
      {recommendations.length === 0 ? (
        <p className="text-gray-400">No recommendations yet. Click "Get Recommendations" to generate some!</p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div 
              key={`${rec.spotify_track_id}-${index}`}
              className="flex items-center justify-between bg-gray-800 hover:bg-gray-750 p-4 rounded-lg transition-colors cursor-pointer"
              onClick={() => openSpotifyTrack(rec.spotify_track_id)}
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="text-2xl font-bold text-gray-600">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">
                    {rec.name || rec.spotify_track_id}
                  </p>
                  {rec.artist && (
                    <p className="text-sm text-gray-400">{rec.artist}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Match Score</p>
                  <p className="text-lg font-bold text-spotify-green">
                    {(rec.score * 100).toFixed(0)}%
                  </p>
                </div>
                <button 
                  className="bg-spotify-green hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    openSpotifyTrack(rec.spotify_track_id)
                  }}
                >
                  Play on Spotify
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
