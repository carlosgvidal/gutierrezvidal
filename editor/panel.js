(() => {
  "use strict";
  const status = document.querySelector("#patch-status");
  const exportButton = document.querySelector("#export-patch");
  const clearButton = document.querySelector("#clear-patches");
  const details = document.querySelector("#patch-details");
  const list = document.querySelector("#patch-list");

  async function refresh() {
    const state = await GVPatches.status();
    list.innerHTML = "";
    state.paths.forEach(path => {
      const item = document.createElement("li");
      item.textContent = path;
      list.appendChild(item);
    });

    if (!state.count) {
      status.textContent = "No hay cambios pendientes.";
      exportButton.disabled = true;
      clearButton.disabled = true;
      details.hidden = true;
      return;
    }

    const date = state.updatedAt ? new Date(state.updatedAt).toLocaleString("es-MX") : "";
    status.textContent = `${state.count} archivo${state.count === 1 ? "" : "s"} pendiente${state.count === 1 ? "" : "s"}. Último cambio: ${date}.`;
    exportButton.disabled = false;
    clearButton.disabled = false;
    details.hidden = false;
  }

  exportButton.addEventListener("click", async () => {
    status.textContent = "Preparando la actualización…";
    try {
      await GVPatches.exportPatchZip();
      await refresh();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  clearButton.addEventListener("click", async () => {
    await GVPatches.clearAll();
    await refresh();
  });

  refresh().catch(error => { status.textContent = error.message; });
})();