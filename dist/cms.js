const $=id=>document.getElementById(id);
let site=null;
let pages={};
let posts={};

const apiBase=()=>`https://api.github.com/repos/${$("owner").value.trim()}/${$("repo").value.trim()}/contents`;
const headers=()=>({
  "Accept":"application/vnd.github+json",
  "Authorization":`Bearer ${$("token").value.trim()}`,
  "X-GitHub-Api-Version":"2026-03-10"
});
const branch=()=>$("branch").value.trim()||"main";
const decode=content=>decodeURIComponent(escape(atob(content.replace(/\n/g,""))));
const encode=text=>btoa(unescape(encodeURIComponent(text)));

async function getFile(path){
  const r=await fetch(`${apiBase()}/${path}?ref=${encodeURIComponent(branch())}`,{headers:headers()});
  if(!r.ok) throw new Error(`${path}: ${r.status}`);
  const data=await r.json();
  return {sha:data.sha,text:decode(data.content)};
}

async function putFile(path,text,message){
  let sha;
  try{sha=(await getFile(path)).sha}catch{}
  const r=await fetch(`${apiBase()}/${path}`,{
    method:"PUT",headers:{...headers(),"Content-Type":"application/json"},
    body:JSON.stringify({message,content:encode(text),branch:branch(),...(sha?{sha}:{})})
  });
  if(!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function listDir(path){
  const r=await fetch(`${apiBase()}/${path}?ref=${encodeURIComponent(branch())}`,{headers:headers()});
  if(!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

function show(view){
  for(const id of ["site","page","post"]) $(`view-${id}`).hidden=id!==view;
}
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>show(b.dataset.view));

function fillSite(){
  $("siteTitle").value=site.siteTitle||"";
  $("tagline").value=site.tagline||"";
  $("copyrightYear").value=site.copyrightYear||new Date().getFullYear();
  $("navigation").value=(site.navigation||[]).map(x=>`${x.label}|${x.url}`).join("\n");
}

function fillPage(slug){
  const p=pages[slug]; if(!p)return;
  $("page-title").value=p.title||"";
  $("page-kicker").value=p.kicker||"";
  $("page-deck").value=p.deck||"";
  $("page-body").value=(p.body||[]).join("\n");
}

function fillPost(slug){
  const p=posts[slug]; if(!p)return;
  $("post-slug").value=p.slug||slug;
  $("post-title").value=p.title||"";
  $("post-category").value=p.category||"";
  $("post-date").value=p.date||"";
  $("post-description").value=p.description||"";
  $("post-body").value=(p.body||[]).join("\n");
  $("post-published").checked=Boolean(p.published);
}

$("connect").onclick=async()=>{
  $("connection-status").textContent="Cargando…";
  try{
    site=JSON.parse((await getFile("content/site.json")).text);
    const pageFiles=await listDir("content/pages");
    pages={};
    for(const f of pageFiles.filter(x=>x.name.endsWith(".json"))){
      pages[f.name.replace(".json","")]=JSON.parse((await getFile(f.path)).text);
    }
    const postFiles=await listDir("content/blog");
    posts={};
    for(const f of postFiles.filter(x=>x.name.endsWith(".json"))){
      posts[f.name.replace(".json","")]=JSON.parse((await getFile(f.path)).text);
    }
    fillSite();
    $("page-select").innerHTML=Object.keys(pages).map(s=>`<option>${s}</option>`).join("");
    $("post-select").innerHTML=Object.keys(posts).map(s=>`<option>${s}</option>`).join("");
    fillPage($("page-select").value);
    fillPost($("post-select").value);
    $("connection-status").textContent="Contenido cargado.";
  }catch(e){$("connection-status").textContent=`Error: ${e.message}`}
};

$("page-select").onchange=()=>fillPage($("page-select").value);
$("post-select").onchange=()=>fillPost($("post-select").value);

$("save-site").onclick=async()=>{
  try{
    site.siteTitle=$("siteTitle").value.trim();
    site.tagline=$("tagline").value.trim();
    site.copyrightYear=Number($("copyrightYear").value);
    site.navigation=$("navigation").value.split("\n").map(x=>x.trim()).filter(Boolean).map(line=>{
      const [label,url]=line.split("|"); return {label:label.trim(),url:url.trim()};
    });
    await putFile("content/site.json",JSON.stringify(site,null,2)+"\n","Actualizar sitio y navegación");
    $("status").textContent="Sitio y navegación guardados.";
  }catch(e){$("status").textContent=`Error: ${e.message}`}
};

$("save-page").onclick=async()=>{
  try{
    const slug=$("page-select").value;
    const p=pages[slug];
    p.title=$("page-title").value.trim();
    p.kicker=$("page-kicker").value.trim();
    p.deck=$("page-deck").value.trim();
    p.body=$("page-body").value.split("\n").map(x=>x.trim()).filter(Boolean);
    await putFile(`content/pages/${slug}.json`,JSON.stringify(p,null,2)+"\n",`Actualizar página ${slug}`);
    $("status").textContent="Página guardada.";
  }catch(e){$("status").textContent=`Error: ${e.message}`}
};

$("new-post").onclick=()=>{
  const slug=`entrada-${Date.now()}`;
  posts[slug]={slug,title:"",category:"",date:new Date().toISOString().slice(0,10),description:"",body:[],published:false};
  $("post-select").insertAdjacentHTML("beforeend",`<option>${slug}</option>`);
  $("post-select").value=slug;
  fillPost(slug);
};

$("save-post").onclick=async()=>{
  try{
    const oldSlug=$("post-select").value;
    const slug=$("post-slug").value.trim();
    const p={
      slug,
      title:$("post-title").value.trim(),
      category:$("post-category").value.trim(),
      date:$("post-date").value,
      description:$("post-description").value.trim(),
      body:$("post-body").value.split("\n").map(x=>x.trim()).filter(Boolean),
      published:$("post-published").checked
    };
    await putFile(`content/blog/${slug}.json`,JSON.stringify(p,null,2)+"\n",`Guardar entrada ${slug}`);
    posts[slug]=p;
    $("status").textContent="Entrada guardada.";
  }catch(e){$("status").textContent=`Error: ${e.message}`}
};
