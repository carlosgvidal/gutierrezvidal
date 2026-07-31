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

  let navigation = [];
  let loadedPath = null;
  let loadedOriginalTitle = null;
  let loadedParentPath = null;
  let loadedSource = "";
  let homeSource = "";
  let savedRange = null;
  let previewUrl = null;
  let heroImagePath = "";
  let asideImagePath = "";
  let heroPreviewUrl = "";
  let asidePreviewUrl = "";

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
    heroField.hidden = value === "subpage";
    asideField.hidden = value !== "subpage";

    if (value === "blog") {
      folder.value = "blog";
      if (!loadedPath) addMenu.checked = false;
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
    "BLOCKQUOTE", "FIGURE", "IMG", "FIGCAPTION", "SPAN"
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

    if (node.tagName === "A") {
      const href = node.getAttribute("href") || "";
      if (isSafeUrl(href)) cleanElement.setAttribute("href", href);
      if (/^https?:/i.test(href)) {
        cleanElement.setAttribute("target", "_blank");
        cleanElement.setAttribute("rel", "noopener noreferrer");
      }
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

  function prepareEditorHTML(html, pagePath) {
    const parsed = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const holder = parsed.body.firstElementChild;
    holder.querySelectorAll("img").forEach((image) => {
      const sitePath = image.getAttribute("data-site-path")
        || siteImagePathFromSource(image.getAttribute("src") || "");
      if (!sitePath) return;
      image.setAttribute("data-site-path", sitePath);
      image.setAttribute("src", new URL(`../${sitePath}`, location.href).href);
    });
    return sanitizeHTML(holder.innerHTML);
  }

  function editorHTML(pagePath) {
    const cleanHTML = sanitizeHTML(body.innerHTML);
    const parsed = new DOMParser().parseFromString(`<div>${cleanHTML}</div>`, "text/html");
    const holder = parsed.body.firstElementChild;
    holder.querySelectorAll("img").forEach((image) => {
      const sitePath = image.getAttribute("data-site-path")
        || siteImagePathFromSource(image.getAttribute("src") || "");
      if (!sitePath) return;
      image.setAttribute("src", `${rootFor(pagePath)}${sitePath}`);
      image.removeAttribute("data-site-path");
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
</head>
<body data-root="${root}">
  <div data-site-header></div>
  <main class="page">
    <header class="page-header">
      <p class="page-kicker">${esc(kicker)}</p>
      <h1 class="page-title">${esc(data.title)}</h1>
      <p class="page-deck">${esc(data.description)}</p>
    </header>
    ${data.type !== "subpage" && heroImagePath ? mediaFigureHTML("hero", data.path) : ""}
    ${data.type === "subpage" && asideImagePath
      ? `<div class="page-content-grid"><article class="prose">${data.body}</article><aside class="page-aside">${mediaFigureHTML("aside", data.path)}</aside></div>`
      : `<article class="prose">${data.body}</article>`}
  </main>
  <div data-site-footer></div>
  <script src="${root}src/js/site-shell-v2.1.js"></script>
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

  async function updatedIndex(data) {
    if (!addIndex.checked) return null;
    const node = findNode(navigation, data.parentPath);
    if (!node?.url) return null;
    const current = await GVPatches.getFile(node.url);
    const start = current.indexOf('<section class="collection"');
    if (start < 0) return null;
    const close = current.indexOf("</section>", start);
    if (close < 0) return null;
    const link = rootFor(node.url) + data.path;
    const card = `\n<article><h2><a href="${link}">${esc(data.title)}</a></h2><p>${esc(data.description)}</p></article>\n`;
    return { path: node.url, content: current.slice(0, close) + card + current.slice(close) };
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

    if (data.type !== "subpage" && heroImagePath) {
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
        await GVPatches.savePatch("sitemap.xml", await updatedSitemap(data));
        formStatus.textContent = `Página nueva guardada: ${data.path}`;
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
        formStatus.textContent = `Página actualizada: ${loadedPath}`;
      }
    } catch (error) {
      formStatus.textContent = error.message;
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
