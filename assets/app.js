const state = {
  manifest: null,
  report: null,
};

const byId = (id) => document.getElementById(id);

function listItems(target, items) {
  target.innerHTML = "";
  for (const item of items || []) {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  }
}

function renderCalendar(report) {
  const target = byId("calendar");
  target.innerHTML = "";

  if (report.calendar.freeWindows?.length) {
    const free = document.createElement("p");
    free.className = "muted";
    free.textContent = `Volná okna: ${report.calendar.freeWindows.join(", ")}`;
    target.appendChild(free);
  }

  for (const event of report.calendar.events || []) {
    const item = document.createElement("div");
    item.className = "calendar-item";
    item.innerHTML = `<span class="label">${event.type}</span><p><strong>${event.title}</strong></p><p class="muted">${event.when}${event.location ? ` · ${event.location}` : ""}</p><p>${event.note}</p>`;
    target.appendChild(item);
  }
}

function renderNews(report) {
  const target = byId("news-list");
  target.innerHTML = "";
  for (const item of report.news || []) {
    const row = document.createElement("div");
    row.className = "news-item";
    const link = item.url ? `<a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a>` : item.title;
    row.innerHTML = `<span class="label">${item.category}</span><p><strong>${link}</strong></p><p>${item.summary}</p><p class="muted">${item.source} · ${item.published}</p>`;
    target.appendChild(row);
  }
}

function renderHistory(manifest) {
  const target = byId("history-list");
  target.innerHTML = "";
  for (const item of manifest.reports || []) {
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `<p><a href="${item.path}">${item.title}</a></p><p class="muted">${item.date}</p>`;
    target.appendChild(row);
  }
}

function render(report, manifest) {
  byId("report-title").textContent = report.title;
  byId("report-date").textContent = `${report.dateLabel} · aktualizováno ${report.generatedAtLocal}`;
  listItems(byId("summary-list"), report.summary);
  listItems(byId("actions-list"), report.recommendedActions);
  listItems(byId("risks-list"), report.risks);
  renderCalendar(report);
  renderNews(report);
  renderHistory(manifest);
}

async function load() {
  const [manifest, report] = await Promise.all([
    fetch("data/manifest.json").then((response) => response.json()),
    fetch("data/latest.json").then((response) => response.json()),
  ]);
  state.manifest = manifest;
  state.report = report;
  render(report, manifest);
}

load().catch((error) => {
  byId("report-title").textContent = "Dashboard se nepodařilo načíst";
  byId("report-date").textContent = String(error);
});
