import fs from "node:fs";
import assert from "node:assert/strict";

const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(index,/site-v2\.2\.css/);
assert.match(index,/viewer-v2\.2\.js/);

const viewer=fs.readFileSync(new URL("../src/js/viewer-v2.2.js",import.meta.url),"utf8");
assert.match(viewer,/INITIAL_VIEW=\{imageX:890,imageY:445\}/);

const css=fs.readFileSync(new URL("../src/css/site-v2.2.css",import.meta.url),"utf8");
const v22=css.slice(css.lastIndexOf("/* v2.2"));
assert.match(v22,/\.practice-statement,\s*\.testimonials\s*\{/);
assert.match(v22,/width: min\(100%, var\(--max\)\)/);
assert.match(v22,/\.practice-statement__axes,\s*\.testimonials-grid\s*\{/);
assert.match(v22,/grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(v22,/border-left: 1px solid var\(--ink\)/);
assert.match(v22,/\.testimonial:first-child\s*\{[\s\S]*grid-column: auto;[\s\S]*grid-row: auto;/);
assert.doesNotMatch(v22,/grid-row:\s*span/);
assert.doesNotMatch(v22,/grid-column:\s*span/);

console.log("Pruebas superadas: panorama centrado y retículas unificadas.");
