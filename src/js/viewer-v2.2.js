import * as THREE from "three";
import {OrbitControls} from "OrbitControls";

const PANORAMA_WIDTH = 1774;
const PANORAMA_HEIGHT = 887;
const SPHERE_RADIUS = 500;
const HOTSPOT_RADIUS = 10;
const viewer = document.querySelector("#viewer");

function hotspotIcon(name){
  const icons={
    document:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4V20.5H6z"/><path d="M14 3.5v4h4"/><path d="M9 12h6M9 15.5h6"/></svg>`,
    note:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14v15H5z"/><path d="M8 8h8M8 11.5h8M8 15h5"/></svg>`,
    sound:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9c1.3 1.6 1.3 4.4 0 6M18.5 6.5c3 3.1 3 7.9 0 11"/></svg>`,
    grid:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>`,
    diamond:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 20.5 12 12 20.5 3.5 12z"/><path d="M7.5 8.5h9l-4.5 8z"/></svg>`,
    image:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><circle cx="9" cy="10" r="1.5"/><path d="m6 17 4.5-4 3 2.5 2-2 2.5 3.5"/></svg>`,
    archive:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14v13H5z"/><path d="M4 4h16v3H4zM9 11h6"/></svg>`,
    profile:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.8-4.1 3-6 6.5-6s5.7 1.9 6.5 6"/></svg>`,
    point:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/></svg>`
  };
  return icons[name]||icons.point;
}


function panoramaPixelToVector(imageX,imageY,radius){
  const u=imageX/PANORAMA_WIDTH;
  const v=imageY/PANORAMA_HEIGHT;
  const phi=u*Math.PI*2;
  const theta=v*Math.PI;
  const sinTheta=Math.sin(theta);
  return new THREE.Vector3(
    radius*Math.cos(phi)*sinTheta,
    radius*Math.cos(theta),
    radius*Math.sin(phi)*sinTheta
  );
}

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(78,1,.1,1100);
camera.position.set(0,0,.1);

const renderer=new THREE.WebGLRenderer({
  antialias:true,
  alpha:false,
  premultipliedAlpha:false,
  powerPreference:"high-performance"
});
renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
renderer.toneMapping=THREE.NoToneMapping;
renderer.setClearColor(0x000000,1);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
viewer.appendChild(renderer.domElement);
renderer.domElement.style.touchAction="none";
renderer.domElement.style.userSelect="none";
renderer.domElement.style.webkitUserSelect="none";
renderer.domElement.setAttribute("aria-label","Panorama interactivo. Arrastra para recorrer el estudio.");

const controls=new OrbitControls(camera,renderer.domElement);
controls.enablePan=false;
controls.enableZoom=false;
controls.enableDamping=true;
controls.dampingFactor=.06;
controls.rotateSpeed=.42;
controls.minPolarAngle=.42;
controls.maxPolarAngle=2.72;
controls.mouseButtons.LEFT=THREE.MOUSE.ROTATE;
controls.touches.ONE=THREE.TOUCH.ROTATE;
controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;

// En pantallas estrechas no conviene iniciar frente al retrato,
// porque el recorte horizontal produce un primer plano extremo.
// La vista inicial apunta hacia la biblioteca y la mesa de trabajo.
const INITIAL_VIEW={imageX:890,imageY:445};
controls.target.copy(
  panoramaPixelToVector(INITIAL_VIEW.imageX,INITIAL_VIEW.imageY,1)
);
controls.update();

const geometry=new THREE.SphereGeometry(SPHERE_RADIUS,96,64);
geometry.scale(-1,1,1);

const texture=await new THREE.TextureLoader().loadAsync("public/panorama/portada.jpg");
texture.colorSpace=THREE.NoColorSpace;
texture.minFilter=THREE.LinearFilter;
texture.magFilter=THREE.LinearFilter;
texture.generateMipmaps=false;

const material=new THREE.RawShaderMaterial({
  uniforms:{panorama:{value:texture}},
  vertexShader:`
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
  `,
  fragmentShader:`
    precision highp float;
    uniform sampler2D panorama;
    varying vec2 vUv;
    void main(){gl_FragColor=texture2D(panorama,vUv);}
  `,
  depthWrite:false,
  depthTest:false,
  toneMapped:false
});
scene.add(new THREE.Mesh(geometry,material));

const response=await fetch("src/data/hotspots.json",{cache:"no-store"});
const defs=await response.json();

const hotspots=defs.map(def=>{
  const el=document.createElement("a");
  el.className="hotspot";
  el.href=def.url;
  el.innerHTML=`<span class="hotspot-icon">${hotspotIcon(def.icon)}</span><span class="hotspot-label">${def.label}</span><span class="hotspot-arrow" aria-hidden="true">→</span>`;
  viewer.appendChild(el);
  return {
    element:el,
    position:panoramaPixelToVector(def.imageX,def.imageY,HOTSPOT_RADIUS)
  };
});

const projected=new THREE.Vector3();
const cameraDirection=new THREE.Vector3();
const normalized=new THREE.Vector3();

function responsiveFov(aspect){
  // Mantiene un campo horizontal amplio en orientación vertical.
  // PerspectiveCamera usa FOV vertical, por lo que debe crecer
  // cuando la pantalla es más alta que ancha.
  if(aspect<.82) return 112;
  if(aspect<1.05) return 96;
  return 78;
}

function resize(){
  const rect=viewer.getBoundingClientRect();
  if(!rect.width||!rect.height) return;
  camera.aspect=rect.width/rect.height;
  camera.fov=responsiveFov(camera.aspect);
  camera.updateProjectionMatrix();
  renderer.setSize(Math.round(rect.width),Math.round(rect.height),false);
}
renderer.domElement.addEventListener("touchmove",event=>{
  if(event.cancelable) event.preventDefault();
},{passive:false});

renderer.domElement.addEventListener("contextmenu",event=>event.preventDefault());

new ResizeObserver(resize).observe(viewer);
resize();

function updateHotspots(){
  const rect=viewer.getBoundingClientRect();
  camera.getWorldDirection(cameraDirection);

  for(const hotspot of hotspots){
    normalized.copy(hotspot.position).normalize();
    const visible=cameraDirection.dot(normalized)>.08;
    hotspot.element.hidden=!visible;
    if(!visible) continue;

    projected.copy(hotspot.position).project(camera);
    hotspot.element.style.left=`${(projected.x*.5+.5)*rect.width}px`;
    hotspot.element.style.top=`${(-projected.y*.5+.5)*rect.height}px`;
  }
}

function render(){
  controls.update();
  updateHotspots();
  renderer.render(scene,camera);
  requestAnimationFrame(render);
}
render();
