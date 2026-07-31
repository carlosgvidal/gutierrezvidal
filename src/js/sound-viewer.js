
import * as THREE from "three";
import {OrbitControls} from "OrbitControls";

const viewer = document.querySelector("#sound-viewer");
const list = document.querySelector("#sound-list");
const dialog = document.querySelector("#sound-dialog");
const dialogTitle = document.querySelector("#sound-dialog-title");
const dialogDescription = document.querySelector("#sound-dialog-description");
const embedHost = document.querySelector("#sound-embed");
const sourceLink = document.querySelector("#sound-source-link");
const closeButton = document.querySelector("#sound-dialog-close");

const icon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9c1.3 1.6 1.3 4.4 0 6M18.5 6.5c3 3.1 3 7.9 0 11"/></svg>`;

function normalizeEmbedURL(value, platform = "") {
  const input = String(value || "").trim();
  if (!input) return "";

  const iframeMatch = input.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const candidate = iframeMatch ? iframeMatch[1] : input;

  let url;
  try { url = new URL(candidate, location.href); }
  catch { return ""; }

  if (platform === "archive" || url.hostname.endsWith("archive.org")) {
    const parts = url.pathname.split("/").filter(Boolean);
    const identifier = parts[0] === "details" || parts[0] === "embed" ? parts[1] : "";
    return identifier ? `https://archive.org/embed/${encodeURIComponent(identifier)}` : "";
  }

  const allowed = [
    "www.youtube.com", "youtube.com", "www.youtube-nocookie.com",
    "player.vimeo.com", "vimeo.com",
    "w.soundcloud.com", "soundcloud.com",
    "open.spotify.com",
    "bandcamp.com",
    "www.mixcloud.com", "mixcloud.com"
  ];
  if (url.protocol !== "https:" || !allowed.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    return "";
  }
  return url.href;
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
  const embedURL = normalizeEmbedURL(item.embedUrl, item.platform);
  dialogTitle.textContent = item.title || "Escuchar";
  dialogDescription.textContent = item.description || "";
  dialogDescription.hidden = !item.description;
  sourceLink.hidden = !item.sourceUrl;
  if (item.sourceUrl) sourceLink.href = item.sourceUrl;

  embedHost.replaceChildren();
  if (embedURL) {
    const iframe = document.createElement("iframe");
    iframe.src = embedURL;
    iframe.title = `Reproductor: ${item.title || "material sonoro"}`;
    iframe.loading = "eager";
    iframe.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("allowfullscreen", "");
    embedHost.appendChild(iframe);
  } else {
    const message = document.createElement("p");
    message.textContent = "No se pudo cargar este reproductor.";
    embedHost.appendChild(message);
  }
  dialog.showModal();
}

function closePlayer() {
  dialog.close();
  embedHost.replaceChildren();
}

closeButton.addEventListener("click", closePlayer);
dialog.addEventListener("click", event => {
  const rect = dialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right
    && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) closePlayer();
});
dialog.addEventListener("close", () => embedHost.replaceChildren());

const response = await fetch("src/data/sound-hotspots.json", {cache: "no-store"});
if (!response.ok) throw new Error("No se pudo cargar el archivo sonoro.");
const data = await response.json();
const panorama = data.panorama;
const items = Array.isArray(data.hotspots) ? data.hotspots.filter(item => item.published !== false) : [];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(Number(panorama.fov) || 82, 1, .1, 1100);
camera.position.set(0, 0, .1);

const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: "high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
viewer.prepend(renderer.domElement);
renderer.domElement.style.touchAction = "none";
renderer.domElement.setAttribute("aria-label", panorama.alt || "Panorama sonoro interactivo");

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = true;
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.rotateSpeed = .42;
controls.minDistance = .1;
controls.maxDistance = .1;
controls.minPolarAngle = .18;
controls.maxPolarAngle = Math.PI - .18;
controls.target.copy(panoramaPixelToVector(
  panorama.initialView?.imageX ?? panorama.width / 2,
  panorama.initialView?.imageY ?? panorama.height / 2,
  panorama.width,
  panorama.height,
  1
));
controls.update();

const geometry = new THREE.SphereGeometry(500, 96, 64);
geometry.scale(-1, 1, 1);
const texture = await new THREE.TextureLoader().loadAsync(panorama.src);
texture.colorSpace = THREE.SRGBColorSpace;
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
const material = new THREE.MeshBasicMaterial({map: texture, side: THREE.FrontSide});
scene.add(new THREE.Mesh(geometry, material));

const hotspots = items.map(item => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sound-hotspot";
  button.innerHTML = `<span class="sound-hotspot__icon">${icon}</span><span>${item.title}</span>`;
  button.addEventListener("click", () => openPlayer(item));
  viewer.appendChild(button);
  return {
    element: button,
    item,
    position: panoramaPixelToVector(
      Number(item.imageX),
      Number(item.imageY),
      panorama.width,
      panorama.height
    )
  };
});

if (items.length) {
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
const cameraDirection = new THREE.Vector3();
const normalized = new THREE.Vector3();

function resize() {
  const rect = viewer.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(Math.round(rect.width), Math.round(rect.height), false);
}

function updateHotspots() {
  const rect = viewer.getBoundingClientRect();
  camera.getWorldDirection(cameraDirection);
  hotspots.forEach(hotspot => {
    normalized.copy(hotspot.position).normalize();
    const visible = cameraDirection.dot(normalized) > .08;
    hotspot.element.hidden = !visible;
    if (!visible) return;
    projected.copy(hotspot.position).project(camera);
    hotspot.element.style.left = `${(projected.x * .5 + .5) * rect.width}px`;
    hotspot.element.style.top = `${(-projected.y * .5 + .5) * rect.height}px`;
  });
}

new ResizeObserver(resize).observe(viewer);
resize();

function render() {
  controls.update();
  updateHotspots();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();
