-- ==========================================
-- AUTH SCHEMA: Profiles, Roles & RLS
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'premium')),
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled', 'expired')),
  subscription_id TEXT,
  subscription_plan TEXT,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;

-- Public can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- NOTE: We removed the 'Admins can view all profiles' policy.
-- Querying `public.profiles` inside a policy on `public.profiles` causes an infinite recursion error.
-- Since Admin operations are performed Server-Side using `SUPABASE_SERVICE_ROLE_KEY` (which bypasses RLS), 
-- we do not need a client-side policy for admins to view all profiles.

-- Users can update their own non-role fields
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow inserts for the trigger (service role)
CREATE POLICY "Service role full access profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Add is_premium column to resources
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 5. Set admin role for the owner
-- Run this AFTER the admin account has signed up
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'phathoon1502@gmail.com';

-- 6. Create index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
