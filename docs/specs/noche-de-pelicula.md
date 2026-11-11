# Spec técnica — Épica E2 "Noche de película"

Ticket: **E2-T02**. Estado: lista para implementar.

## 1. Resumen y referencias

Noche de película permite al usuario indicar cuántos minutos tiene, ver qué películas «por ver» de su lista caben en ese tiempo, armar una sesión con pausas de 10 minutos entre películas y guardarla con un nombre. Las sesiones guardadas se consultan y se eliminan, pero no se editan.

| Documento                      | Qué aporta a esta spec                                         |
| ------------------------------ | -------------------------------------------------------------- |
| `docs/prd/PRD.md`              | Reglas RN-01 a RN-15 y supuestos SU-01 a SU-07                 |
| `docs/backlog/historias.md`    | Historias HU-01 a HU-06 y criterios CA-01.1 a CA-06.4          |
| `docs/backlog/refinamiento.md` | Casos borde CB-01 a CB-21 (aceptados y rechazados)             |
| `docs/backlog/tickets.md`      | Tickets E2-T00 a E2-T15 y su orden                             |
| `DESIGN.md`                    | Tokens, clases y criterios DIS-01 a DIS-15                     |
| `docs/ESTADO-INICIAL.md`       | Código de la E1 que no se debe romper; deudas D-xx             |
| `AGENTS.md`                    | Reglas de trabajo (dominio puro, servicios, sin `any`, claves) |

**Decisiones de diseño principales**

- Toda la lógica (validar, sumar, decidir si cabe, clasificar, ordenar) vive en funciones puras de `src/dominio/`, con tests en Vitest.
- El guardado es **atómico**: una función de PostgreSQL (`crear_sesion`) inserta la sesión y sus películas en una sola transacción (sección 2.3).
- Las duraciones se piden a TMDB **una vez al entrar** en la vista; cambiar el tiempo solo recalcula en el cliente.
- La navegación entre vistas usa un estado en `App.tsx`, sin router. Mi lista permanece montada (oculta) para que la E1 conserve su estado.

---

## 2. Modelo de datos

### 2.1 Migración

Archivo: `supabase/migrations/<AAAAMMDDHHMMSS>_sesiones.sql` (E2-T05). No toca la tabla `mi_lista` de la E1.

```sql
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
```

### 2.2 Qué garantiza cada parte

| Garantía                                       | Mecanismo                                                         | Regla        |
| ---------------------------------------------- | ----------------------------------------------------------------- | ------------ |
| Tiempo entero entre 30 y 600                   | `sesiones_tiempo_disponible_rango`                                | RN-01        |
| La sesión guardada cabe                        | `sesiones_tiempo_total_cabe` + cálculo en `crear_sesion`          | RN-03, RN-04 |
| Nunca se guarda una duración desconocida o 0   | `sesion_peliculas_duracion_positiva`                              | RN-05        |
| Una película puede estar en varias sesiones    | Unicidad por `(sesion_id, tmdb_id)`, no global                    | RN-07        |
| Las sesiones no se modifican                   | Sin política UPDATE y `revoke update`                             | RN-09        |
| La sesión no depende de `mi_lista`             | Copia de `tmdb_id`, `titulo` y `duracion`; sin FK a `mi_lista`    | RN-10        |
| Nombre de 1 a 60, sin espacios en los extremos | `sesiones_nombre_largo` y `sesiones_nombre_sin_espacios_extremos` | RN-11        |
| Sin límites de cantidad                        | Ninguna restricción de conteo                                     | RN-15        |
| Sin repetir película en la sesión              | `sesion_peliculas_tmdb_unico`                                     | SU-03        |
| Al menos una película                          | `crear_sesion` rechaza el arreglo vacío; `tiempo_total > 0`       | SU-04        |
| Se conserva el tiempo disponible               | Columna `tiempo_disponible`                                       | SU-05        |
| Orden de agregado                              | Columna `posicion` (orden del arreglo)                            | SU-06        |
| Privacidad                                     | RLS `auth.uid() = user_id` en las dos tablas                      | HU-06        |

`char_length` cuenta caracteres (puntos de código). En el cliente se cuenta igual con `[...nombre].length` (S-15), así que la ñ y las letras con tilde cuentan como uno en los dos lados.

### 2.3 Cómo se evita una sesión sin películas

El cliente **no** inserta en `sesiones` y luego en `sesion_peliculas` con dos llamadas: si la segunda fallara, quedaría una sesión huérfana. En su lugar, el servicio llama una sola vez a `supabase.rpc('crear_sesion', …)`:

1. Una función de PostgreSQL se ejecuta dentro de **una única transacción**. Si cualquier `insert` falla (por un `check`, por RLS o por la red a mitad de la llamada), PostgreSQL deshace todo y no queda ni la sesión ni ninguna película.
2. La función rechaza el arreglo vacío antes de insertar nada (SU-04).
3. La función **recalcula** el tiempo total en el servidor con la misma fórmula de RN-03 y rechaza la sesión si no cabe, aunque el cliente la haya validado.
4. `security invoker` hace que las políticas RLS se apliquen igual que en una inserción directa: el usuario solo puede crear sesiones propias.

**Limitación aceptada:** como las tablas tienen política `insert` (requisito de RLS), un usuario que use la API por fuera de la app podría insertar en `sesiones` sin pasar por `crear_sesion` y dejar una sesión sin películas. Solo afectaría a sus propios datos: el RLS impide tocar los de otros, y los `check` siguen aplicándose.

---

## 3. Dominio (`src/dominio/`)

Funciones puras: sin red, sin Supabase, sin `Date.now()` y sin estado global. Importan solo tipos de `src/types.ts` y de otros archivos de `src/dominio/`.

### 3.1 `src/dominio/sesion.ts` — tiempo, pausas y "cabe" (E2-T03)

```ts
export const PAUSA_MIN = 10
export const TIEMPO_MIN = 30
export const TIEMPO_MAX = 600

export type ErrorTiempo = 'vacio' | 'no_entero' | 'fuera_de_rango'

export type ResultadoTiempo =
  { ok: true; minutos: number } | { ok: false; error: ErrorTiempo }

/** Texto del campo → minutos. Acepta solo dígitos (con espacios en los extremos). */
export function validarTiempoDisponible(entrada: string): ResultadoTiempo

/** true si el tiempo es un entero entre TIEMPO_MIN y TIEMPO_MAX. */
export function esTiempoValido(minutos: number): boolean

/** true si la duración es un entero > 0. null, 0, negativos y decimales son desconocidos. */
export function duracionConocida(duracion: number | null): duracion is number

/** Suma de duraciones + pausa × (n − 1). Sesión vacía → 0. */
export function tiempoTotal(
  duraciones: readonly number[],
  pausa: number = PAUSA_MIN,
): number

/**
 * true si la sesión cabe: tiempoTotal(duraciones, pausa) <= tiempoDisponible.
 * Devuelve false si el tiempo no es válido o si alguna duración no es conocida.
 */
export function cabe(
  tiempoDisponible: number,
  duraciones: readonly number[],
  pausa: number = PAUSA_MIN,
): boolean

export interface Balance {
  total: number // tiempo ocupado (duraciones + pausas)
  restante: number // max(0, disponible − total)
  exceso: number // max(0, total − disponible)
}

export function balance(
  tiempoDisponible: number,
  duraciones: readonly number[],
  pausa: number = PAUSA_MIN,
): Balance

/** Minutos de pausa de una sesión con esa cantidad de películas: pausa × (n − 1); 0 si hay 0 o 1. */
export function minutosDePausas(
  cantidadPeliculas: number,
  pausa: number = PAUSA_MIN,
): number

/** Minutos que añade una película: su duración, más la pausa si la sesión no está vacía. */
export function minutosNecesarios(
  duracion: number,
  peliculasEnSesion: number,
  pausa: number = PAUSA_MIN,
): number

export type ResultadoGuardable =
  | { ok: true }
  | { ok: false; motivo: 'sin_peliculas' }
  | { ok: false; motivo: 'excede'; exceso: number }

/** ¿Se puede guardar? Exige al menos una película y que la sesión quepa. */
export function validarSesionParaGuardar(
  tiempoDisponible: number,
  duraciones: readonly number[],
  pausa: number = PAUSA_MIN,
): ResultadoGuardable
```

