(() => {
  "use strict";

  const DB_NAME = "gutierrezvidal-editor-patches";
  const DB_VERSION = 3;
  const STORE = "patches";
  const FILE_PREFIX = "file:";
  const LOCAL_KEY = "gutierrezvidal-editor-patches-v3";
  const PING_KEY = "gutierrezvidal-editor-patches-ping";
  const CHANNEL_NAME = "gutierrezvidal-editor-patches";

  let channel = null;
  try {
    channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  } catch {
    channel = null;
  }

  const cleanPath = path => String(path || "").replace(/^\/+/, "");

  function notify() {
    const detail = {updatedAt: new Date().toISOString()};
    try { channel?.postMessage(detail); } catch {}
    try { window.dispatchEvent(new CustomEvent("gvpatcheschange", {detail})); } catch {}
    try { localStorage.setItem(PING_KEY, JSON.stringify(detail)); } catch {}
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB no está disponible."));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("No se pudo abrir IndexedDB."));
      request.onblocked = () => reject(new Error("IndexedDB está bloqueado por otra pestaña."));
    });
  }

  async function dbGet(key) {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onabort = () => { db.close(); reject(tx.error); };
    });
  }

  async function dbPut(key, value) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  }

  async function dbDelete(key) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  }

  async function dbClear() {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  }

  async function dbFiles() {
    const db = await openDB();
    const result = {};
    let legacyFiles = null;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const key = String(cursor.key);
        if (key.startsWith(FILE_PREFIX)) {
          result[key.slice(FILE_PREFIX.length)] = cursor.value;
        } else if (key === "files" && cursor.value && typeof cursor.value === "object") {
          legacyFiles = cursor.value;
          Object.assign(result, cursor.value);
        }
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error);
    });
    db.close();

    if (legacyFiles) {
      try {
        for (const [path, value] of Object.entries(legacyFiles)) {
          await dbPut(`${FILE_PREFIX}${cleanPath(path)}`, value);
        }
        await dbDelete("files");
      } catch {
        // La lectura sigue siendo válida aunque la migración no se complete.
      }
    }
    return result;
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const chunk = 0x8000;
    for (let index = 0; index < bytes.length; index += chunk) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
    }
    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function portableValue(value) {
    if (value instanceof Blob) {
      return {
        kind: "blob",
        type: value.type || "application/octet-stream",
        name: value.name || "",
        base64: bytesToBase64(new Uint8Array(await value.arrayBuffer()))
      };
    }
    return {kind: "text", value: String(value)};
  }

  function restorePortable(record) {
    if (!record || record.kind === "text") return String(record?.value ?? "");
    if (record.kind === "blob") {
      const blob = new Blob([base64ToBytes(record.base64 || "")], {
        type: record.type || "application/octet-stream"
      });
      if (record.name && typeof File !== "undefined") {
        return new File([blob], record.name, {type: blob.type});
      }
      return blob;
    }
    return "";
  }

  function readLocalState() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return {files: {}, updatedAt: null};
      const parsed = JSON.parse(raw);
      const files = {};
      for (const [path, record] of Object.entries(parsed.files || {})) {
        files[path] = restorePortable(record);
      }
      return {files, updatedAt: parsed.updatedAt || null};
    } catch {
      return {files: {}, updatedAt: null};
    }
  }

  async function writeLocalFile(path, value) {
    const raw = (() => {
      try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); }
      catch { return {}; }
    })();
    raw.files = raw.files || {};
    raw.files[path] = await portableValue(value);
    raw.updatedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(raw));
    return raw.updatedAt;
  }

  function removeLocalFile(path) {
    try {
      const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
      raw.files = raw.files || {};
      delete raw.files[path];
      raw.updatedAt = new Date().toISOString();
      localStorage.setItem(LOCAL_KEY, JSON.stringify(raw));
    } catch {}
  }

  async function listPatches() {
    const local = readLocalState().files;
    try {
      return {...local, ...(await dbFiles())};
    } catch {
      return local;
    }
  }

  async function savePatch(path, content) {
    const clean = cleanPath(path);
    if (!clean) throw new Error("La ruta del archivo está vacía.");

    let dbSaved = false;
    let localSaved = false;
    let lastError = null;
    const updatedAt = new Date().toISOString();

    try {
      await dbPut(`${FILE_PREFIX}${clean}`, content);
      await dbPut("updatedAt", updatedAt);
      dbSaved = true;
    } catch (error) {
      lastError = error;
    }

    try {
      await writeLocalFile(clean, content);
      localSaved = true;
    } catch (error) {
      lastError = error;
    }

    if (!dbSaved && !localSaved) {
      throw lastError || new Error("El navegador no permitió guardar los cambios.");
    }

    notify();
    return await listPatches();
  }

  async function removePatch(path) {
    const clean = cleanPath(path);
    try { await dbDelete(`${FILE_PREFIX}${clean}`); } catch {}
    try {
      const legacy = await dbGet("files");
      if (legacy && typeof legacy === "object") {
        delete legacy[clean];
        if (Object.keys(legacy).length) await dbPut("files", legacy);
        else await dbDelete("files");
      }
    } catch {}
    removeLocalFile(clean);
    notify();
    return await listPatches();
  }

  async function getFile(path) {
    const clean = cleanPath(path);
    const patches = await listPatches();
    if (Object.prototype.hasOwnProperty.call(patches, clean)) {
      const value = patches[clean];
      return value instanceof Blob ? await value.text() : String(value);
    }

    const response = await fetch(`../${clean}?editor-cache=${Date.now()}`, {cache: "no-store"});
    if (!response.ok) throw new Error(`No se pudo leer ${clean} del sitio publicado.`);
    return await response.text();
  }

  async function clearAll() {
    try { await dbClear(); } catch {}
    try { localStorage.removeItem(LOCAL_KEY); } catch {}
    notify();
  }

  async function status() {
    const files = await listPatches();
    let dbUpdated = null;
    try { dbUpdated = await dbGet("updatedAt"); } catch {}
    const localUpdated = readLocalState().updatedAt;
    const dates = [dbUpdated, localUpdated].filter(Boolean).sort();
    const updatedAt = dates.length ? dates[dates.length - 1] : null;
    return {
      count: Object.keys(files).length,
      paths: Object.keys(files).sort(),
      updatedAt
    };
  }

  async function buildPatchZip(paths = null) {
    if (!window.JSZip) throw new Error("No se pudo cargar el generador ZIP local.");
    const files = await listPatches();
    const names = (paths || Object.keys(files)).filter(path =>
      Object.prototype.hasOwnProperty.call(files, path)
    );
    if (!names.length) throw new Error("No hay cambios pendientes.");

    const zip = new JSZip();
    for (const path of names) zip.file(path, files[path]);
    zip.file(
      "INSTRUCCIONES.txt",
      `ACTUALIZACIÓN PARCIAL DEL SITIO\n\nCopia el contenido sobre la raíz del sitio existente.\n\nArchivos incluidos:\n${names.map(name => `- ${name}`).join("\n")}\n`
    );
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {level: 6}
    });
    return {blob, names};
  }

  async function exportPatchZip(paths = null) {
    const {blob, names} = await buildPatchZip(paths);
    const url = URL.createObjectURL(blob);
    const filename = `gutierrezvidal-actualizacion-${new Date().toISOString().slice(0, 10)}.zip`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return {blob, names, filename, url};
  }

  window.GVPatches = {
    getFile,
    savePatch,
    removePatch,
    listPatches,
    buildPatchZip,
    exportPatchZip,
    clearAll,
    status
  };
})();