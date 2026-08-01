(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const status = $("#menu-status");
  const tree = $("#menu-tree");
  const form = $("#menu-form");
  const noSelection = $("#menu-no-selection");
  const labelField = $("#menu-label");
  const urlField = $("#menu-url");
  const saveButton = $("#menu-save");
  const saveDownloadButton = $("#menu-save-download");
  const reloadButton = $("#menu-reload");
  const readyDownload = $("#menu-ready-download");
  const validationDetails = $("#menu-validation-details");
  const validationList = $("#menu-validation-list");

  const ID_PROPERTY = "__gvMenuEditorId";
  const DRAFT_KEY = "gutierrezvidal-menu-editor-draft-v1";

  let navigation = [];
  let selectedId = "";
  let dirty = false;
  let downloadUrl = "";

  const uid = () => `menu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const cleanText = value => String(value || "").trim();

  function setStatus(message) {
    status.textContent = message;
  }

  function ensureId(item) {
    if (!item || typeof item !== "object") return "";
    if (!item[ID_PROPERTY]) {
      Object.defineProperty(item, ID_PROPERTY, {
        value: uid(),
        writable: true,
        configurable: true,
        enumerable: false
      });
    }
    return item[ID_PROPERTY];
  }

  function assignIds(items) {
    for (const item of items) {
      ensureId(item);
      if (Array.isArray(item.children)) assignIds(item.children);
    }
  }

  function cloneNavigation(items) {
    return JSON.parse(JSON.stringify(items));
  }

  function findLocation(id, items = navigation, parentItem = null, depth = 0) {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (item[ID_PROPERTY] === id) {
        return {item, parentArray: items, index, parentItem, depth};
      }
      if (Array.isArray(item.children)) {
        const nested = findLocation(id, item.children, item, depth + 1);
        if (nested) return nested;
      }
    }
    return null;
  }

  function selectedLocation() {
    return selectedId ? findLocation(selectedId) : null;
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        savedAt: new Date().toISOString(),
        navigation: cloneNavigation(navigation),
        selectedPath: pathForId(selectedId)
      }));
    } catch (error) {
      console.warn("No se pudo guardar el borrador del menú:", error);
    }
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.navigation) ? parsed : null;
    } catch {
      return null;
    }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }

  function pathForId(id, items = navigation, path = []) {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const current = [...path, index];
      if (item[ID_PROPERTY] === id) return current;
      if (Array.isArray(item.children)) {
        const nested = pathForId(id, item.children, [...current, "children"]);
        if (nested) return nested;
      }
    }
    return null;
  }

  function itemAtPath(path, items = navigation) {
    if (!Array.isArray(path)) return null;
    let current = items;
    let item = null;
    for (const part of path) {
      if (part === "children") {
        current = item?.children;
        if (!Array.isArray(current)) return null;
      } else {
        item = current?.[part];
        if (!item) return null;
      }
    }
    return item;
  }

  function markDirty(message = "Cambios del menú sin guardar.") {
    dirty = true;
    saveButton.disabled = false;
    saveDownloadButton.disabled = false;
    reloadButton.disabled = false;
    readyDownload.hidden = true;
    saveDraft();
    setStatus(message);
    showValidation();
  }

  function validUrl(value) {
    const url = cleanText(value);
    if (!url) return {ok: true};

    if (/[\u0000-\u001f\u007f]/.test(url)) {
      return {ok: false, message: "contiene caracteres de control"};
    }
    if (/^(javascript|data|vbscript):/i.test(url)) {
      return {ok: false, message: "usa un protocolo no permitido"};
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !/^(https?:|mailto:|tel:)/i.test(url)) {
      return {ok: false, message: "usa un protocolo no admitido"};
    }
    if (url.startsWith("//")) {
      return {ok: false, message: "debe indicar https:// explícitamente"};
    }
    if (/\s/.test(url)) {
      return {ok: false, message: "contiene espacios"};
    }
    return {ok: true};
  }

  function validateNavigation(items = navigation) {
    const issues = [];
    const seenUrls = new Map();

    function walk(branch, labels = [], depth = 0) {
      if (!Array.isArray(branch)) {
        issues.push({type: "error", message: "La navegación no es una lista válida."});
        return;
      }

      branch.forEach((item, index) => {
        const label = cleanText(item?.label);
        const path = [...labels, label || `Elemento ${index + 1}`].join(" › ");
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          issues.push({type: "error", message: `${path}: el elemento no es válido.`});
          return;
        }
        if (!label) {
          issues.push({type: "error", message: `${path}: falta la etiqueta.`});
        }

        const url = cleanText(item.url);
        const urlState = validUrl(url);
        if (!urlState.ok) {
          issues.push({type: "error", message: `${path}: el enlace ${urlState.message}.`});
        }

        if (url) {
          const previous = seenUrls.get(url);
          if (previous) {
            issues.push({
              type: "warning",
              message: `${path}: repite el enlace usado en ${previous}.`
            });
          } else {
            seenUrls.set(url, path);
          }
        }

        const children = Array.isArray(item.children) ? item.children : [];
        if (!url && !children.length) {
          issues.push({
            type: "warning",
            message: `${path}: es un encabezado vacío, sin enlace ni hijos.`
          });
        }
        if (depth >= 5) {
          issues.push({
            type: "warning",
            message: `${path}: tiene una profundidad de ${depth + 1} niveles.`
          });
        }
        if (item.children !== undefined && !Array.isArray(item.children)) {
          issues.push({type: "error", message: `${path}: children debe ser una lista.`});
        } else if (children.length) {
          walk(children, [...labels, label || `Elemento ${index + 1}`], depth + 1);
        }
      });
    }

    walk(items);
    return issues;
  }

  function showValidation() {
    const issues = validateNavigation();
    validationList.replaceChildren();
    issues.forEach(issue => {
      const item = document.createElement("li");
      item.className = issue.type === "error"
        ? "menu-validation-error"
        : "menu-validation-warning";
      item.textContent = issue.message;
      validationList.appendChild(item);
    });
    validationDetails.hidden = !issues.length;
    return issues;
  }

  function cleanItem(item) {
    const output = {};
    for (const [key, value] of Object.entries(item)) {
      if (key === "label" || key === "url" || key === "children") continue;
      output[key] = value;
    }

    output.label = cleanText(item.label);
    const url = cleanText(item.url);
    if (url) output.url = url;

    const children = Array.isArray(item.children)
      ? item.children.map(cleanItem)
      : [];
    if (children.length) output.children = children;
    return output;
  }

  function cleanNavigation() {
    return navigation.map(cleanItem);
  }

  function select(id) {
    selectedId = id || "";
    const location = selectedLocation();
    tree.querySelectorAll(".menu-select").forEach(button => {
      button.setAttribute("aria-current", String(button.dataset.id === selectedId));
    });

    form.hidden = !location;
    noSelection.hidden = Boolean(location);
    if (!location) return;

    labelField.value = location.item.label || "";
    urlField.value = location.item.url || "";
    updatePositionButtons(location);
  }

  function updatePositionButtons(location = selectedLocation()) {
    const disabled = !location;
    $("#menu-up").disabled = disabled || location.index === 0;
    $("#menu-down").disabled = disabled || location.index >= location.parentArray.length - 1;
    $("#menu-indent").disabled = disabled || location.index === 0;
    $("#menu-outdent").disabled = disabled || !location.parentItem;
  }

  function quickButton(label, title, disabled, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.disabled = disabled;
    button.addEventListener("click", event => {
      event.stopPropagation();
      action();
    });
    return button;
  }

  function renderBranch(items, parent = null) {
    const list = document.createElement("ol");

    items.forEach((item, index) => {
      const node = document.createElement("li");
      node.className = "menu-node";

      const row = document.createElement("div");
      row.className = "menu-row";

      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "menu-select";
      selectButton.dataset.id = ensureId(item);
      selectButton.setAttribute("aria-current", String(item[ID_PROPERTY] === selectedId));

      const label = document.createElement("strong");
      label.textContent = item.label || "Sin etiqueta";
      const url = document.createElement("small");
      url.textContent = item.url || (item.children?.length ? "Grupo" : "Sin enlace");
      selectButton.append(label, url);
      selectButton.addEventListener("click", () => select(item[ID_PROPERTY]));

      const controls = document.createElement("div");
      controls.className = "menu-row-controls";
      controls.append(
        quickButton("↑", `Subir ${item.label || "elemento"}`, index === 0, () => move(item[ID_PROPERTY], "up")),
        quickButton("↓", `Bajar ${item.label || "elemento"}`, index === items.length - 1, () => move(item[ID_PROPERTY], "down")),
        quickButton("→", `Sangrar ${item.label || "elemento"}`, index === 0, () => move(item[ID_PROPERTY], "indent")),
        quickButton("←", `Desangrar ${item.label || "elemento"}`, !parent, () => move(item[ID_PROPERTY], "outdent"))
      );

      row.append(selectButton, controls);
      node.appendChild(row);

      if (Array.isArray(item.children) && item.children.length) {
        node.appendChild(renderBranch(item.children, item));
      }
      list.appendChild(node);
    });
    return list;
  }

  function render() {
    tree.replaceChildren();
    if (!navigation.length) {
      const empty = document.createElement("p");
      empty.className = "field-help";
      empty.textContent = "El menú está vacío. Agrega un elemento principal.";
      tree.appendChild(empty);
    } else {
      tree.appendChild(renderBranch(navigation));
    }
    select(selectedId);
  }

  function newItem(label = "Nuevo enlace") {
    const item = {label, url: ""};
    ensureId(item);
    return item;
  }

  function addRoot() {
    const item = newItem("Nuevo elemento principal");
    navigation.push(item);
    selectedId = item[ID_PROPERTY];
    render();
    markDirty("Elemento principal agregado.");
    labelField.focus();
    labelField.select();
  }

  function addChild() {
    const location = selectedLocation();
    if (!location) return;
    location.item.children = Array.isArray(location.item.children)
      ? location.item.children
      : [];
    const item = newItem("Nuevo subelemento");
    location.item.children.push(item);
    selectedId = item[ID_PROPERTY];
    render();
    markDirty(`Subelemento agregado dentro de “${location.item.label}”.`);
    labelField.focus();
    labelField.select();
  }

  function addAfter() {
    const location = selectedLocation();
    if (!location) return;
    const item = newItem("Nuevo elemento");
    location.parentArray.splice(location.index + 1, 0, item);
    selectedId = item[ID_PROPERTY];
    render();
    markDirty(`Elemento agregado después de “${location.item.label}”.`);
    labelField.focus();
    labelField.select();
  }

  function move(id, direction) {
    const location = findLocation(id);
    if (!location) return;

    if (direction === "up" && location.index > 0) {
      [location.parentArray[location.index - 1], location.parentArray[location.index]] =
        [location.parentArray[location.index], location.parentArray[location.index - 1]];
    } else if (direction === "down" && location.index < location.parentArray.length - 1) {
      [location.parentArray[location.index + 1], location.parentArray[location.index]] =
        [location.parentArray[location.index], location.parentArray[location.index + 1]];
    } else if (direction === "indent" && location.index > 0) {
      const previous = location.parentArray[location.index - 1];
      location.parentArray.splice(location.index, 1);
      previous.children = Array.isArray(previous.children) ? previous.children : [];
      previous.children.push(location.item);
    } else if (direction === "outdent" && location.parentItem) {
      const parentLocation = findLocation(location.parentItem[ID_PROPERTY]);
      if (!parentLocation) return;
      location.parentArray.splice(location.index, 1);
      if (!location.parentArray.length) delete location.parentItem.children;
      parentLocation.parentArray.splice(parentLocation.index + 1, 0, location.item);
    } else {
      return;
    }

    selectedId = location.item[ID_PROPERTY];
    render();
    markDirty(`“${location.item.label}” cambió de posición.`);
  }

  function applyForm() {
    const location = selectedLocation();
    if (!location) return;

    const label = cleanText(labelField.value);
    if (!label) throw new Error("La etiqueta es obligatoria.");

    const url = cleanText(urlField.value);
    const urlState = validUrl(url);
    if (!urlState.ok) throw new Error(`El enlace ${urlState.message}.`);

    location.item.label = label;
    if (url) location.item.url = url;
    else delete location.item.url;

    render();
    markDirty(`Cambios aplicados a “${label}”.`);
  }

  function removePromote() {
    const location = selectedLocation();
    if (!location) return;
    const children = Array.isArray(location.item.children)
      ? location.item.children
      : [];
    if (!confirm(`¿Quitar “${location.item.label}” del menú? Sus ${children.length} hijo${children.length === 1 ? "" : "s"} ocuparán su lugar.`)) {
      return;
    }
    location.parentArray.splice(location.index, 1, ...children);
    selectedId = children[0]?.[ID_PROPERTY] || location.parentArray[location.index]?.[ID_PROPERTY] || "";
    render();
    markDirty(`“${location.item.label}” fue quitado; sus hijos se conservaron.`);
  }

  function countBranch(item) {
    return 1 + (Array.isArray(item.children)
      ? item.children.reduce((total, child) => total + countBranch(child), 0)
      : 0);
  }

  function removeBranch() {
    const location = selectedLocation();
    if (!location) return;
    const count = countBranch(location.item);
    if (!confirm(`¿Quitar “${location.item.label}” y toda su rama (${count} elemento${count === 1 ? "" : "s"}) del menú? Las páginas no se borrarán.`)) {
      return;
    }
    location.parentArray.splice(location.index, 1);
    selectedId = location.parentArray[location.index]?.[ID_PROPERTY]
      || location.parentArray[location.index - 1]?.[ID_PROPERTY]
      || location.parentItem?.[ID_PROPERTY]
      || "";
    render();
    markDirty(`Se quitó la rama “${location.item.label}”.`);
  }

  async function persist() {
    if (selectedLocation()) applyForm();

    const issues = showValidation();
    const errors = issues.filter(issue => issue.type === "error");
    if (errors.length) {
      validationDetails.open = true;
      throw new Error(`El menú tiene ${errors.length} error${errors.length === 1 ? "" : "es"} que impiden guardarlo.`);
    }

    const cleaned = cleanNavigation();
    const serialized = JSON.stringify(cleaned, null, 2) + "\n";
    await GVPatches.savePatch("src/data/navigation.json", serialized);

    const patches = await GVPatches.listPatches();
    const stored = patches["src/data/navigation.json"];
    if (stored === undefined) {
      throw new Error("navigation.json no apareció en el espacio de actualización.");
    }
    const storedText = stored instanceof Blob ? await stored.text() : String(stored);
    const verified = JSON.parse(storedText);
    if (JSON.stringify(verified) !== JSON.stringify(cleaned)) {
      throw new Error("La comprobación posterior al guardado no coincide con el menú editado.");
    }

    navigation = verified;
    assignIds(navigation);
    selectedId = navigation[0]?.[ID_PROPERTY] || "";
    dirty = false;
    clearDraft();
    saveButton.disabled = true;
    saveDownloadButton.disabled = false;
    reloadButton.disabled = false;
    render();
    return {serialized, warnings: issues.filter(issue => issue.type === "warning")};
  }

  function prepareDownload(blob) {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(blob);
    readyDownload.href = downloadUrl;
    readyDownload.download = `gutierrezvidal-menu-${new Date().toISOString().slice(0, 10)}.zip`;
    readyDownload.hidden = false;
  }

  async function loadCurrent({useDraft = true} = {}) {
    setStatus("Cargando navegación…");
    saveButton.disabled = true;
    saveDownloadButton.disabled = true;
    reloadButton.disabled = true;
    readyDownload.hidden = true;

    const draft = useDraft ? readDraft() : null;
    if (draft) {
      navigation = draft.navigation;
      assignIds(navigation);
      const selected = itemAtPath(draft.selectedPath);
      selectedId = selected?.[ID_PROPERTY] || navigation[0]?.[ID_PROPERTY] || "";
      dirty = true;
      render();
      showValidation();
      saveButton.disabled = false;
      saveDownloadButton.disabled = false;
      reloadButton.disabled = false;
      setStatus(`Borrador no guardado recuperado (${new Date(draft.savedAt).toLocaleString("es-MX")}).`);
      return;
    }

    navigation = JSON.parse(await GVPatches.getFile("src/data/navigation.json"));
    if (!Array.isArray(navigation)) throw new Error("navigation.json no contiene una lista.");
    assignIds(navigation);
    selectedId = navigation[0]?.[ID_PROPERTY] || "";
    dirty = false;
    render();
    const issues = showValidation();
    saveButton.disabled = true;
    saveDownloadButton.disabled = false;
    reloadButton.disabled = false;
    setStatus(
      `${navigation.length} elemento${navigation.length === 1 ? "" : "s"} principal${navigation.length === 1 ? "" : "es"} cargado${navigation.length === 1 ? "" : "s"}.` +
      (issues.length ? ` Se encontraron ${issues.length} aviso${issues.length === 1 ? "" : "s"}.` : "")
    );
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      applyForm();
    } catch (error) {
      setStatus(error.message);
    }
  });

  $("#menu-add-root").addEventListener("click", addRoot);
  $("#menu-add-child").addEventListener("click", addChild);
  $("#menu-add-after").addEventListener("click", addAfter);
  $("#menu-up").addEventListener("click", () => move(selectedId, "up"));
  $("#menu-down").addEventListener("click", () => move(selectedId, "down"));
  $("#menu-indent").addEventListener("click", () => move(selectedId, "indent"));
  $("#menu-outdent").addEventListener("click", () => move(selectedId, "outdent"));
  $("#menu-remove-promote").addEventListener("click", removePromote);
  $("#menu-remove-branch").addEventListener("click", removeBranch);

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    saveDownloadButton.disabled = true;
    setStatus("Guardando navigation.json…");
    try {
      const {warnings} = await persist();
      setStatus(
        "Menú guardado en src/data/navigation.json." +
        (warnings.length ? ` Conserva ${warnings.length} aviso${warnings.length === 1 ? "" : "s"} no bloqueante${warnings.length === 1 ? "" : "s"}.` : "")
      );
    } catch (error) {
      setStatus(`No se guardó: ${error.message}`);
      saveButton.disabled = false;
    } finally {
      saveDownloadButton.disabled = false;
    }
  });

  saveDownloadButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    saveDownloadButton.disabled = true;
    setStatus("Guardando y preparando el ZIP del menú…");
    try {
      const {warnings} = await persist();
      const {blob} = await GVPatches.buildPatchZip(["src/data/navigation.json"]);
      prepareDownload(blob);
      readyDownload.click();
      setStatus(
        "ZIP del menú preparado. Si el navegador no inició la descarga, pulsa «Descargar ZIP preparado»." +
        (warnings.length ? ` Hay ${warnings.length} aviso${warnings.length === 1 ? "" : "s"} no bloqueante${warnings.length === 1 ? "" : "s"}.` : "")
      );
    } catch (error) {
      setStatus(`No se pudo preparar el ZIP: ${error.message}`);
      saveButton.disabled = false;
    } finally {
      saveDownloadButton.disabled = false;
    }
  });

  reloadButton.addEventListener("click", async () => {
    if (dirty && !confirm("¿Descartar la edición no guardada del menú?")) return;
    clearDraft();
    try {
      await loadCurrent({useDraft: false});
    } catch (error) {
      setStatus(error.message);
    }
  });

  window.addEventListener("beforeunload", event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  window.GVMenuEditor = {
    getNavigation: () => cloneNavigation(navigation),
    validate: validateNavigation,
    clean: cleanNavigation,
    selectById: select,
    findLocation
  };

  loadCurrent().catch(error => {
    setStatus(`No se pudo abrir el menú: ${error.message}`);
    $("#menu-add-root").disabled = true;
  });
})();