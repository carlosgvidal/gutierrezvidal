import * as THREE from "three";
import {OrbitControls} from "OrbitControls";

const PANORAMA_WIDTH = 1774;
const PANORAMA_HEIGHT = 887;
const SPHERE_RADIUS = 500;
const HOTSPOT_RADIUS = 10;
const viewer = document.querySelector("#viewer");

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
const camera=new THREE.PerspectiveCamera(76,1,.1,1100);
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

const controls=new OrbitControls(camera,renderer.domElement);
controls.enablePan=false;
controls.enableZoom=false;
controls.enableDamping=true;
controls.dampingFactor=.05;
controls.rotateSpeed=.28;
controls.target.copy(panoramaPixelToVector(PANORAMA_WIDTH/2,PANORAMA_HEIGHT/2,1));
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
  el.textContent=def.label;
  viewer.appendChild(el);
  return {
    element:el,
    position:panoramaPixelToVector(def.imageX,def.imageY,HOTSPOT_RADIUS)
  };
});

const projected=new THREE.Vector3();
const cameraDirection=new THREE.Vector3();
const normalized=new THREE.Vector3();

function resize(){
  const rect=viewer.getBoundingClientRect();
  camera.aspect=rect.width/rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width,rect.height,false);
}
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
