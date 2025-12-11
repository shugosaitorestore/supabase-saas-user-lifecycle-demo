-- 1. Helper: Get list of organization IDs where the current user is an active member
-- SECURITY DEFINER is crucial here to bypass RLS on 'memberships' table
-- to avoid infinite recursion when used IN RLS policies.
create or replace function public.get_my_org_ids()
returns setof uuid
language sql
security definer
set search_path = public -- Secure search path
stable
as $$
  select org_id
  from memberships
  where user_id = auth.uid()
  and status = 'active';
$$;

-- 2. Trigger Function: Create public profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- 3. Register the trigger
-- Drop if exists to allow re-running this script
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();