# Auditoría — Épica E2 "Noche de película"

Auditoría del 11-nov, hecha después de cerrar `docs/VERIFICACION.md` (E2-T14, commit `d2467e8`). Revisa cada criterio de aceptación (CA), cada criterio de la spec (S-xx) y cada criterio de diseño aplicado a Noche de película (DIS-xx).

## Cómo leer los estados

| Estado            | Significa                                                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **cumple**        | Hay evidencia de que funciona: una prueba en el navegador registrada en `VERIFICACION.md`, un test de Vitest que pasa o una revisión de código o de la migración. Cuando la evidencia es solo un test, se prueba la lógica, pero no el texto en pantalla. |
| **no cumple**     | La evidencia muestra que no funciona.                                                                                                                                                                                                                     |
| **sin verificar** | No hay evidencia todavía.                                                                                                                                                                                                                                 |

Evidencias:

- **VERIFICACION:** fila del criterio en `docs/VERIFICACION.md`.
- **Test:** archivo de Vitest. `npm test` pasa: 6 archivos y 80 tests, ejecutado el 11-nov.
- **Código:** revisión o comando de la spec §7.2.
- **Commit:** el commit del ticket que lo implementa.
- **Captura:** no hay capturas de la E2. `capturas/` solo tiene las de la E1 y `docs/evidencia/` está vacía (ver H-08).

Commits de la épica: E2-T03 `6be1430`, E2-T04 `3d19729`, E2-T05 `3d5d798`, E2-T06 `e3a4643`, E2-T07 `e9a39e0`, E2-T08 `66d77bb`, E2-T09 `f6645f7`, E2-T10 `5becd13`, E2-T11 `888473a`, E2-T12 `f689f21`, E2-T13 `6f87989`, E2-T14 `d2467e8`.

## Resumen

| Grupo       | cumple | no cumple | sin verificar |
| ----------- | ------ | --------- | ------------- |
| CA (54)     | 42     | 0         | 12            |
| S-xx (22)   | 17     | 0         | 5             |
| DIS-xx (15) | 8      | 0         | 7             |

No hay ningún criterio que **no cumpla**. Los que están **sin verificar** dependen de pruebas manuales que faltan; se recogen en los hallazgos H-02 a H-05.

---

## Criterios de aceptación

### HU-01 — Ver qué películas caben en mi tiempo (`5becd13`)

| Criterio | Estado | Evidencia                                                                                                                                  |
| -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| CA-01.1  | cumple | VERIFICACION ✔ 10-nov · test `candidatas.test.ts`                                                                                          |
| CA-01.2  | cumple | Test `candidatas.test.ts › una película de exactamente 120 cabe en 120` y `sesion.test.ts › cabe › una sola película igual al tiempo cabe` |
| CA-01.3  | cumple | Test `sesion.test.ts › acepta 30 y 600 (límites)`                                                                                          |
| CA-01.4  | cumple | Test `sesion.test.ts › rechaza 29 y 601 como fuera_de_rango`. Código: `onInvalido` oculta las películas (spec §5.2, `9516956`)             |
| CA-01.5  | cumple | Test `sesion.test.ts › rechaza "" y "   " como vacio` y `› rechaza "90,5", … como no_entero`                                               |
| CA-01.6  | cumple | Test `candidatas.test.ts › excluye las que están viendo o vista`                                                                           |
| CA-01.7  | cumple | Test `candidatas.test.ts › excluye las series`                                                                                             |
| CA-01.8  | cumple | Test `candidatas.test.ts › una película sin duración es no disponible…`                                                                    |
| CA-01.9  | cumple | Test `duracion.test.ts › 0 → null` y `candidatas.test.ts › una duración 0 es no disponible…`                                               |
| CA-01.10 | cumple | VERIFICACION ✔ 10-nov · test `candidatas.test.ts › ordena Beta (88), Alfa (95), Zeta (95)`                                                 |
| CA-01.11 | cumple | VERIFICACION ✔ 11-nov ("Slow 3G")                                                                                                          |
| CA-01.12 | cumple | VERIFICACION ✔ 11-nov ("Offline" y "Reintentar") · test `tmdb.test.ts › si fallan todas…`                                                  |
| CA-01.13 | cumple | Test `candidatas.test.ts › sin películas por ver → caben y noDisponibles vacíos`                                                           |
| CA-01.14 | cumple | VERIFICACION ✔ 10-nov · test `candidatas.test.ts › si ninguna cabe`                                                                        |
| CA-01.15 | cumple | VERIFICACION ✔ 10-nov · test `candidatas.test.ts › una película de 140 con 120 min…`                                                       |
| CA-01.16 | cumple | Test `tmdb.test.ts › si fallan algunas, marca error solo en esas` y `candidatas.test.ts › una duración con error…`                         |

