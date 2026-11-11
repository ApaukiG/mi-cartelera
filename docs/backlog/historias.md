# Historias de usuario — Épica E2 "Noche de película"

Fuente: `docs/prd/PRD.md` (reglas RN-01 a RN-15, supuestos SU-01 a SU-07).
Casos borde decididos en el refinamiento: `docs/backlog/refinamiento.md` (CB-xx).
Usuario: la persona que usa Mi Cartelera con su propia cuenta y su lista.

---

## HU-01 — Ver qué películas caben en mi tiempo

**Como** usuario con películas «por ver»
**quiero** indicar cuántos minutos tengo y ver cuáles de mis películas caben en ese tiempo
**para** elegir algo que sí pueda terminar.

_INVEST:_ es independiente (solo necesita la lista de la E1), su presentación es negociable, responde la pregunta central del cliente (valiosa), es una consulta acotada a una pantalla (estimable y pequeña) y sus criterios son comprobables (testeable).

| Id       | Criterio                                                                                                                                                                                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-01.1  | **DADO** que tengo películas «por ver» con duración conocida **CUANDO** indico 120 minutos **ENTONCES** veo las películas que duran 120 minutos o menos, cada una con su duración.                                                                                           |
| CA-01.2  | **DADO** que tengo una película de exactamente 120 minutos **CUANDO** indico 120 minutos **ENTONCES** esa película aparece entre las que caben.                                                                                                                              |
| CA-01.3  | **DADO** que estoy en Noche de película **CUANDO** indico 30 minutos o 600 minutos **ENTONCES** la app acepta el tiempo y me muestra lo que cabe.                                                                                                                            |
| CA-01.4  | **DADO** que estoy en Noche de película **CUANDO** indico 29 minutos o 601 minutos **ENTONCES** la app rechaza el tiempo, me dice que debe estar entre 30 y 600 minutos y no me muestra películas.                                                                           |
| CA-01.5  | **DADO** que estoy en Noche de película **CUANDO** indico un tiempo con decimales (90,5), un texto ("noventa") o dejo el tiempo vacío **ENTONCES** la app me pide un número entero de minutos entre 30 y 600 y no me muestra películas.                                      |
| CA-01.6  | **DADO** que en mi lista tengo películas «por ver», «viendo» y «vista» **CUANDO** indico mi tiempo **ENTONCES** solo se tienen en cuenta las películas «por ver».                                                                                                            |
| CA-01.7  | **DADO** que en mi lista tengo series «por ver» **CUANDO** indico mi tiempo **ENTONCES** las series no aparecen en Noche de película.                                                                                                                                        |
| CA-01.8  | **DADO** que una película «por ver» no tiene duración conocida **CUANDO** indico mi tiempo **ENTONCES** aparece como no disponible con el motivo "no tiene duración conocida" y no la puedo agregar.                                                                         |
| CA-01.9  | **DADO** que el catálogo indica 0 minutos para una película **CUANDO** indico mi tiempo **ENTONCES** se trata igual que una película sin duración conocida.                                                                                                                  |
| CA-01.10 | **DADO** que caben "Zeta" (95 min), "Alfa" (95 min) y "Beta" (88 min) **CUANDO** veo lo que cabe **ENTONCES** aparecen en este orden: Beta, Alfa, Zeta (de la más corta a la más larga y, si empatan, por título).                                                           |
| CA-01.11 | **DADO** que acabo de indicar mi tiempo **CUANDO** la app todavía está obteniendo las duraciones **ENTONCES** veo un mensaje de carga.                                                                                                                                       |
| CA-01.12 | **DADO** que el catálogo de cine no responde **CUANDO** intento ver lo que cabe **ENTONCES** veo un mensaje de error que me deja reintentar, y Mi lista sigue funcionando.                                                                                                   |
| CA-01.13 | **DADO** que no tengo películas «por ver» **CUANDO** entro en Noche de película **ENTONCES** veo un mensaje que me lo explica y me sugiere agregar películas a mi lista.                                                                                                     |
| CA-01.14 | **DADO** que ninguna de mis películas cabe en el tiempo indicado **CUANDO** veo el resultado **ENTONCES** un mensaje me dice que no cabe ninguna y que pruebe con más tiempo.                                                                                                |
| CA-01.15 | **DADO** que una película dura más que mi tiempo **CUANDO** veo el resultado **ENTONCES** aparece como no disponible con el motivo (por ejemplo, "dura 140 min y tienes 120"), después de las que caben. Las películas sin duración aparecen al final, por orden alfabético. |
| CA-01.16 | **DADO** que el catálogo no devuelve la duración de algunas películas pero sí la de otras **CUANDO** veo el resultado **ENTONCES** las primeras aparecen como no disponibles con el motivo "no se pudo obtener la duración" y las demás se muestran con normalidad.          |

