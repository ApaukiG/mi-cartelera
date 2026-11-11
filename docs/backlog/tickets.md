# Tickets — Épica E2 "Noche de película"

Fuentes: `docs/prd/PRD.md`, `docs/backlog/historias.md`, `docs/backlog/refinamiento.md`, `DESIGN.md` y `AGENTS.md`.

**Reglas para todos los tickets** (`AGENTS.md`):

- Un commit por ticket, con el id al principio: `[E2-T03] feat(dominio): …`.
- Ningún `feat` empieza sin su spec en `docs/specs/` (E2-T02).
- La E1 sigue funcionando igual. `npm run lint`, `npm run build` y, desde E2-T01, `npm test` pasan en cada commit.
- TypeScript sin `any`. Los componentes no llaman a Supabase ni a TMDB. Los estilos siguen `DESIGN.md`.

---

### E2-T00 — Formatear `src` con Prettier

- **Tipo:** style
- **Descripción:** ejecutar `npx prettier --write src` con el `.prettierrc` actual en un commit que solo cambie el formato, para que los commits siguientes muestren únicamente cambios reales. Resuelve la deuda D-13 (y D-25, indentación irregular).
- **Cubre:** ninguna historia (preparación).
- **Definition of Done:**
  - `npx prettier --check src` no marca ningún archivo.
  - `git diff --stat` del commit solo muestra archivos de `src/`; no se agregan ni borran archivos.
  - `npm run lint` y `npm run build` pasan.
  - Prueba manual: login, buscar, agregar, cambiar estado, calificar, comentar, ver detalle y eliminar funcionan igual que antes.
- **Dependencias:** E2-T02.

### E2-T01 — Instalar Vitest y el script `npm test`

- **Tipo:** chore
- **Descripción:** agregar Vitest como dependencia de desarrollo y el script `"test": "vitest run"` en `package.json`. Resuelve la deuda D-06.
- **Cubre:** ninguna historia (preparación).
- **Definition of Done:**
  - `npm test` termina con código 0 y ejecuta al menos un test de humo de `src/dominio/`.
  - `npm run build` no incluye los archivos de test en el bundle.
  - `AGENTS.md` ya no dice "se agrega en la épica E2" junto a `npm test`.
- **Dependencias:** E2-T00.

### E2-T02 — Spec de Noche de película

- **Tipo:** docs
- **Descripción:** escribir `docs/specs/noche-de-pelicula.md` con el detalle técnico que el PRD no tiene: funciones del dominio y sus firmas, modelo de datos de las sesiones, servicios, pantallas y estados, mensajes exactos, navegación entre Mi lista y Noche de película, y trazabilidad de cada CA. Requisito de la regla 1 de `AGENTS.md`.
- **Cubre:** HU-01 a HU-06 (todas).
- **Definition of Done:**
  - Existe `docs/specs/noche-de-pelicula.md`.
  - Cada CA de `historias.md` aparece en la spec al menos una vez.
  - La spec no contradice ninguna RN ni ningún SU del PRD.
- **Dependencias:** ninguna. Es el primer ticket que se ejecuta: el historial debe mostrar los documentos antes que cualquier cambio de código.

### E2-T03 — Dominio: cálculo de "cabe"

- **Tipo:** feat
- **Descripción:** funciones puras en `src/dominio/sesion.ts` (sin red ni Supabase) para:
  - validar el tiempo disponible (entero entre 30 y 600);
  - decidir si una duración es válida (null o 0 se consideran desconocidas);
  - calcular el tiempo total con pausas: suma de las duraciones + 10 × (n − 1);
  - decidir si una sesión cabe (total ≤ tiempo disponible);
  - calcular el tiempo restante o el exceso.

  Incluye sus tests en Vitest.