### HU-02 — Armar una sesión (`888473a`)

| Criterio | Estado | Evidencia                                                                                                                                         |
| -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-02.1  | cumple | Test `sesion.test.ts › una sola película no lleva pausa` y `› balance`                                                                            |
| CA-02.2  | cumple | VERIFICACION ✔ 10-nov · test `sesion.test.ts › dos películas llevan una pausa`                                                                    |
| CA-02.3  | cumple | Test `sesion.test.ts › cabe › una sesión que ocupa exactamente el tiempo disponible cabe` y `› validarSesionParaGuardar › una sesión exacta → ok` |
| CA-02.4  | cumple | VERIFICACION ✔ 10-nov · test `candidatas.test.ts › con 20 restantes cabe la de 10 y no la de 15`                                                  |
| CA-02.5  | cumple | VERIFICACION ✔ 10-nov · test `sesion.test.ts › minutosNecesarios › con películas en la sesión suma la pausa`                                      |
| CA-02.6  | cumple | Test `candidatas.test.ts › una película ya agregada no aparece`                                                                                   |
| CA-02.7  | cumple | Test `sesion.test.ts › una sesión vacía suma 0` y `candidatas.test.ts › al quitar una película de la sesión vuelve a ser candidata`               |
| CA-02.8  | cumple | Test `sesion.test.ts › quitar la del medio deja una pausa`                                                                                        |
| CA-02.9  | cumple | Test `sesion.test.ts › balance › 170 de 150` y `› validarSesionParaGuardar › una sesión que se excede`                                            |
| CA-02.10 | cumple | Test `sesion.test.ts › balance › 170 de 180`                                                                                                      |
| CA-02.11 | cumple | Test `candidatas.test.ts › aPeliculaEnSesion › lanza RangeError si la duración no es conocida`                                                    |

### HU-03 — Guardar la sesión (`f689f21`)

| Criterio | Estado        | Evidencia                                                                                                                           |
| -------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| CA-03.1  | cumple        | VERIFICACION ✔ 10-nov                                                                                                               |
| CA-03.2  | cumple        | Test `sesion.test.ts › una sesión vacía → sin_peliculas` · migración: `crear_sesion` rechaza `[]`                                   |
| CA-03.3  | cumple        | VERIFICACION ✔ 10-nov · test `nombre.test.ts › "" → vacio` y `› "   " → vacio`                                                      |
| CA-03.4  | cumple        | Test `nombre.test.ts › "  Maratón de domingo  " → "Maratón de domingo"`                                                             |
| CA-03.5  | cumple        | Test `nombre.test.ts › 60 caracteres…`, `› 61 caracteres…` y `› 60 caracteres con ñ y tildes…` · migración: `sesiones_nombre_largo` |
| CA-03.6  | sin verificar | Solo se puede comprobar en el navegador (H-04)                                                                                      |
| CA-03.7  | sin verificar | Solo se puede comprobar en el navegador (H-04)                                                                                      |
| CA-03.8  | sin verificar | Solo se puede comprobar en el navegador (H-04)                                                                                      |
| CA-03.9  | cumple        | Test `sesion.test.ts › una sesión que se excede…` · migración: `crear_sesion` recalcula el total                                    |
| CA-03.10 | sin verificar | Código: el botón se deshabilita mientras `guardando` (S-11). Falta probarlo en el navegador (H-04)                                  |
| CA-03.11 | sin verificar | Solo se puede comprobar en el navegador (H-04)                                                                                      |
| CA-03.12 | sin verificar | Opcional. Migración: no hay ninguna restricción de cantidad (H-04)                                                                  |

### HU-04 — Consultar mis sesiones guardadas (`f689f21`)

| Criterio | Estado        | Evidencia                                                                                                           |
| -------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| CA-04.1  | cumple        | VERIFICACION ✔ 10-nov                                                                                               |
| CA-04.2  | cumple        | VERIFICACION ✔ 10-nov · test `sesiones.test.ts › convierte una fila válida` y `› ordena las películas por posición` |
| CA-04.3  | sin verificar | Hace falta una cuenta sin sesiones (H-04)                                                                           |
| CA-04.4  | sin verificar | Migración: no hay FK a `mi_lista` (RN-10). Falta probarlo en el navegador (H-04)                                    |
| CA-04.5  | sin verificar | Falta probarlo en el navegador (H-04)                                                                               |
| CA-04.6  | cumple        | VERIFICACION ✔ 11-nov · migración: `revoke update`                                                                  |
| CA-04.7  | cumple        | VERIFICACION ✔ 11-nov                                                                                               |

### HU-05 — Eliminar una sesión (`f689f21`)

