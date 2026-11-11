# DESIGN.md — Sistema de diseño de Mi Cartelera

Documenta el diseño **actual** de `src/index.css`. CSS propio, sin Bootstrap (ver D-02 en `docs/ESTADO-INICIAL.md`).

> **[SUPUESTO] Por qué no Bootstrap:** el enunciado pide documentar "el Bootstrap del Proyecto 3", pero el Proyecto 3 nunca lo usó. Incorporarlo ahora obligaría a reescribir los estilos de la épica E1, y la regla del proyecto es que nada se reescribe. Por eso este documento formaliza el sistema que ya existe, con el mismo nivel de detalle que pediría Bootstrap: tokens, componentes, personalización, prohibiciones y criterios verificables.

Todo lo marcado **[NUEVO]** todavía no existe en el CSS: es una propuesta para la épica E2 y se agrega solo cuando un ticket lo pida.

## 1. Principios visuales

1. **Sala de cine de noche:** fondo casi negro (`--bg`) con destellos de luz difuminados en `body::before`, que recuerdan las estelas de una calle de noche.
2. **El póster es el protagonista:** formato 2:3, sin bordes redondeados dentro de la tarjeta; el resto de la interfaz es sobrio y oscuro.
3. **Un solo acento cálido:** el naranja `--acento` marca la acción principal, el foco, el hover y los subtítulos. El cian `--frio` solo aparece en el fondo.
4. **Títulos con carácter, texto legible:** Cinzel (serif de cartel de cine) para títulos; fuente del sistema para todo lo demás.
5. **Superficies discretas:** paneles oscuros con borde blanco al 10 % y esquinas suaves; ningún color de relleno fuerte, salvo el botón principal.

## 2. Tokens

### Colores (`:root` en `src/index.css`)

| Variable               | Valor                      | Uso                                                                    |
| ---------------------- | -------------------------- | ---------------------------------------------------------------------- |
| `--bg`                 | `#07080d`                  | Fondo de la página                                                     |
| `--panel`              | `rgba(18, 20, 30, 0.78)`   | Fondo de `.tarjeta`                                                    |
| `--panel-2`            | `#1a1d2b`                  | Fondo de botones, inputs, selects y `.sin-poster`                      |
| `--borde`              | `rgba(255, 255, 255, 0.1)` | Bordes de controles y tarjetas; separador de la cabecera               |
| `--texto`              | `#ececf3`                  | Texto principal                                                        |
| `--suave`              | `#9a9fb5`                  | Texto secundario: correo en la cabecera, `.tarjeta-meta`, "Sin póster" |
| `--acento`             | `#ff9f43`                  | Botón principal, foco, hover, `h3`, `.insignia`                        |
| `--frio`               | `#2ec4d6`                  | Declarado; hoy solo aparece (en rgba) en el fondo                      |
| `--texto-sobre-acento` | `#1a1206`                  | Texto del botón principal (`button[type='submit']`)                    |
| `--error`              | `#ff5c5c`                  | Mensajes de error (sustituye a `red`; el tono ya existe en el fondo)   |
| `--exito`              | `#3ddc97`                  | Mensajes de éxito (sustituye a `lightgreen`)                           |

`color-scheme: dark` hace que los controles nativos (flecha del select, autocompletado) sean oscuros.

### Tipografía

| Rol                            | Fuente                                                     | Tamaño / estilo                                              |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------ |
| Cuerpo                         | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | 1rem, `line-height: 1.5`                                     |
| `h1`                           | Cinzel 700                                                 | 2.2rem, `letter-spacing: 0.04em`                             |
| `h2`                           | Cinzel 700                                                 | 1.5rem, `letter-spacing: 0.04em`                             |
| `h3`                           | Fuente del cuerpo                                          | 1rem, MAYÚSCULAS, `letter-spacing: 0.08em`, color `--acento` |
| `.tarjeta-titulo`              | Cinzel 700                                                 | 0.95rem, `line-height: 1.25`                                 |
| Correo en la cabecera          | Fuente del cuerpo                                          | 0.9rem, `--suave`                                            |
| Controles dentro de la tarjeta | Fuente del cuerpo                                          | 0.85rem                                                      |
| `.tarjeta-meta`                | Fuente del cuerpo                                          | 0.8rem, `--suave`                                            |
| `.insignia`                    | Fuente del cuerpo                                          | 0.75rem, peso 600                                            |

