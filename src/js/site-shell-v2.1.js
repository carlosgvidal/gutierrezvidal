const ROOT = document.body.dataset.root || "";

function resolveUrl(url) {
  if (/^(https?:|mailto:|tel:|#)/.test(url)) return url;
  return `${ROOT}${url}`;
}

function renderBranch(items, depth = 0) {
  return `<ul class="drawer-list drawer-list--${depth}">${items.map(item => {
    const link = item.url
      ? `<a href="${resolveUrl(item.url)}">${item.label}</a>`
      : `<span>${item.label}</span>`;
    const children = item.children?.length
      ? `<details ${depth === 0 ? "" : ""}><summary>${link}</summary>${renderBranch(item.children, depth + 1)}</details>`
      : link;
    return `<li>${children}</li>`;
  }).join("")}</ul>`;
}

async function initShell() {
  const response = await fetch(`${ROOT}src/data/navigation.json`, {cache: "no-store"});
  if (!response.ok) throw new Error("No se pudo cargar la navegación.");
  const navigation = await response.json();

  const header = document.querySelector("[data-site-header]");
  const footer = document.querySelector("[data-site-footer]");

  if (header) {
    header.innerHTML = `
      <header class="site-header">
        <div class="site-header__inner">
          <a class="site-logo" href="${ROOT}index.html" aria-label="Inicio">
            <img src="${ROOT}public/assets/logo-dark.png" alt="">
          </a>
          <a class="site-wordmark" href="${ROOT}index.html">Carlos Adolfo Gutiérrez Vidal</a>
          <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-drawer">
            <span>Menú</span><i></i><i></i>
          </button>
        </div>
      </header>
      <div class="drawer-backdrop" hidden></div>
      <aside class="site-drawer" id="site-drawer" aria-label="Índice del sitio" hidden>
        <div class="drawer-head">
          <p>Índice</p>
          <button class="drawer-close" type="button" aria-label="Cerrar menú">Cerrar</button>
        </div>
        ${renderBranch(navigation)}
      </aside>
    `;
  }

  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="site-footer__inner">
          <img src="${ROOT}public/assets/logo-light.png" alt="" class="site-footer__logo">
          <p>© 2026 · gutierrezvidal.com</p>
          <nav aria-label="Enlaces secundarios">
            <a href="${ROOT}contacto.html">Contacto</a>
            <a href="${ROOT}enlaces.html">Enlaces</a>
          </nav>
        </div>
      </footer>
    `;
  }

  const button = document.querySelector(".menu-button");
  const drawer = document.querySelector(".site-drawer");
  const backdrop = document.querySelector(".drawer-backdrop");
  const close = document.querySelector(".drawer-close");

  function setOpen(open) {
    button?.setAttribute("aria-expanded", String(open));
    if (drawer) drawer.hidden = !open;
    if (backdrop) backdrop.hidden = !open;
    document.documentElement.classList.toggle("menu-open", open);
  }

  button?.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  close?.addEventListener("click", () => setOpen(false));
  backdrop?.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });
}

initShell().catch(error => console.error(error));
