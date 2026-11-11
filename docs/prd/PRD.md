# PRD — Mi Cartelera Personal

Documento de requisitos del producto. Describe **qué** necesita el usuario y **por qué**, en lenguaje de negocio.
El detalle técnico va en las specs de `docs/specs/`; el estado actual de la app, en `docs/ESTADO-INICIAL.md`.

---

## 1. Visión del producto

Mi Cartelera Personal es la cartelera privada de cada persona: un único lugar donde guarda las películas y series que quiere ver, las que está viendo y las que ya vio, con su propia opinión sobre cada una.

La visión es que la app no solo **recuerde** qué quiere ver el usuario, sino que lo **ayude a verlo**: convertir una lista que crece sin parar en planes realistas que se pueden terminar.

## 2. Usuarios

**Usuario principal: el espectador que acumula pendientes.**

- Ve películas y series en casa, por su cuenta, en ratos libres de duración variable (una noche entre semana, una tarde de domingo).
- Guarda títulos más rápido de lo que los ve: su lista de "por ver" no deja de crecer.
- Quiere recordar qué le pareció cada cosa que vio (calificación y comentario).
- Usa la app con su propia cuenta; su lista es privada y nadie más la ve ni la modifica.

No hay otros perfiles de usuario: no hay administradores, invitados ni listas compartidas.

---

## 3. Épica E1 — "Mi lista" (construida, Proyecto 3)

La E1 está terminada y en uso. Lo que existe hoy debe seguir funcionando igual.

**Qué resuelve:** tener en un solo sitio, y de forma privada, todo lo que el usuario quiere ver, está viendo o ya vio.

**Qué puede hacer el usuario hoy:**

1. **Cuenta propia.** Registrarse con correo y contraseña, iniciar y cerrar sesión. Sin sesión no se ve ningún contenido.
2. **Buscar títulos reales.** Buscar películas y series por nombre en un catálogo público de cine (TMDB) y ver póster, año y tipo.
3. **Agregar a su lista.** Guardar un título con un clic; la app impide guardar el mismo título dos veces y lo explica.
4. **Gestionar su lista.** Cada título tiene:
   - un **estado**: «por ver», «viendo» o «vista», que el usuario cambia libremente;
   - una **calificación personal** de 1 a 5 estrellas (o sin calificar);
   - un **comentario personal**.
5. **Organizar la lista.** Ver un resumen (cuántos pendientes, en progreso y vistos), filtrar por estado y ordenar por fecha de agregado o por calificación.
6. **Eliminar** títulos de la lista, con confirmación.
7. **Ver el detalle** de un título: póster grande, sinopsis, elenco principal y calificación pública, junto a su calificación y comentario personales.
8. **Privacidad.** Cada usuario solo ve y modifica sus propios títulos.

**Lo que la E1 no hace** (y motiva la E2): no conoce la duración de las películas ni ayuda a decidir qué ver en un rato concreto.

---

## 4. Épica E2 — "Noche de película" (nueva)

### 4.1 Problema

El usuario tiene muchas películas «por ver», pero cuando tiene un rato libre no sabe cuáles caben en ese tiempo. Elige al azar, empieza algo que no alcanza a terminar y la película queda a medias.

### 4.2 Objetivo y métrica de éxito

**Objetivo:** que el usuario termine lo que empieza. Para eso, la app le permite indicar cuánto tiempo tiene, ver qué películas de su lista caben en ese tiempo, armar una sesión con una o varias y guardarla para esa noche.

**Métrica de éxito principal — tasa de sesiones cumplidas:** porcentaje de sesiones guardadas cuyas películas acaban todas marcadas como «vista» en los 7 días siguientes a su creación.

- Línea base: no existe (hoy no hay sesiones).
- Meta: **60 % de sesiones cumplidas** a los 2 meses del lanzamiento (supuesto SU-07).
- Medición: queda fuera del alcance de la E2 (ver 4.4). La métrica define qué es el éxito; construir lo necesario para medirla es trabajo posterior.

**Métricas de apoyo:**

- Número de sesiones guardadas por usuario activo y por semana (indica si la función se usa).
- Porcentaje de películas «por ver» que pasan a «vista» por mes, antes y después de la E2 (indica si la lista avanza).

### 4.3 Alcance

El usuario podrá:

