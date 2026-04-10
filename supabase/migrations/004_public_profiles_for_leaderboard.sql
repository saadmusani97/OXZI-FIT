create or replace view public_profiles as
  select id, full_name, avatar_url
  from profiles;

grant select on public_profiles to anon, authenticated;
