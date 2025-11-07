-- Multi-Tenant SaaS Platform Schema Migration
-- This migration adds organizations, integrations, and multi-tenant support

-- Add organizations/workspaces table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- company-name for URLs
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add integrations table for storing connection credentials
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'messenger', 'whatsapp')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disconnected')),

  -- Telegram credentials (encrypted)
  telegram_bot_token TEXT,
  telegram_bot_username TEXT,

  -- Messenger credentials
  messenger_page_id TEXT,
  messenger_page_access_token TEXT,
  messenger_verify_token TEXT,

  -- WhatsApp credentials
  whatsapp_phone_number_id TEXT,
  whatsapp_access_token TEXT,
  whatsapp_business_account_id TEXT,

  -- Metadata
  webhook_url TEXT,
  last_webhook_received_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Each org can only have one integration per platform
  UNIQUE(organization_id, platform)
);

-- Add organization membership table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(organization_id, user_id)
);

-- Update users table to track current organization
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES public.organizations(id);

-- Update conversations table to link to organization
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL;

-- Update messages table (already has conversation_id, so inherits organization)
-- No changes needed

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_integrations_org ON public.integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON public.conversations(organization_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their assigned conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their assigned conversations" ON public.conversations;

-- New RLS: Users can only see conversations from their organizations
CREATE POLICY "Users can view org conversations"
ON public.conversations FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update org conversations"
ON public.conversations FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

-- RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Owners can update their organizations"
ON public.organizations FOR UPDATE
USING (owner_id = auth.uid());

-- RLS for integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org integrations"
ON public.integrations FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage integrations"
ON public.integrations FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- RLS for organization members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org members"
ON public.organization_members FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

-- Function to auto-create organization for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Create personal organization
  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Workspace'),
    'user-' || NEW.id::text,
    NEW.id
  )
  ON CONFLICT DO NOTHING;

  -- Add user as member
  INSERT INTO public.organization_members (organization_id, user_id, role)
  SELECT id, NEW.id, 'owner'
  FROM public.organizations
  WHERE owner_id = NEW.id
  ON CONFLICT DO NOTHING;

  -- Set as current organization
  UPDATE public.users
  SET current_organization_id = (
    SELECT id FROM public.organizations WHERE owner_id = NEW.id LIMIT 1
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user organization creation
DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;
CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_organization();

-- Migrate existing data (run once)
DO $$
DECLARE
  first_user_id UUID;
  default_org_id UUID;
BEGIN
  -- Get first user
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;

  IF first_user_id IS NOT NULL THEN
    -- Create default organization
    INSERT INTO public.organizations (name, slug, owner_id)
    VALUES ('Default Organization', 'default-org', first_user_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO default_org_id;

    -- Add first user as member
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (default_org_id, first_user_id, 'owner')
    ON CONFLICT DO NOTHING;

    -- Update all existing conversations
    UPDATE public.conversations
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;

    -- Update user's current org
    UPDATE public.users
    SET current_organization_id = default_org_id
    WHERE id = first_user_id;
  END IF;
END $$;
