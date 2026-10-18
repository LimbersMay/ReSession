# Especificación visual de ReSession

Cómo se ve y cómo se comporta a la vista cada parte del popup. La referencia viva es la maqueta (`src/app/mockup/`). Las reglas de fondo (tokens, clases `re-*`, R1–R13) son de **ReDesign**: este documento solo concreta cómo las aplica ReSession.

- Estructura y decisiones: [architecture.md](architecture.md)
- Lógica de cada pieza: [guide/README.md](guide/README.md)

---

## 1. Principios

1. **La garantía se dice una vez.** «Lo protegido nunca se limpia» vive en la status bar, con «Detalles» hacia la ayuda. Ningún botón lo repite («Limpiar», nunca «Limpiar no protegidas»).
2. **El color es una señal.** Ámbar (marca) solo para lo que el usuario debe pulsar o lo que está encendido. Verde y rojo solo donde el significado es el mensaje: protegido o en vivo, y peligro o rastreador.
3. **Neutro por defecto.** Iconos de tipo, badges de formato, conteos, el candado y la opción activa de un segmented son neutros.
4. **Las acciones de fila se revelan.** Editar, eliminar, copiar y el «Limpiar» de un grupo aparecen con hover o foco (`re-reveal`). La excepción es el grupo de rastreadores, el único con la acción siempre visible.
5. **Denso pero legible.** Tres tamaños de texto, todo lo monoespaciado en 11 px, nada de tamaños arbitrarios.

---

## 2. Ventana y zonas

Popup de **540×600** (`re-app`, `position: relative`). En el panel lateral, `html.fluid` y ancho de 320 px en adelante: nada puede depender de los 540 px.

```
┌──────────────────────────────────────────────┐
│ Header: logo · vistas · Añadir · ajustes     │  fijo
├──────────────────────────────────────────────┤
│ Barra de búsqueda (+ cookies/storage o total)│  fijo (vistas 1 y 2)
├──────────────────────────────────────────────┤
│ Barra de lote                                │  fijo (vistas 1 y 2)
├──────────────────────────────────────────────┤
│                                              │
│ Árbol / contenido de la vista                │  único bloque con scroll
│                                              │
├──────────────────────────────────────────────┤
│ Status bar: garantía · Detalles              │  fijo
└──────────────────────────────────────────────┘
  Capas dentro de re-app: menú · editor · confirmación · toast
```

- Solo el contenido de la vista hace scroll. Header, barras y status bar no se mueven.
- Las capas usan las variantes `--contained` de ReDesign: se abren **dentro** del popup, no sobre la página.

---

## 3. Mapa de acentos

Todo lo que lleva color en ReSession. Lo que no esté aquí es neutro.

| Elemento | Color | Por qué |
|---|---|---|
| «Añadir» (header), «Guardar» (editor), «Añadir» (listas) | Marca, `re-btn--primary` | La acción principal de cada pantalla. Una por vista o diálogo |
| Switch encendido, checkbox marcado | Marca | Control encendido |
| Anillo de foco | Marca | Foco |
| Hover de botones de icono `--brand` (editar, copiar) | Marca, transitorio | Estado transitorio |
| Enlace «Detalles» | Marca, `re-link` | Enlace |
| Píldora «Lista blanca», icono de lista blanca, aviso de lista blanca en el editor | Verde (`--success`) | Protegido |
| Escudo de la status bar | Verde | La garantía es protección |
| Punto «en vivo» y barra lateral de la tarjeta del temporizador | Verde | En vivo; gris en pausa (`is-paused`) |
| Grupo de rastreadores: icono, conteo, filas, «Limpiar (n)» | Rojo (`--danger`, `--danger-soft`) | Rastreador |
| Icono de lista negra | Rojo | Se limpiará |
| Papelera, «Eliminar» del editor, botón de confirmar destructivo | Rojo | Destructivo |
| Segmented de listas: «Lista blanca» y «Lista negra» activos | Verde y rojo (`re-segmented__item--success`, `--danger`) | La lista es el significado |