| Función                    | Devuelve                                                            | Implementa              |
| -------------------------- | ------------------------------------------------------------------- | ----------------------- |
| `validarTiempoDisponible`  | Minutos o el tipo de error                                          | RN-01, CB-07            |
| `esTiempoValido`           | `boolean`                                                           | RN-01                   |
| `duracionConocida`         | `boolean` (guarda de tipo)                                          | RN-05 (0 = desconocida) |
| `tiempoTotal`              | Minutos                                                             | RN-03                   |
| `minutosDePausas`          | Minutos de pausa (para el resumen "incluye {pausas} min de pausas") | RN-03                   |
| `cabe`                     | `boolean`                                                           | RN-03, RN-04            |
| `balance`                  | Total, restante y exceso                                            | RN-04, RN-12, CB-21     |
| `minutosNecesarios`        | Minutos                                                             | RN-03, SU-02, CB-09     |
| `validarSesionParaGuardar` | `ok`, o el motivo (y el exceso)                                     | RN-04, RN-12, SU-04     |

**Tests — `src/dominio/sesion.test.ts`**

| describe                   | it                                                                          |
| -------------------------- | --------------------------------------------------------------------------- |
| `validarTiempoDisponible`  | acepta 30 y 600 (límites)                                                   |
|                            | **rechaza 29 y 601 como fuera_de_rango**                                    |
|                            | rechaza "" y " " como vacio                                                 |
|                            | rechaza "90,5", "90.5", "noventa" y "-60" como no_entero                    |
|                            | acepta " 120 " como 120 y "090" como 90                                     |
| `duracionConocida`         | 95 es conocida                                                              |
|                            | **null y 0 son desconocidas**                                               |
|                            | -5 y 90.5 son desconocidas                                                  |
| `tiempoTotal`              | una sesión vacía suma 0                                                     |
|                            | **una sola película no lleva pausa (100 → 100)**                            |
|                            | dos películas llevan una pausa (100 + 10 + 60 = 170)                        |
|                            | tres películas llevan dos pausas (90, 100, 80 → 290)                        |
|                            | quitar la del medio deja una pausa (90, 80 → 180)                           |
|                            | usa la pausa recibida por parámetro                                         |
|                            | la pausa por defecto es PAUSA_MIN                                           |
| `minutosDePausas`          | 0 y 1 películas no llevan pausas                                            |
|                            | 3 películas llevan 20 min de pausas                                         |
| `cabe`                     | **una sesión que ocupa exactamente el tiempo disponible cabe (170 en 170)** |
|                            | un minuto más que el tiempo disponible no cabe (171 en 170)                 |
|                            | **una sola película igual al tiempo cabe, sin pausa (120 en 120)**          |
|                            | una sesión vacía cabe                                                       |
|                            | **con una duración desconocida (0) no cabe**                                |
|                            | **con un tiempo fuera de rango (29 o 601) no cabe**                         |
|                            | con un tiempo no entero (90.5) no cabe                                      |
| `balance`                  | 170 de 180 → restante 10, exceso 0                                          |
|                            | 170 de 150 → restante 0, exceso 20                                          |
|                            | exacto → restante 0, exceso 0                                               |
| `minutosNecesarios`        | con la sesión vacía es solo la duración                                     |
|                            | con películas en la sesión suma la pausa (15 → 25)                          |
| `validarSesionParaGuardar` | una sesión vacía → sin_peliculas                                            |
|                            | una sesión que se excede → excede con los minutos de exceso                 |
|                            | una sesión exacta → ok                                                      |

### 3.2 `src/dominio/candidatas.ts` — qué cabe, motivos y orden (E2-T04)

```ts
import type { TituloGuardado, TipoContenido, Estado } from '../types'

export interface PeliculaCandidata {
  tmdbId: number
  titulo: string
  posterUrl: string | null
  tipo: TipoContenido
  estado: Estado
  duracion: number | null // minutos; null o 0 = desconocida
  errorDuracion: boolean // true si TMDB falló para esta película
}

/** Copia que entra en la sesión y que se guarda (RN-10). */
export interface PeliculaEnSesion {
  tmdbId: number
  titulo: string
  duracion: number
}

export interface DuracionObtenida {
  tmdbId: number
  duracion: number | null
  error: boolean
}

export type MotivoNoDisponible =
  | { tipo: 'no_cabe'; necesita: number; quedan: number; conPausa: boolean }
  | { tipo: 'sin_duracion' }
  | { tipo: 'error_duracion' }

export interface NoDisponible {
  pelicula: PeliculaCandidata
  motivo: MotivoNoDisponible
}

export interface Clasificacion {
  caben: PeliculaCandidata[] // ordenadas por RN-08
  noDisponibles: NoDisponible[] // no caben (por duración), luego sin duración o con error (por título)
}

/** Títulos de la lista que pueden entrar en Noche de película: películas «por ver». */
export function peliculasPorVer(
  titulos: readonly TituloGuardado[],
): TituloGuardado[]

/** Une cada título con su duración. Un título sin duración obtenida queda con errorDuracion = true. */
export function aCandidatas(
  titulos: readonly TituloGuardado[],
  duraciones: readonly DuracionObtenida[],
): PeliculaCandidata[]

/** Duración ascendente; en empate, título con localeCompare('es', { sensitivity: 'base' }). */
export function compararPorDuracionYTitulo(
  a: { titulo: string; duracion: number },
  b: { titulo: string; duracion: number },
): number

/**
 * Clasifica las candidatas contra el tiempo que queda (SU-02).
 * Excluye las series, los títulos que no están «por ver» y las películas ya agregadas.
 * Lanza RangeError si tiempoDisponible no es válido (precondición: validarTiempoDisponible).
 */
export function clasificarCandidatas(
  candidatas: readonly PeliculaCandidata[],
  sesion: readonly PeliculaEnSesion[],
  tiempoDisponible: number,
  pausa: number = PAUSA_MIN,
): Clasificacion

/** Convierte una candidata que cabe en la copia para la sesión. Lanza RangeError si la duración no es conocida. */
export function aPeliculaEnSesion(
  candidata: PeliculaCandidata,
): PeliculaEnSesion
```

| Función                      | Implementa                                                                  |
| ---------------------------- | --------------------------------------------------------------------------- |
| `peliculasPorVer`            | RN-02, SU-01                                                                |
| `aCandidatas`                | RN-05, CB-05                                                                |
| `compararPorDuracionYTitulo` | RN-08, CB-04                                                                |
| `clasificarCandidatas`       | RN-02, RN-04, RN-05, RN-08, SU-01, SU-02, SU-03, CB-03, CB-04, CB-09, CB-20 |
| `aPeliculaEnSesion`          | RN-05, RN-10                                                                |

**Tests — `src/dominio/candidatas.test.ts`**

