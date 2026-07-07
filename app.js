const state = {
  manifest: null,
  report: null
};

const el = (id) => document.getElementById(id);

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Nepodařilo se načíst ${path}`);
  }
  return response.json();
}

function itemList(items, className = "list") {
  const list = document.createElement("ul");
  list.className = className;
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
  return list;
}

function renderSummary(report) {
  const root = el("summary");
  root.innerHTML = "";
  report.summary.forEach((text) => {
    const card = document.createElement("article");
    card.className = "summary-item";
    card.textContent = text;
    root.appendChild(card);
  });
}

function renderCalendar(calendar) {
  const root = el("calendar");
  root.innerHTML = "";

  const busy = document.createElement("p");
  busy.className = "callout";
  busy.textContent = calendar.busyEvents.length
    ? `${calendar.busyEvents.length} blokujících událostí`
    : "Žádné busy schůzky ani kolize.";
  root.appendChild(busy);

  if (calendar.transparentContext.length) {
    const heading = document.createElement("h3");
    heading.textContent = "Transparentní kontext";
    root.appendChild(heading);
    calendar.transparentContext.forEach((event) => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<strong>${event.title}</strong><span>${event.location}</span><p>${event.whyItMatters}</p>`;
      root.appendChild(row);
    });
  }
}

function renderSignals(signals) {
  const root = el("signals");
  root.innerHTML = "";
  signals.forEach((signal) => {
    const article = document.createElement("article");
    article.className = `signal severity-${signal.severity}`;
    article.innerHTML = `<div><span class="source">${signal.source}</span><h3>${signal.title}</h3></div><p>${signal.safeSummary}</p><p class="action">${signal.recommendedAction}</p>`;
    root.appendChild(article);
  });
}

function renderNews(news) {
  const root = el("news");
  root.innerHTML = "";
  news.forEach((item) => {
    const article = document.createElement("article");
    article.className = "news-item";
    article.innerHTML = `<span class="source">${item.category}</span><h3>${item.title}</h3><p>${item.safeSummary}</p><p class="muted">${item.source} · Akčnost: ${item.actionability}</p>`;
    root.appendChild(article);
  });
}

function renderSteps(steps) {
  const root = el("nextSteps");
  root.innerHTML = "";
  steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    root.appendChild(li);
  });
}

async function loadReport(path) {
  state.report = await fetchJson(path);
  el("reportTitle").textContent = state.report.title;
  el("reportDate").textContent = state.report.date;
  el("generatedAt").textContent = new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: state.report.timezone
  }).format(new Date(state.report.generatedAt));

  renderSummary(state.report);
  renderCalendar(state.report.calendar);
  renderSignals(state.report.signals);
  renderNews(state.report.news);
  renderSteps(state.report.nextSteps);
}

function renderHistory(manifest) {
  const root = el("historyList");
  root.innerHTML = "";
  manifest.reports.forEach((report) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = report.title;
    button.addEventListener("click", () => loadReport(report.path));
    root.appendChild(button);
  });
}

async function init() {
  try {
    state.manifest = await fetchJson("data/manifest.json");
    const latest = await fetchJson("data/latest.json");
    renderHistory(state.manifest);
    await loadReport(latest.latestReportPath);
  } catch (error) {
    el("reportTitle").textContent = "Dashboard se nepodařilo načíst";
    el("summary").appendChild(itemList([error.message], "error-list"));
  }
}

init();