**Nunca llevan color:** el logo, la vista activa del header, la opción activa de idioma o tema, Cookies/Storage, Original/Decodificado, Lax/Strict/None, los badges de formato (`{JWT}`, `{JSON}`, `exacto`, `comodín`), las banderas H y S, los iconos de carpeta, globo y base de datos, y **el candado**.

---

## 4. Header

- **Logo** neutro (icono de cookie en caja `re-header__logo`) y el nombre «ReSession».
- **Vistas:** `re-segmented` con `role="tablist"`: *Esta pestaña* (diana), *Global (n)* (globo), *Auto* (rayo). `n` es el número de **sitios** con cookies. La activa se marca por elevación.
- **Añadir:** `re-btn--sm --primary` con `+`. Abre el editor en modo «Nueva cookie» con el dominio de la pestaña. Se oculta en Auto.
- **Ajustes:** engranaje `re-icon-btn` con `aria-haspopup="menu"`. Abre `re-menu`:
  - *Idioma*: Español / English (segmented de bloque).
  - *Tema*: sol / luna / monitor, solo iconos con `title`.
  - *Exportar ajustes* e *Importar ajustes*, sin nota debajo. Qué incluye la exportación (D20) lo explica la ayuda.
  - *Ayuda y atajos*.
- El menú se cierra con Esc, con un clic fuera y al elegir una acción. Cambiar idioma o tema **no** lo cierra.

---

## 5. Vista «Esta pestaña»

### Barra de búsqueda

- `re-input-group` con lupa y texto mono. Placeholder: «Buscar por clave, valor o !exclusión…».
- A la derecha, segmented **Cookies (n) / Storage (n)**.

### Barra de lote

| Estado | Izquierda | Acciones |
|---|---|---|
| Cookies, sin selección | ☐ Seleccionar todo (n) | Proteger todas · Limpiar · plegar todo |
| Cookies, con selección | ☑ (n) seleccionadas | Proteger (n) · Limpiar (n) · plegar todo |
| Storage, sin selección | ☐ Seleccionar todo (n) | Vaciar · plegar todo |
| Storage, con selección | ☑ (n) seleccionadas | Eliminar (n) · plegar todo |

- El checkbox pasa a indeterminado con una selección parcial.
- «Limpiar» sin selección actúa sobre todo lo **visible** (respetando la búsqueda).
- El botón de plegar cambia de icono: *Contraer todo* si hay algo abierto, *Expandir todo* si todo está plegado.

### Árbol de cookies

Tres grupos, en este orden. Se omite un grupo sin cookies.

| Grupo | Icono | Meta | Acción de cabecera |
|---|---|---|---|
| **Subdominio actual** | Carpeta | host de la pestaña (`gist.github.com`) | «Limpiar» revelado (`--danger-ghost`) |
| **Dominio raíz compartido** | Globo | dominio con punto (`.github.com`) | «Limpiar» revelado, **o** la píldora «Lista blanca» si el sitio está en ella |
| **Rastreadores en pestaña** | Escudo con alerta, rojo | «Analítica y publicidad» | «Limpiar (n)» siempre visible (`--danger-soft`) |

- Conteo en `re-badge--micro` (rojo `re-badge--danger` en rastreadores).
- La píldora «Lista blanca» **sustituye** a «Limpiar»: no hay nada que limpiar ahí. Tooltip: «github.com está en tu lista blanca: nada de este dominio se limpia».

### Fila de cookie (`app-cookie-row`)

```
☐  🔒  clave            valor truncado…               H  S   ✎  🗑
```

- **Candado**, botón sin caja: abierto `slate-300`, cerrado `slate-700`. Hover un tono más oscuro. Tooltip «Proteger con candado» / «Quitar candado».
- **Clave** en negrita (`re-tree__key--strong`) si tiene candado.
- **Valor** truncado en una línea, mono, gris.
- **Banderas** `re-badge--micro`: `H` (HttpOnly) y `S` (Secure), con tooltip. Solo en esta vista.
- **Rastreador:** fila `re-tree__row--danger`; en lugar de banderas, la píldora neutra con el nombre de la empresa (*Google Ads*).
- **Acciones reveladas:** editar (`--brand`) y eliminar (`--danger`).
- Toda la fila es clicable para seleccionar, salvo el candado y las acciones.

