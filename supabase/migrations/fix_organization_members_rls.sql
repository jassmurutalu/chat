-- Fix for infinite recursion in organization_members RLS policy
-- The issue: The original policy queries organization_members within its own USING clause,
-- causing infinite recursion.
-- Solution: Use a simple policy that only checks the user_id directly.

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view org members" ON public.organization_members;

-- Create a simple, non-recursive policy
-- Users can view ANY organization_members record where their user_id matches
-- This allows the frontend to query which organizations the user belongs to
CREATE POLICY "Users can view their own memberships"
ON public.organization_members FOR SELECT
USING (user_id = auth.uid());
