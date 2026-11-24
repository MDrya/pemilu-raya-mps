-- =============================================================================
-- PEMIRA — prepare for a real election
--
-- 1. Voters are identified by NIM (Nomor Induk Mahasiswa) and have an angkatan.
-- 2. election.demo_tools: when false, demo_reset() and demo_simulate() refuse
--    to run (and the dashboard hides them). Switch with supabase/demo_tools_off.sql
--    and supabase/demo_tools_on.sql.
-- =============================================================================

alter table public.voters rename column nis to nim;
alter table public.voters add column angkatan smallint;

alter table public.election add column demo_tools boolean not null default true;

create or replace function private.require_demo_tools()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select demo_tools from public.election where id = 1) then
    raise exception 'Mode demo dinonaktifkan untuk pemilu sungguhan';
  end if;
end;
$$;


-- Same as before, plus the demo_tools check.
create or replace function public.demo_reset()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_role('panitia');
  perform private.require_demo_tools();

  perform 1 from public.election where id = 1 for update;
  perform 1 from public.booths for update;

  delete from public.booth_assignments where true;
  update public.booths set status = 'terkunci', unlocked_at = null where true;
  update public.voters set status = 'belum' where status <> 'belum';
  update public.tally set vote_count = 0 where true;
  delete from public.public_results where true;
  update public.election set status = 'belum_dibuka', opened_at = null, closed_at = null where id = 1;
  update public.public_turnout
    set status = 'belum_dibuka',
        voted_count = 0,
        total_dpt = (select count(*) from public.voters)
    where id = 1;
end;
$$;


create or replace function public.demo_simulate(n int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  election_status text;
  picked_voter uuid;
  chosen uuid;
  cast_count int := 0;
begin
  perform private.require_role('panitia');
  perform private.require_demo_tools();

  if n is null or n < 1 or n > 1000 then
    raise exception 'Jumlah pemilih harus antara 1 dan 1000';
  end if;

  select status into election_status from public.election where id = 1 for share;
  if election_status <> 'dibuka' then
    raise exception 'Pemungutan suara belum dibuka';
  end if;

  for picked_voter in
    select id from public.voters where status = 'belum'
    order by random() limit n
    for update skip locked
  loop
    select candidate_id into chosen from public.tally order by random() limit 1;
    update public.voters set status = 'sudah' where id = picked_voter;
    update public.tally set vote_count = vote_count + 1 where candidate_id = chosen;
    cast_count := cast_count + 1;
  end loop;

  update public.public_turnout set voted_count = voted_count + cast_count where id = 1;
  return cast_count;
end;
$$;