### Árbol de storage

- Dos grupos: **LocalStorage** (base de datos) y **SessionStorage** (base de datos con rayo). Meta: el origen (`https://gist.github.com`). Conteo: «2 claves · 14.2 KB».
- Acción de cabecera: «Vaciar» revelado. Siempre confirma.
- Fila de dos líneas: clave en negrita + badge de formato (`{JWT}`, `{JSON}`) + nota («Expira en 2 h» para un JWT con `exp`). Debajo, el valor truncado.
- Acciones: copiar, ver decodificado (solo si hay formato), eliminar. **Sin candado.**

---

## 6. Vista «Global»

- Búsqueda: «Buscar cookies o dominios en todo el navegador…» con un badge del total («1.420 cookies»).
- Barra de lote: *Proteger* deshabilitado sin selección (tooltip «Selecciona cookies para protegerlas»), *Limpiar todo* y plegar todo.
- Árbol de tres niveles:
  1. **Sitio** (dominio registrable): globo, nombre, badge «n cookies», «Limpiar» revelado.
  2. **Dominio** tal como lo guarda la cookie (`.github.com`, `gist.github.com`): carpeta, nombre en mono negrita, meta «Raíz · n» o «Subdominio · n», «Limpiar» revelado o píldora de lista blanca.
  3. **Cookie**: la misma `cookie-row`, sangrada (`--l3`), sin banderas.
- Los **rastreadores** se agrupan aparte, al final, como un nivel 1 rojo: «Rastreadores de terceros» con «n detectados» y «Limpiar (n)» visible. Nivel 2: dominio del rastreador con la empresa en la meta.
- Orden: sitios por número de cookies, de más a menos. Plegados por defecto salvo el sitio de la pestaña activa.
- Cifras grandes compactas en los botones: «Seleccionar todo (1,4 mil)».

---

## 7. Vista «Auto»

### Tarjeta del temporizador

- `re-card` con barra lateral verde (`--re-card-accent: emerald-500`). Apagada: `is-paused`, la barra y el punto en gris.
- Cabecera: punto en vivo, «Ejecución automática», selector inline del intervalo (1, 5, 15 o 30 min, 1 hora) y el switch.
- Cuerpo: «¿Qué debe limpiar el temporizador en cada ciclo?» y tres opciones (`re-option` + checkbox):
  - **Rastreadores**: «Elimina los rastreadores conocidos de todos los sitios.»
  - **Lista negra**: «Elimina las cookies de los sitios de tu lista negra.»
  - **Modo estricto**: «Elimina también las cookies de todos los demás sitios.»
- Pie (pendiente en la maqueta): «Último ciclo hace 3 min · 12 eliminadas · 4 protegidas se conservan», o «Aún no se ha ejecutado».
- Con el switch apagado las opciones siguen editables: se configura antes de encender.

### Listas

- Título «Sitios del temporizador» y segmented **Lista blanca (n)** (escudo con check, verde) / **Lista negra (n)** (escudo con X, rojo).
- Campo con globo, placeholder «ej. *.google.*, *.github.com, x.com», y «Añadir» primario. Enter también añade.
- Debajo: «Añadir la pestaña actual: gist.github.com» (botón fantasma) y la descripción de la lista («Sitios que nunca se limpian» / «Sitios que se limpian en cada ciclo»).
- Cada entrada: icono de la lista en su color, patrón en mono negrita, badge neutro **exacto** o **comodín**, explicación en una línea y la papelera revelada.
- Error de patrón bajo el campo (`re-error`): «Escribe un dominio, como github.com o *.github.com». Duplicado: «github.com ya está en la lista blanca».
- Si el patrón ya está en la otra lista, aviso: «Está en la lista negra. La blanca gana: no se limpiará.».

---

## 8. Editor de cookie

