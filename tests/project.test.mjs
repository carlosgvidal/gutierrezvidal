import fs from "node:fs";
import assert from "node:assert/strict";

assert.ok(fs.existsSync(new URL("../public/assets/logo-dark.png",import.meta.url)));
assert.ok(fs.existsSync(new URL("../public/assets/logo-light.png",import.meta.url)));

const site=JSON.parse(fs.readFileSync(new URL("../content/site.json",import.meta.url),"utf8"));
assert.equal(site.siteTitle,"Carlos Adolfo Gutiérrez Vidal");
assert.ok(Array.isArray(site.navigation)&&site.navigation.length>=9);
assert.equal(site.copyrightYear,2026);

const css=fs.readFileSync(new URL("../src/css/editorial.css",import.meta.url),"utf8");
for(const selector of [".site-header",".site-footer",".site-logo",".page-title",".prose"]){
  assert.ok(css.includes(selector),`Falta ${selector}`);
}
assert.ok(!css.includes("letter-spacing: .16em"));

const cms=fs.readFileSync(new URL("../admin/cms.js",import.meta.url),"utf8");
assert.ok(cms.includes("content/site.json"));
assert.ok(cms.includes("content/pages"));
assert.ok(cms.includes("content/blog"));
assert.ok(cms.includes("api.github.com"));

const workflow=fs.readFileSync(new URL("../.github/workflows/deploy.yml",import.meta.url),"utf8");
assert.ok(workflow.includes("node tools/build.mjs"));

console.log("Pruebas superadas: logo, tipografía, header/footer, CMS y despliegue.");