Cinzel se carga desde Google Fonts (pesos 500 y 700). Ninguna otra fuente está permitida.

### Espaciados (valores en uso; no hay variables)

`2px` (insignia, vertical) · `6px` / `8px` (controles de tarjeta, separación en formularios, márgenes de `p`) · `12px` (padding de inputs, `.tarjeta-cuerpo`, separación en la cabecera) · `14px` (padding horizontal de botones) · `16px` (laterales de `#root`) · `20px` (separación y margen superior de `.rejilla`, margen de `h3`) · `24px` (arriba de `#root`, debajo de la cabecera) · `36px` (margen superior de `h2`) · `72px` (abajo de `#root`).
**[NUEVO]** si la E2 necesita variables: `--esp-1: 4px`, `--esp-2: 8px`, `--esp-3: 12px`, `--esp-4: 16px`, `--esp-5: 24px`, `--esp-6: 36px`.

### Radios y sombras

| Elemento                 | Valor                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| Imágenes sueltas         | `border-radius: 6px`                                                  |
| Botones, inputs, selects | `border-radius: 8px`                                                  |
| `.tarjeta`               | `border-radius: 10px` (la imagen interior, 0)                         |
| `.insignia`              | `border-radius: 999px` (píldora)                                      |
| Sombra de `.tarjeta`     | `0 10px 30px rgba(0, 0, 0, 0.5)` (única sombra)                       |
| Transiciones             | botones `0.15s` (borde, transform); tarjeta `0.2s` (transform, borde) |

## 3. Cómo se personaliza

- **Todos los tokens viven en `:root`** al principio de `src/index.css`. Cambiar un valor ahí lo cambia en toda la app.
- **Para agregar un token:** (1) que lo pida un ticket o una spec; (2) declararlo en `:root` con prefijo en español (`--error`, `--esp-3`…); (3) usarlo con `var(--nombre)`, nunca con el valor literal; (4) agregarlo en la tabla de la sección 2 de este archivo, quitando la marca [NUEVO] si ya existía como propuesta.
- **Para agregar un componente:** una clase en `src/index.css` en minúsculas y con guiones, en español (`.tarjeta-meta`), documentada en la sección 4. No se crean archivos CSS por componente; `src/App.css` es un resto de la plantilla y no se usa (D-14).

## 4. Componentes

