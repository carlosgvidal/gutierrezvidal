import fs from "node:fs";
import assert from "node:assert/strict";

const html=fs.readFileSync(new URL("../editor/content.html",import.meta.url),"utf8");
for(const id of ["hero-image-file","hero-image-alt","aside-image-file","aside-image-alt"]){
  assert.match(html,new RegExp(`id="${id}"`));
}

const js=fs.readFileSync(new URL("../editor/editor.js",import.meta.url),"utf8");
assert.doesNotMatch(js,/image\.src = `\/\$\{path\}`/);
assert.match(js,/data-site-path/);
assert.match(js,/rootFor\(pagePath\)/);
assert.match(js,/mediaFigureHTML\("hero"/);
assert.match(js,/mediaFigureHTML\("aside"/);
assert.match(js,/applyMediaToDocument/);
assert.match(js,/extractMedia\(doc, "\.page-hero", "hero"\)/);
assert.match(js,/extractMedia\(doc, "\.page-aside figure", "aside"\)/);
assert.match(js,/absoluteImageURL/);

const css=fs.readFileSync(new URL("../src/css/site-v2.2.css",import.meta.url),"utf8");
assert.match(css,/\.page-hero/);
assert.match(css,/\.page-content-grid/);
assert.match(css,/\.page-aside/);

console.log("Pruebas superadas: rutas relativas, imagen hero e imagen lateral.");
