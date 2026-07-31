import fs from "node:fs";
import assert from "node:assert/strict";

const panel=fs.readFileSync(new URL("../editor/index.html",import.meta.url),"utf8");
assert.doesNotMatch(panel,/type="file"/);
assert.doesNotMatch(panel,/Cargar ZIP/);
assert.match(panel,/Descargar actualización ZIP/);

const workspace=fs.readFileSync(new URL("../editor/workspace.js",import.meta.url),"utf8");
assert.match(workspace,/fetch\(`\.\.\/\$\{clean\}/);
assert.match(workspace,/savePatch/);
assert.match(workspace,/exportPatchZip/);
assert.match(workspace,/INSTRUCCIONES\.txt/);
assert.doesNotMatch(workspace,/importZip/);

const content=fs.readFileSync(new URL("../editor/editor.js",import.meta.url),"utf8");
assert.match(content,/GVPatches\.getFile\("src\/data\/navigation\.json"\)/);
assert.match(content,/GVPatches\.savePatch\(d\.path/);
assert.match(content,/GVPatches\.savePatch\("src\/data\/navigation\.json"/);
assert.match(content,/GVPatches\.savePatch\("sitemap\.xml"/);
assert.doesNotMatch(content,/JSZip\.loadAsync/);

const hotspots=fs.readFileSync(new URL("../editor/hotspots.js",import.meta.url),"utf8");
assert.match(hotspots,/GVPatches\.getFile\("src\/data\/hotspots\.json"\)/);
assert.match(hotspots,/GVPatches\.savePatch\("src\/data\/hotspots\.json"/);

console.log("Pruebas superadas: sin importación del sitio y exportación de actualización parcial.");
