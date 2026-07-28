import * as THREE from "three";
import {OrbitControls} from "OrbitControls";

const viewer=document.querySelector("#viewer");
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,1100);
camera.position.set(0,0,.1);

const renderer=new THREE.WebGLRenderer({
  antialias:true,
  alpha:false,
  premultipliedAlpha:false,
  powerPreference:"high-performance"
});
renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
renderer.toneMapping=THREE.NoToneMapping;
renderer.toneMappingExposure=1;
renderer.setClearColor(0x000000,1);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight,false);
viewer.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enablePan=false;
controls.enableDamping=true;
controls.dampingFactor=.05;
controls.rotateSpeed=.35;
controls.zoomSpeed=.8;
controls.minDistance=.1;
controls.maxDistance=.1;
controls.target.set(0,0,-1);
controls.update();

const geometry=new THREE.SphereGeometry(500,96,64);
geometry.scale(-1,1,1);

const texture=await new THREE.TextureLoader().loadAsync("public/panorama/portada.jpg");
texture.colorSpace=THREE.NoColorSpace;
texture.wrapS=THREE.ClampToEdgeWrapping;
texture.wrapT=THREE.ClampToEdgeWrapping;
texture.minFilter=THREE.LinearFilter;
texture.magFilter=THREE.LinearFilter;
texture.generateMipmaps=false;
texture.needsUpdate=true;

const material=new THREE.RawShaderMaterial({
  uniforms:{panorama:{value:texture}},
  vertexShader:`
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    varying vec2 vUv;
    void main(){
      vUv=uv;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
    }
  `,
  fragmentShader:`
    precision highp float;
    uniform sampler2D panorama;
    varying vec2 vUv;
    void main(){
      gl_FragColor=texture2D(panorama,vUv);
    }
  `,
  depthWrite:false,
  depthTest:false,
  toneMapped:false
});
scene.add(new THREE.Mesh(geometry,material));

const defs=await fetch("src/data/hotspots.json").then(r=>{
  if(!r.ok) throw new Error("No se pudo cargar hotspots.json");
  return r.json();
});

const hotspots=defs.map(d=>{
  const el=document.createElement("a");
  el.className="hotspot";
  el.href=d.url;
  el.textContent=d.label;
  document.body.appendChild(el);
  const phi=THREE.MathUtils.degToRad(90-d.pitch);
  const theta=THREE.MathUtils.degToRad(d.yaw);
  const position=new THREE.Vector3().setFromSphericalCoords(10,phi,theta);
  return {el,position};
});

const projected=new THREE.Vector3();
const cameraDirection=new THREE.Vector3();
const normalized=new THREE.Vector3();

function updateHotspots(){
  camera.getWorldDirection(cameraDirection);
  for(const h of hotspots){
    normalized.copy(h.position).normalize();
    const visible=cameraDirection.dot(normalized)>0;
    h.el.hidden=!visible;
    if(!visible) continue;
    projected.copy(h.position).project(camera);
    h.el.style.left=((projected.x*.5+.5)*innerWidth)+"px";
    h.el.style.top=((-projected.y*.5+.5)*innerHeight)+"px";
  }
}

function render(){
  controls.update();
  updateHotspots();
  renderer.render(scene,camera);
  requestAnimationFrame(render);
}

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight,false);
});

render();
