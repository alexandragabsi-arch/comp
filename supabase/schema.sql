-- ============================================================
-- LegalCorners — Schéma Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- Profils publics (sync avec auth.users)
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  name       text,
  role       text default 'client',  -- 'client' | 'admin'
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "chacun voit son profil"  on profiles for select using (auth.uid() = id);
create policy "admins voient tout"      on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Trigger pour créer le profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Dossiers (dissolution, cession, sommeil)
-- ============================================================
create table if not exists dossiers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  -- Identification
  siren               text,
  company_name        text,
  forme_juridique     text,
  -- Formalité
  type                text default 'dissolution',  -- dissolution | cession | sommeil
  status              text default 'brouillon',    -- brouillon | en_cours | signe | depose_inpi | termine | erreur
  -- Données brutes du formulaire (JSON)
  data                jsonb default '{}',
  -- Stripe
  stripe_session_id   text,
  stripe_paid         boolean default false,
  -- YouSign
  yousign_request_id  text,
  yousign_status      text,  -- pending | completed
  -- INPI
  inpi_formality_id   text,
  inpi_liasse_number  text,
  inpi_paid_by_mandat boolean default false,
  -- Timestamps
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table dossiers enable row level security;
create policy "client voit ses dossiers"   on dossiers for select using (auth.uid() = user_id);
create policy "client crée ses dossiers"   on dossiers for insert with check (auth.uid() = user_id);
create policy "client met à jour les siens" on dossiers for update using (auth.uid() = user_id);
create policy "admin voit tout"            on dossiers for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger dossiers_updated_at before update on dossiers
  for each row execute procedure public.set_updated_at();

-- Index
create index if not exists dossiers_user_id_idx on dossiers(user_id);
create index if not exists dossiers_status_idx  on dossiers(status);
create index if not exists dossiers_siren_idx   on dossiers(siren);
