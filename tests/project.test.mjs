import fs from "node:fs";
import assert from "node:assert/strict";

const hotspots=JSON.parse(fs.readFileSync(new URL("../src/data/hotspots.json",import.meta.url),"utf8"));
assert.equal(hotspots.length,8);
for(const label of ["Escritura","Blog","Sonido","Sistema","Materia","Imágenes","Archivo","Perfil"]){
  assert.ok(hotspots.some(h=>h.label===label),`Falta ${label}`);
}
for(const h of hotspots){
  assert.ok(fs.existsSync(new URL(`../${h.url}`,import.meta.url)),`No existe ${h.url}`);
  assert.ok(Number.isInteger(h.imageX)&&h.imageX>=0&&h.imageX<=1774);
  assert.ok(Number.isInteger(h.imageY)&&h.imageY>=0&&h.imageY<=887);
}

const editorial=fs.readFileSync(new URL("../src/css/editorial.css",import.meta.url),"utf8");
for(const color of ["#FAF9F6","#F5EBD7","#C4A265","#B8B5C3","#000000"]){
  assert.match(editorial,new RegExp(color.replace("#","\\#"),"i"));
}
assert.match(editorial,/\.site-nav/);
assert.match(editorial,/\.page-footer/);

const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(index,/home-header/);
assert.match(index,/home-footer/);
assert.match(index,/imagenes\.html/);
assert.match(index,/archivo\.html/);

for(const page of ["escritura.html","blog.html","sonido.html","sistema.html","materia.html","imagenes.html","archivo.html","perfil.html"]){
  const html=fs.readFileSync(new URL(`../${page}`,import.meta.url),"utf8");
  assert.match(html,/site-nav/);
  assert.match(html,/page-footer/);
  assert.match(html,/Carlos Adolfo Gutiérrez Vidal/);
}

const editor=fs.readFileSync(new URL("../editor-simple.html",import.meta.url),"utf8");
assert.match(editor,/"label": "Imágenes"/);
assert.match(editor,/"label": "Archivo"/);

console.log("Pruebas superadas: paleta, hotspots, navegación, páginas, header y footer.");
