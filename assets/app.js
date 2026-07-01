const MODULE_LABELS = {
  today: "Dnes",
  calendar: "Kalendar",
  gmail: "Gmail",
  news: "Novinky",
  events: "Akce",
  prices: "Ceny",
  tasks: "Ukoly"
};

let dashboard = null;
let manifest = null;
let activeModule = "today";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Prague"
  }).format(new Date(value));
};

const el = (selector) => document.querySelector(selector);

const text = (selector, value) => {
  const target = el(selector);
  if (target) target.textContent = value;
};

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Nepodarilo se nacist ${path}`);
  }
  return response.json();
}

async function boot() {
  try {
    [dashboard, manifest] = await Promise.all([
      loadJson("data/latest.json"),
      loadJson("data/manifest.json")
    ]);
    renderShell();
    renderModule(activeModule);
  } catch (error) {
    text("#overviewTitle", "Data se nepodarilo nacist");
    text("#overviewText", error.message);
    text("#sidebarStatus", "Chyba nacitani");
  }
}

function renderShell() {
  const status = dashboard.status || {};
  const today = dashboard.modules?.today || {};

  text("#generatedAt", `Posledni aktualizace ${formatDateTime(dashboard.generatedAt)}`);
  text("#releaseChip", status.release || "release");
  text("#overviewTitle", today.priority || "Dnesni prehled");
  text("#overviewText", dashboard.summary?.[0] || "Bez hlavni priority.");
  text("#nextRun", formatDateTime(status.nextRunTarget));
  text("#sidebarStatus", status.health === "ok" ? "System je aktualni" : "Zkontrolovat stav");
  text("#healthLabel", status.health === "ok" ? "V poradku" : "Pozor");
  text("#healthNotes", status.notes?.join(" ") || "Bez poznamek.");

  renderNav();
  renderSummary();
  renderHistory();
  renderSources();
}

function renderNav() {
  const nav = el("#moduleNav");
  nav.innerHTML = "";
  const modules = manifest.modules || Object.keys(dashboard.modules || {});

  modules.forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `nav-button${key === activeModule ? " active" : ""}`;
    button.textContent = MODULE_LABELS[key] || key;
    button.addEventListener("click", () => {
      activeModule = key;
      renderNav();
      renderModule(key);
    });
    nav.append(button);
  });
}

function renderSummary() {
  const strip = el("#summaryStrip");
  strip.innerHTML = "";
  (dashboard.summary || []).forEach((item, index) => {
    const block = document.createElement("div");
    block.className = "summary-item";
    block.style.animationDelay = `${index * 45}ms`;
    block.textContent = item;
    strip.append(block);
  });
}

function renderHistory() {
  const list = el("#historyList");
  list.innerHTML = "";
  (manifest.reports || []).slice(0, 8).forEach((report) => {
    const link = document.createElement("a");
    link.className = "history-link";
    link.href = report.html || report.json;
    link.innerHTML = `<strong>${report.label}</strong><div class="meta">${formatDateTime(report.generatedAt)}</div>`;
    list.append(link);
  });
}

function renderSources() {
  const list = el("#sourceList");
  list.innerHTML = "";
  (dashboard.sources || []).forEach((source) => {
    const row = document.createElement("div");
    row.className = "source-row";
    row.innerHTML = `<strong>${source.label}</strong><div class="meta">${source.type} · ${source.status}</div>`;
    list.append(row);
  });
}

function renderModule(key) {
  const module = dashboard.modules?.[key];
  const content = el("#moduleContent");
  content.innerHTML = "";
  text("#activeTitle", module?.title || MODULE_LABELS[key] || key);

  if (!module) {
    content.append(el("#emptyTemplate").content.cloneNode(true));
    return;
  }

  if (key === "today") renderToday(module, content);
  else if (key === "calendar") renderCalendar(module, content);
  else if (key === "news") renderNews(module, content);
  else if (key === "events") renderEvents(module, content);
  else if (key === "gmail") renderGmail(module, content);
  else if (key === "prices") renderPrices(module, content);
  else if (key === "tasks") renderTasks(module, content);
  else renderGeneric(module, content);
}

function renderToday(module, content) {
  addInfo(content, "Priorita", module.priority);
  (module.freeWindows || []).forEach((window) => addInfo(content, window.label, window.detail));
  (module.risks || []).forEach((risk) => addInfo(content, "Riziko", risk, "warning"));
}

function renderCalendar(module, content) {
  (module.events || []).forEach((event) => {
    const row = document.createElement("article");
    row.className = "event-row";
    const time = `${formatDateTime(event.start)} - ${formatDateTime(event.end)}`;
    row.innerHTML = `
      <div>
        <h3>${event.title}</h3>
        <p class="meta">${event.location || "Bez lokace"} · ${event.importance || ""}</p>
      </div>
      <div>
        <span class="pill ${event.transparency === "opaque" ? "warning" : ""}">${event.transparency === "opaque" ? "busy" : "tip"}</span>
        <p class="meta">${time}</p>
      </div>
    `;
    content.append(row);
  });
}

function renderNews(module, content) {
  (module.items || []).forEach((item) => {
    const row = document.createElement("article");
    row.className = "news-row";
    row.innerHTML = `<h3>${item.headline}</h3><p>${item.impact}</p><p class="meta">${item.source || ""}</p>`;
    content.append(row);
  });
  addFilterNote(module.filters, content);
}

function renderEvents(module, content) {
  (module.items || []).forEach((item) => addInfo(content, item.name, `${item.where || ""} ${item.why || ""}`));
}

function renderGmail(module, content) {
  (module.items || []).forEach((item) => addInfo(content, item.label, item.detail, item.status === "action_required" ? "warning" : ""));
}

function renderPrices(module, content) {
  if (!module.items?.length) {
    content.append(el("#emptyTemplate").content.cloneNode(true));
  }
  if (module.note) addInfo(content, "Plan", module.note);
}

function renderTasks(module, content) {
  (module.items || []).forEach((item) => {
    const row = document.createElement("article");
    row.className = "task-row";
    row.innerHTML = `<span class="pill ${item.priority === "high" ? "warning" : ""}">${item.priority}</span><h3>${item.task}</h3><p>${item.detail}</p>`;
    content.append(row);
  });
}

function renderGeneric(module, content) {
  Object.entries(module).forEach(([key, value]) => addInfo(content, key, JSON.stringify(value)));
}

function addInfo(content, label, value, tone = "") {
  if (!value) return;
  const row = document.createElement("article");
  row.className = "info-row";
  row.innerHTML = `<span class="pill ${tone}">${label}</span><p>${value}</p>`;
  content.append(row);
}

function addFilterNote(filters, content) {
  if (!filters?.length) return;
  const note = document.createElement("div");
  note.className = "meta";
  note.textContent = `Filtry: ${filters.join(", ")}`;
  content.append(note);
}

boot();
