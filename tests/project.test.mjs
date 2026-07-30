import fs from "node:fs";
import assert from "node:assert/strict";

const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(index,/<h1 class="seo-title">Carlos Adolfo Gutiérrez Vidal/);
assert.doesNotMatch(index,/class="site-identity"/);
assert.doesNotMatch(index,/class="site-identity__roles"/);
assert.match(index,/Poeta · Artista indisciplinario · Investigador/);
assert.match(index,/site-v2\.1\.css/);
assert.match(index,/site-shell-v2\.1\.js/);

const css=fs.readFileSync(new URL("../src/css/site-v2.1.css",import.meta.url),"utf8");
assert.match(css,/\.seo-title \{/);
assert.match(css,/clip-path: inset\(50%\)/);
assert.match(css,/\.site-identity,[\s\S]*display: none !important/);
assert.match(css,/grid-template-columns: minmax\(150px, \.55fr\)/);

const shell=fs.readFileSync(new URL("../src/js/site-shell-v2.1.js",import.meta.url),"utf8");
assert.match(shell,/© 2026 · gutierrezvidal\.com/);
assert.doesNotMatch(shell,/© 2026 Carlos Adolfo Gutiérrez Vidal/);

assert.match(index,/property="og:title"/);
assert.match(index,/application\/ld\+json/);
assert.ok(fs.existsSync(new URL("../sitemap.xml",import.meta.url)));
assert.ok(fs.existsSync(new URL("../robots.txt",import.meta.url)));

console.log("Pruebas superadas: nombre visible una sola vez, H1 SEO oculto y portada simplificada.");
