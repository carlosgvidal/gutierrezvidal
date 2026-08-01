(() => {
  "use strict";

  const DEFAULT_BASE = "https://www.gutierrezvidal.com/";

  function iframeAttribute(input, name) {
    const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
    const match = String(input || "").match(pattern);
    return match ? (match[1] ?? match[2] ?? match[3] ?? "") : "";
  }

  function extractCandidate(input) {
    const value = String(input || "").trim();
    if (!value) throw new Error("Pega una URL o un código iframe.");
    if (/<iframe\b/i.test(value)) {
      const src = iframeAttribute(value, "src");
      if (!src) throw new Error("El iframe no contiene un atributo src.");
      return {
        src,
        title: iframeAttribute(value, "title"),
        height: Number.parseInt(iframeAttribute(value, "height"), 10) || 0,
      };
    }
    return {src: value, title: "", height: 0};
  }

  function safeURL(value, base = DEFAULT_BASE) {
    let url;
    try {
      url = new URL(value, base);
    } catch {
      throw new Error("La URL del reproductor no es válida.");
    }
    if (url.protocol === "http:") url.protocol = "https:";
    if (url.protocol !== "https:") {
      throw new Error("El reproductor debe usar una URL HTTPS.");
    }
    return url;
  }

  function hostIs(url, host) {
    return url.hostname === host || url.hostname.endsWith(`.${host}`);
  }

  function result(provider, src, sourceUrl, options = {}) {
    return {
      provider,
      src,
      sourceUrl: sourceUrl || src,
      title: options.title || "",
      height: Math.max(120, Math.min(Number(options.height) || 0, 1200))
        || ({archive: 384, spotify: 352, soundcloud: 166, bandcamp: 470, mixcloud: 180}[provider] || 480),
      allow: options.allow || "autoplay; fullscreen; encrypted-media; picture-in-picture",
      video: Boolean(options.video),
    };
  }

  function archive(url, meta) {
    const parts = url.pathname.split("/").filter(Boolean);
    if (!["details", "embed"].includes(parts[0]) || !parts[1]) {
      throw new Error("Archive.org requiere una URL /details/IDENTIFICADOR o /embed/IDENTIFICADOR.");
    }
    const id = encodeURIComponent(decodeURIComponent(parts[1]));
    return result(
      "archive",
      `https://archive.org/embed/${id}${url.search}`,
      `https://archive.org/details/${id}`,
      {title: meta.title, height: meta.height || 384}
    );
  }

  function youtube(url, meta) {
    let id = "";
    if (hostIs(url, "youtu.be")) id = url.pathname.split("/").filter(Boolean)[0] || "";
    if (hostIs(url, "youtube.com") || hostIs(url, "youtube-nocookie.com")) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      const match = url.pathname.match(/^\/(?:embed|shorts)\/([^/?#]+)/);
      if (match) id = match[1];
    }
    if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) {
      throw new Error("No se pudo identificar el video de YouTube.");
    }
    return result(
      "youtube",
      `https://www.youtube-nocookie.com/embed/${id}`,
      `https://www.youtube.com/watch?v=${id}`,
      {title: meta.title, height: meta.height || 480, video: true}
    );
  }

  function vimeo(url, meta) {
    const match = url.pathname.match(/(?:\/video)?\/(\d+)/);
    if (!match) throw new Error("No se pudo identificar el video de Vimeo.");
    return result(
      "vimeo",
      `https://player.vimeo.com/video/${match[1]}`,
      `https://vimeo.com/${match[1]}`,
      {title: meta.title, height: meta.height || 480, video: true}
    );
  }

  function spotify(url, meta) {
    const match = url.pathname.match(/^\/(?:embed\/)?(album|track|playlist|episode|show)\/([A-Za-z0-9]+)/);
    if (!match) throw new Error("La URL de Spotify no corresponde a un álbum, pista, lista, episodio o programa.");
    const [, type, id] = match;
    return result(
      "spotify",
      `https://open.spotify.com/embed/${type}/${id}`,
      `https://open.spotify.com/${type}/${id}`,
      {title: meta.title, height: meta.height || (type === "track" ? 152 : 352)}
    );
  }

  function soundcloud(url, meta) {
    if (url.hostname === "w.soundcloud.com" && url.pathname.startsWith("/player")) {
      const original = url.searchParams.get("url") || "";
      return result("soundcloud", url.href, original || url.href, {
        title: meta.title,
        height: meta.height || 166
      });
    }
    if (!hostIs(url, "soundcloud.com")) throw new Error("La URL no corresponde a SoundCloud.");
    return result(
      "soundcloud",
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}`,
      url.href,
      {title: meta.title, height: meta.height || 166}
    );
  }

  function bandcamp(url, meta, rawInput) {
    if (url.hostname === "bandcamp.com" && url.pathname.startsWith("/EmbeddedPlayer/")) {
      return result("bandcamp", url.href, "", {
        title: meta.title,
        height: meta.height || 470
      });
    }
    if (/<iframe\b/i.test(rawInput) && hostIs(url, "bandcamp.com")) {
      return result("bandcamp", url.href, "", {
        title: meta.title,
        height: meta.height || 470
      });
    }
    throw new Error("Para Bandcamp pega el código iframe de «Share / Embed».");
  }

  function mixcloud(url, meta) {
    if (hostIs(url, "mixcloud.com") && url.pathname.startsWith("/widget/iframe")) {
      return result("mixcloud", url.href, "", {
        title: meta.title,
        height: meta.height || 180
      });
    }
    if (!hostIs(url, "mixcloud.com")) throw new Error("La URL no corresponde a Mixcloud.");
    return result(
      "mixcloud",
      `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(url.pathname)}`,
      url.href,
      {title: meta.title, height: meta.height || 180}
    );
  }

  function normalize(input, platformHint = "", base = (typeof location !== "undefined" ? location.href : DEFAULT_BASE)) {
    const meta = extractCandidate(input);
    const url = safeURL(meta.src, base);
    const hint = String(platformHint || "").toLowerCase();

    let normalized;
    if (hostIs(url, "archive.org")) normalized = archive(url, meta);
    else if (hostIs(url, "youtube.com") || hostIs(url, "youtu.be") || hostIs(url, "youtube-nocookie.com")) normalized = youtube(url, meta);
    else if (hostIs(url, "vimeo.com")) normalized = vimeo(url, meta);
    else if (url.hostname === "open.spotify.com") normalized = spotify(url, meta);
    else if (hostIs(url, "soundcloud.com")) normalized = soundcloud(url, meta);
    else if (hostIs(url, "bandcamp.com")) normalized = bandcamp(url, meta, String(input || ""));
    else if (hostIs(url, "mixcloud.com")) normalized = mixcloud(url, meta);
    else throw new Error("La plataforma del reproductor no está permitida.");

    if (hint && hint !== normalized.provider) {
      throw new Error(`La URL corresponde a ${normalized.provider}, no a ${hint}.`);
    }
    return normalized;
  }

  function className(normalized) {
    return [
      "embed-player",
      `embed-player--${normalized.provider}`,
      normalized.video ? "embed-player--video" : "embed-player--audio"
    ].join(" ");
  }

  window.GVEmbeds = {normalize, className};
})();