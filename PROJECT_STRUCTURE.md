# 📦 Project Files Summary

Complete overview of all files in the Music Recommender project.

## 📂 Project Structure

```
SpotifyRecommendationWebsite/
├── .gitignore                          # Root gitignore
├── README.md                           # Main documentation
├── SETUP.md                            # Step-by-step setup guide
│
├── database/
│   └── schema.sql                      # PostgreSQL schema for Supabase
│
├── web/                                # Next.js Frontend
│   ├── .env.local.example              # Environment template
│   ├── .gitignore                      # Frontend gitignore
│   ├── README.md                       # Frontend documentation
│   ├── package.json                    # Node dependencies
│   ├── tsconfig.json                   # TypeScript config
│   ├── next.config.mjs                 # Next.js config
│   ├── tailwind.config.ts              # Tailwind CSS config
│   ├── postcss.config.js               # PostCSS config
│   ├── middleware.ts                   # Auth session middleware
│   │
│   ├── app/
│   │   ├── globals.css                 # Global styles
│   │   ├── layout.tsx                  # Root layout with navbar
│   │   ├── page.tsx                    # Main dashboard page
│   │   └── api/
│   │       ├── sync-spotify/
│   │       │   └── route.ts            # Sync Spotify data endpoint
│   │       └── me/
│   │           └── route.ts            # Current user endpoint
│   │
│   ├── components/
│   │   ├── Navbar.tsx                  # Navigation bar component
│   │   └── RecommendationList.tsx      # Recommendations display
│   │
│   ├── lib/
│   │   ├── supabaseClient.ts           # Browser Supabase client
│   │   └── serverSupabase.ts           # Server Supabase client
│   │
│   └── types/
│       └── index.ts                    # TypeScript type definitions
│
└── backend/                            # Python FastAPI Backend
    ├── .env.example                    # Environment template
    ├── .gitignore                      # Backend gitignore
    ├── README.md                       # Backend documentation
    ├── requirements.txt                # Python dependencies
    ├── main.py                         # FastAPI app & endpoints
    ├── recommender.py                  # ML recommendation engine
    └── supabase_client.py              # Supabase REST client
```

## 📄 File Descriptions

### Root Level

**README.md**
- Complete project documentation
- Features overview
- Tech stack details
- Setup instructions
- Deployment guide
- Troubleshooting

**SETUP.md**
- Detailed step-by-step setup guide
- Checklist format
- Common issues and solutions
- Verification steps

**.gitignore**
- Excludes sensitive files (.env)
- Excludes build artifacts
- Excludes dependencies

### Database

**database/schema.sql**
- Creates 4 main tables:
  - `profiles` - User profile data from Spotify
  - `spotify_tokens` - OAuth tokens for API access
  - `user_tracks` - User's listening history with audio features
  - `recommendations` - Generated recommendations
- Includes Row Level Security (RLS) policies
- Includes indexes for performance
- Includes triggers for timestamp updates

### Frontend (web/)

#### Configuration Files

**package.json**
- Next.js 14 with App Router
- React 18
- Supabase JS client & SSR helpers
- TypeScript and Tailwind CSS

