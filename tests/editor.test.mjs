import fs from "node:fs";
import assert from "node:assert/strict";

const html=fs.readFileSync(new URL("../editor/index.html",import.meta.url),"utf8");
assert.match(html,/Generador de contenido/);
assert.match(html,/Página principal/);
assert.match(html,/Subpágina/);
assert.match(html,/Entrada de blog/);
assert.match(html,/Añadir al menú/);
assert.match(html,/Añadir al índice de la sección/);
assert.match(html,/Generar ZIP actualizado/);
assert.match(html,/noindex,nofollow/);

const js=fs.readFileSync(new URL("../editor/editor.js",import.meta.url),"utf8");
assert.match(js,/JSZip\.loadAsync/);
assert.match(js,/src\/data\/navigation\.json/);
assert.match(js,/updateIndex/);
assert.match(js,/updateSitemap/);
assert.match(js,/generateAsync/);
assert.match(js,/BlogPosting/);
assert.match(js,/application\/ld\+json/);
assert.match(js,/node\.children\.push/);

const robots=fs.readFileSync(new URL("../robots.txt",import.meta.url),"utf8");
assert.match(robots,/Disallow: \/editor\//);

console.log("Pruebas superadas: editor local, ZIP, menú, índices, SEO y sitemap.");
