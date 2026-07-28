import * as THREE from 'three';
import {OrbitControls} from 'OrbitControls';

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,1000);
camera.position.set(0,0,.1);

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
document.getElementById('viewer').appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enablePan=false;
controls.enableZoom=true;
controls.rotateSpeed=.35;

const geometry=new THREE.SphereGeometry(500,64,64);
geometry.scale(-1,1,1);

const texture=new THREE.TextureLoader().load('public/panorama/portada.jpg');
const material=new THREE.MeshBasicMaterial({map:texture});
scene.add(new THREE.Mesh(geometry,material));

const data=await fetch('src/data/hotspots.json').then(r=>r.json());

const links=[];
for(const h of data){
 const a=document.createElement('a');
 a.className='hotspot';
 a.href=h.url;
 a.textContent=h.label;
 document.body.appendChild(a);
 links.push({el:a,yaw:h.yaw,pitch:h.pitch});
}

function update(){
 links.forEach(l=>{
   const phi=THREE.MathUtils.degToRad(90-l.pitch);
   const theta=THREE.MathUtils.degToRad(l.yaw);
   const v=new THREE.Vector3().setFromSphericalCoords(10,phi,theta).project(camera);
   l.el.style.left=((v.x*.5+.5)*innerWidth)+'px';
   l.el.style.top=((-v.y*.5+.5)*innerHeight)+'px';
 });
 renderer.render(scene,camera);
 requestAnimationFrame(update);
}
addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});
update();
