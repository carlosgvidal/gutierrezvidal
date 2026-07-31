import fs from 'node:fs';
import assert from 'node:assert/strict';

const js = fs.readFileSync(new URL('../editor/editor.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../editor/content.html', import.meta.url), 'utf8');
const workspace = fs.readFileSync(new URL('../editor/workspace.js', import.meta.url), 'utf8');
const originalHome = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /id="site-tree"/);
assert.match(html, /id="home-panel"/);
assert.match(html, /contenteditable="true"/);
assert.match(html, /id="insert-image"/);
assert.match(js, /parts\.slice\(0, -1\)\.join\("\/"\)/, 'La carpeta debe conservar sus diagonales.');
assert.match(js, /function updateExistingPage\(data\)/, 'La edición debe parchear la página existente.');
assert.match(js, /new DOMParser\(\)\.parseFromString\(loadedSource/, 'Debe partir del HTML publicado, no regenerarlo desde cero.');
assert.match(js, /allowedTags/);
assert.match(js, /isSafeUrl/);
assert.match(js, /public\/images\//);
assert.match(workspace, /value instanceof Blob/);
assert.match(workspace, /zip\.file\(path,files\[path\]\)/);
assert.match(originalHome, /id="viewer"/);
assert.match(originalHome, /viewer-v2\.2\.js/);

console.log('Pruebas superadas: regresiones críticas de v3.5 corregidas.');
