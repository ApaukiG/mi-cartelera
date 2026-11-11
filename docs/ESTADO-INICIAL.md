# Estado inicial — Proyecto 3 (épica E1)

Fotografía de la app tal como está en `main` (commit `6699ba5`, 2026-11-10), antes de empezar la épica E2.
Este documento describe; no propone cambios. La deuda técnica queda registrada en la sección 7 para priorizarla después.

Verificación realizada al redactarlo: `npm run lint` sin errores y `npm run build` compila correctamente.

---

## 1. Qué hace hoy la app

### Funcionalidades

| Funcionalidad                                                                                                                          | Dónde vive                         |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Registro con correo y contraseña (mín. 6 caracteres), con aviso si hay que confirmar el correo                                         | `src/components/Auth.tsx`          |
| Inicio y cierre de sesión; sin sesión solo se ve la pantalla de acceso                                                                 | `src/App.tsx`, `Auth.tsx`          |
| Búsqueda de películas y series en TMDB (`search/multi`, idioma `es-ES`, primera página) con estados de carga, error y "sin resultados" | `Buscador.tsx`, `src/lib/tmdb.ts`  |
| Agregar un resultado a "Mi lista"; los duplicados se rechazan con el mensaje "Ese título ya está en tu lista."                         | `Buscador.tsx`, `src/lib/lista.ts` |
| Listar los títulos guardados, del más reciente al más antiguo                                                                          | `MiLista.tsx`                      |
| Contador resumen: pendientes / en progreso / vistas                                                                                    | `MiLista.tsx`                      |
| Filtro por estado (todas, por ver, viendo, vistas)                                                                                     | `MiLista.tsx`                      |
| Orden: más recientes o mejor calificadas                                                                                               | `MiLista.tsx`                      |
| Cambiar estado (por ver → viendo → vista, en cualquier dirección)                                                                      | `MiLista.tsx`                      |
| Calificación personal de 1 a 5 estrellas o "sin calificar"                                                                             | `MiLista.tsx`                      |
| Comentario personal (se guarda al salir del campo)                                                                                     | `MiLista.tsx`                      |
| Eliminar un título, con confirmación del navegador                                                                                     | `MiLista.tsx`                      |
| Detalle de un título: póster grande, sinopsis, 8 primeros del elenco, calificación TMDB, mi calificación y mi comentario               | `Detalle.tsx`, `tmdb.ts`           |

### Pantallas

No hay router: las pantallas dependen del estado de React.

1. **Cargando** — texto "Cargando..." mientras se consulta la sesión.
2. **Acceso** (`Auth`) — formulario que alterna entre "Iniciar sesión" y "Crear cuenta".
3. **Principal** — cabecera (título, correo del usuario, "Cerrar sesión") + `Buscador` + `MiLista`, todo en una sola columna.
4. **Detalle** — sustituye a `MiLista` dentro de la pantalla principal (el buscador sigue visible arriba). Botón "← Volver a mi lista".

### Flujo del usuario

```
Abre la app ──► ¿hay sesión? ──no──► Acceso ──(login / registro)──┐
                     │ sí                                          │
                     ▼                                             ▼
              Pantalla principal ◄─────────────────────────────────┘
                 │        │
   busca en TMDB │        │ gestiona su lista (estado, ★, comentario, eliminar,
   y agrega ─────┘        │ filtrar, ordenar)
   (la lista se recarga)  │
                          └──► Ver detalle ──► Volver a mi lista
Cerrar sesión ──► vuelve a Acceso
```

---

## 2. Stack y dependencias reales

Según `package.json`:

| Tipo        | Paquete                                                                                                             | Versión         |
| ----------- | ------------------------------------------------------------------------------------------------------------------- | --------------- |
| Dependencia | `react`, `react-dom`                                                                                                | ^19.3.1         |
| Dependencia | `@supabase/supabase-js`                                                                                             | ^2.118.0        |
| Desarrollo  | `vite` + `@vitejs/plugin-react`                                                                                     | ^8.3.4 / ^6.1.2 |
| Desarrollo  | `typescript`                                                                                                        | ~6.0.3          |
| Desarrollo  | `eslint` + `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` | ^10.13.0 …      |
| Desarrollo  | `prettier` (lo agregó el harness, no la E1)                                                                         | ^3.9.10         |
| Desarrollo  | `@types/node`, `@types/react`, `@types/react-dom`                                                                   | —               |

Scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`. **No hay script `test` ni Vitest.**

Servicios externos: Supabase (Auth + PostgreSQL), API REST v3 de TMDB (con `api_key` en la URL), CDN de imágenes de TMDB y Google Fonts (fuente Cinzel).

### ¿Bootstrap?

**No. La app no usa Bootstrap.** No aparece en `package.json` ni en `index.html`, y no hay ninguna clase de Bootstrap en el código.
Los estilos son **propios**, todos en `src/index.css`:

- Variables CSS en `:root`: `--bg #07080d`, `--panel`, `--panel-2 #1a1d2b`, `--borde`, `--texto #ececf3`, `--suave #9a9fb5`, `--acento #ff9f43`, `--frio #2ec4d6`. Tema oscuro.
- Fondo "cinematográfico" con degradados en `body::before`; títulos con la fuente Cinzel.
- Estilos aplicados **por etiqueta** (`header`, `form`, `input`, `select`, `button`, `ul`, `img`, `h1`–`h3`). Los componentes no usan ni un solo `className`.
- Clases definidas pero **sin usar**: `.rejilla`, `.tarjeta`, `.sin-poster`, `.tarjeta-cuerpo`, `.tarjeta-titulo`, `.tarjeta-meta`, `.insignia` (comentario: "Clases que usaremos en el siguiente paso").
- Algunos estilos en línea en los componentes: `style={{ color: 'red' }}` y `style={{ color: 'lightgreen' }}`.
- `src/App.css` es la hoja de la plantilla de Vite; no se importa en ningún sitio.

---

## 3. Estructura de carpetas y archivos principales

```
mi-cartelera/
├── .claude/                  harness de Claude Code (hook Prettier, skill /commit)
├── capturas/                 4 PNG que usa el README
├── public/
│   ├── favicon.svg           favicon de la plantilla de Vite
│   └── icons.svg             plantilla; no se usa
├── src/
│   ├── main.tsx              punto de entrada; importa index.css
│   ├── App.tsx               sesión, cabecera, composición de pantallas
│   ├── types.ts              TipoContenido, Estado, ResultadoTMDB, TituloGuardado
│   ├── index.css             todos los estilos reales
│   ├── App.css               plantilla de Vite; no se importa
│   ├── assets/               hero.png, react.svg, vite.svg (plantilla; no se usan)
│   ├── components/
│   │   ├── Auth.tsx          login / registro
│   │   ├── Buscador.tsx      búsqueda TMDB + agregar
│   │   ├── MiLista.tsx       lista, contador, filtro, orden, edición, eliminar
│   │   └── Detalle.tsx       detalle de un título
│   └── lib/                  "servicios"
│       ├── supabase.ts       cliente de Supabase
│       ├── tmdb.ts           buscarTitulos, obtenerDetalle
│       └── lista.ts          CRUD de la tabla mi_lista
├── AGENTS.md, CLAUDE.md      reglas del proyecto
├── README.md
├── index.html
├── eslint.config.js, vite.config.ts, tsconfig*.json
└── package.json
```

Todavía no existen: `docs/` (salvo este archivo), `DESIGN.md`, `src/dominio/`, tests ni migraciones SQL.

---

## 4. Modelo de datos en Supabase (deducido del código)

### Tabla `mi_lista`

| Columna                 | Tipo (README)                                                     | Uso en el código                                                        |
| ----------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `id`                    | `bigint` identity, PK                                             | clave para actualizar y eliminar                                        |
| `user_id`               | `uuid`, `default auth.uid()`, FK a `auth.users` (cascade)         | **el código nunca lo envía ni lo lee**; se rellena por defecto en la BD |
| `tmdb_id`               | `integer not null`                                                | id de TMDB; se usa para pedir el detalle                                |
| `titulo`                | `text not null`                                                   | copia del título de TMDB al agregar                                     |
| `poster_url`            | `text` null                                                       | URL completa del póster (w342)                                          |
| `tipo_contenido`        | `text`, check `pelicula` \| `serie`                               | determina `movie` / `tv` en TMDB                                        |
| `estado`                | `text`, default `por_ver`, check `por_ver` \| `viendo` \| `vista` | editable                                                                |
| `calificacion_personal` | `integer` null, check 1–5                                         | editable; null = "Sin calificar"                                        |
| `comentario`            | `text` null                                                       | editable; vacío se guarda como null                                     |
| `fecha_agregado`        | `timestamptz`, default `now()`                                    | orden "más recientes"                                                   |

Restricción única `(user_id, tmdb_id, tipo_contenido)`: el código depende de ella porque traduce el error `23505` a "Ese título ya está en tu lista.".

### Estados

`por_ver` (texto en la UI: "Por ver" / "pendientes") → `viendo` ("Viendo" / "en progreso") → `vista` ("Vista(s)").
Se puede pasar de cualquier estado a cualquier otro; no hay reglas de transición.

### Seguridad

RLS activado, con cuatro políticas `authenticated` (select/insert/update/delete) con `auth.uid() = user_id`. **Esto solo está documentado en el README**: el repositorio no tiene archivo SQL ni migración y el código no filtra por usuario, así que el aislamiento entre usuarios depende por completo de que esas políticas existan en el proyecto de Supabase.

