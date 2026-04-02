# Campus Connect - Free Deployment Guide

This guide walks you through deploying Campus Connect for FREE.

## Free Services Used
- **Frontend**: Cloudflare Pages (FREE - unlimited bandwidth)
- **Backend**: Railway (FREE - 500 hours/month)
- **Database**: Supabase (FREE - 500MB)
- **AI Moderation**: Hugging Face (FREE - 1000 requests/month)

---

## Step 1: Set Up Supabase (Database)

1. Go to https://supabase.com and sign up
2. Click "New project"
3. Fill in details:
   - Name: `campus-connect`
   - Password: Create a strong password
   - Region: Choose one close to you
4. Wait 2-3 minutes for it to set up

5. After it loads, go to **Settings → API**
6. Copy these values (save in a text file):
   - `Project URL` (looks like: `https://xxx.supabase.co`)
   - `anon public key`
   - `service_role secret key`

7. Go to **SQL Editor** (left menu)
8. Copy all content from `backend/supabase_schema.sql`
9. Paste and click "Run"

---

## Step 2: Set Up Hugging Face (AI Moderation)

1. Go to https://huggingface.co and sign up
2. Go to **Settings → Access Tokens**
3. Click "Create new token"
4. Name it: `campus-connect`
5. Set permissions: **Read**
6. Copy the token (starts with `hf_`)

---

## Step 3: Deploy Backend to Railway

1. Go to https://railway.app and sign up
2. Click "New Project"
3. Choose "Deploy a starter"
4. Select "Python" template
5. Connect your GitHub account
6. Select the `campus-connect` repository
7. Go to the **Variables** tab
8. Add these variables:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase URL (from Step 1) |
| `SUPABASE_ANON_KEY` | Your anon key (from Step 1) |
| `SUPABASE_SERVICE_KEY` | Your service key (from Step 1) |
| `JWT_SECRET` | Type any random string (e.g., `abc123xyz`) |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
| `HUGGINGFACE_API_KEY` | Your Hugging Face token (from Step 2) |
| `FRONTEND_URL` | Leave empty for now |

9. Click **Deploy**
10. Wait 2-3 minutes
11. Copy the Railway URL (e.g., `https://backend-production-xxx.railway.app`)

---

## Step 4: Deploy Frontend to Cloudflare Pages

1. Go to https://pages.cloudflare.com and sign up
2. Click "Create a project"
3. Select "Connect to Git"
4. Choose your GitHub account
5. Select the `campus-connect` repository
6. Configure these settings:

| Setting | Value |
|---------|-------|
| Project name | `campus-connect` |
| Production branch | `master` |
| Build command | `npm run build` |
| Build output directory | `dist` |

7. Under **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway URL (from Step 3) |
| `VITE_SUPABASE_URL` | Your Supabase URL (from Step 1) |
| `VITE_SUPABASE_ANON_KEY` | Your anon key (from Step 1) |

8. Click **Save and Deploy**
9. Wait 3-4 minutes
10. Copy your Cloudflare URL (e.g., `https://campus-connect.pages.dev`)

---

## Step 5: Update CORS Settings

1. Go back to Railway
2. Go to **Variables** tab
3. Edit `FRONTEND_URL` and add your Cloudflare URL:
   ```
   https://campus-connect.pages.dev
   ```

4. Go to Supabase Dashboard
5. Go to **Authentication → URL Configuration**
6. Update:
   - Site URL: Your Cloudflare URL
   - Add to Redirect URLs: Your Cloudflare URL

7. Deploy again (make a small change and push to GitHub)

---

## Your Final URLs

| Service | URL |
|---------|-----|
| Frontend | `https://campus-connect.pages.dev` |
| Backend API | `https://backend-xxx.railway.app` |

---

## Troubleshooting

### App shows "Connection Error"
- Wait 2 minutes for Railway to start (first deployment takes time)
- Check Railway logs for errors

### Login doesn't work
- Make sure you added all environment variables in both Railway and Cloudflare
- Verify Supabase email settings are correct

### Can't register
- Check Supabase SQL ran successfully
- Verify RLS policies are set (go to Supabase → Authentication → Policies)

### AI moderation not working
- Check Railway logs - Hugging Face token might be wrong
- First request takes 10-20 seconds

---

## Important Notes

- **Railway**: Free tier sleeps after 5 minutes of inactivity. First request after sleep takes 10-20 seconds.
- **Supabase**: Free tier has 500MB storage limit
- **Cloudflare**: Unlimited bandwidth, always online

## Cost

**$0/month** - All services have free tiers sufficient for a student project.