| describe                     | it                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `peliculasPorVer`            | solo deja películas en estado por_ver                                                           |
|                              | excluye las series                                                                              |
| `aCandidatas`                | une cada título con su duración por tmdbId                                                      |
|                              | marca errorDuracion cuando la duración falló o falta                                            |
| `compararPorDuracionYTitulo` | ordena por duración ascendente                                                                  |
|                              | desempata por título sin distinguir mayúsculas ni tildes                                        |
| `clasificarCandidatas`       | con 120 min incluye las que duran 120 o menos, con su duración                                  |
|                              | **una película de exactamente 120 cabe en 120**                                                 |
|                              | excluye las que están viendo o vista                                                            |
|                              | excluye las series                                                                              |
|                              | **una película sin duración es no disponible con motivo sin_duracion**                          |
|                              | **una duración 0 es no disponible con motivo sin_duracion**                                     |
|                              | una duración con error es no disponible con motivo error_duracion                               |
|                              | ordena Beta (88), Alfa (95), Zeta (95)                                                          |
|                              | las que no caben van después, por duración; las que no tienen duración van al final, por título |
|                              | una película de 140 con 120 min → no_cabe, necesita 140, quedan 120, sin pausa                  |
|                              | con 20 restantes cabe la de 10 y no la de 15 (necesita 25, con pausa)                           |
|                              | una película ya agregada no aparece                                                             |
|                              | al quitar una película de la sesión vuelve a ser candidata                                      |
|                              | una película de 700 min nunca cabe                                                              |
|                              | sin películas por ver → caben y noDisponibles vacíos                                            |
|                              | si ninguna cabe → caben vacío                                                                   |
|                              | **un tiempo fuera de rango (29 o 601) lanza RangeError**                                        |
| `aPeliculaEnSesion`          | copia tmdbId, título y duración                                                                 |
|                              | lanza RangeError si la duración no es conocida                                                  |

### 3.3 `src/dominio/nombre.ts` — nombre de la sesión (E2-T04)

```ts
export const NOMBRE_MAX = 60

export type ResultadoNombre =
  | { ok: true; nombre: string } // ya recortado
  | { ok: false; error: 'vacio' | 'demasiado_largo' }

/** Quita los espacios de los extremos (String.prototype.trim) y cuenta caracteres con [...nombre].length. */
export function validarNombreSesion(entrada: string): ResultadoNombre
```

Implementa RN-11, RN-13 (no compara con otros nombres) y CB-12.

**Tests — `src/dominio/nombre.test.ts`**

| describe              | it                                                           |
| --------------------- | ------------------------------------------------------------ |
| `validarNombreSesion` | "Viernes de terror" es válido                                |
|                       | "" → vacio                                                   |
|                       | " " (solo espacios) → vacio                                  |
|                       | " Maratón de domingo " → "Maratón de domingo"                |
|                       | 60 caracteres es válido                                      |
|                       | 61 caracteres → demasiado_largo                              |
|                       | 60 caracteres con ñ y tildes es válido                       |
|                       | 60 caracteres con espacios alrededor es válido tras recortar |

### 3.4 `src/dominio/duracion.ts` — lectura de la duración de TMDB (E2-T06)

```ts
/** Valor del campo runtime de TMDB → minutos, o null si no es un entero > 0. */
export function normalizarDuracion(valor: unknown): number | null
```

Implementa RN-05 (0 = desconocida). Recibe `unknown` para que el servicio no necesite `any`.

**Tests — `src/dominio/duracion.test.ts`**

| describe             | it                      |
| -------------------- | ----------------------- |
| `normalizarDuracion` | 95 → 95                 |
|                      | **0 → null**            |
|                      | null y undefined → null |
|                      | "95" (texto) → null     |
|                      | -10 y 95.5 → null       |

---

## 4. Servicios

Los servicios son los únicos que hablan con TMDB y Supabase (regla 5 de `AGENTS.md`). Siempre lanzan `Error` con un mensaje en español listo para mostrarse.

### 4.1 `src/lib/tmdb.ts` — duración (E2-T06)

Se **añade** al archivo; `buscarTitulos` y `obtenerDetalle` no cambian.

```ts
import type { DuracionObtenida } from '../dominio/candidatas'

/** Duración en minutos de una película, o null si TMDB no la conoce (0 = null). */
export async function obtenerDuracion(tmdbId: number): Promise<number | null>

/**
 * Duraciones de varias películas, con un máximo de 5 peticiones simultáneas.
 * Si falla alguna, esa queda con error: true y el resto se devuelve igual (CB-05).
 * Si fallan todas, lanza Error (CB-06).
 */
export async function obtenerDuraciones(
  tmdbIds: readonly number[],
): Promise<DuracionObtenida[]>
```

- Endpoint: `https://api.themoviedb.org/3/movie/{tmdbId}?api_key=…&language=es-ES`. La clave se lee solo con `import.meta.env.VITE_TMDB_API_KEY`.
- La respuesta se lee como `unknown` (`const datos: unknown = await respuesta.json()`). Se comprueba que es un objeto con `'runtime' in datos` y se pasa a `normalizarDuracion`. Sin `any` ni `as`.
- Una lista vacía de ids devuelve `[]` sin hacer peticiones.

| Situación                          | Mensaje                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| `obtenerDuracion`, respuesta no OK | `No se pudo obtener la duración de la película (TMDB respondió {status}).`              |
| `obtenerDuracion`, fallo de red    | `No se pudo conectar con TMDB para obtener la duración.`                                |
| `obtenerDuraciones`, fallan todas  | `No pudimos consultar las duraciones en TMDB. Revisa tu conexión e inténtalo de nuevo.` |

**Test — `src/lib/tmdb.test.ts`** (con `fetch` simulado mediante `vi.stubGlobal`, sin red real):

- `obtenerDuraciones` › si fallan algunas, marca error solo en esas;
- `obtenerDuraciones` › si fallan todas, lanza el mensaje en español;
- `obtenerDuraciones` › una lista vacía no hace peticiones.

### 4.2 `src/lib/sesiones.ts` — sesiones (E2-T07)

```ts
import type { PeliculaEnSesion } from '../dominio/candidatas'

export interface NuevaSesion {
  nombre: string // ya validado y recortado (validarNombreSesion)
  tiempoDisponible: number // ya validado
  peliculas: readonly PeliculaEnSesion[] // en orden de agregado
}

export interface SesionGuardada {
  id: number
  nombre: string
  tiempoDisponible: number
  tiempoTotal: number
  creadaEn: string // ISO 8601
  peliculas: PeliculaEnSesion[] // ordenadas por posición
}

/** Llama a la RPC crear_sesion y devuelve el id de la sesión creada. */
export async function crearSesion(nueva: NuevaSesion): Promise<number>

/** Sesiones del usuario, de la más reciente a la más antigua, con sus películas en orden. */
export async function listarSesiones(): Promise<SesionGuardada[]>

/** Elimina una sesión propia (sus películas se borran en cascada). */
export async function eliminarSesion(id: number): Promise<void>

/** Convierte una fila de la consulta (unknown) en SesionGuardada; lanza Error si la forma no es válida. */
export function leerSesionGuardada(fila: unknown): SesionGuardada
```

- `crearSesion` envía `p_peliculas` como `[{ tmdb_id, titulo, duracion }]` en el orden recibido.
- `listarSesiones` hace una sola consulta:
  - `select('id, nombre, tiempo_disponible, tiempo_total, creada_en, sesion_peliculas(posicion, tmdb_id, titulo, duracion)')`;
  - `.order('creada_en', { ascending: false })` y `.order('id', { ascending: false })`;
  - `.order('posicion', { referencedTable: 'sesion_peliculas' })`.

  Cada fila pasa por `leerSesionGuardada`, que valida la forma sin casts.

- `eliminarSesion` usa `.delete().eq('id', id).select('id')`. Si no devuelve filas (no existe o no es del usuario), lanza error.

| Situación                                 | Mensaje                                                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `crearSesion`, error `P0001` de la RPC    | El mensaje de la RPC tal cual (`La sesión necesita al menos una película.` / `La sesión no cabe en el tiempo disponible.`) |
| `crearSesion`, error `23514` (check)      | `La sesión no es válida: revisa el nombre y que quepa en tu tiempo.`                                                       |
| `crearSesion`, cualquier otro error       | `No se pudo guardar la sesión. Revisa tu conexión e inténtalo de nuevo.`                                                   |
| `listarSesiones`, error                   | `No se pudieron cargar tus sesiones. Inténtalo de nuevo.`                                                                  |
| `listarSesiones`, fila con forma inválida | `Una sesión guardada tiene datos incompletos.`                                                                             |
| `eliminarSesion`, error                   | `No se pudo eliminar la sesión. Inténtalo de nuevo.`                                                                       |
| `eliminarSesion`, 0 filas                 | `La sesión no existe o no te pertenece.`                                                                                   |

