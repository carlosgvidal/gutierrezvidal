(() => {
"use strict";
const $=s=>document.querySelector(s);
const form=$("#content-form"),formStatus=$("#form-status"),loadStatus=$("#load-status");
const type=$("#content-type"),title=$("#title"),slug=$("#slug"),description=$("#description"),body=$("#body");
const parent=$("#parent-menu"),folder=$("#folder"),dateField=$("#date-field"),date=$("#date-published");
const addMenu=$("#add-menu"),addIndex=$("#add-index"),preview=$("#preview-panel"),frame=$("#preview-frame");
const editMode=$("#edit-mode"),existingField=$("#existing-page-field"),existingPage=$("#existing-page"),loadExisting=$("#load-existing");
let navigation=[];
let loadedPath=null;
let loadedOriginalTitle=null;
let loadedParentPath=null;

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
function flattenPages(items,prefix=[]){
  const out=[];
  for(const item of items){
    const path=[...prefix,item.label];
    if(item.url && item.url.endsWith(".html")) out.push({item,path,label:path.join(" › "),url:item.url});
    if(item.children) out.push(...flattenPages(item.children,path));
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
function findParentOfUrl(items,url,path=[]){
  for(const item of items){
    if(item.children){
      for(const child of item.children){
        if(child.url===url) return [...path,item.label];
      }
      const nested=findParentOfUrl(item.children,url,[...path,item.label]);
      if(nested) return nested;
    }
  }
  return null;
}
function findItemByUrl(items,url){
  for(const item of items){
    if(item.url===url)return item;
    if(item.children){
      const found=findItemByUrl(item.children,url);
      if(found)return found;
    }
  }
  return null;
}
function renderParents(){
  parent.innerHTML="";
  for(const opt of flatten(navigation)){
    const el=document.createElement("option");
    el.value=JSON.stringify(opt.path);el.textContent=opt.label;parent.appendChild(el);
  }
}
function renderExistingPages(){
  existingPage.innerHTML="";
  for(const page of flattenPages(navigation)){
    if(page.url==="index.html") continue;
    const el=document.createElement("option");
    el.value=page.url;el.textContent=`${page.label} — ${page.url}`;existingPage.appendChild(el);
  }
}
function resetLoadedState(){
  loadedPath=null;loadedOriginalTitle=null;loadedParentPath=null;
  slug.disabled=false;folder.disabled=false;type.disabled=false;
}
function updateMode(){
  const editing=editMode.value==="existing";
  existingField.hidden=!editing;
  loadExisting.hidden=!editing;
  if(!editing){
    resetLoadedState();
    loadStatus.textContent="";
    form.reset();
    type.value="page";
    updateType();
  }
}
function updateType(){
  const value=type.value;
  dateField.hidden=value!=="blog";
  $("#folder-field").hidden=value==="page";
  if(value==="blog"){
    folder.value="blog";
    if(editMode.value!=="existing")addMenu.checked=false;
    const blog=flatten(navigation).find(x=>x.item.label==="Blog");
    if(blog)parent.value=JSON.stringify(blog.path);
  }else if(value==="subpage"){
    if(!folder.value||folder.value==="blog")folder.value="obra/escritura";
    if(editMode.value!=="existing")addMenu.checked=true;
  }else{
    folder.value="";
    if(editMode.value!=="existing")addMenu.checked=true;
  }
}
function bodyHTML(raw){
  return raw.trim().split(/\n\s*\n/).map(block=>{
    const t=block.trim();
    if(t.startsWith("## "))return `<h2>${esc(t.slice(3))}</h2>`;
    return `<p>${esc(t).replaceAll("\n","<br>")}</p>`;
  }).join("\n");
}
function htmlToEditorText(article){
  if(!article)return "";
  const blocks=[];
  for(const node of article.children){
    if(node.tagName==="H2") blocks.push(`## ${node.textContent.trim()}`);
    else if(node.tagName==="P"){
      const clone=node.cloneNode(true);
      clone.querySelectorAll("br").forEach(br=>br.replaceWith("\n"));
      blocks.push(clone.textContent.trim());
    } else {
      const text=node.textContent.trim();
      if(text) blocks.push(text);
    }
  }
  return blocks.join("\n\n");
}
const rootFor=path=>"../".repeat(path.split("/").length-1);
const canonical=path=>`https://www.gutierrezvidal.com/${path}`;

function inferType(path,doc){
  if(path.startsWith("blog/")) return "blog";
  if(path.includes("/")) return "subpage";
  return "page";
}
function inferFolder(path){
  const parts=path.split("/");
  return parts.length>1?parts.slice(0,-1).join("/"):"";
}
function inferSlug(path){
  return path.split("/").at(-1).replace(/\.html$/,"");
}
function extractDescription(doc){
  return doc.querySelector('meta[name="description"]')?.content?.trim()
    || doc.querySelector(".page-deck")?.textContent?.trim()
    || "";
}
function extractDate(doc){
  const schema=[...doc.querySelectorAll('script[type="application/ld+json"]')]
    .map(node=>{try{return JSON.parse(node.textContent)}catch{return null}})
    .find(Boolean);
  return schema?.datePublished || "";
}
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
  if(editMode.value==="existing" && d.path!==loadedPath){
    throw new Error("Al editar una página publicada no se puede cambiar su ruta. Crea una página nueva para usar otra ruta.");
  }
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
  const duplicate=node.children.find(x=>x.url===d.path||x.label===d.title);
  if(duplicate)throw new Error("Ya existe una entrada igual en ese menú.");
  node.children.push({label:d.title,url:d.path});
}
function updateMenuItem(d){
  const item=findItemByUrl(navigation,loadedPath);
  if(!item)return;
  item.label=d.title;
}
async function pathAlreadyExists(path){
  const patches=await GVPatches.listPatches();
  if(Object.prototype.hasOwnProperty.call(patches,path)) return true;
  try{
    await GVPatches.getFile(path);
    return true;
  }catch{
    return false;
  }
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
async function loadPublishedPage(){
  const path=existingPage.value;
  if(!path)return;
  loadStatus.textContent=`Cargando ${path}…`;
  try{
    const html=await GVPatches.getFile(path);
    const doc=new DOMParser().parseFromString(html,"text/html");
    const article=doc.querySelector("article.prose");
    const pageTitle=doc.querySelector(".page-title")?.textContent?.trim();
    if(!article||!pageTitle)throw new Error("La página no usa la estructura editable esperada.");

    loadedPath=path;
    loadedOriginalTitle=pageTitle;
    loadedParentPath=findParentOfUrl(navigation,path);

    type.value=inferType(path,doc);
    updateType();
    title.value=pageTitle;
    slug.value=inferSlug(path);
    slug.dataset.edited="true";
    description.value=extractDescription(doc);
    body.value=htmlToEditorText(article);
    folder.value=inferFolder(path);
    date.value=extractDate(doc);
    if(loadedParentPath) parent.value=JSON.stringify(loadedParentPath);

    type.disabled=true;
    slug.disabled=true;
    folder.disabled=true;
    addMenu.checked=false;
    addIndex.checked=false;
    loadStatus.textContent=`Página cargada: ${path}. La ruta permanecerá sin cambios.`;
    formStatus.textContent="";
  }catch(error){
    loadStatus.textContent=error.message;
  }
}
async function initialize(){
  const navText=await GVPatches.getFile("src/data/navigation.json");
  navigation=JSON.parse(navText);
  renderParents();
  renderExistingPages();
  updateType();
  updateMode();
  form.hidden=false;
}

title.addEventListener("input",()=>{if(!slug.dataset.edited&&editMode.value==="new")slug.value=slugify(title.value)});
slug.addEventListener("input",()=>{slug.dataset.edited="true";slug.value=slugify(slug.value)});
type.addEventListener("change",updateType);
editMode.addEventListener("change",updateMode);
loadExisting.addEventListener("click",loadPublishedPage);

$("#preview-button").addEventListener("click",()=>{
  try{
    const d=buildData();validate(d);
    frame.src=URL.createObjectURL(new Blob([pageHTML(d)],{type:"text/html"}));
    preview.hidden=false;
  }catch(e){formStatus.textContent=e.message}
});
$("#close-preview").addEventListener("click",()=>{preview.hidden=true;frame.src="about:blank"});

form.addEventListener("submit",async event=>{
  event.preventDefault();
  formStatus.textContent="Preparando la actualización…";
  try{
    const d=buildData();validate(d);

    if(editMode.value==="new"){
      if(await pathAlreadyExists(d.path)){
        throw new Error(`La ruta ${d.path} ya existe. Selecciona “Editar página publicada” para modificarla.`);
      }
      await GVPatches.savePatch(d.path,pageHTML(d));
      if(addMenu.checked){
        addToMenu(d);
        await GVPatches.savePatch("src/data/navigation.json",JSON.stringify(navigation,null,2)+"\n");
      }
      const indexPatch=await updatedIndex(d);
      if(indexPatch)await GVPatches.savePatch(indexPatch.path,indexPatch.content);
      await GVPatches.savePatch("sitemap.xml",await updatedSitemap(d));
      formStatus.textContent=`Página nueva guardada en la actualización: ${d.path}`;
    }else{
      if(!loadedPath)throw new Error("Primero carga una página publicada.");
      const confirmed=window.confirm(`Se reemplazará la página publicada ${loadedPath} en el paquete de actualización. ¿Continuar?`);
      if(!confirmed){formStatus.textContent="Operación cancelada.";return;}
      await GVPatches.savePatch(loadedPath,pageHTML(d));
      if(d.title!==loadedOriginalTitle){
        updateMenuItem(d);
        await GVPatches.savePatch("src/data/navigation.json",JSON.stringify(navigation,null,2)+"\n");
        loadedOriginalTitle=d.title;
      }
      formStatus.textContent=`Página existente actualizada: ${loadedPath}`;
    }
  }catch(e){formStatus.textContent=e.message}
});

initialize().catch(error=>{form.hidden=true;formStatus.textContent=error.message;});
})();