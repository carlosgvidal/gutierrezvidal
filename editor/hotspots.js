(() => {
  "use strict";
  const IMAGE_WIDTH=1774,IMAGE_HEIGHT=887;
  const stage=document.querySelector("#hotspot-stage"),status=document.querySelector("#hotspot-status");
  const saveButton=document.querySelector("#download-hotspots");
  let hotspots=[],dirty=false;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  function place(el,h){el.style.left=`${h.imageX/IMAGE_WIDTH*100}%`;el.style.top=`${h.imageY/IMAGE_HEIGHT*100}%`}
  function attach(el,h){
    el.addEventListener("pointerdown",event=>{
      event.preventDefault();el.setPointerCapture(event.pointerId);
      const move=e=>{
        const rect=stage.getBoundingClientRect();
        h.imageX=Math.round(clamp(e.clientX-rect.left,0,rect.width)/rect.width*IMAGE_WIDTH);
        h.imageY=Math.round(clamp(e.clientY-rect.top,0,rect.height)/rect.height*IMAGE_HEIGHT);
        place(el,h);dirty=true;status.textContent=`${h.label}: x ${h.imageX}, y ${h.imageY}. Cambios sin guardar.`;
      };
      const end=()=>{el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",end);el.removeEventListener("pointercancel",end)};
      el.addEventListener("pointermove",move);el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);
    });
  }
  function render(){
    stage.querySelectorAll(".hotspot-marker").forEach(n=>n.remove());
    hotspots.forEach(h=>{
      const b=document.createElement("button");b.type="button";b.className="hotspot-marker";b.textContent=h.label;
      b.setAttribute("aria-label",`Mover hotspot ${h.label}`);place(b,h);attach(b,h);stage.appendChild(b);
    });
    status.textContent=`${hotspots.length} hotspots cargados del sitio actual.`;
  }
  async function load(){
    try{
      hotspots=JSON.parse(await GVPatches.getFile("src/data/hotspots.json"));
      if(!Array.isArray(hotspots))throw new Error("Formato de hotspots inválido.");
      render();
    }catch(e){status.textContent=e.message;saveButton.disabled=true}
  }
  saveButton.addEventListener("click",async()=>{
    saveButton.disabled=true;status.textContent="Guardando hotspots en la actualización…";
    try{
      await GVPatches.savePatch("src/data/hotspots.json",JSON.stringify(hotspots,null,2)+"\n");
      dirty=false;status.textContent="Hotspots añadidos al paquete de actualización.";
    }catch(e){status.textContent=e.message}
    finally{saveButton.disabled=false}
  });
  window.addEventListener("beforeunload",event=>{if(!dirty)return;event.preventDefault();event.returnValue=""});
  load();
})();