| Criterio | Estado        | Evidencia                                                     |
| -------- | ------------- | ------------------------------------------------------------- |
| CA-05.1  | cumple        | VERIFICACION ✔ 11-nov                                         |
| CA-05.2  | cumple        | VERIFICACION ✔ 11-nov                                         |
| CA-05.3  | cumple        | VERIFICACION ✔ 11-nov                                         |
| CA-05.4  | sin verificar | Falta probarlo en el navegador con la red en "Offline" (H-04) |

### HU-06 — Privacidad de mis sesiones (`3d5d798`, `6f87989`)

| Criterio | Estado        | Evidencia                                                                                                     |
| -------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| CA-06.1  | cumple        | VERIFICACION ✔ 10-nov (app, dos cuentas). Falta la parte de consola (H-03)                                    |
| CA-06.2  | sin verificar | Migración: políticas RLS `auth.uid() = user_id` en las dos tablas. Faltan las pruebas desde la consola (H-03) |
| CA-06.3  | sin verificar | Código: `App.tsx` vuelve a `Auth` cuando no hay sesión. Falta probarlo en el navegador (H-04)                 |
| CA-06.4  | cumple        | VERIFICACION ✔ 10-nov (dos cuentas)                                                                           |

---

## Criterios de la spec (S-xx)

| Criterio | Estado        | Evidencia                                                                                                              |
| -------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| S-01     | cumple        | Código: los componentes usan `balance`, `minutosDePausas`, `clasificarCandidatas` y `validarSesionParaGuardar`         |
| S-02     | cumple        | Código: `grep "supabase\|fetch("` en `src/components/noche` no devuelve nada                                           |
| S-03     | cumple        | Código: no hay `any` ni `as` en `src` (sin contar los tests). Lint y build pasan                                       |
| S-04     | cumple        | Código: el único `10` es `PAUSA_MIN = 10`; `c_pausa` en la migración lleva su comentario                               |
| S-05     | cumple        | Código: `crearSesion` solo usa `supabase.rpc('crear_sesion')`. La prueba SQL del rollback está pendiente (H-03)        |
| S-06     | cumple        | Migración: `revoke update` y ninguna política `for update`; la interfaz no permite editar (CA-04.6)                    |
| S-07     | sin verificar | CA-05.3 ✔; falta CA-03.7 (H-04)                                                                                        |
| S-08     | sin verificar | Código: `div hidden` en `App.tsx`. Falta la regresión de la E1 (H-02)                                                  |
| S-09     | cumple        | Código: `git diff 7ffcbc3 HEAD -- package.json` solo agrega `vitest` (devDependency)                                   |
| S-10     | cumple        | Código: `import.meta.env` solo en `src/lib/`; `.env.local` está en `.gitignore`                                        |
| S-11     | cumple        | Código: `disabled={guardando}` en `GuardarSesion`                                                                      |
| S-12     | sin verificar | Depende de CA-03.11 (H-04)                                                                                             |
| S-13     | cumple        | Tests de dominio y, en la migración, los `check` y `crear_sesion`. Las pruebas SQL directas están pendientes (H-03)    |
| S-14     | cumple        | DIS-01 a DIS-04. Todas las clases de `noche/` están documentadas en `DESIGN.md`                                        |
| S-15     | cumple        | Test `nombre.test.ts › 60 caracteres con ñ y tildes` y `› cuenta un emoji como un solo carácter`                       |
| S-16     | cumple        | Test `tmdb.test.ts › nunca hace más de 5 peticiones simultáneas (S-16)`                                                |
| S-17     | sin verificar | Código: la carga se hace solo en el montaje. Falta comprobarlo en Network (H-05)                                       |
| S-18     | cumple        | Código: desde `8befc21` no cambia `lista.ts`, y en `tmdb.ts` solo hay líneas añadidas                                  |
| S-19     | cumple        | Código: todos los textos de tiempo terminan en "min"                                                                   |
| S-20     | sin verificar | Depende de CA-06.3 (H-04)                                                                                              |
| S-21     | cumple        | Test `candidatas.test.ts › con 20 restantes…`                                                                          |
| S-22     | cumple        | VERIFICACION: los tres comandos pasan en el último commit. En los commits anteriores no se volvieron a ejecutar (H-07) |

---

## Criterios de diseño en Noche de película (DIS-xx)

