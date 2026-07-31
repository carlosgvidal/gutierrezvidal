import fs from "node:fs";
import assert from "node:assert/strict";

const panel = fs.readFileSync(new URL("../editor/index.html", import.meta.url), "utf8");
assert.match(panel, /href="hotspots\.html"/);
assert.match(panel, /href="content\.html"/);
assert.match(panel, /Editar hotspots/);
assert.match(panel, /Crear contenido/);

const content = fs.readFileSync(new URL("../editor/content.html", import.meta.url), "utf8");
assert.match(content, /id="site-zip"/);
assert.match(content, /id="content-form"/);
assert.match(content, /href="hotspots\.html"/);
assert.match(content, /Generar ZIP actualizado/);

const hotspotHTML = fs.readFileSync(new URL("../editor/hotspots.html", import.meta.url), "utf8");
assert.match(hotspotHTML, /id="hotspot-stage"/);
assert.match(hotspotHTML, /Descargar hotspots\.json/);
assert.match(hotspotHTML, /\.\.\/public\/panorama\/portada\.jpg/);

const hotspotJS = fs.readFileSync(new URL("../editor/hotspots.js", import.meta.url), "utf8");
assert.match(hotspotJS, /fetch\("\.\.\/src\/data\/hotspots\.json"/);
assert.match(hotspotJS, /pointerdown/);
assert.match(hotspotJS, /imageX/);
assert.match(hotspotJS, /imageY/);
assert.match(hotspotJS, /anchor\.download = "hotspots\.json"/);

const hotspots = JSON.parse(fs.readFileSync(new URL("../src/data/hotspots.json", import.meta.url), "utf8"));
assert.ok(Array.isArray(hotspots) && hotspots.length > 0);
for (const item of hotspots) {
  assert.equal(typeof item.label, "string");
  assert.equal(typeof item.imageX, "number");
  assert.equal(typeof item.imageY, "number");
  assert.equal(typeof item.url, "string");
}

console.log(`Pruebas superadas: panel, editor de contenido y ${hotspots.length} hotspots conservados.`);