1. **Indicar su tiempo disponible** en minutos.
2. **Ver qué películas de su lista caben** en ese tiempo, ordenadas para facilitar la elección.
3. **Armar una sesión** agregando una o varias películas, viendo en todo momento el tiempo total ocupado (duraciones más pausas) y el tiempo que le queda.
4. **Quitar** una película de la sesión mientras la arma.
5. **Entender por qué** una película no se puede agregar (no cabe, no tiene duración conocida, ya está en la sesión).
6. **Guardar la sesión** con un nombre.
7. **Consultar sus sesiones guardadas**, de la más reciente a la más antigua, con sus películas, sus duraciones y el tiempo total.
8. **Eliminar** una sesión guardada.

### 4.4 No-alcance

Queda fuera de la E2:

- **Series.** Noche de película es solo para películas.
- **Ver con amigos o compartir sesiones.** Las sesiones son privadas, como la lista.
- **Recordatorios y notificaciones.**
- **Sincronizar** con plataformas de streaming o con calendarios.
- **Recomendar películas** que no están en la lista del usuario.
- **Editar** una sesión guardada (ver RN-09).
- **Cambiar automáticamente el estado** de las películas al guardar o al terminar una sesión (ver RN-06).
- **Medir la métrica de éxito.** La E2 no registra la fecha en que una película pasa a «vista», así que la tasa de sesiones cumplidas no se calcula dentro de esta épica.
- **Fecha planeada** de una sesión. Una sesión solo tiene su fecha de creación (RN-11); no se elige para qué día es.

### 4.5 Reglas de negocio

#### Decididas por el cliente

| Id    | Regla                                                                                                                                                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN-01 | **Tiempo disponible.** Es un número entero de minutos, entre **30 y 600**, ambos incluidos. Cualquier otro valor (decimales, texto, fuera de rango) se rechaza con un mensaje que indica el rango válido.                               |
| RN-02 | **Qué entra en una sesión.** Solo películas de la lista del propio usuario que estén en estado **«por ver»**.                                                                                                                           |
| RN-03 | **Pausas.** Entre una película y la siguiente hay una pausa de **10 minutos**. No hay pausa antes de la primera ni después de la última. Tiempo total de una sesión = suma de las duraciones + 10 × (número de películas − 1).          |
| RN-04 | **Cuándo cabe una sesión.** Una sesión cabe si su tiempo total **no supera** el tiempo disponible. Una sesión que ocupa **exactamente** el tiempo disponible sí cabe.                                                                   |
| RN-05 | **Duración.** La duración de cada película se toma del catálogo de cine (TMDB). Una película **sin duración conocida no se puede agregar**, y la app explica por qué. Una duración de **0 minutos** se trata como duración desconocida. |
| RN-06 | **Estado de los títulos.** Guardar una sesión **no cambia** el estado de sus películas: siguen «por ver». El usuario las marca como «vista» desde Mi lista, como hasta ahora.                                                           |

#### Decididas por el estudiante

| Id    | Regla                                                                                                                                                                                                                                                                                                            | Justificación                                                                                                                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RN-07 | Una película puede estar en **dos o más sesiones guardadas**.                                                                                                                                                                                                                                                    | Cada sesión es un plan para una noche distinta; si la película no se vio, se puede volver a planear.                                                                                                                           |
| RN-08 | Las películas que caben se muestran **de la más corta a la más larga**; si duran lo mismo, **por título en orden alfabético**.                                                                                                                                                                                   | Mostrar primero lo más corto favorece elegir algo que sí se puede terminar, que es el objetivo de la épica. El desempate alfabético hace el orden predecible.                                                                  |
| RN-09 | Una sesión guardada **no se puede modificar**; solo se puede **eliminar**.                                                                                                                                                                                                                                       | Es un plan cerrado. Permitir cambios abriría casos ambiguos (por ejemplo, una película que ya no está «por ver» o un tiempo que ya no alcanza). Si el plan cambia, se elimina y se arma otro.                                  |
| RN-10 | Si el usuario **elimina de su lista** una película que está en una sesión guardada, **la sesión no cambia**.                                                                                                                                                                                                     | La sesión conserva su propia copia del título y de la duración, así que sigue siendo un registro fiel de lo que se planeó.                                                                                                     |
| RN-11 | Cada sesión tiene un **nombre obligatorio de 1 a 60 caracteres** y una **fecha de creación automática**. Antes de validar el nombre se **quitan los espacios del principio y del final**; un nombre formado solo por espacios cuenta como vacío. Las sesiones se listan **de la más reciente a la más antigua**. | El nombre permite reconocer cada plan ("Viernes de terror"); la fecha ordena el historial sin pedir nada más al usuario. Quitar los espacios evita nombres que parecen vacíos o que superan el límite por espacios invisibles. |

#### Decididas al cerrar los puntos abiertos

