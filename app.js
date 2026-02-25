(() => {
  const LOG_KEY = "webview-nav-log";
  const MAX_LOG_LENGTH = 200;

  function safeParseJSON(value, fallback = null) {
    if (typeof value !== "string") return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return (
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds()) +
      "." +
      String(d.getMilliseconds()).padStart(3, "0")
    );
  }

  function currentPageId() {
    const body = document.body;
    return body && body.dataset && body.dataset.pageId
      ? body.dataset.pageId
      : location.pathname || "unknown";
  }

  function readLog() {
    const raw = sessionStorage.getItem(LOG_KEY);
    const parsed = safeParseJSON(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeLog(entries) {
    const trimmed =
      entries.length > MAX_LOG_LENGTH
        ? entries.slice(entries.length - MAX_LOG_LENGTH)
        : entries;
    sessionStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
  }

  function logEvent(type, details) {
    try {
      const entry = {
        time: Date.now(),
        page: currentPageId(),
        type,
        details,
      };
      const log = readLog();
      log.push(entry);
      writeLog(log);
      renderLog(log);
    } catch (e) {
      console.error("Failed to log event", e);
    }
  }

  function renderLog(log) {
    const container = document.getElementById("event-log");
    if (!container) return;
    container.innerHTML = "";
    const entries = [...log].sort((a, b) => b.time - a.time);
    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "log-entry";

      const typeSpan = document.createElement("div");
      typeSpan.className =
        "log-type event-" + String(entry.type || "unknown").toLowerCase();
      typeSpan.textContent = entry.type;

      const metaSpan = document.createElement("div");
      metaSpan.className = "log-meta";
      metaSpan.textContent = `${formatTime(entry.time)} · ${entry.page}`;

      const headerCell = document.createElement("div");
      headerCell.appendChild(typeSpan);
      headerCell.appendChild(document.createElement("br"));
      headerCell.appendChild(metaSpan);

      const detailsCell = document.createElement("div");
      detailsCell.className = "log-details";
      try {
        detailsCell.textContent = JSON.stringify(entry.details || {}, null, 0);
      } catch {
        detailsCell.textContent = String(entry.details);
      }

      row.appendChild(headerCell);
      row.appendChild(detailsCell);
      container.appendChild(row);
    });
  }

  function renderInfo() {
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    const setPre = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      try {
        el.textContent =
          value == null ? "null" : JSON.stringify(value, null, 2);
      } catch {
        el.textContent = String(value);
      }
    };

    setText("current-url", location.href);
    setText("current-path", location.pathname + location.search);
    setText("referrer", document.referrer || "(пусто)");
    setText("history-length", String(history.length));

    setPre("history-state", history.state);
  }

  function normalizeUrlWithVariant(variant) {
    const url = new URL(location.href);
    url.searchParams.set("v", variant);
    return url.pathname + url.search;
  }

  function bindHistoryControls() {
    const byId = (id) => document.getElementById(id);

    const backBtn = byId("btn-back");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        logEvent("action", { action: "history.back" });
        history.back();
      });
    }

    const forwardBtn = byId("btn-forward");
    if (forwardBtn) {
      forwardBtn.addEventListener("click", () => {
        logEvent("action", { action: "history.forward" });
        history.forward();
      });
    }

    const reloadBtn = byId("btn-reload");
    if (reloadBtn) {
      reloadBtn.addEventListener("click", () => {
        logEvent("action", { action: "location.reload" });
        location.reload();
      });
    }

    const back2Btn = byId("btn-go-back-2");
    if (back2Btn) {
      back2Btn.addEventListener("click", () => {
        logEvent("action", { action: "history.go", delta: -2 });
        history.go(-2);
      });
    }

    const forward2Btn = byId("btn-go-forward-2");
    if (forward2Btn) {
      forward2Btn.addEventListener("click", () => {
        logEvent("action", { action: "history.go", delta: 2 });
        history.go(2);
      });
    }
  }

  function bindHardNavigation() {
    const assignButtons = document.querySelectorAll(".btn-assign");
    assignButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");
        logEvent("action", { action: "location.assign", target });
        location.assign(target);
      });
    });

    const replaceButtons = document.querySelectorAll(".btn-replace");
    replaceButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");
        logEvent("action", { action: "location.replace", target });
        location.replace(target);
      });
    });

    const anchors = document.querySelectorAll("a[data-link-kind='anchor']");
    anchors.forEach((a) => {
      a.addEventListener("click", () => {
        const href = a.getAttribute("href");
        logEvent("action", { action: "anchor-click", href });
      });
    });
  }

  function bindSoftNavigation() {
    const pushButtons = document.querySelectorAll(".btn-pushstate");
    pushButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const variant = btn.getAttribute("data-variant") || "v1";
        const newRelativeUrl = normalizeUrlWithVariant(variant);
        const newState = {
          page: currentPageId(),
          method: "pushState",
          variant,
        };
        history.pushState(newState, "", newRelativeUrl);
        logEvent("popstate-like", {
          action: "history.pushState",
          url: newRelativeUrl,
          state: newState,
        });
        renderInfo();
      });
    });

    const replaceButtons = document.querySelectorAll(".btn-replacestate");
    replaceButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const variant = btn.getAttribute("data-variant") || "v1";
        const newRelativeUrl = normalizeUrlWithVariant(variant);
        const newState = {
          page: currentPageId(),
          method: "replaceState",
          variant,
        };
        history.replaceState(newState, "", newRelativeUrl);
        logEvent("popstate-like", {
          action: "history.replaceState",
          url: newRelativeUrl,
          state: newState,
        });
        renderInfo();
      });
    });
  }

  function bindGlobalNavigationEvents() {
    window.addEventListener("popstate", (event) => {
      logEvent("popstate", { state: event.state });
      renderInfo();
    });

    window.addEventListener("pageshow", (event) => {
      logEvent("pageshow", { persisted: event.persisted });
    });

    window.addEventListener("pagehide", (event) => {
      logEvent("pagehide", { persisted: event.persisted });
    });

    window.addEventListener("beforeunload", () => {
      logEvent("beforeunload", {});
    });

    window.addEventListener("unload", () => {
      logEvent("unload", {});
    });

    document.addEventListener("visibilitychange", () => {
      logEvent("visibilitychange", { visibilityState: document.visibilityState });
    });
  }

  function init() {
    const initialLog = readLog();
    renderLog(initialLog);
    renderInfo();

    logEvent("init", {
      url: location.href,
      page: currentPageId(),
    });

    bindHistoryControls();
    bindHardNavigation();
    bindSoftNavigation();
    bindGlobalNavigationEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

