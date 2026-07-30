import fs from "node:fs";
import assert from "node:assert/strict";

const editorial=fs.readFileSync(new URL("../src/css/editorial.css",import.meta.url),"utf8");
assert.match(editorial,/Helvetica Neue/);
assert.match(editorial,/text-align: left/);
assert.match(editorial,/max-width: 680px/);
assert.doesNotMatch(editorial,/float: left/);

const siteCss=fs.readFileSync(new URL("../src/css/site.css",import.meta.url),"utf8");
assert.match(siteCss,/rgba\(0, 0, 0, \.64\)/);
assert.match(siteCss,/backdrop-filter: blur\(8px\)/);
assert.match(siteCss,/\.hotspot-icon svg/);
assert.match(siteCss,/@keyframes hotspot-enter/);
assert.match(siteCss,/border-color: var\(--gold\)/);

const hotspots=JSON.parse(fs.readFileSync(new URL("../src/data/hotspots.json",import.meta.url),"utf8"));
assert.equal(hotspots.length,8);
for(const hotspot of hotspots){
  assert.equal(typeof hotspot.icon,"string");
  assert.ok(hotspot.icon.length>0);
}

const viewer=fs.readFileSync(new URL("../src/js/viewer.js",import.meta.url),"utf8");
assert.match(viewer,/function hotspotIcon/);
assert.match(viewer,/hotspot-icon/);
assert.match(viewer,/hotspot-arrow/);

console.log("Pruebas superadas: Helvetica, alineación izquierda, etiquetas e iconos de hotspots.");
