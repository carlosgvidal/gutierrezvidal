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

const renderer = new THREE.WebGLRenderer({
  antialias:true,
  alpha:false,
  powerPreference:"high-performance"
});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.domElement.style.touchAction = "none";
viewer.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = true;
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.rotateSpeed = .42;
controls.minDistance = .1;
controls.maxDistance = .1;

const sphereGeometry = new THREE.SphereGeometry(500, 96, 64);
sphereGeometry.scale(-1,1,1);
const sphereMaterial = new THREE.MeshBasicMaterial({side:THREE.FrontSide});
scene.add(new THREE.Mesh(sphereGeometry, sphereMaterial));

const artworkGroup = new THREE.Group();
scene.add(artworkGroup);

let room = null;
let portals = [];
let editorialTexts = [];
let panoramaTexture = null;
let artworkMeshes = [];
const projected = new THREE.Vector3();
const cameraSpace = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const textureLoader = new THREE.TextureLoader();
let pointerStart = null;

const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const number = (value,fallback=0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const deg = value => THREE.MathUtils.degToRad(number(value,0));

function pixelToVector(x,y,width=1536,height=768,radius=10){
  const phi=(number(x,width/2)/width)*Math.PI*2;
  const theta=(number(y,height/2)/height)*Math.PI;
  const sin=Math.sin(theta);
  return new THREE.Vector3(
    radius*Math.cos(phi)*sin,
    radius*Math.cos(theta),
    radius*Math.sin(phi)*sin
  );
}

function curvedPlane(width,height,curve){
  const segments = 32;
  const geometry = new THREE.PlaneGeometry(width,height,segments,1);
  const position = geometry.attributes.position;
  const half = Math.max(width/2,.0001);
  const bend = number(curve,0);

  for(let index=0; index<position.count; index++){
    const x = position.getX(index);
    const normalized = x / half;
    // Positive curvature bends the edges away from the viewer,
    // following the concavity of the panoramic wall.
    const z = -bend * normalized * normalized;
    position.setZ(index,z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function disposeArtworkMeshes(){
  for(const mesh of artworkMeshes){
    mesh.geometry?.dispose();
    mesh.material?.map?.dispose();
    mesh.material?.dispose();
    mesh.userData.backing?.geometry?.dispose();
    mesh.userData.backing?.material?.dispose();
  }
  artworkMeshes = [];
  artworkGroup.clear();
}

async function createArtworkMesh(item, currentRoom){
  const texture = await textureLoader.loadAsync(item.image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const sourceWidth = texture.image?.naturalWidth || texture.image?.width || 1;
  const sourceHeight = texture.image?.naturalHeight || texture.image?.height || 1;
  const aspect = sourceWidth / Math.max(sourceHeight,1);

  const widthWorld = clamp(number(item.width,180) / 88, .55, 10);
  const heightWorld = widthWorld / Math.max(aspect,.05);
  const curve = clamp(number(item.curve,0), -.8, .8);
  const geometry = curvedPlane(widthWorld,heightWorld,curve);

  const material = new THREE.MeshBasicMaterial({
    map:texture,
    transparent:true,
    side:THREE.DoubleSide,
    toneMapped:false
  });

  const mesh = new THREE.Mesh(geometry,material);
  const radius = clamp(number(item.depth,9.4),4,20);
  mesh.position.copy(pixelToVector(
    item.x,item.y,
    currentRoom.width || 1536,
    currentRoom.height || 768,
    radius
  ));

  // Orient the image toward the visitor, then allow local corrections.
  mesh.lookAt(0,0,0);
  mesh.rotateX(deg(item.rotationX));
  mesh.rotateY(deg(item.rotationY));
  mesh.rotateZ(deg(item.rotationZ));
  mesh.renderOrder = 10;
  mesh.userData.artwork = item;

  // A very thin backing plane gives the work a physical edge without CSS shadows.
  const backingGeometry = curvedPlane(widthWorld*1.045,heightWorld*1.055,curve);
  const backingMaterial = new THREE.MeshBasicMaterial({
    color:0xFAF9F6,
    side:THREE.DoubleSide,
    toneMapped:false
  });
  const backing = new THREE.Mesh(backingGeometry,backingMaterial);
  backing.position.z = -.015;
  backing.renderOrder = 9;
  mesh.add(backing);
  mesh.userData.backing = backing;

  artworkGroup.add(mesh);
  artworkMeshes.push(mesh);
}

function createPortal(item,currentRoom){
  const button=document.createElement("button");
  button.type="button";
  button.className="gallery-portal";
  button.textContent=item.label;
  button.addEventListener("click",()=>loadRoom(item.room));
  overlay.appendChild(button);
  return {
    element:button,
    position:pixelToVector(
      item.x,item.y,
      currentRoom.width || 1536,
      currentRoom.height || 768
    )
  };
}

function createEditorialText(item,currentRoom){
  const article=document.createElement("article");
  article.className=`gallery-editorial-hotspot gallery-editorial-hotspot--${item.theme || "light"}`;
  article.style.width=`${clamp(number(item.width,440),220,900)}px`;
  article.style.textAlign=["left","center","right"].includes(item.align)?item.align:"left";
  article.style.setProperty("--gallery-heading-size",`${clamp(number(item.headingSize,54),24,120)}px`);
  article.style.setProperty("--gallery-body-size",`${clamp(number(item.bodySize,18),12,36)}px`);

  const heading=document.createElement("h2");
  heading.textContent=item.heading || "";
  article.appendChild(heading);

  if(item.subheading){
    const subheading=document.createElement("p");
    subheading.className="gallery-editorial-hotspot__subheading";
    subheading.textContent=item.subheading;
    article.appendChild(subheading);
  }

  if(item.description){
    const description=document.createElement("p");
    description.className="gallery-editorial-hotspot__description";
    description.textContent=item.description;
    article.appendChild(description);
  }

  overlay.appendChild(article);
  return {
    element:article,
    position:pixelToVector(
      item.x,item.y,
      currentRoom.width || 1536,
      currentRoom.height || 768
    )
  };
}

function openArtwork(item){
  if(item.action === "link" && item.link){
    window.open(item.link,"_blank","noopener");
    return;
  }
  artImage.src=item.image;
  artImage.alt=item.title || "Obra visual";
  artTitle.textContent=item.title || "Obra visual";
  artDialog.showModal();
}

async function loadRoom(id){
  const next=rooms.get(id);
  if(!next) return;

  room=next;
  roomLabel.textContent=next.label;
  overlay.replaceChildren();
  portals=(next.portals||[])
    .filter(item=>item.published!==false)
    .map(item=>createPortal(item,next));
  editorialTexts=(next.texts||[])
    .filter(item=>item.published!==false)
    .map(item=>createEditorialText(item,next));

  disposeArtworkMeshes();
  const publishedArtworks=(next.artworks||[]).filter(item=>item.published!==false);
  await Promise.all(publishedArtworks.map(item=>createArtworkMesh(item,next)));

  const loaded=await textureLoader.loadAsync(next.panorama);
  loaded.colorSpace=THREE.SRGBColorSpace;
  loaded.minFilter=THREE.LinearFilter;
  loaded.magFilter=THREE.LinearFilter;
  if(panoramaTexture) panoramaTexture.dispose();
  panoramaTexture=loaded;
  sphereMaterial.map=panoramaTexture;
  sphereMaterial.needsUpdate=true;

  controls.target.copy(pixelToVector(
    next.initialView?.x ?? (next.width||1536)/2,
    next.initialView?.y ?? (next.height||768)/2,
    next.width||1536,
    next.height||768,
    1
  ));
  controls.update();
}

function updatePortals(){
  const rect=viewer.getBoundingClientRect();
  camera.updateMatrixWorld();

  for(const item of [...portals,...editorialTexts]){
    cameraSpace.copy(item.position).applyMatrix4(camera.matrixWorldInverse);
    projected.copy(item.position).project(camera);
    const visible=cameraSpace.z<-.01 && projected.z>=-1 && projected.z<=1 &&
      projected.x>=-1.1 && projected.x<=1.1 &&
      projected.y>=-1.1 && projected.y<=1.1;

    item.element.hidden=!visible;
    if(!visible) continue;

    const x=(projected.x*.5+.5)*rect.width;
    const y=(-projected.y*.5+.5)*rect.height;
    const scale=Math.max(.48,Math.min(1.18,1.05-projected.z*.12));
    item.element.style.transform=
      `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${scale})`;
  }
}

function resize(){
  const rect=viewer.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  camera.aspect=rect.width/rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width,rect.height,false);
}
new ResizeObserver(resize).observe(viewer);

function artworkAtEvent(event){
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(artworkMeshes,false);
  return hits[0]?.object?.userData?.artwork || null;
}

renderer.domElement.addEventListener("pointerdown",event=>{
  pointerStart={x:event.clientX,y:event.clientY};
});

renderer.domElement.addEventListener("pointerup",event=>{
  if(!pointerStart) return;
  const movement=Math.hypot(
    event.clientX-pointerStart.x,
    event.clientY-pointerStart.y
  );
  pointerStart=null;
  if(movement>7) return;
  const item=artworkAtEvent(event);
  if(item) openArtwork(item);
});

function animate(){
  controls.update();
  renderer.render(scene,camera);
  updatePortals();
  requestAnimationFrame(animate);
}
animate();

for(const room of data.rooms){
  const button=document.createElement("button");
  button.type="button";
  button.textContent=room.label;
  button.addEventListener("click",()=>{
    roomPicker.hidden=true;
    loadRoom(room.id);
  });
  roomPicker.appendChild(button);
}

document.querySelector("#room-menu").addEventListener("click",()=>{
  roomPicker.hidden=!roomPicker.hidden;
});
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
  if(
    event.clientX<rect.left || event.clientX>rect.right ||
    event.clientY<rect.top || event.clientY>rect.bottom
  ) artDialog.close();
});

await loadRoom(data.rooms[0].id);