**tsconfig.json**
- TypeScript configuration
- Path aliases (@/*)
- Strict mode enabled

**next.config.mjs**
- Allows Spotify image domains
- Production optimizations

**tailwind.config.ts**
- Custom Spotify color palette
- Typography settings

**middleware.ts**
- Refreshes Supabase session
- Runs on all routes
- Handles auth cookies

#### Application Files

**app/layout.tsx**
- Root layout component
- Includes Navbar
- Sets up fonts (Inter)
- Global metadata

**app/page.tsx**
- Main dashboard page
- User authentication check
- Login button for unauthenticated users
- Sync and recommendation buttons for authenticated users
- Displays recommendations
- Handles loading states

**app/globals.css**
- Tailwind directives
- Spotify color CSS variables
- Global styles

#### API Routes

**app/api/sync-spotify/route.ts**
- POST endpoint
- Fetches user's top 50 tracks from Spotify
- Retrieves audio features
- Refreshes expired tokens
- Upserts data to Supabase user_tracks table
- Returns track count

**app/api/me/route.ts**
- GET endpoint
- Returns current user session
- Returns user profile from database
- Useful for debugging

#### Components

**components/Navbar.tsx**
- Navigation bar
- Shows user avatar and name when logged in
- Spotify branding

**components/RecommendationList.tsx**
- Displays list of recommendations
- Shows track name, artist, and score
- Click to open in Spotify
- Animated hover effects

#### Library

**lib/supabaseClient.ts**
- Browser client for client components
- Uses anon key
- Handles auth state

**lib/serverSupabase.ts**
- Server client for server components and API routes
- Cookie-based session management
- Required for SSR

#### Types

**types/index.ts**
- TypeScript interfaces for:
  - Spotify tracks
  - User tracks
  - Recommendations
  - User profiles
  - API responses

### Backend (backend/)

**main.py**
- FastAPI application
- CORS configuration for frontend
- Endpoints:
  - `GET /` - Health check
  - `GET /recommend` - Generate recommendations
  - `GET /health` - Detailed health check
- Error handling
- Logging

**recommender.py**
- Core ML recommendation algorithm
- Functions:
  - `generate_recommendations()` - Main algorithm
    - Extracts audio features
    - Creates user profile vector
    - Calculates cosine similarity
    - Returns top N matches
  - `calculate_diversity_score()` - Placeholder for diversity metrics
  - `explain_recommendation()` - Placeholder for explanations

**supabase_client.py**
- REST API client for Supabase
- SupabaseClient class with methods:
  - `query()` - SELECT operations
  - `insert()` - INSERT operations
  - `upsert()` - UPSERT operations
- Helper functions:
  - `get_user_tracks()` - Fetch user's tracks
  - `save_recommendations()` - Save to DB
  - `get_user_profile()` - Get user info

**requirements.txt**
- FastAPI - Web framework
- Uvicorn - ASGI server
- python-dotenv - Environment variables
- requests - HTTP client
- numpy - Numerical operations
- scikit-learn - ML algorithms
- pydantic - Data validation

## 🔑 Key Features by File

### Authentication Flow
1. **app/page.tsx** - Login button triggers Spotify OAuth
2. **middleware.ts** - Refreshes session on each request
3. **database/schema.sql** - Stores user profile and tokens
4. **lib/serverSupabase.ts** - Server-side auth verification

### Data Sync Flow
1. **app/page.tsx** - User clicks "Sync My Spotify"
2. **app/api/sync-spotify/route.ts** - Fetches from Spotify API
3. **database/schema.sql** - Stores in user_tracks table

### Recommendation Flow
1. **app/page.tsx** - User clicks "Get Recommendations"
2. **backend/main.py** - `/recommend` endpoint receives request
3. **backend/supabase_client.py** - Fetches user's tracks
4. **backend/recommender.py** - Generates recommendations
5. **backend/main.py** - Returns JSON response
6. **components/RecommendationList.tsx** - Displays results

## 📊 Technology Stack by File

### Frontend Stack
- **Next.js 14** - app/layout.tsx, app/page.tsx, middleware.ts
- **React 18** - All .tsx files
- **TypeScript** - All .ts and .tsx files
- **Tailwind CSS** - globals.css, all components
- **Supabase Client** - lib/, app/api/

### Backend Stack
- **Python 3.9+** - All .py files
- **FastAPI** - main.py
- **scikit-learn** - recommender.py
- **NumPy** - recommender.py
- **Requests** - supabase_client.py

### Database Stack
- **PostgreSQL** - schema.sql
- **Supabase** - All database operations
- **Row Level Security** - schema.sql policies

## 🚀 Getting Started Quick Reference

1. **Database Setup**: Run `database/schema.sql` in Supabase
2. **Frontend Setup**: 
   - `cd web`
   - `npm install`
   - Copy `.env.local.example` to `.env.local`
   - `npm run dev`
3. **Backend Setup**:
   - `cd backend`
   - `python -m venv venv`
   - `venv\Scripts\activate`
   - `pip install -r requirements.txt`
   - Copy `.env.example` to `.env`
   - `uvicorn main:app --reload`

## 📝 Environment Variables Summary

### Frontend (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase dashboard
- `SPOTIFY_CLIENT_ID` - From Spotify Developer Dashboard
- `SPOTIFY_CLIENT_SECRET` - From Spotify Developer Dashboard
- `NEXT_PUBLIC_BACKEND_URL` - Usually http://localhost:8000

### Backend (.env)
- `SUPABASE_URL` - Same as frontend
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase (keep secret!)

## 🎯 Next Steps

After setup:
1. Customize UI in `components/`
2. Improve algorithm in `recommender.py`
3. Add features following patterns in existing files
4. Deploy frontend to Vercel
5. Deploy backend to Railway/Render

---

All files are ready to use! Follow SETUP.md for detailed instructions.
