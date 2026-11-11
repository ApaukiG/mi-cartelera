# Verificación — Épica E2 "Noche de película"

Registro de la verificación de cada criterio de aceptación de `docs/backlog/historias.md`, tal como indica la spec (`docs/specs/noche-de-pelicula.md`, §7).

- **Creado en:** E2-T10. Lo amplían E2-T11, E2-T12 y E2-T13; E2-T14 lo completa y lo cierra.
- **Cómo llenarlo:** probar en `npm run dev` con una cuenta que tenga películas «por ver» y escribir en **Resultado obtenido** ✔ o ✘, la fecha y una nota si algo no coincide.
- Los criterios con test automático indican el test; aun así se comprueban en el navegador.
- Datos de prueba sugeridos: películas «por ver» de distintas duraciones (por ejemplo, de 80, 95, 100, 120 y 140 min), al menos una serie y al menos una película en «viendo» o «vista».

---

## HU-01 — Ver qué películas caben en mi tiempo (E2-T10)

| Criterio | Qué hacer                                                                                                          | Resultado esperado                                                                                                                                                                           | Resultado obtenido |
| -------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| CA-01.1  | Escribir 120 y pulsar "Ver qué cabe".                                                                              | Aparecen las películas de 120 min o menos, cada una con su duración en la insignia ("95 min").                                                                                               |                    |
| CA-01.2  | Con una película de exactamente 120 min, escribir 120.                                                             | Esa película aparece entre las que caben. Test: `candidatas.test.ts › … una película de exactamente 120 cabe en 120`.                                                                        |                    |
| CA-01.3  | Escribir 30; después, 600.                                                                                         | En ambos casos se acepta y se muestra "Qué cabe".                                                                                                                                            |                    |
| CA-01.4  | Escribir 29; después, 601.                                                                                         | Mensaje "El tiempo debe estar entre 30 y 600 minutos." y no se muestran películas.                                                                                                           |                    |
| CA-01.5  | Escribir "90,5", "noventa" y dejar el campo vacío.                                                                 | "El tiempo debe ser un número entero de minutos, entre 30 y 600." (los dos primeros) y "Escribe cuántos minutos tienes: un número entero entre 30 y 600." (vacío). No se muestran películas. |                    |
| CA-01.6  | Tener películas en «viendo» y «vista»; escribir 600.                                                               | Ninguna de ellas aparece.                                                                                                                                                                    |                    |
| CA-01.7  | Tener una serie «por ver»; escribir 600.                                                                           | La serie no aparece.                                                                                                                                                                         |                    |
| CA-01.8  | Tener una película sin duración en TMDB.                                                                           | Insignia "Sin duración", motivo "No tiene duración conocida, así que no se puede agregar." y botón deshabilitado.                                                                            |                    |
| CA-01.9  | (Si existe una película con 0 min en TMDB.)                                                                        | Se ve igual que en CA-01.8. Test: `duracion.test.ts › 0 → null`.                                                                                                                             |                    |
| CA-01.10 | Con dos películas de la misma duración y otra más corta.                                                           | De la más corta a la más larga; si empatan, por título. Test: `candidatas.test.ts › ordena Beta (88), Alfa (95), Zeta (95)`.                                                                 |                    |
| CA-01.11 | DevTools → Network → "Slow 3G"; entrar en Noche de película.                                                       | Se ve "Cargando tus películas por ver..." mientras carga.                                                                                                                                    |                    |
| CA-01.12 | DevTools → Network → "Offline"; entrar en Noche de película. Luego volver a "No throttling" y pulsar "Reintentar". | Mensaje de error en rojo con botón "Reintentar", que vuelve a cargar. Mi lista sigue funcionando.                                                                                            |                    |
| CA-01.13 | Con una cuenta sin películas «por ver», entrar en Noche de película.                                               | "No tienes películas por ver. Agrega algunas desde Mi lista."                                                                                                                                |                    |
| CA-01.14 | Escribir 30 con películas más largas.                                                                              | "Ninguna de tus películas cabe en 30 minutos. Prueba con más tiempo."                                                                                                                        |                    |
| CA-01.15 | Escribir 120 con una película de 140 min.                                                                          | Aparece después de las que caben, con la insignia "No cabe" y el motivo "Dura 140 min y tienes 120.". Las que no tienen duración van al final.                                               |                    |
| CA-01.16 | (Difícil de provocar a mano: requiere que TMDB falle solo para algunas.)                                           | Esas películas muestran "No se pudo obtener la duración. Vuelve a intentarlo más tarde." Test: `tmdb.test.ts › si fallan algunas, marca error solo en esas`.                                 |                    |

