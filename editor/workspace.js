(() => {
  "use strict";

  const DB_NAME = "gutierrezvidal-editor-patches";
  const DB_VERSION = 1;
  const STORE = "patches";

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getValue(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function setValue(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async function clearAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async function listPatches() {
    return await getValue("files") || {};
  }

  async function savePatch(path, content) {
    const files = await listPatches();
    files[path.replace(/^\/+/, "")] = content;
    await setValue("files", files);
    await setValue("updatedAt", new Date().toISOString());
    return files;
  }

  async function removePatch(path) {
    const files = await listPatches();
    delete files[path.replace(/^\/+/, "")];
    await setValue("files", files);
    await setValue("updatedAt", new Date().toISOString());
    return files;
  }

  async function getFile(path) {
    const clean = path.replace(/^\/+/, "");
    const patches = await listPatches();
    if (Object.prototype.hasOwnProperty.call(patches, clean)) return patches[clean];

    const response = await fetch(`../${clean}?editor-cache=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`No se pudo leer ${clean} del sitio publicado.`);
    return await response.text();
  }

  async function exportPatchZip() {
    if (!window.JSZip) throw new Error("No se pudo cargar JSZip.");
    const files = await listPatches();
    const names = Object.keys(files);
    if (!names.length) throw new Error("No hay cambios pendientes.");

    const zip = new JSZip();
    names.forEach(path => zip.file(path, files[path]));
    zip.file("INSTRUCCIONES.txt",
`ACTUALIZACIÓN PARCIAL DEL SITIO

Este ZIP contiene únicamente archivos nuevos o modificados.
Copia su contenido sobre la raíz del sitio existente, conservando las carpetas.
No reemplaza el resto del sitio.

Archivos incluidos:
${names.map(name => "- " + name).join("\n")}
`);

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gutierrezvidal-actualizacion-${new Date().toISOString().slice(0,10)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function status() {
    const files = await listPatches();
    return {
      count: Object.keys(files).length,
      paths: Object.keys(files).sort(),
      updatedAt: await getValue("updatedAt")
    };
  }

  window.GVPatches = {
    getFile,
    savePatch,
    removePatch,
    listPatches,
    exportPatchZip,
    clearAll,
    status
  };
})();