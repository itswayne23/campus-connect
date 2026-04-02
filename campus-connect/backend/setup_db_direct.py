import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Load .env file first
from dotenv import load_dotenv
load_dotenv()

# Get connection details from .env
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')

print(f"URL: {SUPABASE_URL}")
print(f"Service key starts with: {SUPABASE_SERVICE_KEY[:20] if SUPABASE_SERVICE_KEY else 'NOT FOUND'}...")

# Extract project ref from URL
project_ref = SUPABASE_URL.split('//')[1].split('.')[0] if '//' in SUPABASE_URL else ''

# Supabase requires the password to be URL encoded
import urllib.parse
encoded_password = urllib.parse.quote(SUPABASE_SERVICE_KEY, safe='')

# Construct connection string
connection_string = f"postgresql://postgres:{encoded_password}@{project_ref}.supabase.co:5432/postgres"

print(f"Connecting to Supabase project: {project_ref}...")

try:
    conn = psycopg2.connect(connection_string)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    print("\nConnected! Creating tables...")
    
    # Create bookmarks table (critical - was missing!)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS public.bookmarks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, post_id)
        )
    """)
    print("✓ Created bookmarks table")
    
    # Create delete_requests table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS public.delete_requests (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            reason TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    print("✓ Created delete_requests table")
    
    # Enable RLS on bookmarks
    cursor.execute("ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY")
    print("✓ Enabled RLS on bookmarks")
    
    # Enable RLS on delete_requests
    cursor.execute("ALTER TABLE public.delete_requests ENABLE ROW LEVEL SECURITY")
    print("✓ Enabled RLS on delete_requests")
    
    # Create RLS policies for bookmarks
    cursor.execute("""
        CREATE POLICY IF NOT EXISTS "Users can view own bookmarks" 
        ON public.bookmarks FOR SELECT USING (user_id = auth.uid())
    """)
    cursor.execute("""
        CREATE POLICY IF NOT EXISTS "Users can create bookmarks" 
        ON public.bookmarks FOR INSERT WITH CHECK (user_id = auth.uid())
    """)
    cursor.execute("""
        CREATE POLICY IF NOT EXISTS "Users can delete own bookmarks" 
        ON public.bookmarks FOR DELETE USING (user_id = auth.uid())
    """)
    print("✓ Created bookmarks RLS policies")
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON public.bookmarks(post_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_delete_requests_status ON public.delete_requests(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_delete_requests_created ON public.delete_requests(created_at DESC)")
    print("✓ Created indexes")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Database setup complete!")
    print("The missing tables have been created:")
    print("  - bookmarks (for saving posts)")
    print("  - delete_requests (for admin delete requests)")
    
except Exception as e:
    print(f"Error: {e}")
    print("\nPlease run this SQL in your Supabase SQL Editor:")
    print("="*60)
    print("""
-- Bookmarks table (CRITICAL - was causing errors)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Delete Requests table (NEW)
CREATE TABLE IF NOT EXISTS public.delete_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delete_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON public.bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_delete_requests_status ON public.delete_requests(status);
CREATE INDEX IF NOT EXISTS idx_delete_requests_created ON public.delete_requests(created_at DESC);
    """)
    print("="*60)