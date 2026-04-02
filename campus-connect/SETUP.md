# Campus Connect - Setup Guide

This guide will help you set up and deploy the Campus Connect social media platform.

## Prerequisites

- Node.js 18+
- Python 3.11+
- Git
- Supabase account
- Railway account (for backend deployment)
- Cloudflare account (for frontend deployment)
- Hugging Face account (for AI moderation)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd campus-connect
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to **Settings > API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

4. Go to **SQL Editor** and run the `backend/supabase_schema.sql` file

5. In **Authentication > Settings**, configure:
   - Site URL: Your frontend URL (e.g., `https://campus-connect.pages.dev`)
   - Redirect URLs: Add your frontend URL

## Step 3: Set Up Hugging Face (Optional - for AI Moderation)

1. Go to [huggingface.co](https://huggingface.co) and create an account
2. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Create a new token with "Read" permissions
4. Copy the token

## Step 4: Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=generate-a-secure-random-string
HUGGINGFACE_API_KEY=your-huggingface-token
FRONTEND_URL=https://your-frontend-url.pages.dev
```

## Step 5: Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=https://your-backend-url.railway.app
```

## Step 6: Local Development

### Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Step 7: Deploy to Production

### Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Add environment variables from your `.env` file
5. Deploy

### Deploy Frontend to Cloudflare Pages

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Create a new project
3. Connect your GitHub repository
4. Set:
   - Build command: `npm run build`
   - Build output: `dist`
5. Add environment variable:
   - `VITE_API_URL`: Your Railway backend URL
6. Deploy

## Step 8: Update CORS

After deploying, update the `ALLOWED_ORIGINS` in your Railway environment variables:
```
FRONTEND_URL=https://campus-connect.pages.dev
```

## Features Overview

### Core Features
- User authentication (register/login)
- User profiles with avatars
- Follow/unfollow system
- Post creation with media support
- Feed with infinite scroll
- Likes and comments
- Direct messaging

### Anonymous Channel
- Anonymous posting with random animal names
- Category filtering (Complaints, Suggestions, Experiences, Q&A)
- AI-powered content moderation
- Identity protection

### Real-time Features
- Live notifications
- Direct messaging
- Online status indicators

## Troubleshooting

### "Connection refused" errors
- Make sure the backend is running on port 8000
- Check if CORS is configured correctly

### Database errors
- Verify Supabase credentials in `.env`
- Ensure RLS policies are applied
- Check if tables exist in Supabase dashboard

### AI moderation not working
- Verify Hugging Face API key
- Check if the model is available (may take time to load on first request)

## Future Enhancements

- [ ] University email verification
- [ ] Stories/Reels
- [ ] Events calendar
- [ ] Student marketplace
- [ ] Study groups
- [ ] Push notifications (PWA)
- [ ] Mobile app (React Native)

## License

MIT License
