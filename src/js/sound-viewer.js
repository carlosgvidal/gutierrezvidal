import * as THREE from "three";
import {OrbitControls} from "OrbitControls";
import {sanitizeEmbeddedHTML} from "./embed-runtime.js";

const viewer = document.querySelector("#sound-viewer");
const list = document.querySelector("#sound-list");
const dialog = document.querySelector("#sound-dialog");
const dialogTitle = document.querySelector("#sound-dialog-title");
const dialogDescription = document.querySelector("#sound-dialog-description");
const embedHost = document.querySelector("#sound-embed");
const sourceLink = document.querySelector("#sound-source-link");
const closeButton = document.querySelector("#sound-dialog-close");

if (!viewer) throw new Error("No se encontró #sound-viewer.");

const icon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9c1.3 1.6 1.3 4.4 0 6M18.5 6.5c3 3.1 3 7.9 0 11"/></svg>`;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizePanorama(data) {
  const width = Math.max(1, finiteNumber(data?.width, 1536));
  const height = Math.max(1, finiteNumber(data?.height, width / 2));
  return {
    ...data,
    width,
    height,
    fov: Math.min(110, Math.max(35, finiteNumber(data?.fov, 82)))
  };
}

function normalizeItem(item, panorama) {
  return {
    ...item,
    id: String(item?.id || ""),
    title: String(item?.title || "Material sonoro"),
    description: String(item?.description || ""),
    imageX: Math.min(panorama.width, Math.max(0, finiteNumber(item?.imageX, panorama.width / 2))),
    imageY: Math.min(panorama.height, Math.max(0, finiteNumber(item?.imageY, panorama.height / 2))),
    published: item?.published !== false
  };
}

function panoramaPixelToVector(x, y, width, height, radius = 10) {
  const phi = (x / width) * Math.PI * 2;
  const theta = (y / height) * Math.PI;
  const sinTheta = Math.sin(theta);
  return new THREE.Vector3(
    radius * Math.cos(phi) * sinTheta,
    radius * Math.cos(theta),
    radius * Math.sin(phi) * sinTheta
  );
}

function openPlayer(item) {
  if (!dialog || !embedHost) return;

  dialogTitle.textContent = item.title || "Escuchar";
  dialogDescription.textContent = item.description || "";
  dialogDescription.hidden = !item.description;
  sourceLink.hidden = !item.sourceUrl;
  if (item.sourceUrl) sourceLink.href = item.sourceUrl;

  embedHost.replaceChildren();
  try {
    const rawEmbed = item.embedCode || item.embedUrl || "";
    const sanitized = sanitizeEmbeddedHTML(rawEmbed, {
      title: `Contenido: ${item.title || "material sonoro"}`
    });
    const template = document.createElement("template");
    template.innerHTML = sanitized;
    embedHost.appendChild(template.content.cloneNode(true));
  } catch {
    const message = document.createElement("p");
    message.textContent = "No se pudo cargar este contenido incrustado.";
    embedHost.appendChild(message);
  }
  dialog.showModal();
}

function closePlayer() {
  if (!dialog) return;
  dialog.close();
  embedHost?.replaceChildren();
}

closeButton?.addEventListener("click", closePlayer);
dialog?.addEventListener("click", event => {
  const rect = dialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right
    && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) closePlayer();
});
dialog?.addEventListener("close", () => embedHost?.replaceChildren());

const response = await fetch("src/data/sound-hotspots.json", {cache: "no-store"});
if (!response.ok) throw new Error("No se pudo cargar src/data/sound-hotspots.json.");

const rawData = await response.json();
const panorama = normalizePanorama(rawData.panorama || {});
const items = Array.isArray(rawData.hotspots)
  ? rawData.hotspots.map(item => normalizeItem(item, panorama)).filter(item => item.published)
  : [];

viewer.dataset.hotspotCount = String(items.length);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(panorama.fov, 1, 0.1, 1100);
camera.position.set(0, 0, 0.1);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.domElement.className = "sound-panorama__canvas";
renderer.domElement.style.touchAction = "none";
renderer.domElement.setAttribute("aria-label", panorama.alt || "Panorama sonoro interactivo");
viewer.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = true;
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.42;
controls.minDistance = 0.1;
controls.maxDistance = 0.1;
controls.minPolarAngle = 0.18;
controls.maxPolarAngle = Math.PI - 0.18;

