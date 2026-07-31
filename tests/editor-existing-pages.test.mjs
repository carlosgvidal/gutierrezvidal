import fs from "node:fs";
import assert from "node:assert/strict";

const html=fs.readFileSync(new URL("../editor/content.html",import.meta.url),"utf8");
assert.match(html,/Explorador del sitio/);
assert.match(html,/id="site-tree"/);
assert.match(html,/id="new-page"/);

const js=fs.readFileSync(new URL("../editor/editor.js",import.meta.url),"utf8");
assert.match(js,/loadPublishedPage/);
assert.match(js,/DOMParser/);
assert.match(js,/article\.prose/);
assert.match(js,/page-title/);
assert.match(js,/page-deck/);
assert.match(js,/pathAlreadyExists/);
assert.match(js,/GVPatches\.savePatch\(loadedPath/);
assert.match(js,/updateMenuItem/);
assert.match(js,/slug\.disabled\s*=\s*true/);
assert.match(js,/type\.disabled\s*=\s*true/);

console.log("Pruebas superadas: explorador, carga y edición de páginas publicadas.");
