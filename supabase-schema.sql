-- Script para correr en el SQL Editor de Supabase (1 clic)
-- https://supabase.com/dashboard/project/_/sql

create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  parentesco text not null, -- ej: 'Abuelita', 'Tía Martha'
  eps text,
  telefono text,
  notas text,
  created_at timestamptz default now()
);

create table if not exists citas (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade not null,
  especialidad text not null, -- ej: 'Cardiología', 'Medicina General'
  doctor text,
  fecha_hora timestamptz not null,
  lugar text not null, -- ej: 'Clínica Colombia', 'Sede EPS Calle 100'
  direccion text,
  acompanante text, -- Nombre del nieto/familiar asignado
  acompanante_telefono text,
  estado text default 'pendiente', -- 'pendiente', 'acompanada', 'completada'
  notas text,
  created_at timestamptz default now()
);

-- Habilitar RLS (acceso público para uso familiar simple)
alter table personas enable row level security;
alter table citas enable row level security;

create policy "Lectura pública personas" on personas for select using (true);
create policy "Inserción pública personas" on personas for insert with check (true);
create policy "Edición pública personas" on personas for update using (true);

create policy "Lectura pública citas" on citas for select using (true);
create policy "Inserción pública citas" on citas for insert with check (true);
create policy "Edición pública citas" on citas for update using (true);
