(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const form = $("#content-form");
  const formStatus = $("#form-status");
  const type = $("#content-type");
  const title = $("#title");
  const slug = $("#slug");
  const description = $("#description");
  const body = $("#body");
  const parent = $("#parent-menu");
  const folder = $("#folder");
  const dateField = $("#date-field");
  const date = $("#date-published");
  const addMenu = $("#add-menu");
  const addIndex = $("#add-index");
  const preview = $("#preview-panel");
  const frame = $("#preview-frame");
  const siteTree = $("#site-tree");
  const treeStatus = $("#tree-status");
  const pagePanel = $("#page-panel");
  const homePanel = $("#home-panel");
  const homeForm = $("#home-form");
  const homeStatus = $("#home-status");
  const blogPanel = $("#blog-panel");
  const blogForm = $("#blog-form");
  const blogStatus = $("#blog-status");
  const heroField = $("#hero-field");
  const asideField = $("#aside-field");
  const heroFile = $("#hero-image-file");
  const heroAlt = $("#hero-image-alt");
  const heroCaption = $("#hero-image-caption");
  const heroPreview = $("#hero-image-preview");
  const asideFile = $("#aside-image-file");
  const asideAlt = $("#aside-image-alt");
  const asideCaption = $("#aside-image-caption");
  const asidePreview = $("#aside-image-preview");
  const embedDialog = $("#embed-dialog");
  const embedForm = $("#embed-form");
  const embedCode = $("#embed-code");
  const embedTitle = $("#embed-title");
  const embedCaption = $("#embed-caption");
  const embedFullscreen = $("#embed-fullscreen");
  const embedSubmit = $("#embed-submit");
  const embedStatus = $("#embed-status");

  let navigation = [];
  let loadedPath = null;
  let loadedOriginalTitle = null;
  let loadedParentPath = null;
  let loadedSource = "";
  let homeSource = "";
  let blogSource = "";
  let savedRange = null;
  let previewUrl = null;
  let heroImagePath = "";
  let asideImagePath = "";
  let heroPreviewUrl = "";
  let asidePreviewUrl = "";
  let editingEmbedFigure = null;

  const esc = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const slugify = (value) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const clean = (value) => value.trim().replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
  const rootFor = (path) => "../".repeat(path.split("/").length - 1);
  const canonical = (path) => `https://www.gutierrezvidal.com/${path}`;
  const absoluteImageURL = (path) => `https://www.gutierrezvidal.com/${path.replace(/^\/+/, "")}`;

  function flatten(items, prefix = []) {
    const out = [];
    for (const item of items) {
      const path = [...prefix, item.label];
      out.push({ item, path, label: path.join(" › ") });
      if (item.children) out.push(...flatten(item.children, path));
    }
    return out;
  }

  function findNode(items, labels) {
    let list = items;
    let current = null;
    for (const label of labels) {
      current = list.find((item) => item.label === label);
      if (!current) return null;
      list = current.children || [];
    }
    return current;
  }

  function findParentOfUrl(items, url, path = []) {
    for (const item of items) {
      if (!item.children) continue;
      for (const child of item.children) {
        if (child.url === url) return [...path, item.label];
      }
      const nested = findParentOfUrl(item.children, url, [...path, item.label]);
      if (nested) return nested;
    }
    return null;
  }

  function findItemByUrl(items, url) {
    for (const item of items) {
      if (item.url === url) return item;
      if (item.children) {
        const found = findItemByUrl(item.children, url);
        if (found) return found;
      }
    }
    return null;
  }

  function renderParents() {
    parent.innerHTML = "";
    const candidates = flatten(navigation).filter(({ item }) => item.children?.length || item.url === "blog.html");
    for (const option of candidates) {
      const element = document.createElement("option");
      element.value = JSON.stringify(option.path);
      element.textContent = option.label;
      parent.appendChild(element);
    }
  }

  function treeBranch(items) {
    const list = document.createElement("ul");
    for (const item of items) {
      const listItem = document.createElement("li");
      const row = document.createElement("div");
      row.className = "tree-row";

      if (item.url && item.url !== "index.html") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tree-page";
        button.textContent = item.label;
        button.dataset.path = item.url;
        if (item.url === "sonido.html") {
          button.title = "Abrir el editor especializado de Sonido 360";
          button.addEventListener("click", () => {
            location.href = "sound.html";
          });
        } else if (item.url === "blog.html") {
          button.title = "Editar la página y el archivo del blog";
          button.addEventListener("click", loadBlogPage);
        } else {
          button.addEventListener("click", () => loadPublishedPage(item.url));
        }
        row.appendChild(button);
      } else if (item.label !== "Inicio") {
        const label = document.createElement("span");
        label.className = "tree-group";
        label.textContent = item.label;
        row.appendChild(label);
      }

      if (row.childNodes.length) listItem.appendChild(row);
      if (item.children?.length) listItem.appendChild(treeBranch(item.children));
      if (listItem.childNodes.length) list.appendChild(listItem);
    }
    return list;
  }

  function renderTree() {
    siteTree.innerHTML = "";
    const home = document.createElement("button");
    home.type = "button";
    home.className = "tree-page tree-home";
    home.textContent = "⌂ Portada";
    home.dataset.path = "index.html";
    home.addEventListener("click", loadHomepage);
    siteTree.appendChild(home);
    siteTree.appendChild(treeBranch(navigation));
  }

  function activateTree(path) {
    siteTree.querySelectorAll(".tree-page").forEach((element) => {
      element.classList.toggle("active", element.dataset.path === path);
    });
  }

  function newPage() {
    loadedPath = null;
    loadedOriginalTitle = null;
    loadedParentPath = null;
    loadedSource = "";
    savedRange = null;
    pagePanel.hidden = false;
    homePanel.hidden = true;
    blogPanel.hidden = true;
    form.reset();
    body.innerHTML = "";
    resetPageMedia();
    type.disabled = false;
    slug.disabled = false;
    folder.disabled = false;
    slug.dataset.edited = "";
    type.value = "page";
    updateType();
    $("#mode-label").textContent = "Página nueva";
    $("#path-label").textContent = "";
    $("#form-heading").textContent = "Crear contenido";
    formStatus.textContent = "";
    activateTree("");
  }

  function updateType() {
    const value = type.value;
    dateField.hidden = value !== "blog";
    $("#folder-field").hidden = value === "page";
    heroField.hidden = false;
    asideField.hidden = value !== "subpage";

    if (value === "blog") {
      folder.value = "blog";
      if (!loadedPath) addMenu.checked = true;
      const blog = flatten(navigation).find(({ item }) => item.label === "Blog");
      if (blog) parent.value = JSON.stringify(blog.path);
    } else if (value === "subpage") {
      if (!folder.value || folder.value === "blog") folder.value = "obra/escritura";
      if (!loadedPath) addMenu.checked = true;
    } else {
      folder.value = "";
      if (!loadedPath) addMenu.checked = true;
    }
  }

  const allowedTags = new Set([
    "P", "BR", "H2", "H3", "STRONG", "EM", "A", "UL", "OL", "LI",
    "BLOCKQUOTE", "FIGURE", "IMG", "FIGCAPTION", "SPAN", "IFRAME", "OBJECT", "EMBED", "AUDIO", "VIDEO", "SOURCE", "TRACK", "PARAM", "DIV"
  ]);

  function isSafeUrl(value, allowImageData = false) {
    const normalized = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, "");
    if (!normalized) return true;
    if (normalized.startsWith("#") || normalized.startsWith("/") || normalized.startsWith("./") || normalized.startsWith("../")) return true;
    if (/^(https?:|mailto:|tel:)/i.test(normalized)) return true;
    if (allowImageData && /^data:image\/(png|jpeg|gif|webp|avif);base64,/i.test(normalized)) return true;
    return false;
  }

  function sanitizeNode(node, outputDocument) {
    if (node.nodeType === Node.TEXT_NODE) return outputDocument.createTextNode(node.nodeValue || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    if (!allowedTags.has(node.tagName)) {
      const fragment = outputDocument.createDocumentFragment();
      for (const child of [...node.childNodes]) {
        const cleanChild = sanitizeNode(child, outputDocument);
        if (cleanChild) fragment.appendChild(cleanChild);
      }
      return fragment;
    }

    const cleanElement = outputDocument.createElement(node.tagName.toLowerCase());

    if (node.tagName === "FIGURE" && node.classList.contains("embed-player")) {
      cleanElement.className = "embed-player embed-player--generic";
      const interactivePath = node.getAttribute("data-interactive-path") || "";
      if (interactivePath && /^public\/interactive\/[a-z0-9._-]+\.html$/i.test(interactivePath)) {
        cleanElement.className = "embed-player embed-player--generic interactive-html";
        cleanElement.setAttribute("data-interactive-path", interactivePath);
        cleanElement.setAttribute("data-embed-title", node.getAttribute("data-embed-title") || "HTML interactivo");
        cleanElement.setAttribute("data-embed-fullscreen", node.getAttribute("data-embed-fullscreen") === "false" ? "false" : "true");
        cleanElement.setAttribute("contenteditable", "false");
      }
      const embedCode = node.getAttribute("data-embed-code") || "";
      if (embedCode) {
        try {
          const sanitized = GVEmbeds.sanitize(embedCode, {
            title: node.getAttribute("data-embed-title") || "Contenido incrustado"
          });
          cleanElement.setAttribute("data-embed-code", sanitized.html);
          cleanElement.setAttribute("data-embed-title", node.getAttribute("data-embed-title") || sanitized.title);
          cleanElement.setAttribute("data-embed-kind", sanitized.kind);
          cleanElement.setAttribute("contenteditable", "false");
        } catch {
          return null;
        }
      }
    }

    if (["IFRAME", "OBJECT", "EMBED", "AUDIO", "VIDEO"].includes(node.tagName)) {
      try {
        const sanitized = GVEmbeds.sanitize(node.outerHTML, {
          title: node.getAttribute("title") || node.getAttribute("aria-label") || "Contenido incrustado"
        });
        const parsedEmbed = new DOMParser().parseFromString(`<div>${sanitized.html}</div>`, "text/html");
        const imported = outputDocument.importNode(parsedEmbed.body.firstElementChild.firstElementChild, true);
        return imported;
      } catch {
        return null;
      }
    }

    if (["SOURCE", "TRACK", "PARAM"].includes(node.tagName)) {
      // Estos elementos sólo deben sobrevivir como descendientes de audio, video u object.
      for (const attribute of [...node.attributes]) {
        const name = attribute.name.toLowerCase();
        if (name.startsWith("on") || name === "style") continue;
        if (["src", "kind", "srclang", "label", "default", "type", "media", "sizes", "name", "value"].includes(name)) {
          if (name === "src" && !isSafeUrl(attribute.value)) continue;
          cleanElement.setAttribute(name, attribute.value);
        }
      }
    }

    if (node.tagName === "A") {
      const href = node.getAttribute("href") || "";
      if (isSafeUrl(href)) cleanElement.setAttribute("href", href);
      if (/^https?:/i.test(href)) {
        cleanElement.setAttribute("target", "_blank");
        cleanElement.setAttribute("rel", "noopener noreferrer");
      }
      const classes = [...node.classList].filter(name =>
        ["content-button", "content-button--primary", "content-button--secondary"].includes(name)
      );
      if (classes.length) cleanElement.className = classes.join(" ");
    }

    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") || "";
      if (isSafeUrl(src, true)) cleanElement.setAttribute("src", src);
      const sitePath = node.getAttribute("data-site-path");
      if (sitePath && /^public\/images\/[a-z0-9._-]+$/i.test(sitePath)) {
        cleanElement.setAttribute("data-site-path", sitePath);
      }
      cleanElement.setAttribute("alt", node.getAttribute("alt") || "");
      cleanElement.setAttribute("loading", "lazy");
      for (const dimension of ["width", "height"]) {
        const value = node.getAttribute(dimension);
        if (value && /^\d+$/.test(value)) cleanElement.setAttribute(dimension, value);
      }
    }

    if (node.tagName === "SPAN" && node.classList.contains("small-caps")) {
      cleanElement.className = "small-caps";
    }

    if (node.tagName === "P" && node.classList.contains("embed-placeholder-label")) {
      cleanElement.className = "embed-placeholder-label";
    }

    for (const child of [...node.childNodes]) {
      const cleanChild = sanitizeNode(child, outputDocument);
      if (cleanChild) cleanElement.appendChild(cleanChild);
    }
    return cleanElement;
  }

  function sanitizeHTML(html) {
    const parsed = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const sourceRoot = parsed.body.firstElementChild;
    const output = document.implementation.createHTMLDocument("");
    const holder = output.createElement("div");
    for (const child of [...sourceRoot.childNodes]) {
      const cleanChild = sanitizeNode(child, output);
      if (cleanChild) holder.appendChild(cleanChild);
    }
    return holder.innerHTML.trim();
  }

  function siteImagePathFromSource(src) {
    if (!src) return "";
    const match = src.match(/(?:^|\/)public\/images\/([^?#]+)(?:[?#].*)?$/i);
    return match ? `public/images/${match[1]}` : "";
  }

  function embedCaptionText(figure) {
    return figure.querySelector("figcaption")?.textContent?.trim() || "";
  }

  function createEmbedEditorControls(figure) {
    figure.querySelector(".embed-editor-controls")?.remove();

    const controls = figure.ownerDocument.createElement("div");
    controls.className = "embed-editor-controls";
    controls.setAttribute("contenteditable", "false");

    for (const [action, label] of [
      ["edit", "Editar"],
      ["duplicate", "Duplicar"],
      ["delete", "Eliminar"]
    ]) {
      const button = figure.ownerDocument.createElement("button");
      button.type = "button";
      button.dataset.embedAction = action;
      button.textContent = label;
      controls.appendChild(button);
    }

    figure.prepend(controls);
    return figure;
  }

  function decorateEmbedFigures(root = body) {
    root.querySelectorAll("figure.embed-player").forEach(createEmbedEditorControls);
  }

  async function textFromPatch(path) {
    const value = await GVPatches.getFile(path);
    if (value instanceof Blob) return value.text();
    if (value instanceof Uint8Array) return new TextDecoder().decode(value);
    return String(value ?? "");
  }

  function closeEmbedDialog() {
    editingEmbedFigure = null;
    delete embedDialog.dataset.interactivePath;
    embedSubmit.textContent = "Insertar contenido incrustado";
    embedDialog.close();
  }

  async function editEmbedFigure(figure) {
    editingEmbedFigure = figure;
    saveSelection();
    embedForm.reset();
    embedStatus.textContent = "";
    embedFullscreen.checked = figure.getAttribute("data-embed-fullscreen") !== "false";
    embedTitle.value = figure.getAttribute("data-embed-title") || "";
    embedCaption.value = embedCaptionText(figure);
    embedSubmit.textContent = "Guardar cambios";

    const interactivePath = figure.getAttribute("data-interactive-path") || "";
    if (interactivePath) {
      embedCode.value = await textFromPatch(interactivePath);
      embedDialog.dataset.interactivePath = interactivePath;
    } else {
      embedCode.value = figure.getAttribute("data-embed-code") || "";
      delete embedDialog.dataset.interactivePath;
    }

    embedDialog.showModal();
    embedCode.focus();
  }

  async function duplicateEmbedFigure(figure) {
    const clone = figure.cloneNode(true);
    clone.querySelector(".embed-editor-controls")?.remove();

    const interactivePath = figure.getAttribute("data-interactive-path") || "";
    if (interactivePath) {
      const source = await textFromPatch(interactivePath);
      const originalName = interactivePath.split("/").pop().replace(/\.html?$/i, "");
      const suffix = crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : String(Date.now());
      const duplicatePath = `public/interactive/${originalName}-copia-${suffix}.html`;
      await GVPatches.savePatch(duplicatePath, source);
      clone.setAttribute("data-interactive-path", duplicatePath);
    }

    figure.insertAdjacentElement("afterend", clone);
    createEmbedEditorControls(clone);
    formStatus.textContent = "Contenido incrustado duplicado.";
  }

  function placeholderForEmbed(figure, source, explicitTitle = "") {
    const rawCode = typeof source === "string" ? source : source.outerHTML;
    const sanitized = GVEmbeds.sanitize(rawCode, {
      title: explicitTitle
        || figure.getAttribute("data-embed-title")
        || (typeof source === "string" ? "" : source.getAttribute("title") || source.getAttribute("aria-label") || "")
    });

    const captionText = figure.querySelector("figcaption")?.textContent?.trim() || "";
    figure.replaceChildren();
    figure.className = "embed-player embed-player--generic";
    figure.setAttribute("data-embed-code", sanitized.html);
    figure.setAttribute("data-embed-title", sanitized.title);
    figure.setAttribute("data-embed-kind", sanitized.kind);
    figure.setAttribute("contenteditable", "false");

    const label = figure.ownerDocument.createElement("p");
    label.className = "embed-placeholder-label";
    label.textContent = GVEmbeds.placeholderLabel(sanitized, sanitized.title);
    figure.appendChild(label);

    if (captionText) {
      const caption = figure.ownerDocument.createElement("figcaption");
      caption.textContent = captionText;
      figure.appendChild(caption);
    }
    return figure;
  }

  function prepareEditorHTML(html, pagePath) {
    const parsed = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const holder = parsed.body.firstElementChild;
    holder.querySelectorAll(".embed-editor-controls").forEach(control => control.remove());
    holder.querySelectorAll("img").forEach((image) => {
      const sitePath = image.getAttribute("data-site-path")
        || siteImagePathFromSource(image.getAttribute("src") || "");
      if (!sitePath) return;
      image.setAttribute("data-site-path", sitePath);
      image.setAttribute("src", new URL(`../${sitePath}`, location.href).href);
    });
    holder.querySelectorAll("figure.embed-player").forEach((figure) => {
      if (figure.hasAttribute("data-embed-code") || figure.hasAttribute("data-interactive-path")) return;

      const localFrame = figure.querySelector("iframe[src*='public/interactive/']");
      if (localFrame) {
        const source = localFrame.getAttribute("src") || "";
        const localMatch = source.match(/(?:^|\/)public\/interactive\/([^?#]+\.html)(?:[?#].*)?$/i);
        if (localMatch) {
          const captionText = figure.querySelector("figcaption")?.textContent?.trim() || "";
          const title = localFrame.getAttribute("title")
            || figure.querySelector(".interactive-app__title")?.textContent?.trim()
            || "HTML interactivo";
          const hasFullscreen = Boolean(figure.querySelector(".interactive-app__fullscreen"));

          figure.replaceChildren();
          figure.className = "embed-player embed-player--generic interactive-html";
          figure.setAttribute("data-interactive-path", `public/interactive/${localMatch[1]}`);
          figure.setAttribute("data-embed-title", title);
          figure.setAttribute("data-embed-fullscreen", hasFullscreen ? "true" : "false");
          figure.setAttribute("contenteditable", "false");

          const label = parsed.createElement("p");
          label.className = "embed-placeholder-label";
          label.textContent = `${title} · aplicación interactiva`;
          figure.appendChild(label);

          if (captionText) {
            const caption = parsed.createElement("figcaption");
            caption.textContent = captionText;
            figure.appendChild(caption);
          }
          return;
        }
      }

      const clone = figure.cloneNode(true);
      clone.querySelector("figcaption")?.remove();
      clone.querySelector(".embed-editor-controls")?.remove();
      const hasWidget = clone.querySelector("iframe, object, embed, audio, video, script[src]");
      if (hasWidget) placeholderForEmbed(figure, clone.innerHTML);
    });

    holder.querySelectorAll("iframe, object, embed, audio, video").forEach((embedNode) => {
      if (embedNode.closest("figure.embed-player")) return;
      const source = embedNode.getAttribute("src") || embedNode.getAttribute("data") || "";
      const localMatch = source.match(/(?:^|\/)public\/interactive\/([^?#]+\.html)(?:[?#].*)?$/i);
      const figure = parsed.createElement("figure");
      embedNode.replaceWith(figure);

      if (embedNode.tagName === "IFRAME" && localMatch) {
        figure.className = "embed-player embed-player--generic interactive-html";
        figure.setAttribute("data-interactive-path", `public/interactive/${localMatch[1]}`);
        figure.setAttribute("data-embed-title", embedNode.getAttribute("title") || "HTML interactivo");
        figure.setAttribute("contenteditable", "false");
        const label = parsed.createElement("p");
        label.className = "embed-placeholder-label";
        label.textContent = `${figure.getAttribute("data-embed-title")} · archivo HTML`;
        figure.appendChild(label);
      } else {
        figure.appendChild(embedNode);
        placeholderForEmbed(figure, embedNode);
      }
    });

    // Widgets del tipo <a ...></a><script src="..."></script>, como Spreaker.
    holder.querySelectorAll("script[src]").forEach((script) => {
      if (script.closest("figure.embed-player")) return;
      const previous = script.previousElementSibling;
      const figure = parsed.createElement("figure");
      if (previous && ["A", "DIV", "P", "SPAN"].includes(previous.tagName)) {
        previous.replaceWith(figure);
        figure.append(previous, script);
      } else {
        script.replaceWith(figure);
        figure.appendChild(script);
      }
      placeholderForEmbed(figure, figure.innerHTML);
    });
    const prepared = sanitizeHTML(holder.innerHTML);
    const finalDocument = new DOMParser().parseFromString(`<div>${prepared}</div>`, "text/html");
    const finalHolder = finalDocument.body.firstElementChild;
    decorateEmbedFigures(finalHolder);
    return finalHolder.innerHTML;
  }

  function editorHTML(pagePath) {
    const source = body.cloneNode(true);
    source.querySelectorAll(".embed-editor-controls").forEach(control => control.remove());
    const cleanHTML = sanitizeHTML(source.innerHTML);
    const parsed = new DOMParser().parseFromString(`<div>${cleanHTML}</div>`, "text/html");
    const holder = parsed.body.firstElementChild;
    holder.querySelectorAll("img").forEach((image) => {
      const sitePath = image.getAttribute("data-site-path")
        || siteImagePathFromSource(image.getAttribute("src") || "");
      if (!sitePath) return;
      image.setAttribute("src", `${rootFor(pagePath)}${sitePath}`);
      image.removeAttribute("data-site-path");
    });
    holder.querySelectorAll("figure.interactive-html[data-interactive-path]").forEach((figure) => {
      const sitePath = figure.getAttribute("data-interactive-path");
      const title = figure.getAttribute("data-embed-title") || "HTML interactivo";
      const showFullscreen = figure.getAttribute("data-embed-fullscreen") !== "false";
      const caption = figure.querySelector("figcaption");
      figure.querySelector(".embed-placeholder-label")?.remove();
      figure.removeAttribute("data-interactive-path");
      figure.removeAttribute("data-embed-title");
      figure.removeAttribute("data-embed-fullscreen");
      figure.removeAttribute("contenteditable");
      figure.className = "embed-player embed-player--generic interactive-html interactive-app";
      figure.dataset.interactiveApp = "true";

      const toolbar = parsed.createElement("div");
      toolbar.className = "interactive-app__toolbar";
      const heading = parsed.createElement("p");
      heading.className = "interactive-app__title";
      heading.textContent = title;
      toolbar.appendChild(heading);

      if (showFullscreen) {
        const fullLink = parsed.createElement("a");
        fullLink.className = "interactive-app__fullscreen";
        fullLink.href = `${rootFor(pagePath)}${sitePath}`;
        fullLink.target = "_blank";
        fullLink.rel = "noopener";
        fullLink.textContent = "Abrir a pantalla completa";
        toolbar.appendChild(fullLink);
      }

      const iframe = parsed.createElement("iframe");
      iframe.src = `${rootFor(pagePath)}${sitePath}`;
      iframe.title = title;
      iframe.loading = "eager";
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-downloads");
      iframe.dataset.interactiveFrame = "true";

      figure.insertBefore(toolbar, caption || null);
      figure.insertBefore(iframe, caption || null);
    });

    holder.querySelectorAll("figure.embed-player[data-embed-code]").forEach((figure) => {
      const sanitized = GVEmbeds.sanitize(figure.getAttribute("data-embed-code"), {
        title: figure.getAttribute("data-embed-title") || "Contenido incrustado"
      });
      const embedDocument = new DOMParser().parseFromString(`<div>${sanitized.html}</div>`, "text/html");
      figure.querySelector(".embed-placeholder-label")?.remove();
      figure.removeAttribute("data-embed-code");
      figure.removeAttribute("data-embed-title");
      figure.removeAttribute("data-embed-kind");
      figure.removeAttribute("contenteditable");
      figure.className = "embed-player embed-player--generic";
      const insertionPoint = figure.querySelector("figcaption");
      for (const node of [...embedDocument.body.firstElementChild.childNodes]) {
        figure.insertBefore(parsed.importNode(node, true), insertionPoint || null);
      }
    });
    return holder.innerHTML.trim();
  }

  function setEditorHTML(html, pagePath = loadedPath || "pagina.html") {
    body.innerHTML = prepareEditorHTML(html, pagePath);
  }

  function saveSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (body.contains(range.commonAncestorContainer)) savedRange = range.cloneRange();
  }

  function restoreSelection() {
    if (!savedRange) return false;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    return true;
  }

  function command(name, value = null) {
    restoreSelection();
    body.focus({ preventScroll: true });
    document.execCommand(name, false, value);
    saveSelection();
  }

  document.querySelectorAll(".rich-toolbar button").forEach((button) => {
    button.addEventListener("mousedown", (event) => event.preventDefault());
  });

  document.querySelectorAll(".rich-toolbar [data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.command;
      if (name === "link") {
        const href = prompt("URL del enlace:", "https://");
        if (href && isSafeUrl(href)) command("createLink", href);
        else if (href) formStatus.textContent = "La URL indicada no es válida.";
        return;
      }
      if (name === "smallcaps") {
        restoreSelection();
        const selection = window.getSelection();
        if (!selection.rangeCount || selection.isCollapsed) {
          formStatus.textContent = "Selecciona el texto al que deseas aplicar versalitas.";
          return;
        }
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.className = "small-caps";
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
        const next = document.createRange();
        next.selectNodeContents(span);
        selection.addRange(next);
        saveSelection();
        return;
      }
      command(name);
    });
  });

  document.querySelectorAll(".rich-toolbar [data-block]").forEach((button) => {
    button.addEventListener("click", () => command("formatBlock", button.dataset.block));
  });

  ["keyup", "mouseup", "input"].forEach((eventName) => body.addEventListener(eventName, saveSelection));

  function inferType(path) {
    if (path.startsWith("blog/")) return "blog";
    if (path.includes("/")) return "subpage";
    return "page";
  }

  function inferFolder(path) {
    const parts = path.split("/");
    return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
  }

  function inferSlug(path) {
    return path.split("/").at(-1).replace(/\.html$/, "");
  }

  function extractDescription(doc) {
    return doc.querySelector('meta[name="description"]')?.content?.trim()
      || doc.querySelector(".page-deck")?.textContent?.trim()
      || "";
  }

  function extractDate(doc) {
    const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')];
    for (const schema of schemas) {
      try {
        const data = JSON.parse(schema.textContent);
        if (data?.datePublished) return data.datePublished;
        if (Array.isArray(data?.["@graph"])) {
          const dated = data["@graph"].find((node) => node.datePublished);
          if (dated) return dated.datePublished;
        }
      } catch {
        // El JSON-LD ajeno al editor se conserva sin impedir la edición.
      }
    }
    return "";
  }

  function buildData() {
    const contentType = type.value;
    const cleanSlug = clean(slug.value);
    const cleanFolder = clean(folder.value);
    const parentPath = JSON.parse(parent.value);
    const path = loadedPath || (
      contentType === "page"
        ? `${cleanSlug}.html`
        : contentType === "blog"
          ? `blog/${cleanSlug}.html`
          : `${cleanFolder}/${cleanSlug}.html`
    );

    return {
      type: contentType,
      title: title.value.trim(),
      slug: cleanSlug,
      description: description.value.trim(),
      body: editorHTML(path),
      date: date.value,
      path,
      parentPath,
      kicker: contentType === "blog" ? "Blog" : parentPath.at(-1)
    };
  }

  function validate(data) {
    if (!data.title) throw new Error("El título es obligatorio.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw new Error("El slug sólo admite minúsculas, números y guiones.");
    if (data.description.length < 40) throw new Error("La descripción SEO necesita al menos 40 caracteres.");
    if (!data.body) throw new Error("El contenido no puede quedar vacío.");
    if (data.type === "subpage" && !clean(folder.value)) throw new Error("Indica la carpeta de destino.");
    if (loadedPath && data.path !== loadedPath) throw new Error("La ruta de una página publicada no puede cambiarse desde este editor.");
  }

  function hasEmbeddedPlayer(html) {
    return /class=["'][^"']*\b(?:embed-player|content-button)\b/i.test(String(html || ""));
  }

  function ensureEmbedStylesheet(doc, pagePath) {
    if (!doc.querySelector("figure.embed-player, a.content-button")) return;
    let link = doc.querySelector('link[data-gv-embeds], link[href$="media-embeds.css"]');
    if (!link) {
      link = doc.createElement("link");
      link.rel = "stylesheet";
      link.dataset.gvEmbeds = "true";
      doc.head.appendChild(link);
    }
    link.href = `${rootFor(pagePath)}src/css/media-embeds.css`;
  }

  function hasInteractiveApp(html) {
    return /class=["'][^"']*\binteractive-app\b/i.test(String(html || ""))
      || /data-interactive-app=["']true["']/i.test(String(html || ""));
  }

  function ensureInteractiveRuntime(doc, pagePath) {
    if (!doc.querySelector("figure.interactive-app, [data-interactive-app='true']")) return;
    let script = doc.querySelector('script[data-gv-interactive], script[src$="interactive-embed.js"]');
    if (!script) {
      script = doc.createElement("script");
      script.defer = true;
      script.dataset.gvInteractive = "true";
      doc.body.appendChild(script);
    }
    script.src = `${rootFor(pagePath)}src/js/interactive-embed.js`;
  }

  function pageHTML(data) {
    const root = rootFor(data.path);
    const url = canonical(data.path);
    const schema = {
      "@context": "https://schema.org",
      "@type": data.type === "blog" ? "BlogPosting" : "WebPage",
      headline: data.title,
      description: data.description,
      url,
      inLanguage: "es-MX",
      author: {
        "@type": "Person",
        name: "Carlos Adolfo Gutiérrez Vidal",
        jobTitle: ["Poeta", "Artista indisciplinario", "Investigador"]
      }
    };
    if (data.type === "blog" && data.date) schema.datePublished = data.date;
    const kicker = data.type === "blog" && data.date ? data.date : data.kicker;
    const socialImage = heroImagePath
      ? absoluteImageURL(heroImagePath)
      : "https://www.gutierrezvidal.com/public/assets/og-home.jpg";

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="author" content="Carlos Adolfo Gutiérrez Vidal">
  <meta name="description" content="${esc(data.description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="theme-color" content="#FAF9F6">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="${root}public/assets/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="${root}public/assets/apple-touch-icon.png">
  <link rel="manifest" href="${root}site.webmanifest">
  <meta property="og:locale" content="es_MX">
  <meta property="og:type" content="${data.type === "blog" ? "article" : "website"}">
  <meta property="og:site_name" content="Carlos Adolfo Gutiérrez Vidal">
  <meta property="og:title" content="${esc(data.title)}">
  <meta property="og:description" content="${esc(data.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${socialImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(data.title)}">
  <meta name="twitter:description" content="${esc(data.description)}">
  <meta name="twitter:image" content="${socialImage}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <title>${esc(data.title)} · Carlos Adolfo Gutiérrez Vidal</title>
  <link rel="stylesheet" href="${root}src/css/site-v2.2.css">
  ${hasEmbeddedPlayer(data.body) ? `<link rel="stylesheet" data-gv-embeds="true" href="${root}src/css/media-embeds.css">` : ""}
</head>
<body data-root="${root}">
  <div data-site-header></div>
  <main class="page">
    <header class="page-header">
      <p class="page-kicker">${esc(kicker)}</p>
      <h1 class="page-title">${esc(data.title)}</h1>
      <p class="page-deck">${esc(data.description)}</p>
    </header>
    ${heroImagePath ? mediaFigureHTML("hero", data.path) : ""}
    ${data.type === "subpage" && asideImagePath
      ? `<div class="page-content-grid"><article class="prose">${data.body}</article><aside class="page-aside">${mediaFigureHTML("aside", data.path)}</aside></div>`
      : `<article class="prose">${data.body}</article>`}
  </main>
  <div data-site-footer></div>
  <script src="${root}src/js/site-shell-v2.1.js"></script>
  ${hasInteractiveApp(data.body) ? `<script defer data-gv-interactive="true" src="${root}src/js/interactive-embed.js"></script>` : ""}
</body>
</html>`;
  }

  function updateMeta(doc, selector, value) {
    const element = doc.querySelector(selector);
    if (element) element.setAttribute("content", value);
  }

  function updateExistingPage(data) {
    const doc = new DOMParser().parseFromString(loadedSource, "text/html");
    const pageTitle = doc.querySelector(".page-title");
    const pageDeck = doc.querySelector(".page-deck");
    const article = doc.querySelector("article.prose");
    if (!pageTitle || !pageDeck || !article) throw new Error("La página ya no contiene la estructura editable esperada.");

    pageTitle.textContent = data.title;
    pageDeck.textContent = data.description;
    article.innerHTML = data.body;
    applyMediaToDocument(doc, data);
    ensureEmbedStylesheet(doc, data.path);
    ensureInteractiveRuntime(doc, data.path);
    doc.title = `${data.title} · Carlos Adolfo Gutiérrez Vidal`;
    updateMeta(doc, 'meta[name="description"]', data.description);
    updateMeta(doc, 'meta[property="og:title"]', data.title);
    updateMeta(doc, 'meta[property="og:description"]', data.description);
    updateMeta(doc, 'meta[name="twitter:title"]', data.title);
    updateMeta(doc, 'meta[name="twitter:description"]', data.description);
    if (heroImagePath) {
      updateMeta(doc, 'meta[property="og:image"]', absoluteImageURL(heroImagePath));
      updateMeta(doc, 'meta[name="twitter:image"]', absoluteImageURL(heroImagePath));
    }

    for (const schema of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const value = JSON.parse(schema.textContent);
        if (value && !Array.isArray(value)) {
          if ("headline" in value) value.headline = data.title;
          if ("name" in value && value["@type"] === "WebPage") value.name = data.title;
          if ("description" in value) value.description = data.description;
          if (data.type === "blog" && data.date && "datePublished" in value) value.datePublished = data.date;
          schema.textContent = JSON.stringify(value);
        }
      } catch {
        // Se conserva JSON-LD no interpretable.
      }
    }

    return `<!doctype html>\n${doc.documentElement.outerHTML}`;
  }

  function addToMenu(data) {
    const node = findNode(navigation, data.parentPath);
    if (!node) throw new Error("No se encontró el menú padre.");
    node.children = node.children || [];
    if (node.children.find((item) => item.url === data.path || item.label === data.title)) {
      throw new Error("Ya existe una entrada igual en ese menú.");
    }
    node.children.push({ label: data.title, url: data.path });
  }

  function updateMenuItem(data) {
    const item = findItemByUrl(navigation, loadedPath);
    if (item) item.label = data.title;
  }

  async function pathAlreadyExists(path) {
    const patches = await GVPatches.listPatches();
    if (Object.prototype.hasOwnProperty.call(patches, path)) return true;
    try {
      await GVPatches.getFile(path);
      return true;
    } catch {
      return false;
    }
  }

  function soundParentFor(data) {
    const node = findNode(navigation, data.parentPath);
    if (node?.url === "sonido.html") return node;
    if (data.path.startsWith("obra/sonido/")) return findItemByUrl(navigation, "sonido.html");
    return null;
  }

  function soundArchiveCard(doc, data) {
    const article = doc.createElement("article");
    article.className = "sound-item";
    article.dataset.pageUrl = data.path;

    const text = doc.createElement("div");
    const heading = doc.createElement("h3");
    heading.textContent = data.title;
    const paragraph = doc.createElement("p");
    paragraph.textContent = data.description || "Ficha individual.";
    text.append(heading, paragraph);

    const link = doc.createElement("a");
    link.className = "secondary";
    link.href = data.path;
    link.textContent = "Abrir ficha";
    article.append(text, link);
    return article;
  }

  async function updatedSoundArchive(data) {
    if (!soundParentFor(data)) return null;
    const current = await GVPatches.getFile("sonido.html");
    const doc = new DOMParser().parseFromString(current, "text/html");
    const list = doc.querySelector("#sound-list");
    if (!list) throw new Error("sonido.html no contiene #sound-list.");

    let card = [...list.querySelectorAll(".sound-item")].find((article) => {
      const pageUrl = article.dataset.pageUrl || article.querySelector("a[href]")?.getAttribute("href") || "";
      return pageUrl === data.path || (loadedPath && pageUrl === loadedPath);
    });
    const replacement = soundArchiveCard(doc, data);
    if (card) card.replaceWith(replacement);
    else list.appendChild(replacement);

    return {path: "sonido.html", content: `<!doctype html>\n${doc.documentElement.outerHTML}`};
  }


  function ensureStylesheet(doc, href, marker) {
    let link = doc.querySelector(`link[data-${marker}], link[href$="${href.split("/").at(-1)}"]`);
    if (!link) {
      link = doc.createElement("link");
      link.rel = "stylesheet";
      link.setAttribute(`data-${marker}`, "true");
      doc.head.appendChild(link);
    }
    link.href = href;
  }

  function sitePathFromURL(pagePath, source) {
    const value = String(source || "").trim();
    if (!value) return "";
    try {
      const base = new URL(pagePath, "https://www.gutierrezvidal.com/");
      const url = new URL(value, base);
      if (url.hostname !== "www.gutierrezvidal.com" && url.hostname !== "gutierrezvidal.com") return "";
      return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    } catch {
      return "";
    }
  }

  function publishedDate(doc) {
    for (const schema of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const value = JSON.parse(schema.textContent);
        const candidates = Array.isArray(value?.["@graph"]) ? value["@graph"] : [value];
        const dated = candidates.find(item => item?.datePublished);
        if (dated?.datePublished) return String(dated.datePublished).slice(0, 10);
      } catch {
        // Se continúa con los elementos visibles.
      }
    }
    const visible = doc.querySelector(".page-kicker")?.textContent.trim() || "";
    return /^\d{4}-\d{2}-\d{2}/.test(visible) ? visible.slice(0, 10) : "";
  }

  function formatBlogDate(value) {
    if (!value) return "";
    const dateValue = new Date(`${value}T12:00:00`);
    if (Number.isNaN(dateValue.getTime())) return value;
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(dateValue);
  }

  function blogUrls() {
    const blog = findItemByUrl(navigation, "blog.html")
      || flatten(navigation).find(({item}) => item.label === "Blog")?.item;
    const urls = [];
    const walk = items => {
      for (const item of items || []) {
        if (item.url?.startsWith("blog/") && item.url.endsWith(".html")) urls.push(item.url);
        if (item.children) walk(item.children);
      }
    };
    walk(blog?.children || []);
    return [...new Set(urls)];
  }

  async function readBlogEntry(path) {
    const source = await GVPatches.getFile(path);
    const doc = new DOMParser().parseFromString(source, "text/html");
    const title = doc.querySelector(".page-title")?.textContent.trim()
      || doc.title.replace(/\s*·.*$/, "").trim();
    const description = doc.querySelector('meta[name="description"]')?.content?.trim()
      || doc.querySelector(".page-deck")?.textContent.trim()
      || doc.querySelector("article.prose p")?.textContent.trim()
      || "";
    const date = publishedDate(doc);
    const image = doc.querySelector(".page-hero img, article.prose img, main img");
    return {
      path,
      title,
      description,
      date,
      dateLabel: formatBlogDate(date),
      imagePath: sitePathFromURL(path, image?.getAttribute("src") || ""),
      imageAlt: image?.getAttribute("alt") || title,
      imageWidth: Number(image?.getAttribute("width")) || 0,
      imageHeight: Number(image?.getAttribute("height")) || 0
    };
  }

  async function collectBlogEntries(extraData = null) {
    const urls = blogUrls();
    if (extraData?.path?.startsWith("blog/") && !urls.includes(extraData.path)) {
      urls.push(extraData.path);
    }

    const entries = [];
    for (const path of urls) {
      if (extraData && path === extraData.path) {
        entries.push({
          path,
          title: extraData.title,
          description: extraData.description,
          date: extraData.date || "",
          dateLabel: formatBlogDate(extraData.date || ""),
          imagePath: heroImagePath || "",
          imageAlt: heroAlt.value.trim() || extraData.title
        });
        continue;
      }
      try {
        entries.push(await readBlogEntry(path));
      } catch {
        // Una entrada inaccesible no impide actualizar las demás.
      }
    }

    return entries
      .filter(entry => entry.title && entry.path)
      .sort((a, b) => {
        const byDate = String(b.date || "").localeCompare(String(a.date || ""));
        return byDate || a.title.localeCompare(b.title, "es");
      });
  }

  function blogCard(doc, entry, className = "blog-card") {
    const article = doc.createElement("article");
    article.className = className;
    article.dataset.pageUrl = entry.path;

    if (entry.imagePath) {
      const link = doc.createElement("a");
      link.className = "blog-card__image";
      link.href = entry.path;
      const image = doc.createElement("img");
      image.src = entry.imagePath;
      image.alt = entry.imageAlt || entry.title;
      image.loading = "lazy";
      image.decoding = "async";
      if (entry.imageWidth > 0 && entry.imageHeight > 0) {
        image.width = entry.imageWidth;
        image.height = entry.imageHeight;
      }
      link.appendChild(image);
      article.appendChild(link);
    }

    const content = doc.createElement("div");
    content.className = "blog-card__content";
    if (entry.dateLabel) {
      const time = doc.createElement("time");
      time.dateTime = entry.date;
      time.textContent = entry.dateLabel;
      content.appendChild(time);
    }
    const heading = doc.createElement("h2");
    const link = doc.createElement("a");
    link.href = entry.path;
    link.textContent = entry.title;
    heading.appendChild(link);
    content.appendChild(heading);

    if (entry.description) {
      const paragraph = doc.createElement("p");
      paragraph.textContent = entry.description;
      content.appendChild(paragraph);
    }

    const read = doc.createElement("a");
    read.className = "blog-card__read";
    read.href = entry.path;
    read.textContent = "Leer entrada";
    content.appendChild(read);
    article.appendChild(content);
    return article;
  }

  function applyBlogFields(doc) {
    const seoTitle = $("#blog-seo-title").value.trim();
    const seoDescription = $("#blog-seo-description").value.trim();
    if (!seoTitle) throw new Error("El título SEO del blog es obligatorio.");
    if (seoDescription.length < 40) throw new Error("La descripción SEO del blog necesita al menos 40 caracteres.");

    doc.title = seoTitle;
    updateMeta(doc, 'meta[name="description"]', seoDescription);
    updateMeta(doc, 'meta[property="og:title"]', seoTitle);
    updateMeta(doc, 'meta[property="og:description"]', seoDescription);
    updateMeta(doc, 'meta[name="twitter:title"]', seoTitle);
    updateMeta(doc, 'meta[name="twitter:description"]', seoDescription);

    for (const schema of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const value = JSON.parse(schema.textContent);
        const update = item => {
          if (!item || typeof item !== "object") return;
          const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
          if (types.includes("Blog") || String(item["@id"] || "").includes("blog.html")) {
            item.name = seoTitle;
            item.headline = seoTitle;
            item.description = seoDescription;
          }
          Object.values(item).forEach(child => {
            if (Array.isArray(child)) child.forEach(update);
            else if (child && typeof child === "object") update(child);
          });
        };
        update(value);
        schema.textContent = JSON.stringify(value);
      } catch {
        // Se conserva JSON-LD que no pueda interpretarse.
      }
    }

    requireElement(doc, ".page-kicker", "el antetítulo del blog").textContent = $("#blog-kicker").value.trim();
    requireElement(doc, ".page-title", "el título del blog").textContent = $("#blog-title").value.trim();
    requireElement(doc, ".page-deck", "la bajada del blog").textContent = $("#blog-deck").value.trim();
  }

  function rebuildBlogDocument(source, entries, applyFields = false) {
    const doc = new DOMParser().parseFromString(source, "text/html");
    if (applyFields) applyBlogFields(doc);
    ensureStylesheet(doc, "src/css/blog.css", "gv-blog");

    const main = requireElement(doc, "main", "el contenido principal del blog");
    let editorial = doc.querySelector(".blog-editorial");
    if (!editorial) {
      editorial = doc.createElement("section");
      editorial.className = "blog-editorial";
      editorial.innerHTML = `<div><h2>Archivo</h2><p>Archivo cronológico de publicaciones.</p></div>`;
    }
    editorial.querySelector("h2").textContent = $("#blog-archive-title")?.value.trim() || editorial.querySelector("h2")?.textContent || "Archivo";
    editorial.querySelector("p").textContent = $("#blog-archive-intro")?.value.trim() || editorial.querySelector("p")?.textContent || "Archivo cronológico de publicaciones.";

    doc.querySelector("article.prose")?.remove();
    doc.querySelector(".blog-editorial")?.remove();
    doc.querySelector(".blog-latest")?.remove();
    doc.querySelector(".blog-archive-list")?.remove();

    const latest = doc.createElement("section");
    latest.className = "blog-latest";
    latest.setAttribute("aria-label", "Entradas recientes");
    entries.slice(0, 2).forEach((entry, index) => {
      latest.appendChild(blogCard(doc, entry, index === 0 ? "blog-card blog-card--lead" : "blog-card blog-card--secondary"));
    });

    const archive = doc.createElement("section");
    archive.className = "blog-archive-list";
    archive.setAttribute("aria-labelledby", "blog-archive-heading");
    const archiveHeading = doc.createElement("h2");
    archiveHeading.id = "blog-archive-heading";
    archiveHeading.textContent = "Todas las entradas";
    archive.appendChild(archiveHeading);
    const list = doc.createElement("div");
    list.className = "blog-archive-list__grid";
    entries.slice(2).forEach(entry => list.appendChild(blogCard(doc, entry, "blog-card blog-card--archive")));
    if (!entries.slice(2).length) {
      const empty = doc.createElement("p");
      empty.className = "blog-empty";
      empty.textContent = entries.length ? "No hay más entradas publicadas." : "El blog se encuentra en preparación.";
      list.appendChild(empty);
    }
    archive.appendChild(list);

    main.append(editorial, latest, archive);
    return `<!doctype html>\n${doc.documentElement.outerHTML}`;
  }

  function rebuildHomeLatest(source, entry) {
    const doc = new DOMParser().parseFromString(source, "text/html");
    ensureStylesheet(doc, "src/css/blog.css", "gv-blog");
    doc.querySelector("#home-latest-blog")?.remove();
    if (!entry) return `<!doctype html>\n${doc.documentElement.outerHTML}`;

    const section = doc.createElement("section");
    section.id = "home-latest-blog";
    section.className = "home-latest-blog";
    section.setAttribute("aria-labelledby", "home-latest-blog-title");

    const label = doc.createElement("p");
    label.className = "home-latest-blog__label";
    label.textContent = "Última entrada";

    const content = doc.createElement("div");
    content.className = "home-latest-blog__content";
    if (entry.imagePath) {
      const imageLink = doc.createElement("a");
      imageLink.href = entry.path;
      imageLink.className = "home-latest-blog__image";
      const image = doc.createElement("img");
      image.src = entry.imagePath;
      image.alt = entry.imageAlt || entry.title;
      image.loading = "eager";
      image.decoding = "async";
      if (entry.imageWidth > 0 && entry.imageHeight > 0) {
        image.width = entry.imageWidth;
        image.height = entry.imageHeight;
      }
      imageLink.appendChild(image);
      content.appendChild(imageLink);
    }

    const text = doc.createElement("div");
    if (entry.dateLabel) {
      const time = doc.createElement("time");
      time.dateTime = entry.date;
      time.textContent = entry.dateLabel;
      text.appendChild(time);
    }
    const heading = doc.createElement("h2");
    heading.id = "home-latest-blog-title";
    const headingLink = doc.createElement("a");
    headingLink.href = entry.path;
    headingLink.textContent = entry.title;
    heading.appendChild(headingLink);
    text.appendChild(heading);
    if (entry.description) {
      const paragraph = doc.createElement("p");
      paragraph.textContent = entry.description;
      text.appendChild(paragraph);
    }
    const read = doc.createElement("a");
    read.className = "home-latest-blog__read";
    read.href = entry.path;
    read.textContent = "Leer en el blog";
    text.appendChild(read);
    content.appendChild(text);
    section.append(label, content);

    const testimonials = doc.querySelector(".testimonials");
    if (!testimonials) throw new Error("index.html no contiene la sección de testimoniales.");
    testimonials.before(section);
    return `<!doctype html>\n${doc.documentElement.outerHTML}`;
  }

  async function rebuildBlogSurfaces(extraData = null, applyFields = false) {
    const entries = await collectBlogEntries(extraData);
    const currentBlog = blogSource || await GVPatches.getFile("blog.html");
    const currentHome = homeSource || await GVPatches.getFile("index.html");
    const blogHtml = rebuildBlogDocument(currentBlog, entries, applyFields);
    const homeHtml = rebuildHomeLatest(currentHome, entries[0] || null);
    await GVPatches.savePatch("blog.html", blogHtml);
    await GVPatches.savePatch("index.html", homeHtml);
    blogSource = blogHtml;
    homeSource = homeHtml;
    return {entries, blogHtml, homeHtml};
  }

  async function loadBlogPage() {
    treeStatus.textContent = "Cargando blog…";
    try {
      blogSource = await GVPatches.getFile("blog.html");
      const doc = new DOMParser().parseFromString(blogSource, "text/html");
      $("#blog-seo-title").value = doc.title;
      $("#blog-seo-description").value = doc.querySelector('meta[name="description"]')?.content || "";
      $("#blog-kicker").value = doc.querySelector(".page-kicker")?.textContent.trim() || "Publicaciones";
      $("#blog-title").value = doc.querySelector(".page-title")?.textContent.trim() || "Blog";
      $("#blog-deck").value = doc.querySelector(".page-deck")?.textContent.trim() || "Ensayos, notas y textos en proceso.";
      $("#blog-archive-title").value = doc.querySelector(".blog-editorial h2")?.textContent.trim() || "Archivo";
      $("#blog-archive-intro").value = doc.querySelector(".blog-editorial p")?.textContent.trim()
        || doc.querySelector("article.prose p")?.textContent.trim()
        || "Archivo cronológico de publicaciones.";

      pagePanel.hidden = true;
      homePanel.hidden = true;
      blogPanel.hidden = false;
      blogStatus.textContent = "";
      treeStatus.textContent = "";
      activateTree("blog.html");
    } catch (error) {
      treeStatus.textContent = error.message;
    }
  }

  async function buildBlogPreview() {
    if (!blogSource) throw new Error("Primero carga la página del blog.");
    const entries = await collectBlogEntries();
    return rebuildBlogDocument(blogSource, entries, true);
  }

  async function updatedIndex(data) {
    const soundPatch = await updatedSoundArchive(data);
    if (soundPatch) return soundPatch;
    if (!addIndex.checked) return null;

    const node = findNode(navigation, data.parentPath);
    if (!node?.url || !node.url.endsWith(".html")) return null;

    const current = await GVPatches.getFile(node.url);
    const doc = new DOMParser().parseFromString(current, "text/html");
    const main = doc.querySelector("main");
    if (!main) throw new Error(`${node.url} no contiene un elemento main.`);

    let collection = main.querySelector("section.collection");
    if (!collection) {
      collection = doc.createElement("section");
      collection.className = "collection";
      collection.setAttribute("aria-label", `Páginas de ${node.label || "la sección"}`);
      main.appendChild(collection);
    }

    const link = rootFor(node.url) + data.path;
    let card = [...collection.querySelectorAll("article")].find(article => {
      const href = article.querySelector("a[href]")?.getAttribute("href") || "";
      return href === link
        || href === data.path
        || (loadedPath && (href === loadedPath || href === rootFor(node.url) + loadedPath));
    });

    const replacement = doc.createElement("article");
    replacement.dataset.pageUrl = data.path;
    const heading = doc.createElement("h2");
    const anchor = doc.createElement("a");
    anchor.href = link;
    anchor.textContent = data.title;
    heading.appendChild(anchor);
    const paragraph = doc.createElement("p");
    paragraph.textContent = data.description;
    replacement.append(heading, paragraph);

    if (card) card.replaceWith(replacement);
    else collection.appendChild(replacement);

    return {
      path: node.url,
      content: `<!doctype html>\n${doc.documentElement.outerHTML}`
    };
  }

  async function updatedSitemap(data) {
    const xml = await GVPatches.getFile("sitemap.xml");
    const url = canonical(data.path);
    if (xml.includes(`<loc>${url}</loc>`)) return xml;
    const entry = `  <url><loc>${url}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
    return xml.replace("</urlset>", entry + "</urlset>");
  }


  function clearPreviewUrl(kind) {
    if (kind === "hero" && heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl);
    if (kind === "aside" && asidePreviewUrl) URL.revokeObjectURL(asidePreviewUrl);
    if (kind === "hero") heroPreviewUrl = "";
    if (kind === "aside") asidePreviewUrl = "";
  }

  function setMediaPreview(kind, src, alt = "", caption = "") {
    const figure = kind === "hero" ? heroPreview : asidePreview;
    const image = figure.querySelector("img");
    const figcaption = figure.querySelector("figcaption");
    image.src = src || "";
    image.alt = alt;
    figcaption.textContent = caption;
    figcaption.hidden = !caption;
    figure.hidden = !src;
  }

  function resetPageMedia() {
    heroImagePath = "";
    asideImagePath = "";
    heroAlt.value = "";
    heroCaption.value = "";
    asideAlt.value = "";
    asideCaption.value = "";
    heroFile.value = "";
    asideFile.value = "";
    clearPreviewUrl("hero");
    clearPreviewUrl("aside");
    setMediaPreview("hero", "");
    setMediaPreview("aside", "");
  }

  function extractMedia(doc, selector, kind) {
    const figure = doc.querySelector(selector);
    const image = figure?.querySelector("img");
    if (!image) return;
    const sitePath = siteImagePathFromSource(image.getAttribute("src") || "");
    const caption = figure.querySelector("figcaption")?.textContent.trim() || "";
    const absoluteSource = sitePath
      ? new URL(`../${sitePath}`, location.href).href
      : new URL(image.getAttribute("src"), new URL(`../${loadedPath}`, location.href)).href;

    if (kind === "hero") {
      heroImagePath = sitePath;
      heroAlt.value = image.getAttribute("alt") || "";
      heroCaption.value = caption;
    } else {
      asideImagePath = sitePath;
      asideAlt.value = image.getAttribute("alt") || "";
      asideCaption.value = caption;
    }
    setMediaPreview(kind, absoluteSource, image.getAttribute("alt") || "", caption);
  }

  async function handleMediaFile(kind, file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif|avif)$/i.test(file.type)) {
      throw new Error("El archivo seleccionado no es una imagen admitida.");
    }
    const name = imageName(file);
    const path = `public/images/${name}`;
    await GVPatches.savePatch(path, file);
    const previewObjectUrl = URL.createObjectURL(file);

    if (kind === "hero") {
      clearPreviewUrl("hero");
      heroPreviewUrl = previewObjectUrl;
      heroImagePath = path;
      setMediaPreview("hero", previewObjectUrl, heroAlt.value, heroCaption.value);
    } else {
      clearPreviewUrl("aside");
      asidePreviewUrl = previewObjectUrl;
      asideImagePath = path;
      setMediaPreview("aside", previewObjectUrl, asideAlt.value, asideCaption.value);
    }
    formStatus.textContent = `Imagen añadida: ${path}`;
  }

  function mediaFigureHTML(kind, pagePath) {
    const isHero = kind === "hero";
    const path = isHero ? heroImagePath : asideImagePath;
    const alt = (isHero ? heroAlt.value : asideAlt.value).trim();
    const caption = (isHero ? heroCaption.value : asideCaption.value).trim();
    if (!path) return "";
    if (!alt) throw new Error(`El texto alternativo de la imagen ${isHero ? "hero" : "lateral"} es obligatorio.`);
    const className = isHero ? "page-hero" : "page-aside-figure";
    return `<figure class="${className}"><img src="${rootFor(pagePath)}${path}" alt="${esc(alt)}" loading="lazy">${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}</figure>`;
  }

  function applyMediaToDocument(doc, data) {
    doc.querySelector(".page-hero")?.remove();
    doc.querySelector(".page-content-grid")?.replaceWith(...doc.querySelector(".page-content-grid").childNodes);
    doc.querySelector(".page-aside")?.remove();

    const header = doc.querySelector(".page-header");
    const article = doc.querySelector("article.prose");
    if (!header || !article) throw new Error("La página no conserva la estructura necesaria para insertar imágenes.");

    if (heroImagePath) {
      header.insertAdjacentHTML("afterend", mediaFigureHTML("hero", data.path));
    }

    if (data.type === "subpage" && asideImagePath) {
      const grid = doc.createElement("div");
      grid.className = "page-content-grid";
      article.replaceWith(grid);
      grid.appendChild(article);
      const aside = doc.createElement("aside");
      aside.className = "page-aside";
      aside.innerHTML = mediaFigureHTML("aside", data.path);
      grid.appendChild(aside);
    }
  }

  async function loadPublishedPage(path) {
    treeStatus.textContent = `Cargando ${path}…`;
    try {
      const html = await GVPatches.getFile(path);
      const doc = new DOMParser().parseFromString(html, "text/html");
      const article = doc.querySelector("article.prose");
      const pageTitle = doc.querySelector(".page-title")?.textContent?.trim();
      if (!article || !pageTitle) throw new Error("La página no usa la estructura editable esperada.");

      loadedPath = path;
      loadedOriginalTitle = pageTitle;
      loadedParentPath = findParentOfUrl(navigation, path);
      loadedSource = html;
      savedRange = null;

      pagePanel.hidden = false;
      homePanel.hidden = true;
      blogPanel.hidden = true;
      type.value = inferType(path);
      updateType();
      title.value = pageTitle;
      slug.value = inferSlug(path);
      slug.dataset.edited = "true";
      description.value = extractDescription(doc);
      resetPageMedia();
      setEditorHTML(article.innerHTML, path);
      extractMedia(doc, ".page-hero", "hero");
      extractMedia(doc, ".page-aside figure", "aside");
      folder.value = inferFolder(path);
      date.value = extractDate(doc);
      if (loadedParentPath) parent.value = JSON.stringify(loadedParentPath);

      type.disabled = true;
      slug.disabled = true;
      folder.disabled = true;
      addMenu.checked = false;
      addIndex.checked = false;
      $("#mode-label").textContent = "Editar página";
      $("#path-label").textContent = path;
      $("#form-heading").textContent = "Editar contenido";
      treeStatus.textContent = "";
      formStatus.textContent = "";
      activateTree(path);
    } catch (error) {
      treeStatus.textContent = error.message;
    }
  }

  function imageName(file) {
    const rawExtension = file.name.split(".").pop() || "jpg";
    const extension = rawExtension.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "imagen";
    const suffix = crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : String(Date.now());
    return `${base}-${suffix}.${extension}`;
  }

  function insertNodeAtSavedSelection(node) {
    restoreSelection();
    const selection = window.getSelection();
    if (selection.rangeCount && body.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      saveSelection();
    } else {
      body.appendChild(node);
    }
  }

  $("#insert-link-button").addEventListener("click", () => {
    saveSelection();
    const label = prompt("Texto del botón:", "");
    if (label === null) return;
    if (!label.trim()) {
      formStatus.textContent = "El texto del botón es obligatorio.";
      return;
    }

    const href = prompt("Enlace del botón:", "https://");
    if (href === null) return;
    if (!isSafeUrl(href) || !href.trim()) {
      formStatus.textContent = "El enlace del botón no es válido.";
      return;
    }

    const style = prompt("Estilo: primario o secundario", "primario");
    if (style === null) return;

    const link = document.createElement("a");
    link.href = href.trim();
    link.textContent = label.trim();
    link.className = style.trim().toLowerCase().startsWith("sec")
      ? "content-button content-button--secondary"
      : "content-button content-button--primary";
    if (/^https?:/i.test(link.href)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    insertNodeAtSavedSelection(link);
    formStatus.textContent = "Botón con enlace insertado.";
  });

  async function insertInteractiveHTMLFile(file) {
    if (!file) return;
    if (!/\.html?$/i.test(file.name) && file.type !== "text/html") {
      throw new Error("Selecciona un archivo HTML.");
    }

    const source = await file.text();
    if (!/<html[\s>]/i.test(source) && !/<!doctype\s+html/i.test(source)) {
      throw new Error("El archivo no contiene un documento HTML completo.");
    }

    const requestedTitle = embedTitle.value.trim()
      || file.name.replace(/\.html?$/i, "")
      || "HTML interactivo";
    const base = slugify(file.name.replace(/\.html?$/i, "")) || "interactivo";
    const suffix = crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now());
    const filename = `${base}-${suffix}.html`;
    const sitePath = `public/interactive/${filename}`;

    await GVPatches.savePatch(sitePath, file);

    const figure = document.createElement("figure");
    figure.className = "embed-player embed-player--generic interactive-html";
    figure.setAttribute("data-interactive-path", sitePath);
    figure.setAttribute("data-embed-title", requestedTitle);
    figure.setAttribute("data-embed-fullscreen", embedFullscreen.checked ? "true" : "false");
    figure.setAttribute("contenteditable", "false");

    const label = document.createElement("p");
    label.className = "embed-placeholder-label";
    label.textContent = `${requestedTitle} · archivo HTML`;
    figure.appendChild(label);

    if (embedCaption.value.trim()) {
      const caption = document.createElement("figcaption");
      caption.textContent = embedCaption.value.trim();
      figure.appendChild(caption);
    }

    createEmbedEditorControls(figure);
    if (editingEmbedFigure) {
      editingEmbedFigure.replaceWith(figure);
    } else {
      insertNodeAtSavedSelection(figure);
    }
    closeEmbedDialog();
    formStatus.textContent = `HTML interactivo guardado: ${sitePath}`;
  }

  $("#embed-html-file-button").addEventListener("click", () => {
    $("#embed-html-file").click();
  });

  $("#embed-html-file").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    try {
      await insertInteractiveHTMLFile(file);
    } catch (error) {
      embedStatus.textContent = error.message;
    }
  });

  $("#insert-embed").addEventListener("click", () => {
    saveSelection();
    editingEmbedFigure = null;
    delete embedDialog.dataset.interactivePath;
    embedForm.reset();
    embedFullscreen.checked = true;
    embedSubmit.textContent = "Insertar contenido incrustado";
    embedStatus.textContent = "";
    embedDialog.showModal();
    embedCode.focus();
  });

  $("#embed-close").addEventListener("click", closeEmbedDialog);
  $("#embed-cancel").addEventListener("click", closeEmbedDialog);

  embedForm.addEventListener("submit", async event => {
    event.preventDefault();
    embedStatus.textContent = "";
    try {
      const accessibleTitle = embedTitle.value.trim();
      const raw = embedCode.value.trim();
      const editingInteractivePath = embedDialog.dataset.interactivePath || "";

      if (editingInteractivePath && (/<!doctype\s+html/i.test(raw) || /<html[\s>]/i.test(raw))) {
        await GVPatches.savePatch(editingInteractivePath, raw);
        editingEmbedFigure.setAttribute("data-embed-title", accessibleTitle || editingEmbedFigure.getAttribute("data-embed-title") || "HTML interactivo");
        editingEmbedFigure.setAttribute("data-embed-fullscreen", embedFullscreen.checked ? "true" : "false");
        const label = editingEmbedFigure.querySelector(".embed-placeholder-label");
        if (label) label.textContent = `${editingEmbedFigure.getAttribute("data-embed-title")} · aplicación interactiva`;
        let caption = editingEmbedFigure.querySelector("figcaption");
        if (embedCaption.value.trim()) {
          if (!caption) {
            caption = document.createElement("figcaption");
            editingEmbedFigure.appendChild(caption);
          }
          caption.textContent = embedCaption.value.trim();
        } else {
          caption?.remove();
        }
        createEmbedEditorControls(editingEmbedFigure);
        closeEmbedDialog();
        formStatus.textContent = "Aplicación interactiva actualizada.";
        return;
      }

      const sanitized = GVEmbeds.sanitize(raw, {title: accessibleTitle});

      const figure = document.createElement("figure");
      figure.className = "embed-player embed-player--generic";
      figure.setAttribute("data-embed-code", sanitized.html);
      figure.setAttribute("data-embed-title", sanitized.title);
      figure.setAttribute("data-embed-kind", sanitized.kind);
      figure.setAttribute("contenteditable", "false");

      const label = document.createElement("p");
      label.className = "embed-placeholder-label";
      label.textContent = GVEmbeds.placeholderLabel(sanitized, sanitized.title);
      figure.appendChild(label);

      if (embedCaption.value.trim()) {
        const caption = document.createElement("figcaption");
        caption.textContent = embedCaption.value.trim();
        figure.appendChild(caption);
      }

      createEmbedEditorControls(figure);
      const wasEditing = Boolean(editingEmbedFigure);
      if (editingEmbedFigure) {
        editingEmbedFigure.replaceWith(figure);
      } else {
        insertNodeAtSavedSelection(figure);
      }
      closeEmbedDialog();
      formStatus.textContent = wasEditing
        ? "Contenido incrustado actualizado."
        : "Contenido incrustado insertado.";
    } catch (error) {
      embedStatus.textContent = error.message;
    }
  });

  body.addEventListener("click", async event => {
    const button = event.target.closest("[data-embed-action]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();

    const figure = button.closest("figure.embed-player");
    if (!figure) return;

    const action = button.dataset.embedAction;
    if (action === "edit") {
      try {
        await editEmbedFigure(figure);
      } catch (error) {
        formStatus.textContent = error.message;
      }
      return;
    }

    if (action === "duplicate") {
      try {
        await duplicateEmbedFigure(figure);
      } catch (error) {
        formStatus.textContent = error.message;
      }
      return;
    }

    if (action === "delete" && confirm("¿Eliminar este contenido incrustado?")) {
      figure.remove();
      formStatus.textContent = "Contenido incrustado eliminado.";
    }
  });

  $("#insert-image").addEventListener("click", () => {
    saveSelection();
    $("#image-file").click();
  });

  $("#image-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (!/^image\/(png|jpeg|webp|gif|avif)$/i.test(file.type)) throw new Error("El archivo seleccionado no es una imagen admitida.");
      const alt = prompt("Texto alternativo de la imagen:", "");
      if (alt === null) return;
      if (!alt.trim()) throw new Error("El texto alternativo es obligatorio.");
      const caption = prompt("Pie de foto (opcional):", "") || "";
      const name = imageName(file);
      const path = `public/images/${name}`;
      await GVPatches.savePatch(path, file);

      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = URL.createObjectURL(file);
      image.setAttribute("data-site-path", path);
      image.alt = alt.trim();
      image.loading = "lazy";
      figure.appendChild(image);
      if (caption.trim()) {
        const figcaption = document.createElement("figcaption");
        figcaption.textContent = caption.trim();
        figure.appendChild(figcaption);
      }

      restoreSelection();
      const selection = window.getSelection();
      if (selection.rangeCount && body.contains(selection.getRangeAt(0).commonAncestorContainer)) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(figure);
        range.setStartAfter(figure);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        saveSelection();
      } else {
        body.appendChild(figure);
      }
      formStatus.textContent = `Imagen añadida: ${path}`;
    } catch (error) {
      formStatus.textContent = error.message;
    } finally {
      event.target.value = "";
    }
  });


  heroFile.addEventListener("change", async () => {
    try {
      await handleMediaFile("hero", heroFile.files?.[0]);
    } catch (error) {
      formStatus.textContent = error.message;
    } finally {
      heroFile.value = "";
    }
  });

  asideFile.addEventListener("change", async () => {
    try {
      await handleMediaFile("aside", asideFile.files?.[0]);
    } catch (error) {
      formStatus.textContent = error.message;
    } finally {
      asideFile.value = "";
    }
  });

  heroAlt.addEventListener("input", () => {
    heroPreview.querySelector("img").alt = heroAlt.value;
  });
  heroCaption.addEventListener("input", () => {
    const caption = heroPreview.querySelector("figcaption");
    caption.textContent = heroCaption.value;
    caption.hidden = !heroCaption.value;
  });
  asideAlt.addEventListener("input", () => {
    asidePreview.querySelector("img").alt = asideAlt.value;
  });
  asideCaption.addEventListener("input", () => {
    const caption = asidePreview.querySelector("figcaption");
    caption.textContent = asideCaption.value;
    caption.hidden = !asideCaption.value;
  });

  $("#remove-hero-image").addEventListener("click", () => {
    heroImagePath = "";
    heroAlt.value = "";
    heroCaption.value = "";
    clearPreviewUrl("hero");
    setMediaPreview("hero", "");
  });

  $("#remove-aside-image").addEventListener("click", () => {
    asideImagePath = "";
    asideAlt.value = "";
    asideCaption.value = "";
    clearPreviewUrl("aside");
    setMediaPreview("aside", "");
  });

  function requireElement(doc, selector, label) {
    const element = doc.querySelector(selector);
    if (!element) throw new Error(`No se encontró ${label} en la portada.`);
    return element;
  }

  async function loadHomepage() {
    treeStatus.textContent = "Cargando portada…";
    try {
      homeSource = await GVPatches.getFile("index.html");
      const doc = new DOMParser().parseFromString(homeSource, "text/html");
      const label = requireElement(doc, ".practice-statement__label", "la identidad");
      const thesis = requireElement(doc, "#practice-title", "la tesis principal");
      const intro = requireElement(doc, ".practice-statement__intro > p:last-child", "la introducción");
      const axes = [...doc.querySelectorAll(".practice-statement__axes article")];
      if (!axes.length) throw new Error("No se encontraron los ejes editoriales de la portada.");

      $("#home-seo-title").value = doc.title;
      $("#home-description").value = doc.querySelector('meta[name="description"]')?.content || "";
      $("#home-label").value = label.textContent.trim();
      $("#home-title").value = thesis.textContent.trim();
      $("#home-intro").value = intro.textContent.trim();
      $("#home-axes").innerHTML = axes.map((axis, index) => `
        <fieldset>
          <legend>Eje ${index + 1}</legend>
          <label><span>Título</span><input class="axis-title" value="${esc(axis.querySelector("h2")?.textContent.trim() || "")}"></label>
          <label><span>Texto</span><textarea class="axis-text" rows="4">${esc(axis.querySelector("p:last-child")?.textContent.trim() || "")}</textarea></label>
        </fieldset>`).join("");

      pagePanel.hidden = true;
      homePanel.hidden = false;
      blogPanel.hidden = true;
      treeStatus.textContent = "";
      homeStatus.textContent = "";
      activateTree("index.html");
    } catch (error) {
      treeStatus.textContent = error.message;
    }
  }

  function buildHomepage() {
    if (!homeSource) throw new Error("Primero carga la portada.");
    const doc = new DOMParser().parseFromString(homeSource, "text/html");
    const seoTitle = $("#home-seo-title").value.trim();
    const seoDescription = $("#home-description").value.trim();
    if (!seoTitle) throw new Error("El título SEO es obligatorio.");
    if (seoDescription.length < 40) throw new Error("La descripción SEO necesita al menos 40 caracteres.");

    doc.title = seoTitle;
    updateMeta(doc, 'meta[name="description"]', seoDescription);
    updateMeta(doc, 'meta[property="og:title"]', seoTitle);
    updateMeta(doc, 'meta[property="og:description"]', seoDescription);
    updateMeta(doc, 'meta[name="twitter:title"]', seoTitle);
    updateMeta(doc, 'meta[name="twitter:description"]', seoDescription);

    requireElement(doc, ".practice-statement__label", "la identidad").textContent = $("#home-label").value.trim();
    requireElement(doc, "#practice-title", "la tesis principal").textContent = $("#home-title").value.trim();
    requireElement(doc, ".practice-statement__intro > p:last-child", "la introducción").textContent = $("#home-intro").value.trim();

    const axes = [...doc.querySelectorAll(".practice-statement__axes article")];
    const fields = [...document.querySelectorAll("#home-axes fieldset")];
    if (axes.length !== fields.length) throw new Error("La estructura de ejes de la portada cambió; no se guardó nada.");
    fields.forEach((field, index) => {
      requireElement(axes[index], "h2", `el título del eje ${index + 1}`).textContent = field.querySelector(".axis-title").value.trim();
      requireElement(axes[index], "p:last-child", `el texto del eje ${index + 1}`).textContent = field.querySelector(".axis-text").value.trim();
    });

    for (const schema of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(schema.textContent);
        if (Array.isArray(data?.["@graph"])) {
          for (const node of data["@graph"]) {
            if (node["@id"]?.endsWith("#webpage")) {
              node.name = seoTitle;
              node.description = seoDescription;
            }
          }
          schema.textContent = JSON.stringify(data);
        }
      } catch {
        // Se conserva JSON-LD no interpretable.
      }
    }

    return `<!doctype html>\n${doc.documentElement.outerHTML}`;
  }

  function showPreview(html) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    frame.src = previewUrl;
    preview.hidden = false;
  }

  $("#preview-button").addEventListener("click", () => {
    try {
      const data = buildData();
      validate(data);
      showPreview(loadedPath ? updateExistingPage(data) : pageHTML(data));
    } catch (error) {
      formStatus.textContent = error.message;
    }
  });

  $("#home-preview").addEventListener("click", () => {
    try {
      showPreview(buildHomepage());
    } catch (error) {
      homeStatus.textContent = error.message;
    }
  });

  $("#blog-preview").addEventListener("click", async () => {
    blogStatus.textContent = "Preparando vista previa…";
    try {
      showPreview(await buildBlogPreview());
      blogStatus.textContent = "";
    } catch (error) {
      blogStatus.textContent = error.message;
    }
  });

  $("#close-preview").addEventListener("click", () => {
    preview.hidden = true;
    frame.src = "about:blank";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.textContent = "Preparando la actualización…";
    try {
      const data = buildData();
      validate(data);

      if (!loadedPath) {
        if (await pathAlreadyExists(data.path)) {
          throw new Error(`La ruta ${data.path} ya existe. Selecciónala en el explorador para editarla.`);
        }
        await GVPatches.savePatch(data.path, pageHTML(data));
        if (addMenu.checked) {
          addToMenu(data);
          await GVPatches.savePatch("src/data/navigation.json", JSON.stringify(navigation, null, 2) + "\n");
          renderTree();
        }
        const indexPatch = await updatedIndex(data);
        if (indexPatch) await GVPatches.savePatch(indexPatch.path, indexPatch.content);
        if (data.type === "blog") {
          await rebuildBlogSurfaces(data);
        }
        await GVPatches.savePatch("sitemap.xml", await updatedSitemap(data));
        formStatus.textContent = data.type === "blog"
          ? `Entrada guardada y blog actualizado: ${data.path}`
          : `Página nueva guardada: ${data.path}`;
      } else {
        const updated = updateExistingPage(data);
        await GVPatches.savePatch(loadedPath, updated);
        loadedSource = updated;
        if (data.title !== loadedOriginalTitle) {
          updateMenuItem(data);
          await GVPatches.savePatch("src/data/navigation.json", JSON.stringify(navigation, null, 2) + "\n");
          loadedOriginalTitle = data.title;
          renderTree();
          activateTree(loadedPath);
        }
        const indexPatch = await updatedIndex(data);
        if (indexPatch) await GVPatches.savePatch(indexPatch.path, indexPatch.content);
        if (data.type === "blog") {
          await rebuildBlogSurfaces(data);
        }
        formStatus.textContent = data.type === "blog"
          ? `Entrada y portada del blog actualizadas: ${loadedPath}`
          : `Página actualizada: ${loadedPath}`;
      }
    } catch (error) {
      formStatus.textContent = error.message;
    }
  });

  blogForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    blogStatus.textContent = "Guardando la página del blog…";
    try {
      if (!blogSource) blogSource = await GVPatches.getFile("blog.html");
      const result = await rebuildBlogSurfaces(null, true);
      blogStatus.textContent = `Blog guardado: ${result.entries.length} entrada${result.entries.length === 1 ? "" : "s"} sincronizada${result.entries.length === 1 ? "" : "s"}. También se actualizó index.html.`;
    } catch (error) {
      blogStatus.textContent = error.message;
    }
  });

  homeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    homeStatus.textContent = "Guardando portada…";
    try {
      const html = buildHomepage();
      await GVPatches.savePatch("index.html", html);
      homeSource = html;
      homeStatus.textContent = "Portada guardada en la actualización: index.html";
    } catch (error) {
      homeStatus.textContent = error.message;
    }
  });

  $("#new-page").addEventListener("click", newPage);
  title.addEventListener("input", () => {
    if (!slug.dataset.edited && !loadedPath) slug.value = slugify(title.value);
  });
  slug.addEventListener("input", () => {
    slug.dataset.edited = "true";
    slug.value = slugify(slug.value);
  });
  type.addEventListener("change", updateType);

  async function initialize() {
    navigation = JSON.parse(await GVPatches.getFile("src/data/navigation.json"));
    renderParents();
    renderTree();
    newPage();
    form.hidden = false;
  }

  initialize().catch((error) => {
    form.hidden = true;
    treeStatus.textContent = error.message;
  });
})();
