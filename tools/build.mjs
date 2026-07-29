import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const DIST=path.join(ROOT,"dist");

function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8"));}
function esc(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function copyDir(src,dst){
  fs.mkdirSync(dst,{recursive:true});
  for(const entry of fs.readdirSync(src,{withFileTypes:true})){
    const from=path.join(src,entry.name);
    const to=path.join(dst,entry.name);
    if(entry.isDirectory()) copyDir(from,to);
    else fs.copyFileSync(from,to);
  }
}

const site=readJson(path.join(ROOT,"content/site.json"));

function nav(current){
  return `<nav class="site-nav" aria-label="Navegación principal"><ul>${site.navigation.map(item=>{
    const active=item.url===current?' aria-current="page"':"";
    return `<li><a href="${esc(item.url)}"${active}>${esc(item.label)}</a></li>`;
  }).join("")}</ul></nav>`;
}

function header(current){
  return `<header class="site-header">
    <div class="site-header__inner">
      <a class="site-logo" href="index.html" aria-label="Inicio"><img src="public/assets/logo-dark.png" alt=""></a>
      <div><p class="site-title">${esc(site.siteTitle)}</p><p class="site-tagline">${esc(site.tagline)}</p></div>
    </div>
    ${nav(current)}
  </header>`;
}

function footer(){
  return `<footer class="site-footer"><div class="site-footer__inner">
    <img class="site-footer__logo" src="public/assets/logo-light.png" alt="">
    <p class="site-footer__name">© ${site.copyrightYear} ${esc(site.siteTitle)}</p>
    <p class="site-footer__meta">${esc(site.tagline)}</p>
  </div></footer>`;
}

function layout({title,description,current,body,bodyClass=""}){
  return `<!doctype html><html lang="es"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="author" content="${esc(site.siteTitle)}">
  <meta name="description" content="${esc(description)}">
  <title>${esc(title)} · ${esc(site.siteTitle)}</title>
  <link rel="stylesheet" href="src/css/editorial.css">
  </head><body class="${bodyClass}">${header(current)}${body}${footer()}</body></html>`;
}

fs.rmSync(DIST,{recursive:true,force:true});
fs.mkdirSync(DIST,{recursive:true});
copyDir(path.join(ROOT,"public"),path.join(DIST,"public"));
copyDir(path.join(ROOT,"src"),path.join(DIST,"src"));

const pagesDir=path.join(ROOT,"content/pages");
for(const file of fs.readdirSync(pagesDir).filter(f=>f.endsWith(".json"))){
  const page=readJson(path.join(pagesDir,file));
  let extra="";
  if(page.slug==="blog"){
    const posts=fs.readdirSync(path.join(ROOT,"content/blog"))
      .filter(f=>f.endsWith(".json"))
      .map(f=>readJson(path.join(ROOT,"content/blog",f)))
      .filter(p=>p.published)
      .sort((a,b)=>b.date.localeCompare(a.date));
    extra=`<ul class="post-list">${posts.map(p=>`<li><h2><a href="blog/${esc(p.slug)}.html">${esc(p.title)}</a></h2><p>${esc(p.description)}</p></li>`).join("")}</ul>`;
  }
  const body=`<main class="page"><header class="page-header">
    <p class="page-kicker">${esc(page.kicker)}</p><h1 class="page-title">${esc(page.title)}</h1>
    <p class="page-deck">${esc(page.deck)}</p><div class="rule"></div></header>
    <article class="prose">${page.body.map(p=>`<p>${esc(p)}</p>`).join("")}</article>${extra}</main>`;
  fs.writeFileSync(path.join(DIST,`${page.slug}.html`),layout({
    title:page.title,description:page.deck,current:`${page.slug}.html`,body
  }));
}

const blogOut=path.join(DIST,"blog");
fs.mkdirSync(blogOut,{recursive:true});
for(const file of fs.readdirSync(path.join(ROOT,"content/blog")).filter(f=>f.endsWith(".json"))){
  const post=readJson(path.join(ROOT,"content/blog",file));
  if(!post.published) continue;
  const body=`<main class="page"><article>
    <header class="page-header"><p class="page-kicker">${esc(post.category)}</p>
    <h1 class="page-title">${esc(post.title)}</h1><p class="page-deck">${esc(post.description)}</p>
    <div class="post-meta"><span>Por ${esc(site.siteTitle)}</span><time datetime="${esc(post.date)}">${esc(post.date)}</time></div>
    <div class="rule"></div></header>
    <div class="prose">${post.body.map(p=>`<p>${esc(p)}</p>`).join("")}</div></article></main>`;
  let html=layout({title:post.title,description:post.description,current:"blog.html",body});
  html=html.replaceAll('href="src/','href="../src/').replaceAll('src="public/','src="../public/').replaceAll('href="index.html"','href="../index.html"');
  for(const item of site.navigation) html=html.replaceAll(`href="${item.url}"`,`href="../${item.url}"`);
  fs.writeFileSync(path.join(blogOut,`${post.slug}.html`),html);
}

// Home: inject shared header/footer into existing immersive page.
let home=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
home=home.replace(/<body[^>]*>/,'<body class="home-shell">');
home=home.replace(/<a class="home-mark".*?<nav class="home-menu".*?<\/nav>/s,"");
home=home.replace("<body class=\"home-shell\">",`<body class="home-shell">${header("index.html")}`);
home=home.replace('<script src="src/js/home-menu.js"></script>',"");
home=home.replace('</body>',`${footer()}</body>`);
fs.writeFileSync(path.join(DIST,"index.html"),home);

fs.copyFileSync(path.join(ROOT,"admin/index.html"),path.join(DIST,"admin.html"));
fs.copyFileSync(path.join(ROOT,"admin/cms.js"),path.join(DIST,"cms.js"));

console.log("Sitio generado en dist/");
