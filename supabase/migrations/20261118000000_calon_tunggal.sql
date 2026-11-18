-- =============================================================================
-- PEMILU — support a single candidate (calon tunggal) vs "kotak kosong"
--
-- - candidates.kind: 'calon' (a person or pair) or 'kotak_kosong' (empty box)
-- - wakil_nama becomes optional: a candidate can run without a deputy
--
-- Additive only: existing rows become kind = 'calon'. No function changes are
-- needed: votes still go to whichever candidates row the voter picks.
-- =============================================================================

alter table public.candidates
  add column kind text not null default 'calon'
  check (kind in ('calon', 'kotak_kosong'));

alter table public.candidates
  alter column wakil_nama drop not null;

-- At most one kotak kosong option per election.
create unique index candidates_one_kotak_kosong
  on public.candidates (kind) where kind = 'kotak_kosong';
