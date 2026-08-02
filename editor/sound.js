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
  const inspector = $("#sound-inspector");
  const hotspotList = $("#sound-hotspot-list");
  const hotspotCount = $("#sound-hotspot-count");
  const pageTitle = $("#sound-page-title");
  const pageDescription = $("#sound-page-description");
  const helpText = $("#sound-help-text");
  const archiveTitle = $("#sound-archive-title");
  const archiveIntro = $("#sound-archive-intro");
  const syncArchiveButton = $("#sound-sync-archive");
  const archivePagesList = $("#sound-archive-pages");

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
  let soundPageSource = "";
  let navigation = [];
  let archivePages = [];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const uid = () => `sonido-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const cleanText = value => String(value || "").trim();

  function escapeHTML(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function pageFieldState() {
    return {
      title: pageTitle.value,
      description: pageDescription.value,
      help: helpText.value,
      archiveTitle: archiveTitle.value,
      archiveIntro: archiveIntro.value
    };
  }

  function applyPageFieldState(value = {}) {
    pageTitle.value = value.title || "";
    pageDescription.value = value.description || "";
    helpText.value = value.help || "";
    archiveTitle.value = value.archiveTitle || "";
    archiveIntro.value = value.archiveIntro || "";
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function saveDraft() {
    if (!data) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        savedAt: new Date().toISOString(),
        data,
        page: pageFieldState()
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

  function findNavigationItem(items, url) {
    for (const item of items || []) {
      if (item.url === url) return item;
      const nested = findNavigationItem(item.children, url);
      if (nested) return nested;
    }
    return null;
  }

  function parseHTML(html) {
    return new DOMParser().parseFromString(html, "text/html");
  }

  function archiveCardFor(doc, page) {
    const article = doc.createElement("article");
    article.className = "sound-item";
    article.dataset.pageUrl = page.url;

    const text = doc.createElement("div");
    const heading = doc.createElement("h3");
    heading.textContent = page.title;
    const paragraph = doc.createElement("p");
    paragraph.textContent = page.description || "Ficha individual.";
    text.append(heading, paragraph);

    const link = doc.createElement("a");
    link.className = "secondary";
    link.href = page.url;
    link.textContent = "Abrir ficha";
    article.append(text, link);
    return article;
  }

  async function readArchivePages() {
    const soundNode = findNavigationItem(navigation, "sonido.html");
    const children = Array.isArray(soundNode?.children) ? soundNode.children : [];
    const existingDoc = soundPageSource ? parseHTML(soundPageSource) : null;
    const existingCards = new Map();
    existingDoc?.querySelectorAll("#sound-list .sound-item").forEach(card => {
      const href = card.dataset.pageUrl || card.querySelector("a[href]")?.getAttribute("href") || "";
      if (href) existingCards.set(href, card);
    });

    const pages = [];
    for (const child of children) {
      let title = child.label || child.url;
      let description = existingCards.get(child.url)?.querySelector("p")?.textContent?.trim() || "";
      let available = true;
      try {
        const pageHTML = await GVPatches.getFile(child.url);
        const pageDoc = parseHTML(pageHTML);
        title = pageDoc.querySelector(".page-title")?.textContent?.trim() || title;
        description = pageDoc.querySelector(".page-deck")?.textContent?.trim()
          || pageDoc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim()
          || description;
      } catch {
        available = false;
      }
      pages.push({url: child.url, title, description, available});
    }
    archivePages = pages;
    renderArchivePages();
    return pages;
  }

  function renderArchivePages() {
    archivePagesList.replaceChildren();
    if (!archivePages.length) {
      const empty = document.createElement("li");
      empty.textContent = "No hay subpáginas registradas bajo Sonido.";
      archivePagesList.appendChild(empty);
      return;
    }
    for (const page of archivePages) {
      const item = document.createElement("li");
      const text = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = page.title;
      const path = document.createElement("small");
      path.textContent = page.url;
      text.append(title, path);
      const state = document.createElement("span");
      state.className = "archive-state";
      state.textContent = page.available ? "Lista" : "Página no disponible";
      item.append(text, state);
      archivePagesList.appendChild(item);
    }
  }

  function loadSoundPageFields() {
    const doc = parseHTML(soundPageSource);
    const title = doc.querySelector("title")?.textContent?.trim() || "Sonido · Carlos Adolfo Gutiérrez Vidal";
    const description = doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || "";
    const help = doc.querySelector(".sound-help")?.textContent?.trim() || "";
    const heading = doc.querySelector("#sound-archive-title")?.textContent?.trim() || "Archivo sonoro";
    const intro = doc.querySelector(".sound-archive__header p")?.textContent?.trim() || "";
    applyPageFieldState({title, description, help, archiveTitle: heading, archiveIntro: intro});
  }

  function updateMeta(doc, selector, value) {
    const element = doc.querySelector(selector);
    if (element) element.setAttribute("content", value);
  }

  function ensureHeadAsset(doc, selector, create) {
    let node = doc.querySelector(selector);
    if (!node) {
      node = create();
      doc.head.appendChild(node);
    }
    return node;
  }

  function ensureSoundPageStructure(doc) {
    ensureHeadAsset(doc, 'link[href$="sound-viewer.css"]', () => {
      const link = doc.createElement("link");
      link.rel = "stylesheet";
      link.href = "src/css/sound-viewer.css";
      return link;
    });

    ensureHeadAsset(doc, 'script[type="importmap"]', () => {
      const script = doc.createElement("script");
      script.type = "importmap";
      script.textContent = JSON.stringify({
        imports: {
          three: "https://unpkg.com/three@0.167.1/build/three.module.js",
          OrbitControls: "https://unpkg.com/three@0.167.1/examples/jsm/controls/OrbitControls.js"
        }
      }, null, 2);
      return script;
    });

    const body = doc.body;
    const footerMarker = body.querySelector("[data-site-footer]");

    let main = doc.querySelector("main.sound-page");
    if (!main) {
      main = doc.createElement("main");
      main.className = "sound-page";
      const oldMain = doc.querySelector("main");
      if (oldMain) oldMain.replaceWith(main);
      else body.insertBefore(main, footerMarker || null);
    }

    let viewer = doc.querySelector("#sound-viewer");
    if (!viewer) {
      viewer = doc.createElement("section");
      viewer.id = "sound-viewer";
      viewer.className = "sound-panorama";
      viewer.setAttribute("aria-label", "Panorama sonoro interactivo");
      main.prepend(viewer);
    } else if (!main.contains(viewer)) {
      main.prepend(viewer);
    }

    let help = viewer.querySelector(".sound-help");
    if (!help) {
      help = doc.createElement("p");
      help.className = "sound-help";
      viewer.prepend(help);
    }

    let archive = doc.querySelector(".sound-archive");
    if (!archive) {
      archive = doc.createElement("section");
      archive.className = "sound-archive";
      archive.setAttribute("aria-labelledby", "sound-archive-title");
      archive.innerHTML = `
        <div class="sound-archive__inner">
          <header class="sound-archive__header">
            <h2 id="sound-archive-title">Archivo sonoro</h2>
            <p>Lista accesible de las piezas y grabaciones disponibles en el panorama.</p>
          </header>
          <div class="sound-list" id="sound-list"></div>
        </div>`;
      body.insertBefore(archive, footerMarker || null);
    }

    let dialog = doc.querySelector("#sound-dialog");
    if (!dialog) {
      dialog = doc.createElement("dialog");
      dialog.id = "sound-dialog";
      dialog.className = "sound-dialog";
      dialog.setAttribute("aria-labelledby", "sound-dialog-title");
      dialog.innerHTML = `
        <header class="sound-dialog__header">
          <h2 id="sound-dialog-title">Escuchar</h2>
          <button class="sound-dialog__close" id="sound-dialog-close" type="button" aria-label="Cerrar">×</button>
        </header>
        <div class="sound-dialog__body">
          <p class="sound-dialog__description" id="sound-dialog-description"></p>
          <div class="sound-embed" id="sound-embed"></div>
          <a class="sound-source-link" id="sound-source-link" href="#" target="_blank" rel="noopener noreferrer">Abrir en la plataforma original</a>
        </div>`;
      body.insertBefore(dialog, footerMarker || null);
    }

    ensureHeadAsset(doc, 'script[type="module"][src$="sound-viewer.js"]', () => {
      const script = doc.createElement("script");
      script.type = "module";
      script.src = "src/js/sound-viewer.js";
      body.appendChild(script);
      return script;
    });

    return {
      help: viewer.querySelector(".sound-help"),
      archiveHeading: archive.querySelector("#sound-archive-title"),
      archiveParagraph: archive.querySelector(".sound-archive__header p"),
      list: archive.querySelector("#sound-list")
    };
  }

  async function buildSoundPage() {
    const title = cleanText(pageTitle.value);
    const description = cleanText(pageDescription.value);
    const help = cleanText(helpText.value);
    const heading = cleanText(archiveTitle.value);
    const intro = cleanText(archiveIntro.value);
    if (!title) throw new Error("El título del documento es obligatorio.");
    if (description.length < 40) throw new Error("La descripción SEO necesita al menos 40 caracteres.");
    if (!help || !heading || !intro) throw new Error("Completa todos los textos de sonido.html.");

    await readArchivePages();
    const doc = parseHTML(soundPageSource);
    const structure = ensureSoundPageStructure(doc);
    const helpNode = structure.help;
    const archiveHeading = structure.archiveHeading;
    const archiveParagraph = structure.archiveParagraph;
    const list = structure.list;

    doc.title = title;
    updateMeta(doc, 'meta[name="description"]', description);
    updateMeta(doc, 'meta[property="og:title"]', title);
    updateMeta(doc, 'meta[property="og:description"]', description);
    updateMeta(doc, 'meta[name="twitter:title"]', title);
    updateMeta(doc, 'meta[name="twitter:description"]', description);
    for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const schema = JSON.parse(script.textContent);
        const nodes = Array.isArray(schema?.["@graph"]) ? schema["@graph"] : [schema];
        for (const node of nodes) {
          if (!node || typeof node !== "object") continue;
          if (node.url === "https://www.gutierrezvidal.com/sonido.html" || node["@id"]?.includes("/sonido.html")) {
            if ("name" in node) node.name = title;
            if ("description" in node) node.description = description;
          }
        }
        script.textContent = JSON.stringify(schema);
      } catch {
        // Se conserva cualquier JSON-LD ajeno que no pueda interpretarse.
      }
    }
    helpNode.textContent = help;
    archiveHeading.textContent = heading;
    archiveParagraph.textContent = intro;
    list.replaceChildren(...archivePages.map(page => archiveCardFor(doc, page)));
    return `<!doctype html>
