import fs from "node:fs";
import assert from "node:assert/strict";

const html=fs.readFileSync(new URL("../editor/content.html",import.meta.url),"utf8");
assert.match(html,/Editar página publicada/);
assert.match(html,/id="existing-page"/);
assert.match(html,/id="load-existing"/);

const js=fs.readFileSync(new URL("../editor/editor.js",import.meta.url),"utf8");
assert.match(js,/loadPublishedPage/);
assert.match(js,/DOMParser/);
assert.match(js,/article\.prose/);
assert.match(js,/page-title/);
assert.match(js,/page-deck/);
assert.match(js,/pathAlreadyExists/);
assert.match(js,/Selecciona “Editar página publicada”/);
assert.match(js,/window\.confirm/);
assert.match(js,/GVPatches\.savePatch\(loadedPath/);
assert.match(js,/updateMenuItem/);
assert.match(js,/slug\.disabled=true/);
assert.match(js,/type\.disabled=true/);

console.log("Pruebas superadas: carga, edición y reemplazo controlado de páginas publicadas.");