---

## HU-02 — Armar una sesión (E2-T11)

Para los criterios con números concretos conviene tener películas de esas duraciones; si no, comprobar la misma cuenta con las duraciones reales (total = suma + 10 × (películas − 1)).

| Criterio | Qué hacer                                                                   | Resultado esperado                                                                                                                     | Resultado obtenido |
| -------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| CA-02.1  | Tiempo 120; agregar una película de 100 min.                                | "Total: 100 min (incluye 0 min de pausas) · Te quedan 20 min".                                                                         |                    |
| CA-02.2  | Tiempo 180; agregar una de 100 y luego una de 60.                           | "Total: 170 min (incluye 10 min de pausas) · Te quedan 10 min".                                                                        |                    |
| CA-02.3  | Tiempo 170; agregar 100 y 60.                                               | "Total: 170 min … · Te quedan 0 min". Sin aviso de exceso.                                                                             |                    |
| CA-02.4  | Con 20 min restantes y una película en la sesión.                           | Una película de 10 min se puede agregar; una de 15 min, no. Test: `candidatas.test.ts › con 20 restantes cabe la de 10 y no la de 15`. |                    |
| CA-02.5  | Ver la tarjeta de la película que no cabe del caso anterior.                | "Necesita 25 min (15 + 10 de pausa) y te quedan 20.", con el botón deshabilitado.                                                      |                    |
| CA-02.6  | Agregar una película.                                                       | Desaparece de "Qué cabe" y aparece en "Tu sesión".                                                                                     |                    |
| CA-02.7  | Con una sola película en la sesión, pulsar "Quitar".                        | "Tu sesión está vacía. Agrega películas de las que caben." y la película vuelve a "Qué cabe".                                          |                    |
| CA-02.8  | Agregar 3 películas y quitar la del medio.                                  | El total baja en la duración quitada más 10 min de pausa. Test: `sesion.test.ts › quitar la del medio deja una pausa`.                 |                    |
| CA-02.9  | Con una sesión de 170 min, cambiar el tiempo a 150 y pulsar "Ver qué cabe". | "Tu sesión se pasa por 20 min. Quita películas para poder guardarla." La sesión no se vacía.                                           |                    |
| CA-02.10 | Con una sesión de 170 min, cambiar el tiempo a 200.                         | "Te quedan 30 min" y "Qué cabe" se actualiza.                                                                                          |                    |
| CA-02.11 | Intentar agregar una película "Sin duración".                               | El botón está deshabilitado; el motivo lo explica.                                                                                     |                    |

---

## HU-03 — Guardar la sesión (E2-T12)

