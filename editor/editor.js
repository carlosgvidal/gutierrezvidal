(() => {
"use strict";
const $=s=>document.querySelector(s);
const form=$("#content-form"),formStatus=$("#form-status");
const type=$("#content-type"),title=$("#title"),slug=$("#slug"),description=$("#description"),body=$("#body");
const parent=$("#parent-menu"),folder=$("#folder"),dateField=$("#date-field"),date=$("#date-published");
const addMenu=$("#add-menu"),addIndex=$("#add-index"),preview=$("#preview-panel"),frame=$("#preview-frame");
let navigation=[];

const esc=v=>String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const slugify=v=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const clean=v=>v.trim().replace(/^\/+|\/+$/g,"").replace(/\/+/g,"/");

function flatten(items,prefix=[]){
  const out=[];
  for(const item of items){
    const path=[...prefix,item.label];
    out.push({item,path,label:path.join(" › ")});
    if(item.children) out.push(...flatten(item.children,path));
  }
  return out;
}
function findNode(items,labels){
  let list=items,current=null;
  for(const label of labels){
    current=list.find(item=>item.label===label);
    if(!current)return null;
    list=current.children||[];
  }
  return current;
}
function renderParents(){
  parent.innerHTML="";
  for(const opt of flatten(navigation)){
    const el=document.createElement("option");
    el.value=JSON.stringify(opt.path);el.textContent=opt.label;parent.appendChild(el);
  }
}
function updateType(){
  const value=type.value;
  dateField.hidden=value!=="blog";
  $("#folder-field").hidden=value==="page";
  if(value==="blog"){
    folder.value="blog";addMenu.checked=false;
    const blog=flatten(navigation).find(x=>x.item.label==="Blog");
    if(blog)parent.value=JSON.stringify(blog.path);
  }else if(value==="subpage"){
    if(!folder.value||folder.value==="blog")folder.value="obra/escritura";
    addMenu.checked=true;
  }else{
    folder.value="";addMenu.checked=true;
  }
}
function bodyHTML(raw){
  return raw.trim().split(/\n\s*\n/).map(block=>{
    const t=block.trim();
    if(t.startsWith("## "))return `<h2>${esc(t.slice(3))}</h2>`;
    return `<p>${esc(t).replaceAll("\n","<br>")}</p>`;
  }).join("\n");
}
const rootFor=path=>"../".repeat(path.split("/").length-1);
const canonical=path=>`https://www.gutierrezvidal.com/${path}`;

function buildData(){
  const contentType=type.value,s=clean(slug.value),f=clean(folder.value);
  const path=contentType==="page"?`${s}.html`:contentType==="blog"?`blog/${s}.html`:`${f}/${s}.html`;
  return {type:contentType,title:title.value.trim(),slug:s,description:description.value.trim(),
    body:body.value.trim(),date:date.value,path,parentPath:JSON.parse(parent.value),
    kicker:contentType==="blog"?"Blog":JSON.parse(parent.value).at(-1)};
}
function validate(d){
  if(!d.title)throw new Error("El título es obligatorio.");
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug))throw new Error("El slug sólo admite minúsculas, números y guiones.");
  if(d.description.length<40)throw new Error("La descripción SEO necesita al menos 40 caracteres.");
  if(!d.body)throw new Error("El contenido no puede quedar vacío.");
  if(d.type==="subpage"&&!clean(folder.value))throw new Error("Indica la carpeta de destino.");
}
function pageHTML(d){
  const root=rootFor(d.path),url=canonical(d.path);
  const schema={"@context":"https://schema.org","@type":d.type==="blog"?"BlogPosting":"WebPage",
    headline:d.title,description:d.description,url,inLanguage:"es-MX",
    author:{"@type":"Person",name:"Carlos Adolfo Gutiérrez Vidal",jobTitle:["Poeta","Artista indisciplinario","Investigador"]}};
  if(d.type==="blog"&&d.date)schema.datePublished=d.date;
  const kicker=d.type==="blog"&&d.date?d.date:d.kicker;
  return `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="author" content="Carlos Adolfo Gutiérrez Vidal"><meta name="description" content="${esc(d.description)}">
<meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#FAF9F6">
<link rel="canonical" href="${url}"><link rel="icon" href="${root}public/assets/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="${root}public/assets/apple-touch-icon.png"><link rel="manifest" href="${root}site.webmanifest">
<meta property="og:locale" content="es_MX"><meta property="og:type" content="${d.type==="blog"?"article":"website"}">
<meta property="og:site_name" content="Carlos Adolfo Gutiérrez Vidal"><meta property="og:title" content="${esc(d.title)}">
<meta property="og:description" content="${esc(d.description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="https://www.gutierrezvidal.com/public/assets/og-home.jpg">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(d.title)}">
<meta name="twitter:description" content="${esc(d.description)}"><meta name="twitter:image" content="https://www.gutierrezvidal.com/public/assets/og-home.jpg">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<title>${esc(d.title)} · Carlos Adolfo Gutiérrez Vidal</title><link rel="stylesheet" href="${root}src/css/site-v2.2.css"></head>
<body data-root="${root}"><div data-site-header></div><main class="page"><header class="page-header">
<p class="page-kicker">${esc(kicker)}</p><h1 class="page-title">${esc(d.title)}</h1><p class="page-deck">${esc(d.description)}</p>
</header><article class="prose">${bodyHTML(d.body)}</article></main><div data-site-footer></div>
<script src="${root}src/js/site-shell-v2.1.js"></script></body></html>`;
}
function addToMenu(d){
  const node=findNode(navigation,d.parentPath);
  if(!node)throw new Error("No se encontró el menú padre.");
  node.children=node.children||[];
  if(node.children.some(x=>x.url===d.path||x.label===d.title))throw new Error("Ya existe una entrada igual en ese menú.");
  node.children.push({label:d.title,url:d.path});
}
async function updatedIndex(d){
  if(!addIndex.checked)return null;
  const node=findNode(navigation,d.parentPath);
  if(!node?.url)return null;
  const current=await GVPatches.getFile(node.url);
  const start=current.indexOf('<section class="collection"');
  if(start<0)return null;
  const close=current.indexOf("</section>",start);
  if(close<0)return null;
  const link=rootFor(node.url)+d.path;
  const card=`<article><h2><a href="${link}">${esc(d.title)}</a></h2><p>${esc(d.description)}</p></article>`;
  return {path:node.url,content:current.slice(0,close)+card+current.slice(close)};
}
async function updatedSitemap(d){
  const xml=await GVPatches.getFile("sitemap.xml");
  const url=canonical(d.path);
  if(xml.includes(`<loc>${url}</loc>`))return xml;
  const entry=`  <url><loc>${url}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
  return xml.replace("</urlset>",entry+"</urlset>");
}
async function initialize(){
  const navText=await GVPatches.getFile("src/data/navigation.json");
  navigation=JSON.parse(navText);renderParents();updateType();form.hidden=false;
}
title.addEventListener("input",()=>{if(!slug.dataset.edited)slug.value=slugify(title.value)});
slug.addEventListener("input",()=>{slug.dataset.edited="true";slug.value=slugify(slug.value)});
type.addEventListener("change",updateType);

$("#preview-button").addEventListener("click",()=>{
  try{const d=buildData();validate(d);frame.src=URL.createObjectURL(new Blob([pageHTML(d)],{type:"text/html"}));preview.hidden=false}
  catch(e){formStatus.textContent=e.message}
});
$("#close-preview").addEventListener("click",()=>{preview.hidden=true;frame.src="about:blank"});

form.addEventListener("submit",async event=>{
  event.preventDefault();formStatus.textContent="Preparando la actualización…";
  try{
    const d=buildData();validate(d);
    await GVPatches.savePatch(d.path,pageHTML(d));
    if(addMenu.checked){
      addToMenu(d);
      await GVPatches.savePatch("src/data/navigation.json",JSON.stringify(navigation,null,2)+"\n");
    }
    const indexPatch=await updatedIndex(d);
    if(indexPatch)await GVPatches.savePatch(indexPatch.path,indexPatch.content);
    await GVPatches.savePatch("sitemap.xml",await updatedSitemap(d));
    formStatus.textContent=`Página guardada en la actualización: ${d.path}`;
  }catch(e){formStatus.textContent=e.message}
});
initialize().catch(error=>{form.hidden=true;formStatus.textContent=error.message;});
})();