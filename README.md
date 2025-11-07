# Music Recommender - Full Stack Web App

A full-stack music recommendation web application that uses Spotify data and machine learning to generate personalized track recommendations.

## 🎵 Features

- **Spotify OAuth Authentication** via Supabase
- **Sync Spotify Listening History** - Fetch your top tracks and audio features
- **ML-Powered Recommendations** - Get personalized recommendations based on your music taste
- **Modern UI** - Built with Next.js and Tailwind CSS
- **Scalable Architecture** - Separate frontend and backend services

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** (TypeScript, App Router)
- **Tailwind CSS** for styling
- **Supabase Auth** for authentication
- **Supabase JS Client** for database access

### Backend
- **FastAPI** (Python) for ML/recommendation service
- **scikit-learn** for similarity calculations
- **NumPy** for numerical operations

### Database & Auth
- **Supabase** (PostgreSQL)
- **Spotify OAuth** integration

## 📁 Project Structure

```
music-recommender/
├── web/                          # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── sync-spotify/route.ts
│   │       └── me/route.ts
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   └── serverSupabase.ts
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── RecommendationList.tsx
│   └── package.json
│
├── backend/                      # Python FastAPI service
│   ├── main.py
│   ├── recommender.py
│   ├── supabase_client.py
│   └── requirements.txt
│
└── database/
    └── schema.sql               # Supabase database schema
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.9+
- Supabase account
- Spotify Developer account

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable Spotify OAuth provider in Authentication > Providers
3. Run the SQL schema in `database/schema.sql` in the Supabase SQL Editor
4. Get your project URL and keys from Settings > API

### 2. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `https://[your-project].supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret
5. Add these to Supabase Spotify OAuth settings

### 3. Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your values:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SPOTIFY_CLIENT_ID
# - SPOTIFY_CLIENT_SECRET
# - NEXT_PUBLIC_BACKEND_URL

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your values:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY

# Run FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at `http://localhost:8000`

## 🔧 Usage

1. **Login**: Click "Login with Spotify" on the homepage
2. **Sync Data**: Click "Sync My Spotify" to fetch your top tracks
3. **Get Recommendations**: Click "Get Recommendations" to generate personalized suggestions
4. **Explore**: Click on any recommendation to open it in Spotify

## 📊 How It Works

### Recommendation Algorithm

1. **Data Collection**: Fetches user's top 50 tracks from Spotify API
2. **Feature Extraction**: Retrieves audio features (danceability, energy, valence, tempo, acousticness)
3. **User Profile**: Calculates average feature vector from user's tracks
4. **Similarity Calculation**: Uses cosine similarity to find tracks matching user preferences
5. **Ranking**: Returns top 10 tracks with highest similarity scores

### Data Flow

```
User Login (Spotify OAuth)
    ↓
Store tokens in Supabase
    ↓
Sync: Fetch tracks from Spotify API → Store in Supabase
    ↓
Recommend: Backend reads tracks → ML algorithm → Returns recommendations
    ↓
Display results in UI
```

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd web
vercel deploy
```

Add environment variables in Vercel dashboard.

### Backend (Railway/Render/etc)

Deploy the `backend` folder to your Python hosting service. Ensure environment variables are set.

## 📝 Environment Variables

### Frontend (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SPOTIFY_CLIENT_ID` - Spotify app client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify app client secret
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (e.g., http://localhost:8000)

### Backend (.env)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin access)

## 🔐 Security Notes

- Never commit `.env` or `.env.local` files
- Use service role key only in backend (never expose to frontend)
- Spotify tokens are automatically refreshed when expired
- Row Level Security (RLS) is enabled on all Supabase tables

## 🛠️ API Endpoints

### Frontend API Routes
- `POST /api/sync-spotify` - Sync user's Spotify data
- `GET /api/me` - Get current user profile

### Backend API Routes
- `GET /` - Health check
- `GET /recommend?user_id={id}` - Generate recommendations
- `GET /health` - Detailed health check

## 📚 Future Enhancements

- [ ] Genre-based filtering
- [ ] Playlist creation from recommendations
- [ ] Historical recommendation tracking
- [ ] Advanced filtering options (mood, decade, etc.)
- [ ] Social features (share recommendations)
- [ ] Artist and album recommendations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or production.

## 🆘 Troubleshooting

**Login not working?**
- Check Spotify OAuth redirect URI matches Supabase callback URL
- Verify Spotify credentials in Supabase dashboard

**Sync failing?**
- Ensure Spotify tokens are stored correctly
- Check token expiration and refresh logic

**Recommendations empty?**
- Make sure to sync Spotify data first
- Check backend logs for errors
- Verify Supabase connection from backend

**Backend connection failed?**
- Ensure backend is running on port 8000
- Check NEXT_PUBLIC_BACKEND_URL in frontend .env.local
- Verify CORS settings in backend/main.py
