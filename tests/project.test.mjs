import fs from "node:fs";
import assert from "node:assert/strict";

const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(index,/site-v1\.9\.css/);
assert.match(index,/viewer-v1\.9\.js/);
assert.match(index,/site-shell-v1\.9\.js/);
assert.match(index,/class="visually-hidden" hidden/);

const css=fs.readFileSync(new URL("../src/css/site-v1.9.css",import.meta.url),"utf8");
assert.doesNotMatch(css,/@import/);
assert.match(css,/--gutter: clamp\(24px, 4\.2vw, 68px\)/);
assert.match(css,/padding-left: var\(--gutter\)/);
assert.match(css,/\[hidden\],[\s\S]*display: none !important/);
assert.match(css,/@media \(max-width: 900px\)/);

const interior=fs.readFileSync(new URL("../escritura.html",import.meta.url),"utf8");
assert.match(interior,/site-v1\.9\.css/);
assert.match(interior,/site-shell-v1\.9\.js/);

console.log("Pruebas superadas: CSS consolidado, recursos versionados y márgenes responsivos.");
