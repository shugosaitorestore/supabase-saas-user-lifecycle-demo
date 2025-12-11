-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;

-- 1. Profiles Policies
-- Users can read all profiles (for member lists) but update only their own.
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- 2. Organizations Policies
-- Visible if user is an active member
create policy "Users can view organizations they belong to"
  on public.organizations for select
  using (
    id in (select get_my_org_ids())
  );

-- 3. Memberships Policies
-- Visible if user belongs to the same organization
create policy "Users can view members of their organizations"
  on public.memberships for select
  using (
    org_id in (select get_my_org_ids())
  );

-- Only Admins/Owners can update memberships (Also handled by RPC, but good as a backup)
create policy "Admins/Owners can update memberships"
  on public.memberships for update
  using (
    org_id in (select get_my_org_ids())
    and exists (
      select 1 from memberships
      where user_id = auth.uid()
      and org_id = memberships.org_id
      and role in ('owner', 'admin')
    )
  );

-- 4. Invites Policies
-- Only visible to admins/owners of the org
create policy "Admins can view invites"
  on public.invites for select
  using (
    org_id in (select get_my_org_ids())
    and exists (
      select 1 from memberships
      where user_id = auth.uid()
      and org_id = invites.org_id
      and role in ('owner', 'admin')
    )
  );