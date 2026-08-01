(() => {
  "use strict";

  const EMBED_ROOTS = new Set(["IFRAME", "OBJECT", "EMBED", "AUDIO", "VIDEO"]);
  const ALLOWED_TAGS = new Set([
    "IFRAME", "OBJECT", "EMBED", "AUDIO", "VIDEO", "SOURCE", "TRACK", "PARAM",
    "A", "P", "SPAN", "DIV", "FIGURE", "FIGCAPTION", "BR"
  ]);
  const URL_ATTRIBUTES = new Set(["src", "data", "poster", "href"]);
  const GLOBAL_ATTRIBUTES = new Set([
    "title", "width", "height", "class", "id", "role", "aria-label", "aria-describedby"
  ]);
  const TAG_ATTRIBUTES = {
    IFRAME: new Set(["src", "title", "width", "height", "allow", "allowfullscreen", "loading", "referrerpolicy", "sandbox", "name"]),
    OBJECT: new Set(["data", "type", "name", "width", "height", "title", "aria-label"]),
    EMBED: new Set(["src", "type", "width", "height", "title"]),
    AUDIO: new Set(["src", "controls", "autoplay", "loop", "muted", "preload", "crossorigin"]),
    VIDEO: new Set(["src", "poster", "controls", "autoplay", "loop", "muted", "preload", "playsinline", "crossorigin", "width", "height"]),
    SOURCE: new Set(["src", "type", "media", "sizes"]),
    TRACK: new Set(["src", "kind", "srclang", "label", "default"]),
    PARAM: new Set(["name", "value"]),
    A: new Set(["href", "target", "rel", "title"]),
    FIGURE: new Set(["class"]),
    FIGCAPTION: new Set(["class"]),
    DIV: new Set(["class"]),
    P: new Set(["class"]),
    SPAN: new Set(["class"])
  };
  const BOOLEAN_ATTRIBUTES = new Set([
    "allowfullscreen", "controls", "autoplay", "loop", "muted", "playsinline", "default"
  ]);

  function cleanURL(value, base = location.href) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (text.startsWith("#") || text.startsWith("./") || text.startsWith("../") || text.startsWith("/")) {
      return text;
    }
    let url;
    try {
      url = new URL(text, base);
    } catch {
      throw new Error(`URL no válida: ${text}`);
    }
    if (url.protocol === "http:") url.protocol = "https:";
    if (!["https:", "blob:"].includes(url.protocol)) {
      throw new Error(`Protocolo no permitido: ${url.protocol}`);
    }
    return url.href;
  }

  function cleanDimension(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (/^\d{1,5}(?:\.\d+)?(?:px|%|vw|vh)?$/i.test(text)) return text;
    return "";
  }

  function sanitizeClass(value) {
    return String(value || "")
      .split(/\s+/)
      .filter(name => /^[a-z0-9_-]{1,64}$/i.test(name))
      .slice(0, 12)
      .join(" ");
  }

  function sanitizeElement(node, outputDocument, base) {
    if (node.nodeType === Node.TEXT_NODE) {
      return outputDocument.createTextNode(node.nodeValue || "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    if (["SCRIPT", "STYLE", "LINK", "META", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT"].includes(node.tagName)) {
      return null;
    }
    if (!ALLOWED_TAGS.has(node.tagName)) {
      const fragment = outputDocument.createDocumentFragment();
      for (const child of [...node.childNodes]) {
        const clean = sanitizeElement(child, outputDocument, base);
        if (clean) fragment.appendChild(clean);
      }
      return fragment;
    }

    const clean = outputDocument.createElement(node.tagName.toLowerCase());
    const allowed = TAG_ATTRIBUTES[node.tagName] || new Set();

    for (const attribute of [...node.attributes]) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || name === "srcdoc" || name === "style") continue;
      if (!allowed.has(name) && !GLOBAL_ATTRIBUTES.has(name) && !name.startsWith("aria-")) continue;

      let value = attribute.value;
      if (URL_ATTRIBUTES.has(name)) {
        try {
          value = cleanURL(value, base);
        } catch {
          continue;
        }
      } else if (["width", "height"].includes(name)) {
        value = cleanDimension(value);
        if (!value) continue;
      } else if (name === "class") {
        value = sanitizeClass(value);
        if (!value) continue;
      } else if (name === "target") {
        value = value === "_blank" ? "_blank" : "_self";
      } else if (name === "rel") {
        value = "noopener noreferrer";
      } else if (name === "sandbox") {
        value = String(value || "")
          .split(/\s+/)
          .filter(token => [
            "allow-forms", "allow-modals", "allow-orientation-lock", "allow-pointer-lock",
            "allow-popups", "allow-popups-to-escape-sandbox", "allow-presentation",
            "allow-same-origin", "allow-scripts", "allow-top-navigation-by-user-activation",
            "allow-downloads"
          ].includes(token))
          .join(" ");
      }

      if (BOOLEAN_ATTRIBUTES.has(name)) clean.setAttribute(name, "");
      else clean.setAttribute(name, value);
    }

    if (node.tagName === "IFRAME") {
      clean.setAttribute("loading", clean.getAttribute("loading") || "lazy");
      clean.setAttribute("referrerpolicy", clean.getAttribute("referrerpolicy") || "strict-origin-when-cross-origin");
      if (!clean.getAttribute("title")) clean.setAttribute("title", "Contenido incrustado");
    }
    if (node.tagName === "A" && clean.getAttribute("target") === "_blank") {
      clean.setAttribute("rel", "noopener noreferrer");
    }

    for (const child of [...node.childNodes]) {
      const cleanChild = sanitizeElement(child, outputDocument, base);
      if (cleanChild) clean.appendChild(cleanChild);
    }
    return clean;
  }

  function firstEmbedRoot(root) {
    if (root.nodeType === Node.ELEMENT_NODE && EMBED_ROOTS.has(root.tagName)) return root;
    return root.querySelector?.("iframe, object, embed, audio, video") || null;
  }

  function sanitize(input, options = {}) {
    const raw = String(input || "").trim();
    if (!raw) throw new Error("Pega un código incrustado o una URL.");
    const base = options.base || location.href;
    const markup = /<\s*[a-z][\s\S]*>/i.test(raw)
      ? raw
      : `<iframe src="${cleanURL(raw, base)}" title="${options.title || "Contenido incrustado"}" loading="lazy"></iframe>`;

    const parsed = new DOMParser().parseFromString(`<div>${markup}</div>`, "text/html");
    const source = parsed.body.firstElementChild;
    const output = document.implementation.createHTMLDocument("");
    const holder = output.createElement("div");

    for (const child of [...source.childNodes]) {
      const clean = sanitizeElement(child, output, base);
      if (clean) holder.appendChild(clean);
    }

    const root = firstEmbedRoot(holder);
    if (!root) {
      throw new Error("El código no contiene iframe, object, embed, audio o video.");
    }

    const title = options.title || root.getAttribute("title") || root.getAttribute("aria-label") || "Contenido incrustado";
    if (["IFRAME", "OBJECT", "EMBED"].includes(root.tagName) && !root.getAttribute("title")) {
      root.setAttribute("title", title);
    }
    const primaryUrl = root.getAttribute("src") || root.getAttribute("data") || "";
    const height = cleanDimension(root.getAttribute("height")) || "";

    return {
      html: holder.innerHTML.trim(),
      title,
      kind: root.tagName.toLowerCase(),
      primaryUrl,
      height
    };
  }

  function placeholderLabel(result, explicitTitle = "") {
    const title = explicitTitle || result.title || "Contenido incrustado";
    return `${title} · ${result.kind}`;
  }

  window.GVEmbeds = {sanitize, placeholderLabel, cleanURL};
})();
