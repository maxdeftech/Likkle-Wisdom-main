-- Fix Function Search Path Mutable (linter 0011_function_search_path_mutable)
-- Sets an explicit search_path so the function does not use a role-mutable search path.
-- Run in Supabase SQL Editor.
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- =============================================================================
-- get_unread_alert_count: recreate with SET search_path = ''
-- (Uses fully qualified names public.alerts / public.alert_reads)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_unread_alert_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- =============================================================================
-- handle_new_user: set search_path (trigger function, no args)
-- If this fails (e.g. different signature), run in SQL Editor:
--   SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';
-- then recreate the function with SET search_path = '' in the definition.
-- =============================================================================
ALTER FUNCTION public.handle_new_user() SET search_path = '';
