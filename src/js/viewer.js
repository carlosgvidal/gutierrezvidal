import * as THREE from "three";
import {OrbitControls} from "OrbitControls";

const PANORAMA_WIDTH=1774;
const PANORAMA_HEIGHT=887;
const SPHERE_RADIUS=500;
const HOTSPOT_RADIUS=10;

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
controls.target.copy(panoramaPixelToVector(PANORAMA_WIDTH/2,PANORAMA_HEIGHT/2,1));
controls.update();

const geometry=new THREE.SphereGeometry(SPHERE_RADIUS,96,64);
geometry.scale(-1,1,1);

const texture=await new THREE.TextureLoader().loadAsync("public/panorama/portada.jpg");
texture.colorSpace=THREE.NoColorSpace;
texture.wrapS=THREE.ClampToEdgeWrapping;
texture.wrapT=THREE.ClampToEdgeWrapping;
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
    void main(){
      vUv=uv;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
    }
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
if(!response.ok) throw new Error(`No se pudo cargar hotspots.json: ${response.status}`);
const definitions=await response.json();

const hotspots=definitions.map(definition=>{
  const element=document.createElement("a");
  element.className="hotspot";
  element.href=definition.url;
  element.textContent=definition.label;
  element.setAttribute("aria-label",definition.label);
  document.body.appendChild(element);
  return {
    element,
    position:panoramaPixelToVector(definition.imageX,definition.imageY,HOTSPOT_RADIUS)
  };
});

const projected=new THREE.Vector3();
const cameraDirection=new THREE.Vector3();
const normalized=new THREE.Vector3();

function updateHotspots(){
  camera.getWorldDirection(cameraDirection);
  for(const hotspot of hotspots){
    normalized.copy(hotspot.position).normalize();
    const visible=cameraDirection.dot(normalized)>0;
    hotspot.element.hidden=!visible;
    if(!visible) continue;
    projected.copy(hotspot.position).project(camera);
    hotspot.element.style.left=`${(projected.x*.5+.5)*innerWidth}px`;
    hotspot.element.style.top=`${(-projected.y*.5+.5)*innerHeight}px`;
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
