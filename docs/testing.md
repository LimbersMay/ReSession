# TESTING.md: estándar de tests de ReRoute

Este documento es **normativo**. Todo test nuevo o modificado debe cumplirlo, lo escriba una persona o una IA. Si una regla deja de servir, se cambia aquí primero y luego en el código.

- Palabras clave: **DEBE** / **NO DEBE** son obligatorias; **DEBERÍA** admite excepciones justificadas en un comentario del propio test.
- Contexto de arquitectura: [docs/architecture.md](architecture.md) (§4 stores y repositorios, §8 convenciones).
- Infraestructura de tests: [`src/testing/`](../src/testing/) (alias `@testing/*`).

---

## 0. Instrucciones para agentes de IA

Si eres un agente generando o corrigiendo tests, sigue este procedimiento en orden:

1. Lee el archivo bajo prueba **y su contrato**: la clase abstracta del repositorio, las interfaces de `@engine/models` y §4 de la arquitectura. Se prueba el contrato, no la implementación.
2. Identifica la capa (repositorio, store, componente dumb, componente smart, `engine/`) y abre su checklist de la [§8](#8-casos-de-borde-obligatorios). **Cada punto aplicable DEBE tener al menos un test.**
3. Reutiliza `src/testing/` (fake de Chrome, fixtures, repositorios en memoria, `render()` y Transloco de pruebas). Si es un componente, sigue la [§7](#7-componentes-tests-de-dom). Si falta un doble, **créalo en `src/testing/`**, no inline en el spec.
4. Escribe los tests siguiendo la estructura de la [§3](#3-estructura-de-un-spec) y la plantilla de la [§11](#11-plantillas).
5. Si un caso obligatorio falla porque el **código de producción** no cumple el contrato, NO ajustes el assert al bug: aplica la [§10](#10-defectos-conocidos-itfails-e-ittodo).
6. Ejecuta y deja verde:
   ```bash
   npx ng test --watch=false
   npx tsc -p tsconfig.spec.json --noEmit
   ```
7. En tu respuesta, lista los `it.fails` y `it.todo` que añadiste y el defecto que documentan.

---

## 1. Stack y ejecución

| Pieza | Valor |
|---|---|
| Runner | Vitest 4 vía `@angular/build:unit-test` (`ng test`) |
| Entorno | jsdom (sin navegador real) |
| Angular | 21, **zoneless** (sin `zone.js`), NgModules (`standalone: false`) |
| Globals | `describe`, `it`, `expect`, `vi`, `beforeEach`… son globales (`vitest/globals`). Solo se permite `import type { … } from 'vitest'`. |
| DOM | `@testing-library/dom` (queries) y `@testing-library/user-event` (interacciones), envueltos por `render()` de `@testing/dom` (§7) |
| Setup global | [`../src/testing/setup.ts`](../src/testing/setup.ts), registrado en `angular.json → test → options.setupFiles` |
| Ubicación | Cada `*.spec.ts` junto a su archivo (`rule.store.ts` → `rule.store.spec.ts`) |

```bash
npm test                                   # = ng test (watch en terminal interactiva)
npx ng test --watch=false                  # una pasada, como en CI
npx ng test --watch=false --filter=RuleStore
```

TestBed se inicializa y se resetea solo entre tests. **NO DEBE** llamarse a `TestBed.resetTestingModule()` ni a `initTestEnvironment()` a mano.

---

## 2. Principios

1. **Comportamiento, no implementación.** Se verifica lo que observa un consumidor: el valor de los signals, lo que quedó persistido, lo que se emitió. No se espían métodos privados ni se accede a miembros privados (`store['repo']`, `as any`).
2. **Determinismo.** Mismo resultado en cualquier orden, máquina y hora. Prohibido depender de `Date.now()`, `Math.random()`, `crypto.randomUUID()` o temporizadores reales sin controlarlos (§5).
3. **Aislamiento.** Ningún test deja estado que otro pueda ver: globales, `localStorage`, constantes mutadas, spies sin restaurar.
4. **Un motivo de fallo por test.** Si un `it` necesita la palabra "y" en su nombre para dos comportamientos distintos, son dos tests.
5. **El happy path no basta.** Un spec que solo cubre el camino feliz está incompleto y no se acepta en revisión (§8).
6. **Asserts discriminantes.** Los datos de prueba DEBEN distinguir los resultados posibles (por ejemplo, `buildSettings()` difiere en todos los campos de `DEFAULT_SETTINGS` para que "cargó del storage" no pase por "cayó a los defaults").

---

## 3. Estructura de un spec

### Nombres

- `describe` de primer nivel: el nombre exacto de la clase o función (`'RuleStore'`, `'hasChromeStorage()'`).
- `describe` anidado por método público con paréntesis (`'toggle()'`) o por fase (`'initialization'`).
- `it` en **inglés**, en presente, describiendo comportamiento observable y la condición: `'keeps state and storage unchanged when the id does not exist'`. Nada de `'should …'` ni `'works'`.

### Función `setup()` en lugar de `let` compartidos

Cada spec DEBE declarar una función `setup(options)` que construye el escenario y **devuelve** lo que el test necesita. NO DEBE usarse el patrón `let x; beforeEach(() => x = …)` para el sujeto bajo prueba.

Motivo: los stores cargan en su constructor; el estado del storage (y los fallos) DEBEN prepararse **antes** de `TestBed.inject`. Con `setup({ stored, loadError })` cada test declara su escenario explícitamente.

```ts
function setup({ stored = buildRules(3) }: { stored?: Rule[] } = {}) {
  const repository = new InMemoryRuleRepository(stored);
  TestBed.configureTestingModule({
    providers: [{ provide: RuleRepository, useValue: repository }],
  });
  return { repository, store: TestBed.inject(RuleStore) };
}
```

### Arrange / Act / Assert

Tres bloques separados por una línea en blanco. Sin comentarios `// Arrange` (la línea en blanco basta). Un solo *Act* por test.

### Reglas de TestBed

- Los servicios `providedIn: 'root'` **no** se vuelven a declarar en `providers`; solo se sustituyen sus dependencias.
- Las dependencias se sustituyen por token (`{ provide: RuleRepository, useValue: fake }`), nunca parcheando la instancia real.

---

## 4. Dobles de prueba

Orden de preferencia. Usa el primero que sirva:

| # | Tipo | Cuándo | En ReRoute |
|---|---|---|---|
| 1 | Implementación real | Funciones puras, `engine/`, el propio repositorio bajo prueba | — |
| 2 | **Fake funcional** (en memoria) | Dependencias con estado: storage, repositorios | `installChromeFake()`, `InMemoryRuleRepository`, `InMemorySettingsRepository` |
| 3 | Stub tipado con `vi.fn<T>()` | Colaboradores sin estado relevante (Transloco, toast) | `{ setActiveLang: vi.fn<TranslocoService['setActiveLang']>() }` |
| 4 | `vi.spyOn` sobre un objeto real | Observar o forzar un fallo puntual de algo real | `vi.spyOn(Storage.prototype, 'setItem')`, `vi.spyOn(console, 'error')` |

Reglas:

- Los fakes de `../src/testing` **implementan la abstracción real** (`implements RuleRepository`). Si el contrato cambia, el compilador rompe el fake: es intencionado.
- Todo `vi.fn` DEBE estar tipado con la firma real: `vi.fn<RuleRepository['save']>()`. **Prohibido** `ReturnType<typeof vi.fn>`, `any` y `as any`: ocultan errores (los tests anteriores esperaban un `repository.save` que no existe en `SettingsRepository` y nadie lo vio).
- Los fallos se inyectan sobre el método espía del fake, solo para la llamada que interesa:
  ```ts
  repository.save.mockReturnValueOnce(throwError(() => new Error('quota')));   // Observable
  chromeFake.storage.local.set.mockRejectedValueOnce(new Error('quota'));       // Promise
  ```
- Un doble que se necesite en más de un spec DEBE vivir en `../src/testing` con su sufijo: `*.fake.ts`, `*.fixture.ts`, `in-memory-*.repository.ts`. Los specs no importan de otros specs.
- `../src/testing` está excluido del build de la app (`tsconfig.app.json`) y solo lo importan specs.

### Fixtures

- Siempre con *builders* que devuelven un objeto nuevo en cada llamada: `buildRule(overrides)`, `buildRules(n)`, `buildSettings(overrides)`.
- Prohibido declarar literales de dominio completos dentro de un spec (los `sampleRule` duplicados en cada archivo). Si falta una variante, se pasa por `overrides` o se añade un builder.
- Para comparar contra el estado inicial se vuelve a llamar al builder (`expect(store.rules()).toEqual(buildRules(2))`), no se reutiliza una referencia que el código pudo mutar.

### Prohibido testear datos estáticos o de demostración

Los tests verifican **comportamiento del sistema**, nunca el contenido de datos.

- **Prohibido** crear un `describe()` o un `it()` cuyo único propósito sea validar el contenido, la forma o la presencia de constantes de ejemplo o de demostración (`MOCK_RULES`, `DEMO_DATA`, seeds…): cuántos elementos tienen, qué variantes incluyen, qué campos traen.
- **Prohibido** que un test **dependa** de esas constantes: no se importan en un spec, ni para sembrar estado ni como valor esperado. El estado se siembra con los builders de `@testing/fixtures` a través del repositorio fake.
- La API que existe **solo** para la demo (por ejemplo, `RuleStore.resetToMocks()` o el fallback a `MOCK_RULES` cuando el repositorio está vacío) no se testea: se elimina junto con los datos.
- Si un comportamiento de demo contradice el contrato final (roadmap), se escribe el test del **contrato final** como `it.fails` con un comentario `// PENDING:` (§10). Al quitar la demo, el test se pone rojo y se pasa a `it`.
- Sí se permite referenciar constantes que **son contrato** de producción (`DEFAULT_SETTINGS`, `STORAGE_KEYS`) como valor esperado de un comportamiento ("devuelve los defaults cuando no hay datos"). Sigue prohibido un test que solo valide su contenido.

> `MOCK_RULES` es **temporal**: existe porque todavía no hay forma de crear reglas desde la UI. Se elimina, junto con `resetToMocks()` y el fallback de `RuleStore.init()`, cuando el modal de edición permita crear reglas.

---

## 5. Globales y APIs de Chrome

### Regla general

Un test **solo** puede alterar el entorno global con APIs de Vitest que se restauran automáticamente. El setup global ([`../src/testing/setup.ts`](../src/testing/setup.ts)) ejecuta tras **cada** test `vi.unstubAllGlobals()`, `vi.restoreAllMocks()`, `vi.useRealTimers()`, `localStorage.clear()` y `sessionStorage.clear()`. Los specs no repiten esa limpieza.

| Permitido | Prohibido |
|---|---|
| `vi.stubGlobal('chrome', …)` | `globalThis.chrome = …` / `(window as any).chrome = …` |
| `installChromeFake()` (usa `vi.stubGlobal`) | `delete globalThis.chrome` |
| `vi.spyOn(obj, 'method')` | `Object.defineProperty(globalThis, …)` |
| `vi.useFakeTimers()` / `vi.setSystemTime()` | Reasignar `console.log`, `Date`, `crypto`… |
| Escribir en `localStorage` para preparar datos | Mutar constantes exportadas (`DEFAULT_SETTINGS`, `STORAGE_KEYS`) |

### `chrome.storage`: `installChromeFake()`

[`../src/testing/chrome/chrome.fake.ts`](../src/testing/chrome/chrome.fake.ts) instala un `chrome` en memoria con `storage.local`, `storage.sync`, `storage.session` y `storage.onChanged`. Reproduce la semántica real:

- `get(key)` **omite** las claves inexistentes (`{}`), no devuelve `{ key: undefined }`.
- `get(null)`, `get([...])` y `get({ key: default })` funcionan como en Chrome.
- Los valores se serializan como JSON al escribir y al leer: un test no puede compartir referencias con el storage.
- `set`, `remove` y `clear` emiten `chrome.storage.onChanged` con `(changes, areaName)`.

```ts
const chromeFake = installChromeFake();

// Arrange: sembrar sin pasar por los espías ni disparar onChanged
chromeFake.storage.local.seed({ [STORAGE_KEYS.rules]: buildRules(2) });

// Inyectar un fallo solo en la próxima llamada
chromeFake.storage.local.set.mockRejectedValueOnce(new Error('QUOTA_BYTES quota exceeded'));

// Assert sobre el estado persistido, no sobre las llamadas
expect(chromeFake.storage.local.snapshot()).toEqual({ [STORAGE_KEYS.rules]: rules });
expect(chromeFake.storage.sync.snapshot()).toEqual({});   // no tocó otra área
```

- Se usa **siempre** `installChromeFake()` para tener una API de Chrome presente. `vi.stubGlobal('chrome', …)` directo solo se permite para simular una API **ausente o parcial** (por ejemplo, `hasChromeStorage()` con `undefined`, `{}` o `{ storage: { local: {} } }`).
- Las claves se referencian con `STORAGE_KEYS`, nunca con strings literales.
- Cuando se necesite otra API (`declarativeNetRequest`, `runtime`…), se amplía `createChromeFake()` con un fake funcional; no se crean mocks ad hoc en el spec.

### `localStorage`

- jsdom da un `localStorage` real; se prepara con `localStorage.setItem(STORAGE_KEYS.x, raw)` y se limpia solo.
- Los fallos de cuota se simulan con `vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('…', 'QuotaExceededError'); })`.

### Consola, tiempo y aleatoriedad

- Un test NO DEBE dejar salida en consola. Si el código loguea un error como parte del contrato ("los errores nunca se pierden en silencio"), se espía y **se verifica**: `expect(consoleError).toHaveBeenCalledExactlyOnceWith(expect.any(String), error)`. Si es ruido de depuración, se silencia con un comentario que lo diga.
- Tiempo: `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))`. IDs: `vi.spyOn(crypto, 'randomUUID').mockReturnValue('…')`.

---

## 6. Asincronía, signals y zoneless

### Observables y Promises

| Caso | Forma obligatoria |
|---|---|
| Observable de un solo valor | `await firstValueFrom(obs$)` |
| Error de un Observable | `await expect(firstValueFrom(obs$)).rejects.toThrow('…')` |
| Promise | `await promise` / `await expect(promise).rejects.toThrow('…')` |
| Flujo de varios valores (`onChanged`, `langChanges$`) | `await firstValueFrom(obs$.pipe(take(n), toArray()))` |

Prohibido: callbacks `done`, `subscribe` dentro del test sin esperar el resultado, `setTimeout`/`sleep` para "dar tiempo".

> Los repositorios y las mutaciones de los stores devuelven `Observable` (decisión D11, que sustituye a D5). Las APIs nativas de `chrome.storage` devuelven Promises pero se envuelven en Observables en los repositorios. En los tests se utiliza `firstValueFrom(...)` para esperar las emisiones o errores de estos Observables. Las reglas de esta sección se mantienen consistentes con dicho estándar.

### Zoneless

- **Prohibidos** `fakeAsync`, `tick`, `flush` y `waitForAsync` de `@angular/core/testing`: requieren `zone.js`, que el proyecto no tiene.
- Efectos (`effect()`): se ejecutan con `TestBed.tick()` antes del assert.
- Componentes: se montan con `render()` de `@testing/dom`, que espera el render inicial y el de cada interacción (§7). Los inputs se enlazan con `inputBinding` o se cambian con `fixture.componentRef.setInput('name', value)` seguido de `await fixture.whenStable()`.

### Stores de signals

- El estado se siembra **a través del repositorio fake**, nunca escribiendo en el signal del store (`store.rules.set(...)` está prohibido aunque el signal sea público hoy; la arquitectura lo exige privado).
- El estado se observa leyendo los signals y `computed` públicos.
- **Reactividad:** al menos un test por store crea un `computed` dependiente y comprueba que recalcula tras una mutación. Esto detecta mutaciones in situ que un `toEqual` no ve:
  ```ts
  const enabledCount = computed(() => store.rules().filter((rule) => rule.enabled).length);
  const before = store.rules();

  store.toggle('rule-1');

  expect(store.rules()).not.toBe(before);   // nueva referencia
  expect(before[0].enabled).toBe(true);     // el valor anterior no se mutó
  expect(enabledCount()).toBe(0);           // el computed recalculó
  ```

---

## 7. Componentes: tests de DOM

Un componente se prueba **como lo usa una persona**: se renderiza, se interactúa con el DOM y se verifica lo que queda en pantalla o lo que se emite.

> **Por qué.** En el editor de reglas, al borrar el primer header desaparecía el último. El `FormArray` estaba bien (se quitaba el control correcto), pero el `@for` con `track $index` reutilizaba las filas del DOM y cada fila seguía mostrando su control antiguo. Un test que llamara a `removeHeader(0)` y revisara el `FormArray` habría pasado. Solo un test que lee el DOM lo detecta. Los tests de [rule-editor-dialog.component.spec.ts](../src/app/features/dashboard/dialogs/rule-editor-dialog/rule-editor-dialog.component.spec.ts) fallan si se reintroduce ese bug.

### Herramientas

| Pieza | Uso |
|---|---|
| `render(Component, { bindings })` de `@testing/dom` | Crea el componente, espera el primer render y devuelve `view` (queries de [Testing Library](https://testing-library.com/docs/queries/about) acotadas al componente) y las interacciones `click`, `type`, `clear` y `selectOption`. Cada interacción usa `user-event` y espera `fixture.whenStable()` antes de resolver. |
| `inputBinding` / `outputBinding` de `@angular/core` | Enlazan inputs y outputs **por nombre**, como lo haría el template del padre (sirve también con outputs `protected`). |
| `translocoTestingModule()` de `@testing/transloco` | Transloco con los JSON reales, cargados de forma síncrona, en inglés. |
| `translate(key)` de `@testing/transloco` | Texto en inglés de una clave. El DOM se consulta con `translate('rules.card.delete')`, **nunca** con el texto escrito a mano. Lanza un error si la clave no existe. |

Configuración de TestBed:

- Se importa el **NgModule de la feature** que declara el componente (`RulesModule`, `DashboardModule`) más `translocoTestingModule()`. El componente **no** se vuelve a declarar en `declarations`.
- **No** se crean componentes *host* en el spec: el builder compila en AOT y un host no standalone declarado solo en TestBed no tiene scope. Para enlazar inputs y outputs se usa `bindings`.

```ts
const saved = vi.fn<(rule: Rule) => void>();
TestBed.configureTestingModule({ imports: [RulesModule, translocoTestingModule()] });

const rendered = await render(RuleEditorDialogComponent, {
  bindings: [inputBinding('rule', () => rule), outputBinding('save', saved)],
});
```

### Qué se verifica y qué no

| Se verifica | Prohibido verificar |
|---|---|
| Contenido visible: texto, `input.value`, número y orden de filas o tarjetas | Clases CSS o de Tailwind (`opacity-60`, `bg-*`, `border-primary`…): cambian por estilo, no por comportamiento |
| Atributos semánticos: `disabled`, `checked`, `aria-*`, `role` | Estilos computados (`getComputedStyle`) |
| Presencia y ausencia de elementos (`queryBy…` → `null`) | Estructura interna (`div > div:nth-child(2)`, `parentElement`) |
| El payload exacto de cada `output()` | Miembros del componente (`componentInstance.ruleForm`, métodos `protected`, signals internos) |
| En componentes smart: el DOM resultante | El estado del store o del repositorio: ya lo prueban sus propios specs |

Si un estado visual importa (regla deshabilitada, pestaña activa), DEBE expresarse de forma semántica (`aria-disabled`, `aria-selected`, `aria-pressed`, un texto) y se verifica eso. Mientras solo se exprese con clases, **no se testea**.

### Cómo encontrar elementos

Orden de preferencia (el de Testing Library):

1. `getByRole(role, { name })`: botones, headings, switches, `combobox`…
2. `getByLabelText`: exige `<label for>` o `aria-label`.
3. `getByPlaceholderText` / `getByDisplayValue`.
4. `getByText`.
5. `getByTestId` (`data-testid`), solo si nada de lo anterior es posible.

- **Prohibido** `querySelector` con clases o estructura. Para acotar un ítem de una lista se permite `closest()` hacia un elemento **semántico** (`article`, `li`, `tr`) y luego `within(item)`.
- Si un elemento interactivo no se encuentra por rol y nombre (un botón que solo tiene un icono), se corrige el **template** con un `aria-label` traducido. Es un defecto de accesibilidad, no un problema del test.

### Cómo interactuar

- Solo con `rendered.click / type / clear / selectOption`: disparan los eventos reales de un usuario.
- **Prohibido** llamar a métodos del componente (`component.removeHeader(0)`), usar `triggerEventHandler`, disparar eventos a mano con `dispatchEvent` o llamar a `fixture.detectChanges()` (en zoneless se espera con `whenStable()`, que `render` ya hace).
- Después de cada acción se vuelve a leer el DOM: es la fuente de verdad del test.

### Listas renderizadas con `@for`

Toda lista editable DEBE cubrir:

| ID | Escenario | Resultado esperado |
|---|---|---|
| L1 | Render inicial | Una fila por elemento, en orden, con sus valores |
| L2 | Añadir | La fila nueva aparece **al final**; las demás no cambian |
| L3 ⚠️ | Eliminar la **primera**, una **del medio** y la **última** | Desaparece **exactamente** esa fila; las demás conservan valores y orden |
| L4 ⚠️ | Eliminaciones consecutivas hasta vaciar la lista | Cada clic quita la fila pulsada, no otra |
| L5 | Lista vacía | Se muestra el estado vacío |
| L6 | Re-render (cambio de pestaña, `@if`) | Se conservan las filas añadidas y eliminadas |
| L7 | Guardar | Lo que se envía coincide con lo que se ve, en el mismo orden |

L3 con las tres posiciones es obligatorio: un bug de `track` suele borrar siempre la última fila, así que un test que solo elimina la última **pasa con el bug**.

Si el estado inicial no es fiable por un defecto documentado, el resultado esperado se calcula a partir de lo que había en pantalla antes de actuar (`before.filter((_, i) => i !== index)`). Así el test sigue detectando el error de la acción sin depender del otro bug.

### Formularios

| ID | Escenario | Resultado esperado |
|---|---|---|
| F1 | Enviar tras editar campos | El output se emite **una vez** con los campos editados |
| F2 | Enviar sin editar (modo edición) | El payload es igual a la entrada (ida y vuelta) |
| F3 ⚠️ | Identidad del registro editado | Se conservan `id`, `profileId`, `enabled`, `order`… |
| F4 | Formulario inválido (cuando haya validadores) | No emite y el error se ve en pantalla |
| F5 | Cancelar / guardar | Cancelar emite `close` y no `save`; guardar no emite `close` |

### Componentes smart (integración)

- Se montan con el **store real** sobre el repositorio en memoria (`InMemoryRuleRepository`…) y se verifica **solo el DOM**.
- Ejemplo: al borrar una regla, su tarjeta desaparece y las demás siguen ahí; al borrar la última, aparece el estado vacío.

---

## 8. Casos de borde obligatorios

Cada punto aplicable DEBE tener al menos un test. Los marcados con ⚠️ son los que más se olvidan.

### 8.1 Repositorios (adaptadores de storage)

| ID | Escenario | Resultado esperado |
|---|---|---|
| R1 | Clave nunca escrita | Colección vacía (`[]`) o defaults |
| R2 | Colección vacía persistida | `[]` |
| R3 ⚠️ | Datos corruptos: JSON malformado, tipo incorrecto (objeto, string, número), `null` | Fallback seguro, sin lanzar. Usar `it.each` |
| R4 | Valor parcial (agregados con defaults) | Merge con los defaults |
| R5 | Ida y vuelta `save → load` | Mismo valor |
| R6 | Escribir sobre datos previos | Reemplaza, no concatena |
| R7 ⚠️ | Fallo de lectura | El error se propaga **por el canal asíncrono** (Observable/Promise), nunca de forma síncrona |
| R8 ⚠️ | Fallo de escritura (cuota, `MAX_WRITE_OPERATIONS_PER_MINUTE`) | Se propaga y el storage conserva el valor anterior |
| R9 | Lectura-modificación-escritura (`update`) con lectura fallida | No escribe nada |
| R10 | Área y clave | Usa `STORAGE_KEYS` y el área correcta; no toca otras áreas |
| R11 ⚠️ | Defaults devueltos | Copia nueva, nunca la constante compartida (`not.toBe(DEFAULT_SETTINGS)`) |

### 8.2 Stores de signals

| ID | Escenario | Resultado esperado |
|---|---|---|
| S1 | Carga inicial con datos | El estado refleja lo persistido |
| S2 | Carga inicial con repositorio vacío | El contrato final: colección vacía o `DEFAULT_SETTINGS`. Nunca datos de demo (§4) |
| S3 ⚠️ | Carga inicial con error | Estado seguro + error reportado; nunca un error no manejado |
| S4 | La carga no escribe | `save`/`update` no se llaman al iniciar |
| S5 | Cada mutación pública, camino feliz | Estado correcto **y** persistido: `repository.snapshot()` igual al estado, una sola escritura |
| S6 ⚠️ | ID inexistente (`toggle`, `delete`, `update`…) | Estado y storage sin cambios, sin lanzar |
| S7 ⚠️ | Colección vacía | Las mutaciones no rompen; borrar el último deja `[]` (no reactiva fallbacks) |
| S8 | Orden | Actualizar conserva la posición; crear añade al inicio (posición 0, mayor prioridad) |
| S9 ⚠️ | Inmutabilidad y reactividad | Nueva referencia en cada cambio; el valor anterior intacto; los `computed` recalculan (§6) |
| S10 ⚠️ | Constantes de contrato compartidas | `DEFAULT_SETTINGS` no se muta (comparar con una copia previa) |
| S11 ⚠️ | Fallo de persistencia en una mutación | **Rollback** al estado previo + error reportado (arquitectura §4) |
| S12 | Efectos laterales (Transloco, toast) | Ocurren cuando corresponde **y no ocurren** cuando no (test positivo y negativo) |
| S13 | Mutación vacía / no-op (`patch({})`) | Estado igual |
| S14 | Cambios desde otro contexto (`chrome.storage.onChanged`) | El estado se actualiza (cuando el store escuche `onChanged`) |
| S15 | Dos mutaciones seguidas antes de que resuelva la persistencia | El estado final y lo persistido coinciden (cuando los repositorios sean asíncronos) |

### 8.3 Componentes dumb

Además de las listas (L1–L7) y los formularios (F1–F5) de la §7:

| ID | Escenario |
|---|---|
| D1 | Render de cada variante relevante de los inputs (`it.each`), verificado por contenido y atributos semánticos |
| D2 ⚠️ | Inputs límite: lista vacía, string vacío o muy largo, opcionales ausentes |
| D3 | Cada `output()` emite con el payload exacto; no emite si el control está deshabilitado |
| D4 | No muta los objetos recibidos por `input()` |
| D5 | Los textos salen de Transloco: se buscan con `translate(key)` |

### 8.4 Componentes smart

| ID | Escenario |
|---|---|
| M1 | Store real + repositorio en memoria; los asserts solo miran el DOM (§7) |
| M2 | Estado vacío y estado de error del store reflejados en la vista |
| M3 ⚠️ | Cada acción del usuario (borrar, activar, editar) se refleja en el DOM sobre **el elemento correcto**, sin tocar los demás |
| M4 ⚠️ | Orquestación de diálogo: abrir el editor, completar el formulario y guardar refleja la regla creada o editada en el DOM de la lista sin recargar |
| M5 | Sincronización de pestaña activa: al seleccionar una pestaña de filtro (params, headers, mock…) y pulsar "Nueva regla", el diálogo se abre directamente en esa pestaña de acción |

### 8.5 `engine/` (funciones puras)

| ID | Escenario |
|---|---|
| E1 | Sin TestBed ni Angular: se importa y se llama |
| E2 | Tablas `it.each` con entradas límite: cadenas vacías, comodines al inicio/fin, caracteres especiales y unicode, límites de DNR |
| E3 | Entradas inválidas devuelven el error tipado esperado, no lanzan (salvo que el contrato diga lo contrario) |
| E4 | Snapshots (`toMatchSnapshot`) **solo** para la salida del compilador DNR con fixtures (roadmap, fase 2). Prohibidos en DOM |

---

## 9. Asserts

| Usar | En lugar de | Motivo |
|---|---|---|
| `toEqual(valorCompleto)` | `toBeDefined()`, `toBeTruthy()`, `length > 0` | Un valor incorrecto pero definido pasa |
| `toHaveBeenCalledExactlyOnceWith(args)` | `toHaveBeenCalled()` | Verifica argumentos y número de llamadas |
| `repository.snapshot()` / `chromeFake…snapshot()` | Contar llamadas a `save`/`set` | Se prueba qué quedó persistido, no cómo |
| `expect(x).not.toHaveBeenCalled()` | Omitir el caso negativo | S12, R9 |
| `toBe` | `toEqual` | Solo para primitivos o identidad de referencia (S9, R11) |
| `rejects.toThrow('mensaje')` | `try/catch` con `expect` dentro | Un `try` sin fallo pasa en silencio |

- `expect.objectContaining` solo cuando el objeto completo es irrelevante o no determinista; si se conoce entero, se compara entero.
- Las llamadas a espías se verifican **solo** cuando la llamada misma es el contrato (no escribir si la lectura falla, activar el idioma en Transloco). En el resto, se verifica el estado resultante.

---

## 10. Defectos conocidos: `it.fails` e `it.todo`

Si un caso obligatorio de la §8 no se cumple por un defecto del **código de producción**:

- **NO DEBE** adaptarse el assert al comportamiento incorrecto ni omitirse el caso.
- `it.fails('<comportamiento correcto>', …)` cuando el test puede ejecutarse sin efectos colaterales. Pasa mientras el bug exista y **se pone rojo cuando se arregla**, obligando a cambiarlo a `it`. Va precedido de un comentario `// BUG: <qué falla y por qué>`, o `// PENDING: <qué comportamiento temporal lo impide>` si la causa es código de demo planificado para eliminarse.
- `it.todo('<comportamiento correcto>')` cuando ejecutarlo dejaría errores no manejados (por ejemplo, una suscripción RxJS sin manejador de error) o el contrato aún no está implementado. Va precedido de un comentario con la causa.
- **Prohibido** hacer commit de `.only` o `.skip`.

Estado actual:

Ninguno. (El último, el rollback de `SettingsStore.patch()`, se resolvió al aplicar D11 en los stores.)

Al corregir un defecto se actualiza esta tabla en el mismo commit.

---

## 11. Plantillas

### Repositorio sobre `chrome.storage`

```ts
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { STORAGE_KEYS } from '@engine/storage';
import { installChromeFake } from '@testing/chrome';
import { buildRules } from '@testing/fixtures';

import { ChromeStorageRuleRepository } from './chrome-storage-rule.repository';

describe('ChromeStorageRuleRepository', () => {
  function setup() {
    const chromeFake = installChromeFake();
    TestBed.configureTestingModule({ providers: [ChromeStorageRuleRepository] });
    return { chromeFake, repository: TestBed.inject(ChromeStorageRuleRepository) };
  }

  describe('load()', () => {
    it('returns an empty array when the key was never written', async () => {
      const { repository } = setup();

      expect(await firstValueFrom(repository.load())).toEqual([]);
    });

    it('propagates storage errors', async () => {
      const { chromeFake, repository } = setup();
      chromeFake.storage.local.get.mockRejectedValueOnce(new Error('storage unavailable'));

      await expect(firstValueFrom(repository.load())).rejects.toThrow('storage unavailable');
    });
  });
});
```

### Store de signals

```ts
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, throwError } from 'rxjs';
import { RuleRepository } from '@core/persistence';
import { Rule } from '@engine/models';
import { buildRules } from '@testing/fixtures';
import { InMemoryRuleRepository } from '@testing/repositories';

import { RuleStore } from './rule.store';

describe('RuleStore', () => {
  function setup({ stored = buildRules(3) }: { stored?: Rule[] } = {}) {
    const repository = new InMemoryRuleRepository(stored);
    TestBed.configureTestingModule({
      providers: [{ provide: RuleRepository, useValue: repository }],
    });
    return { repository, store: TestBed.inject(RuleStore) };
  }

  // Mutations are cold Observables: the test subscribes (firstValueFrom) like a consumer would.
  describe('remove()', () => {
    it('keeps state and storage unchanged when the id does not exist', async () => {
      const { repository, store } = setup({ stored: buildRules(2) });

      await firstValueFrom(store.remove('missing-id'));

      expect(store.rules()).toEqual(buildRules(2));
      expect(repository.snapshot()).toEqual(buildRules(2));
    });

    it('reverts the optimistic delete and re-throws when persistence fails', async () => {
      const { repository, store } = setup({ stored: buildRules(2) });
      repository.save.mockReturnValueOnce(throwError(() => new Error('quota')));

      await expect(firstValueFrom(store.remove('rule-1'))).rejects.toThrow('quota');

      expect(store.rules()).toEqual(buildRules(2));
    });
  });
});
```

### Componente con lista editable y output

```ts
import { inputBinding, outputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Rule } from '@engine/models';
import { render, Rendered } from '@testing/dom';
import { buildRule } from '@testing/fixtures';
import { translate, translocoTestingModule } from '@testing/transloco';

import { RulesModule } from '../../rules.module';
import { RuleEditorDialogComponent } from './rule-editor-dialog.component';

// ruleWithHeaders(keys): builder local del spec, construido sobre buildRule() y buildRuleActions().
describe('RuleEditorDialogComponent', () => {
  async function setup({ rule = buildRule() }: { rule?: Rule | null } = {}) {
    const saved = vi.fn<(rule: Rule) => void>();
    TestBed.configureTestingModule({ imports: [RulesModule, translocoTestingModule()] });
    const rendered = await render(RuleEditorDialogComponent, {
      bindings: [inputBinding('rule', () => rule), outputBinding('save', saved)],
    });
    return { ...rendered, saved };
  }

  function headerKeys({ view }: Rendered<RuleEditorDialogComponent>): string[] {
    return view
      .queryAllByPlaceholderText(translate('rules.editor.headers.namePlaceholder'))
      .map((input) => (input as HTMLInputElement).value);
  }

  it('removes only the middle row when removing a middle header', async () => {
    const rendered = await setup({ rule: ruleWithHeaders(['X-One', 'X-Two', 'X-Three']) });
    await rendered.click(rendered.view.getByRole('button', { name: translate('rules.editor.tabs.headers') }));

    const removeButtons = rendered.view.getAllByRole('button', { name: translate('rules.editor.headers.remove') });
    await rendered.click(removeButtons[1]);

    expect(headerKeys(rendered)).toEqual(['X-One', 'X-Three']);
  });
});
```

---

## 12. Checklist de revisión

Antes de dar por terminado un spec (persona o IA):

- [ ] Hay `setup()`; no hay `let` compartidos para el sujeto bajo prueba.
- [ ] Ningún `any`, `as any` ni `ReturnType<typeof vi.fn>`; todos los `vi.fn` están tipados.
- [ ] Ninguna asignación ni `delete` sobre `globalThis`/`window`; Chrome solo vía `installChromeFake()` o `vi.stubGlobal`.
- [ ] Fixtures con builders de `@testing/fixtures`; ningún literal de dominio duplicado.
- [ ] Ningún test valida ni importa datos de demo (`MOCK_RULES`…), ni prueba API exclusiva de la demo (`resetToMocks()`).
- [ ] Cada punto aplicable de la §8 tiene su test; los defectos están como `it.fails`/`it.todo` con comentario y en la tabla de la §10.
- [ ] Asserts sobre valores completos y estado persistido; casos negativos incluidos.
- [ ] Sin `fakeAsync`, `done`, `setTimeout`, `.only` ni `.skip`.
- [ ] Componentes: montados con `render()`; elementos buscados por rol, label, placeholder o texto traducido con `translate()`; ninguna clase CSS ni selector estructural en queries o asserts.
- [ ] Componentes: interacción solo con `click/type/clear/selectOption`; ninguna llamada a métodos del componente ni lectura de su estado interno.
- [ ] Listas: primera, del medio y última eliminadas en tests separados (L3), más eliminaciones consecutivas (L4).
- [ ] Sin salida en consola durante la ejecución.
- [ ] `npx ng test --watch=false` y `npx tsc -p tsconfig.spec.json --noEmit` en verde.

---

## 13. Tests e2e (Playwright)

Los tests unitarios corren en jsdom, donde `chrome.declarativeNetRequest` no existe. Lo que depende del comportamiento real de Chrome se prueba con Playwright en Chromium, con la extensión de `dist/` cargada.

```bash
npx playwright install chromium   # una vez (Chromium completo: el headless shell no carga extensiones)
npm run test:e2e                  # build:dev + playwright test
npx playwright test --repeat-each=3   # tras tocar el harness, para descartar inestabilidad
```

| Carpeta | Qué prueba | Reglas DNR |
|---|---|---|
| [`e2e/spikes/`](../e2e/spikes/) | Hechos de la plataforma que justifican decisiones del compilador (roadmap, spikes de la fase 2) | Escritas a mano |
| [`e2e/engine/`](../e2e/engine/) | La salida de `compileRulesToDnr` aplicada en Chrome | Generadas por el compilador |

**Harness** ([`e2e/support/`](../e2e/support/)):
- Tres servidores HTTP locales que registran cada petición: `app` (origen de la página, `http://app.test:<port>`), `api` (API interceptada, `http://api.test:<port>`) y `target` (destino, `http://localhost:<port>`). Los hosts `*.test` se resuelven a `127.0.0.1` con `--host-resolver-rules`.
- Fixtures: `dnr.apply()` / `dnr.compileAndApply()` reemplazan las reglas dinámicas desde el service worker; `fetchFromApp()` lanza un `fetch` desde una página del origen `app`; `launchWithExtension()` abre un navegador aparte con flags extra.
- Se verifica **lo que recibió el servidor** (URL, método, headers), no la respuesta: una petición puede llegar aunque CORS impida leerla.

Reglas:
- Archivos `*.e2e.ts`; fuera de `src/` para que `ng test` no los recoja.
- Esperar con `expect.poll()` sobre lo registrado por los servidores; nunca con `setTimeout`.
- Un test de `e2e/spikes/` que falle significa que **Chrome cambió**: se revisa la decisión correspondiente del roadmap antes de tocar el test.
- Todo cambio en `engine/dnr/` DEBE tener su escenario en `e2e/engine/`.
