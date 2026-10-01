-- ============================================================
-- 0002 — Trigger de création de profil (absent en production)
-- Appliqué sur le projet Supabase le 2026-10-01
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated, public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Rattrapage : profils des utilisateurs existants (le premier inscrit = admin)
insert into public.profiles (id, email, role)
select u.id, u.email,
  case when u.created_at = (select min(created_at) from auth.users) then 'admin' else 'reception' end
from auth.users u
on conflict (id) do nothing;
