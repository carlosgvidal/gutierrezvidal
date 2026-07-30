import fs from "node:fs";import assert from "node:assert/strict";
const i=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(i,/practice-statement/);assert.match(i,/Exploro los modos/);assert.doesNotMatch(i,/Fragmentos sobre la obra/);
const e=fs.readFileSync(new URL("../src/css/editorial.css",import.meta.url),"utf8");assert.match(e,/clamp\(20px,2.5vw,30px\)/);
const c=fs.readFileSync(new URL("../src/css/site.css",import.meta.url),"utf8");assert.match(c,/practice-statement__axes/);assert.match(c,/testimonials-header\{display:none\}/);
console.log("Pruebas superadas.");
