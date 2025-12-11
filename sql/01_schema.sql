-- Clean up (for development iteration only - optional)
-- DROP TABLE IF EXISTS invites, memberships, organizations, profiles CASCADE;

-- 1. Profiles: Extends auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- 2. Organizations: The tenant unit
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now() not null
);

-- 3. Memberships: Linking Users to Organizations with Roles
create table public.memberships (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('owner', 'admin', 'member')),
  status text not null check (status in ('invited', 'active', 'suspended', 'left')),
  created_at timestamptz default now() not null,
  
  -- Prevent duplicate memberships
  unique(org_id, user_id)
);

-- 4. Invites: Token-based invitation system
create table public.invites (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  email text not null,
  token text not null unique, -- secure random token
  status text not null check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz default now() not null
);

-- Indexes for performance
create index idx_memberships_user on public.memberships(user_id);
create index idx_memberships_org on public.memberships(org_id);
create index idx_invites_token on public.invites(token);