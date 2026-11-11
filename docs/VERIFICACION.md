# Verificación — Épica E2 "Noche de película"

Registro de la verificación de cada criterio de aceptación de `docs/backlog/historias.md`, tal como indica la spec (`docs/specs/noche-de-pelicula.md`, §7).

- **Creado en:** E2-T10. Lo amplían E2-T11, E2-T12 y E2-T13; E2-T14 lo completa y lo cierra.
- **Cómo llenarlo:** probar en `npm run dev` con una cuenta que tenga películas «por ver» y escribir en **Resultado obtenido** ✔ o ✘, la fecha y una nota si algo no coincide.
- Los criterios con test automático indican el test; aun así se comprueban en el navegador.
- Datos de prueba sugeridos: películas «por ver» de distintas duraciones (por ejemplo, de 80, 95, 100, 120 y 140 min), al menos una serie y al menos una película en «viendo» o «vista».
- **Estado:** cerrado el 11-nov en E2-T14, con pendientes. El resumen está en [Cierre](#cierre).
- **Valores de "Resultado obtenido":** "✔ Probado por …" significa que se probó en el navegador. "Cubierto por test …" quiere decir que la lógica la cubre Vitest, pero la parte visual no se revisó en el navegador. "Sin verificar" indica que no se probó.

---

## HU-01 — Ver qué películas caben en mi tiempo (E2-T10)

| Criterio | Qué hacer                                                                                                          | Resultado esperado                                                                                                                                                                           | Resultado obtenido                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| CA-01.1  | Escribir 120 y pulsar "Ver qué cabe".                                                                              | Aparecen las películas de 120 min o menos, cada una con su duración en la insignia ("95 min").                                                                                               | ✔ Probado por Apauki · 10-nov · cada película muestra su duración |
| CA-01.2  | Con una película de exactamente 120 min, escribir 120.                                                             | Esa película aparece entre las que caben. Test: `candidatas.test.ts › … una película de exactamente 120 cabe en 120`.                                                                        | Cubierto por test candidatas.test.ts, sesion.test.ts              |
| CA-01.3  | Escribir 30; después, 600.                                                                                         | En ambos casos se acepta y se muestra "Qué cabe".                                                                                                                                            | Cubierto por test sesion.test.ts                                  |
| CA-01.4  | Escribir 29; después, 601.                                                                                         | Mensaje "El tiempo debe estar entre 30 y 600 minutos." y no se muestran películas.                                                                                                           | Cubierto por test sesion.test.ts                                  |
| CA-01.5  | Escribir "90,5", "noventa" y dejar el campo vacío.                                                                 | "El tiempo debe ser un número entero de minutos, entre 30 y 600." (los dos primeros) y "Escribe cuántos minutos tienes: un número entero entre 30 y 600." (vacío). No se muestran películas. | Cubierto por test sesion.test.ts                                  |
| CA-01.6  | Tener películas en «viendo» y «vista»; escribir 600.                                                               | Ninguna de ellas aparece.                                                                                                                                                                    | Cubierto por test candidatas.test.ts                              |
| CA-01.7  | Tener una serie «por ver»; escribir 600.                                                                           | La serie no aparece.                                                                                                                                                                         | Cubierto por test candidatas.test.ts                              |
| CA-01.8  | Tener una película sin duración en TMDB.                                                                           | Insignia "Sin duración", motivo "No tiene duración conocida, así que no se puede agregar." y botón deshabilitado.                                                                            | Cubierto por test candidatas.test.ts                              |
| CA-01.9  | (Si existe una película con 0 min en TMDB.)                                                                        | Se ve igual que en CA-01.8. Test: `duracion.test.ts › 0 → null`.                                                                                                                             | Cubierto por test duracion.test.ts, candidatas.test.ts            |
| CA-01.10 | Con dos películas de la misma duración y otra más corta.                                                           | De la más corta a la más larga; si empatan, por título. Test: `candidatas.test.ts › ordena Beta (88), Alfa (95), Zeta (95)`.                                                                 | ✔ Probado por Apauki · 10-nov · orden 120, 138, 181               |
| CA-01.11 | DevTools → Network → "Slow 3G"; entrar en Noche de película.                                                       | Se ve "Cargando tus películas por ver..." mientras carga.                                                                                                                                    | ✔ Probado por Apauki · 11-nov                                     |
| CA-01.12 | DevTools → Network → "Offline"; entrar en Noche de película. Luego volver a "No throttling" y pulsar "Reintentar". | Mensaje de error en rojo con botón "Reintentar", que vuelve a cargar. Mi lista sigue funcionando.                                                                                            | ✔ Probado por Apauki · 11-nov                                     |
| CA-01.13 | Con una cuenta sin películas «por ver», entrar en Noche de película.                                               | "No tienes películas por ver. Agrega algunas desde Mi lista."                                                                                                                                | Cubierto por test candidatas.test.ts                              |
| CA-01.14 | Escribir 30 con películas más largas.                                                                              | "Ninguna de tus películas cabe en 30 minutos. Prueba con más tiempo."                                                                                                                        | ✔ Probado por Apauki · 10-nov · con 90 min no cabe ninguna        |
| CA-01.15 | Escribir 120 con una película de 140 min.                                                                          | Aparece después de las que caben, con la insignia "No cabe" y el motivo "Dura 140 min y tienes 120.". Las que no tienen duración van al final.                                               | ✔ Probado por Apauki · 10-nov · no disponibles con su motivo      |
| CA-01.16 | (Difícil de provocar a mano: requiere que TMDB falle solo para algunas.)                                           | Esas películas muestran "No se pudo obtener la duración. Vuelve a intentarlo más tarde." Test: `tmdb.test.ts › si fallan algunas, marca error solo en esas`.                                 | Cubierto por test tmdb.test.ts, candidatas.test.ts                |

---

## HU-02 — Armar una sesión (E2-T11)

Para los criterios con números concretos conviene tener películas de esas duraciones; si no, comprobar la misma cuenta con las duraciones reales (total = suma + 10 × (películas − 1)).

| Criterio | Qué hacer                                                                   | Resultado esperado                                                                                                                     | Resultado obtenido                                                                    |
| -------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| CA-02.1  | Tiempo 120; agregar una película de 100 min.                                | "Total: 100 min (incluye 0 min de pausas) · Te quedan 20 min".                                                                         | Cubierto por test sesion.test.ts                                                      |
| CA-02.2  | Tiempo 180; agregar una de 100 y luego una de 60.                           | "Total: 170 min (incluye 10 min de pausas) · Te quedan 10 min".                                                                        | ✔ Probado por Apauki · 10-nov · Pacific Rim + Matrix = 268 con 10 de pausa, quedan 32 |
| CA-02.3  | Tiempo 170; agregar 100 y 60.                                               | "Total: 170 min … · Te quedan 0 min". Sin aviso de exceso.                                                                             | Cubierto por test sesion.test.ts                                                      |
| CA-02.4  | Con 20 min restantes y una película en la sesión.                           | Una película de 10 min se puede agregar; una de 15 min, no. Test: `candidatas.test.ts › con 20 restantes cabe la de 10 y no la de 15`. | ✔ Probado por Apauki · 10-nov · Oppenheimer: necesita 191 y quedan 32                 |
| CA-02.5  | Ver la tarjeta de la película que no cabe del caso anterior.                | "Necesita 25 min (15 + 10 de pausa) y te quedan 20.", con el botón deshabilitado.                                                      | ✔ Probado por Apauki · 10-nov · Oppenheimer: necesita 191 y quedan 32                 |
| CA-02.6  | Agregar una película.                                                       | Desaparece de "Qué cabe" y aparece en "Tu sesión".                                                                                     | Cubierto por test candidatas.test.ts                                                  |
| CA-02.7  | Con una sola película en la sesión, pulsar "Quitar".                        | "Tu sesión está vacía. Agrega películas de las que caben." y la película vuelve a "Qué cabe".                                          | Cubierto por test sesion.test.ts, candidatas.test.ts                                  |
| CA-02.8  | Agregar 3 películas y quitar la del medio.                                  | El total baja en la duración quitada más 10 min de pausa. Test: `sesion.test.ts › quitar la del medio deja una pausa`.                 | Cubierto por test sesion.test.ts                                                      |
| CA-02.9  | Con una sesión de 170 min, cambiar el tiempo a 150 y pulsar "Ver qué cabe". | "Tu sesión se pasa por 20 min. Quita películas para poder guardarla." La sesión no se vacía.                                           | Cubierto por test sesion.test.ts                                                      |
| CA-02.10 | Con una sesión de 170 min, cambiar el tiempo a 200.                         | "Te quedan 30 min" y "Qué cabe" se actualiza.                                                                                          | Cubierto por test sesion.test.ts                                                      |
| CA-02.11 | Intentar agregar una película "Sin duración".                               | El botón está deshabilitado; el motivo lo explica.                                                                                     | Cubierto por test candidatas.test.ts                                                  |

---

## HU-03 — Guardar la sesión (E2-T12)

| Criterio | Qué hacer                                                                         | Resultado esperado                                                                                                                                                                                       | Resultado obtenido                                   |
| -------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| CA-03.1  | Armar una sesión que cabe y guardarla como "Viernes de terror".                   | "Sesión "Viernes de terror" guardada." La sesión en armado se vacía y la nueva aparece primera en "Sesiones guardadas", con fecha, tiempo disponible, total y películas en el orden en que se agregaron. | ✔ Probado por Apauki · 10-nov · guardar              |
| CA-03.2  | Con la sesión vacía, escribir un nombre y pulsar "Guardar sesión".                | "Agrega al menos una película para guardar la sesión."                                                                                                                                                   | Cubierto por test sesion.test.ts                     |
| CA-03.3  | Con películas, guardar sin nombre y luego con " " (solo espacios).                | "Ponle un nombre a la sesión." en ambos casos.                                                                                                                                                           | ✔ Probado por Apauki · 10-nov · sin nombre no guarda |
| CA-03.4  | Guardar con el nombre " Maratón de domingo ".                                     | En "Sesiones guardadas" aparece "Maratón de domingo", sin espacios en los extremos.                                                                                                                      | Cubierto por test nombre.test.ts                     |
| CA-03.5  | Guardar con un nombre de 61 caracteres; luego con uno de 60 que tenga ñ y tildes. | El de 61 se rechaza con "El nombre puede tener como máximo 60 caracteres."; el de 60 se guarda.                                                                                                          | Cubierto por test nombre.test.ts                     |
| CA-03.6  | Guardar dos sesiones llamadas "Viernes".                                          | Las dos aparecen en "Sesiones guardadas".                                                                                                                                                                | Sin verificar                                        |
| CA-03.7  | Tras guardar, ir a Mi lista.                                                      | Las películas de la sesión siguen en «por ver».                                                                                                                                                          | Sin verificar                                        |
| CA-03.8  | Guardar la misma película en dos sesiones distintas.                              | Se puede; la película sigue apareciendo en "Qué cabe" después de guardar la primera.                                                                                                                     | Sin verificar                                        |
| CA-03.9  | Hacer que la sesión se exceda (CA-02.9) y pulsar "Guardar sesión".                | "Tu sesión se pasa por {n} min. Quita películas para poder guardarla." No se guarda.                                                                                                                     | Cubierto por test sesion.test.ts                     |
| CA-03.10 | Doble clic rápido en "Guardar sesión".                                            | El botón muestra "Guardando..." deshabilitado y solo se crea una sesión.                                                                                                                                 | Sin verificar                                        |
| CA-03.11 | DevTools → "Offline"; pulsar "Guardar sesión".                                    | Mensaje de error en rojo; la sesión en armado y el nombre siguen ahí. Al volver la conexión, se puede guardar.                                                                                           | Sin verificar                                        |
| CA-03.12 | (Opcional) Con muchas sesiones ya guardadas, guardar otra.                        | Se guarda sin límite.                                                                                                                                                                                    | Sin verificar                                        |

---

## HU-04 — Consultar mis sesiones guardadas (E2-T12)

| Criterio | Qué hacer                                                                                      | Resultado esperado                                                                                                          | Resultado obtenido                      |
| -------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| CA-04.1  | Guardar tres sesiones seguidas.                                                                | Aparecen de la más reciente a la más antigua.                                                                               | ✔ Probado por Apauki · 10-nov · lista   |
| CA-04.2  | Ver una sesión guardada.                                                                       | Nombre, "Creada el {fecha} · Tiempo disponible: {n} min · Total: {n} min" y la lista numerada de películas con su duración. | ✔ Probado por Apauki · 10-nov · detalle |
| CA-04.3  | Con una cuenta sin sesiones, entrar en Noche de película.                                      | "Aún no tienes sesiones guardadas. Arma tu primera noche de película."                                                      | Sin verificar                           |
| CA-04.4  | Eliminar de Mi lista una película que está en una sesión guardada; volver a Noche de película. | La sesión se ve igual que antes, con esa película.                                                                          | Sin verificar                           |
| CA-04.5  | Marcar como «vista» en Mi lista una película de una sesión guardada.                           | La sesión se ve igual, sin ninguna indicación.                                                                              | Sin verificar                           |
| CA-04.6  | Buscar cómo editar una sesión guardada.                                                        | No hay campos ni botones para editarla; solo "Eliminar".                                                                    | ✔ Probado por Apauki · 11-nov           |
| CA-04.7  | Entrar con "Slow 3G" y luego con "Offline".                                                    | "Cargando tus sesiones..." y, sin conexión, un mensaje de error con "Reintentar".                                           | ✔ Probado por Apauki · 11-nov           |

---

## HU-05 — Eliminar una sesión (E2-T12)

| Criterio | Qué hacer                                                | Resultado esperado                                                                  | Resultado obtenido            |
| -------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------- |
| CA-05.1  | Pulsar "Eliminar" en una sesión y aceptar.               | Se pide confirmación con su nombre y la sesión desaparece de la lista.              | ✔ Probado por Apauki · 11-nov |
| CA-05.2  | Pulsar "Eliminar" y cancelar.                            | La sesión sigue ahí, sin cambios.                                                   | ✔ Probado por Apauki · 11-nov |
| CA-05.3  | Con una película en dos sesiones, eliminar una de ellas. | La otra sesión no cambia, y la película sigue en Mi lista con el mismo estado.      | ✔ Probado por Apauki · 11-nov |
| CA-05.4  | DevTools → "Offline"; eliminar una sesión.               | "No se pudo eliminar la sesión. Inténtalo de nuevo." y la sesión sigue en la lista. | Sin verificar                 |

---

## HU-06 — Privacidad de mis sesiones (E2-T13)

### Preparación

1. Dos cuentas: **A** y **B**, cada una con al menos una película «por ver». B debe tener al menos una película que A no tenga en su lista.
2. A en una ventana normal y B en una **ventana de incógnito** (o en otro navegador), para que no compartan la sesión guardada en el navegador.
3. Con `npm run dev` abierto, cada cuenta guarda una sesión desde la app: A, "Sesión de A"; B, "Sesión de B".
4. En cada ventana, abrir DevTools → **Console** y cargar el cliente de la app. Usa la clave pública de `.env.local` sin escribirla ni mostrarla:
   ```js
   const { supabase } = await import('/src/lib/supabase.ts')
   ```
   No escribas `supabase` solo en la consola ni pegues objetos de sesión en ningún sitio: mostrarían la clave y el token.
5. En cada ventana, anotar el id de la sesión y el id del usuario:
   ```js
   ;(await supabase.from('sesiones').select('id, nombre, user_id')).data
   ```
   Anotar `ID_A` y `UID_A` (ventana de A) e `ID_B` y `UID_B` (ventana de B).

### Desde la app

| Criterio | Qué hacer                                                           | Resultado esperado                                               | Resultado obtenido                                                       |
| -------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| CA-06.1  | A abre Noche de película → "Sesiones guardadas". Luego, lo mismo B. | A ve solo "Sesión de A"; B ve solo "Sesión de B".                | ✔ Probado por Apauki · 10-nov · dos cuentas: A y B solo ven sus sesiones |
| CA-06.3  | Cerrar sesión desde Noche de película y recargar.                   | Solo se ve la pantalla de acceso, sin los botones de navegación. | Sin verificar                                                            |
| CA-06.4  | A escribe 600 en "¿Cuántos minutos tienes?".                        | En "Qué cabe" no aparece la película que solo tiene B.           | ✔ Probado por Apauki · 10-nov · B solo ve su película                    |

### Desde la consola, con la clave pública (ventana de A)

Reemplazar `ID_A`, `ID_B` y `UID_B` por los valores anotados.

| Prueba                                         | Comando                                                                                                                                                                                   | Resultado esperado                                                       | Resultado obtenido |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------ |
| CA-06.1 · leer todo                            | `(await supabase.from('sesiones').select('id, user_id')).data`                                                                                                                            | Solo filas con `user_id` = `UID_A`.                                      | Sin verificar      |
| CA-06.2 · leer la sesión de B                  | `(await supabase.from('sesiones').select('*').eq('id', ID_B)).data`                                                                                                                       | `[]`                                                                     | Sin verificar      |
| CA-06.2 · leer las películas de B              | `(await supabase.from('sesion_peliculas').select('*').eq('sesion_id', ID_B)).data`                                                                                                        | `[]`                                                                     | Sin verificar      |
| CA-06.2 · borrar la sesión de B                | `await supabase.from('sesiones').delete().eq('id', ID_B).select('id')`                                                                                                                    | `data: []`. Después, en la ventana de B, "Sesión de B" sigue existiendo. | Sin verificar      |
| CA-06.2 · crear una sesión a nombre de B       | `await supabase.from('sesiones').insert({ user_id: 'UID_B', nombre: 'Intrusa', tiempo_disponible: 120, tiempo_total: 100 })`                                                              | `error` con código `42501` (new row violates row-level security policy). | Sin verificar      |
| CA-06.2 · meter una película en la sesión de B | `await supabase.from('sesion_peliculas').insert({ sesion_id: ID_B, posicion: 99, tmdb_id: 1, titulo: 'x', duracion: 90 })`                                                                | `error` con código `42501`.                                              | Sin verificar      |
| CA-06.2 · la RPC crea solo para quien la llama | `await supabase.rpc('crear_sesion', { p_nombre: 'Prueba RPC', p_tiempo_disponible: 120, p_peliculas: [{ tmdb_id: 1, titulo: 'x', duracion: 90 }] })` y luego leer `user_id` de esa sesión | Se crea con `user_id` = `UID_A`; B no la ve. Borrarla al terminar.       | Sin verificar      |
| RN-09 · editar la sesión propia                | `await supabase.from('sesiones').update({ nombre: 'Cambio' }).eq('id', ID_A)`                                                                                                             | `error` con código `42501` (permission denied for table sesiones).       | Sin verificar      |
| Sin sesión · leer                              | `await supabase.auth.signOut()` y luego `await supabase.from('sesiones').select('*')`                                                                                                     | `error` (permission denied) o `data: []`; nunca filas.                   | Sin verificar      |
| Sin sesión · RPC                               | Sin sesión: `await supabase.rpc('crear_sesion', { p_nombre: 'x', p_tiempo_disponible: 120, p_peliculas: [{ tmdb_id: 1, titulo: 'x', duracion: 90 }] })`                                   | `error` (permission denied for function).                                | Sin verificar      |

Repetir las cuatro pruebas de CA-06.2 desde la ventana de B contra `ID_A` y `UID_A`: el resultado debe ser el mismo.

### Limpieza

Eliminar desde la app las sesiones de prueba ("Sesión de A", "Sesión de B" y "Prueba RPC").

### Evidencia

| Fecha  | Quién probó | Cuentas usadas (sin correos completos) | Conclusión                                                                                                                                                                 |
| ------ | ----------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10-nov | Apauki      | A y B                                  | Desde la app, CA-06.1 y CA-06.4 ✔: cada cuenta ve solo sus sesiones y sus películas. Las pruebas de consola (CA-06.2, RN-09 y "Sin sesión") y CA-06.3 están sin verificar. |

---

## Criterios de la spec (S-xx) — E2-T14

Comprobados el 11-nov revisando el código y con los comandos que pide la spec (§7.2).

| Criterio | Evidencia                                                                                                                                                             | Resultado                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| S-01     | Los componentes de `noche/` usan `balance`, `clasificarCandidatas`, `minutosDePausas` y `validarSesionParaGuardar`; no suman duraciones por su cuenta.                | ✔ Código · 11-nov                           |
| S-02     | `grep -rn "supabase\|fetch(" src/components/noche` no devuelve nada.                                                                                                  | ✔ Código · 11-nov                           |
| S-03     | `grep -rnw any src` (sin contar los tests) y `grep " as "` en `src/lib/sesiones.ts`, `src/lib/tmdb.ts` y `src/dominio` no devuelven nada. Lint y build pasan.         | ✔ Código · 11-nov                           |
| S-04     | `grep -rn "\b10\b" src/dominio src/components/noche` solo encuentra `PAUSA_MIN = 10`. En la migración, `c_pausa` lleva su comentario.                                 | ✔ Código · 11-nov                           |
| S-05     | `crearSesion` solo llama a `supabase.rpc('crear_sesion', …)`. La prueba SQL de forzar un fallo está sin hacer.                                                        | ✔ Código · 11-nov (SQL sin verificar)       |
| S-06     | La migración tiene `revoke update` y ninguna política `for update`, y la interfaz no permite editar (CA-04.6 ✔). La prueba RN-09 desde la consola está sin verificar. | ✔ Código · 11-nov                           |
| S-07     | Depende de CA-03.7 y CA-05.3. CA-05.3 ✔ 11-nov; CA-03.7 sin verificar.                                                                                                | Sin verificar (parcial)                     |
| S-08     | `App.tsx` envuelve `Buscador` y `MiLista` en `div hidden`. La regresión de la E1 (R-01 a R-08), probada en el navegador, funciona igual que antes.                    | ✔ Probado por Apauki · 11-nov               |
| S-09     | Desde `7ffcbc3`, `git diff` de `package.json` solo muestra `vitest` en `devDependencies` y el script `test`.                                                          | ✔ Código · 11-nov                           |
| S-10     | `import.meta.env` solo aparece en `src/lib/supabase.ts` y `src/lib/tmdb.ts`, y `.env.local` está en `.gitignore`.                                                     | ✔ Código · 11-nov                           |
| S-11     | `GuardarSesion` deshabilita el botón mientras `guardando`. La prueba en el navegador (CA-03.10) está sin verificar.                                                   | ✔ Código · 11-nov (navegador sin verificar) |
| S-12     | Depende de CA-03.11.                                                                                                                                                  | Sin verificar                               |
| S-13     | Tests de dominio (`sesion.test.ts` y `nombre.test.ts`), y en la migración, los `check` y las validaciones de `crear_sesion`. Las pruebas SQL están sin hacer.         | ✔ Código · 11-nov (SQL sin verificar)       |
| S-14     | Ver DIS-01 a DIS-04 abajo. Todas las clases de `noche/` están en `DESIGN.md`.                                                                                         | ✔ Código · 11-nov                           |
| S-15     | `nombre.test.ts › 60 caracteres con ñ y tildes es válido` y `› cuenta un emoji como un solo carácter`.                                                                | Cubierto por test nombre.test.ts            |
| S-16     | `tmdb.test.ts › nunca hace más de 5 peticiones simultáneas (S-16)`.                                                                                                   | Cubierto por test tmdb.test.ts              |
| S-17     | En el código, la carga se hace solo en el `useEffect` del montaje de `NocheDePelicula`. La comprobación en Network está sin hacer.                                    | Sin verificar                               |
| S-18     | Desde E2-T00 (`8befc21`), `git diff` no cambia `src/lib/lista.ts`, y en `src/lib/tmdb.ts` solo hay líneas añadidas.                                                   | ✔ Código · 11-nov                           |
| S-19     | Todos los textos de tiempo de `noche/` terminan en "min" (revisión de §5.3).                                                                                          | ✔ Código · 11-nov                           |
| S-20     | Depende de CA-06.3.                                                                                                                                                   | Sin verificar                               |
| S-21     | `candidatas.test.ts › con 20 restantes cabe la de 10 y no la de 15`.                                                                                                  | Cubierto por test candidatas.test.ts        |
| S-22     | Los tres comandos pasan en el commit de cierre (ver abajo). En los commits anteriores no se volvieron a ejecutar uno por uno.                                         | ✔ 11-nov (último commit)                    |

---

## Criterios de diseño en Noche de película (DIS-xx) — E2-T14

Criterios de `DESIGN.md` §7 aplicados a la vista, tal como indica la spec (§7.3).

| Criterio | Evidencia                                                                                                                                        | Resultado                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| DIS-01   | `grep -rn "style=" src/components/noche` no devuelve nada. Los estilos en línea de la E1 son la deuda D-04, fuera de la épica.                   | ✔ Código · 11-nov             |
| DIS-02   | Los mensajes de `noche/` usan `mensaje-error` y `mensaje-exito`, cuyos colores vienen de `--error` y `--exito`. El color computado no se midió.  | ✔ Código · 11-nov             |
| DIS-03   | `src/index.css` solo importa Cinzel (500 y 700) y la vista no carga fuentes nuevas.                                                              | ✔ Código · 11-nov             |
| DIS-04   | `package.json` no tiene ninguna librería de UI ni de CSS.                                                                                        | ✔ Código · 11-nov             |
| DIS-05   | Los campos tienen `<label htmlFor>` y el foco usa el estilo global `:focus-visible`. El recorrido con Tab está sin hacer.                        | Sin verificar                 |
| DIS-06   | Hay dos `form` ("Ver qué cabe" y "Guardar sesión"), cada uno con un solo `button[type='submit']`.                                                | ✔ Código · 11-nov             |
| DIS-07   | "Agregar a la sesión" se deshabilita en las películas no disponibles (CA-02.5 ✔ 10-nov, botón deshabilitado) y "Guardar sesión" mientras guarda. | ✔ Probado por Apauki · 10-nov |
| DIS-08   | Las candidatas y las sesiones guardadas están en `ul.rejilla`.                                                                                   | ✔ Código · 11-nov             |
| DIS-09   | Las candidatas usan `img` o `.sin-poster` dentro de `.tarjeta`, con el estilo global de 2:3. No se midió.                                        | Sin verificar                 |
| DIS-10   | Las candidatas usan `.tarjeta`, con el hover global.                                                                                             | Sin verificar                 |
| DIS-11   | `ListaCandidatas` muestra `.sin-poster` cuando `posterUrl` es null.                                                                              | Sin verificar                 |
| DIS-12   | Con "Slow 3G" aparecen "Cargando tus películas por ver..." y "Cargando tus sesiones..." (CA-01.11 y CA-04.7).                                    | ✔ Probado por Apauki · 11-nov |
| DIS-13   | "Ninguna cabe" ✔ 10-nov (CA-01.14). Sin películas por ver, sesión vacía y sin sesiones guardadas están sin verificar.                            | Sin verificar (parcial)       |
| DIS-14   | Vista de 360px.                                                                                                                                  | Sin verificar                 |
| DIS-15   | Contraste de `.tarjeta-meta` y de los mensajes.                                                                                                  | Sin verificar                 |

---

## Regresión de la E1 — E2-T14

Recorrido completo de la E1 con la E2 ya integrada (S-08 y S-18). Probada en el navegador el 11-nov: todo funciona igual que antes de la E2.

| Paso | Qué hacer                                                          | Resultado esperado                                                 | Resultado obtenido            |
| ---- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------- |
| R-01 | Registrarse, cerrar sesión y entrar.                               | Sin sesión solo se ve el acceso, y al entrar se ve Mi lista.       | ✔ Probado por Apauki · 11-nov |
| R-02 | Buscar un título en TMDB.                                          | Muestra "Buscando..." y luego los resultados, o el error si falla. | ✔ Probado por Apauki · 11-nov |
| R-03 | Agregar un título y luego intentar agregarlo otra vez.             | Aparece en Mi lista; el duplicado muestra un mensaje claro.        | ✔ Probado por Apauki · 11-nov |
| R-04 | Cambiar el estado, la calificación y el comentario.                | Se guardan y se mantienen al recargar.                             | ✔ Probado por Apauki · 11-nov |
| R-05 | Filtrar por estado y ordenar por calificación; ver el contador.    | Funcionan igual que antes de la E2.                                | ✔ Probado por Apauki · 11-nov |
| R-06 | Abrir el detalle y volver.                                         | Póster, sinopsis, elenco y calificación de TMDB.                   | ✔ Probado por Apauki · 11-nov |
| R-07 | Eliminar un título.                                                | Desaparece de Mi lista.                                            | ✔ Probado por Apauki · 11-nov |
| R-08 | Escribir una búsqueda, ir a Noche de película y volver a Mi lista. | La búsqueda sigue ahí (S-08).                                      | ✔ Probado por Apauki · 11-nov |

---

## Comandos — E2-T14

Ejecutados el 11-nov sobre el commit `9516956`, el último commit de la épica antes del cierre (que solo cambia documentación).

```text
$ npm test
 Test Files  6 passed (6)
      Tests  80 passed (80)

$ npm run lint
> eslint .
(sin errores ni avisos)

$ npm run build
> tsc -b && vite build
✓ 77 modules transformed.
dist/index.html                   0.47 kB │ gzip:   0.30 kB
dist/assets/index-BWPQKPhl.css    3.42 kB │ gzip:   1.43 kB
dist/assets/index-DpSEYug0.js   458.97 kB │ gzip: 130.37 kB
✓ built
```

---

## Cierre

| Criterios        | ✔ Navegador o código | Cubierto por test | Sin verificar | ✘   |
| ---------------- | -------------------- | ----------------- | ------------- | --- |
| CA (54)          | 20                   | 22                | 12            | 0   |
| S-xx (22)        | 15                   | 3                 | 4             | 0   |
| DIS-xx (15)      | 8                    | 0                 | 7             | 0   |
| Regresión E1 (8) | 8                    | 0                 | 0             | 0   |

- No hay ningún ✘, así que no hace falta abrir tickets de corrección.
- La regresión de la E1 está completa: ✔ 11-nov.
- La épica se cierra **con pendientes**, por lo que la Definition of Done de E2-T14 no se cumple del todo: faltan las pruebas RLS desde la consola (CA-06.2) y hay CA y DIS sin verificar en el navegador. El detalle y la razón de cada uno están en `docs/AUDITORIA.md`.
- `npm test`, `npm run lint` y `npm run build` pasan.

---

## E2-T15 — Mejora visual de la E1

DoD de `docs/specs/noche-de-pelicula.md` §9.2. Apauki lo probó en el navegador el 11-nov, con el código del commit `4e33819`. No se usó DevTools → Computed ni la vista de 360px: esos criterios quedan sin verificar.

| Criterio             | Qué se comprobó                                                                                                                                                                                                       | Resultado obtenido            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| DIS-01               | `grep -rn "style=" src --include=*.tsx` no devuelve nada. No se ejecutó la comprobación desde la consola del navegador.                                                                                               | ✔ Código · 11-nov             |
| DIS-02               | Color computado de `mensaje-error` y `mensaje-exito`.                                                                                                                                                                 | Sin verificar                 |
| DIS-08               | Mi lista y los resultados del buscador se ven como cuadrícula de pósters.                                                                                                                                             | ✔ Probado por Apauki · 11-nov |
| DIS-09               | Medir la proporción 2:3 del póster.                                                                                                                                                                                   | Sin verificar                 |
| DIS-10               | Hover sobre una tarjeta del buscador y de Mi lista.                                                                                                                                                                   | Sin verificar                 |
| DIS-11               | Un título sin póster muestra `.sin-poster` del mismo tamaño.                                                                                                                                                          | Sin verificar                 |
| DIS-14               | Vista de 360px sin scroll horizontal, con "Cerrar sesión" junto al correo.                                                                                                                                            | Sin verificar                 |
| Insignia             | Las tarjetas dicen "Película" o "Serie".                                                                                                                                                                              | ✔ Probado por Apauki · 11-nov |
| Comentario           | El campo de comentario de la tarjeta tiene la altura normal de un input.                                                                                                                                              | ✔ Probado por Apauki · 11-nov |
| Espaciado (visual)   | Hay separación entre los selects de filtro, entre los filtros y la cuadrícula, y entre el formulario del buscador y los resultados.                                                                                   | ✔ Probado por Apauki · 11-nov |
| Espaciado (Computed) | `.filtros` con `gap` de 8px; `.rejilla` con `margin-top` de 20px, y de 0 debajo de "Qué cabe" y "Sesiones guardadas".                                                                                                 | Sin verificar                 |
| Cabecera             | El título, el correo y "Cerrar sesión" están en una línea, y la vista activa de la navegación está marcada.                                                                                                           | ✔ Probado por Apauki · 11-nov |
| E1 igual             | La E1 funciona igual: se buscó y se agregó «Disney Channel Games» sin problemas. Desde `d9b6d0c`, `git diff` no toca `src/lib/` ni `src/components/noche/`; en `src/dominio/` solo agrega `tipo.ts` y `tipo.test.ts`. | ✔ Probado por Apauki · 11-nov |
| Comandos             | `npm test` (7 archivos, 82 tests), `npm run lint` y `npm run build` pasan sobre `4e33819`.                                                                                                                            | ✔ 11-nov                      |

Resumen de E2-T15: 8 ✔ y 6 sin verificar (DIS-02, DIS-09, DIS-10, DIS-11, DIS-14 y el espaciado en Computed). No hay ningún ✘.
