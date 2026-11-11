# AGENTS.md — Mi Cartelera Personal

## Proyecto
App web para registrar películas y series (por ver / viendo / vista) con calificación y comentario.
Stack: React + TypeScript + Vite, Supabase (Auth + PostgreSQL con RLS), API de TMDB. Estilos con CSS propio en `src/index.css`, documentado en `DESIGN.md` (sin Bootstrap; ver D-02 en docs/ESTADO-INICIAL.md).

## Comandos
- `npm run dev` — servidor local
- `npm run build` — compilar (incluye chequeo de TypeScript)
- `npm run lint` — ESLint
- `npm test` — Vitest (tests de `src/dominio/` y de las funciones puras de `src/lib/`)

## Reglas de trabajo
1. Ninguna funcionalidad sin spec: antes de escribir código debe existir su spec en `docs/specs/`. Si no existe, detente y pídela.
2. Trabaja por tickets de `docs/backlog/`: un commit por ticket, con el id del ticket en el mensaje.
3. No reescribas el Proyecto 3 (épica E1): lo existente debe seguir funcionando igual.
4. La lógica de negocio va en funciones puras en `src/dominio/`, sin red ni Supabase, y con tests en Vitest.
5. Los componentes no llaman a Supabase ni a TMDB; eso lo hacen los servicios.
6. TypeScript sin `any`.
7. Los estilos siguen `DESIGN.md`; no inventes colores ni componentes fuera de él.

## Reglas de claves
- Las claves de TMDB y Supabase viven solo en `.env.local`, que está en `.gitignore`.
- Nunca escribas una clave en el código, en un commit, en la documentación ni en la terminal.
- Nunca leas ni muestres el contenido de `.env.local`.
- En el código, las claves se leen solo con `import.meta.env.VITE_*`.
- Si encuentras una clave en el repositorio, detente y avisa.

## Documentos de referencia
- `docs/ESTADO-INICIAL.md` — qué hace hoy la app
- `docs/prd/`, `docs/backlog/`, `docs/specs/` — especificación de las épicas
- `DESIGN.md` — sistema de diseño