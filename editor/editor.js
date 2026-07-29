const IMAGE_WIDTH=1774;
const IMAGE_HEIGHT=887;

const stage=document.querySelector("#stage");
const markersLayer=document.querySelector("#markers");
const fields=document.querySelector("#fields");
const status=document.querySelector("#status");
const saveButton=document.querySelector("#save");
const resetButton=document.querySelector("#reset");
const downloadButton=document.querySelector("#download");

let hotspots=[];

async function load(){
  const response=await fetch("../src/data/hotspots.json",{cache:"no-store"});
  if(!response.ok) throw new Error(`No se pudo cargar hotspots.json: ${response.status}`);
  hotspots=await response.json();
  render();
  setStatus("Datos cargados.");
}

function render(){
  markersLayer.replaceChildren();
  fields.replaceChildren();

  hotspots.forEach((hotspot,index)=>{
    const marker=document.createElement("button");
    marker.type="button";
    marker.className="marker";
    marker.textContent=hotspot.label;
    marker.dataset.index=String(index);
    positionMarker(marker,hotspot);
    attachDrag(marker,index);
    markersLayer.appendChild(marker);

    const row=document.createElement("div");
    row.className="field";
    row.innerHTML=`
      <label for="label-${index}">${escapeHtml(hotspot.label)}</label>
      <input id="x-${index}" inputmode="numeric" aria-label="Coordenada X" value="${hotspot.imageX}">
      <input id="y-${index}" inputmode="numeric" aria-label="Coordenada Y" value="${hotspot.imageY}">
      <input id="url-${index}" class="url" aria-label="Ruta" value="${escapeAttribute(hotspot.url)}">
    `;
    fields.appendChild(row);

    const x=row.querySelector(`#x-${index}`);
    const y=row.querySelector(`#y-${index}`);
    const url=row.querySelector(`#url-${index}`);

    const updateFromInputs=()=>{
      hotspot.imageX=clamp(Math.round(Number(x.value)||0),0,IMAGE_WIDTH);
      hotspot.imageY=clamp(Math.round(Number(y.value)||0),0,IMAGE_HEIGHT);
      hotspot.url=url.value.trim();
      x.value=hotspot.imageX;
      y.value=hotspot.imageY;
      positionMarker(marker,hotspot);
    };
    x.addEventListener("change",updateFromInputs);
    y.addEventListener("change",updateFromInputs);
    url.addEventListener("change",updateFromInputs);
  });
}

function positionMarker(marker,hotspot){
  marker.style.left=`${hotspot.imageX/IMAGE_WIDTH*100}%`;
  marker.style.top=`${hotspot.imageY/IMAGE_HEIGHT*100}%`;
}

function attachDrag(marker,index){
  marker.addEventListener("pointerdown",event=>{
    event.preventDefault();
    marker.setPointerCapture(event.pointerId);

    const move=moveEvent=>{
      const rect=stage.getBoundingClientRect();
      const x=clamp(moveEvent.clientX-rect.left,0,rect.width);
      const y=clamp(moveEvent.clientY-rect.top,0,rect.height);

      hotspots[index].imageX=Math.round(x/rect.width*IMAGE_WIDTH);
      hotspots[index].imageY=Math.round(y/rect.height*IMAGE_HEIGHT);

      positionMarker(marker,hotspots[index]);

      const xInput=document.querySelector(`#x-${index}`);
      const yInput=document.querySelector(`#y-${index}`);
      xInput.value=hotspots[index].imageX;
      yInput.value=hotspots[index].imageY;
      setStatus(`${hotspots[index].label}: ${hotspots[index].imageX}, ${hotspots[index].imageY}`);
    };

    const up=()=>{
      marker.removeEventListener("pointermove",move);
      marker.removeEventListener("pointerup",up);
      marker.removeEventListener("pointercancel",up);
    };

    marker.addEventListener("pointermove",move);
    marker.addEventListener("pointerup",up);
    marker.addEventListener("pointercancel",up);
  });
}

saveButton.addEventListener("click",async()=>{
  saveButton.disabled=true;
  try{
    const response=await fetch("/api/hotspots",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(hotspots)
    });
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||"No fue posible guardar.");
    setStatus("Guardado en src/data/hotspots.json.");
  }catch(error){
    setStatus(`Error: ${error.message}`,true);
  }finally{
    saveButton.disabled=false;
  }
});

resetButton.addEventListener("click",()=>load().catch(error=>setStatus(error.message,true)));

downloadButton.addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(hotspots,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="hotspots.json";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("hotspots.json descargado.");
});

function setStatus(message,isError=false){
  status.textContent=message;
  status.style.color=isError?"#8a2525":"#315b31";
}
function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}
function escapeAttribute(value){return escapeHtml(value);}
load().catch(error=>setStatus(error.message,true));
