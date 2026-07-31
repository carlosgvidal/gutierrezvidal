import fs from "node:fs";
import assert from "node:assert/strict";

const panel=fs.readFileSync(new URL("../editor/index.html",import.meta.url),"utf8");
assert.match(panel,/Paquete de actualización/);
assert.match(panel,/Descargar actualización ZIP/);
assert.match(panel,/workspace\.js/);
assert.match(panel,/panel\.js/);

const workspace=fs.readFileSync(new URL("../editor/workspace.js",import.meta.url),"utf8");
assert.match(workspace,/indexedDB\.open/);
assert.match(workspace,/savePatch/);
assert.match(workspace,/exportPatchZip/);
assert.match(workspace,/type:\s*"blob"/);
assert.doesNotMatch(workspace,/importZip/);

const content=fs.readFileSync(new URL("../editor/content.html",import.meta.url),"utf8");
assert.match(content,/Guardar en la actualización/);
assert.match(content,/workspace\.js/);

console.log("Pruebas superadas: parches persistentes y exportación parcial.");