| Componente             | Clase / selector                                                                       | Cuándo se usa                                                                                            | Estados                                                                                                                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Botón secundario       | `button`                                                                               | Cualquier acción que no sea el envío principal: "Ver detalle", "Eliminar", "Cerrar sesión", "Volver"     | Normal `--panel-2` + `--borde` · hover: borde `--acento` · foco con teclado: contorno 2px `--acento` · deshabilitado: opacidad 0.55, `cursor: not-allowed`                                                                                                             |
| Botón principal        | `button[type='submit']`                                                                | Enviar un formulario ("Entrar", "Buscar"); uno por formulario                                            | Fondo `--acento`, texto `--texto-sobre-acento`, peso 600 · mismos estados de foco y deshabilitado                                                                                                                                                                      |
| Input                  | `input`                                                                                | Correo, contraseña, búsqueda, comentario                                                                 | Normal `--panel-2` + `--borde` · foco: contorno `--acento` · los de texto, correo y contraseña crecen (`flex: 1 1 200px`)                                                                                                                                              |
| Select                 | `select`                                                                               | Estado, calificación, filtro, orden                                                                      | Igual que el input                                                                                                                                                                                                                                                     |
| Fila de filtros        | `.filtros`                                                                             | Selects de filtro y orden encima de una `.rejilla` (Mi lista, E2-T15)                                    | Flex con salto de línea, separación 8px entre controles; la distancia hasta la cuadrícula la da el margen superior de `.rejilla`                                                                                                                                       |
| Formulario             | `form`                                                                                 | Agrupar un input y su botón                                                                              | Flex con salto de línea (`flex-wrap`), separación 8px                                                                                                                                                                                                                  |
| Cuadrícula             | `.rejilla`                                                                             | Resultados del buscador, "Mi lista", candidatas y sesiones guardadas (en la E1, desde E2-T15)            | Columnas automáticas de 170px como mínimo, separación 20px · margen superior 20px respecto de lo que tenga encima (formulario, filtros o mensaje), salvo justo después de un `h3` (`h3 + .rejilla`: 0, para que el subtítulo quede pegado a su cuadrícula con sus 6px) |
| Tarjeta de póster      | `.tarjeta` > `img` + `.tarjeta-cuerpo` (`.tarjeta-titulo`, `.tarjeta-meta`, controles) | Cada título, dentro de `.rejilla`                                                                        | Normal: `--panel`, borde, sombra · hover: sube 4px, borde `--acento` · la imagen ocupa el ancho, 2:3, `object-fit: cover` · los controles ocupan el 100 % del ancho a 0.85rem, con su altura natural (`flex: none`)                                                    |
| Sin póster             | `.sin-poster`                                                                          | Sustituye a `img` cuando `posterUrl` es null                                                             | Mismo 2:3, fondo `--panel-2`, texto `--suave` centrado                                                                                                                                                                                                                 |
| Insignia               | `.insignia`                                                                            | Dato corto sobre el póster (tipo, estado, calificación o duración), dentro de `.tarjeta`                 | Píldora arriba a la izquierda, fondo negro al 70 %, texto `--acento`                                                                                                                                                                                                   |
| Mensaje de carga       | `.mensaje`                                                                             | "Buscando…", "Cargando tu lista…"                                                                        | Texto `--suave`                                                                                                                                                                                                                                                        |
| Mensaje de error       | `.mensaje.mensaje-error`                                                               | Fallo de red, de Supabase o de validación                                                                | Texto `--error` (sustituye a `style={{ color: 'red' }}`)                                                                                                                                                                                                               |
| Mensaje de éxito       | `.mensaje.mensaje-exito`                                                               | Confirmación ("se agregó a tu lista")                                                                    | Texto `--exito` (sustituye a `lightgreen`)                                                                                                                                                                                                                             |
| Mensaje vacío          | `.mensaje.mensaje-vacio`                                                               | Lista vacía, sin resultados, filtro sin coincidencias                                                    | Texto `--suave`, centrado                                                                                                                                                                                                                                              |
| Usuario en la cabecera | `header .cabecera-usuario`                                                             | Agrupa el correo y "Cerrar sesión" para que nunca se separen (E2-T15)                                    | Flex en fila sin salto, separación 12px, empujado a la derecha (`margin-left: auto`); el correo puede partirse (`overflow-wrap: anywhere`) para no desbordar a 360px                                                                                                   |
| Navegación             | `header nav` y `nav button[aria-current='page']`                                       | Botones de vista ("Mi lista", "Noche de película"); la vista activa lleva `aria-current="page"` (E2-T15) | La `nav` ocupa su propia fila (`flex-basis: 100%`), botones con separación 8px · activa: borde y texto `--acento`, peso 600 (no es un botón principal: sin fondo `--acento`)                                                                                           |

Títulos de sección: `h2` (Cinzel). Subtítulos dentro del detalle: `h3` (naranja, mayúsculas). Cabecera: `header` en fila flexible con una línea `--borde` debajo. En la primera fila van el `h1`, que ocupa el espacio libre, y `.cabecera-usuario` (correo + "Cerrar sesión"); en la segunda, la `nav` con las vistas. En pantallas estrechas, `.cabecera-usuario` baja de línea completo, nunca solo el botón.

## 5. Responsive

No hay media queries: la app se adapta con contenedores flexibles.

