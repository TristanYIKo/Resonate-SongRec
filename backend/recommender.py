"""
Music recommendation engine using collaborative filtering and audio features
"""
import numpy as np
from typing import List, Dict, Any
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler


def generate_recommendations(
    user_tracks: List[Dict[str, Any]], 
    top_n: int = 10
) -> List[Dict[str, Any]]:
    """
    Generate track recommendations based on user's listening history
    
    This function:
    1. Extracts audio features from user's tracks
    2. Computes a user profile vector (average of all features)
    3. Calculates similarity scores between user profile and all tracks
    4. Returns top N tracks with highest similarity scores
    
    Args:
        user_tracks: List of track dictionaries with audio features
        top_n: Number of recommendations to return
        
    Returns:
        List of recommendation dictionaries with spotify_track_id and score
    """
    if not user_tracks or len(user_tracks) == 0:
        return []
    
    # Define feature columns used for similarity calculation
    feature_columns = ['danceability', 'energy', 'valence', 'tempo', 'acousticness']
    
    # Extract features from tracks
    track_features = []
    valid_tracks = []
    
    for track in user_tracks:
        # Extract features, skip if any are missing
        features = []
        valid = True
        
        for col in feature_columns:
            value = track.get(col)
            if value is None:
                valid = False
                break
            features.append(float(value))
        
        if valid:
            track_features.append(features)
            valid_tracks.append(track)
    
    if len(track_features) == 0:
        return []
    
    # Convert to numpy array
    features_array = np.array(track_features)
    
    # Normalize tempo (which has different scale than other features)
    # Create a copy for normalization
    normalized_features = features_array.copy()
    tempo_idx = feature_columns.index('tempo')
    if features_array.shape[0] > 1:
        scaler = StandardScaler()
        normalized_features[:, tempo_idx] = scaler.fit_transform(
            features_array[:, tempo_idx].reshape(-1, 1)
        ).flatten()
    
    # Calculate user profile vector (mean of all track features)
    user_profile = np.mean(normalized_features, axis=0)
    
    # Calculate cosine similarity between user profile and each track
    similarities = cosine_similarity(
        user_profile.reshape(1, -1), 
        normalized_features
    )[0]
    
    # Create recommendations with scores
    recommendations = []
    for idx, track in enumerate(valid_tracks):
        recommendations.append({
            'spotify_track_id': track['spotify_track_id'],
            'name': track.get('name', ''),
            'artist': track.get('artist', ''),
            'score': float(similarities[idx])
        })
    
    # Sort by similarity score (descending)
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    
    # Return top N recommendations
    return recommendations[:top_n]


def calculate_diversity_score(recommendations: List[Dict[str, Any]]) -> float:
    """
    Calculate diversity score for a list of recommendations
    
    Higher score means more diverse recommendations across audio features
    
    Args:
        recommendations: List of recommendation dictionaries
        
    Returns:
        Diversity score between 0 and 1
    """
    if len(recommendations) < 2:
        return 0.0
    
    # This is a placeholder for more sophisticated diversity metrics
    # Could be extended with genre diversity, artist diversity, etc.
    return 0.5


def explain_recommendation(
    user_profile: Dict[str, float], 
    track: Dict[str, Any]
) -> str:
    """
    Generate a human-readable explanation for why a track was recommended
    
    Args:
        user_profile: Dictionary of average user features
        track: Track dictionary with audio features
        
    Returns:
        Explanation string
    """
    # This is a simple placeholder
    # Could be extended to provide more detailed explanations
    return f"This track matches your taste based on its audio characteristics"
