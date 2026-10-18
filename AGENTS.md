# ReSession — instrucciones para agentes

## Diseño

Este producto sigue **ReDesign** (`node_modules/re-design`, versión fijada en `package.json`).

1. Antes de tocar interfaz, lee `node_modules/re-design/AGENTS.md` y
   `node_modules/re-design/docs/products/resession.md`.
2. Usa las clases `re-*` de `components.css` para los componentes y Tailwind solo para el layout.
3. No edites `node_modules/re-design` ni copies sus archivos aquí. Si falta algo, anótalo como
   Propuesta en el doc del producto y avisa.
4. Antes de terminar: `npm run lint:design` con 0 errores.

- Marca: `re-design/brands/resession.css`
- Excepciones de diseño: las de `docs/products/resession.md` en ReDesign. Ninguna más.

## Arquitectura

Estructura, capas y registro de decisiones: [docs/architecture.md](docs/architecture.md). Si una
decisión deja de servir, se cambia allí primero y después en el código.

- **La garantía:** lo protegido (candado o lista blanca) nunca se limpia. Toda limpieza en lote pasa
  por `src/engine/protection.ts` (D6), venga del popup o del service worker.
- **`src/engine/`** es TypeScript puro y plano: sin Angular ni `chrome.*`, un archivo por
  responsabilidad, sin barrels.
- **Dos stores:** `SessionStore` (lo que hay en el navegador) y `PreferencesStore` (lo que guarda
  ReSession). El estado de la UI son signals de las vistas.
- **Piezas de la UI:** item (solo pinta y emite) → container (resuelve las operaciones de sus items)
  → vista (búsqueda, selección, plegado, lote) → shell. Las capas (toast, confirmación, editor) se
  piden a un servicio.
- **El host del componente es la raíz del bloque** (`re-tree__row`, `re-tree__group`…): ReDesign usa
  selectores entre hermanos.

## Guía de implementación

[docs/guide/README.md](docs/guide/README.md). La implementa el usuario para aprender: no escribas los
componentes por él salvo que lo pida.

Al escribir o ampliar pasos de la guía:

- Orden de menos a más dependencias (item → container → vista → shell).
- **El HTML es estático:** clases `re-*` y valores de ejemplo, que compile tal cual al pegarlo. Nada
  de bindings, control flow, interpolaciones ni llamadas a métodos: lo dinámico va en **comentarios**
  que dicen qué cambia y cuándo, sin dar la sintaxis.
- La lógica del TypeScript se describe en palabras, en una tabla por miembro: qué es (input, output,
  `signal`, `linkedSignal`, `computed`, método, propiedad), su tipo y cómo se obtiene o se calcula.

## Código

- Nombres y comentarios en **inglés**. Modelos y campos no obvios, y métodos cuyo nombre no basta,
  documentados con JSDoc en inglés.
- **Ningún texto visible escrito en la plantilla:** todo sale de Transloco (`src/assets/i18n/es.json` y
  `en.json`, un espacio de nombres por componente; las dos con las mismas claves). El engine no
  traduce: devuelve datos (`kind`, `domain`) y la interfaz elige el texto (D27).
- No escribas tests hasta que el usuario los pida; deja los specs generados como están.

## Código limpio

Vale para todo lo que se escribe en `src/`. Revisa tu propio código con esta lista antes de entregarlo,
también lo que copies de la maqueta (la maqueta es una referencia visual, no un modelo de código).

- **La plantilla es un espejo:** lee signals y `computed` con nombre, y emite. Sin ternarios anidados ni
  repetidos, sin claves de traducción armadas concatenando, sin funciones del engine llamadas desde el
  HTML. Un texto que depende de una decisión se resuelve en el TS con `translateSignal`; las claves fijas
  se quedan en la plantilla con `t()`.
- **Mapas tipados, no cadenas de `if`:** lo que depende de un `kind` va en un `Record<Kind, …>`, así un
  caso nuevo no compila hasta tener su valor.
- **Cada regla en su sitio:** la protección solo en `engine/protection.ts`; un componente no reimplementa
  reglas de negocio.
- **Sin andamios (D29):** nada de copias locales que imiten un store, reglas provisionales ni `console.*`.
  Lo que aún no tiene su pieza real no se conecta.
- **Una fuente de verdad:** lo derivado es `computed`; no se copia estado.
- **Sin código muerto:** ni imports, miembros, inputs u outputs sin usar.
- **Nombres que dicen qué es** (booleanos que se leen como pregunta: `isNested`); comentarios con el
  porqué, no el qué. Sin `any` ni `!`.
- Antes de terminar: `ng build` sin errores ni avisos y `npm run lint:design` en 0.

## Guía de testing
OBLIGATORIO ANTES DE ESCRIBIR CUALQUIER TEST, REVISAR LOS LINEAMIENTOS EN LA CARPETA /docs/testing.md
