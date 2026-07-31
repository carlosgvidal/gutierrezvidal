(() => {
"use strict";
const state={zip:null,fileName:"",navigation:[],rootPrefix:""};
const $=s=>document.querySelector(s);
const zipInput=$("#site-zip"),form=$("#content-form"),zipStatus=$("#zip-status"),formStatus=$("#form-status");
const type=$("#content-type"),title=$("#title"),slug=$("#slug"),description=$("#description"),body=$("#body");
const parent=$("#parent-menu"),folder=$("#folder"),dateField=$("#date-field"),date=$("#date-published");
const addMenu=$("#add-menu"),addIndex=$("#add-index"),preview=$("#preview-panel"),frame=$("#preview-frame");

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
    if(!current) return null;
    list=current.children||[];
  }
  return current;
}
function renderParents(){
  parent.innerHTML="";
  for(const opt of flatten(state.navigation)){
    const el=document.createElement("option");
    el.value=JSON.stringify(opt.path);
    el.textContent=opt.label;
    parent.appendChild(el);
  }
}
function updateType(){
  const value=type.value;
  dateField.hidden=value!=="blog";
  $("#folder-field").hidden=value==="page";
  if(value==="blog"){
    folder.value="blog";addMenu.checked=false;
    const blog=flatten(state.navigation).find(x=>x.item.label==="Blog");
    if(blog) parent.value=JSON.stringify(blog.path);
  }else if(value==="subpage"){
    if(!folder.value||folder.value==="blog") folder.value="obra/escritura";
    addMenu.checked=true;
  }else{
    folder.value="";addMenu.checked=true;
  }
}
function bodyHTML(raw){
  return raw.trim().split(/\n\s*\n/).map(block=>{
    const t=block.trim();
    if(t.startsWith("## ")) return `<h2>${esc(t.slice(3))}</h2>`;
    return `<p>${esc(t).replaceAll("\n","<br>")}</p>`;
  }).join("\n");
}
const rootFor=path=>"../".repeat(path.split("/").length-1);
const canonical=path=>`https://www.gutierrezvidal.com/${path}`;