---

## HU-02 — Armar una sesión

**Como** usuario que ya sabe qué películas caben
**quiero** agregar y quitar películas viendo el tiempo total, con pausas, y el tiempo que me queda
**para** construir un plan que no supere mi tiempo libre.

_INVEST:_ depende solo del resultado de HU-01, el diseño del armado es negociable, es el núcleo del valor (planear sin pasarse), está acotada a agregar y quitar (pequeña y estimable) y cada cálculo es comprobable con números concretos.

| Id       | Criterio                                                                                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-02.1  | **DADO** que tengo 120 minutos y la sesión vacía **CUANDO** agrego una película de 100 minutos **ENTONCES** el total es 100 minutos, sin pausa, y me quedan 20.                                                         |
| CA-02.2  | **DADO** que tengo 180 minutos y una película de 100 en la sesión **CUANDO** agrego una de 60 **ENTONCES** el total es 170 minutos (100 + 10 de pausa + 60) y me quedan 10.                                             |
| CA-02.3  | **DADO** que tengo 170 minutos y una película de 100 en la sesión **CUANDO** agrego una de 60 **ENTONCES** el total es exactamente 170, me quedan 0 minutos y la sesión se puede guardar.                               |
| CA-02.4  | **DADO** que me quedan 20 minutos y la sesión ya tiene una película **CUANDO** veo lo que cabe **ENTONCES** una película de 10 minutos aparece como disponible (10 + 10 de pausa = 20) y una de 15 no (15 + 10 = 25).   |
| CA-02.5  | **DADO** que una película no cabe en lo que me queda **CUANDO** la veo en la lista **ENTONCES** aparece como no disponible con la explicación (por ejemplo, "necesita 25 min, 15 + 10 de pausa, y te quedan 20").       |
| CA-02.6  | **DADO** que ya agregué una película a la sesión **CUANDO** veo las películas disponibles **ENTONCES** esa película ya no aparece como opción.                                                                          |
| CA-02.7  | **DADO** que tengo una sola película en la sesión **CUANDO** la quito **ENTONCES** la sesión queda vacía, el total es 0 minutos y la película vuelve a aparecer como opción.                                            |
| CA-02.8  | **DADO** que tengo 3 películas (90, 100 y 80 minutos; total 290) **CUANDO** quito la del medio **ENTONCES** el total pasa a 180 minutos (90 + 10 + 80), con una pausa menos.                                            |
| CA-02.9  | **DADO** que mi sesión ocupa 170 minutos **CUANDO** cambio el tiempo disponible a 150 **ENTONCES** la app me avisa de que la sesión se excede en 20 minutos y no me deja guardar hasta que quite películas suficientes. |
| CA-02.10 | **DADO** que mi sesión ocupa 170 minutos **CUANDO** cambio el tiempo disponible a 200 **ENTONCES** me quedan 30 minutos y la lista de lo que cabe se actualiza.                                                         |
| CA-02.11 | **DADO** que una película no tiene duración conocida **CUANDO** intento agregarla a la sesión **ENTONCES** no se agrega y la app me explica que no tiene duración conocida.                                             |

---

## HU-03 — Guardar la sesión

**Como** usuario que armó una sesión
**quiero** guardarla con un nombre
**para** tener mi plan listo para esa noche.

_INVEST:_ es independiente de cómo se consulten después las sesiones, el nombre y el mensaje son negociables, convierte el armado en un plan concreto (valiosa), es una sola acción (pequeña y estimable) y sus validaciones son comprobables.

