(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const status = $("#gallery-status");
  const roomSelect = $("#gallery-room-select");
  const addRoomButton = $("#gallery-add-room");
  const duplicateRoomButton = $("#gallery-duplicate-room");
  const deleteRoomButton = $("#gallery-delete-room");
  const newRoomPanorama = $("#gallery-new-room-panorama");
  const roomLabelInput = $("#gallery-room-label");
  const panoramaFile = $("#gallery-panorama-file");
  const panoramaAlt = $("#gallery-panorama-alt");
  const stage = $("#gallery-stage");
  const stageImage = $("#gallery-stage-image");
  const addArtworkButton = $("#gallery-add-artwork");
  const addPortalButton = $("#gallery-add-portal");
  const addTextButton = $("#gallery-add-text");
  const itemList = $("#gallery-item-list");
  const itemCount = $("#gallery-item-count");
  const inspector = $("#gallery-inspector");
  const inspectorTitle = $("#gallery-inspector-title");
  const form = $("#gallery-item-form");
  const noSelection = $("#gallery-no-selection");
  const artworkFields = $("#gallery-artwork-fields");
  const portalFields = $("#gallery-portal-fields");
  const textFields = $("#gallery-text-fields");
  const linkField = $("#gallery-artwork-link-field");
  const saveButton = $("#gallery-save");
  const saveDownloadButton = $("#gallery-save-download");
  const readyDownload = $("#gallery-ready-download");
  const savedDetails = $("#gallery-saved-details");
  const savedFiles = $("#gallery-saved-files");

  const pageFields = {
    title: $("#gallery-page-title"),
    description: $("#gallery-page-description"),
    brand: $("#gallery-brand"),
    roomMenu: $("#gallery-room-menu-label"),
    immersive: $("#gallery-immersive-label"),
    help: $("#gallery-help-text"),
    footerLink: $("#gallery-footer-link-label"),
    restore: $("#gallery-restore-label")
  };
  const itemFields = {
    id: $("#gallery-item-id"), type: $("#gallery-item-type"), kind: $("#gallery-item-kind"),
    title: $("#gallery-artwork-title"), file: $("#gallery-artwork-file"), path: $("#gallery-artwork-path"),
    width: $("#gallery-artwork-width"),
    depth: $("#gallery-artwork-depth"),
    curve: $("#gallery-artwork-curve"),
    rotationX: $("#gallery-artwork-rotation-x"),
    rotationY: $("#gallery-artwork-rotation-y"),
    rotationZ: $("#gallery-artwork-rotation-z"),
    action: $("#gallery-artwork-action"), link: $("#gallery-artwork-link"),
    portalLabel: $("#gallery-portal-label"), portalRoom: $("#gallery-portal-room"),
    textHeading: $("#gallery-text-heading"),
    textSubheading: $("#gallery-text-subheading"),
    textDescription: $("#gallery-text-description"),
    textWidth: $("#gallery-text-width"),
    textAlign: $("#gallery-text-align"),
    textHeadingSize: $("#gallery-text-heading-size"),
    textBodySize: $("#gallery-text-body-size"),
    textTheme: $("#gallery-text-theme"),
    published: $("#gallery-item-published"),
    x: $("#gallery-item-x"), y: $("#gallery-item-y")
  };

  const DRAFT_KEY = "gutierrezvidal-gallery360-draft-v1";
  let data = null;
  let pageSource = "";
  let currentRoomId = "";
  let selectedKey = "";
  let dirty = false;
  let downloadURL = "";
  const objectURLs = new Map();

  const cleanText = value => String(value || "").trim();
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const slugify = value => cleanText(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "archivo";
  const extensionFor = file => ({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","image/avif":"avif","image/svg+xml":"svg"}[file.type] || file.name.split(".").pop().toLowerCase() || "bin");

  function setStatus(message){ status.textContent = message; }
  function room(){ return data?.rooms?.find(value=>value.id===currentRoomId) || null; }
  function uniqueRoomId(label="sala"){
    const base=slugify(label).replace(/^archivo$/,"sala") || "sala";
    const existing=new Set((data?.rooms||[]).map(value=>value.id));
    if(!existing.has(base)) return base;
    let index=2;
    while(existing.has(`${base}-${index}`)) index++;
    return `${base}-${index}`;
  }
  function roomNameFromFile(file){
    const source=cleanText(file?.name).replace(/\.[^.]+$/,"").replace(/[-_]+/g," ");
    return source ? source.replace(/\b\w/g,letter=>letter.toUpperCase()) : `Sala ${(data?.rooms?.length||0)+1}`;
  }
  async function imageDimensions(url){
    return new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>resolve({
        width:image.naturalWidth||1536,
        height:image.naturalHeight||768
      });
      image.onerror=()=>resolve({width:1536,height:768});
      image.src=url;
    });
  }
  function allItems(value=room()){
    if(!value) return [];
    return [
      ...(value.artworks||[]).map(item=>({type:"artwork",item,key:`artwork:${item.id}`})),
      ...(value.portals||[]).map((item,index)=>({type:"portal",item,key:`portal:${item.id || index}`})),
      ...(value.texts||[]).map((item,index)=>({type:"text",item,key:`text:${item.id || index}`}))
    ];
  }
  function selected(){ return allItems().find(value=>value.key===selectedKey) || null; }
  function pageState(){ return Object.fromEntries(Object.entries(pageFields).map(([key,field])=>[key,field.value])); }
  function applyPageState(value={}){ for(const [key,field] of Object.entries(pageFields)) field.value=value[key] || ""; }
  function saveDraft(){
    try{ localStorage.setItem(DRAFT_KEY,JSON.stringify({savedAt:new Date().toISOString(),data,page:pageState(),currentRoomId,selectedKey})); }catch{}
  }
  function readDraft(){ try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");}catch{return null;} }
  function markDirty(message="Cambios sin guardar."){ dirty=true; readyDownload.hidden=true; saveDraft(); setStatus(message); }
  function revokeURLs(){ for(const url of objectURLs.values()) URL.revokeObjectURL(url); objectURLs.clear(); }
  async function refreshObjectURLs(){
    revokeURLs();
    const patches=await GVPatches.listPatches();
    for(const [path,value] of Object.entries(patches)){
      if(value instanceof Blob && (path.startsWith("public/gallery/") || path.startsWith("public/panorama/"))){
        objectURLs.set(path,URL.createObjectURL(value));
      }
    }
  }
  function assetURL(path){ return objectURLs.get(path) || `../${String(path||"").replace(/^\/+/,"")}`; }
  function normalize(){
    data.title=cleanText(data.title)||"Galería 360";
    data.rooms=(data.rooms||[]).map((value,index)=>({
      id:cleanText(value.id)||`sala-${index+1}`,
      label:cleanText(value.label)||`Sala ${index+1}`,
      panorama:cleanText(value.panorama), alt:cleanText(value.alt)||`Panorama de ${value.label||`Sala ${index+1}`}`,
      width:Number(value.width)||1536,height:Number(value.height)||768,
      initialView:{x:Number(value.initialView?.x)||768,y:Number(value.initialView?.y)||384},
      artworks:(value.artworks||[]).map(item=>({id:cleanText(item.id)||uid("obra"),title:cleanText(item.title)||"Obra sin título",image:cleanText(item.image),x:Number(item.x)||768,y:Number(item.y)||384,width:clamp(Number(item.width)||180,50,900),
        depth:clamp(Number(item.depth)||9.4,4,20),
        curve:clamp(Number(item.curve)||0,-0.8,0.8),
        rotationX:clamp(Number(item.rotationX)||0,-90,90),
        rotationY:clamp(Number(item.rotationY)||0,-180,180),
        rotationZ:clamp(Number(item.rotationZ)||0,-180,180),
        action:item.action==="link"?"link":"zoom",link:cleanText(item.link),published:item.published!==false})),
      portals:(value.portals||[]).map(item=>({id:cleanText(item.id)||uid("transito"),label:cleanText(item.label)||"Cambiar de sala",room:cleanText(item.room),x:Number(item.x)||768,y:Number(item.y)||384,published:item.published!==false})),
      texts:(value.texts||[]).map(item=>({
        id:cleanText(item.id)||uid("texto"),
        heading:cleanText(item.heading)||"Encabezado",
        subheading:cleanText(item.subheading),
        description:cleanText(item.description),
        x:Number(item.x)||768,
        y:Number(item.y)||384,
        width:clamp(Number(item.width)||440,220,900),
        align:["left","center","right"].includes(item.align)?item.align:"left",
        headingSize:clamp(Number(item.headingSize)||54,24,120),
        bodySize:clamp(Number(item.bodySize)||18,12,36),
        theme:["light","dark","transparent"].includes(item.theme)?item.theme:"light",
        published:item.published!==false
      }))
    }));
  }
  function renderRoomOptions(){
    roomSelect.replaceChildren(); itemFields.portalRoom.replaceChildren();
    for(const value of data.rooms){
      for(const select of [roomSelect,itemFields.portalRoom]){
        const option=document.createElement("option"); option.value=value.id; option.textContent=value.label; select.appendChild(option);
      }
    }
    roomSelect.value=currentRoomId;
  }
  function updateStageImage(){
    const value=room(); if(!value) return;
    stageImage.src=assetURL(value.panorama); stageImage.alt=value.alt||value.label;
  }
  function place(marker,item,value=room()){
    marker.style.left=`${(Number(item.x)/value.width)*100}%`;
    marker.style.top=`${(Number(item.y)/value.height)*100}%`;
  }
  function syncRoomFields(){ const value=room(); if(!value)return; roomLabelInput.value=value.label; panoramaAlt.value=value.alt||""; updateStageImage(); }
  function itemImageURL(item){ return item.image ? assetURL(item.image) : ""; }
  function attachDrag(marker,record){
    marker.addEventListener("pointerdown",event=>{
      event.preventDefault(); select(record.key); try{marker.setPointerCapture(event.pointerId);}catch{}
      const sx=event.clientX,sy=event.clientY; let moved=false;
      const move=ev=>{
        if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>4)moved=true; if(!moved)return;
        const rect=stage.getBoundingClientRect(),value=room(); if(!rect.width||!rect.height||!value)return;
        record.item.x=Math.round(clamp(ev.clientX-rect.left,0,rect.width)/rect.width*value.width);
        record.item.y=Math.round(clamp(ev.clientY-rect.top,0,rect.height)/rect.height*value.height);
        itemFields.x.value=record.item.x; itemFields.y.value=record.item.y; place(marker,record.item,value);
      };
      const end=()=>{ marker.removeEventListener("pointermove",move);marker.removeEventListener("pointerup",end);marker.removeEventListener("pointercancel",end); if(moved){renderList();markDirty("Posición actualizada.");} };
      marker.addEventListener("pointermove",move);marker.addEventListener("pointerup",end);marker.addEventListener("pointercancel",end);
    });
  }
  function renderStage(){
    stage.querySelectorAll(".gallery-stage-marker").forEach(node=>node.remove());
    for(const record of allItems()){
      const button=document.createElement("button"); button.type="button"; button.className=`gallery-stage-marker ${record.type==="artwork"?"gallery-stage-artwork":"gallery-stage-portal"}`; button.dataset.key=record.key;
      if(record.key===selectedKey)button.classList.add("is-selected");
      if(record.type==="artwork"){
        const url=itemImageURL(record.item);
        button.style.width=`${clamp((record.item.width||180)*.55,70,230)}px`;
        if(url){const image=document.createElement("img");image.src=url;image.alt=record.item.title||"Obra";button.appendChild(image);}else{const label=document.createElement("span");label.className="gallery-stage-placeholder";label.textContent="Selecciona una imagen";button.appendChild(label);}
      }else if(record.type==="portal"){
        button.textContent=record.item.label||"Tránsito";
      }else{
        button.classList.remove("gallery-stage-portal");
        button.classList.add("gallery-stage-text");
        button.style.width=`${clamp((record.item.width||440)*.42,150,360)}px`;
        const heading=document.createElement("strong");
        heading.textContent=record.item.heading||"Encabezado";
        const subheading=document.createElement("span");
        subheading.textContent=record.item.subheading||"";
        button.append(heading,subheading);
      }
      button.hidden=record.item.published===false; place(button,record.item); attachDrag(button,record); button.addEventListener("click",()=>select(record.key)); stage.appendChild(button);
    }
  }
  function renderList(){
    itemList.replaceChildren(); const records=allItems(); itemCount.textContent=`${records.length} elemento${records.length===1?"":"s"}`;
    if(!records.length){const p=document.createElement("p");p.className="field-help";p.textContent="Esta sala todavía no tiene obras ni tránsitos.";itemList.appendChild(p);return;}
    for(const record of records){
      const row=document.createElement("article");row.className="gallery-item-row";row.dataset.key=record.key;if(record.key===selectedKey)row.classList.add("is-selected");
      const choose=document.createElement("button");choose.type="button";choose.className="gallery-item-select";
      const thumb=document.createElement("span");thumb.className="gallery-item-thumb";
      if(record.type==="artwork"&&record.item.image){const img=document.createElement("img");img.src=itemImageURL(record.item);img.alt="";thumb.appendChild(img);}else thumb.textContent=record.type==="artwork"?"OBRA":record.type==="portal"?"SALA":"TEXTO";
      const text=document.createElement("span");const strong=document.createElement("strong");strong.textContent=record.type==="artwork"?record.item.title:record.type==="portal"?record.item.label:record.item.heading;const small=document.createElement("small");small.textContent=record.type==="artwork"?`${record.item.width}px · ${record.item.published!==false?"Publicada":"Borrador"}`:record.type==="portal"?`→ ${record.item.room} · ${record.item.published!==false?"Publicado":"Borrador"}`:`${record.item.width}px · ${record.item.published!==false?"Publicado":"Borrador"}`;text.append(strong,small);choose.append(thumb,text);choose.addEventListener("click",()=>select(record.key));
      const actions=document.createElement("div");actions.className="gallery-item-actions";const edit=document.createElement("button");edit.type="button";edit.className="secondary";edit.textContent="Editar";edit.addEventListener("click",()=>select(record.key));const remove=document.createElement("button");remove.type="button";remove.className="secondary";remove.textContent="Eliminar";remove.addEventListener("click",()=>removeItem(record.key));actions.append(edit,remove);row.append(choose,actions);itemList.appendChild(row);
    }
  }
  function select(key){
    selectedKey=key||""; const record=selected(); form.hidden=!record; noSelection.hidden=Boolean(record);
    stage.querySelectorAll(".gallery-stage-marker").forEach(node=>node.classList.toggle("is-selected",node.dataset.key===selectedKey)); itemList.querySelectorAll(".gallery-item-row").forEach(node=>node.classList.toggle("is-selected",node.dataset.key===selectedKey));
    if(!record){inspectorTitle.textContent="Elemento";return;}
    itemFields.id.value=record.item.id||"";itemFields.type.value=record.type;
    itemFields.kind.textContent=record.type==="artwork"?"Obra visual":record.type==="portal"?"Punto de tránsito":"Texto editorial";
    artworkFields.hidden=record.type!=="artwork";
    portalFields.hidden=record.type!=="portal";
    textFields.hidden=record.type!=="text";
    itemFields.published.checked=record.item.published!==false;itemFields.x.value=Math.round(record.item.x);itemFields.y.value=Math.round(record.item.y);
    if(record.type==="artwork"){itemFields.title.value=record.item.title||"";itemFields.path.value=record.item.image||"";itemFields.width.value=record.item.width||180;
      itemFields.depth.value=record.item.depth??9.4;
      itemFields.curve.value=record.item.curve??0;
      itemFields.rotationX.value=record.item.rotationX??0;
      itemFields.rotationY.value=record.item.rotationY??0;
      itemFields.rotationZ.value=record.item.rotationZ??0;
      itemFields.action.value=record.item.action||"zoom";itemFields.link.value=record.item.link||"";linkField.hidden=itemFields.action.value!=="link";inspectorTitle.textContent=`Obra: ${record.item.title||"Sin título"}`;
    }else if(record.type==="portal"){
      itemFields.portalLabel.value=record.item.label||"";
      itemFields.portalRoom.value=record.item.room||data.rooms[0]?.id||"";
      inspectorTitle.textContent=`Tránsito: ${record.item.label||"Sin etiqueta"}`;
    }else{
      itemFields.textHeading.value=record.item.heading||"";
      itemFields.textSubheading.value=record.item.subheading||"";
      itemFields.textDescription.value=record.item.description||"";
      itemFields.textWidth.value=record.item.width||440;
      itemFields.textAlign.value=record.item.align||"left";
      itemFields.textHeadingSize.value=record.item.headingSize||54;
      itemFields.textBodySize.value=record.item.bodySize||18;
      itemFields.textTheme.value=record.item.theme||"light";
      inspectorTitle.textContent=`Texto: ${record.item.heading||"Sin encabezado"}`;
    }
  }
  function syncSelected(){
    const record=selected(); if(!record)return null; record.item.published=itemFields.published.checked;
    if(record.type==="artwork"){
      record.item.title=cleanText(itemFields.title.value);
      record.item.image=cleanText(itemFields.path.value);
      record.item.width=clamp(Number(itemFields.width.value)||180,50,900);
      record.item.depth=clamp(Number(itemFields.depth.value)||9.4,4,20);
      record.item.curve=clamp(Number(itemFields.curve.value)||0,-0.8,0.8);
      record.item.rotationX=clamp(Number(itemFields.rotationX.value)||0,-90,90);
      record.item.rotationY=clamp(Number(itemFields.rotationY.value)||0,-180,180);
      record.item.rotationZ=clamp(Number(itemFields.rotationZ.value)||0,-180,180);
      record.item.action=itemFields.action.value==="link"?"link":"zoom";record.item.link=cleanText(itemFields.link.value);if(!record.item.title)throw new Error("El título de la obra es obligatorio.");if(!record.item.image)throw new Error("Selecciona o escribe la ruta de la imagen.");if(record.item.action==="link"&&!record.item.link)throw new Error("La obra necesita un enlace.");
    }else if(record.type==="portal"){
      record.item.label=cleanText(itemFields.portalLabel.value);
      record.item.room=itemFields.portalRoom.value;
      if(!record.item.label)throw new Error("La etiqueta del tránsito es obligatoria.");
      if(!record.item.room)throw new Error("Selecciona una sala de destino.");
    }else{
      record.item.heading=cleanText(itemFields.textHeading.value);
      record.item.subheading=cleanText(itemFields.textSubheading.value);
      record.item.description=cleanText(itemFields.textDescription.value);
      record.item.width=clamp(Number(itemFields.textWidth.value)||440,220,900);
      record.item.align=["left","center","right"].includes(itemFields.textAlign.value)?itemFields.textAlign.value:"left";
      record.item.headingSize=clamp(Number(itemFields.textHeadingSize.value)||54,24,120);
      record.item.bodySize=clamp(Number(itemFields.textBodySize.value)||18,12,36);
      record.item.theme=["light","dark","transparent"].includes(itemFields.textTheme.value)?itemFields.textTheme.value:"light";
      if(!record.item.heading)throw new Error("El encabezado es obligatorio.");
    }
    return record;
  }
  function render(){renderRoomOptions();syncRoomFields();renderStage();renderList();select(selectedKey);}
  async function addRoomFromFile(file){
    if(!file) return null;
    const suggested=roomNameFromFile(file);
    const requested=prompt("Nombre de la nueva sala:",suggested);
    if(requested===null) return null;
    const label=cleanText(requested)||suggested;

    setStatus("Preparando nueva sala…");
    const panorama=await uploadAsset(file,"panorama");
    const dimensions=await imageDimensions(assetURL(panorama));
    const id=uniqueRoomId(label);

    const value={
      id,
      label,
      panorama,
      alt:`Panorama de ${label}`,
      width:dimensions.width,
      height:dimensions.height,
      initialView:{
        x:Math.round(dimensions.width/2),
        y:Math.round(dimensions.height/2)
      },
      artworks:[],
      portals:[],
      texts:[]
    };

    data.rooms.push(value);
    currentRoomId=id;
    selectedKey="";
    render();
    markDirty(`Sala “${label}” agregada. Ya puedes añadir obras, textos y tránsitos.`);
    return value;
  }

  function duplicateRoom(){
    const source=room();
    if(!source) return null;

    const clone=JSON.parse(JSON.stringify(source));
    clone.id=uniqueRoomId(`${source.label}-copia`);
    clone.label=`${source.label} · copia`;

    for(const item of clone.artworks||[]) item.id=uid("obra");
    for(const item of clone.portals||[]) item.id=uid("transito");
    for(const item of clone.texts||[]) item.id=uid("texto");

    data.rooms.push(clone);
    currentRoomId=clone.id;
    selectedKey="";
    render();
    markDirty(`Sala “${clone.label}” duplicada.`);
    return clone;
  }

  function deleteRoom(){
    const value=room();
    if(!value) return false;
    if(data.rooms.length<=1){
      setStatus("La galería necesita conservar al menos una sala.");
      return false;
    }

    const incoming=[];
    for(const candidate of data.rooms){
      if(candidate.id===value.id) continue;
      for(const portal of candidate.portals||[]){
        if(portal.room===value.id) incoming.push({candidate,portal});
      }
    }

    const warning=incoming.length
      ? `\n\nTambién se eliminarán ${incoming.length} tránsito(s) que apuntan a esta sala.`
      : "";

    if(!confirm(`¿Eliminar la sala “${value.label}”?${warning}`)) return false;

    for(const {candidate,portal} of incoming){
      candidate.portals=candidate.portals.filter(item=>item.id!==portal.id);
    }

    data.rooms=data.rooms.filter(candidate=>candidate.id!==value.id);
    currentRoomId=data.rooms[0].id;
    selectedKey="";
    render();
    markDirty(`Sala “${value.label}” eliminada.`);
    return true;
  }

  function addArtwork(){const value=room();if(!value)return;const item={id:uid("obra"),title:"Nueva obra",image:"",x:Math.round(value.width/2),y:Math.round(value.height/2),width:180,depth:9.4,curve:0.12,rotationX:0,rotationY:0,rotationZ:0,action:"zoom",link:"",published:true};value.artworks.push(item);selectedKey=`artwork:${item.id}`;render();markDirty("Obra agregada. Selecciona su imagen y ubicación.");itemFields.title.select();}
  function addPortal(){const value=room();if(!value)return;const target=data.rooms.find(candidate=>candidate.id!==value.id)?.id||value.id;const item={id:uid("transito"),label:"Cambiar de sala",room:target,x:Math.round(value.width/2),y:Math.round(value.height/2),published:true};value.portals.push(item);selectedKey=`portal:${item.id}`;render();markDirty("Punto de tránsito agregado.");itemFields.portalLabel.select();}
  function addText(){const value=room();if(!value)return;const item={id:uid("texto"),heading:"Encabezado",subheading:"Subcabeza",description:"Escribe aquí la descripción editorial de la pieza.",x:Math.round(value.width/2),y:Math.round(value.height/2),width:440,align:"left",headingSize:54,bodySize:18,theme:"light",published:true};value.texts=value.texts||[];value.texts.push(item);selectedKey=`text:${item.id}`;render();markDirty("Texto editorial agregado. Arrástralo y edita su contenido.");itemFields.textHeading.select();}
  function removeItem(key){const record=allItems().find(value=>value.key===key);if(!record||!confirm(`¿Eliminar “${record.type==="artwork"?record.item.title:record.item.label}”?`))return;const value=room();if(record.type==="artwork")value.artworks=value.artworks.filter(item=>item.id!==record.item.id);else if(record.type==="portal")value.portals=value.portals.filter(item=>item.id!==record.item.id);else value.texts=value.texts.filter(item=>item.id!==record.item.id);selectedKey="";render();markDirty("Elemento eliminado.");}
  function duplicateSelected(){const record=selected();if(!record)return;const clone=JSON.parse(JSON.stringify(record.item));clone.id=uid(record.type==="artwork"?"obra":record.type==="portal"?"transito":"texto");clone.x=clamp(clone.x+40,0,room().width);clone.y=clamp(clone.y+25,0,room().height);if(record.type==="artwork"){clone.title=`${clone.title} · copia`;room().artworks.push(clone);}else if(record.type==="portal"){clone.label=`${clone.label} · copia`;room().portals.push(clone);}else{clone.heading=`${clone.heading} · copia`;room().texts.push(clone);}selectedKey=`${record.type}:${clone.id}`;render();markDirty("Elemento duplicado.");}
  async function uploadAsset(file,kind){
    if(!file)return;const ext=extensionFor(file);let path;
    if(kind==="panorama"){path=`public/panorama/galeria-${slugify(room().id)}.${ext}`;}else{path=`public/gallery/${slugify(itemFields.title.value||file.name.replace(/\.[^.]+$/, ""))}-${Math.random().toString(36).slice(2,8)}.${ext}`;}
    await GVPatches.savePatch(path,file);await refreshObjectURLs();return path;
  }
  function updateMeta(doc,selector,value){const node=doc.querySelector(selector);if(node)node.setAttribute("content",value);}
  function ensurePageStructure(doc){
    let style=doc.querySelector('link[href$="gallery-360.css"]');if(!style){style=doc.createElement("link");style.rel="stylesheet";style.href="src/css/gallery-360.css";doc.head.appendChild(style);}
    if(!doc.querySelector('script[type="importmap"]')){const script=doc.createElement("script");script.type="importmap";script.textContent=JSON.stringify({imports:{three:"https://unpkg.com/three@0.167.1/build/three.module.js",OrbitControls:"https://unpkg.com/three@0.167.1/examples/jsm/controls/OrbitControls.js"}},null,2);doc.head.appendChild(script);}
    let module=doc.querySelector('script[type="module"][src$="gallery-360.js"]');if(!module){module=doc.createElement("script");module.type="module";module.src="src/js/gallery-360.js";doc.body.appendChild(module);}
    return doc;
  }
  function loadPageFields(){const doc=new DOMParser().parseFromString(pageSource,"text/html");applyPageState({title:doc.querySelector("title")?.textContent?.trim()||"Imágenes · Carlos Adolfo Gutiérrez Vidal",description:doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim()||"",brand:doc.querySelector(".gallery-brand")?.textContent?.trim()||"Carlos Adolfo Gutiérrez Vidal",roomMenu:doc.querySelector("#room-menu")?.textContent?.trim()||"Salas",immersive:doc.querySelector("#toggle-shell")?.textContent?.trim()||"Vista inmersiva",help:doc.querySelector(".gallery-help")?.textContent?.trim()||"Arrastra para recorrer · toca una obra para ampliarla",footerLink:doc.querySelector(".gallery-footer-actions a")?.textContent?.trim()||"Portada",restore:doc.querySelector("#restore-shell")?.textContent?.trim()||"Menú"});}
  function buildPage(){
    const doc=ensurePageStructure(new DOMParser().parseFromString(pageSource,"text/html"));doc.title=cleanText(pageFields.title.value);updateMeta(doc,'meta[name="description"]',cleanText(pageFields.description.value));const canonical=doc.querySelector('link[rel="canonical"]');if(canonical)canonical.href="https://www.gutierrezvidal.com/imagenes.html";
    const assignments=[[".gallery-brand",pageFields.brand.value],["#room-menu",pageFields.roomMenu.value],["#toggle-shell",pageFields.immersive.value],[".gallery-help",pageFields.help.value],[".gallery-footer-actions a",pageFields.footerLink.value],["#restore-shell",pageFields.restore.value]];for(const [selector,value] of assignments){const node=doc.querySelector(selector);if(node)node.textContent=cleanText(value);}return `<!doctype html>\n${doc.documentElement.outerHTML}`;
  }
  function validate(){normalize();if(!data.rooms.length)throw new Error("La galería necesita al menos una sala.");for(const value of data.rooms){if(!value.panorama)throw new Error(`${value.label} no tiene panorama.`);for(const item of value.artworks){if(!item.title||!item.image)throw new Error(`Hay una obra incompleta en ${value.label}.`);}for(const portal of value.portals){if(!data.rooms.some(candidate=>candidate.id===portal.room))throw new Error(`El tránsito “${portal.label}” apunta a una sala inexistente.`);}for(const text of value.texts||[]){if(!text.heading)throw new Error(`Hay un texto editorial sin encabezado en ${value.label}.`);}}}
  function displayFiles(paths){savedFiles.replaceChildren();for(const path of paths){const li=document.createElement("li");li.textContent=path;savedFiles.appendChild(li);}savedDetails.hidden=!paths.length;}
  async function persist(){
    if(selected())syncSelected();room().label=cleanText(roomLabelInput.value)||room().label;room().alt=cleanText(panoramaAlt.value);validate();const serialized=JSON.stringify(data,null,2)+"\n";const html=buildPage();await GVPatches.savePatch("src/data/gallery.json",serialized);await GVPatches.savePatch("imagenes.html",html);const patches=await GVPatches.listPatches();if(!patches["src/data/gallery.json"]||!patches["imagenes.html"])throw new Error("No se guardaron los archivos principales de la galería.");const saved=JSON.parse(patches["src/data/gallery.json"] instanceof Blob?await patches["src/data/gallery.json"].text():String(patches["src/data/gallery.json"]));if(saved.rooms.length!==data.rooms.length)throw new Error("La verificación del JSON no coincide con las salas actuales.");pageSource=html;try{localStorage.removeItem(DRAFT_KEY);}catch{}dirty=false;const referenced=new Set(["src/data/gallery.json","imagenes.html"]);for(const value of data.rooms){referenced.add(value.panorama);for(const item of value.artworks)referenced.add(item.image);}const paths=Object.keys(patches).filter(path=>referenced.has(path));displayFiles(paths);return{serialized,html,patches,paths};
  }
  function prepareDownload(blob){if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(blob);readyDownload.href=downloadURL;readyDownload.download=`gutierrezvidal-galeria-${new Date().toISOString().slice(0,10)}.zip`;readyDownload.hidden=false;}
  async function buildZip(){const saved=await persist();const zip=new JSZip();zip.file("src/data/gallery.json",saved.serialized);zip.file("imagenes.html",saved.html);for(const path of saved.paths){if(path==="src/data/gallery.json"||path==="imagenes.html")continue;zip.file(path,saved.patches[path]);}zip.file("INSTRUCCIONES.txt","ACTUALIZACIÓN DE GALERÍA 360\n\nCopia estos archivos sobre la raíz del sitio existente.\n");const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});prepareDownload(blob);return saved;}

  addRoomButton.addEventListener("click",()=>newRoomPanorama.click());
  newRoomPanorama.addEventListener("change",async event=>{
    const file=event.target.files?.[0];
    event.target.value="";
    if(!file) return;
    addRoomButton.disabled=true;
    try{
      await addRoomFromFile(file);
    }catch(error){
      setStatus(`No se pudo agregar la sala: ${error.message}`);
    }finally{
      addRoomButton.disabled=false;
    }
  });
  duplicateRoomButton.addEventListener("click",duplicateRoom);
  deleteRoomButton.addEventListener("click",deleteRoom);

  roomSelect.addEventListener("change",()=>{if(room()){room().label=cleanText(roomLabelInput.value)||room().label;room().alt=cleanText(panoramaAlt.value);}currentRoomId=roomSelect.value;selectedKey="";render();markDirty("Sala seleccionada.");});
  roomLabelInput.addEventListener("input",()=>{const value=room();if(!value)return;value.label=roomLabelInput.value;const roomOption=roomSelect.querySelector(`option[value="${CSS.escape(value.id)}"]`);if(roomOption)roomOption.textContent=value.label;const portalOption=itemFields.portalRoom.querySelector(`option[value="${CSS.escape(value.id)}"]`);if(portalOption)portalOption.textContent=value.label;markDirty();});
  panoramaAlt.addEventListener("input",()=>{if(room())room().alt=panoramaAlt.value;markDirty();});
  panoramaFile.addEventListener("change",async event=>{const file=event.target.files?.[0];event.target.value="";if(!file)return;try{setStatus("Guardando panorama…");const path=await uploadAsset(file,"panorama");const value=room();value.panorama=path;const url=objectURLs.get(path);if(url){await new Promise(resolve=>{const img=new Image();img.onload=()=>{value.width=img.naturalWidth||1536;value.height=img.naturalHeight||768;resolve();};img.onerror=resolve;img.src=url;});}updateStageImage();markDirty(`Panorama preparado: ${path}`);}catch(error){setStatus(error.message);}});
  addArtworkButton.addEventListener("click",addArtwork);addPortalButton.addEventListener("click",addPortal);addTextButton.addEventListener("click",addText);
  form.addEventListener("submit",event=>{event.preventDefault();try{const record=syncSelected();render();select(record.key);markDirty("Cambios del elemento aplicados. Falta guardar la actualización.");}catch(error){setStatus(error.message);}});
  form.addEventListener("input",()=>{try{const record=syncSelected();renderList();const marker=stage.querySelector(`[data-key="${CSS.escape(record.key)}"]`);if(marker&&record.type==="artwork")marker.style.width=`${clamp(record.item.width*.55,70,230)}px`;markDirty();}catch{markDirty();}});
  itemFields.action.addEventListener("change",()=>{linkField.hidden=itemFields.action.value!=="link";});
  itemFields.file.addEventListener("change",async event=>{const file=event.target.files?.[0];event.target.value="";if(!file)return;try{setStatus("Guardando imagen de la obra…");const path=await uploadAsset(file,"artwork");itemFields.path.value=path;syncSelected();render();select(selectedKey);markDirty(`Imagen preparada: ${path}`);}catch(error){setStatus(error.message);}});
  $("#gallery-delete-item").addEventListener("click",()=>selectedKey&&removeItem(selectedKey));$("#gallery-duplicate-item").addEventListener("click",duplicateSelected);
  for(const field of Object.values(pageFields))field.addEventListener("input",()=>markDirty());
  saveButton.addEventListener("click",async()=>{saveButton.disabled=saveDownloadButton.disabled=true;setStatus("Guardando Galería 360…");try{const saved=await persist();setStatus(`Galería guardada en ${saved.paths.join(", ")}.`);}catch(error){setStatus(`No se guardó: ${error.message}`);}finally{saveButton.disabled=saveDownloadButton.disabled=false;}});
  saveDownloadButton.addEventListener("click",async()=>{saveButton.disabled=saveDownloadButton.disabled=true;setStatus("Guardando y preparando ZIP…");try{await buildZip();setStatus("ZIP preparado. Si no inició la descarga, pulsa «Descargar ZIP preparado».");readyDownload.click();}catch(error){setStatus(`No se pudo guardar: ${error.message}`);}finally{saveButton.disabled=saveDownloadButton.disabled=false;}});
  window.addEventListener("beforeunload",event=>{if(!dirty)return;event.preventDefault();event.returnValue="";});
  window.addEventListener("unload",revokeURLs);
  window.GVGalleryEditor={getData:()=>JSON.parse(JSON.stringify(data)),addRoomFromFile,duplicateRoom,deleteRoom,addArtwork,addPortal,addText,select,removeItem,persist};

  async function load(){
    try{await refreshObjectURLs();pageSource=await GVPatches.getFile("imagenes.html");loadPageFields();const workspace=await GVPatches.status();const draft=readDraft();const draftTime=draft?.savedAt?Date.parse(draft.savedAt):0;const workspaceTime=workspace.updatedAt?Date.parse(workspace.updatedAt):0;if(draft?.data&&draftTime>workspaceTime){data=draft.data;applyPageState(draft.page||{});currentRoomId=draft.currentRoomId||data.rooms?.[0]?.id||"";selectedKey=draft.selectedKey||"";setStatus(`Borrador local recuperado (${new Date(draft.savedAt).toLocaleString("es-MX")}).`);}else{data=JSON.parse(await GVPatches.getFile("src/data/gallery.json"));currentRoomId=data.rooms?.[0]?.id||"";}normalize();render();setStatus(`${data.rooms.length} salas cargadas. Selecciona una obra o agrega un hotspot.`);}catch(error){setStatus(`No se pudo cargar la galería: ${error.message}`);addRoomButton.disabled=duplicateRoomButton.disabled=deleteRoomButton.disabled=addArtworkButton.disabled=addPortalButton.disabled=addTextButton.disabled=saveButton.disabled=saveDownloadButton.disabled=true;}
  }
  load();
})();