# Backend API - Music Recommender

FastAPI backend service for ML-powered music recommendations.

## Quick Start

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Visit `http://localhost:8000` for API docs at `/docs`

## Environment Variables

Create a `.env` file with:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## API Endpoints

- `GET /` - Health check
- `GET /recommend?user_id={id}` - Generate recommendations
- `GET /health` - Detailed health check with config validation

## Development

The server will auto-reload on code changes with the `--reload` flag.

## Deployment

Deploy to any Python hosting service (Railway, Render, Heroku, etc.):

1. Ensure `requirements.txt` is up to date
2. Set environment variables in hosting dashboard
3. Use start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Algorithm

The recommendation engine uses:
- Cosine similarity for feature matching
- StandardScaler for tempo normalization
- User profile vector (average of listening history)
- Audio features: danceability, energy, valence, tempo, acousticness
