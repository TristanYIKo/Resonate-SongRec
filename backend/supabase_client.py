"""
Supabase REST API client for backend service
"""
import os
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime


class SupabaseClient:
    """Client for interacting with Supabase REST API"""
    
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.url or not self.service_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment"
            )
        
        self.headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    
    def query(
        self, 
        table: str, 
        select: str = "*", 
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Query a Supabase table
        
        Args:
            table: Table name
            select: Columns to select (default: all)
            filters: Dictionary of filter conditions (eq, gt, lt, etc.)
            
        Returns:
            List of rows as dictionaries
        """
        url = f"{self.url}/rest/v1/{table}"
        params = {"select": select}
        
        # Add filters to query string
        if filters:
            for key, value in filters.items():
                params[key] = value
        
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        
        return response.json()
    
    def insert(
        self, 
        table: str, 
        data: List[Dict[str, Any]] | Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Insert rows into a Supabase table
        
        Args:
            table: Table name
            data: Dictionary or list of dictionaries to insert
            
        Returns:
            List of inserted rows
        """
        url = f"{self.url}/rest/v1/{table}"
        
        # Ensure data is a list
        if isinstance(data, dict):
            data = [data]
        
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        
        return response.json()
    
    def upsert(
        self, 
        table: str, 
        data: List[Dict[str, Any]] | Dict[str, Any],
        on_conflict: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Upsert rows into a Supabase table
        
        Args:
            table: Table name
            data: Dictionary or list of dictionaries to upsert
            on_conflict: Columns to use for conflict resolution
            
        Returns:
            List of upserted rows
        """
        url = f"{self.url}/rest/v1/{table}"
        
        # Ensure data is a list
        if isinstance(data, dict):
            data = [data]
        
        headers = self.headers.copy()
        headers["Prefer"] = "resolution=merge-duplicates"
        
        if on_conflict:
            headers["Prefer"] += f",on_conflict={on_conflict}"
        
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        return response.json()


# Global client instance
_client: Optional[SupabaseClient] = None


def get_client() -> SupabaseClient:
    """Get or create Supabase client singleton"""
    global _client
    if _client is None:
        _client = SupabaseClient()
    return _client


def get_user_tracks(user_id: str) -> List[Dict[str, Any]]:
    """
    Fetch all tracks for a user from Supabase
    
    Args:
        user_id: Supabase user ID
        
    Returns:
        List of track dictionaries with audio features
    """
    client = get_client()
    
    tracks = client.query(
        table="user_tracks",
        select="*",
        filters={"user_id": f"eq.{user_id}"}
    )
    
    return tracks


def save_recommendations(
    user_id: str, 
    recommendations: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Save recommendations to Supabase
    
    Args:
        user_id: Supabase user ID
        recommendations: List of recommendation dictionaries
        
    Returns:
        List of inserted recommendation records
    """
    client = get_client()
    
    # Prepare data for insertion
    records = []
    for rec in recommendations:
        records.append({
            "user_id": user_id,
            "spotify_track_id": rec["spotify_track_id"],
            "score": rec["score"],
            "created_at": datetime.utcnow().isoformat()
        })
    
    # Insert recommendations
    result = client.insert(table="recommendations", data=records)
    
    return result


def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch user profile from Supabase
    
    Args:
        user_id: Supabase user ID
        
    Returns:
        User profile dictionary or None
    """
    client = get_client()
    
    profiles = client.query(
        table="profiles",
        select="*",
        filters={"user_id": f"eq.{user_id}"}
    )
    
    return profiles[0] if profiles else None
