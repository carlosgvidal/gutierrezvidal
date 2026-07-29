const navigationItems = [
  ["Inicio", "index.html"],
  ["Escritura", "escritura.html"],
  ["Blog", "blog.html"],
  ["Sonido", "sonido.html"],
  ["Sistema", "sistema.html"],
  ["Materia", "materia.html"],
  ["Imágenes", "imagenes.html"],
  ["Archivo", "archivo.html"],
  ["Perfil", "perfil.html"]
];

function navMarkup(currentPage) {
  return navigationItems.map(([label, url]) => {
    const current = currentPage === url ? ' aria-current="page"' : "";
    return `<li><a href="${url}"${current}>${label}</a></li>`;
  }).join("");
}

function renderHeader(currentPage) {
  return `
    <a class="skip-link" href="#contenido">Saltar al contenido</a>
    <header class="mag-header">
      <div class="mag-header__top">
        <a class="mag-logo" href="index.html" aria-label="Inicio">
          <img src="public/assets/logo-mark.png" alt="Logo de Carlos Adolfo Gutiérrez Vidal">
        </a>
        <p class="mag-title">Carlos Adolfo Gutiérrez Vidal</p>
        <p class="mag-issue">Archivo de autor<br>Edición digital</p>
      </div>
      <nav class="mag-nav" aria-label="Navegación principal">
        <ul>${navMarkup(currentPage)}</ul>
      </nav>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="mag-footer">
      <div class="palette-rule" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="mag-footer__inner">
        <img class="mag-footer__logo" src="public/assets/logo-mark.png" alt="Logo de Carlos Adolfo Gutiérrez Vidal">
        <p class="mag-footer__name">Carlos Adolfo Gutiérrez Vidal</p>
        <p class="mag-footer__meta">Lenguaje · Materia · Sistemas<br>Archivo digital</p>
      </div>
    </footer>
  `;
}

const currentPage = document.body.dataset.page || "index.html";
const headerTarget = document.querySelector("[data-shared-header]");
const footerTarget = document.querySelector("[data-shared-footer]");

if (headerTarget) headerTarget.innerHTML = renderHeader(currentPage);
if (footerTarget) footerTarget.innerHTML = renderFooter();
