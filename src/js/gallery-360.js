import * as THREE from "three";
import {OrbitControls} from "OrbitControls";

const viewer = document.querySelector("#gallery-viewer");
const overlay = document.querySelector("#gallery-overlay");
const roomLabel = document.querySelector("#room-label");
const roomPicker = document.querySelector("#room-picker");
const artDialog = document.querySelector("#art-dialog");
const artImage = document.querySelector("#art-image");
const artTitle = document.querySelector("#art-title");

const response = await fetch("src/data/gallery.json", {cache:"no-store"});
if (!response.ok) throw new Error("No se pudo cargar gallery.json");
const data = await response.json();
const rooms = new Map(data.rooms.map(room => [room.id, room]));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(78, 1, .1, 1100);
camera.position.set(0,0,.1);
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
viewer.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = true;
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.rotateSpeed = .42;
controls.minDistance = .1;
controls.maxDistance = .1;

const geometry = new THREE.SphereGeometry(500, 96, 64);
geometry.scale(-1,1,1);
const material = new THREE.MeshBasicMaterial({side:THREE.FrontSide});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

let room = null;
let items = [];
let texture = null;
const projected = new THREE.Vector3();
const cameraSpace = new THREE.Vector3();

function pixelToVector(x,y,width=1536,height=768,radius=10){
  const phi=(x/width)*Math.PI*2;
  const theta=(y/height)*Math.PI;
  const sin=Math.sin(theta);
  return new THREE.Vector3(radius*Math.cos(phi)*sin,radius*Math.cos(theta),radius*Math.sin(phi)*sin);
}

function createArtwork(item){
  const button=document.createElement("button");
  button.type="button";
  button.className="gallery-artwork";
  button.style.width=`${item.width || 180}px`;
  const image=document.createElement("img");
  image.src=item.image;
  image.alt=item.title || "Obra visual";
  image.draggable=false;
  button.appendChild(image);
  button.addEventListener("click",()=>{
    if(item.action === "link" && item.link){
      window.open(item.link,"_blank","noopener");
      return;
    }
    artImage.src=item.image;
    artImage.alt=item.title || "Obra visual";
    artTitle.textContent=item.title || "Obra visual";
    artDialog.showModal();
  });
  overlay.appendChild(button);
  return {element:button,position:pixelToVector(item.x,item.y)};
}

function createPortal(item){
  const button=document.createElement("button");
  button.type="button";
  button.className="gallery-portal";
  button.textContent=item.label;
  button.addEventListener("click",()=>loadRoom(item.room));
  overlay.appendChild(button);
  return {element:button,position:pixelToVector(item.x,item.y)};
}

async function loadRoom(id){
  const next=rooms.get(id);
  if(!next) return;
  room=next;
  roomLabel.textContent=next.label;
  overlay.replaceChildren();
  items=[
    ...(next.artworks||[]).filter(item=>item.published!==false).map(createArtwork),
    ...(next.portals||[]).filter(item=>item.published!==false).map(createPortal)
  ];
  const loaded=await new THREE.TextureLoader().loadAsync(next.panorama);
  loaded.colorSpace=THREE.SRGBColorSpace;
  loaded.minFilter=THREE.LinearFilter;
  if(texture) texture.dispose();
  texture=loaded;
  material.map=texture;
  material.needsUpdate=true;
  controls.target.copy(pixelToVector(next.initialView?.x ?? 768,next.initialView?.y ?? 384,1536,768,1));
  controls.update();
}

function updateItems(){
  const rect=viewer.getBoundingClientRect();
  camera.updateMatrixWorld();
  for(const item of items){
    cameraSpace.copy(item.position).applyMatrix4(camera.matrixWorldInverse);
    projected.copy(item.position).project(camera);
    const visible=cameraSpace.z<-.01 && projected.z>=-1 && projected.z<=1 &&
      projected.x>=-1.1 && projected.x<=1.1 && projected.y>=-1.1 && projected.y<=1.1;
    item.element.hidden=!visible;
    if(!visible) continue;
    const x=(projected.x*.5+.5)*rect.width;
    const y=(-projected.y*.5+.5)*rect.height;
    const scale=Math.max(.48,Math.min(1.18,1.05-projected.z*.12));
    item.element.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${scale})`;
  }
}

function resize(){
  const rect=viewer.getBoundingClientRect();
  camera.aspect=rect.width/rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width,rect.height,false);
}
new ResizeObserver(resize).observe(viewer);

function animate(){
  controls.update();
  renderer.render(scene,camera);
  updateItems();
  requestAnimationFrame(animate);
}
animate();

for(const room of data.rooms){
  const button=document.createElement("button");
  button.type="button";
  button.textContent=room.label;
  button.addEventListener("click",()=>{roomPicker.hidden=true;loadRoom(room.id);});
  roomPicker.appendChild(button);
}

document.querySelector("#room-menu").addEventListener("click",()=>roomPicker.hidden=!roomPicker.hidden);
document.querySelector("#toggle-shell").addEventListener("click",()=>{
  document.body.classList.add("shell-hidden");
  document.querySelector("#restore-shell").hidden=false;
});
document.querySelector("#restore-shell").addEventListener("click",()=>{
  document.body.classList.remove("shell-hidden");
  document.querySelector("#restore-shell").hidden=true;
});
document.querySelector("#toggle-footer").addEventListener("click",()=>{
  document.querySelector("#gallery-footer").style.transform="translateY(110%)";
});
document.querySelector("#art-close").addEventListener("click",()=>artDialog.close());
artDialog.addEventListener("click",event=>{
  const rect=artDialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) artDialog.close();
});

await loadRoom(data.rooms[0].id);