### Autenticación

Supabase Auth con correo y contraseña (`signInWithPassword`, `signUp`, `signOut`, `getSession`, `onAuthStateChange`).

---

## 5. Inconsistencias

1. **Bootstrap:** `AGENTS.md` declara Bootstrap en el stack, pero la app no lo usa (sección 2).
2. **Cuadrícula de pósters:** el commit `04ac678` dice "cuadrícula de pósters", pero solo se agregó el CSS; los componentes no usan `.rejilla`/`.tarjeta`. La captura `capturas/mi-lista.png` lo confirma: la lista se ve en una sola columna, con controles en línea.
3. **Archivo de entorno:** el README pide crear `.env`; `AGENTS.md` dice que las claves viven en `.env.local`. Los dos están ignorados en git, pero los documentos se contradicen.
4. **Enlace publicado:** el README dice "App publicada: https://tu-enlace.vercel.app", que es un marcador de posición.
5. **README:** el encabezado "## Capturas de pantalla" está duplicado.
6. **Documentos de referencia:** `AGENTS.md` remite a `DESIGN.md`, `docs/prd/`, `docs/backlog/` y `docs/specs/`, que todavía no existen.
7. **Regla 5 de `AGENTS.md`:** `App.tsx` y `Auth.tsx` llaman directamente a `supabase.auth`; no hay un servicio de autenticación.
8. **Regla 4 de `AGENTS.md`:** el contador, el filtro y el orden (lógica de negocio) están dentro de `MiLista.tsx`; `src/dominio/` no existe.
9. **Regla 6 (sin `any`):** en `obtenerDetalle`, `respuesta.json()` devuelve `any` implícito (`d`) y se usa sin tipar; en `obtenerLista` se fuerza `data as TituloGuardado[]`.
10. **Estilo de código frente a Prettier:** el código usa comillas simples y no lleva punto y coma; Prettier sin configuración usa comillas dobles y punto y coma. Además, la indentación de `MiLista.tsx` y `Buscador.tsx` es irregular.
11. **Textos de la UI:** el tipo se muestra en crudo ("pelicula", sin tilde, o "serie"); el contador dice "pendientes / en progreso / vistas", mientras que el filtro dice "Por ver / Viendo / Vistas".
12. **`index.html`:** tiene `lang="en"` aunque la app está en español, el título es `mi-cartelera` y el favicon es el de Vite.
13. **Restos de la plantilla:** `App.css`, `src/assets/*` y `public/icons.svg` no se usan.
14. **Tipo `TituloGuardado`:** no incluye `user_id`, aunque `select('*')` lo devuelve.
15. **Colores en línea** (`red`, `lightgreen`) que no pertenecen a la paleta de `index.css`.

---

## 6. Riesgos

| #   | Riesgo                                                                                                                                                                                                  | Impacto                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| R1  | **La clave de TMDB viaja al navegador**: toda variable `VITE_*` queda dentro del bundle y además va en la URL de cada petición. Cualquiera puede verla y usarla.                                        | Abuso de la cuota de TMDB o revocación de la clave.       |
| R2  | **RLS no versionado**: si las políticas no existen o cambian en Supabase, un usuario podría leer o modificar los títulos de otro, y el código no lo detectaría.                                         | Fuga de datos entre usuarios.                             |
| R3  | **Sin tests**: cualquier cambio de la E2 puede romper la E1 sin que nadie lo note (contradice la regla 3).                                                                                              | Regresiones.                                              |
| R4  | **Hook de Prettier con el estilo actual**: cada vez que el agente edite un archivo existente, Prettier lo reformateará entero (comillas, `;`), y eso genera diffs ruidosos que esconden el cambio real. | Revisiones difíciles; commits mezclados.                  |
| R5  | **Variables de entorno sin validar**: si falta alguna, `createClient` falla al arrancar y TMDB recibe `api_key=undefined`; el usuario solo ve un error genérico.                                        | App en blanco o mensajes confusos.                        |
| R6  | **Carreras en peticiones**: ni la búsqueda ni el detalle cancelan las peticiones anteriores; una respuesta lenta puede pisar a una más reciente.                                                        | Resultados incorrectos en pantalla.                       |
| R7  | **El comentario solo se guarda en `onBlur`**: si el usuario cierra la pestaña o cambia de pantalla sin salir del campo, el texto se pierde.                                                             | Pérdida de datos del usuario.                             |
| R8  | **Dependencias externas en tiempo de ejecución** (TMDB, Google Fonts, CDN de imágenes) sin plan B.                                                                                                      | Funcionalidad degradada si alguno falla.                  |
| R9  | **Despliegue no documentado**: el enlace es un marcador de posición y no hay configuración de Vercel en el repositorio.                                                                                 | No se sabe qué versión está publicada ni cómo se publica. |

---