| Id    | Regla                                                                                                                                                                                                     | Justificación                                                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN-12 | Si el usuario **cambia el tiempo disponible** mientras arma una sesión y lo ya agregado **deja de caber**, la app **lo avisa** y **no permite guardar** hasta que el usuario quite películas suficientes. | No se pierde lo que el usuario ya eligió (no se vacía la sesión) y, a la vez, nunca se guarda una sesión que no cabe (RN-04). El usuario decide qué quitar. |
| RN-13 | Se permiten **dos o más sesiones con el mismo nombre**.                                                                                                                                                   | Cada sesión se distingue por su fecha de creación y su contenido; prohibir nombres repetidos obligaría al usuario a inventar variantes sin aportar valor.   |
| RN-14 | Una sesión guardada **se muestra tal como se guardó**, sin indicar si alguna de sus películas ya se vio o salió de la lista.                                                                              | Es coherente con RN-09 y RN-10: la sesión es un registro cerrado de lo que se planeó, no un reflejo del estado actual de la lista.                          |
| RN-15 | **No hay límite** de películas por sesión ni de sesiones por usuario.                                                                                                                                     | El tiempo disponible (RN-01, máximo 600 minutos) ya acota cuántas películas caben en una sesión; limitar las sesiones no aporta al objetivo.                |

### 4.6 Supuestos

| Id    | Supuesto                                                                                                                                                                                                                                                                                           | Razón                                                                                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SU-01 | [SUPUESTO] Los títulos de tipo **serie** de la lista **no aparecen** en Noche de película.                                                                                                                                                                                                         | Las series están fuera de alcance de la E2.                                                                                                                                         |
| SU-02 | [SUPUESTO] **"Qué cabe" se calcula contra el tiempo que queda.** Con la sesión vacía, caben las películas cuya duración es menor o igual al tiempo disponible. Con películas ya agregadas, una película cabe si, al sumarla (con su pausa de 10 minutos), el total no supera el tiempo disponible. | Es la lectura de RN-03 y RN-04 aplicada paso a paso: la lista de opciones se actualiza con cada película agregada, de modo que el usuario nunca puede armar una sesión que no cabe. |
| SU-03 | [SUPUESTO] Una misma película **no puede repetirse** dentro de la misma sesión.                                                                                                                                                                                                                    | Ver la misma película dos veces en una noche no tiene sentido para el objetivo; una película ya agregada deja de aparecer como opción.                                              |
| SU-04 | [SUPUESTO] Una sesión necesita **al menos una película** para poder guardarse.                                                                                                                                                                                                                     | El cliente habla de "una o varias" películas; una sesión vacía no es un plan.                                                                                                       |
| SU-05 | [SUPUESTO] La sesión guardada **conserva el tiempo disponible** con el que se armó, además de su tiempo total.                                                                                                                                                                                     | Permite ver después cuánto tiempo se tenía y cuánto sobraba, y es necesario para que la sesión sea un registro cerrado (RN-09, RN-10).                                              |
| SU-06 | [SUPUESTO] Las películas de una sesión se guardan **en el orden en que el usuario las agregó**, que se toma como el orden en que piensa verlas.                                                                                                                                                    | El cliente no pidió reordenar; es el comportamiento más simple y coherente con un plan cerrado.                                                                                     |
| SU-07 | [SUPUESTO] La meta de la métrica de éxito es **60 % de sesiones cumplidas** a los 2 meses del lanzamiento.                                                                                                                                                                                         | Es una meta inicial razonable para un hábito nuevo y el cliente la acepta como punto de partida; se revisará cuando la métrica pueda medirse.                                       |

### 4.7 Puntos abiertos

No quedan puntos abiertos; todos se resolvieron como reglas o supuestos.

| Punto | Tema                                         | Dónde quedó            |
| ----- | -------------------------------------------- | ---------------------- |
| PA-01 | Meta de la métrica                           | SU-07 (y 4.2)          |
| PA-02 | Fecha en que una película pasa a «vista»     | No-alcance (4.4) y 4.2 |
| PA-03 | Duración de 0 minutos                        | RN-05                  |
| PA-04 | Cambiar el tiempo con películas ya agregadas | RN-12                  |
| PA-05 | Sesiones con el mismo nombre                 | RN-13                  |
| PA-06 | Espacios en el nombre                        | RN-11                  |
| PA-07 | Fecha planeada                               | No-alcance (4.4)       |
| PA-08 | Mostrar si una película ya se vio            | RN-14                  |
| PA-09 | Límite de películas y sesiones               | RN-15                  |
