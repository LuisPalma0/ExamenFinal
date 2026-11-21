-- =====================================================================
-- GESTIÓN DE EQUIPO DE LABORATORIOS - Script completo para Supabase
-- Pégalo completo en SQL Editor de un proyecto NUEVO y presiona Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) TABLAS
-- ---------------------------------------------------------------------

-- Un perfil por cada usuario que se registra (estudiante o admin)
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  carnet text not null unique,
  carrera text not null,
  rol text not null default 'estudiante' check (rol in ('estudiante', 'admin')),
  foto_path text,
  creado_en timestamptz not null default now()
);

-- Cada fila es un equipo físico del laboratorio
create table public.equipos (
  id bigint generated always as identity primary key,
  nombre text not null,
  descripcion text not null default '',
  disponible boolean not null default true,
  activo boolean not null default true
);

-- Cada fila es una solicitud de préstamo vinculada a un usuario y a un equipo
create table public.prestamos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  equipo_id bigint not null references public.equipos (id),
  fecha_prestamo date not null,
  fecha_devolucion date not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobado', 'rechazado', 'devuelto')),
  solicitado_en timestamptz not null default now(),
  devuelto_en timestamptz,
  check (fecha_devolucion >= fecha_prestamo)
);

-- Un estudiante no puede tener dos solicitudes pendientes del mismo equipo
create unique index una_solicitud_pendiente
  on public.prestamos (usuario_id, equipo_id)
  where estado = 'pendiente';

-- ---------------------------------------------------------------------
-- 2) FUNCIÓN AUXILIAR: ¿el usuario actual es administrador?
-- ---------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 3) TRIGGER: crea el perfil automáticamente al registrarse
--    El rol SIEMPRE es 'estudiante'. Nunca se toma de lo que manda la app.
-- ---------------------------------------------------------------------
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, carnet, carrera, rol)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), 'Sin nombre'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'carnet'), ''), 'SIN-' || left(new.id::text, 8)),
    coalesce(nullif(trim(new.raw_user_meta_data->>'carrera'), ''), 'No indicada'),
    'estudiante'
  );
  return new;
end;
$$;

create trigger al_crear_usuario
after insert on auth.users
for each row execute function public.crear_perfil();

-- ---------------------------------------------------------------------
-- 4) SEGURIDAD (RLS): quién puede ver qué
--    No hay políticas de insert/update/delete: los cambios solo se
--    hacen con las funciones de la sección 5, que validan todo.
-- ---------------------------------------------------------------------
alter table public.perfiles enable row level security;
alter table public.equipos enable row level security;
alter table public.prestamos enable row level security;

create policy "perfiles: ver el propio o admin"
  on public.perfiles for select to authenticated
  using (id = auth.uid() or public.es_admin());

create policy "equipos: ver activos"
  on public.equipos for select to authenticated
  using (activo or public.es_admin());

create policy "prestamos: ver los propios o admin"
  on public.prestamos for select to authenticated
  using (usuario_id = auth.uid() or public.es_admin());

grant select on public.perfiles, public.equipos, public.prestamos to authenticated;

-- ---------------------------------------------------------------------
-- 5) FUNCIONES QUE LA APP LLAMA
-- ---------------------------------------------------------------------

-- Estudiante: solicitar un préstamo (queda 'pendiente')
create or replace function public.solicitar_prestamo(p_equipo bigint, p_dias int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hoy date := (now() at time zone 'America/Guatemala')::date;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
  end if;
  if p_dias is null or p_dias < 1 or p_dias > 14 then
    raise exception 'Los días de préstamo deben estar entre 1 y 14';
  end if;
  if not exists (select 1 from public.perfiles where id = auth.uid()) then
    raise exception 'Tu usuario no tiene perfil';
  end if;
  if not exists (
    select 1 from public.equipos
    where id = p_equipo and activo and disponible
  ) then
    raise exception 'El equipo no está disponible';
  end if;

  insert into public.prestamos (usuario_id, equipo_id, fecha_prestamo, fecha_devolucion)
  values (auth.uid(), p_equipo, hoy, hoy + p_dias);
end;
$$;

-- Admin: aprobar (p_aprobar = true) o rechazar (false) una solicitud pendiente
create or replace function public.resolver_prestamo(p_id bigint, p_aprobar boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_equipo bigint;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede hacer esto';
  end if;

  select equipo_id into v_equipo
  from public.prestamos
  where id = p_id and estado = 'pendiente'
  for update;

  if v_equipo is null then
    raise exception 'La solicitud no existe o ya fue resuelta';
  end if;

  if p_aprobar then
    if not exists (select 1 from public.equipos where id = v_equipo and disponible) then
      raise exception 'El equipo ya no está disponible';
    end if;
    update public.prestamos set estado = 'aprobado' where id = p_id;
    update public.equipos set disponible = false where id = v_equipo;
  else
    update public.prestamos set estado = 'rechazado' where id = p_id;
  end if;
end;
$$;

-- Admin: marcar un préstamo aprobado como devuelto (el equipo vuelve a estar disponible)
create or replace function public.marcar_devuelto(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_equipo bigint;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede hacer esto';
  end if;

  select equipo_id into v_equipo
  from public.prestamos
  where id = p_id and estado = 'aprobado'
  for update;

  if v_equipo is null then
    raise exception 'El préstamo no existe o no está aprobado';
  end if;

  update public.prestamos
  set estado = 'devuelto', devuelto_en = now()
  where id = p_id;
  update public.equipos set disponible = true where id = v_equipo;
end;
$$;

-- Usuario: guardar la ruta de su propia foto
create or replace function public.guardar_foto(p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No hay sesión';
  end if;
  if p_path <> auth.uid()::text || '/perfil.jpg' then
    raise exception 'Ruta no permitida';
  end if;
  update public.perfiles set foto_path = p_path where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------
-- 6) FOTOS: bucket privado y sus reglas
--    Cada usuario solo escribe dentro de su carpeta (su id). El admin puede ver todas.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

create policy "fotos: subir la propia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos: reemplazar la propia"
  on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos: ver la propia o admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'fotos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin())
  );

-- ---------------------------------------------------------------------
-- 7) EQUIPOS DE EJEMPLO (puedes cambiarlos o agregar más en Table Editor)
-- ---------------------------------------------------------------------
insert into public.equipos (nombre, descripcion) values
  ('Osciloscopio digital', 'Osciloscopio de 2 canales, 100 MHz, con 2 puntas de prueba.'),
  ('Multímetro Fluke', 'Multímetro digital para medir voltaje, corriente y resistencia.'),
  ('Fuente de poder regulable', 'Fuente de 0 a 30 V y hasta 5 A.'),
  ('Generador de funciones', 'Genera señales senoidales, cuadradas y triangulares.'),
  ('Kit Arduino Uno', 'Placa Arduino Uno con cable USB, protoboard y componentes básicos.'),
  ('Estación de soldadura', 'Soldador con temperatura regulable y soporte.');