/*
 * La vista inicial prioriza un hotspot publicado.
 * Esto garantiza que, después de guardar uno nuevo, al menos una etiqueta
 * aparezca inmediatamente sobre la imagen sin obligar al usuario a buscarla.
 */
const firstVisibleItem = items[0];
const initialX = firstVisibleItem?.imageX
  ?? finiteNumber(panorama.initialView?.imageX, panorama.width / 2);
const initialY = firstVisibleItem?.imageY
  ?? finiteNumber(panorama.initialView?.imageY, panorama.height / 2);

controls.target.copy(
  panoramaPixelToVector(initialX, initialY, panorama.width, panorama.height, 1)
);
controls.update();

const geometry = new THREE.SphereGeometry(500, 96, 64);
geometry.scale(-1, 1, 1);

const texture = await new THREE.TextureLoader().loadAsync(panorama.src);
texture.colorSpace = THREE.SRGBColorSpace;
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;

const material = new THREE.MeshBasicMaterial({
  map: texture,
  side: THREE.FrontSide
});
scene.add(new THREE.Mesh(geometry, material));

const hotspots = items.map(item => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sound-hotspot";
  button.dataset.hotspotId = item.id;
  button.innerHTML = `<span class="sound-hotspot__icon">${icon}</span><span>${item.title}</span>`;
  button.addEventListener("click", () => openPlayer(item));
  viewer.appendChild(button);

  return {
    element: button,
    item,
    position: panoramaPixelToVector(
      item.imageX,
      item.imageY,
      panorama.width,
      panorama.height
    )
  };
});

if (!hotspots.length) {
  viewer.classList.add("sound-panorama--without-hotspots");
}

const authoredArchiveItems = list?.querySelectorAll(".sound-item").length || 0;
if (list && !authoredArchiveItems && items.length) {
  list.replaceChildren();
  items.forEach(item => {
    const article = document.createElement("article");
    article.className = "sound-item";

    const text = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.title;
    const description = document.createElement("p");
    description.textContent = item.description || "";
    text.append(title);
    if (item.description) text.append(description);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary";
    button.textContent = "Escuchar";
    button.addEventListener("click", () => openPlayer(item));

    article.append(text, button);
    list.appendChild(article);
  });
}

const projected = new THREE.Vector3();
const cameraSpace = new THREE.Vector3();

function resize() {
  const rect = viewer.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(Math.round(rect.width), Math.round(rect.height), false);
}

/*
 * La versión anterior decidía la visibilidad con un producto punto entre la
 * dirección de cámara y la posición del hotspot. En determinados ángulos,
 * especialmente cerca de la costura equirectangular, una etiqueta válida
 * podía quedar oculta. Aquí se usa la posición real en espacio de cámara y
 * el volumen de recorte de la proyección.
 */
function updateHotspots() {
  const rect = viewer.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  camera.updateMatrixWorld();

  hotspots.forEach(hotspot => {
    cameraSpace.copy(hotspot.position).applyMatrix4(camera.matrixWorldInverse);
    projected.copy(hotspot.position).project(camera);

    const inFront = cameraSpace.z < -0.01;
    const insideDepth = projected.z >= -1 && projected.z <= 1;
    const insideViewport = projected.x >= -1.15 && projected.x <= 1.15
      && projected.y >= -1.15 && projected.y <= 1.15;
    const visible = inFront && insideDepth && insideViewport;

    hotspot.element.classList.toggle("is-visible", visible);
    hotspot.element.setAttribute("aria-hidden", String(!visible));
    hotspot.element.tabIndex = visible ? 0 : -1;

    if (!visible) return;

    hotspot.element.style.left = `${(projected.x * 0.5 + 0.5) * rect.width}px`;
    hotspot.element.style.top = `${(-projected.y * 0.5 + 0.5) * rect.height}px`;
  });
}

new ResizeObserver(resize).observe(viewer);
resize();

function render() {
  controls.update();
  renderer.render(scene, camera);
  updateHotspots();
  requestAnimationFrame(render);
}
render();
