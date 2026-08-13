#!/usr/bin/env node
/**
 * Agrega un nuevo audiocuento a index.html (fan-card del carrusel + cover-card
 * de la grilla "Los cuentos") y actualiza el contador de section-sub.
 *
 * Uso:
 *   node add-cuento.js \
 *     --file "C:/Claude_code/Landing_page/index.html" \
 *     --url "https://www.youtube.com/watch?v=XXXXXXXXXXX" \
 *     --img "/path/to/thumb.b64" \
 *     --author "Hermanos Grimm" \
 *     --title "Cenicienta" \
 *     --desc "Una zapatilla de cristal, y lo que la bondad puede lograr contra toda la envidia."
 *
 * --img debe apuntar a un archivo de texto con el thumbnail ya en base64 (sin el prefijo data:...).
 * Genera el nuevo bloque, lo inserta antes del cierre de #fanTrack y de .gallery,
 * y sube en 1 el número del contador "N por ahora, van a ir sumándose más".
 */
const fs = require("fs");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    out[key] = argv[i + 1];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const required = ["file", "url", "img", "author", "title", "desc"];
const missing = required.filter((k) => !args[k]);
if (missing.length) {
  console.error("Faltan argumentos: " + missing.join(", "));
  process.exit(1);
}

const filePath = args.file;
let content = fs.readFileSync(filePath, "utf8");
const b64 = fs.readFileSync(args.img, "utf8").trim();

// --- 1. Contar fan-cards existentes para calcular el próximo data-index ---
const fanCardMatches = content.match(/<a class="fan-card"/g) || [];
const nextIndex = fanCardMatches.length;

// --- 2. Insertar la nueva fan-card antes del cierre de #fanTrack ---
const fanCard = `      <a class="fan-card" href="${args.url}" target="_blank" rel="noopener" data-index="${nextIndex}">
        <img src="data:image/jpeg;base64,${b64}" alt="${args.title}">
      </a>\n`;

const fanTrackCloseRe = /(<div class="fan-track" id="fanTrack">[\s\S]*?)(\n\s*<\/div>\s*\n\s*<button class="fan-arrow fan-arrow-next")/;
if (!fanTrackCloseRe.test(content)) {
  console.error("No encontré el cierre de #fanTrack. Revisá la estructura de index.html a mano.");
  process.exit(1);
}
content = content.replace(fanTrackCloseRe, (m, before, after) => before + "\n" + fanCard.trimEnd() + after);

// --- 3. Insertar la nueva cover-card antes del cierre de .gallery ---
const coverCard = `      <a class="cover-card" href="${args.url}" target="_blank" rel="noopener">
        <div class="cover-img">
          <img src="data:image/jpeg;base64,${b64}" alt="">
          <span class="cover-play"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="11" fill-opacity=".18"/><path d="M10 8l6 4-6 4V8z"/></svg>Escuchar</span>
        </div>
        <div class="cover-body">
          <span class="cover-kicker">${args.author}</span>
          <h3 class="cover-title">${args.title}</h3>
          <p class="cover-desc">${args.desc}</p>
        </div>
      </a>\n`;

const galleryCloseRe = /(<div class="gallery">[\s\S]*?<\/a>\n)(\s*<\/div>\s*\n\s*<p class="next-note">)/;
if (!galleryCloseRe.test(content)) {
  console.error("No encontré el cierre de .gallery. Revisá la estructura de index.html a mano.");
  process.exit(1);
}
content = content.replace(galleryCloseRe, (m, before, after) => before + coverCard + after);

// --- 4. Actualizar el contador "N por ahora, van a ir sumándose más" ---
const counterRe = /(<p class="section-sub">)(\d+)( por ahora, van a ir sumándose más<\/p>)/;
const counterMatch = content.match(counterRe);
if (!counterMatch) {
  console.error("No encontré el contador section-sub. Actualizalo a mano.");
} else {
  const newCount = parseInt(counterMatch[2], 10) + 1;
  content = content.replace(counterRe, `$1${newCount}$3`);
}

fs.writeFileSync(filePath, content, "utf8");
console.log(`Listo. Nueva fan-card con data-index=${nextIndex}. Contador actualizado.`);
