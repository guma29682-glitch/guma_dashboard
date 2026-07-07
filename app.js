const state = {
  manifest: null,
  currentDate: null,
};

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Nepodarilo se nacist ${path}`);
  }
  return response.json();
}

function setText(id, value) {
  document.getElementById(id).textContent = value || "";
}

function renderList(items) {
  const list = document.createElement("ul");
  for (const item of items || []) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }
  return list;
}

function renderReport(report) {
  state.currentDate = report.date;
  setText("generatedAt", `Aktualizovano ${report.generated_at_label}`);
  setText("calendarStatus", report.status.calendar);
  setText("publishStatus", report.status.publishing);
  setText("priorityStatus", report.status.priority);
  setText("reportDate", report.date_label);
  setText("reportTitle", report.title);
  setText("reportSummary", report.summary);

  const sections = document.getElementById("sections");
  sections.replaceChildren();
  for (const section of report.sections) {
    const node = document.createElement("section");
    node.className = "section";
    const heading = document.createElement("h3");
    heading.textContent = section.title;
    if (section.risk) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = section.risk;
      heading.appendChild(tag);
    }
    node.appendChild(heading);
    node.appendChild(renderList(section.items));
    sections.appendChild(node);
  }

  for (const button of document.querySelectorAll("[data-report-date]")) {
    button.setAttribute("aria-current", String(button.dataset.reportDate === report.date));
  }
}

async function loadReport(entry) {
  const report = await fetchJson(entry.path);
  renderReport(report);
}

function renderHistory(manifest) {
  const history = document.getElementById("historyList");
  history.replaceChildren();
  for (const entry of manifest.reports) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.reportDate = entry.date;
    button.textContent = entry.label;
    button.addEventListener("click", () => loadReport(entry));
    history.appendChild(button);
  }
}

async function init() {
  try {
    const manifest = await fetchJson("data/manifest.json");
    state.manifest = manifest;
    renderHistory(manifest);
    await loadReport(manifest.reports[0]);
  } catch (error) {
    setText("reportTitle", "Dashboard se nepodarilo nacist");
    setText("reportSummary", error.message);
  }
}

init();