- `#root` mide como máximo 1040px, va centrado y deja 16px a cada lado en móvil.
- `header` y `form` usan `flex-wrap`: en pantallas estrechas el correo, el botón o el input pasan a la línea siguiente.
- Los inputs de texto crecen y bajan de línea cuando quedan con menos de 200px.
- `.rejilla` con `auto-fill` y `minmax(170px, 1fr)`: unas 5 columnas a 1040px, 2 a partir de unos 392px de pantalla (360px de contenido + 32px de padding) y 1 por debajo.
- El fondo (`body::before`) es `position: fixed` y no genera scroll.
- **[NUEVO]** si la E2 quiere 2 columnas en móviles de 360px: `@media (max-width: 480px) { .rejilla { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; } }`.

## 6. Prohibido

- Colores fuera de la paleta de la sección 2: nada de `red`, `lightgreen`, hexadecimales sueltos ni colores con nombre en el CSS o en los componentes.
- Estilos en línea (`style={{ … }}`). Todo estilo va en una clase de `src/index.css`.
- Fuentes nuevas, o cargar otros pesos o familias de Google Fonts.
- Bootstrap, Tailwind, MUI o cualquier otra librería de UI o CSS.
- Clases nuevas que no estén documentadas en este archivo.
- Sombras, radios o transiciones distintos de los de la sección 2 sin pasar antes por este documento.

## 7. Criterios de diseño verificables

Comprobables en el navegador con DevTools (Elements, Computed, Console, Network).

| Id     | Criterio                                         | Cómo se comprueba                                                                                                                                                          |
| ------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DIS-01 | No hay estilos en línea                          | Consola: `document.querySelectorAll('[style]').length === 0` en todas las pantallas                                                                                        |
| DIS-02 | Errores y éxitos usan los tokens                 | Provocar un duplicado: el mensaje tiene la clase `mensaje-error` y el color computado es `rgb(255, 92, 92)`; al agregar un título, `mensaje-exito` con `rgb(61, 220, 151)` |
| DIS-03 | Solo dos familias tipográficas                   | Network → Font: solo Cinzel. Computed `font-family` de cualquier texto: Cinzel o la fuente del sistema                                                                     |
| DIS-04 | No se carga ninguna librería de UI               | Network → CSS: solo el CSS del bundle y la hoja de Google Fonts                                                                                                            |
| DIS-05 | El foco con teclado es visible                   | Recorrer con Tab: cada botón, input y select muestra un contorno naranja de 2px                                                                                            |
| DIS-06 | Hay un solo botón principal por formulario       | Cada `form` tiene exactamente un `button[type='submit']`, de fondo `rgb(255, 159, 67)`                                                                                     |
| DIS-07 | Los botones deshabilitados se distinguen         | Mientras busca o agrega: opacidad 0.55 y cursor `not-allowed`                                                                                                              |
| DIS-08 | Los títulos se muestran en cuadrícula de pósters | En "Mi lista" y en los resultados, el contenedor tiene la clase `rejilla` y `display: grid`                                                                                |
| DIS-09 | El póster mantiene la proporción 2:3             | Medir el `img` (o `.sin-poster`) de una tarjeta: alto ≈ ancho × 1.5                                                                                                        |
| DIS-10 | La tarjeta reacciona al hover                    | Al pasar el ratón sobre `.tarjeta`: `translateY(-4px)` y borde naranja                                                                                                     |
| DIS-11 | Un título sin póster no rompe la cuadrícula      | Su tarjeta muestra `.sin-poster` con el mismo tamaño que las demás                                                                                                         |
| DIS-12 | Toda espera tiene un mensaje de carga            | Con la red limitada a "Slow 3G", buscar y abrir un detalle: aparece un `.mensaje` de carga                                                                                 |
| DIS-13 | Los estados vacíos están explicados              | Lista vacía, búsqueda sin resultados y filtro sin coincidencias muestran `.mensaje-vacio`                                                                                  |
| DIS-14 | No hay scroll horizontal en móvil                | Vista de 360px: `document.documentElement.scrollWidth <= window.innerWidth`                                                                                                |
| DIS-15 | El texto es legible                              | El contraste del texto principal y de `--suave` sobre el fondo es ≥ 4.5:1 (DevTools → contraste)                                                                           |