**Test — `src/lib/sesiones.test.ts`** (solo la función pura, sin red):

- `leerSesionGuardada` › convierte una fila válida;
- `leerSesionGuardada` › ordena las películas por posición;
- `leerSesionGuardada` › lanza Error si falta un campo.

La lista de la E1 se sigue leyendo con `obtenerLista()` de `src/lib/lista.ts`, sin cambios.

---

## 5. Componentes e interfaz

### 5.1 Navegación sin router (E2-T09)

Cambios en `src/App.tsx`:

- Estado nuevo: `const [vista, setVista] = useState<'mi-lista' | 'noche'>('mi-lista')`.
- En el `header`, entre el correo y "Cerrar sesión", un `<nav aria-label="Secciones">` con dos `button type="button"`: **"Mi lista"** y **"Noche de película"**. La vista activa lleva `aria-current="page"`.
- `Buscador` y `MiLista` se envuelven en `<div hidden={vista !== 'mi-lista'}>`. **Siguen montados** al cambiar de vista, así que conservan su estado y su comportamiento (la E1 no cambia).
- `NocheDePelicula` se monta solo cuando `vista === 'noche'`. Cada vez que se entra, recarga la lista y las duraciones (CB-17).
- Cuando la sesión pasa a `null` (cierre de sesión), `vista` vuelve a `'mi-lista'`. Sin sesión, `App` sigue mostrando `Auth` (CA-06.3).

### 5.2 Componentes nuevos (`src/components/noche/`)