- **Cubre:** HU-01, HU-02 · CA-01.2, CA-01.3, CA-01.4, CA-01.5, CA-01.9, CA-02.1, CA-02.2, CA-02.3, CA-02.7, CA-02.8, CA-02.9, CA-02.10 · RN-01, RN-03, RN-04, RN-05, RN-12.
- **Definition of Done:**
  - Hay tests de estos bordes y pasan:
    - sesión que ocupa exactamente el tiempo (cabe);
    - un minuto más (no cabe);
    - una sola película (sin pausa);
    - sesión vacía (total 0);
    - duración null y duración 0 (desconocidas);
    - tiempos 29, 30, 600, 601, 90.5 y NaN.
  - Hay un test de la sesión de 3 películas al quitar la del medio.
  - El archivo no importa nada de `src/lib/`, Supabase ni `fetch`.
  - Sin `any`.
- **Dependencias:** E2-T01, E2-T02.

### E2-T04 — Dominio: qué cabe, orden y nombre de la sesión

- **Tipo:** feat
- **Descripción:** funciones puras en `src/dominio/` para:
  - clasificar las películas candidatas en "caben" y "no disponibles", con el motivo de cada una (no cabe, sin duración, no se pudo obtener la duración), calculado contra el tiempo que queda (SU-02);
  - excluir series, títulos que no están «por ver» y películas ya agregadas;
  - ordenar: las que caben y las que no caben, de la más corta a la más larga con desempate alfabético; las que no tienen duración al final, por orden alfabético;
  - validar y normalizar el nombre (quitar espacios de los extremos; de 1 a 60 caracteres).

  Incluye sus tests.

- **Cubre:** HU-01, HU-02, HU-03 · CA-01.6, CA-01.7, CA-01.8, CA-01.10, CA-01.14, CA-01.15, CA-01.16, CA-02.4, CA-02.5, CA-02.6, CA-02.11, CA-03.2, CA-03.3, CA-03.4, CA-03.5 · RN-02, RN-05, RN-08, RN-11, SU-01, SU-02, SU-03, SU-04 · CB-03, CB-04, CB-09, CB-12, CB-20.
- **Definition of Done:**
  - Hay tests que pasan:
    - el orden Beta (88), Alfa (95), Zeta (95);
    - la película de 10 minutos que cabe y la de 15 que no, con 20 restantes;
    - nombres " " (inválido), " Maratón " (se guarda como "Maratón"), 60 caracteres (válido), 61 (inválido) y uno con ñ y tildes (cada letra cuenta como un carácter).
  - Sin red, sin Supabase y sin `any`.
- **Dependencias:** E2-T03.

### E2-T05 — Migración SQL de las sesiones con RLS

- **Tipo:** feat
- **Descripción:** archivo versionado `supabase/migrations/<fecha>_sesiones.sql` con:
  - una tabla de sesiones: usuario, nombre, tiempo disponible, tiempo total y fecha de creación;
  - una tabla de películas de cada sesión: posición, id de TMDB, título y duración copiados;
  - restricciones `check`: nombre de 1 a 60 caracteres sin espacios en los extremos, tiempo entre 30 y 600, duración > 0;
  - borrado en cascada de las películas al eliminar la sesión;
  - RLS activado, con políticas `select`, `insert` y `delete` limitadas a `auth.uid() = user_id`, y **sin** política `update` (RN-09).

  No toca la tabla `mi_lista` de la E1.

- **Cubre:** HU-03, HU-04, HU-05, HU-06 · CA-03.1, CA-03.12, CA-04.4, CA-04.6, CA-06.1, CA-06.2 · RN-07, RN-09, RN-10, RN-11, RN-15, SU-05, SU-06.
- **Definition of Done:**
  - El SQL se ejecuta sin errores en el SQL Editor de Supabase.
  - Con el usuario A se puede insertar y leer una sesión propia. Con el usuario B, la misma consulta devuelve 0 filas y no puede eliminarla.
  - Un `update` sobre una sesión falla para su propio dueño.
  - Eliminar una fila de `mi_lista` no altera las películas copiadas en las sesiones.
- **Dependencias:** E2-T02.

### E2-T06 — Servicio de TMDB para la duración

