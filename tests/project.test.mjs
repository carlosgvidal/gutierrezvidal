import fs from "node:fs";
import assert from "node:assert/strict";

const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
for(const pattern of [
  /<title>Carlos Adolfo Gutiérrez Vidal \| Poeta y artista indisciplinario<\/title>/,
  /rel="canonical" href="https:\/\/www\.gutierrezvidal\.com\/"/,
  /property="og:title"/,
  /name="twitter:card" content="summary_large_image"/,
  /application\/ld\+json/,
  /<h1 id="site-identity"/,
  /Poeta · Artista indisciplinario · Investigador/,
  /site-v2\.0\.css/
]) assert.match(index,pattern);

assert.ok(fs.existsSync(new URL("../robots.txt",import.meta.url)));
assert.ok(fs.existsSync(new URL("../sitemap.xml",import.meta.url)));
assert.ok(fs.existsSync(new URL("../site.webmanifest",import.meta.url)));
assert.ok(fs.existsSync(new URL("../public/assets/favicon.ico",import.meta.url)));
assert.ok(fs.existsSync(new URL("../public/assets/og-home.jpg",import.meta.url)));

const book=fs.readFileSync(new URL("../obra/escritura/omisiones.html",import.meta.url),"utf8");
assert.match(book,/"@type":"Book"/);
assert.match(book,/rel="canonical"/);

const album=fs.readFileSync(new URL("../obra/sonido/love-wasnt-there.html",import.meta.url),"utf8");
assert.match(album,/"@type":"MusicAlbum"/);

const sitemap=fs.readFileSync(new URL("../sitemap.xml",import.meta.url),"utf8");
assert.match(sitemap,/gutierrezvidal\.com\/obra\/escritura\/omisiones\.html/);

console.log("Pruebas superadas: metadatos, Open Graph, JSON-LD, sitemap, robots y favicons.");
