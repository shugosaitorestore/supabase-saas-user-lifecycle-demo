-- 1. Create Organization (Transactional: Create Org + Add Owner)
create or replace function create_organization(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  -- Insert Organization
  insert into organizations (name)
  values (org_name)
  returning id into new_org_id;

  -- Insert Membership for the creator (Owner)
  insert into memberships (org_id, user_id, role, status)
  values (new_org_id, auth.uid(), 'owner', 'active');

  return new_org_id;
end;
$$;

-- 2. Invite Member (Check permissions + Create Invite)
create or replace function invite_member(target_org_id uuid, invite_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_invite_id uuid;
  caller_role text;
begin
  -- Check if caller is owner or admin of the org
  select role into caller_role
  from memberships
  where org_id = target_org_id
  and user_id = auth.uid()
  and status = 'active';

  if caller_role is null or caller_role not in ('owner', 'admin') then
    raise exception 'Access denied: You must be an admin or owner to invite members.';
  end if;

  -- Create Invite (Token generation should ideally happen in backend/edge function, 
  -- but strictly using DB here for simplicity. Using uuid as token for demo)
  insert into invites (org_id, email, token, status, expires_at)
  values (
    target_org_id, 
    invite_email, 
    replace(gen_random_uuid()::text, '-', ''), -- Simple random token
    'pending',
    now() + interval '7 days'
  )
  returning id into new_invite_id;

  return new_invite_id;
end;
$$;

-- 3. Accept Invite (Transactional: Update Invite + Add Member)
create or replace function accept_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record record;
  new_member_id uuid;
begin
  -- Validate Invite
  select * into invite_record
  from invites
  where token = invite_token
  and status = 'pending'
  and expires_at > now();

  if invite_record.id is null then
    raise exception 'Invalid or expired invite token.';
  end if;

  -- Update Invite Status
  update invites
  set status = 'accepted'
  where id = invite_record.id;

  -- Add to Memberships
  insert into memberships (org_id, user_id, role, status)
  values (invite_record.org_id, auth.uid(), 'member', 'active')
  returning id into new_member_id;

  return new_member_id;
end;
$$;

-- 4. Update Membership Status (Kick, Suspend, etc.)
create or replace function set_membership_status(target_membership_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
  caller_role text;
  target_user_id uuid;
begin
  -- Get target details
  select org_id, user_id into target_org_id, target_user_id
  from memberships
  where id = target_membership_id;

  -- 1. Check permissions (Caller must be admin/owner)
  select role into caller_role
  from memberships
  where org_id = target_org_id
  and user_id = auth.uid()
  and status = 'active';

  if caller_role is null or caller_role not in ('owner', 'admin') then
    raise exception 'Access denied.';
  end if;

  -- 2. Safety Guard: Prevent changing own status (to avoid locking self out)
  if target_user_id = auth.uid() then
    raise exception 'Operation failed: You cannot change your own status via this function.';
  end if;

  -- Update status
  update memberships
  set status = new_status
  where id = target_membership_id;
end;
$$;