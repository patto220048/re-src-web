-- Migration: Initialize Site Settings
-- Description: Creates site_settings table and inserts default configuration row.

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.site_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    site_name TEXT DEFAULT 'SFXFolder.com',
    tagline TEXT DEFAULT 'Free Resources for Video Editors',
    project_version TEXT DEFAULT 'v 0.1.16.4',
    status_text TEXT DEFAULT 'System Online',
    contact_email TEXT DEFAULT '',
    social_links JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT one_row_only CHECK (id = 1)
);

-- 2. Insert default row if not exists
INSERT INTO public.site_settings (id, site_name, tagline, project_version, status_text)
VALUES (1, 'SFXFolder.com', 'Free Resources for Video Editors', 'v 0.1.16.4', 'System Online')
ON CONFLICT (id) DO NOTHING;

-- 3. Ensure contact_email exists (in case table was created previously without it)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='contact_email') THEN
        ALTER TABLE public.site_settings ADD COLUMN contact_email TEXT DEFAULT '';
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Allow public read access to site_settings" ON public.site_settings;
CREATE POLICY "Allow public read access to site_settings" ON public.site_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin update access to site_settings" ON public.site_settings;
CREATE POLICY "Allow admin update access to site_settings" ON public.site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
