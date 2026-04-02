# Campus Connect - Student Social Media Platform

A full-stack social media platform for universities featuring anonymous posting, real-time messaging, and AI-powered moderation.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: FastAPI (Python) + Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deployment**: Cloudflare Pages (frontend) + Railway (backend)
- **AI Moderation**: Hugging Face Inference API

## Features

- [x] User authentication (register, login, JWT)
- [x] User profiles with avatars
- [x] Follow/unfollow system
- [x] Post creation with media support
- [x] Feed with infinite scroll
- [x] Likes and comments
- [x] Anonymous posting channel
- [x] AI-powered content moderation
- [x] Real-time notifications
- [x] Direct messaging
- [x] Dark/Light mode
- [ ] University verification (future)
- [ ] Stories/Reels (future)
- [ ] Events calendar (future)

## Project Structure

```
campus-connect/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Config, security, database
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   └── requirements.txt
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities
│   │   └── store/        # Zustand stores
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase account
- Railway account (for deployment)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API URLs

# Run the development server
npm run dev
```

## Environment Variables

### Backend (.env)

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
HUGGINGFACE_API_KEY=your_huggingface_key
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

MIT License
