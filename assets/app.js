const state = {
  manifest: null,
  report: null,
};

const byId = (id) => document.getElementById(id);

function clear(target) {
  while (target.firstChild) target.removeChild(target.firstChild);
}

function listItems(target, items) {
  clear(target);
  for (const item of items || []) {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  }
}

function renderCalendar(report) {
  const target = byId("calendar");
  clear(target);

  if (report.calendar?.dayShape) {
    const shape = document.createElement("p");
    shape.textContent = report.calendar.dayShape;
    target.appendChild(shape);
  }

  if (report.calendar?.freeWindows?.length) {
    const free = document.createElement("p");
    free.className = "muted";
    free.textContent = "Volná okna: " + report.calendar.freeWindows.join(", ");
    target.appendChild(free);
  }

  for (const event of report.calendar?.events || []) {
    const item = document.createElement("div");
    item.className = "calendar-item";

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = event.type || "událost";

    const title = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = event.title;
    title.appendChild(strong);

    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = [event.when, event.location].filter(Boolean).join(" · ");

    const note = document.createElement("p");
    note.textContent = event.note || "";

    item.append(label, title, meta, note);
    target.appendChild(item);
  }
}

function renderNews(report) {
  const target = byId("news-list");
  clear(target);
  for (const item of report.news || []) {
    const row = document.createElement("div");
    row.className = "news-item";

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = item.category;

    const title = document.createElement("p");
    const strong = document.createElement("strong");
    if (item.url) {
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = item.title;
      strong.appendChild(link);
    } else {
      strong.textContent = item.title;
    }
    title.appendChild(strong);

    const summary = document.createElement("p");
    summary.textContent = item.summary;

    const source = document.createElement("p");
    source.className = "muted";
    source.textContent = [item.source, item.published].filter(Boolean).join(" · ");

    row.append(label, title, summary, source);
    target.appendChild(row);
  }
}

async function loadReport(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error("Nepodařilo se načíst " + path);
  return response.json();
}

function renderHistory(manifest, activeDate) {
  const target = byId("history-list");
  clear(target);
  for (const item of manifest.reports || []) {
    const row = document.createElement("div");
    row.className = "history-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = item.date === activeDate ? "history-button active" : "history-button";
    button.textContent = item.title;
    button.addEventListener("click", async () => {
      byId("report-date").textContent = "Načítám " + item.date + "...";
      const report = await loadReport(item.path);
      state.report = report;
      render(report, state.manifest);
    });

    const date = document.createElement("p");
    date.className = "muted";
    date.textContent = item.date;

    row.append(button, date);
    target.appendChild(row);
  }
}

function render(report, manifest) {
  byId("report-title").textContent = report.title;
  byId("report-date").textContent = report.dateLabel + " · aktualizováno " + report.generatedAtLocal;
  listItems(byId("summary-list"), report.summary);
  listItems(byId("actions-list"), report.recommendedActions);
  listItems(byId("risks-list"), report.risks);
  renderCalendar(report);
  renderNews(report);
  renderHistory(manifest, report.date);
}

async function load() {
  const manifestResponse = await fetch("data/manifest.json", { cache: "no-store" });
  if (!manifestResponse.ok) throw new Error("Nepodařilo se načíst manifest");
  const manifest = await manifestResponse.json();
  const report = await loadReport(manifest.latest || "data/latest.json");
  state.manifest = manifest;
  state.report = report;
  render(report, manifest);
}

load().catch((error) => {
  byId("report-title").textContent = "Dashboard se nepodařilo načíst";
  byId("report-date").textContent = String(error);
});
