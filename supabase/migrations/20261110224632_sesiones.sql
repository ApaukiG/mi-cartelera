-- =========================================================
-- Épica E2 · Noche de película · sesiones guardadas
-- =========================================================

-- 1. Sesiones -------------------------------------------------
create table public.sesiones (
  id                bigint generated always as identity primary key,
  user_id           uuid not null default auth.uid()
                      references auth.users (id) on delete cascade,
  nombre            text not null,
  tiempo_disponible integer not null,
  tiempo_total      integer not null,
  creada_en         timestamptz not null default now(),

  -- RN-11: 1 a 60 caracteres, sin espacios en los extremos
  constraint sesiones_nombre_largo
    check (char_length(nombre) between 1 and 60),
  constraint sesiones_nombre_sin_espacios_extremos
    check (nombre ~ '^\S(.*\S)?$'),
  -- RN-01
  constraint sesiones_tiempo_disponible_rango
    check (tiempo_disponible between 30 and 600),
  -- RN-04 + SU-04: hay al menos una película y la sesión cabe
  constraint sesiones_tiempo_total_cabe
    check (tiempo_total > 0 and tiempo_total <= tiempo_disponible)
);

-- RN-11: listado por usuario, de la más reciente a la más antigua
create index sesiones_user_creada_idx
  on public.sesiones (user_id, creada_en desc, id desc);

-- 2. Películas de cada sesión (copia propia: RN-10) ---------
create table public.sesion_peliculas (
  id        bigint generated always as identity primary key,
  sesion_id bigint not null
              references public.sesiones (id) on delete cascade,
  user_id   uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  posicion  smallint not null,
  tmdb_id   integer not null,
  titulo    text not null,
  duracion  integer not null,

  constraint sesion_peliculas_posicion_positiva check (posicion >= 1),
  constraint sesion_peliculas_titulo_no_vacio   check (char_length(titulo) > 0),
  -- RN-05: nunca se guarda una duración desconocida o 0
  constraint sesion_peliculas_duracion_positiva check (duracion > 0),
  -- SU-06: orden de agregado; también crea el índice por sesion_id
  constraint sesion_peliculas_posicion_unica unique (sesion_id, posicion),
  -- SU-03: sin repetir película dentro de la misma sesión
  constraint sesion_peliculas_tmdb_unico     unique (sesion_id, tmdb_id)
);

create index sesion_peliculas_user_idx on public.sesion_peliculas (user_id);

-- Sin clave foránea hacia mi_lista: eliminar un título de la lista
-- no toca las sesiones (RN-10). Una película puede estar en varias
-- sesiones porque la unicidad es por sesión (RN-07).

-- 3. RLS ----------------------------------------------------
alter table public.sesiones         enable row level security;
alter table public.sesion_peliculas enable row level security;

create policy "sesiones: ver solo las mias" on public.sesiones
  for select to authenticated using (auth.uid() = user_id);
create policy "sesiones: crear solo las mias" on public.sesiones
  for insert to authenticated with check (auth.uid() = user_id);
create policy "sesiones: borrar solo las mias" on public.sesiones
  for delete to authenticated using (auth.uid() = user_id);

create policy "sesion_peliculas: ver solo las mias" on public.sesion_peliculas
  for select to authenticated using (auth.uid() = user_id);
create policy "sesion_peliculas: crear solo en mis sesiones" on public.sesion_peliculas
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.sesiones s
      where s.id = sesion_id and s.user_id = auth.uid()
    )
  );
create policy "sesion_peliculas: borrar solo las mias" on public.sesion_peliculas
  for delete to authenticated using (auth.uid() = user_id);

-- RN-09: no existe política UPDATE. Además se retira el privilegio,
-- para que un UPDATE falle con error de permisos en vez de afectar
-- 0 filas en silencio.
revoke update on public.sesiones, public.sesion_peliculas from anon, authenticated;
revoke all    on public.sesiones, public.sesion_peliculas from anon;

-- 4. Guardado atómico (sección 2.3) --------------------------
create or replace function public.crear_sesion(
  p_nombre            text,
  p_tiempo_disponible integer,
  p_peliculas         jsonb   -- [{ "tmdb_id": 1, "titulo": "…", "duracion": 95 }, …]
) returns bigint
language plpgsql
security invoker              -- se ejecuta con los permisos y el RLS del usuario
set search_path = public
as $$
declare
  c_pausa constant integer := 10;  -- debe coincidir con PAUSA_MIN (src/dominio/sesion.ts)
  v_n         integer;
  v_total     integer;
  v_sesion_id bigint;
begin
  if p_peliculas is null
     or jsonb_typeof(p_peliculas) <> 'array'
     or jsonb_array_length(p_peliculas) = 0 then
    raise exception 'La sesión necesita al menos una película.' using errcode = 'P0001';
  end if;

  v_n := jsonb_array_length(p_peliculas);

  select sum((e->>'duracion')::integer) + c_pausa * (v_n - 1)
    into v_total
    from jsonb_array_elements(p_peliculas) as e;

  if v_total is null or v_total > p_tiempo_disponible then
    raise exception 'La sesión no cabe en el tiempo disponible.' using errcode = 'P0001';
  end if;

  insert into public.sesiones (nombre, tiempo_disponible, tiempo_total)
  values (p_nombre, p_tiempo_disponible, v_total)
  returning id into v_sesion_id;

  insert into public.sesion_peliculas (sesion_id, posicion, tmdb_id, titulo, duracion)
  select v_sesion_id,
         e.ord::smallint,
         (e.valor->>'tmdb_id')::integer,
         e.valor->>'titulo',
         (e.valor->>'duracion')::integer
    from jsonb_array_elements(p_peliculas) with ordinality as e(valor, ord);

  return v_sesion_id;
end;
$$;

revoke all     on function public.crear_sesion(text, integer, jsonb) from public, anon;
grant  execute on function public.crear_sesion(text, integer, jsonb) to authenticated;
