const $ = (selector) => document.querySelector(selector);

function list(items) {
  return (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function orderedList(items) {
  return (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Nepodařilo se načíst ${path}`);
  return response.json();
}

function renderReport(report) {
  $("#report-title").textContent = report.title;
  $("#doc-link").href = report.googleDoc?.url || "#";
  $("#summary").innerHTML = list(report.summary);
  $("#prep").innerHTML = list(report.prep);
  $("#risks").innerHTML = list(report.risks);
  $("#next-steps").innerHTML = orderedList(report.recommendedNextSteps);
  $("#name-days").innerHTML = list(report.nameDaysAndHolidays?.displayLines);
  $("#related").innerHTML = (report.relatedContext || report.privateContext || [])
    .map((item) => `
      <div class="context-row">
        <strong>${escapeHtml(item.source)}</strong>
        <span>${escapeHtml(item.signal)}</span>
      </div>
    `)
    .join("");

  const upcoming = (report.calendar?.upcoming || [])
    .map((event) => `
      <div class="event">
        <strong>${escapeHtml(event.time)}</strong>
        <span>${escapeHtml(event.title)}</span>
        <small>${escapeHtml(event.importance)}</small>
      </div>
    `)
    .join("");
  $("#calendar").innerHTML = `
    <p><strong>Kolize:</strong> ${(report.calendar?.conflicts || []).length ? "ano" : "žádné"}</p>
    <p><strong>Busy bloky:</strong> ${(report.calendar?.busyBlocks || []).length ? "ano" : "žádné"}</p>
    <div class="events">${upcoming}</div>
  `;

  const newsItems = report.newsWindow?.items || [];
  $("#news").innerHTML = newsItems
    .map((item) => `
      <article class="news-item">
        <p class="category">${escapeHtml(item.category)}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.whyItMatters)}</p>
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.source)}</a>
      </article>
    `)
    .join("");

  const minimum = report.newsWindow?.minimumItems || report.template?.newsMinimumItems;
  if (minimum && newsItems.length < minimum) {
    $("#news").insertAdjacentHTML(
      "beforeend",
      `<p class="warning">Pozor: dnešní snapshot má ${newsItems.length} novinek, minimum šablony je ${minimum}.</p>`
    );
  }
}

async function boot() {
  try {
    const manifest = await loadJson("data/manifest.json");
    const latest = await loadJson(manifest.latest || "data/latest.json");
    const report = await loadJson(latest.latestReport || manifest.reports[0].path);
    renderReport(report);

    $("#history").innerHTML = manifest.reports
      .map((entry) => `
        <button class="history-button" data-path="${escapeHtml(entry.path)}">
          <span>${escapeHtml(entry.date)}</span>
          <small>${escapeHtml(entry.title)}</small>
        </button>
      `)
      .join("");

    $("#history").addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-path]");
      if (!button) return;
      renderReport(await loadJson(button.dataset.path));
    });
  } catch (error) {
    $("#report-title").textContent = "Dashboard se nepodařilo načíst";
    $("#summary").innerHTML = `<li>${escapeHtml(error.message)}</li>`;
  }
}

boot();
