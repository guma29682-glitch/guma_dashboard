const state = {
  manifest: null,
  active: null,
};

const el = (id) => document.getElementById(id);

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Nepodarilo se nacist ${path}`);
  }
  return response.json();
}

function setList(id, items) {
  const list = el(id);
  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function renderCalendar(report) {
  const root = el("calendar");
  root.innerHTML = "";
  report.calendar.items.forEach((item) => {
    const node = document.createElement("article");
    node.className = "item";
    node.innerHTML = `<span class="tag ${item.type === "transparent" ? "" : "warn"}">${item.typeLabel}</span><h3>${item.title}</h3><p>${item.detail}</p>`;
    root.appendChild(node);
  });
}

function renderNews(report) {
  const root = el("news");
  root.innerHTML = "";
  report.news.items.forEach((item) => {
    const node = document.createElement("article");
    node.className = "item";
    const source = item.url ? ` <a href="${item.url}" rel="noopener" target="_blank">Zdroj</a>` : "";
    node.innerHTML = `<span class="tag">${item.category}</span><h3>${item.title}</h3><p>${item.summary}${source}</p>`;
    root.appendChild(node);
  });
}

function renderFacts(report) {
  const root = el("quickFacts");
  root.innerHTML = "";
  report.quickFacts.forEach((fact) => {
    const node = document.createElement("div");
    node.className = "fact";
    node.innerHTML = `<strong>${fact.value}</strong><span>${fact.label}</span>`;
    root.appendChild(node);
  });
}

function renderHistory(manifest) {
  const root = el("history");
  root.innerHTML = "";
  manifest.reports.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${entry.date} - ${entry.title}`;
    button.addEventListener("click", async () => {
      const report = await loadJson(entry.path);
      renderReport(report);
    });
    root.appendChild(button);
  });
}

function renderReport(report) {
  state.active = report;
  document.title = `${report.title} | GUMA OS`;
  el("generatedAt").textContent = report.generatedAtLabel;
  el("reportTitle").textContent = report.title;
  el("reportSummary").textContent = report.summary;
  renderFacts(report);
  setList("priorities", report.priorities);
  renderCalendar(report);
  renderNews(report);
  setList("risks", report.risks);
}

async function init() {
  try {
    const [manifest, latest] = await Promise.all([
      loadJson("./data/manifest.json"),
      loadJson("./data/latest.json"),
    ]);
    state.manifest = manifest;
    renderReport(latest);
    renderHistory(manifest);
  } catch (error) {
    el("reportTitle").textContent = "Report se nepodarilo nacist";
    el("reportSummary").textContent = error.message;
  }
}

init();
