# 🚀 Quick Reference - Common Commands

Quick access to frequently used commands for development.

## 🖥️ Development Commands

### Start Both Services (Use 2 Terminals)

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

## 📦 Frontend Commands (web/)

```powershell
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Add a new package
npm install <package-name>

# Update packages
npm update
```

## 🐍 Backend Commands (backend/)

```powershell
# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate  # Windows PowerShell
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start development server (http://localhost:8000)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Start without auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000

# Add new package
pip install <package-name>
pip freeze > requirements.txt

# Deactivate virtual environment
deactivate
```

## 🗄️ Database Commands

### Run Schema in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `database/schema.sql`
3. Paste and click "Run"

### View Data
```sql
-- View user tracks
SELECT * FROM user_tracks WHERE user_id = 'your-user-id';

-- View recommendations
SELECT * FROM recommendations WHERE user_id = 'your-user-id' ORDER BY created_at DESC;

-- View profiles
SELECT * FROM profiles;

-- Count tracks per user
SELECT user_id, COUNT(*) as track_count 
FROM user_tracks 
GROUP BY user_id;
```

## 🔍 Debugging Commands

### Check Backend Health
```powershell
# In browser or curl
curl http://localhost:8000/health
```

### Test API Endpoints
```powershell
# Get recommendations (replace USER_ID)
curl "http://localhost:8000/recommend?user_id=USER_ID"

# Test frontend API
curl http://localhost:3000/api/me
```

### View API Documentation
- Backend Swagger UI: `http://localhost:8000/docs`
- Backend ReDoc: `http://localhost:8000/redoc`

### Check Logs

**Frontend:**
- Browser: Open DevTools (F12) → Console tab
- Terminal: Check the terminal running `npm run dev`

**Backend:**
- Terminal: Check the terminal running uvicorn
- Add print statements in Python code

**Supabase:**
- Dashboard → Logs → API Logs or Database Logs

## 🧹 Cleanup Commands

### Frontend
```powershell
# Remove node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Clear Next.js cache
Remove-Item -Recurse -Force .next
npm run dev

# Clear all caches and reinstall
Remove-Item -Recurse -Force node_modules, .next, package-lock.json
npm install
```

### Backend
```powershell
# Remove virtual environment and recreate
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Clear Python cache
Get-ChildItem -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force
Get-ChildItem -Recurse -Filter "*.pyc" | Remove-Item -Force
```

## 🔐 Environment Setup

### Check Environment Variables

**Frontend:**
```powershell
# Check if .env.local exists
Test-Path .env.local

# View contents (be careful - contains secrets!)
Get-Content .env.local
```

**Backend:**
```powershell
# Check if .env exists
Test-Path .env

# View contents (be careful - contains secrets!)
Get-Content .env
```

## 🌐 Port Management

### Check if Port is in Use
```powershell
# Check port 3000 (frontend)
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

# Check port 8000 (backend)
Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
```

### Kill Process on Port
```powershell
# Kill process on port 3000
$port = 3000
$process = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }

# Kill process on port 8000
$port = 8000
$process = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }
```

## 🚀 Git Commands

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Full-stack music recommender"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/music-recommender.git
git branch -M main
git push -u origin main
```

## 📊 Useful URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **API Health**: http://localhost:8000/health
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Spotify Dashboard**: https://developer.spotify.com/dashboard

## 🆘 Emergency Reset

If everything breaks:

```powershell
# Frontend reset
cd web
Remove-Item -Recurse -Force node_modules, .next
npm install
npm run dev

# Backend reset
cd backend
Remove-Item -Recurse -Force venv, __pycache__
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Database reset
# Go to Supabase → SQL Editor
# Run schema.sql again
```

## 📝 Common Issues Quick Fixes

### "Module not found" error
```powershell
# Frontend
cd web
npm install

# Backend
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

### "Port already in use"
```powershell
# Use the port kill commands above
# Or restart your computer
```

### "Authentication error"
- Check .env files have correct values
- Verify Spotify OAuth settings in Supabase
- Try logging out and back in

### "Can't connect to backend"
- Ensure backend is running on port 8000
- Check `NEXT_PUBLIC_BACKEND_URL` in frontend .env.local
- Test backend directly: http://localhost:8000/health

---

💡 **Tip**: Keep this file open in a separate editor tab for quick reference while developing!