${doc.documentElement.outerHTML}`;
  }

  function selectedItem() {
    return data?.hotspots.find(item => item.id === selectedId) || null;
  }

  function syncSelectedFromForm({normalize = false} = {}) {
    const item = selectedItem();
    if (!item) return null;

    item.title = cleanText(fields.title.value) || "Nuevo material";
    item.description = cleanText(fields.description.value);
    item.sourceUrl = cleanText(fields.source.value);
    item.published = fields.published.checked;

    const embedInput = cleanText(fields.embed.value);
    if (!embedInput) {
      item.embedCode = "";
      item.embedUrl = "";
      if (normalize && item.published) item.published = false;
      return item;
    }

    if (normalize) {
      const sanitized = GVEmbeds.sanitize(embedInput, {title: item.title});
      item.embedCode = sanitized.html;
      item.embedUrl = sanitized.primaryUrl || "";
      item.platform = "generic";
      fields.embed.value = item.embedCode;
    } else {
      item.embedCode = embedInput;
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
      const rawEmbed = cleanText(item.embedCode || item.embedUrl);

      if (!rawEmbed) {
        item.embedCode = "";
        item.embedUrl = "";
        if (item.published !== false) {
          item.published = false;
          warnings.push(`“${item.title}” se guardó como borrador porque no tiene código incrustado.`);
        }
        continue;
      }

      const sanitized = GVEmbeds.sanitize(rawEmbed, {title: item.title});
      item.embedCode = sanitized.html;
      item.embedUrl = sanitized.primaryUrl || "";
      item.platform = "generic";
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

  function scrollInspectorIntoView() {
    const narrow = window.matchMedia?.("(max-width: 940px)")?.matches;
    if (narrow) {
      inspector.scrollIntoView({behavior: "smooth", block: "start"});
    }
  }

  function removeHotspotById(id) {
    const item = data?.hotspots.find(candidate => candidate.id === id);
    if (!item) return false;
    if (!confirm(`¿Eliminar el hotspot “${item.title}”?`)) return false;

    data.hotspots = data.hotspots.filter(candidate => candidate.id !== id);
    if (selectedId === id) selectedId = "";
    render();
    markDirty(`Hotspot “${item.title}” eliminado.`);
    return true;
  }

  function renderHotspotList() {
    hotspotList.replaceChildren();
    const count = data?.hotspots.length || 0;
    hotspotCount.textContent = `${count} hotspot${count === 1 ? "" : "s"}`;

    if (!count) {
      const empty = document.createElement("p");
      empty.className = "field-help sound-hotspot-list-empty";
      empty.textContent = "No hay hotspots. Usa «Agregar hotspot» para crear el primero.";
      hotspotList.appendChild(empty);
      return;
    }

    data.hotspots.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "sound-hotspot-list-item";
      row.dataset.id = item.id;
      if (item.id === selectedId) row.classList.add("is-selected");

      const identity = document.createElement("button");
      identity.type = "button";
      identity.className = "sound-hotspot-list-select";
      identity.setAttribute("aria-label", `Editar ${item.title || "hotspot"}`);
      const order = document.createElement("span");
      order.className = "sound-hotspot-list-index";
      order.textContent = String(index + 1).padStart(2, "0");
      const text = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = item.title || "Sin título";
      const state = document.createElement("small");
      state.textContent = item.published === false
        ? "No aparece en sonido.html · Borrador"
        : "Visible en sonido.html · Publicado";
      text.append(title, state);
      identity.append(order, text);
      identity.addEventListener("click", () => {
        select(item.id);
        scrollInspectorIntoView();
      });

      const actions = document.createElement("div");
      actions.className = "sound-hotspot-list-actions";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "secondary";
      edit.textContent = "Editar";
      edit.addEventListener("click", () => {
        select(item.id);
        scrollInspectorIntoView();
        fields.title.focus();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "secondary";
      remove.textContent = "Eliminar";
      remove.addEventListener("click", () => removeHotspotById(item.id));

      actions.append(edit, remove);
      row.append(identity, actions);
      hotspotList.appendChild(row);
    });
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
    fields.platform.value = item.platform || "generic";
    fields.embed.value = item.embedCode || item.embedUrl || "";
    fields.source.value = item.sourceUrl || "";
    fields.published.checked = item.published !== false;
    fields.x.value = Math.round(Number(item.imageX) || 0);
    fields.y.value = Math.round(Number(item.imageY) || 0);
    $("#sound-inspector-title").textContent = `Hotspot: ${item.title || "Sin título"}`;

    hotspotList.querySelectorAll(".sound-hotspot-list-item").forEach(row => {
      row.classList.toggle("is-selected", row.dataset.id === id);
    });
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
          clamp(moveEvent.clientX - rect.left, 0, rect.width) / rect.width * data.panorama.width
        );
        item.imageY = Math.round(
          clamp(moveEvent.clientY - rect.top, 0, rect.height) / rect.height * data.panorama.height
        );
        fields.x.value = item.imageX;
        fields.y.value = item.imageY;
        placeMarker(marker, item);
      };

      const end = () => {
        marker.removeEventListener("pointermove", move);
        marker.removeEventListener("pointerup", end);
        marker.removeEventListener("pointercancel", end);

        if (moved) {
          markDirty(`${item.title || "Hotspot"}: x ${item.imageX}, y ${item.imageY}.`);
          renderHotspotList();
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
    renderHotspotList();
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

  for (const field of [pageTitle, pageDescription, helpText, archiveTitle, archiveIntro]) {
    field.addEventListener("input", () => markDirty("Cambios de sonido.html sin guardar."));
  }

  syncArchiveButton.addEventListener("click", async () => {
    syncArchiveButton.disabled = true;
    setStatus("Sincronizando subpáginas de Sonido…");
    try {
      await readArchivePages();
      markDirty(`${archivePages.length} subpágina${archivePages.length === 1 ? "" : "s"} sincronizada${archivePages.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      syncArchiveButton.disabled = false;
    }
  });

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
      platform: "generic",
      embedCode: "",
      embedUrl: "",
      sourceUrl: "",
      imageX: Math.round(data.panorama.width / 2),
      imageY: Math.round(data.panorama.height / 2),
      published: true
    };
    data.hotspots.push(item);
    selectedId = item.id;
    render();
    markDirty("Hotspot agregado como publicado. Completa el código incrustado y ubícalo.");
    fields.title.select();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      const item = syncSelectedFromForm({normalize: true});
      if (!item) return;
      render();
      select(item.id);
      markDirty(`Cambios de “${item.title}” guardados en la sesión. Falta guardar la actualización del sitio.`);
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
    if (selectedId) removeHotspotById(selectedId);
  });

  async function persistCurrentState() {
    const warnings = normalizeAllHotspots();
    const serialized = JSON.stringify(data, null, 2) + "\n";
    const soundHTML = await buildSoundPage();

    await GVPatches.savePatch("src/data/sound-hotspots.json", serialized);
    await GVPatches.savePatch("sonido.html", soundHTML);
    if (panoramaBlob) {
      await GVPatches.savePatch("public/panorama/sonido-360.jpg", panoramaBlob);
    }

    const patches = await GVPatches.listPatches();
    if (!Object.prototype.hasOwnProperty.call(patches, "src/data/sound-hotspots.json")) {
      throw new Error("El JSON de Sonido no apareció en el espacio de actualización.");
    }
    if (!Object.prototype.hasOwnProperty.call(patches, "sonido.html")) {
      throw new Error("sonido.html no apareció en el espacio de actualización.");
    }

    const stored = patches["src/data/sound-hotspots.json"];
    const verified = JSON.parse(stored instanceof Blob ? await stored.text() : String(stored));
    if (!Array.isArray(verified.hotspots) || verified.hotspots.length !== data.hotspots.length) {
      throw new Error("La verificación del JSON guardado no coincide con los hotspots actuales.");
    }

    soundPageSource = soundHTML;
    saveDraft();
    const paths = Object.keys(patches).filter(path =>
      path === "src/data/sound-hotspots.json" ||
      path === "sonido.html" ||
      path === "public/panorama/sonido-360.jpg"
    );
    displaySavedFiles(paths);
    return {serialized, soundHTML, warnings, paths, patches};
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
    zip.file("sonido.html", saved.soundHTML);

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
      soundPageSource = await GVPatches.getFile("sonido.html");
      navigation = JSON.parse(await GVPatches.getFile("src/data/navigation.json"));
      loadSoundPageFields();
      await readArchivePages();

      const workspaceState = await GVPatches.status();
      const draft = readDraft();
      const draftTime = draft?.savedAt ? Date.parse(draft.savedAt) : 0;
      const workspaceTime = workspaceState.updatedAt ? Date.parse(workspaceState.updatedAt) : 0;

      if (draft && draftTime > workspaceTime) {
        data = draft.data;
        if (draft.page) applyPageFieldState(draft.page);
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
        item.embedCode = item.embedCode || item.embedUrl || "";
        item.platform = item.platform || "generic";
      });

      panoramaAlt.value = data.panorama.alt || "";
      setPanoramaPreview();
      render();

      const patches = await GVPatches.listPatches();
      displaySavedFiles(
        Object.keys(patches).filter(path =>
          path === "src/data/sound-hotspots.json" ||
          path === "sonido.html" ||
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