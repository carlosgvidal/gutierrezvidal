import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const html=readFileSync("editor/content.html","utf8");
const js=readFileSync("editor/editor.js","utf8");
const css=readFileSync("editor/editor.css","utf8");

test("incluye explorador y editor de portada",()=>{
  assert.match(html,/id="site-tree"/);
  assert.match(html,/id="home-form"/);
  assert.match(js,/loadHomepage/);
  assert.match(js,/savePatch\("index\.html"/);
});

test("incluye edición enriquecida controlada",()=>{
  assert.match(html,/contenteditable="true"/);
  assert.match(html,/data-command="smallcaps"/);
  assert.match(js,/allowedTags/);
  assert.match(css,/\.small-caps/);
});

test("guarda imágenes en carpeta única",()=>{
  assert.match(js,/public\/images\//);
  assert.match(js,/savePatch\(path, file\)/);
  assert.ok(existsSync("public/images/.gitkeep"));
});
