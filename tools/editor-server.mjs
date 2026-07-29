import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(__dirname,"..");
const HOTSPOTS_PATH=path.join(ROOT,"src","data","hotspots.json");
const PORT=4321;

const TYPES={
  ".html":"text/html; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".png":"image/png",
  ".svg":"image/svg+xml"
};

function send(response,status,body,type="text/plain; charset=utf-8"){
  response.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store"});
  response.end(body);
}

function validateHotspots(value){
  if(!Array.isArray(value)) throw new Error("El contenido debe ser una lista.");
  for(const hotspot of value){
    if(!hotspot||typeof hotspot!=="object") throw new Error("Hotspot inválido.");
    if(typeof hotspot.id!=="string"||!hotspot.id.trim()) throw new Error("Falta id.");
    if(typeof hotspot.label!=="string"||!hotspot.label.trim()) throw new Error("Falta label.");
    if(typeof hotspot.url!=="string"||!hotspot.url.trim()) throw new Error("Falta url.");
    if(!Number.isFinite(hotspot.imageX)||hotspot.imageX<0||hotspot.imageX>1774) throw new Error("imageX fuera de rango.");
    if(!Number.isFinite(hotspot.imageY)||hotspot.imageY<0||hotspot.imageY>887) throw new Error("imageY fuera de rango.");
  }
}

const server=http.createServer(async(request,response)=>{
  try{
    const url=new URL(request.url,`http://${request.headers.host}`);

    if(request.method==="POST"&&url.pathname==="/api/hotspots"){
      let body="";
      for await(const chunk of request){
        body+=chunk;
        if(body.length>100_000) throw new Error("Solicitud demasiado grande.");
      }
      const hotspots=JSON.parse(body);
      validateHotspots(hotspots);
      await fs.writeFile(HOTSPOTS_PATH,JSON.stringify(hotspots,null,2)+"\n","utf8");
      send(response,200,JSON.stringify({ok:true}),"application/json; charset=utf-8");
      return;
    }

    let pathname=decodeURIComponent(url.pathname);
    if(pathname==="/") pathname="/editor/";
    if(pathname.endsWith("/")) pathname+="index.html";

    const filePath=path.resolve(ROOT,"."+pathname);
    if(!filePath.startsWith(ROOT+path.sep)) {
      send(response,403,"Acceso denegado.");
      return;
    }

    const data=await fs.readFile(filePath);
    const type=TYPES[path.extname(filePath).toLowerCase()]||"application/octet-stream";
    send(response,200,data,type);
  }catch(error){
    if(error.code==="ENOENT"){
      send(response,404,"Archivo no encontrado.");
      return;
    }
    send(response,500,JSON.stringify({error:error.message}),"application/json; charset=utf-8");
  }
});

server.listen(PORT,"127.0.0.1",()=>{
  console.log(`Editor: http://127.0.0.1:${PORT}/editor/`);
  console.log(`Sitio:  http://127.0.0.1:${PORT}/index.html`);
});
