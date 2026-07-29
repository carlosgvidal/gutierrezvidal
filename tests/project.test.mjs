import fs from "node:fs";
import assert from "node:assert/strict";

const pages=["escritura.html","blog.html","sonido.html","sistema.html","materia.html","imagenes.html","archivo.html","perfil.html"];
for(const page of pages){
  const html=fs.readFileSync(new URL(`../${page}`,import.meta.url),"utf8");
  assert.match(html,/mag-header/);
  assert.match(html,/mag-nav/);
  assert.match(html,/mag-footer/);
  assert.match(html,/src\/css\/editorial.css/);
  assert.match(html,/logo-mark\.png/);
  assert.match(html,/Carlos Adolfo Gutiérrez Vidal/);
}

const css=fs.readFileSync(new URL("../src/css/editorial.css",import.meta.url),"utf8");
for(const selector of [".mag-header",".mag-nav",".section-banner",".article-title",".article-body",".mag-footer"]){
  assert.ok(css.includes(selector),`Falta ${selector}`);
}

const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(index,/home-mark/);
assert.match(index,/home-menu-button/);
assert.doesNotMatch(index,/home-header/);
assert.doesNotMatch(index,/home-footer/);

assert.ok(fs.existsSync(new URL("../public/assets/logo-mark.png",import.meta.url)));
assert.ok(fs.existsSync(new URL("../src/js/home-menu.js",import.meta.url)));

const hotspots=JSON.parse(fs.readFileSync(new URL("../src/data/hotspots.json",import.meta.url),"utf8"));
assert.equal(hotspots.length,8);

console.log("Pruebas superadas: CSS editorial, ocho páginas, logo, navegación y home compacto.");