| Criterio | Estado        | Evidencia                                                                                                    |
| -------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| DIS-01   | cumple        | Código: no hay `style=` en `src/components/noche`. En la E1 sí hay estilos en línea: es la deuda D-04 (H-06) |
| DIS-02   | cumple        | Código: `mensaje-error` y `mensaje-exito` usan los tokens `--error` y `--exito` (`66d77bb`)                  |
| DIS-03   | cumple        | Código: solo se importa Cinzel en `index.css`                                                                |
| DIS-04   | cumple        | Código: `package.json` no tiene ninguna librería de UI                                                       |
| DIS-05   | sin verificar | Recorrido con Tab pendiente (H-05)                                                                           |
| DIS-06   | cumple        | Código: dos `form`, con un `submit` cada uno                                                                 |
| DIS-07   | cumple        | VERIFICACION ✔ 10-nov (CA-02.5, botón deshabilitado)                                                         |
| DIS-08   | cumple        | Código: `ul.rejilla` en las candidatas y en las sesiones guardadas                                           |
| DIS-09   | sin verificar | Medición pendiente (H-05)                                                                                    |
| DIS-10   | sin verificar | Hover pendiente (H-05)                                                                                       |
| DIS-11   | sin verificar | Hace falta una candidata sin póster (H-05)                                                                   |
| DIS-12   | cumple        | VERIFICACION ✔ 11-nov ("Slow 3G")                                                                            |
| DIS-13   | sin verificar | Solo se probó "ninguna cabe"; faltan los demás estados vacíos (H-05)                                         |
| DIS-14   | sin verificar | Vista de 360px pendiente (H-05)                                                                              |
| DIS-15   | sin verificar | Contraste pendiente (H-05)                                                                                   |

---

## Hallazgos

| Id   | Hallazgo                                                                                                                                                                                   | Resolución                                                                                                                                                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H-01 | La spec no recogía dos decisiones de la implementación: la prop `onInvalido` de `FormularioTiempo` y la clase `.rejilla` en las sesiones guardadas.                                        | **Corregido** en `9516956` (`docs(spec): alinea la spec con la implementación`).                                                                                                                                                                                                                                   |
| H-02 | La regresión de la E1 (R-01 a R-08 en `VERIFICACION.md`) no se ha hecho. Por eso no se cumple del todo la Definition of Done de E2-T14.                                                    | **Pendiente.** Hay que recorrer la app a mano con una cuenta real. Las filas están listas en `VERIFICACION.md`.                                                                                                                                                                                                    |
| H-03 | Faltan las pruebas RLS desde la consola (CA-06.2, la parte de consola de CA-06.1, RN-09 y "Sin sesión") y las pruebas SQL de S-05 y S-13.                                                  | **Pendiente.** Hacen falta dos cuentas y la sesión del navegador de cada una. Según `AGENTS.md`, el agente no puede leer ni usar las claves de `.env.local`, así que las debe hacer la persona. El procedimiento está en `VERIFICACION.md` (HU-06). Mientras tanto, la política RLS está revisada en la migración. |
| H-04 | Hay 11 CA que solo se pueden comprobar en el navegador y que no se probaron: CA-03.6, 03.7, 03.8, 03.10, 03.11, 03.12, 04.3, 04.4, 04.5, 05.4 y 06.3. De ellos dependen S-07, S-12 y S-20. | **Pendiente.** Son los pasos 7 a 9, 13 y 14 de la checklist manual. No hay indicios de fallo: el código sigue la spec en todos.                                                                                                                                                                                    |
| H-05 | Hay criterios visuales sin medir: DIS-05, 09, 10, 11, 13 (en parte), 14 y 15, además de S-17 (Network).                                                                                    | **Pendiente.** Requieren DevTools en el navegador. Las clases y los tokens son los mismos que en la E1.                                                                                                                                                                                                            |
| H-06 | La E1 tiene estilos en línea (`style={{ color: 'red' }}` en `Auth`, `Buscador`, `Detalle` y `MiLista`). No cumple DIS-01 ni DIS-02 en toda la app.                                         | **Pendiente**, fuera de la épica: es la deuda D-04, y la regla 3 de `AGENTS.md` prohíbe reescribir la E1 sin un ticket.                                                                                                                                                                                            |
| H-07 | S-22 pide que lint, build y test pasen en cada commit de la épica. Solo se comprobó en el último.                                                                                          | **Pendiente (aceptado).** No quedó registrada la salida de cada commit. Para comprobarlo, se puede ejecutar `git rebase --exec "npm run lint && npm run build && npm test"` desde `dab96e1` en una rama aparte. No cambia el estado final.                                                                         |
| H-08 | No hay capturas de la E2: `docs/evidencia/` está vacía y el README solo muestra la E1.                                                                                                     | **Pendiente.** Se agregarán cuando se termine la verificación manual (H-02 a H-05).                                                                                                                                                                                                                                |
| H-09 | La función de dominio `minutosDePausas` (`src/dominio/sesion.ts`, con test) no aparece en la spec §3.1.                                                                                    | **Pendiente.** No cambia el comportamiento. Basta con agregarla a la spec en un commit `docs(spec)`.                                                                                                                                                                                                               |
| H-10 | El README decía `.env` en lugar de `.env.local`, tenía un enlace de ejemplo y el encabezado de capturas duplicado (deuda D-16).                                                            | **Corregido** en el commit `docs(readme): épica E2, tests y harness`.                                                                                                                                                                                                                                              |
