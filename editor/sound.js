
(() => {
  "use strict";

  const status = document.querySelector("#sound-status");
  const stage = document.querySelector("#sound-stage");
  const stageImage = document.querySelector("#sound-stage-image");
  const panoramaFile = document.querySelector("#sound-panorama-file");
  const panoramaAlt = document.querySelector("#sound-panorama-alt");
  const addButton = document.querySelector("#sound-add-hotspot");
  const saveButton = document.querySelector("#sound-save");
  const deleteButton = document.querySelector("#sound-delete-hotspot");
  const form = document.querySelector("#sound-hotspot-form");
  const noSelection = document.querySelector("#sound-no-selection");

  const fields = {
    id: document.querySelector("#sound-hotspot-id"),
    title: document.querySelector("#sound-hotspot-title"),
    description: document.querySelector("#sound-hotspot-description"),
    platform: document.querySelector("#sound-hotspot-platform"),
    embed: document.querySelector("#sound-hotspot-embed"),
    source: document.querySelector("#sound-hotspot-source"),
    published: document.querySelector("#sound-hotspot-published"),
    x: document.querySelector("#sound-hotspot-x"),
    y: document.querySelector("#sound-hotspot-y")
  };

  let data = null;
  let selectedId = "";
  let panoramaBlob = null;
  let panoramaObjectURL = "";
  let dirty = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const uid = () => `sonido-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  function cleanText(value) {
    return String(value || "").trim();
  }

  function normalizeArchive(candidate) {
    let url;
    try { url = new URL(candidate); } catch { return null; }
    if (!url.hostname.endsWith("archive.org")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (!["details", "embed"].includes(parts[0]) || !parts[1]) return null;
    const identifier = parts[1];
    return {
      embedUrl: `https://archive.org/embed/${encodeURIComponent(identifier)}`,
      sourceUrl: `https://archive.org/details/${encodeURIComponent(identifier)}`
    };
  }

  function normalizeEmbed(value, platform) {
    const input = cleanText(value);
    const iframe = input.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    const candidate = iframe ? iframe[1] : input;

    if (platform === "archive") {
      const normalized = normalizeArchive(candidate);
      if (!normalized) throw new Error("La URL de Archive.org debe usar /details/IDENTIFICADOR o /embed/IDENTIFICADOR.");
      return normalized;
    }

    let url;
    try { url = new URL(candidate); }
    catch { throw new Error("La URL o el código iframe no es válido."); }

    const hosts = {
      youtube: ["youtube.com", "www.youtube.com", "www.youtube-nocookie.com", "youtu.be"],
      vimeo: ["vimeo.com", "player.vimeo.com"],
      soundcloud: ["soundcloud.com", "w.soundcloud.com"],
      spotify: ["open.spotify.com"],
      bandcamp: ["bandcamp.com"],
      mixcloud: ["mixcloud.com", "www.mixcloud.com"]
    };
    const allowed = hosts[platform] || [];
    if (url.protocol !== "https:" || !allowed.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
      throw new Error(`La URL no corresponde a la plataforma ${platform}.`);
    }
    return {embedUrl: url.href, sourceUrl: ""};
  }

  function selectedItem() {
    return data?.hotspots.find(item => item.id === selectedId) || null;
  }

  function markDirty(message = "Cambios sin guardar.") {
    dirty = true;
    status.textContent = message;
  }

  function stageSource(path) {
    return new URL(`../${path}?editor-cache=${Date.now()}`, location.href).href;
  }

  function setPanoramaPreview() {
    stageImage.src = panoramaObjectURL || stageSource(data.panorama.src);
    stageImage.alt = data.panorama.alt || "";
  }

  function placeMarker(marker, item) {
    marker.style.left = `${(item.imageX / data.panorama.width) * 100}%`;
    marker.style.top = `${(item.imageY / data.panorama.height) * 100}%`;
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
    fields.x.value = Math.round(item.imageX);
    fields.y.value = Math.round(item.imageY);
  }

  function attachDrag(marker, item) {
    marker.addEventListener("pointerdown", event => {
      event.preventDefault();
      select(item.id);
      marker.setPointerCapture(event.pointerId);

      const move = moveEvent => {
        const rect = stage.getBoundingClientRect();
        item.imageX = Math.round(clamp(moveEvent.clientX - rect.left, 0, rect.width) / rect.width * data.panorama.width);
        item.imageY = Math.round(clamp(moveEvent.clientY - rect.top, 0, rect.height) / rect.height * data.panorama.height);
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

  async function readImageDimensions(file) {
    const bitmap = await createImageBitmap(file);
    const dimensions = {width: bitmap.width, height: bitmap.height};
    bitmap.close();
    return dimensions;
  }

  panoramaFile.addEventListener("change", async () => {
    const file = panoramaFile.files?.[0];
    if (!file) return;
    try {
      const dimensions = await readImageDimensions(file);
      const ratio = dimensions.width / dimensions.height;
      if (Math.abs(ratio - 2) > .03) {
        throw new Error(`La imagen mide ${dimensions.width} × ${dimensions.height}; se requiere una proporción 2:1.`);
      }

      if (panoramaObjectURL) URL.revokeObjectURL(panoramaObjectURL);
      panoramaObjectURL = URL.createObjectURL(file);
      panoramaBlob = file;
      data.panorama.width = dimensions.width;
      data.panorama.height = dimensions.height;
      data.panorama.src = "public/panorama/sonido-360.jpg";
      data.hotspots.forEach(item => {
        item.imageX = clamp(item.imageX, 0, dimensions.width);
        item.imageY = clamp(item.imageY, 0, dimensions.height);
      });
      setPanoramaPreview();
      render();
      markDirty(`Nueva imagen cargada: ${dimensions.width} × ${dimensions.height}. Reacomoda los hotspots antes de guardar.`);
    } catch (error) {
      status.textContent = error.message;
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
      published: true
    };
    data.hotspots.push(item);
    selectedId = item.id;
    render();
    markDirty("Hotspot agregado. Completa sus datos y arrástralo a su posición.");
    fields.title.select();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const item = selectedItem();
    if (!item) return;

    try {
      const title = cleanText(fields.title.value);
      if (!title) throw new Error("El título es obligatorio.");
      const normalized = normalizeEmbed(fields.embed.value, fields.platform.value);

      item.title = title;
      item.description = cleanText(fields.description.value);
      item.platform = fields.platform.value;
      item.embedUrl = normalized.embedUrl;
      item.sourceUrl = cleanText(fields.source.value) || normalized.sourceUrl;
      item.published = fields.published.checked;

      render();
      select(item.id);
      markDirty(`Datos de “${title}” aplicados. Falta guardar la actualización.`);
    } catch (error) {
      status.textContent = error.message;
    }
  });

  deleteButton.addEventListener("click", () => {
    const item = selectedItem();
    if (!item) return;
    if (!confirm(`Eliminar el hotspot “${item.title}”?`)) return;
    data.hotspots = data.hotspots.filter(candidate => candidate.id !== item.id);
    selectedId = "";
    render();
    markDirty("Hotspot eliminado. Falta guardar la actualización.");
  });

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    status.textContent = "Guardando Sonido 360 en el paquete de actualización…";
    try {
      data.panorama.alt = cleanText(panoramaAlt.value);
      if (!data.panorama.alt) throw new Error("El texto alternativo del panorama es obligatorio.");

      for (const item of data.hotspots) {
        if (!cleanText(item.title)) throw new Error("Todos los hotspots deben tener título.");
        if (!cleanText(item.embedUrl)) throw new Error(`Falta el reproductor de “${item.title}”.`);
        normalizeEmbed(item.embedUrl, item.platform);
      }

      await GVPatches.savePatch("src/data/sound-hotspots.json", JSON.stringify(data, null, 2) + "\n");
      if (panoramaBlob) {
        await GVPatches.savePatch("public/panorama/sonido-360.jpg", panoramaBlob);
      }

      dirty = false;
      status.textContent = "Sonido 360 añadido al paquete de actualización. Descárgalo desde Herramientas.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      saveButton.disabled = false;
    }
  });

  async function load() {
    try {
      data = JSON.parse(await GVPatches.getFile("src/data/sound-hotspots.json"));
      if (!data?.panorama || !Array.isArray(data.hotspots)) throw new Error("La configuración de Sonido 360 no es válida.");
      panoramaAlt.value = data.panorama.alt || "";
      setPanoramaPreview();
      render();
      status.textContent = `${data.hotspots.length} hotspot${data.hotspots.length === 1 ? "" : "s"} cargado${data.hotspots.length === 1 ? "" : "s"}.`;
    } catch (error) {
      status.textContent = error.message;
      addButton.disabled = true;
      saveButton.disabled = true;
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
