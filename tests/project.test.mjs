import fs from "node:fs";
import assert from "node:assert/strict";

const hotspots=JSON.parse(fs.readFileSync(new URL("../src/data/hotspots.json",import.meta.url),"utf8"));
assert.equal(hotspots.length,5);
assert.deepEqual(hotspots.map(item=>item.label),["Escritura","Blog","Sonido","Sistema","Perfil"]);

for(const item of hotspots){
  assert.equal(typeof item.id,"string");
  assert.equal(typeof item.label,"string");
  assert.equal(typeof item.url,"string");
  assert.ok(Number.isInteger(item.imageX)&&item.imageX>=0&&item.imageX<=1774);
  assert.ok(Number.isInteger(item.imageY)&&item.imageY>=0&&item.imageY<=887);
  assert.ok(fs.existsSync(new URL(`../${item.url}`,import.meta.url)));
}

const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(index,/Carlos Adolfo Gutiérrez Vidal/g);
assert.match(index,/name="author" content="Carlos Adolfo Gutiérrez Vidal"/);

const editor=fs.readFileSync(new URL("../editor/editor.js",import.meta.url),"utf8");
assert.match(editor,/POST/);
assert.match(editor,/\/api\/hotspots/);

console.log("Pruebas superadas: estructura, metadatos, páginas y editor de hotspots.");
