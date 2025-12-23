# VideoSave Backend Deployment Guide

## Free Hosting Options

### Option 1: Render.com (Recommended)
1. Go to https://render.com
2. Sign up with GitHub account
3. Create new "Web Service"
4. Connect your GitHub repository
5. Set build command: `npm install`
6. Set start command: `npm start`
7. Deploy!

### Option 2: Railway.app
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Connect and deploy
6. Railway auto-detects Node.js project

### Option 3: Fly.io
1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Run: `flyctl launch`
3. Select Node.js
4. Deploy: `flyctl deploy`

### Option 4: Heroku (Limited free tier)
1. Sign up at https://www.heroku.com
2. Install Heroku CLI
3. Run: `heroku login`
4. `heroku create your-app-name`
5. `git push heroku main`

## Environment Variables
No sensitive data required for basic deployment. The app works out of the box.

## Important Notes
- Update `frontend/script.js` with deployed backend URL
- Change all `http://localhost:5000` to your deployed URL
- CORS is already enabled in server.js

## Next Steps
1. Integrate actual video downloader library (yt-dlp, ytdl-core, etc.)
2. Update the `/api/analyze` and `/api/download` endpoints
3. Add error handling and logging
4. Deploy to your chosen platform
