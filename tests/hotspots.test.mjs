import fs from "node:fs";
import assert from "node:assert/strict";

const WIDTH = 1774;
const HEIGHT = 887;
const hotspots = JSON.parse(
  fs.readFileSync(new URL("../src/data/hotspots.json", import.meta.url), "utf8")
);

assert.equal(hotspots.length, 5);

const expected = new Map([
  ["Escritura", [412, 514, "escritura.html"]],
  ["Blog", [1282, 526, "blog.html"]],
  ["Sonido", [690, 467, "sonido.html"]],
  ["Archivo", [1040, 508, "archivo.html"]],
  ["Perfil", [1016, 342, "perfil.html"]]
]);

for (const hotspot of hotspots) {
  assert.ok(expected.has(hotspot.label), `Etiqueta desconocida: ${hotspot.label}`);
  assert.ok(Number.isFinite(hotspot.imageX));
  assert.ok(Number.isFinite(hotspot.imageY));
  assert.ok(hotspot.imageX >= 0 && hotspot.imageX <= WIDTH);
  assert.ok(hotspot.imageY >= 0 && hotspot.imageY <= HEIGHT);

  const [x, y, url] = expected.get(hotspot.label);
  assert.equal(hotspot.imageX, x);
  assert.equal(hotspot.imageY, y);
  assert.equal(hotspot.url, url);
}

const image = fs.readFileSync(
  new URL("../public/panorama/portada.jpg", import.meta.url)
);
assert.ok(image.length > 0);

console.log("Pruebas superadas: hotspots, rutas, coordenadas e imagen.");
