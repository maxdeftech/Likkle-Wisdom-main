-- Alerts/Announcements System for Likkle Wisdom
-- Only admins can create/update/delete alerts
-- All users can read alerts

-- 1. Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'update', 'event')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- Optional: auto-hide after this date
);

-- 2. Create alert_reads table to track which users have read which alerts
CREATE TABLE IF NOT EXISTS public.alert_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(alert_id, user_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_reads_user_id ON public.alert_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_reads_alert_id ON public.alert_reads(alert_id);

-- 4. Enable Row Level Security
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_reads ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for alerts table

-- All authenticated users can read alerts that haven't expired
DROP POLICY IF EXISTS "Anyone can read alerts" ON public.alerts;
CREATE POLICY "Anyone can read alerts" 
ON public.alerts 
FOR SELECT 
TO authenticated
USING (
    expires_at IS NULL OR expires_at > NOW()
);

-- Only admins can insert alerts
DROP POLICY IF EXISTS "Admins can create alerts" ON public.alerts;
CREATE POLICY "Admins can create alerts" 
ON public.alerts 
FOR INSERT 
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

-- Only admins can update alerts
DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
CREATE POLICY "Admins can update alerts" 
ON public.alerts 
FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

-- Only admins can delete alerts
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.alerts;
CREATE POLICY "Admins can delete alerts" 
ON public.alerts 
FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

-- 6. RLS Policies for alert_reads table

-- Users can read their own read status
DROP POLICY IF EXISTS "Users can read own alert reads" ON public.alert_reads;
CREATE POLICY "Users can read own alert reads" 
ON public.alert_reads 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Users can mark alerts as read for themselves
DROP POLICY IF EXISTS "Users can mark alerts as read" ON public.alert_reads;
CREATE POLICY "Users can mark alerts as read" 
ON public.alert_reads 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 7. Add is_admin column to profiles if it doesn't exist
-- (Run this only if you haven't already added the is_admin column)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 8. Create a function to get unread alert count for a user
CREATE OR REPLACE FUNCTION get_unread_alert_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.alerts a
        WHERE (a.expires_at IS NULL OR a.expires_at > NOW())
        AND NOT EXISTS (
            SELECT 1 FROM public.alert_reads ar
            WHERE ar.alert_id = a.id AND ar.user_id = p_user_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Sample admin alert (optional - comment out if not needed)
-- INSERT INTO public.alerts (admin_id, title, message, type)
-- VALUES (
--     (SELECT id FROM auth.users LIMIT 1),
--     'Welcome to Likkle Wisdom!',
--     'Big up yuhself fi joining di community! Explore quotes, read di Bible, pen yuh wisdom, and connect with friends. Every mickle makes a muckle! 🇯🇲',
--     'info'
-- );

-- Done! Run this entire script in your Supabase SQL Editor.