| Componente          | Props                                                                                                                 | Estado interno                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NocheDePelicula`   | —                                                                                                                     | `carga: 'cargando' \| 'lista' \| 'error'`, `errorCarga: string \| null`, `candidatas: PeliculaCandidata[]`, `tiempo: number \| null`, `sesion: PeliculaEnSesion[]`, `exito: string \| null`, `recargaSesiones: number` |
| `FormularioTiempo`  | `onConfirmar: (minutos: number) => void`, `onInvalido: () => void`                                                    | `texto: string`, `error: ErrorTiempo \| null`                                                                                                                                                                          |
| `ListaCandidatas`   | `clasificacion: Clasificacion`, `tiempo: number`, `sesionVacia: boolean`, `onAgregar: (p: PeliculaCandidata) => void` | —                                                                                                                                                                                                                      |
| `SesionEnArmado`    | `peliculas: readonly PeliculaEnSesion[]`, `tiempo: number`, `onQuitar: (tmdbId: number) => void`                      | —                                                                                                                                                                                                                      |
| `GuardarSesion`     | `peliculas: readonly PeliculaEnSesion[]`, `tiempo: number`, `onGuardada: (nombre: string) => void`                    | `texto: string`, `guardando: boolean`, `error: string \| null`                                                                                                                                                         |
| `SesionesGuardadas` | `recarga: number`                                                                                                     | `sesiones: SesionGuardada[]`, `carga: 'cargando' \| 'lista' \| 'error'`, `error: string \| null`, `eliminando: number \| null`                                                                                         |

**Flujo de `NocheDePelicula`**

1. Al montarse: `obtenerLista()` → `peliculasPorVer()` → `obtenerDuraciones(ids)` → `aCandidatas()`. Mientras tanto, `carga = 'cargando'`.
2. `FormularioTiempo` valida con `validarTiempoDisponible` y llama a `onConfirmar(minutos)`. Volver a enviar otro tiempo **no** vacía la sesión (RN-12) y no vuelve a llamar a TMDB (S-17). Si el texto no es válido, muestra el error y llama a `onInvalido()`; `NocheDePelicula` pone `tiempo = null` para dejar de mostrar películas (CA-01.4, CA-01.5), y la sesión en armado se conserva.
3. Con `tiempo` definido, se calcula `clasificarCandidatas(candidatas, sesion, tiempo)` en cada render y se pasa a `ListaCandidatas`.
4. `onAgregar` hace `setSesion([...sesion, aPeliculaEnSesion(p)])`; `onQuitar` filtra por `tmdbId`.
5. `GuardarSesion` valida con `validarNombreSesion` y `validarSesionParaGuardar`, y llama a `crearSesion`. Si va bien, `onGuardada(nombre)`: se vacía `sesion`, se muestra el éxito y se incrementa `recargaSesiones`. Si falla, la sesión en armado se conserva (CA-03.11).
6. `SesionesGuardadas` carga con `listarSesiones()` al montarse y cuando cambia `recarga`.

**Estructura de la pantalla** (de arriba abajo, dentro de `<section>`):

1. `h2` "Noche de película" y `FormularioTiempo`.
2. `h3` "Qué cabe" y `ListaCandidatas`.
3. `h3` "Tu sesión" y `SesionEnArmado` + `GuardarSesion`.
4. `h3` "Sesiones guardadas" y `SesionesGuardadas`.

### 5.3 Textos y estados

Todas las duraciones se muestran en minutos: "95 min" (CB-19). `{…}` indica un valor.

**Formulario de tiempo**

| Elemento               | Texto                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| Etiqueta del campo     | `¿Cuántos minutos tienes?`                                            |
| Campo                  | `input type="text" inputMode="numeric"`, placeholder `Entre 30 y 600` |
| Botón (principal)      | `Ver qué cabe`                                                        |
| Error `vacio`          | `Escribe cuántos minutos tienes: un número entero entre 30 y 600.`    |
| Error `no_entero`      | `El tiempo debe ser un número entero de minutos, entre 30 y 600.`     |
| Error `fuera_de_rango` | `El tiempo debe estar entre 30 y 600 minutos.`                        |

**Carga, error y vacío de la vista**

| Situación                                  | Clase                     | Texto                                                                       |
| ------------------------------------------ | ------------------------- | --------------------------------------------------------------------------- |
| Cargando lista y duraciones                | `.mensaje`                | `Cargando tus películas por ver...`                                         |
| Falla `obtenerLista`                       | `.mensaje .mensaje-error` | `No se pudo cargar tu lista. Inténtalo de nuevo.` + botón `Reintentar`      |
| Falla `obtenerDuraciones` (todas)          | `.mensaje .mensaje-error` | Mensaje del servicio + botón `Reintentar`                                   |
| Sin películas por ver                      | `.mensaje .mensaje-vacio` | `No tienes películas por ver. Agrega algunas desde Mi lista.`               |
| Tiempo válido, sesión vacía y ninguna cabe | `.mensaje .mensaje-vacio` | `Ninguna de tus películas cabe en {tiempo} minutos. Prueba con más tiempo.` |
| Sesión con películas y no cabe ninguna más | `.mensaje .mensaje-vacio` | `No cabe ninguna película más en el tiempo que te queda.`                   |

**Tarjetas de candidatas** (`ul.rejilla` > `li.tarjeta`, póster o `.sin-poster`, `.tarjeta-cuerpo`)

| Tipo                 | `.insignia`      | `.tarjeta-meta` (motivo)                                                   | Botón                                 |
| -------------------- | ---------------- | -------------------------------------------------------------------------- | ------------------------------------- |
| Cabe                 | `{duracion} min` | —                                                                          | `Agregar a la sesión`                 |
| `no_cabe`, sin pausa | `No cabe`        | `Dura {duracion} min y tienes {tiempo}.`                                   | `Agregar a la sesión` (deshabilitado) |
| `no_cabe`, con pausa | `No cabe`        | `Necesita {necesita} min ({duracion} + 10 de pausa) y te quedan {quedan}.` | `Agregar a la sesión` (deshabilitado) |
| `sin_duracion`       | `Sin duración`   | `No tiene duración conocida, así que no se puede agregar.`                 | `Agregar a la sesión` (deshabilitado) |
| `error_duracion`     | `Sin duración`   | `No se pudo obtener la duración. Vuelve a intentarlo más tarde.`           | `Agregar a la sesión` (deshabilitado) |

La cifra "10" del motivo se toma de `PAUSA_MIN`.

**Sesión en armado**

| Situación           | Clase                     | Texto                                                                            |
| ------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| Vacía               | `.mensaje .mensaje-vacio` | `Tu sesión está vacía. Agrega películas de las que caben.`                       |
| Lista de películas  | `ol`                      | `{n}. {titulo} — {duracion} min` + botón `Quitar`                                |
| Resumen (cabe)      | `.tarjeta-meta`           | `Total: {total} min (incluye {pausas} min de pausas) · Te quedan {restante} min` |
| Resumen (se excede) | `.mensaje .mensaje-error` | `Tu sesión se pasa por {exceso} min. Quita películas para poder guardarla.`      |

**Guardar**

| Elemento / situación | Clase                     | Texto                                                                       |
| -------------------- | ------------------------- | --------------------------------------------------------------------------- |
| Etiqueta del campo   | —                         | `Nombre de la sesión`                                                       |
| Campo                | `input type="text"`       | placeholder `Ej.: Viernes de terror`                                        |
| Botón (principal)    | `button[type='submit']`   | `Guardar sesión` · mientras guarda: `Guardando...` y deshabilitado          |
| Sin películas        | `.mensaje .mensaje-error` | `Agrega al menos una película para guardar la sesión.`                      |
| Se excede            | `.mensaje .mensaje-error` | `Tu sesión se pasa por {exceso} min. Quita películas para poder guardarla.` |
| Nombre vacío         | `.mensaje .mensaje-error` | `Ponle un nombre a la sesión.`                                              |
| Nombre largo         | `.mensaje .mensaje-error` | `El nombre puede tener como máximo 60 caracteres.`                          |
| Error del servicio   | `.mensaje .mensaje-error` | Mensaje de `crearSesion` (sección 4.2)                                      |
| Éxito                | `.mensaje .mensaje-exito` | `Sesión "{nombre}" guardada.`                                               |

**Sesiones guardadas** (`ul.rejilla` > `li.tarjeta` > `.tarjeta-cuerpo`, sin póster)

| Elemento / situación | Clase                     | Texto                                                                                     |
| -------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| Cargando             | `.mensaje`                | `Cargando tus sesiones...`                                                                |
| Error                | `.mensaje .mensaje-error` | Mensaje de `listarSesiones` + botón `Reintentar`                                          |
| Sin sesiones         | `.mensaje .mensaje-vacio` | `Aún no tienes sesiones guardadas. Arma tu primera noche de película.`                    |
| Nombre               | `.tarjeta-titulo`         | `{nombre}`                                                                                |
| Datos                | `.tarjeta-meta`           | `Creada el {fecha} · Tiempo disponible: {tiempo} min · Total: {total} min`                |
| Fecha                | —                         | `new Date(creadaEn).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })` |
| Películas            | `ol`                      | `{n}. {titulo} — {duracion} min`                                                          |
| Botón (secundario)   | `button type="button"`    | `Eliminar` · mientras elimina: `Eliminando...` y deshabilitado                            |
| Confirmación         | `window.confirm`          | `¿Eliminar la sesión "{nombre}"? Esta acción no se puede deshacer.`                       |
| Error al eliminar    | `.mensaje .mensaje-error` | Mensaje de `eliminarSesion`                                                               |

No hay ningún control para editar una sesión guardada (RN-09). Tampoco se indica si alguna de sus películas ya se vio o salió de la lista (RN-14).

### 5.4 Estilos

- Se usan solo los tokens y las clases de `DESIGN.md`:
  - tokens `--error`, `--exito` y `--texto-sobre-acento`, que se agregan en E2-T08;
  - clases `.rejilla`, `.tarjeta`, `.tarjeta-cuerpo`, `.tarjeta-titulo`, `.tarjeta-meta`, `.sin-poster` e `.insignia`;
  - clases `.mensaje`, `.mensaje-error`, `.mensaje-exito` y `.mensaje-vacio`, que se agregan en E2-T08;
  - selectores de etiqueta `button`, `button[type='submit']`, `input`, `form`, `h2` y `h3`.
- Cada formulario tiene un solo botón principal (DIS-06). Los botones "Agregar", "Quitar", "Eliminar", "Reintentar" y los de navegación son secundarios (`type="button"`).
- Sin estilos en línea (DIS-01), sin colores fuera de los tokens (DIS-02) y sin clases nuevas sin documentar (`DESIGN.md` §6).
- Las imágenes de póster de las candidatas cumplen DIS-09 y DIS-11. La vista no genera scroll horizontal a 360px (DIS-14).
- Los campos llevan `<label>` asociada (`htmlFor`/`id`), y el foco visible es el definido en `DESIGN.md` (DIS-05).

---

## 6. Criterios DEBE / NO DEBE

| Id   | Criterio                                                                                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 | **DEBE** calcular el total, si cabe, el restante o el exceso, la clasificación, los motivos y el orden solo con funciones de `src/dominio/`. Los componentes **NO DEBEN** sumar duraciones ni pausas por su cuenta. |
| S-02 | Los componentes de `src/components/noche/` **NO DEBEN** importar `supabase` ni llamar a `fetch`; solo usan `src/lib/tmdb.ts`, `src/lib/sesiones.ts` y `src/lib/lista.ts`.                                           |
| S-03 | **NO DEBE** haber `any` (explícito o implícito) ni aserciones `as` sobre datos que vienen de TMDB o de Supabase; se leen como `unknown` y se validan.                                                               |
| S-04 | La pausa **DEBE** venir de `PAUSA_MIN`. **NO DEBE** aparecer un `10` literal de pausa en el código TypeScript; la única copia permitida es `c_pausa` en `crear_sesion`, con un comentario que la enlaza.            |
| S-05 | Guardar una sesión **DEBE** hacerse con una sola llamada a la RPC `crear_sesion`. **NO DEBE** insertarse la sesión y sus películas en llamadas separadas.                                                           |
| S-06 | **NO DEBE** existir política UPDATE, privilegio UPDATE, función ni interfaz que modifique una sesión guardada (RN-09).                                                                                              |
| S-07 | Guardar o eliminar una sesión **NO DEBE** modificar `mi_lista` ni el estado de ningún título (RN-06).                                                                                                               |
| S-08 | `Buscador` y `MiLista` **DEBEN** seguir montados al cambiar de vista, y Mi lista **DEBE** ser la vista inicial. El comportamiento de la E1 **NO DEBE** cambiar.                                                     |
| S-09 | **NO DEBE** agregarse un router ni otra dependencia de ejecución; Vitest es la única dependencia nueva, y es de desarrollo.                                                                                         |
| S-10 | La clave de TMDB **DEBE** leerse solo con `import.meta.env.VITE_TMDB_API_KEY`; **NO DEBE** aparecer en el código, en los tests ni en la documentación.                                                              |
| S-11 | El botón "Guardar sesión" **DEBE** estar deshabilitado mientras se guarda, para que un doble clic cree una sola sesión (CB-10).                                                                                     |
| S-12 | Si falla el guardado, la sesión en armado y el nombre escrito **DEBEN** conservarse (CB-11).                                                                                                                        |
| S-13 | Las reglas RN-01, RN-04, RN-05, RN-11 y SU-04 **DEBEN** validarse en el cliente (dominio) **y** en la base de datos (`check` y `crear_sesion`).                                                                     |
| S-14 | **NO DEBE** haber estilos en línea, colores fuera de los tokens, fuentes nuevas ni clases sin documentar en `DESIGN.md`.                                                                                            |
| S-15 | La longitud del nombre **DEBE** contarse por puntos de código (`[...nombre].length`), igual que `char_length` en PostgreSQL.                                                                                        |
| S-16 | `obtenerDuraciones` **DEBE** hacer como máximo 5 peticiones simultáneas a TMDB.                                                                                                                                     |
| S-17 | Lista y duraciones **DEBEN** cargarse una vez al entrar en la vista. Cambiar el tiempo o la sesión **NO DEBE** volver a llamar a TMDB ni a Supabase.                                                                |
| S-18 | `buscarTitulos`, `obtenerDetalle` y las funciones de `src/lib/lista.ts` **NO DEBEN** cambiar de firma ni de comportamiento.                                                                                         |
| S-19 | Todas las duraciones y tiempos **DEBEN** mostrarse en minutos ("95 min") (CB-19).                                                                                                                                   |
| S-20 | Al cerrar sesión desde cualquier vista, la app **DEBE** mostrar `Auth` y, al volver a entrar, la vista **DEBE** ser Mi lista.                                                                                       |
| S-21 | El cálculo de qué cabe **DEBE** hacerse contra el tiempo que queda (SU-02): una película se ofrece solo si `cabe(tiempo, [...duracionesSesion, duracion])`.                                                         |
| S-22 | `npm run lint`, `npm run build` y `npm test` **DEBEN** pasar en cada commit de la épica desde E2-T01.                                                                                                               |

---

## 7. Criterio → verificación

Notación de los tests: `archivo › describe › it`. "Navegador" significa prueba manual en `npm run dev`, registrada en `docs/VERIFICACION.md`. "Dos cuentas" se refiere a E2-T13.

### 7.1 Criterios de aceptación

| Criterio | Verificación                                                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-01.1  | Vitest `candidatas.test.ts › clasificarCandidatas › con 120 min incluye las que duran 120 o menos` + Navegador                                                       |
| CA-01.2  | Vitest `candidatas.test.ts › clasificarCandidatas › una película de exactamente 120 cabe en 120` y `sesion.test.ts › cabe › una sola película igual al tiempo cabe`  |
| CA-01.3  | Vitest `sesion.test.ts › validarTiempoDisponible › acepta 30 y 600` + Navegador                                                                                      |
| CA-01.4  | Vitest `sesion.test.ts › validarTiempoDisponible › rechaza 29 y 601 como fuera_de_rango` + Navegador (texto del error)                                               |
| CA-01.5  | Vitest `sesion.test.ts › validarTiempoDisponible › rechaza "" …` y `› rechaza "90,5" …` + Navegador                                                                  |
| CA-01.6  | Vitest `candidatas.test.ts › peliculasPorVer › solo deja películas en estado por_ver` y `› clasificarCandidatas › excluye las que están viendo o vista`              |
| CA-01.7  | Vitest `candidatas.test.ts › peliculasPorVer › excluye las series` y `› clasificarCandidatas › excluye las series`                                                   |
| CA-01.8  | Vitest `candidatas.test.ts › clasificarCandidatas › una película sin duración es no disponible…` + Navegador (botón deshabilitado y motivo)                          |
| CA-01.9  | Vitest `duracion.test.ts › normalizarDuracion › 0 → null` y `candidatas.test.ts › clasificarCandidatas › una duración 0 es no disponible…`                           |
| CA-01.10 | Vitest `candidatas.test.ts › clasificarCandidatas › ordena Beta (88), Alfa (95), Zeta (95)`                                                                          |
| CA-01.11 | Navegador con la red en "Slow 3G": aparece `Cargando tus películas por ver...`                                                                                       |
| CA-01.12 | Vitest `tmdb.test.ts › obtenerDuraciones › si fallan todas, lanza el mensaje en español` + Navegador sin conexión (error y `Reintentar`; Mi lista sigue funcionando) |
| CA-01.13 | Vitest `candidatas.test.ts › clasificarCandidatas › sin películas por ver…` + Navegador con una cuenta sin películas por ver                                         |
| CA-01.14 | Vitest `candidatas.test.ts › clasificarCandidatas › si ninguna cabe…` + Navegador (30 min con películas largas)                                                      |
| CA-01.15 | Vitest `candidatas.test.ts › clasificarCandidatas › las que no caben van después…` y `› una película de 140 con 120 min…` + Navegador                                |
| CA-01.16 | Vitest `tmdb.test.ts › obtenerDuraciones › si fallan algunas, marca error solo en esas` y `candidatas.test.ts › clasificarCandidatas › una duración con error…`      |
| CA-02.1  | Vitest `sesion.test.ts › tiempoTotal › una sola película no lleva pausa` y `› balance` + Navegador                                                                   |
| CA-02.2  | Vitest `sesion.test.ts › tiempoTotal › dos películas llevan una pausa` + Navegador                                                                                   |
| CA-02.3  | Vitest `sesion.test.ts › cabe › una sesión que ocupa exactamente el tiempo disponible cabe` y `› validarSesionParaGuardar › una sesión exacta → ok` + Navegador      |
| CA-02.4  | Vitest `candidatas.test.ts › clasificarCandidatas › con 20 restantes cabe la de 10 y no la de 15`                                                                    |
| CA-02.5  | Vitest `sesion.test.ts › minutosNecesarios › con películas en la sesión suma la pausa` + Navegador (texto del motivo)                                                |
| CA-02.6  | Vitest `candidatas.test.ts › clasificarCandidatas › una película ya agregada no aparece`                                                                             |
| CA-02.7  | Vitest `sesion.test.ts › tiempoTotal › una sesión vacía suma 0` y `candidatas.test.ts › … › al quitar una película…` + Navegador                                     |
| CA-02.8  | Vitest `sesion.test.ts › tiempoTotal › quitar la del medio deja una pausa`                                                                                           |
| CA-02.9  | Vitest `sesion.test.ts › balance › 170 de 150 → restante 0, exceso 20` y `› validarSesionParaGuardar › … se excede` + Navegador (aviso y guardado bloqueado)         |
| CA-02.10 | Vitest `sesion.test.ts › balance › 170 de 180 …` + Navegador (cambiar a 200)                                                                                         |
| CA-02.11 | Vitest `candidatas.test.ts › aPeliculaEnSesion › lanza RangeError si la duración no es conocida` + Navegador (botón deshabilitado)                                   |
| CA-03.1  | Navegador: guardar "Viernes de terror" y revisar su detalle + Supabase (filas en `sesiones` y `sesion_peliculas` con `posicion`)                                     |
| CA-03.2  | Vitest `sesion.test.ts › validarSesionParaGuardar › una sesión vacía → sin_peliculas` + SQL: `crear_sesion` con `[]` lanza error                                     |
| CA-03.3  | Vitest `nombre.test.ts › validarNombreSesion › "" → vacio` y `› "   " → vacio` + Navegador                                                                           |
| CA-03.4  | Vitest `nombre.test.ts › validarNombreSesion › "  Maratón de domingo  " → …`                                                                                         |
| CA-03.5  | Vitest `nombre.test.ts › validarNombreSesion › 60 caracteres…`, `› 61 caracteres…` y `› 60 caracteres con ñ y tildes…` + SQL: un `insert` con 61 caracteres falla    |
| CA-03.6  | Navegador: guardar dos sesiones llamadas "Viernes"                                                                                                                   |
| CA-03.7  | Navegador: tras guardar, las películas siguen «por ver» en Mi lista                                                                                                  |
| CA-03.8  | Navegador: la misma película se guarda en dos sesiones                                                                                                               |
| CA-03.9  | Vitest `sesion.test.ts › validarSesionParaGuardar › … se excede` + SQL: `crear_sesion` con un total mayor que el tiempo lanza error                                  |
| CA-03.10 | Navegador: doble clic rápido en "Guardar sesión" → una sola sesión                                                                                                   |
| CA-03.11 | Navegador sin conexión al guardar: mensaje de error y la sesión en armado intacta                                                                                    |
| CA-03.12 | SQL o Navegador: con 50 sesiones creadas, guardar otra funciona                                                                                                      |
| CA-04.1  | Navegador: tres sesiones guardadas en orden aparecen invertidas                                                                                                      |
| CA-04.2  | Vitest `sesiones.test.ts › leerSesionGuardada › convierte una fila válida` y `› ordena las películas por posición` + Navegador                                       |
| CA-04.3  | Navegador con una cuenta sin sesiones                                                                                                                                |
| CA-04.4  | Navegador: eliminar de Mi lista una película de una sesión guardada; la sesión no cambia                                                                             |
| CA-04.5  | Navegador: marcar como «vista» una película de una sesión guardada; la sesión se ve igual                                                                            |
| CA-04.6  | Navegador (no hay controles de edición) + SQL: un `update` sobre `sesiones` falla con permission denied                                                              |
| CA-04.7  | Navegador con la red en "Slow 3G" y sin conexión                                                                                                                     |
| CA-05.1  | Navegador: eliminar y confirmar                                                                                                                                      |
| CA-05.2  | Navegador: eliminar y cancelar                                                                                                                                       |
| CA-05.3  | Navegador: una película en dos sesiones; eliminar una; la otra y Mi lista no cambian                                                                                 |
| CA-05.4  | Navegador sin conexión al eliminar                                                                                                                                   |
| CA-06.1  | Dos cuentas: A solo ve sus sesiones (app y `select` directo con la clave pública)                                                                                    |
| CA-06.2  | Dos cuentas: A no puede leer, insertar con el `user_id` de B ni borrar sesiones de B (`select`/`insert`/`delete` directos y `crear_sesion`)                          |
| CA-06.3  | Navegador: sin sesión solo se ve `Auth`; cerrar sesión desde Noche de película                                                                                       |
| CA-06.4  | Dos cuentas: las candidatas de A solo incluyen películas de la lista de A                                                                                            |

### 7.2 Criterios de la spec

| Criterio | Verificación                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01     | Revisión de código: los componentes de `noche/` no contienen `+` sobre duraciones; las pausas del resumen salen de `minutosDePausas`. `PAUSA_MIN` solo aparece en el texto del motivo |
| S-02     | `grep -rn "supabase\|fetch(" src/components/noche` no devuelve nada                                                                                                                   |
| S-03     | `npm run lint` + `npm run build` + `grep -rn " as \|any" src/lib/sesiones.ts src/lib/tmdb.ts src/dominio` sin coincidencias nuevas                                                    |
| S-04     | `grep -rn "10" src/dominio src/components/noche` solo muestra `PAUSA_MIN = 10`                                                                                                        |
| S-05     | Revisión de `crearSesion` (solo `supabase.rpc`) + SQL: forzar un error en la segunda película y comprobar que no queda la sesión                                                      |
| S-06     | SQL: `update public.sesiones set nombre = 'x'` falla con permission denied                                                                                                            |
| S-07     | Navegador: el estado de los títulos en Mi lista no cambia al guardar ni al eliminar (CA-03.7, CA-05.3)                                                                                |
| S-08     | Navegador: escribir una búsqueda en Mi lista, ir a Noche de película y volver; la búsqueda sigue ahí. Recorrido completo de la E1                                                     |
| S-09     | `git diff package.json` de la épica: solo `vitest` en `devDependencies`                                                                                                               |
| S-10     | `git grep` de la clave real (sin mostrarla) no encuentra nada; `grep -rn "import.meta.env" src` solo en `src/lib/`                                                                    |
| S-11     | Navegador (CA-03.10)                                                                                                                                                                  |
| S-12     | Navegador (CA-03.11)                                                                                                                                                                  |
| S-13     | Vitest de dominio + SQL de CA-03.2, CA-03.5 y CA-03.9                                                                                                                                 |
| S-14     | DIS-01, DIS-02, DIS-03 y DIS-04                                                                                                                                                       |
| S-15     | Vitest `nombre.test.ts › … 60 caracteres con ñ y tildes es válido` + SQL con el mismo nombre                                                                                          |
| S-16     | Navegador → Network: con más de 5 películas, nunca hay más de 5 peticiones `movie/` abiertas a la vez                                                                                 |
| S-17     | Navegador → Network: cambiar el tiempo y agregar o quitar películas no genera peticiones                                                                                              |
| S-18     | `git diff` de la épica sobre `src/lib/lista.ts` (sin cambios) y sobre `buscarTitulos`/`obtenerDetalle` (sin cambios) + recorrido de la E1                                             |
| S-19     | Navegador: todos los tiempos terminan en "min"                                                                                                                                        |
| S-20     | Navegador: cerrar sesión desde Noche de película, volver a entrar → Mi lista                                                                                                          |
| S-21     | Vitest `candidatas.test.ts › clasificarCandidatas › con 20 restantes…`                                                                                                                |
| S-22     | Salida de los tres comandos en `docs/VERIFICACION.md` (E2-T14)                                                                                                                        |

### 7.3 Criterios de diseño aplicables a Noche de película

| Criterio | Verificación en la vista Noche de película                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| DIS-01   | Consola: `document.querySelectorAll('section [style]').length === 0` en la vista                                   |
| DIS-02   | Provocar un error de tiempo (`mensaje-error`) y guardar una sesión (`mensaje-exito`); comprobar el color computado |
| DIS-03   | Network → Font: solo Cinzel                                                                                        |
| DIS-04   | Network → CSS: solo el bundle y Google Fonts                                                                       |
| DIS-05   | Recorrer con Tab el campo de tiempo, las tarjetas, la sesión, el nombre y las sesiones guardadas                   |
| DIS-06   | Dos formularios ("Ver qué cabe" y "Guardar sesión"), cada uno con un solo `button[type='submit']`                  |
| DIS-07   | "Guardar sesión" mientras guarda; "Agregar a la sesión" en las no disponibles                                      |
| DIS-08   | Los contenedores de candidatas y de sesiones guardadas tienen la clase `rejilla` y `display: grid`                 |
| DIS-09   | Póster de una candidata: alto ≈ ancho × 1,5                                                                        |
| DIS-10   | Hover sobre una tarjeta de candidata                                                                               |
| DIS-11   | Una candidata sin póster muestra `.sin-poster` del mismo tamaño                                                    |
| DIS-12   | "Slow 3G": `Cargando tus películas por ver...` y `Cargando tus sesiones...`                                        |
| DIS-13   | Sin películas por ver, ninguna cabe, sesión vacía y sin sesiones guardadas muestran `.mensaje-vacio`               |
| DIS-14   | Vista de 360px: `document.documentElement.scrollWidth <= window.innerWidth`                                        |
| DIS-15   | Contraste del texto de `.tarjeta-meta` y de los mensajes ≥ 4.5:1                                                   |

---

## 8. Ticket → archivos

| Ticket | Crea                                                                                                                            | Modifica                                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2-T02 | `docs/specs/noche-de-pelicula.md`                                                                                               | —                                                                                                                                                         |
| E2-T00 | —                                                                                                                               | Todos los archivos de `src/` que Prettier reformatee (`*.ts`, `*.tsx`, `*.css`); sin cambios de comportamiento                                            |
| E2-T01 | `src/dominio/humo.test.ts` (test de humo; se borra en E2-T03)                                                                   | `package.json`, `package-lock.json`, `vite.config.ts` (bloque `test` de Vitest), `AGENTS.md`                                                              |
| E2-T03 | `src/dominio/sesion.ts`, `src/dominio/sesion.test.ts`                                                                           | Borra `src/dominio/humo.test.ts`                                                                                                                          |
| E2-T04 | `src/dominio/candidatas.ts`, `src/dominio/candidatas.test.ts`, `src/dominio/nombre.ts`, `src/dominio/nombre.test.ts`            | —                                                                                                                                                         |
| E2-T05 | `supabase/migrations/<AAAAMMDDHHMMSS>_sesiones.sql`                                                                             | —                                                                                                                                                         |
| E2-T06 | `src/dominio/duracion.ts`, `src/dominio/duracion.test.ts`, `src/lib/tmdb.test.ts`                                               | `src/lib/tmdb.ts` (añade `obtenerDuracion` y `obtenerDuraciones`)                                                                                         |
| E2-T07 | `src/lib/sesiones.ts`, `src/lib/sesiones.test.ts`                                                                               | —                                                                                                                                                         |
| E2-T08 | —                                                                                                                               | `src/index.css`, `DESIGN.md`                                                                                                                              |
| E2-T09 | `src/components/noche/NocheDePelicula.tsx` (versión inicial: título de la vista)                                                | `src/App.tsx`                                                                                                                                             |
| E2-T10 | `src/components/noche/FormularioTiempo.tsx`, `src/components/noche/ListaCandidatas.tsx`, `docs/VERIFICACION.md` (sección HU-01) | `src/components/noche/NocheDePelicula.tsx`                                                                                                                |
| E2-T11 | `src/components/noche/SesionEnArmado.tsx`                                                                                       | `src/components/noche/NocheDePelicula.tsx`, `docs/VERIFICACION.md` (sección HU-02)                                                                        |
| E2-T12 | `src/components/noche/GuardarSesion.tsx`, `src/components/noche/SesionesGuardadas.tsx`                                          | `src/components/noche/NocheDePelicula.tsx`, `docs/VERIFICACION.md` (secciones HU-03 a HU-05)                                                              |
| E2-T13 | —                                                                                                                               | `docs/VERIFICACION.md` (sección HU-06 y evidencia con dos cuentas)                                                                                        |
| E2-T14 | —                                                                                                                               | `docs/VERIFICACION.md` (S-xx, DIS-xx, regresión de la E1 y salida de lint, build y test)                                                                  |
| E2-T15 | —                                                                                                                               | `src/App.tsx`, `src/components/Auth.tsx`, `src/components/Buscador.tsx`, `src/components/MiLista.tsx`, `src/components/Detalle.tsx`, `src/index.css` (§9) |

`docs/VERIFICACION.md` se crea en E2-T10 con la primera sección, porque los tickets de pantalla registran ahí su verificación. E2-T14 lo completa y lo cierra.

---

## 9. E2-T15 — Mejora visual de la E1

Resuelve las deudas D-01 y D-04 de `docs/ESTADO-INICIAL.md`, y D-21 en la insignia. Solo cambia el marcado y las clases de las pantallas de la E1. Los datos, los servicios y el estado de los componentes no cambian, y los textos tampoco, salvo la insignia del tipo. Antes del código se documentan en `DESIGN.md` §4 y en `docs/diseno/brand-board.html` el selector `.cabecera-usuario` y el estado activo `nav button[aria-current='page']`.

### 9.1 Cambios

| Archivo                   | Cambio                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Buscador.tsx`            | Resultados en `ul.rejilla` > `li.tarjeta`. Cada tarjeta tiene `.insignia` con `etiquetaTipo(r.tipo)`, póster `img` (sin atributo `width`) o `.sin-poster`, y `.tarjeta-cuerpo` con `.tarjeta-titulo`, `.tarjeta-meta` (año o "s/f") y el botón "Agregar a mi lista". Error → `.mensaje.mensaje-error`, éxito → `.mensaje.mensaje-exito`, "Buscando..." → `.mensaje` y "No se encontraron resultados." → `.mensaje.mensaje-vacio`.                                                                                                |
| `MiLista.tsx`             | Títulos en `ul.rejilla` > `li.tarjeta`, con `.insignia` (`etiquetaTipo(t.tipo_contenido)`), póster o `.sin-poster` y `.tarjeta-cuerpo`, que contiene `.tarjeta-titulo` y los controles de siempre en el mismo orden: "Ver detalle", estado, calificación, comentario y "Eliminar". Los selects de filtro y orden van dentro de `div.filtros`, con 8px entre ellos y 20px hasta la `.rejilla` (ajuste tras la revisión). Error → `.mensaje-error`; carga → `.mensaje`; lista vacía y filtro sin coincidencias → `.mensaje-vacio`. |
| `Auth.tsx`, `Detalle.tsx` | Error → `.mensaje.mensaje-error`. En `Detalle`, "Cargando detalle..." → `.mensaje`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `App.tsx`                 | Cabecera en este orden: `h1`, `div.cabecera-usuario` (correo + "Cerrar sesión") y `nav`. La navegación conserva sus botones y `aria-current`.                                                                                                                                                                                                                                                                                                                                                                                    |
| `src/dominio/tipo.ts`     | `etiquetaTipo(tipo: TipoContenido): string` → `'pelicula'` da "Película" y `'serie'` da "Serie" (D-21). Test en `tipo.test.ts`.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `index.css`               | Reglas de `.cabecera-usuario`, `header nav` y `nav button[aria-current='page']`, iguales que en el brand board. En `.tarjeta-cuerpo`, los `input`, `select` y `button` llevan `flex: none` para que el `flex: 1 1 200px` de los inputs de texto no se aplique en vertical (el comentario tiene la altura normal de un input). `.filtros`: flex con salto de línea, `gap: 8px` y `margin-bottom: 20px`, valores de `DESIGN.md` §2 (separación de `form` y de `.rejilla`).                                                         |