| Criterio | Qué hacer                                                                         | Resultado esperado                                                                                                                                                                                       | Resultado obtenido |
| -------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| CA-03.1  | Armar una sesión que cabe y guardarla como "Viernes de terror".                   | "Sesión "Viernes de terror" guardada." La sesión en armado se vacía y la nueva aparece primera en "Sesiones guardadas", con fecha, tiempo disponible, total y películas en el orden en que se agregaron. |                    |
| CA-03.2  | Con la sesión vacía, escribir un nombre y pulsar "Guardar sesión".                | "Agrega al menos una película para guardar la sesión."                                                                                                                                                   |                    |
| CA-03.3  | Con películas, guardar sin nombre y luego con " " (solo espacios).                | "Ponle un nombre a la sesión." en ambos casos.                                                                                                                                                           |                    |
| CA-03.4  | Guardar con el nombre " Maratón de domingo ".                                     | En "Sesiones guardadas" aparece "Maratón de domingo", sin espacios en los extremos.                                                                                                                      |                    |
| CA-03.5  | Guardar con un nombre de 61 caracteres; luego con uno de 60 que tenga ñ y tildes. | El de 61 se rechaza con "El nombre puede tener como máximo 60 caracteres."; el de 60 se guarda.                                                                                                          |                    |
| CA-03.6  | Guardar dos sesiones llamadas "Viernes".                                          | Las dos aparecen en "Sesiones guardadas".                                                                                                                                                                |                    |
| CA-03.7  | Tras guardar, ir a Mi lista.                                                      | Las películas de la sesión siguen en «por ver».                                                                                                                                                          |                    |
| CA-03.8  | Guardar la misma película en dos sesiones distintas.                              | Se puede; la película sigue apareciendo en "Qué cabe" después de guardar la primera.                                                                                                                     |                    |
| CA-03.9  | Hacer que la sesión se exceda (CA-02.9) y pulsar "Guardar sesión".                | "Tu sesión se pasa por {n} min. Quita películas para poder guardarla." No se guarda.                                                                                                                     |                    |
| CA-03.10 | Doble clic rápido en "Guardar sesión".                                            | El botón muestra "Guardando..." deshabilitado y solo se crea una sesión.                                                                                                                                 |                    |
| CA-03.11 | DevTools → "Offline"; pulsar "Guardar sesión".                                    | Mensaje de error en rojo; la sesión en armado y el nombre siguen ahí. Al volver la conexión, se puede guardar.                                                                                           |                    |
| CA-03.12 | (Opcional) Con muchas sesiones ya guardadas, guardar otra.                        | Se guarda sin límite.                                                                                                                                                                                    |                    |

---

## HU-04 — Consultar mis sesiones guardadas (E2-T12)

| Criterio | Qué hacer                                                                                      | Resultado esperado                                                                                                          | Resultado obtenido |
| -------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| CA-04.1  | Guardar tres sesiones seguidas.                                                                | Aparecen de la más reciente a la más antigua.                                                                               |                    |
| CA-04.2  | Ver una sesión guardada.                                                                       | Nombre, "Creada el {fecha} · Tiempo disponible: {n} min · Total: {n} min" y la lista numerada de películas con su duración. |                    |
| CA-04.3  | Con una cuenta sin sesiones, entrar en Noche de película.                                      | "Aún no tienes sesiones guardadas. Arma tu primera noche de película."                                                      |                    |
| CA-04.4  | Eliminar de Mi lista una película que está en una sesión guardada; volver a Noche de película. | La sesión se ve igual que antes, con esa película.                                                                          |                    |
| CA-04.5  | Marcar como «vista» en Mi lista una película de una sesión guardada.                           | La sesión se ve igual, sin ninguna indicación.                                                                              |                    |
| CA-04.6  | Buscar cómo editar una sesión guardada.                                                        | No hay campos ni botones para editarla; solo "Eliminar".                                                                    |                    |
| CA-04.7  | Entrar con "Slow 3G" y luego con "Offline".                                                    | "Cargando tus sesiones..." y, sin conexión, un mensaje de error con "Reintentar".                                           |                    |

---

## HU-05 — Eliminar una sesión (E2-T12)

| Criterio | Qué hacer                                                | Resultado esperado                                                                  | Resultado obtenido |
| -------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------ |
| CA-05.1  | Pulsar "Eliminar" en una sesión y aceptar.               | Se pide confirmación con su nombre y la sesión desaparece de la lista.              |                    |
| CA-05.2  | Pulsar "Eliminar" y cancelar.                            | La sesión sigue ahí, sin cambios.                                                   |                    |
| CA-05.3  | Con una película en dos sesiones, eliminar una de ellas. | La otra sesión no cambia, y la película sigue en Mi lista con el mismo estado.      |                    |
| CA-05.4  | DevTools → "Offline"; eliminar una sesión.               | "No se pudo eliminar la sesión. Inténtalo de nuevo." y la sesión sigue en la lista. |                    |
