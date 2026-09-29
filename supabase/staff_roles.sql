-- =============================================================================
-- PEMILU — link staff accounts to roles
-- Run AFTER creating both users in Supabase: Authentication -> Users -> Add user.
-- Safe to run again.
-- =============================================================================

insert into public.staff_roles (user_id, role)
select id, 'panitia' from auth.users where email = 'panitia@demo.local'
on conflict (user_id) do update set role = excluded.role;

insert into public.staff_roles (user_id, role)
select id, 'bilik' from auth.users where email = 'bilik@demo.local'
on conflict (user_id) do update set role = excluded.role;

-- Check: should list both accounts with their roles.
select u.email, r.role
from public.staff_roles r
join auth.users u on u.id = r.user_id
order by r.role;
