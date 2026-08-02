(() => {
  "use strict";

  function resizeFrame(frame) {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const root = doc.documentElement;
      const body = doc.body;
      const height = Math.max(
        root?.scrollHeight || 0,
        root?.offsetHeight || 0,
        body?.scrollHeight || 0,
        body?.offsetHeight || 0,
        window.innerHeight * 0.82
      );
      if (height > 0) frame.style.height = `${Math.ceil(height)}px`;

      if (!frame.__gvResizeObserver && "ResizeObserver" in window) {
        const observer = new ResizeObserver(() => resizeFrame(frame));
        if (root) observer.observe(root);
        if (body && body !== root) observer.observe(body);
        frame.__gvResizeObserver = observer;
      }
    } catch {
      frame.style.height = "92vh";
    }
  }

  function alignApp(app) {
    const gutter = window.innerWidth <= 680 ? 8 : 16;

    app.style.width = "";
    app.style.marginLeft = "";

    const rect = app.getBoundingClientRect();
    const availableWidth = Math.max(0, window.innerWidth - gutter * 2);
    const targetWidth = Math.min(1500, availableWidth);

    app.style.width = `${targetWidth}px`;

    const adjustedRect = app.getBoundingClientRect();
    const targetLeft = (window.innerWidth - targetWidth) / 2;
    app.style.marginLeft = `${targetLeft - adjustedRect.left}px`;
  }

  function alignAllApps() {
    document.querySelectorAll(".interactive-app").forEach(alignApp);
  }

  function activate(frame) {
    frame.addEventListener("load", () => {
      resizeFrame(frame);
      requestAnimationFrame(() => resizeFrame(frame));
      setTimeout(() => resizeFrame(frame), 300);
      setTimeout(() => resizeFrame(frame), 1200);
    });

    if (frame.contentDocument?.readyState === "complete") resizeFrame(frame);
  }

  document.querySelectorAll("iframe[data-interactive-frame='true']").forEach(activate);

  alignAllApps();
  window.addEventListener("resize", alignAllApps, {passive: true});
  window.addEventListener("orientationchange", () => {
    requestAnimationFrame(alignAllApps);
  });
})();