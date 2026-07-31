(() => {
  "use strict";

  const IMAGE_WIDTH = 1774;
  const IMAGE_HEIGHT = 887;
  const stage = document.querySelector("#hotspot-stage");
  const status = document.querySelector("#hotspot-status");
  const downloadButton = document.querySelector("#download-hotspots");
  let hotspots = [];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function place(element, hotspot) {
    element.style.left = `${hotspot.imageX / IMAGE_WIDTH * 100}%`;
    element.style.top = `${hotspot.imageY / IMAGE_HEIGHT * 100}%`;
  }

  function attachDrag(element, hotspot) {
    element.addEventListener("pointerdown", event => {
      event.preventDefault();
      element.setPointerCapture(event.pointerId);

      const move = moveEvent => {
        const rect = stage.getBoundingClientRect();
        const x = clamp(moveEvent.clientX - rect.left, 0, rect.width);
        const y = clamp(moveEvent.clientY - rect.top, 0, rect.height);
        hotspot.imageX = Math.round(x / rect.width * IMAGE_WIDTH);
        hotspot.imageY = Math.round(y / rect.height * IMAGE_HEIGHT);
        place(element, hotspot);
        status.textContent = `${hotspot.label}: x ${hotspot.imageX}, y ${hotspot.imageY}`;
      };

      const end = () => {
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", end);
        element.removeEventListener("pointercancel", end);
      };

      element.addEventListener("pointermove", move);
      element.addEventListener("pointerup", end);
      element.addEventListener("pointercancel", end);
    });
  }

  function render() {
    stage.querySelectorAll(".hotspot-marker").forEach(node => node.remove());
    hotspots.forEach(hotspot => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hotspot-marker";
      button.textContent = hotspot.label;
      button.setAttribute("aria-label", `Mover hotspot ${hotspot.label}`);
      place(button, hotspot);
      attachDrag(button, hotspot);
      stage.appendChild(button);
    });
    status.textContent = `${hotspots.length} hotspots cargados. Arrastra una etiqueta para cambiar su posición.`;
  }

  async function load() {
    try {
      const response = await fetch("../src/data/hotspots.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Formato inválido");
      hotspots = data;
      render();
    } catch (error) {
      status.textContent = `No se pudieron cargar los hotspots: ${error.message}`;
      downloadButton.disabled = true;
    }
  }

  downloadButton.addEventListener("click", () => {
    if (!hotspots.length) return;
    const blob = new Blob([`${JSON.stringify(hotspots, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hotspots.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "hotspots.json descargado.";
  });

  load();
})();
