(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);

  const status = $("#sound-status");
  const stage = $("#sound-stage");
  const stageImage = $("#sound-stage-image");
  const panoramaFile = $("#sound-panorama-file");
  const panoramaAlt = $("#sound-panorama-alt");
  const addButton = $("#sound-add-hotspot");
  const saveButton = $("#sound-save");
  const saveDownloadButton = $("#sound-save-download");
  const readyDownload = $("#sound-ready-download");
  const savedDetails = $("#sound-saved-details");
  const savedFiles = $("#sound-saved-files");
  const deleteButton = $("#sound-delete-hotspot");
  const form = $("#sound-hotspot-form");
  const noSelection = $("#sound-no-selection");

  const fields = {
    id: $("#sound-hotspot-id"),
    title: $("#sound-hotspot-title"),
    description: $("#sound-hotspot-description"),
    platform: $("#sound-hotspot-platform"),
    embed: $("#sound-hotspot-embed"),
    source: $("#sound-hotspot-source"),
    published: $("#sound-hotspot-published"),
    x: $("#sound-hotspot-x"),
    y: $("#sound-hotspot-y")
  };

  const DRAFT_KEY = "gutierrezvidal-sound360-draft-v2";

  let data = null;
  let selectedId = "";
  let panoramaBlob = null;
  let panoramaObjectURL = "";
  let downloadObjectURL = "";
  let dirty = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const uid = () => `sonido-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const cleanText = value => String(value || "").trim();

  function setStatus(message) {
    status.textContent = message;
  }

  function saveDraft() {
    if (!data) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        savedAt: new Date().toISOString(),
        data
      }));
    } catch (error) {
      console.warn("No se pudo guardar el borrador local:", error);
    }
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.data?.panorama || !Array.isArray(parsed?.data?.hotspots)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function markDirty(message = "Cambios sin guardar.") {
    dirty = true;
    saveDraft();
    setStatus(message);
  }

  function selectedItem() {
    return data?.hotspots.find(item => item.id === selectedId) || null;
  }

  function syncSelectedFromForm({normalize = false} = {}) {
    const item = selectedItem();
    if (!item) return null;

    item.title = cleanText(fields.title.value) || "Nuevo material";
    item.description = cleanText(fields.description.value);
    item.platform = fields.platform.value || "archive";
    item.sourceUrl = cleanText(fields.source.value);
    item.published = fields.published.checked;

    const embedInput = cleanText(fields.embed.value);
    if (!embedInput) {
      item.embedUrl = "";
      if (normalize && item.published) item.published = false;
      return item;
    }

    if (normalize) {
      const normalized = GVEmbeds.normalize(embedInput, item.platform);
      item.embedUrl = normalized.src;
      item.platform = normalized.provider;
      item.sourceUrl = item.sourceUrl || normalized.sourceUrl;
      fields.platform.value = item.platform;
      fields.embed.value = item.embedUrl;
      fields.source.value = item.sourceUrl;
    } else {
      item.embedUrl = embedInput;
    }
    return item;
  }

  function normalizeAllHotspots() {
    data.panorama.alt = cleanText(panoramaAlt.value);
    if (!data.panorama.alt) {
      throw new Error("El texto alternativo del panorama es obligatorio.");
    }

    if (selectedItem()) syncSelectedFromForm({normalize: true});

    const warnings = [];
    for (const item of data.hotspots) {
      item.title = cleanText(item.title) || "Nuevo material";
      item.description = cleanText(item.description);
      item.sourceUrl = cleanText(item.sourceUrl);

      if (!cleanText(item.embedUrl)) {
        if (item.published !== false) {
          item.published = false;
          warnings.push(`“${item.title}” se guardó como borrador porque no tiene reproductor.`);
        }
        continue;
      }

      const normalized = GVEmbeds.normalize(item.embedUrl, item.platform);
      item.embedUrl = normalized.src;
      item.platform = normalized.provider;
      item.sourceUrl = item.sourceUrl || normalized.sourceUrl;
    }
    return warnings;
  }

  function stageSource(path) {
    return new URL(`../${path}?editor-cache=${Date.now()}`, location.href).href;
  }

  function setPanoramaPreview() {
    stageImage.src = panoramaObjectURL || stageSource(data.panorama.src);
    stageImage.alt = data.panorama.alt || "";
  }

  function placeMarker(marker, item) {
    marker.style.left = `${(Number(item.imageX) / data.panorama.width) * 100}%`;
    marker.style.top = `${(Number(item.imageY) / data.panorama.height) * 100}%`;
  }

  function select(id) {
    selectedId = id;
    const item = selectedItem();

    stage.querySelectorAll(".sound-marker").forEach(marker => {
      marker.setAttribute("aria-pressed", String(marker.dataset.id === id));
    });

    form.hidden = !item;
    noSelection.hidden = Boolean(item);
    deleteButton.disabled = !item;
    if (!item) return;

    fields.id.value = item.id;
    fields.title.value = item.title || "";
    fields.description.value = item.description || "";
    fields.platform.value = item.platform || "archive";
    fields.embed.value = item.embedUrl || "";
    fields.source.value = item.sourceUrl || "";
    fields.published.checked = item.published !== false;
    fields.x.value = Math.round(Number(item.imageX) || 0);
    fields.y.value = Math.round(Number(item.imageY) || 0);
  }

  function attachDrag(marker, item) {
    marker.addEventListener("pointerdown", event => {
      event.preventDefault();
      select(item.id);
      marker.setPointerCapture(event.pointerId);

      const move = moveEvent => {
        const rect = stage.getBoundingClientRect();
        item.imageX = Math.round(
          clamp(moveEvent.clientX - rect.left, 0, rect.width) / rect.width * data.panorama.width
        );
        item.imageY = Math.round(
          clamp(moveEvent.clientY - rect.top, 0, rect.height) / rect.height * data.panorama.height
        );
        fields.x.value = item.imageX;
        fields.y.value = item.imageY;
        placeMarker(marker, item);
        markDirty(`${item.title || "Hotspot"}: x ${item.imageX}, y ${item.imageY}.`);
      };

      const end = () => {
        marker.removeEventListener("pointermove", move);
        marker.removeEventListener("pointerup", end);
        marker.removeEventListener("pointercancel", end);
      };

      marker.addEventListener("pointermove", move);
      marker.addEventListener("pointerup", end);
      marker.addEventListener("pointercancel", end);
    });

    marker.addEventListener("click", () => select(item.id));
  }

  function render() {
    stage.querySelectorAll(".sound-marker").forEach(marker => marker.remove());
    data.hotspots.forEach(item => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "sound-marker";
      marker.dataset.id = item.id;
      marker.textContent = item.title || "Sin título";
      marker.setAttribute("aria-pressed", String(item.id === selectedId));
      marker.setAttribute("aria-label", `Mover hotspot ${item.title || "sin título"}`);
      placeMarker(marker, item);
      attachDrag(marker, item);
      stage.appendChild(marker);
    });
    select(selectedId);
  }

  function displaySavedFiles(paths) {
    savedFiles.replaceChildren();
    paths.forEach(path => {
      const item = document.createElement("li");
      item.textContent = path;
      savedFiles.appendChild(item);
    });
    savedDetails.hidden = !paths.length;
    savedDetails.open = Boolean(paths.length);
  }

  async function readImageDimensions(file) {
    if ("createImageBitmap" in window) {
      const bitmap = await createImageBitmap(file);
      const dimensions = {width: bitmap.width, height: bitmap.height};
      bitmap.close();
      return dimensions;
    }

    return await new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        resolve({width: image.naturalWidth, height: image.naturalHeight});
        URL.revokeObjectURL(url);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo leer la imagen panorámica."));
      };
      image.src = url;
    });
  }

  panoramaFile.addEventListener("change", async () => {
    const file = panoramaFile.files?.[0];
    if (!file) return;

    try {
      const dimensions = await readImageDimensions(file);
      const ratio = dimensions.width / dimensions.height;
      if (Math.abs(ratio - 2) > 0.03) {
        throw new Error(`La imagen mide ${dimensions.width} × ${dimensions.height}; se requiere proporción 2:1.`);
      }

      if (panoramaObjectURL) URL.revokeObjectURL(panoramaObjectURL);
      panoramaObjectURL = URL.createObjectURL(file);
      panoramaBlob = file;

      data.panorama.width = dimensions.width;
      data.panorama.height = dimensions.height;
      data.panorama.src = "public/panorama/sonido-360.jpg";
      data.hotspots.forEach(item => {
        item.imageX = clamp(Number(item.imageX) || 0, 0, dimensions.width);
        item.imageY = clamp(Number(item.imageY) || 0, 0, dimensions.height);
      });

      await GVPatches.savePatch("public/panorama/sonido-360.jpg", file);
      setPanoramaPreview();
      render();
      markDirty(`Panorama guardado como cambio pendiente: ${dimensions.width} × ${dimensions.height}.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      panoramaFile.value = "";
    }
  });

  panoramaAlt.addEventListener("input", () => {
    data.panorama.alt = panoramaAlt.value;
    stageImage.alt = panoramaAlt.value;
    markDirty();
  });

  addButton.addEventListener("click", () => {
    const item = {
      id: uid(),
      title: "Nuevo material",
      description: "",
      platform: "archive",
      embedUrl: "",
      sourceUrl: "",
      imageX: Math.round(data.panorama.width / 2),
      imageY: Math.round(data.panorama.height / 2),
      published: false
    };
    data.hotspots.push(item);
    selectedId = item.id;
    render();
    markDirty("Hotspot agregado como borrador. Completa sus datos y ubícalo.");
    fields.title.select();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      const item = syncSelectedFromForm({normalize: true});
      if (!item) return;
      render();
      select(item.id);
      markDirty(`Datos de “${item.title}” aplicados.`);
    } catch (error) {
      setStatus(error.message);
    }
  });

  for (const eventName of ["input", "change"]) {
    form.addEventListener(eventName, () => {
      if (!selectedItem()) return;
      try {
        const item = syncSelectedFromForm();
        const marker = stage.querySelector(`.sound-marker[data-id="${CSS.escape(selectedId)}"]`);
        if (marker) marker.textContent = item.title || "Sin título";
        markDirty();
      } catch {
        markDirty();
      }
    });
  }

  deleteButton.addEventListener("click", () => {
    const item = selectedItem();
    if (!item) return;
    if (!confirm(`¿Eliminar el hotspot “${item.title}”?`)) return;
    data.hotspots = data.hotspots.filter(candidate => candidate.id !== item.id);
    selectedId = "";
    render();
    markDirty("Hotspot eliminado.");
  });

  async function persistCurrentState() {
    const warnings = normalizeAllHotspots();
    const serialized = JSON.stringify(data, null, 2) + "\n";

    await GVPatches.savePatch("src/data/sound-hotspots.json", serialized);
    if (panoramaBlob) {
      await GVPatches.savePatch("public/panorama/sonido-360.jpg", panoramaBlob);
    }

    const patches = await GVPatches.listPatches();
    if (!Object.prototype.hasOwnProperty.call(patches, "src/data/sound-hotspots.json")) {
      throw new Error("El JSON de Sonido no apareció en el espacio de actualización.");
    }

    const stored = patches["src/data/sound-hotspots.json"];
    const verified = JSON.parse(stored instanceof Blob ? await stored.text() : String(stored));
    if (!Array.isArray(verified.hotspots) || verified.hotspots.length !== data.hotspots.length) {
      throw new Error("La verificación del JSON guardado no coincide con los hotspots actuales.");
    }

    saveDraft();
    const paths = Object.keys(patches).filter(path =>
      path === "src/data/sound-hotspots.json" ||
      path === "public/panorama/sonido-360.jpg"
    );
    displaySavedFiles(paths);
    return {serialized, warnings, paths, patches};
  }

  function prepareVisibleDownload(blob) {
    if (downloadObjectURL) URL.revokeObjectURL(downloadObjectURL);
    downloadObjectURL = URL.createObjectURL(blob);
    readyDownload.href = downloadObjectURL;
    readyDownload.download = `gutierrezvidal-sonido-${new Date().toISOString().slice(0, 10)}.zip`;
    readyDownload.hidden = false;
    readyDownload.focus();
  }

  async function buildSoundZip() {
    if (!window.JSZip) throw new Error("No se cargó el generador ZIP local.");
    const saved = await persistCurrentState();
    const zip = new JSZip();
    zip.file("src/data/sound-hotspots.json", saved.serialized);

    const panoramaPatch = saved.patches["public/panorama/sonido-360.jpg"];
    if (panoramaPatch) {
      zip.file("public/panorama/sonido-360.jpg", panoramaPatch);
    }

    zip.file(
      "INSTRUCCIONES.txt",
      "ACTUALIZACIÓN DE SONIDO 360\n\nCopia estos archivos sobre la raíz del sitio existente.\n"
    );

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {level: 6}
    });
    prepareVisibleDownload(blob);
    return saved;
  }

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    saveDownloadButton.disabled = true;
    setStatus("Guardando Sonido 360…");
    try {
      const {warnings, paths} = await persistCurrentState();
      dirty = false;
      setStatus(
        `${data.hotspots.length} hotspot${data.hotspots.length === 1 ? "" : "s"} guardado${data.hotspots.length === 1 ? "" : "s"} en ${paths.join(", ")}.` +
        (warnings.length ? ` ${warnings.join(" ")}` : "")
      );
    } catch (error) {
      setStatus(`No se guardó: ${error.message}`);
    } finally {
      saveButton.disabled = false;
      saveDownloadButton.disabled = false;
    }
  });

  saveDownloadButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    saveDownloadButton.disabled = true;
    setStatus("Guardando y preparando el ZIP de Sonido 360…");
    try {
      const {warnings} = await buildSoundZip();
      dirty = false;
      setStatus(
        "ZIP preparado. Si el navegador no inició la descarga, pulsa «Descargar ZIP preparado»." +
        (warnings.length ? ` ${warnings.join(" ")}` : "")
      );
      readyDownload.click();
    } catch (error) {
      setStatus(`No se pudo guardar: ${error.message}`);
    } finally {
      saveButton.disabled = false;
      saveDownloadButton.disabled = false;
    }
  });

  async function load() {
    try {
      const workspaceState = await GVPatches.status();
      const draft = readDraft();
      const draftTime = draft?.savedAt ? Date.parse(draft.savedAt) : 0;
      const workspaceTime = workspaceState.updatedAt ? Date.parse(workspaceState.updatedAt) : 0;

      if (draft && draftTime > workspaceTime) {
        data = draft.data;
        setStatus(`Borrador local recuperado (${new Date(draft.savedAt).toLocaleString("es-MX")}).`);
      } else {
        data = JSON.parse(await GVPatches.getFile("src/data/sound-hotspots.json"));
      }

      if (!data?.panorama || !Array.isArray(data.hotspots)) {
        throw new Error("La configuración de Sonido 360 no es válida.");
      }

      data.hotspots.forEach(item => {
        item.id = item.id || uid();
        item.imageX = Number(item.imageX) || 0;
        item.imageY = Number(item.imageY) || 0;
        item.published = item.published !== false;
      });

      panoramaAlt.value = data.panorama.alt || "";
      setPanoramaPreview();
      render();

      const patches = await GVPatches.listPatches();
      displaySavedFiles(
        Object.keys(patches).filter(path =>
          path === "src/data/sound-hotspots.json" ||
          path === "public/panorama/sonido-360.jpg"
        )
      );

      if (!(draft && draftTime > workspaceTime)) {
        setStatus(`${data.hotspots.length} hotspot${data.hotspots.length === 1 ? "" : "s"} cargado${data.hotspots.length === 1 ? "" : "s"}.`);
      }
    } catch (error) {
      setStatus(error.message);
      addButton.disabled = true;
      saveButton.disabled = true;
      saveDownloadButton.disabled = true;
    }
  }

  window.addEventListener("beforeunload", event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  form.hidden = true;
  noSelection.hidden = false;
  load();
})();