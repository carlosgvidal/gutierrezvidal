import fs from "node:fs";
import assert from "node:assert/strict";

const nav=JSON.parse(fs.readFileSync(new URL("../src/data/navigation.json",import.meta.url),"utf8"));
assert.ok(nav.some(x=>x.label==="Obra"));
assert.ok(nav.some(x=>x.label==="Tienda"));

const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(index,/panorama-section/);
assert.match(index,/testimonials/);
assert.doesNotMatch(index,/id="identity"/);
assert.match(index,/data-site-header/);
assert.match(index,/data-site-footer/);

const viewer=fs.readFileSync(new URL("../src/js/viewer.js",import.meta.url),"utf8");
assert.match(viewer,/PerspectiveCamera\(76/);
assert.match(viewer,/ResizeObserver/);
assert.match(viewer,/enableZoom=false/);

const shell=fs.readFileSync(new URL("../src/js/site-shell.js",import.meta.url),"utf8");
assert.match(shell,/navigation\.json/);
assert.match(shell,/site-drawer/);
assert.match(shell,/© 2026/);

assert.ok(fs.existsSync(new URL("../public/assets/logo-dark.png",import.meta.url)));
assert.ok(fs.existsSync(new URL("../public/assets/logo-light.png",import.meta.url)));

const books=["omisiones","bordos","perlas","toros"];
for(const slug of books){
  assert.ok(fs.existsSync(new URL(`../obra/escritura/${slug}.html`,import.meta.url)));
}
assert.ok(fs.existsSync(new URL("../obra/sonido/love-wasnt-there.html",import.meta.url)));

assert.ok(!fs.existsSync(new URL("../admin",import.meta.url)));
assert.ok(!fs.existsSync(new URL("../content",import.meta.url)));

console.log("Pruebas superadas: sitio estático, navegación jerárquica, panorama, logo y testimoniales.");