| Id       | Criterio                                                                                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-03.1  | **DADO** que tengo una sesión que cabe **CUANDO** la guardo con el nombre "Viernes de terror" **ENTONCES** queda guardada con ese nombre, la fecha de creación, el tiempo disponible, el tiempo total y sus películas con su duración, en el orden en que las agregué, y veo un mensaje de éxito. |
| CA-03.2  | **DADO** que la sesión está vacía **CUANDO** intento guardarla **ENTONCES** la app no lo permite y me explica que necesito al menos una película.                                                                                                                                                 |
| CA-03.3  | **DADO** que tengo una sesión que cabe **CUANDO** intento guardarla sin nombre o con un nombre formado solo por espacios **ENTONCES** la app no la guarda y me pide un nombre.                                                                                                                    |
| CA-03.4  | **DADO** que escribo " Maratón de domingo " como nombre **CUANDO** guardo **ENTONCES** la sesión se guarda como "Maratón de domingo", sin los espacios del principio y del final.                                                                                                                 |
| CA-03.5  | **DADO** que escribo un nombre **CUANDO** guardo **ENTONCES** se acepta si tiene de 1 a 60 caracteres después de quitar los espacios de los extremos y se rechaza con 61 o más. Las letras con tilde y la ñ cuentan como un carácter.                                                             |
| CA-03.6  | **DADO** que ya tengo una sesión llamada "Viernes" **CUANDO** guardo otra con el mismo nombre **ENTONCES** se guarda sin problema y las dos aparecen en mis sesiones.                                                                                                                             |
| CA-03.7  | **DADO** que guardé una sesión **CUANDO** vuelvo a Mi lista **ENTONCES** sus películas siguen en estado «por ver».                                                                                                                                                                                |
| CA-03.8  | **DADO** que una película ya está en una sesión guardada **CUANDO** armo otra sesión **ENTONCES** la película sigue apareciendo como opción y puedo guardarla también en la nueva sesión.                                                                                                         |
| CA-03.9  | **DADO** que mi sesión se excede del tiempo disponible (ver CA-02.9) **CUANDO** intento guardarla **ENTONCES** la app no la guarda y me recuerda cuántos minutos se excede.                                                                                                                       |
| CA-03.10 | **DADO** que pulso "Guardar" **CUANDO** vuelvo a pulsarlo antes de que termine de guardarse **ENTONCES** se guarda una sola sesión.                                                                                                                                                               |
| CA-03.11 | **DADO** que falla la conexión al guardar **CUANDO** veo el resultado **ENTONCES** veo un mensaje de error, mi sesión en armado se conserva intacta y puedo reintentar.                                                                                                                           |
| CA-03.12 | **DADO** que ya tengo muchas sesiones guardadas (por ejemplo, 50) **CUANDO** guardo una más **ENTONCES** se guarda sin límite.                                                                                                                                                                    |

---

## HU-04 — Consultar mis sesiones guardadas

**Como** usuario que guardó sesiones
**quiero** ver la lista de mis sesiones y el detalle de cada una
**para** recordar qué planeé ver y en qué orden.

_INVEST:_ solo depende de que existan sesiones guardadas, la forma de mostrar el detalle es negociable, permite volver al plan (valiosa), es una consulta sin edición (pequeña y estimable) y sus criterios son observables (testeable).

| Id      | Criterio                                                                                                                                                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-04.1 | **DADO** que tengo varias sesiones guardadas **CUANDO** abro mis sesiones **ENTONCES** aparecen de la más reciente a la más antigua.                                                                                               |
| CA-04.2 | **DADO** que abro una sesión guardada **CUANDO** veo su detalle **ENTONCES** veo su nombre, su fecha de creación, el tiempo disponible, el tiempo total y sus películas en orden, cada una con la duración que tenía al guardarla. |
| CA-04.3 | **DADO** que no tengo sesiones guardadas **CUANDO** abro mis sesiones **ENTONCES** veo un mensaje que me invita a armar la primera.                                                                                                |
| CA-04.4 | **DADO** que una película de una sesión guardada fue eliminada de Mi lista **CUANDO** veo esa sesión **ENTONCES** la sesión se ve igual que cuando la guardé, con el título y la duración de esa película.                         |
| CA-04.5 | **DADO** que marqué como «vista» una película de una sesión guardada **CUANDO** veo esa sesión **ENTONCES** se muestra tal como se guardó, sin indicar que esa película ya se vio.                                                 |
| CA-04.6 | **DADO** que veo una sesión guardada **CUANDO** busco cómo cambiarla **ENTONCES** no hay forma de modificar su nombre, su tiempo ni sus películas; solo puedo eliminarla.                                                          |
| CA-04.7 | **DADO** que abro mis sesiones **CUANDO** se están cargando o falla la conexión **ENTONCES** veo un mensaje de carga o un mensaje de error, respectivamente.                                                                       |

---

## HU-05 — Eliminar una sesión

**Como** usuario con sesiones guardadas
**quiero** eliminar una sesión
**para** descartar un plan que ya no me sirve.

_INVEST:_ es independiente del armado, la forma de confirmar es negociable, mantiene el historial limpio y es la única forma de "cambiar" un plan cerrado (valiosa), es una sola acción (pequeña y estimable) y su resultado es comprobable.