`re-dialog` dentro del popup. Título con icono de cookie: «Editar cookie» o «Nueva cookie». Subtítulo mono: `dominio · ruta`.

Orden fijo de secciones:

1. **Nombre.**
2. **Valor:** segmented Original / Decodificado {formato} (solo si se detecta), copiar, textarea mono. Debajo: «Valor exacto guardado en el navegador.» y el contador «n / 4096 B» (rojo al pasarse). Decodificado es de solo lectura.
3. **Ámbito:** Dominio y Ruta en dos columnas (`1fr 128px`). Pista: «Con punto inicial también la reciben los subdominios, por ejemplo: `.github.com`» (el ejemplo en mono). Al editar, aviso neutro: «Cambiar el nombre, el dominio o la ruta crea una cookie nueva y elimina la anterior.».
4. **Duración:** segmented *Hasta cerrar el navegador* / *Fecha fija*. En sesión, nota «El navegador la borra al cerrar todas sus ventanas.». En fecha: campo de fecha y hora, atajos «1 hora · 1 día · 30 días · 400 días (máx.)» y la frase «Caduca en 14 días · sábado, 31 de octubre de 2026».
5. **Seguridad** (`re-fieldset`): HttpOnly y Secure en dos columnas; SameSite Lax / Strict / None con su explicación debajo:
   - Lax: «Se envía al llegar al sitio desde un enlace, no en peticiones de otros sitios.»
   - Strict: «Solo se envía en peticiones del propio sitio.»
   - None: «Se envía también desde otros sitios.»
   - Con None, o con los prefijos `__Secure-` / `__Host-`, Secure queda marcado y deshabilitado, con la nota que diga por qué.
6. **Protección:** «Proteger con candado / Ninguna limpieza la borrará.» con switch. Si el sitio está en la lista blanca, aviso verde de solo lectura: «**github.com está en tu lista blanca.** Esta cookie ya está protegida, tenga candado o no.».

Pie: «Eliminar» fantasma rojo a la izquierda (solo al editar), «Cancelar» y «Guardar» primario.

**Errores:** bajo el campo, en `re-error`, al salir del campo o al intentar guardar. Guardar sigue habilitado; al pulsarlo con errores, el foco va al primero.

---

## 9. Confirmaciones, toasts y deshacer

### Qué se confirma y qué se deshace

| Acción | Respuesta |
|---|---|
| Eliminar una cookie sin protección | Toast «user_pref eliminada» + Deshacer |
| Eliminar una cookie **protegida** (candado o lista blanca) | Confirmación: «¿Eliminar user_session?» · «**Tiene candado.** Se borrará solo esta cookie y el sitio puede cerrar tu sesión.» (o «Su sitio está en tu lista blanca.») |
| Limpiar un grupo, la selección o todo lo visible | Toast «5 eliminadas · 3 protegidas se conservan» + Deshacer |
| Limpiar todo (Global) | Confirmación con las cifras reales: «¿Limpiar 1.212 cookies de 84 sitios? Se conservan 208 protegidas.» |
| Vaciar un storage | Confirmación: «¿Vaciar el localStorage de gist.github.com? Se borrarán 2 claves. No se puede deshacer.» |
| Eliminar una clave de storage | Toast sin deshacer (pendiente de decidir, guía 09) |
| Proteger / quitar candado | Toast breve; al quitarlo en un sitio de lista blanca: «Sin candado, pero sigue protegida por la lista blanca.» |
| Guardar en el editor | Toast «Cambios guardados» |
| Nada que limpiar | Toast «Nada que limpiar · 3 protegidas» |

### Forma

- Confirmación: `re-dialog--confirm`, icono de aviso, verbo exacto en el botón («Eliminar», «Limpiar», «Vaciar», nunca «Aceptar»). El foco empieza en **Cancelar**.
- Toast: abajo y centrado, dentro del popup, con la barra de tiempo. **3 s** sin acción, **5 s** con «Deshacer». Uno a la vez: uno nuevo sustituye al anterior (y su deshacer caduca).
- Textos de toast: participio + cifra, sin punto final. «2 cookies eliminadas», «8 cookies protegidas con candado».

