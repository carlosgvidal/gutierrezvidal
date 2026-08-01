(() => {
  "use strict";

  const status = document.querySelector("#patch-status");
  const exportButton = document.querySelector("#export-patch");
  const clearButton = document.querySelector("#clear-patches");
  const details = document.querySelector("#patch-details");
  const list = document.querySelector("#patch-list");
  const readyLink = document.querySelector("#patch-download-link");

  let refreshToken = 0;
  let downloadUrl = "";

  async function refresh() {
    const token = ++refreshToken;
    const state = await GVPatches.status();
    if (token !== refreshToken) return;

    list.replaceChildren();
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
      readyLink.hidden = true;
      return;
    }

    const date = state.updatedAt
      ? new Date(state.updatedAt).toLocaleString("es-MX")
      : "sin fecha";
    status.textContent = `${state.count} archivo${state.count === 1 ? "" : "s"} pendiente${state.count === 1 ? "" : "s"}. Último cambio: ${date}.`;
    exportButton.disabled = false;
    clearButton.disabled = false;
    details.hidden = false;
  }

  exportButton.addEventListener("click", async () => {
    exportButton.disabled = true;
    status.textContent = "Preparando la actualización…";
    try {
      const {blob, names} = await GVPatches.buildPatchZip();
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(blob);
      readyLink.href = downloadUrl;
      readyLink.download = `gutierrezvidal-actualizacion-${new Date().toISOString().slice(0, 10)}.zip`;
      readyLink.hidden = false;
      status.textContent = `ZIP preparado con ${names.length} archivo${names.length === 1 ? "" : "s"}. Si no se descarga automáticamente, pulsa «Descargar ZIP preparado».`;
      readyLink.click();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      exportButton.disabled = false;
    }
  });

  clearButton.addEventListener("click", async () => {
    if (!confirm("¿Descartar todos los cambios pendientes del CMS?")) return;
    await GVPatches.clearAll();
    await refresh();
  });

  window.addEventListener("pageshow", () => refresh().catch(error => {
    status.textContent = error.message;
  }));
  window.addEventListener("focus", () => refresh().catch(() => {}));
  window.addEventListener("storage", event => {
    if (event.key?.startsWith("gutierrezvidal-editor-patches")) refresh().catch(() => {});
  });
  window.addEventListener("gvpatcheschange", () => refresh().catch(() => {}));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh().catch(() => {});
  });

  try {
    const channel = new BroadcastChannel("gutierrezvidal-editor-patches");
    channel.addEventListener("message", () => refresh().catch(() => {}));
  } catch {}

  refresh().catch(error => {
    status.textContent = error.message;
  });
})();