function data(){
  const contentType=type.value;
  const s=clean(slug.value), f=clean(folder.value);
  const path=contentType==="page"?`${s}.html`:contentType==="blog"?`blog/${s}.html`:`${f}/${s}.html`;
  return {
    type:contentType,title:title.value.trim(),slug:s,description:description.value.trim(),
    body:body.value.trim(),date:date.value,path,parentPath:JSON.parse(parent.value),
    kicker:contentType==="blog"?"Blog":JSON.parse(parent.value).at(-1)
  };
}
function validate(d){
  if(!state.zip) throw new Error("Primero carga el ZIP del sitio.");
  if(!d.title) throw new Error("El título es obligatorio.");
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug)) throw new Error("El slug solo admite minúsculas, números y guiones.");
  if(d.description.length<40) throw new Error("La descripción SEO necesita al menos 40 caracteres.");
  if(!d.body) throw new Error("El contenido no puede quedar vacío.");
  if(d.type==="subpage"&&!clean(folder.value)) throw new Error("Indica la carpeta de destino.");
  if(state.zip.file(state.rootPrefix+d.path)) throw new Error(`Ya existe ${d.path}.`);
}
function pageHTML(d){
  const root=rootFor(d.path),url=canonical(d.path);
  const schema={"@context":"https://schema.org","@type":d.type==="blog"?"BlogPosting":"WebPage",
    headline:d.title,description:d.description,url,inLanguage:"es-MX",
    author:{"@type":"Person",name:"Carlos Adolfo Gutiérrez Vidal",jobTitle:["Poeta","Artista indisciplinario","Investigador"]}};
  if(d.type==="blog"&&d.date) schema.datePublished=d.date;
  const kicker=d.type==="blog"&&d.date?d.date:d.kicker;
  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="author" content="Carlos Adolfo Gutiérrez Vidal">
<meta name="description" content="${esc(d.description)}">
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
<title>${esc(d.title)} · Carlos Adolfo Gutiérrez Vidal</title>
<link rel="stylesheet" href="${root}src/css/site-v2.2.css"></head>
<body data-root="${root}"><div data-site-header></div><main class="page">
<header class="page-header"><p class="page-kicker">${esc(kicker)}</p><h1 class="page-title">${esc(d.title)}</h1><p class="page-deck">${esc(d.description)}</p></header>
<article class="prose">${bodyHTML(d.body)}</article></main><div data-site-footer></div>
<script src="${root}src/js/site-shell-v2.1.js"></script></body></html>`;
}
async function detectRoot(zip){
  if(zip.file("index.html")) return "";
  const names=Object.keys(zip.files).filter(n=>/(^|\/)index\.html$/.test(n));
  return names.length===1?names[0].replace(/index\.html$/,""):"";
}
async function read(path){
  const f=state.zip.file(state.rootPrefix+path);
  return f?await f.async("text"):null;
}
const write=(path,content)=>state.zip.file(state.rootPrefix+path,content);

function addToMenu(d){
  const node=findNode(state.navigation,d.parentPath);
  if(!node) throw new Error("No se encontró el menú padre.");
  node.children=node.children||[];
  if(node.children.some(x=>x.url===d.path||x.label===d.title)) throw new Error("Ya existe una entrada igual en ese menú.");
  node.children.push({label:d.title,url:d.path});
  write("src/data/navigation.json",JSON.stringify(state.navigation,null,2)+"\n");
}
async function updateIndex(d){
  if(!addIndex.checked) return;
  const node=findNode(state.navigation,d.parentPath);
  if(!node?.url) return;
  const current=await read(node.url);
  if(!current) return;
  const start=current.indexOf('<section class="collection"');
  if(start<0) return;
  const close=current.indexOf("</section>",start);
  if(close<0) return;
  const link=rootFor(node.url)+d.path;
  const card=`<article><h2><a href="${link}">${esc(d.title)}</a></h2><p>${esc(d.description)}</p></article>`;
  write(node.url,current.slice(0,close)+card+current.slice(close));
}
async function updateSitemap(d){
  const xml=await read("sitemap.xml");
  if(!xml) return;
  const url=canonical(d.path);
  if(xml.includes(`<loc>${url}</loc>`)) return;
  const entry=`  <url><loc>${url}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
  write("sitemap.xml",xml.replace("</urlset>",entry+"</urlset>"));
}
async function load(file){
  if(!window.JSZip) throw new Error("No se pudo cargar el componente ZIP. Comprueba la conexión.");
  state.zip=await JSZip.loadAsync(file);state.fileName=file.name.replace(/\.zip$/i,"");state.rootPrefix=await detectRoot(state.zip);
  const nav=await read("src/data/navigation.json");
  if(!nav) throw new Error("El ZIP no contiene src/data/navigation.json.");
  state.navigation=JSON.parse(nav);renderParents();updateType();form.hidden=false;
  zipStatus.textContent=`Sitio cargado: ${file.name}`;
}

zipInput.addEventListener("change",async()=>{
  const file=zipInput.files?.[0];if(!file)return;zipStatus.textContent="Abriendo el ZIP…";
  try{await load(file)}catch(e){state.zip=null;form.hidden=true;zipStatus.textContent=e.message}
});
title.addEventListener("input",()=>{if(!slug.dataset.edited)slug.value=slugify(title.value)});
slug.addEventListener("input",()=>{slug.dataset.edited="true";slug.value=slugify(slug.value)});
type.addEventListener("change",updateType);

$("#preview-button").addEventListener("click",()=>{
  try{const d=data();validate(d);frame.src=URL.createObjectURL(new Blob([pageHTML(d)],{type:"text/html"}));preview.hidden=false}
  catch(e){formStatus.textContent=e.message}
});
$("#close-preview").addEventListener("click",()=>{preview.hidden=true;frame.src="about:blank"});

form.addEventListener("submit",async event=>{
  event.preventDefault();formStatus.textContent="Generando el sitio…";
  try{
    const d=data();validate(d);write(d.path,pageHTML(d));
    if(addMenu.checked)addToMenu(d);
    await updateIndex(d);await updateSitemap(d);
    const blob=await state.zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=`${state.fileName}-actualizado.zip`;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);formStatus.textContent=`ZIP generado. Archivo añadido: ${d.path}`;
  }catch(e){formStatus.textContent=e.message}
});
})();