Lo que no cambia:

- los handlers;
- las props;
- el estado de los componentes;
- las llamadas a `src/lib/`;
- el orden de los controles;
- los textos visibles, salvo la insignia, que pasa de "pelicula"/"serie" a "Película"/"Serie" (D-21);
- la estructura de `Detalle`, salvo el color de su error.

### 9.2 Definition of Done

| Criterio | Cómo se comprueba                                                                                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DIS-01   | `grep -rn "style=" src` no encuentra nada en `.tsx`. En el navegador, `document.querySelectorAll('[style]').length === 0` en acceso, Mi lista, detalle y Noche de película                   |
| DIS-02   | Duplicado en el buscador → `mensaje-error` en `rgb(255, 92, 92)`. Agregar un título → `mensaje-exito` en `rgb(61, 220, 151)`                                                                 |
| DIS-08   | Los resultados y Mi lista tienen `rejilla` y `display: grid`                                                                                                                                 |
| DIS-09   | Póster del buscador y de Mi lista: alto ≈ ancho × 1,5                                                                                                                                        |
| DIS-10   | Hover sobre una tarjeta del buscador y de Mi lista                                                                                                                                           |
| DIS-11   | Un título sin póster muestra `.sin-poster` del mismo tamaño                                                                                                                                  |
| DIS-14   | A 360px, en Mi lista con resultados y en Noche de película, `document.documentElement.scrollWidth <= window.innerWidth`. "Cerrar sesión" sigue junto al correo                               |
| E1 igual | El recorrido R-01 a R-08 de `docs/VERIFICACION.md` da el mismo resultado. `git diff` no toca `src/lib/` ni `src/components/noche/`; en `src/dominio/` solo agrega `tipo.ts` y `tipo.test.ts` |
| Tarjeta  | El campo de comentario de Mi lista mide lo mismo de alto que los selects; la insignia dice "Película" o "Serie"                                                                              |
| Filtros  | En Mi lista, `gap` de `.filtros` = 8px y `margin-bottom` = 20px (Computed); los selects no se tocan ni tocan la cuadrícula                                                                   |
| Comandos | `npm test`, `npm run lint` y `npm run build` pasan                                                                                                                                           |
