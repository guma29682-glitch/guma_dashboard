const state = {
  report: null,
  manifest: null
};

const text = (selector, value) => {
  document.querySelector(selector).textContent = value || "";
};

const list = (selector, items, ordered = false) => {
  const node = document.querySelector(selector);
  node.innerHTML = "";
  for (const item of items || []) {
    const li = document.createElement("li");
    li.textContent = item;
    node.appendChild(li);
  }
};

const itemBlock = (title, body, url) => {
  const wrap = document.createElement("div");
  wrap.className = "item";
  const h3 = document.createElement("h3");
  h3.textContent = title;
  const p = document.createElement("p");
  p.textContent = body;
  wrap.append(h3, p);
  if (url) {
    const a = document.createElement("a");
    a.href = url;
    a.textContent = "Zdroj";
    a.rel = "noopener noreferrer";
    wrap.appendChild(a);
  }
  return wrap;
};

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Cannot load ${path}`);
  return response.json();
}

async function loadReport(path) {
  const report = await loadJson(path);
  state.report = report;
  renderReport(report);
}

function renderReport(report) {
  text("#title", report.title);
  text("#generated", new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: report.timezone || "Europe/Prague"
  }).format(new Date(report.generatedAt)));
  list("#summary", report.summary);
  text("#day-shape", report.calendar?.dayShape);
  list("#steps", report.recommendedNextSteps, true);
  list("#risks", report.risks);

  const events = document.querySelector("#events");
  events.innerHTML = "";
  for (const event of report.calendar?.events || []) {
    events.appendChild(itemBlock(event.title, `${event.timeLabel}: ${event.importance}`));
  }

  const news = document.querySelector("#news");
  news.innerHTML = "";
  for (const entry of report.news || []) {
    news.appendChild(itemBlock(entry.category, `${entry.summary} ${entry.whyItMatters}`, entry.url));
  }

  const signals = document.querySelector("#signals");
  signals.innerHTML = "";
  for (const group of Object.values(report.signals || {})) {
    for (const signal of group) {
      signals.appendChild(itemBlock(signal.label, `${signal.summary} Akce: ${signal.action}`));
    }
  }
}

function renderHistory(manifest) {
  const history = document.querySelector("#history");
  history.innerHTML = "";
  for (const entry of manifest.reports || []) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "item history-button";
    button.textContent = `${entry.date} - ${entry.title}`;
    button.addEventListener("click", () => loadReport(entry.path));
    history.appendChild(button);
  }
}

async function boot() {
  const latest = await loadJson("data/latest.json");
  const manifest = await loadJson("data/manifest.json");
  state.manifest = manifest;
  await loadReport(latest.reportPath);
  renderHistory(manifest);
}

boot().catch((error) => {
  text("#title", "Dashboard se nepodařilo načíst");
  text("#day-shape", error.message);
});