## 7. Deuda técnica

Solo se registra; no se corrige en este documento.

| Id   | Pendiente                                                                                                    | Archivo(s)                                               |
| ---- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| D-01 | Aplicar las clases `.rejilla`/`.tarjeta` (cuadrícula de pósters) en `MiLista` y `Buscador`, o borrarlas      | `index.css`, `MiLista.tsx`, `Buscador.tsx`               |
| D-02 | Decidir Bootstrap sí o no y alinear `AGENTS.md`, `DESIGN.md` y el código                                     | `AGENTS.md`                                              |
| D-03 | Crear `DESIGN.md` a partir de la paleta y la tipografía actuales de `index.css`                              | —                                                        |
| D-04 | Sustituir los colores en línea (`red`, `lightgreen`) por clases o variables de la paleta                     | `Auth.tsx`, `Buscador.tsx`, `MiLista.tsx`, `Detalle.tsx` |
| D-05 | Extraer contador, filtro y orden a funciones puras en `src/dominio/` con tests                               | `MiLista.tsx`                                            |
| D-06 | Instalar Vitest y agregar el script `npm test`                                                               | `package.json`                                           |
| D-07 | Crear un servicio de autenticación y sacar `supabase.auth` de los componentes                                | `App.tsx`, `Auth.tsx`                                    |
| D-08 | Tipar la respuesta de detalle de TMDB y eliminar el `any` implícito                                          | `tmdb.ts`                                                |
| D-09 | Evitar el cast `as TituloGuardado[]` (tipos generados de Supabase o validación)                              | `lista.ts`                                               |
| D-10 | Versionar el esquema de `mi_lista` y las políticas RLS en un archivo SQL o migración                         | —                                                        |
| D-11 | Validar las variables `VITE_*` al arrancar, con un mensaje claro si falta alguna                             | `supabase.ts`, `tmdb.ts`                                 |
| D-12 | Evaluar un proxy (p. ej. Edge Function) para no exponer la clave de TMDB                                     | `tmdb.ts`                                                |
| D-13 | Configurar Prettier (`.prettierrc`) con el estilo actual o reformatear todo en un commit separado            | raíz                                                     |
| D-14 | Borrar los restos de la plantilla de Vite: `App.css`, `src/assets/*`, `public/icons.svg`; cambiar el favicon | —                                                        |
| D-15 | `index.html`: `lang="es"` y el título "Mi Cartelera Personal"                                                | `index.html`                                             |
| D-16 | README: corregir `.env` → `.env.local`, el enlace publicado y el encabezado duplicado                        | `README.md`                                              |
| D-17 | El buscador no sabe qué títulos ya están guardados; solo marca los agregados en la sesión actual             | `Buscador.tsx`                                           |
| D-18 | Cancelar o ignorar las respuestas obsoletas en la búsqueda y en el detalle                                   | `Buscador.tsx`, `Detalle.tsx`                            |
| D-19 | Guardar el comentario de forma más segura y dar feedback de "guardado"                                       | `MiLista.tsx`                                            |
| D-20 | Etiquetas accesibles (`<label>`, `aria-label`) en inputs y selects                                           | todos los componentes                                    |
| D-21 | Mostrar el tipo legible ("Película" / "Serie") y unificar los textos de los estados                          | `Buscador.tsx`, `MiLista.tsx`                            |
| D-22 | Traducir o normalizar los mensajes de error de Supabase (ahora llegan en inglés)                             | `Auth.tsx`, `lista.ts`                                   |
| D-23 | El detalle no tiene URL: se pierde al recargar y no se puede compartir (no hay router)                       | `MiLista.tsx`                                            |
| D-24 | La búsqueda solo muestra la primera página de TMDB (20 resultados), sin paginación                           | `tmdb.ts`, `Buscador.tsx`                                |
| D-25 | Normalizar la indentación irregular                                                                          | `MiLista.tsx`, `Buscador.tsx`                            |
| D-26 | Manejar el error de `getSession()` en `App` (ahora se queda en "Cargando..." si falla)                       | `App.tsx`                                                |
| D-27 | Agregar `user_id` al tipo `TituloGuardado` o seleccionar solo las columnas necesarias                        | `types.ts`, `lista.ts`                                   |

---

## 8. Revisión del estudiante

- Generado con Claude Code a partir del código del repositorio (commit `6699ba5`) y revisado por Apauki el 2026-11-10.
- Comprobé en el navegador que la sección 1 es correcta: inicio de sesión, búsqueda en TMDB, agregar a la lista, cambiar estado y ver detalle funcionan como se describe.
- Confirmé la inconsistencia 2: la lista se ve en una sola columna, sin cuadrícula de pósters.
- Decisión pendiente: la app no usa Bootstrap (inconsistencia 1, deuda D-02). Se consultará al profesor antes de escribir `DESIGN.md`.