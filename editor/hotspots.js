(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);

  const stage = $("#hotspot-stage");
  const stageImage = $("#hotspot-stage-image");
  const status = $("#hotspot-status");
  const saveButton = $("#save-hotspots");
  const saveDownloadButton = $("#save-download-hotspots");
  const readyDownload = $("#hotspots-ready-download");
  const addButton = $("#add-hotspot");
  const inspector = $("#hotspot-inspector");
  const form = $("#hotspot-form");
  const noSelection = $("#hotspot-no-selection");
  const list = $("#hotspot-list");
  const count = $("#hotspot-count");

  const fields = {
    id: $("#hotspot-id"),
    label: $("#hotspot-label"),
    url: $("#hotspot-url"),
    icon: $("#hotspot-icon"),
    x: $("#hotspot-x"),
    y: $("#hotspot-y")
  };

  let hotspots = [];
  let selectedId = "";
  let imageWidth = 1774;
  let imageHeight = 887;
  let dirty = false;
  let downloadUrl = "";

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const cleanText = value => String(value || "").trim();
  const uid = () => `hotspot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  function setStatus(message) {
    status.textContent = message;
  }

  function validUrl(value) {
    const url = cleanText(value);
    if (!url) return false;
    if (/^(javascript|data|vbscript):/i.test(url)) return false;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !/^(https?:|mailto:|tel:)/i.test(url)) return false;
    return !/\s/.test(url);
  }

  function selectedItem() {
    return hotspots.find(item => item.id === selectedId) || null;
  }

  function markDirty(message = "Cambios sin guardar.") {
    dirty = true;
    readyDownload.hidden = true;
    setStatus(message);
  }

  function place(marker, item) {
    marker.style.left = `${(Number(item.imageX) / imageWidth) * 100}%`;
    marker.style.top = `${(Number(item.imageY) / imageHeight) * 100}%`;
  }

  function scrollInspectorIntoView() {
    const narrow = window.matchMedia?.("(max-width: 940px)")?.matches;
    if (narrow) inspector.scrollIntoView({behavior: "smooth", block: "start"});
  }

  function select(id) {
    selectedId = id || "";
    const item = selectedItem();

    stage.querySelectorAll(".hotspot-marker").forEach(marker => {
      marker.setAttribute("aria-pressed", String(marker.dataset.id === selectedId));
    });
    list.querySelectorAll(".hotspot-list-item").forEach(row => {
      row.classList.toggle("is-selected", row.dataset.id === selectedId);
    });

    form.hidden = !item;
    noSelection.hidden = Boolean(item);

    if (!item) {
      $("#hotspot-inspector-title").textContent = "Hotspot";
      return;
    }

    fields.id.value = item.id;
    fields.label.value = item.label || "";
    fields.url.value = item.url || "";
    fields.icon.value = item.icon || "point";
    fields.x.value = Math.round(Number(item.imageX) || 0);
    fields.y.value = Math.round(Number(item.imageY) || 0);
    $("#hotspot-inspector-title").textContent = `Hotspot: ${item.label || "Sin etiqueta"}`;
  }

  function syncSelectedFromForm() {
    const item = selectedItem();
    if (!item) return null;

    const label = cleanText(fields.label.value);
    const url = cleanText(fields.url.value);
    if (!label) throw new Error("La etiqueta es obligatoria.");
    if (!validUrl(url)) throw new Error("El enlace no es válido.");

    item.label = label;
    item.url = url;
    item.icon = fields.icon.value || "point";
    return item;
  }

  function attachDrag(marker, item) {
    marker.addEventListener("pointerdown", event => {
      event.preventDefault();
      select(item.id);
      marker.setPointerCapture(event.pointerId);

      const startX = event.clientX;
      const startY = event.clientY;
      let moved = false;

      const move = moveEvent => {
        if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > 5) {
          moved = true;
        }
        if (!moved) return;

        const rect = stage.getBoundingClientRect();
        item.imageX = Math.round(
          clamp(moveEvent.clientX - rect.left, 0, rect.width) / rect.width * imageWidth
        );
        item.imageY = Math.round(
          clamp(moveEvent.clientY - rect.top, 0, rect.height) / rect.height * imageHeight
        );
        fields.x.value = item.imageX;
        fields.y.value = item.imageY;
        place(marker, item);
      };

      const end = () => {
        marker.removeEventListener("pointermove", move);
        marker.removeEventListener("pointerup", end);
        marker.removeEventListener("pointercancel", end);

        if (moved) {
          markDirty(`${item.label}: x ${item.imageX}, y ${item.imageY}.`);
          renderList();
        } else {
          select(item.id);
          scrollInspectorIntoView();
        }
      };

      marker.addEventListener("pointermove", move);
      marker.addEventListener("pointerup", end);
      marker.addEventListener("pointercancel", end);
    });
  }

  function renderList() {
    list.replaceChildren();
    count.textContent = `${hotspots.length} hotspot${hotspots.length === 1 ? "" : "s"}`;

    if (!hotspots.length) {
      const empty = document.createElement("p");
      empty.className = "field-help";
      empty.textContent = "No hay hotspots en la portada.";
      list.appendChild(empty);
      return;
    }

    hotspots.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "hotspot-list-item";
      row.dataset.id = item.id;
      if (item.id === selectedId) row.classList.add("is-selected");

      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "hotspot-list-select";
      selectButton.setAttribute("aria-label", `Editar ${item.label}`);

      const order = document.createElement("span");
      order.className = "hotspot-list-index";
      order.textContent = String(index + 1).padStart(2, "0");

      const text = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = item.label || "Sin etiqueta";
      const details = document.createElement("small");
      details.textContent = `${item.url || "Sin enlace"} · ${item.icon || "point"}`;
      text.append(title, details);
      selectButton.append(order, text);
      selectButton.addEventListener("click", () => {
        select(item.id);
        scrollInspectorIntoView();
      });

      const actions = document.createElement("div");
      actions.className = "hotspot-list-actions";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "secondary";
      edit.textContent = "Editar";
      edit.addEventListener("click", () => {
        select(item.id);
        scrollInspectorIntoView();
        fields.label.focus();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "secondary";
      remove.textContent = "Eliminar";
      remove.addEventListener("click", () => removeById(item.id));

      actions.append(edit, remove);
      row.append(selectButton, actions);
      list.appendChild(row);
    });
  }

  function render() {
    stage.querySelectorAll(".hotspot-marker").forEach(marker => marker.remove());

    hotspots.forEach(item => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "hotspot-marker";
      marker.dataset.id = item.id;
      marker.textContent = item.label || "Sin etiqueta";
      marker.setAttribute("aria-label", `Mover o editar hotspot ${item.label || "sin etiqueta"}`);
      marker.setAttribute("aria-pressed", String(item.id === selectedId));
      place(marker, item);
      attachDrag(marker, item);
      stage.appendChild(marker);
    });

    renderList();
    select(selectedId);
  }

  function removeById(id) {
    const item = hotspots.find(candidate => candidate.id === id);
    if (!item) return;
    if (!confirm(`¿Eliminar el hotspot “${item.label}”?`)) return;

    hotspots = hotspots.filter(candidate => candidate.id !== id);
    if (selectedId === id) selectedId = "";
    render();
    markDirty(`Hotspot “${item.label}” eliminado.`);
  }

  function cleanHotspots() {
    return hotspots.map(item => ({
      id: cleanText(item.id) || uid(),
      label: cleanText(item.label),
      imageX: Math.round(clamp(Number(item.imageX) || 0, 0, imageWidth)),
      imageY: Math.round(clamp(Number(item.imageY) || 0, 0, imageHeight)),
      url: cleanText(item.url),
      icon: cleanText(item.icon) || "point"
    }));
  }

  function validateAll(items) {
    const ids = new Set();
    for (const item of items) {
      if (!item.label) throw new Error("Todos los hotspots deben tener etiqueta.");
      if (!validUrl(item.url)) throw new Error(`El enlace de “${item.label}” no es válido.`);
      if (ids.has(item.id)) throw new Error(`El identificador “${item.id}” está repetido.`);
      ids.add(item.id);
    }
  }

  async function persist() {
    if (selectedItem()) syncSelectedFromForm();

    const clean = cleanHotspots();
    validateAll(clean);
    const serialized = JSON.stringify(clean, null, 2) + "\n";
    await GVPatches.savePatch("src/data/hotspots.json", serialized);

    const patches = await GVPatches.listPatches();
    const stored = patches["src/data/hotspots.json"];
    if (stored === undefined) {
      throw new Error("hotspots.json no apareció en el espacio de actualización.");
    }

    const storedText = stored instanceof Blob ? await stored.text() : String(stored);
    const verified = JSON.parse(storedText);
    if (!Array.isArray(verified) || JSON.stringify(verified) !== JSON.stringify(clean)) {
      throw new Error("La comprobación posterior al guardado no coincide con los hotspots editados.");
    }

    hotspots = verified;
    dirty = false;
    render();
    return serialized;
  }

  function prepareDownload(blob) {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(blob);
    readyDownload.href = downloadUrl;
    readyDownload.download = `gutierrezvidal-hotspots-portada-${new Date().toISOString().slice(0, 10)}.zip`;
    readyDownload.hidden = false;
  }

  async function load() {
    try {
      await new Promise(resolve => {
        if (stageImage.complete && stageImage.naturalWidth) return resolve();
        stageImage.addEventListener("load", resolve, {once: true});
        stageImage.addEventListener("error", resolve, {once: true});
      });

      imageWidth = stageImage.naturalWidth || 1774;
      imageHeight = stageImage.naturalHeight || 887;

      hotspots = JSON.parse(await GVPatches.getFile("src/data/hotspots.json"));
      if (!Array.isArray(hotspots)) throw new Error("Formato de hotspots inválido.");

      hotspots = hotspots.map(item => ({
        id: cleanText(item.id) || uid(),
        label: cleanText(item.label),
        imageX: Number(item.imageX) || 0,
        imageY: Number(item.imageY) || 0,
        url: cleanText(item.url),
        icon: cleanText(item.icon) || "point"
      }));

      selectedId = hotspots[0]?.id || "";
      render();
      setStatus(`${hotspots.length} hotspot${hotspots.length === 1 ? "" : "s"} cargado${hotspots.length === 1 ? "" : "s"} de index.html.`);
    } catch (error) {
      setStatus(error.message);
      addButton.disabled = true;
      saveButton.disabled = true;
      saveDownloadButton.disabled = true;
    }
  }

  addButton.addEventListener("click", () => {
    const item = {
      id: uid(),
      label: "Nuevo hotspot",
      imageX: Math.round(imageWidth / 2),
      imageY: Math.round(imageHeight / 2),
      url: "index.html",
      icon: "point"
    };
    hotspots.push(item);
    selectedId = item.id;
    render();
    markDirty("Hotspot agregado. Completa sus datos y posición.");
    fields.label.focus();
    fields.label.select();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      const item = syncSelectedFromForm();
      render();
      select(item.id);
      markDirty(`Cambios de “${item.label}” aplicados. Falta guardar la actualización.`);
    } catch (error) {
      setStatus(error.message);
    }
  });

  for (const eventName of ["input", "change"]) {
    form.addEventListener(eventName, () => {
      const item = selectedItem();
      if (!item) return;
      item.label = cleanText(fields.label.value);
      item.url = cleanText(fields.url.value);
      item.icon = fields.icon.value || "point";

      const marker = stage.querySelector(`.hotspot-marker[data-id="${CSS.escape(item.id)}"]`);
      if (marker) marker.textContent = item.label || "Sin etiqueta";
      renderList();
      markDirty();
    });
  }

  $("#delete-hotspot").addEventListener("click", () => {
    if (selectedId) removeById(selectedId);
  });

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    saveDownloadButton.disabled = true;
    setStatus("Guardando hotspots de la portada…");
    try {
      await persist();
      setStatus(`${hotspots.length} hotspot${hotspots.length === 1 ? "" : "s"} guardado${hotspots.length === 1 ? "" : "s"} en src/data/hotspots.json.`);
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
    setStatus("Guardando y preparando el ZIP…");
    try {
      await persist();
      const {blob} = await GVPatches.buildPatchZip(["src/data/hotspots.json"]);
      prepareDownload(blob);
      readyDownload.click();
      setStatus("ZIP de hotspots preparado. Si no inició la descarga, pulsa «Descargar ZIP preparado».");
    } catch (error) {
      setStatus(`No se pudo preparar el ZIP: ${error.message}`);
    } finally {
      saveButton.disabled = false;
      saveDownloadButton.disabled = false;
    }
  });

  window.addEventListener("beforeunload", event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  window.GVIndexHotspotsEditor = {
    getHotspots: () => JSON.parse(JSON.stringify(hotspots)),
    select,
    removeById
  };

  load();
})();