- **Tipo:** feat
- **Descripción:** función en `src/lib/tmdb.ts` que devuelve la duración en minutos de una película a partir de su id de TMDB, o `null` si no la conoce (0 se trata como `null`). La respuesta va tipada, sin `any`. Si fallan algunas peticiones, el resto de duraciones se devuelve igual, y cada película que falla queda marcada como "no se pudo obtener". La clave se lee solo con `import.meta.env.VITE_TMDB_API_KEY`.
- **Cubre:** HU-01 · CA-01.8, CA-01.9, CA-01.12, CA-01.16 · RN-05 · CB-05, CB-06.
- **Definition of Done:**
  - El mapeo de la respuesta de TMDB a duración es una función pura con tests: valor normal, 0, campo ausente y null.
  - No se agrega ningún `any` (`npm run lint` y `npm run build` pasan).
  - `buscarTitulos` y `obtenerDetalle` de la E1 no cambian de comportamiento.
- **Dependencias:** E2-T03.

### E2-T07 — Servicio de Supabase para las sesiones

- **Tipo:** feat
- **Descripción:** `src/lib/sesiones.ts` con funciones para crear una sesión con sus películas, listar las sesiones (de la más reciente a la más antigua, con sus películas en orden) y eliminar una sesión. Los errores se traducen a mensajes en español.
- **Cubre:** HU-03, HU-04, HU-05 · CA-03.1, CA-03.11, CA-04.1, CA-04.2, CA-05.1, CA-05.4 · RN-11, SU-05, SU-06.
- **Definition of Done:**
  - Las tres funciones funcionan contra la base de datos real, sin casts del tipo `as` sobre los datos devueltos.
  - Si la creación falla a mitad, no queda una sesión sin películas.
  - Los errores llegan como `Error` con un mensaje en español.
  - Ningún componente importa `supabase` para trabajar con las sesiones.
- **Dependencias:** E2-T05.

### E2-T08 — Tokens y clases [NUEVO] de DESIGN.md

- **Tipo:** style
- **Descripción:** agregar a `src/index.css` lo que la pantalla necesita:
  - los tokens `--texto-sobre-acento`, `--error` y `--exito`;
  - las clases `.mensaje`, `.mensaje-error`, `.mensaje-exito` y `.mensaje-vacio`;
  - la regla `button[type='submit']` usando `var(--texto-sobre-acento)`.

  Actualizar `DESIGN.md` quitando la marca [NUEVO] de lo agregado. No cambia la apariencia de la E1 (los estilos en línea de la E1 se quedan; su limpieza es D-04, fuera de esta épica).

- **Cubre:** soporte visual de HU-01 a HU-05 (mensajes de carga, error, éxito y vacío).
- **Definition of Done:**
  - Los tokens y las clases existen en `src/index.css` con los valores de `DESIGN.md`.
  - `DESIGN.md` ya no marca como [NUEVO] lo agregado.
  - El botón "Buscar" de la E1 se ve igual que antes (mismo color computado).
  - `docs/diseno/brand-board.html` sigue coincidiendo con los valores.
- **Dependencias:** E2-T00.

### E2-T09 — Acceso a Noche de película solo con sesión iniciada

- **Tipo:** feat
- **Descripción:** agregar en la cabecera la navegación entre "Mi lista" y "Noche de película", visible solo con sesión iniciada. Mi lista (buscador y lista) sigue siendo la vista por defecto y se comporta igual.
- **Cubre:** HU-06 · CA-06.3.
- **Definition of Done:**
  - Sin sesión solo se ve la pantalla de acceso; con sesión, la cabecera ofrece las dos vistas.
  - Al cerrar sesión desde Noche de película se vuelve a la pantalla de acceso.
  - Recorrido completo de la E1 sin cambios (mismo recorrido manual de E2-T00).
- **Dependencias:** E2-T02, E2-T08.

### E2-T10 — Pantalla, parte 1: tiempo y qué cabe

