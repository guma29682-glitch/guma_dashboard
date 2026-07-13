const state = {
  manifest: null
};

async function getJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Nelze nacist ${path}`);
  return response.json();
}

function list(target, items) {
  target.innerHTML = "";
  for (const item of items || []) {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  }
}

function renderCalendar(report) {
  const target = document.getElementById("calendar");
  const events = report.calendar?.upcoming || [];
  const conflicts = report.calendar?.conflicts || [];
  const free = report.calendar?.freeWindows || [];

  target.innerHTML = "";
  for (const event of events) {
    const item = document.createElement("div");
    item.className = "event";
    item.innerHTML = `<span class="badge">${event.time} · ${event.type}</span><h3>${event.title}</h3><p>${event.whyItMatters}</p>`;
    target.appendChild(item);
  }

  const note = document.createElement("p");
  note.className = "muted";
  note.textContent = conflicts.length ? `Kolize: ${conflicts.join(", ")}` : `Bez zjevnych kolizi. ${free.join(" ")}`;
  target.appendChild(note);
}

function renderNews(report) {
  const target = document.getElementById("news");
  target.innerHTML = "";
  for (const entry of report.news || []) {
    const item = document.createElement("div");
    item.className = "news-item";
    item.innerHTML = `<span class="badge">${entry.category}</span><h3><a href="${entry.url}" rel="noopener noreferrer">${entry.title}</a></h3><p>${entry.summary}</p>`;
    target.appendChild(item);
  }
}

async function loadReport(path) {
  const report = await getJson(path);
  document.getElementById("report-title").textContent = report.title;
  document.getElementById("report-meta").textContent = `${report.date} · ${report.timezone} · ${report.generatedAt}`;
  list(document.getElementById("summary"), report.summary);
  list(document.getElementById("risks"), report.risks);
  list(document.getElementById("next-steps"), report.nextSteps);
  renderCalendar(report);
  renderNews(report);
}

async function init() {
  state.manifest = await getJson("data/manifest.json");
  const latest = await getJson("data/latest.json");
  const select = document.getElementById("history");

  for (const report of state.manifest.reports) {
    const option = document.createElement("option");
    option.value = report.path;
    option.textContent = report.title;
    option.selected = report.id === latest.latestReport;
    select.appendChild(option);
  }

  select.addEventListener("change", () => loadReport(select.value));
  await loadReport(latest.path);
}

init().catch((error) => {
  document.getElementById("report-title").textContent = "Dashboard se nepodarilo nacist";
  document.getElementById("report-meta").textContent = error.message;
});
