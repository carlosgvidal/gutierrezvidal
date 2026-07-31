import fs from "node:fs";
import assert from "node:assert/strict";

const panel=fs.readFileSync(new URL("../editor/index.html",import.meta.url),"utf8");
assert.match(panel,/Cargar ZIP inicial/);
assert.match(panel,/Exportar ZIP actualizado/);
assert.match(panel,/workspace\.js/);
assert.match(panel,/panel\.js/);

const workspace=fs.readFileSync(new URL("../editor/workspace.js",import.meta.url),"utf8");
assert.match(workspace,/indexedDB\.open/);
assert.match(workspace,/importZip/);
assert.match(workspace,/loadWorkspace/);
assert.match(workspace,/saveWorkspace/);
assert.match(workspace,/exportWorkspace/);
assert.match(workspace,/type: "arraybuffer"/);

const content=fs.readFileSync(new URL("../editor/content.html",import.meta.url),"utf8");
assert.doesNotMatch(content,/id="site-zip"/);
assert.match(content,/Guardar en el archivo de trabajo/);
assert.match(content,/workspace\.js/);

const editor=fs.readFileSync(new URL("../editor/editor.js",import.meta.url),"utf8");
assert.match(editor,/GVWorkspace\.loadWorkspace/);
assert.match(editor,/GVWorkspace\.saveWorkspace/);
assert.doesNotMatch(editor,/generateAsync\(\{type:"blob"/);

const hotspots=fs.readFileSync(new URL("../editor/hotspots.js",import.meta.url),"utf8");
assert.match(hotspots,/GVWorkspace\.loadWorkspace/);
assert.match(hotspots,/src\/data\/hotspots\.json/);
assert.match(hotspots,/GVWorkspace\.saveWorkspace/);
assert.doesNotMatch(hotspots,/anchor\.download = "hotspots\.json"/);

console.log("Pruebas superadas: ZIP importado una vez, espacio persistente y módulos sobre el mismo archivo.");