- **Tipo:** feat
- **Descripción:** en Noche de película, un campo para el tiempo disponible y la lista de películas que caben y de las no disponibles con su motivo, usando el dominio (E2-T03, E2-T04) y el servicio de duración (E2-T06). Incluye los estados de carga, error con reintento y vacío. Las películas se muestran en `.rejilla` / `.tarjeta`.
- **Cubre:** HU-01 · CA-01.1 a CA-01.16, CA-06.4.
- **Definition of Done:**
  - Se crea `docs/VERIFICACION.md` con su primera sección (HU-01), donde E2-T11 a E2-T13 agregan las suyas.
  - Cada CA de HU-01 se comprueba manualmente en el navegador y se marca en `docs/VERIFICACION.md`.
  - El componente no importa `supabase` ni llama a `fetch`.
  - Sin estilos en línea (DIS-01), y los mensajes usan las clases `.mensaje*` (DIS-12, DIS-13).
- **Dependencias:** E2-T04, E2-T06, E2-T09.

### E2-T11 — Pantalla, parte 2: armar la sesión

- **Tipo:** feat
- **Descripción:** agregar y quitar películas en la sesión en armado, mostrando el tiempo total (con pausas), el tiempo restante o el exceso, y la explicación de cada película no disponible. "Qué cabe" se recalcula con cada cambio, y también al cambiar el tiempo disponible.
- **Cubre:** HU-02 · CA-02.1 a CA-02.11 · RN-03, RN-04, RN-12, SU-02, SU-03.
- **Definition of Done:**
  - Cada CA de HU-02 se comprueba en el navegador con los números del criterio y se marca en `docs/VERIFICACION.md`.
  - Todo cálculo sale de `src/dominio/` (el componente no suma duraciones ni pausas por su cuenta).
- **Dependencias:** E2-T10.

### E2-T12 — Pantalla, parte 3: guardar, listar y eliminar sesiones

- **Tipo:** feat
- **Descripción:**
  - guardar la sesión con un nombre, con las validaciones, el botón deshabilitado mientras guarda y el mensaje de éxito o de error;
  - listar las sesiones guardadas con su detalle;
  - eliminar una sesión con confirmación.

  Todo a través del servicio E2-T07.

- **Cubre:** HU-03, HU-04, HU-05 · CA-03.1 a CA-03.12, CA-04.1 a CA-04.7, CA-05.1 a CA-05.4 · RN-06, RN-07, RN-09, RN-10, RN-11, RN-13, RN-14, RN-15.
- **Definition of Done:**
  - Cada CA de HU-03, HU-04 y HU-05 se comprueba en el navegador y se marca en `docs/VERIFICACION.md`.
  - Tras guardar, las películas siguen «por ver» en Mi lista (CA-03.7).
  - No existe ningún botón ni campo para editar una sesión guardada (CA-04.6).
- **Dependencias:** E2-T07, E2-T11.

### E2-T13 — Prueba de privacidad con dos cuentas

- **Tipo:** test
- **Descripción:** verificar con dos usuarios reales (A y B) que ninguno ve, crea a nombre del otro ni elimina las sesiones del otro, tanto desde la app como con consultas directas usando la clave pública. Documentar los pasos y el resultado.
- **Cubre:** HU-06 · CA-06.1, CA-06.2, CA-06.4.
- **Definition of Done:**
  - Los pasos y la evidencia (fecha, resultado de cada consulta) están en `docs/VERIFICACION.md`.
  - Todos los intentos cruzados devuelven 0 filas o un error de permisos.
- **Dependencias:** E2-T05, E2-T12.

### E2-T14 — Completar y cerrar `docs/VERIFICACION.md`

- **Tipo:** docs
- **Descripción:** completar y cerrar `docs/VERIFICACION.md`, creado en E2-T10 y ampliado en E2-T11 a E2-T13, como checklist final de la épica:
  - cada CA de `historias.md` con su resultado (✔ o ✘) y la fecha;
  - los criterios DIS-01 a DIS-15 de `DESIGN.md` aplicados a Noche de película;
  - la regresión de la E1 (recorrido completo);
  - la salida de `npm run lint`, `npm run build` y `npm test`.