| Id      | Criterio                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-05.1 | **DADO** que tengo una sesión guardada **CUANDO** pido eliminarla y lo confirmo **ENTONCES** la sesión desaparece de mis sesiones.                                        |
| CA-05.2 | **DADO** que pedí eliminar una sesión **CUANDO** cancelo la confirmación **ENTONCES** la sesión sigue guardada sin cambios.                                               |
| CA-05.3 | **DADO** que una película está en dos sesiones **CUANDO** elimino una de ellas **ENTONCES** la otra sesión no cambia y la película sigue en Mi lista con el mismo estado. |
| CA-05.4 | **DADO** que falla la conexión al eliminar **CUANDO** veo el resultado **ENTONCES** veo un mensaje de error y la sesión sigue en la lista.                                |

---

## HU-06 — Privacidad de mis sesiones

**Como** usuario de Mi Cartelera
**quiero** que mis sesiones sean solo mías
**para** planear mis noches sin que nadie más vea ni toque mis planes.

_INVEST:_ es independiente de la interfaz, el mecanismo es negociable, protege la confianza en la app (valiosa), se limita a quién ve y modifica qué (pequeña y estimable) y se comprueba con dos cuentas (testeable).

| Id      | Criterio                                                                                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-06.1 | **DADO** que los usuarios A y B tienen sesiones guardadas **CUANDO** A abre sus sesiones **ENTONCES** solo ve las suyas.                                               |
| CA-06.2 | **DADO** que B tiene una sesión guardada **CUANDO** A intenta verla, crearla a nombre de B o eliminarla por cualquier medio **ENTONCES** no puede.                     |
| CA-06.3 | **DADO** que no he iniciado sesión **CUANDO** intento entrar en Noche de película **ENTONCES** solo veo la pantalla de acceso; al cerrar sesión vuelvo a esa pantalla. |
| CA-06.4 | **DADO** que A indica su tiempo disponible **CUANDO** ve lo que cabe **ENTONCES** solo aparecen películas de la lista de A.                                            |

---

## Cobertura de reglas y supuestos del PRD

| Regla / supuesto                                              | Criterios que la cubren                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| RN-01 Tiempo entero entre 30 y 600                            | CA-01.3, CA-01.4, CA-01.5                                          |
| RN-02 Solo películas «por ver» del usuario                    | CA-01.6, CA-06.4                                                   |
| RN-03 Pausas de 10 min solo entre películas                   | CA-02.1 (una sola película, sin pausa), CA-02.2, CA-02.8           |
| RN-04 Cabe si no supera; el exacto cabe                       | CA-01.2, CA-02.3                                                   |
| RN-05 Duración del catálogo; sin duración o 0 no se agrega    | CA-01.8, CA-01.9, CA-02.11                                         |
| RN-06 Guardar no cambia el estado                             | CA-03.7, CA-05.3                                                   |
| RN-07 Una película en varias sesiones                         | CA-03.8, CA-05.3                                                   |
| RN-08 Orden de la más corta a la más larga; empate alfabético | CA-01.10                                                           |
| RN-09 Sesión guardada no se modifica, solo se elimina         | CA-04.6, CA-05.1                                                   |
| RN-10 Eliminar de la lista no cambia la sesión                | CA-04.4                                                            |
| RN-11 Nombre de 1 a 60 tras quitar espacios; fecha; orden     | CA-03.1, CA-03.3, CA-03.4, CA-03.5, CA-04.1                        |
| RN-12 Cambiar el tiempo: aviso y no guardar                   | CA-02.9, CA-03.9                                                   |
| RN-13 Nombres repetidos permitidos                            | CA-03.6                                                            |
| RN-14 La sesión se muestra tal como se guardó                 | CA-04.5                                                            |
| RN-15 Sin límites                                             | CA-03.12                                                           |
| SU-01 Series fuera                                            | CA-01.7                                                            |
| SU-02 "Qué cabe" contra el tiempo que queda                   | CA-02.4, CA-02.5, CA-02.10                                         |
| SU-03 Sin repetir en la misma sesión                          | CA-02.6                                                            |
| SU-04 Al menos una película                                   | CA-03.2                                                            |
| SU-05 Conserva el tiempo disponible                           | CA-03.1, CA-04.2                                                   |
| SU-06 Orden en que se agregaron                               | CA-03.1, CA-04.2                                                   |
| SU-07 Meta del 60 %                                           | No aplica a criterios: la medición está fuera del alcance de la E2 |
