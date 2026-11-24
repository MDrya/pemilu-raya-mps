-- PEMIRA — turn demo tools back ON (rehearsals only, never during the real vote).
update public.election set demo_tools = true where id = 1;
select demo_tools from public.election;