- **Cubre:** HU-01 a HU-06 (verificación).
- **Definition of Done:**
  - Todos los CA y DIS aplicables están marcados con su resultado; ningún ✘ queda sin un ticket de corrección.
  - La regresión de la E1 está completa.
  - Los tres comandos pasan en el último commit de la épica.
- **Dependencias:** E2-T12, E2-T13.

### E2-T15 — Mejora visual de la E1

- **Tipo:** style
- **Descripción:** aplicar a las pantallas de la E1 el sistema de `DESIGN.md` sin cambiar su comportamiento. Resuelve las deudas D-01 y D-04 de `docs/ESTADO-INICIAL.md`:
  - los resultados del buscador y Mi lista se muestran como cuadrícula de pósters: `.rejilla` > `.tarjeta`, con `.insignia`, `.sin-poster` y `.tarjeta-cuerpo` (D-01);
  - los colores en línea (`red`, `lightgreen`) se sustituyen por `.mensaje-error` y `.mensaje-exito` en `Auth`, `Buscador`, `MiLista` y `Detalle` (D-04). Los textos de carga y de estado vacío de esas pantallas usan `.mensaje` y `.mensaje-vacio`;
  - la cabecera se reordena para que "Cerrar sesión" no quede sola en otra línea: el correo y el botón van juntos (`.cabecera-usuario`) y la navegación pasa a su propia fila;
  - la vista activa de la navegación se marca visualmente (`nav button[aria-current='page']`).
- **Cubre:** ninguna historia (deuda técnica de la E1, D-01 y D-04). Spec: `docs/specs/noche-de-pelicula.md` §9.
- **Definition of Done:**
  - Se cumplen DIS-01, DIS-02, DIS-08, DIS-09, DIS-10, DIS-11 y DIS-14 en toda la app, comprobados en el navegador.
  - La E1 se comporta igual: el recorrido R-01 a R-08 de `docs/VERIFICACION.md` da el mismo resultado y ningún texto cambia.
  - No cambia ningún archivo de `src/lib/`, `src/dominio/` ni `src/components/noche/`.
  - Las clases y los selectores nuevos están en `DESIGN.md` y en `docs/diseno/brand-board.html` antes de usarse.
  - `npm test`, `npm run lint` y `npm run build` pasan.
- **Dependencias:** E2-T14.

---

## Dependencias en orden de ejecución

| Orden | Ticket | Tipo  | Depende de             | Se puede hacer en paralelo con |
| ----- | ------ | ----- | ---------------------- | ------------------------------ |
| 1     | E2-T02 | docs  | —                      | —                              |
| 2     | E2-T00 | style | E2-T02                 | —                              |
| 3     | E2-T01 | chore | E2-T00                 | —                              |
| 4     | E2-T03 | feat  | E2-T01, E2-T02         | E2-T05, E2-T08                 |
| 5     | E2-T04 | feat  | E2-T03                 | E2-T06, E2-T07                 |
| 6     | E2-T05 | feat  | E2-T02                 | E2-T03, E2-T04                 |
| 7     | E2-T06 | feat  | E2-T03                 | E2-T04, E2-T07                 |
| 8     | E2-T07 | feat  | E2-T05                 | E2-T04, E2-T06                 |
| 9     | E2-T08 | style | E2-T00                 | E2-T03 a E2-T07                |
| 10    | E2-T09 | feat  | E2-T02, E2-T08         | E2-T03 a E2-T07                |
| 11    | E2-T10 | feat  | E2-T04, E2-T06, E2-T09 | —                              |
| 12    | E2-T11 | feat  | E2-T10                 | —                              |
| 13    | E2-T12 | feat  | E2-T07, E2-T11         | —                              |
| 14    | E2-T13 | test  | E2-T05, E2-T12         | —                              |
| 15    | E2-T14 | docs  | E2-T12, E2-T13         | —                              |
| 16    | E2-T15 | style | E2-T14                 | —                              |
