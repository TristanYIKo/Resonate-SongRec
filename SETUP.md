# 🚀 Setup Guide - Music Recommender App

Step-by-step guide to get your music recommendation app up and running.

## ✅ Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed
- [ ] Supabase account created
- [ ] Spotify Developer account created

## 📋 Step-by-Step Setup

### Step 1: Spotify Developer Setup (10 minutes)

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **"Create app"**
3. Fill in app details:
   - App name: `Music Recommender`
   - App description: `Personal music recommendation app`
   - Redirect URI: (We'll add this in Step 3)
   - APIs used: `Web API`
4. Save your **Client ID** and **Client Secret** (click "Show Client Secret")

### Step 2: Supabase Project Setup (15 minutes)

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New project"**
3. Fill in project details:
   - Name: `music-recommender`
   - Database Password: (generate strong password)
   - Region: (choose closest to you)
4. Wait for project to be created (~2 minutes)

### Step 3: Configure Spotify OAuth in Supabase

1. In Supabase dashboard, go to **Authentication > Providers**
2. Find **Spotify** and click to enable
3. Enter your Spotify credentials:
   - Client ID: (from Step 1)
   - Client Secret: (from Step 1)
4. Copy the **Callback URL** shown (format: `https://[project].supabase.co/auth/v1/callback`)
5. Go back to Spotify Developer Dashboard
6. Edit your app and add the Callback URL to **Redirect URIs**
7. Save changes

### Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `database/schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** to execute
6. Verify tables were created in **Database > Tables**

### Step 5: Get API Keys

1. In Supabase dashboard, go to **Settings > API**
2. Copy these values (you'll need them soon):
   - Project URL: `https://[project].supabase.co`
   - `anon` `public` key (for frontend)
   - `service_role` `secret` key (for backend) ⚠️ Keep this secure!

### Step 6: Frontend Setup

```powershell
# Navigate to web folder
cd web

# Install dependencies
npm install

# Create environment file
Copy-Item .env.local.example .env.local

# Edit .env.local with your values
notepad .env.local
```

Fill in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SPOTIFY_CLIENT_ID=[your-spotify-client-id]
SPOTIFY_CLIENT_SECRET=[your-spotify-client-secret]
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Step 7: Backend Setup

```powershell
# Navigate to backend folder (from project root)
cd ..\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
Copy-Item .env.example .env

# Edit .env with your values
notepad .env
```

Fill in your `.env`:
```env
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### Step 8: Run the Application

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```powershell
cd web
npm run dev
```

### Step 9: Test the Application

1. Open browser to `http://localhost:3000`
2. Click **"Login with Spotify"**
3. Authorize the app in Spotify
4. You should be redirected back and see your dashboard
5. Click **"Sync My Spotify"** (may take 10-20 seconds)
6. Click **"Get Recommendations"**
7. View your personalized recommendations! 🎉

## 🔍 Verification Checklist

- [ ] Backend running at `http://localhost:8000`
- [ ] Frontend running at `http://localhost:3000`
- [ ] Can access backend docs at `http://localhost:8000/docs`
- [ ] Can login with Spotify
- [ ] Can sync Spotify data successfully
- [ ] Can generate recommendations
- [ ] Recommendations display with scores

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@supabase/ssr'"
**Solution:** Run `npm install` in the web folder

### Issue: "Import sklearn could not be resolved"
**Solution:** 
```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Issue: Login redirects to error page
**Solution:** 
- Verify Spotify Redirect URI matches Supabase callback URL exactly
- Check Spotify OAuth is enabled in Supabase
- Ensure Client ID and Secret are correct

### Issue: "Failed to fetch tracks from Spotify"
**Solution:**
- Token may be expired - try logging out and back in
- Check Spotify API scopes in the code match your app settings

### Issue: Backend connection refused
**Solution:**
- Make sure backend is running (`uvicorn main:app...`)
- Check `NEXT_PUBLIC_BACKEND_URL` in frontend `.env.local`
- Verify port 8000 is not blocked by firewall

### Issue: "No tracks found for user"
**Solution:**
- Click "Sync My Spotify" first
- Check backend logs for errors during sync
- Verify Supabase tables were created correctly

## 🎓 Next Steps

Once everything is working:

1. **Customize the UI** - Edit components in `web/components/`
2. **Improve recommendations** - Modify algorithm in `backend/recommender.py`
3. **Add features** - Check the "Future Enhancements" in main README
4. **Deploy** - Follow deployment guides for Vercel (frontend) and Railway (backend)

## 📞 Need Help?

- Check the main `README.md` for detailed documentation
- Review API docs at `http://localhost:8000/docs`
- Check Supabase logs in dashboard under Logs section
- Review browser console for frontend errors
- Check terminal output for backend errors

## 🎉 Success!

You now have a fully functional music recommendation app! Share it with friends and enjoy discovering new music! 🎵
