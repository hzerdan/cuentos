---
name: agregar-cuento
description: Agrega un nuevo audiocuento a la landing "Constanza Cuenta" (index.html en C:\Claude_code\Landing_page) a partir de una URL de YouTube. Usar esta skill siempre que el usuario comparta un link de YouTube pidiendo sumarlo a la página, diga cosas como "tengo un cuento nuevo para agregar", "subí este audiocuento", o pida actualizar la lista de cuentos / el carrusel del hero. Cubre todo el flujo: sacar título y autor del video, descargar y convertir el thumbnail, insertar las dos tarjetas (grilla y carrusel), actualizar el contador, previsualizar en el navegador y publicar con git push.
---

# Agregar un audiocuento a Constanza Cuenta

Esta skill documenta cómo agregar un nuevo cuento a `index.html`, que es
**la versión activa en producción** (se publica sola en Vercel al hacer push a
`origin/main`). El repo tiene también `opcion-2.html` y `opcion-3.html`, que
son propuestas de diseño descartadas — no las toques salvo que el usuario lo
pida explícitamente.

`index.html` tiene dos lugares donde vive cada cuento, y hay que actualizar
los dos:

1. **El carrusel del hero** (`<div class="fan-track" id="fanTrack">`): tarjetas
   `.fan-card`, todas del mismo tamaño, navegables con flechas y swipe. El
   script del carrusel ya soporta cualquier cantidad de tarjetas sin tocarlo.
2. **La grilla "Los cuentos"** (`<div class="gallery">`): tarjetas
   `.cover-card` con más texto (autor, título, descripción).

Ambas apuntan al mismo link de YouTube y usan la misma imagen de portada.

## Por qué esto no se edita a mano con el editor normal

Cada tarjeta lleva el thumbnail incrustado como imagen en base64 dentro del
`src`, así que las líneas del archivo tienen decenas de miles de caracteres.
Herramientas de lectura línea por línea (el `Read` estándar) fallan por límite
de tokens en este archivo. Por eso todo el proceso se apoya en:

- **PowerShell** `Get-Content ... | Select-Object` + `.Substring(0, N)` para
  inspeccionar visualmente una porción del archivo sin cargarlo entero.
- **`Grep`** para ubicar líneas por patrón sin traer el contenido gigante.
- Un **script de Node** (`scripts/add-cuento.js`, incluido en esta skill) que
  hace la inserción de forma programática con reemplazos de texto, en vez de
  pedirle a un editor que abra y reescriba líneas enormes a mano.

Seguí usando ese mismo patrón: cuanto menos se intente "ver" o "editar a
mano" el archivo completo, más simple y confiable es el proceso.

## Pasos

### 1. Identificar el video

Con la URL de YouTube que te pasó el usuario, usá `WebFetch` para sacar el
título del video. Ejemplo de prompt: *"¿Cuál es el título, autor/fuente y
descripción de este video?"*. Del título normalmente se puede inferir el
autor o la colección (p. ej. "recopilación de los Hnos. Grimm" → autor
`Hermanos Grimm`; "de Oscar Wilde" → autor `Oscar Wilde`). Si no queda claro,
preguntale al usuario en vez de inventar.

Con esa info armá:
- `title`: el nombre del cuento, corto (ej. "Cenicienta").
- `author`: quién lo escribió o la colección de origen (ej. "Hermanos Grimm").
- `desc`: una frase corta en el mismo tono que las demás tarjetas — mirá las
  existentes en `index.html` para calibrar el estilo (evocador, sin spoilers
  grandes, termina sin punto final redundante). Ejemplo real: *"Una zapatilla
  de cristal, y lo que la bondad puede lograr contra toda la envidia."*

### 2. Conseguir el thumbnail (pedir permiso primero)

YouTube expone una miniatura pública en
`https://img.youtube.com/vi/<VIDEO_ID>/hqdefault.jpg`. Descargar un archivo
requiere permiso explícito del usuario en el chat (aunque sea un thumbnail
público) — preguntale antes de bajarlo. Una vez confirmado:

```bash
curl -s "https://img.youtube.com/vi/<VIDEO_ID>/hqdefault.jpg" -o /tmp/thumb.jpg
base64 -w0 /tmp/thumb.jpg > /tmp/thumb.b64
```

(En Windows con Git Bash esto funciona igual; `VIDEO_ID` es el parámetro `v=`
de la URL de YouTube.)

### 3. Insertar las tarjetas con el script incluido

Usá `scripts/add-cuento.js` (Node, sin dependencias) para hacer la inserción.
Se encarga de: calcular el próximo `data-index` del carrusel, insertar la
`fan-card` antes del cierre de `#fanTrack`, insertar la `cover-card` antes del
cierre de `.gallery`, y subir en 1 el contador `"N por ahora, van a ir
sumándose más"`.

```bash
node "C:/Claude_code/Landing_page/.claude/skills/agregar-cuento/scripts/add-cuento.js" \
  --file "C:/Claude_code/Landing_page/index.html" \
  --url "https://www.youtube.com/watch?v=<VIDEO_ID>" \
  --img "/tmp/thumb.b64" \
  --author "Hermanos Grimm" \
  --title "Cenicienta" \
  --desc "Una zapatilla de cristal, y lo que la bondad puede lograr contra toda la envidia."
```

Si el script no encuentra los marcadores esperados (avisa por consola cuál
falló — típicamente porque alguien reordenó el HTML a mano), no fuerces un
reemplazo con Edit sobre líneas gigantes. Mejor: leé la estructura actual con
PowerShell/Grep como se explicó arriba, entendé qué cambió, y ajustá el script
o hacé el reemplazo puntual con Node en una sesión de Bash, replicando el
mismo patrón (buscar el marcador de cierre exacto y reemplazarlo insertando
el bloque nuevo antes).

### 4. Verificar visualmente antes de dar por terminado

Abrí `index.html` en el Browser pane y confirmá:
- El contador dice el número correcto de cuentos.
- La nueva tarjeta aparece en "Los cuentos" con imagen, autor, título y
  descripción legibles.
- El carrusel del hero incluye la nueva tapa y las flechas la muestran bien
  (probá next/prev).
- Un click sobre la tarjeta abre el video de YouTube en una pestaña nueva
  (no navega la página actual — gracias a `target="_blank" rel="noopener"`).

### 5. Publicar

No hagas commit ni push sin que el usuario lo confirme explícitamente en el
chat, aunque ya lo haya aprobado en cuentos anteriores — cada publicación es
una acción visible en el repo remoto y dispara un deploy real en Vercel.
Una vez confirmado:

```bash
cd "C:/Claude_code/Landing_page"
git add index.html
git commit -m "Agrega el audiocuento <Título> a la página"
git push origin main
```

Después de subir, borrá los archivos temporales del thumbnail
(`/tmp/thumb.jpg`, `/tmp/thumb.b64`) si siguen ahí.