---

## 10. Estados

| Estado | Cómo se ve |
|---|---|
| Cargando | El árbol con 3–4 filas fantasma (sin spinner). Si tarda menos de 150 ms, no se muestra nada |
| Vacío (sin cookies) | `re-list__empty` centrado: icono de cookie y «Este sitio no tiene cookies.» |
| Sin resultados | «Nada coincide con "texto".» y un botón «Borrar búsqueda» |
| Página especial (`chrome://`, tienda, PDF) | «ReSession no puede leer esta página.»; las cookies se pueden ver en Global. Storage deshabilitado con tooltip |
| Error de lectura | `re-notice--danger` sobre el árbol con «Reintentar» |
| Deshabilitado | Botón con `disabled` y tooltip con el motivo, nunca oculto si el usuario espera verlo |
| Seleccionado | Fila con el fondo de selección de `re-tree__row` y checkbox marcado |
| Temporizador en pausa | `is-paused`: barra y punto grises, opciones editables |

---

## 11. Iconos (Lucide)

| Concepto | Icono | Concepto | Icono |
|---|---|---|---|
| Producto / cookie | `cookie` | Candado / sin candado | `lock` / `lock-open` |
| Esta pestaña | `target` | Global / dominio raíz / sitio | `globe` |
| Auto | `zap` | Subdominio / dominio | `folder` |
| Rastreadores | `shield-alert` | Lista blanca / negra | `shield-check` / `shield-x` |
| LocalStorage / SessionStorage | `database` / `database-zap` | Limpiar | `eraser` |
| Eliminar | `trash-2` | Editar | `pencil` |
| Copiar / decodificado | `copy` / `code` | Plegar / desplegar todo | `chevrons-down-up` / `chevrons-up-down` |
| Sesión / fecha fija | `log-out` / `calendar` | Aviso | `triangle-alert` / `info` |

Tamaños según el contenedor (ReDesign, `iconography.md`): 13 en `re-icon-btn` e input, 12 en `re-btn` e icono de grupo, 11 en botones pequeños y chevron, 10 en `re-btn--2xs`, segmented y status bar, 14 en el título de un diálogo.

---

## 12. Textos

- **Verbos:** *Eliminar* = un elemento. *Limpiar* = en lote, respeta la protección. *Vaciar* = un contenedor sin protección (el storage). No se mezclan.
- Mayúscula solo al principio. Sin signos de exclamación.
- Cifras en los botones de lote solo cuando hay selección o el número es el mensaje (rastreadores).
- Dominios, claves, valores y patrones siempre en mono.
- Fechas con el idioma elegido: «sábado, 31 de octubre de 2026»; relativas para lo reciente: «hace 3 min».

---

## 13. Teclado y accesibilidad

| Tecla | Efecto |
|---|---|
| `/` | Enfoca la búsqueda de la vista (si no se está escribiendo en otro campo) |
| Esc | Cierra la capa de arriba: confirmación → editor → menú. Si no hay ninguna, borra la búsqueda |
| Enter / Espacio en una cabecera de grupo | Plegar o desplegar |
| Alt+⇧+S | Abrir ReSession (atajo de Chrome) |
| Alt+⇧+L | Limpiar la pestaña actual sin abrir el popup (atajo de Chrome) |

- Cabeceras de grupo con `role="button"`, `tabindex="0"` y `aria-expanded`.
- Diálogos con `aria-modal`, foco atrapado y devuelto al botón que los abrió.
- Botones de solo icono con `title` y `aria-label`; el del candado cambia de texto con el estado.
- El toast vive en una región `aria-live="polite"`.
- El color nunca es la única señal: el candado cambia de icono, los rastreadores tienen su grupo y su texto, la lista blanca tiene texto en la píldora.

---

## 14. Tema

Claro, oscuro y sistema, todo desde la paleta de ReDesign (`.dark` en `<html>`). La plantilla es la misma en los dos: sin variantes `dark:`. El último tema aplicado se guarda en el estado de la UI para pintarlo antes del primer render y evitar un destello.
