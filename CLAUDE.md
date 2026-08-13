# Constanza Cuenta

Landing page de audiocuentos narrados por Constanza Zerdán. Se publica sola
en Vercel al hacer push a `origin/main` — no hay pasos de build, son archivos
HTML estáticos.

## Archivos

- **`index.html`** — la versión activa en producción. Es la única que hay
  que editar cuando se pide un cambio en "la página".
- **`opcion-2.html`** y **`opcion-3.html`** — propuestas de diseño alternativas
  que se descartaron. No tocarlas salvo pedido explícito del usuario.

## Cómo está armado index.html

Cada tarjeta de cuento lleva su miniatura incrustada como imagen en base64
dentro del `src`, así que varias líneas del archivo tienen decenas de miles
de caracteres. Por eso:

- El `Read` estándar falla por límite de tokens en este archivo. Para
  inspeccionar una porción puntual, usar PowerShell:
  `(Get-Content index.html)[N..M] | ForEach-Object { $_.Substring(0, [Math]::Min($_.Length,300)) }`
  o `Grep` para ubicar líneas por patrón.
- Para editar, preferir un script de Node (vía Bash) que haga reemplazos de
  texto programáticos, en vez de `Edit` a mano sobre líneas gigantes.

El sitio tiene dos lugares donde vive cada cuento y hay que mantenerlos
sincronizados:

1. El carrusel manual del hero (`#fanTrack`, tarjetas `.fan-card`) — clickeable,
   con flechas prev/next y swipe táctil, `data-index` correlativo. El script
   del carrusel ya soporta cualquier cantidad de tarjetas sin tocarlo.
2. La grilla "Los cuentos" (`.gallery`, tarjetas `.cover-card`) — con más
   texto: autor, título, descripción.

Ambas apuntan al mismo link de YouTube. El contador de texto
`"N por ahora, van a ir sumándose más"` debe reflejar el total de cuentos.

## Skill del proyecto

`.claude/skills/agregar-cuento/` automatiza todo el flujo de sumar un nuevo
audiocuento a partir de una URL de YouTube (sacar título/autor, bajar
thumbnail, insertar ambas tarjetas, actualizar el contador). Incluye un
script Node (`scripts/add-cuento.js`) probado que hace la inserción sin
tocar el archivo a mano.

## Preview local

`.claude/launch.json` define un servidor estático (`npx http-server`) para
previsualizar el sitio en el Browser pane — abrir archivos `file://` grandes
directamente puede fallar. Usar `preview_start` con `{"name": "static"}`.

## Convenciones al trabajar en este proyecto

(Las reglas generales de confirmación antes de pushear/descargar están en el
CLAUDE.md global del usuario — acá solo lo específico de este repo.)

- Antes de dar un cambio visual por terminado, previsualizarlo en el Browser
  pane (no asumir que el HTML/CSS quedó bien solo por haber editado el texto).
- El tono de los textos de la página es cálido y personal (mirá la sección
  "Quién cuenta" / "Por qué lo hago" como referencia de voz) — evitar un tono
  corporativo o de producto al redactar copy nuevo.
