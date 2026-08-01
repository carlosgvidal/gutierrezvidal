const EMBED_ROOTS = new Set(["IFRAME", "OBJECT", "EMBED", "AUDIO", "VIDEO"]);
const ALLOWED_TAGS = new Set([
  "IFRAME", "OBJECT", "EMBED", "AUDIO", "VIDEO", "SOURCE", "TRACK", "PARAM",
  "A", "P", "SPAN", "DIV", "FIGURE", "FIGCAPTION", "BR"
]);
const URL_ATTRIBUTES = new Set(["src", "data", "poster", "href"]);
const BOOLEAN_ATTRIBUTES = new Set([
  "allowfullscreen", "controls", "autoplay", "loop", "muted", "playsinline", "default"
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
  FIGURE: new Set(["class"]), FIGCAPTION: new Set(["class"]), DIV: new Set(["class"]),
  P: new Set(["class"]), SPAN: new Set(["class"])
};

function cleanURL(value, base = location.href) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("#") || text.startsWith("./") || text.startsWith("../") || text.startsWith("/")) return text;
  const url = new URL(text, base);
  if (url.protocol === "http:") url.protocol = "https:";
  if (!["https:", "blob:"].includes(url.protocol)) throw new Error("Protocolo no permitido.");
  return url.href;
}

function sanitizeElement(node, outputDocument, base) {
  if (node.nodeType === Node.TEXT_NODE) return outputDocument.createTextNode(node.nodeValue || "");
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  if (["SCRIPT", "STYLE", "LINK", "META", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT"].includes(node.tagName)) return null;
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
    if (!allowed.has(name) && !name.startsWith("aria-")) continue;
    let value = attribute.value;
    if (URL_ATTRIBUTES.has(name)) {
      try { value = cleanURL(value, base); } catch { continue; }
    }
    if (["width", "height"].includes(name) && !/^\d{1,5}(?:\.\d+)?(?:px|%|vw|vh)?$/i.test(value)) continue;
    if (name === "target") value = value === "_blank" ? "_blank" : "_self";
    if (name === "rel") value = "noopener noreferrer";
    if (BOOLEAN_ATTRIBUTES.has(name)) clean.setAttribute(name, "");
    else clean.setAttribute(name, value);
  }
  if (node.tagName === "IFRAME") {
    clean.setAttribute("loading", clean.getAttribute("loading") || "eager");
    clean.setAttribute("referrerpolicy", clean.getAttribute("referrerpolicy") || "strict-origin-when-cross-origin");
    if (!clean.getAttribute("title")) clean.setAttribute("title", "Contenido incrustado");
  }
  for (const child of [...node.childNodes]) {
    const cleanChild = sanitizeElement(child, outputDocument, base);
    if (cleanChild) clean.appendChild(cleanChild);
  }
  return clean;
}

export function sanitizeEmbeddedHTML(input, options = {}) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("Código incrustado vacío.");
  const base = options.base || location.href;
  const markup = /<\s*[a-z][\s\S]*>/i.test(raw)
    ? raw
    : `<iframe src="${cleanURL(raw, base)}" title="${options.title || "Contenido incrustado"}"></iframe>`;
  const parsed = new DOMParser().parseFromString(`<div>${markup}</div>`, "text/html");
  const source = parsed.body.firstElementChild;
  const output = document.implementation.createHTMLDocument("");
  const holder = output.createElement("div");
  for (const child of [...source.childNodes]) {
    const clean = sanitizeElement(child, output, base);
    if (clean) holder.appendChild(clean);
  }
  const root = [...holder.querySelectorAll("iframe, object, embed, audio, video")][0];
  if (!root || !EMBED_ROOTS.has(root.tagName)) throw new Error("Código incrustado no válido.");
  return holder.innerHTML.trim();
}
