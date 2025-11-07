# 🚢 Deployment Checklist

Complete checklist for deploying your Music Recommender app to production.

## ✅ Pre-Deployment Checklist

### Code Preparation
- [ ] All sensitive data moved to environment variables
- [ ] No hardcoded API keys or secrets in code
- [ ] `.gitignore` properly configured
- [ ] `README.md` updated with project info
- [ ] Tested locally with production build (`npm run build`)
- [ ] Backend tested with production settings

### Database (Supabase)
- [ ] All tables created (profiles, spotify_tokens, user_tracks, recommendations)
- [ ] Row Level Security (RLS) policies enabled on all tables
- [ ] Indexes created for performance
- [ ] Database backups configured (Supabase Pro)

### Spotify Setup
- [ ] Spotify app approved (if required for public use)
- [ ] Production redirect URIs configured
- [ ] Rate limits understood (Spotify API)

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Repository
```powershell
# Ensure everything is committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Set Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
- [ ] `SPOTIFY_CLIENT_ID` = Your Spotify Client ID
- [ ] `SPOTIFY_CLIENT_SECRET` = Your Spotify Client Secret
- [ ] `NEXT_PUBLIC_BACKEND_URL` = Your backend URL (from Step 4)

**Important:** Set these for Production, Preview, and Development environments.

### Step 4: Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Test deployment URL
- [ ] Custom domain setup (optional)

### Step 5: Update Spotify Redirect URI
- [ ] Go to Spotify Developer Dashboard
- [ ] Add production redirect URI: `https://your-app.vercel.app`
- [ ] Keep Supabase callback in Spotify settings

## 🐍 Backend Deployment (Railway)

### Option A: Railway (Recommended)

#### Step 1: Prepare Project
```powershell
# Create Procfile (optional, Railway auto-detects)
echo "web: uvicorn main:app --host 0.0.0.0 --port $PORT" > backend/Procfile
```

#### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Set root directory to `backend`

#### Step 3: Configure Railway
- [ ] Set Python version (3.9+) in settings
- [ ] Railway auto-detects requirements.txt
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Step 4: Set Environment Variables
In Railway Dashboard → Variables:

- [ ] `SUPABASE_URL` = Your Supabase URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key

#### Step 5: Deploy
- [ ] Click "Deploy"
- [ ] Copy generated URL (e.g., `https://your-app.railway.app`)
- [ ] Update frontend `NEXT_PUBLIC_BACKEND_URL` in Vercel
- [ ] Redeploy frontend

### Option B: Render

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect repository, set root to `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Deploy

### Option C: Heroku

```powershell
# Install Heroku CLI
# Login
heroku login

# Create app
cd backend
heroku create your-app-name

# Set environment variables
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-key

# Deploy
git subtree push --prefix backend heroku main

# Or use Heroku GitHub integration
```

## 🔧 Post-Deployment Configuration

### Update Supabase Settings
- [ ] Add production frontend URL to Supabase Auth redirect URLs
- [ ] Test Spotify OAuth flow with production URLs
- [ ] Verify API requests work from production frontend

### Update CORS Settings
If backend has CORS issues, update `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",  # Add your production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy backend after CORS changes.

## ✅ Post-Deployment Testing

### Frontend Tests
- [ ] Open production URL
- [ ] Login with Spotify works
- [ ] User is redirected back after auth
- [ ] Dashboard displays correctly
- [ ] No console errors in browser DevTools

### Backend Tests
- [ ] Visit `https://your-backend.railway.app/` (shows welcome message)
- [ ] Visit `https://your-backend.railway.app/health` (shows healthy status)
- [ ] Visit `https://your-backend.railway.app/docs` (Swagger UI loads)

### Integration Tests
- [ ] Login flow works end-to-end
- [ ] "Sync My Spotify" successfully fetches tracks
- [ ] "Get Recommendations" returns results
- [ ] Recommendations display correctly
- [ ] Click to open in Spotify works

### Performance Tests
- [ ] Page loads within 3 seconds
- [ ] API responses within 2 seconds
- [ ] No timeout errors
- [ ] Images load properly

## 🔒 Security Checklist

- [ ] All environment variables set correctly
- [ ] No secrets committed to git
- [ ] Service role key only used in backend
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Supabase RLS policies active
- [ ] Rate limiting configured (if needed)
- [ ] Error messages don't leak sensitive info

## 📊 Monitoring Setup

### Vercel Monitoring
- [ ] Enable Analytics in Vercel dashboard
- [ ] Set up error tracking (Sentry optional)

### Railway Monitoring
- [ ] Check Railway metrics dashboard
- [ ] Set up log retention (Pro plan)

### Supabase Monitoring
- [ ] Review API usage in dashboard
- [ ] Set up database backups (Pro plan)
- [ ] Monitor authentication logs

## 🔄 Continuous Deployment

### Automatic Deployment
- [ ] Vercel: Automatic on push to main branch
- [ ] Railway: Automatic on push to main branch
- [ ] Configure preview deployments for PRs

### Manual Deployment
```powershell
# Frontend
git push origin main
# Vercel deploys automatically

# Backend (if not auto-deploying)
# Push to main branch, Railway redeploys
```

## 📱 Custom Domain (Optional)

### Frontend Domain
1. Buy domain (Namecheap, Google Domains, etc.)
2. In Vercel → Settings → Domains
3. Add your domain
4. Update DNS records as instructed
5. Wait for DNS propagation (up to 48 hours)
6. Update Spotify redirect URIs

### Backend Domain
1. In Railway → Settings → Networking
2. Add custom domain
3. Update DNS CNAME record
4. Update frontend `NEXT_PUBLIC_BACKEND_URL`
5. Redeploy frontend

## 🆘 Rollback Plan

### Vercel Rollback
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Railway Rollback
1. Go to Railway Dashboard → Deployments
2. Select previous deployment
3. Click "Redeploy"

### Database Rollback
1. Supabase Pro: Restore from backup
2. Free tier: Re-run schema.sql (⚠️ loses data)

## 📈 Success Metrics

After deployment, monitor:
- [ ] Uptime (should be >99%)
- [ ] Response times (<2s average)
- [ ] Error rate (<1%)
- [ ] User registrations
- [ ] API call volumes
- [ ] Database size

## 🎉 Deployment Complete!

When all checkboxes are complete:
- ✅ Frontend deployed and accessible
- ✅ Backend deployed and responding
- ✅ Database connected and secure
- ✅ Authentication working
- ✅ All features functional
- ✅ Monitoring enabled

### Share Your App!
- Production URL: `https://your-app.vercel.app`
- API Docs: `https://your-backend.railway.app/docs`

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

---

🚀 **Pro Tip**: Keep this checklist handy for future updates and redeployments!
