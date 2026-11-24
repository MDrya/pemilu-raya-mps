-- PEMIRA — turn demo tools OFF before the real vote.
-- Reset Demo and Simulasi are hidden in the dashboard and refused by the database.
update public.election set demo_tools = false where id = 1;
select demo_tools from public.election;
