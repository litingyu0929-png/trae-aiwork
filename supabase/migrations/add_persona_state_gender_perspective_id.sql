alter table public.personas
  add column if not exists persona_state text not null default 'growth';

alter table public.personas
  add column if not exists gender text not null default 'neutral';

alter table public.personas
  add column if not exists perspective_id text not null default 'neutral';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'personas_persona_state_check'
  ) then
    alter table public.personas
      add constraint personas_persona_state_check
      check (persona_state in ('newbie', 'growth', 'veteran'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'personas_gender_check'
  ) then
    alter table public.personas
      add constraint personas_gender_check
      check (gender in ('male', 'female', 'neutral'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'personas_perspective_id_check'
  ) then
    alter table public.personas
      add constraint personas_perspective_id_check
      check (perspective_id in ('male', 'female', 'neutral'));
  end if;
end $$;

