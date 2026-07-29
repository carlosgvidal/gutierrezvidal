import fs from "node:fs";
import assert from "node:assert/strict";

const pages=["escritura.html","blog.html","sonido.html","sistema.html","materia.html","imagenes.html","archivo.html","perfil.html"];
for(const page of pages){
  const html=fs.readFileSync(new URL(`../${page}`,import.meta.url),"utf8");
  assert.match(html,/data-shared-header/);
  assert.match(html,/data-shared-footer/);
  assert.match(html,/src\/js\/shared-shell\.js/);
  assert.match(html,new RegExp(`data-page="${page}"`));
}

const shell=fs.readFileSync(new URL("../src/js/shared-shell.js",import.meta.url),"utf8");
assert.match(shell,/logo-mark\.png/);
assert.match(shell,/renderHeader/);
assert.match(shell,/renderFooter/);
assert.match(shell,/navigationItems/);

const css=fs.readFileSync(new URL("../src/css/editorial.css",import.meta.url),"utf8");
assert.match(css,/\.mag-header/);
assert.match(css,/\.mag-footer/);
assert.match(css,/\.mag-logo/);
assert.match(css,/\.article-meta/);
assert.match(css,/\.subpage-index/);

for(const template of ["plantilla-entrada-blog.html","plantilla-subpagina.html","templates/entrada-blog.html","templates/subpagina.html"]){
  const html=fs.readFileSync(new URL(`../${template}`,import.meta.url),"utf8");
  assert.match(html,/data-shared-header/);
  assert.match(html,/data-shared-footer/);
  assert.match(html,/shared-shell\.js/);
}

assert.ok(fs.existsSync(new URL("../public/assets/logo-mark.png",import.meta.url)));

console.log("Pruebas superadas: shell compartido, logo, CSS y plantillas.");
