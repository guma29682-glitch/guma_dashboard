async function json(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(path);
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function list(items) {
  return `<ul>${(items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function section(id, title, html) {
  document.getElementById(id).innerHTML = `<h2>${escapeHtml(title)}</h2>${html}`;
}

function render(report) {
  document.getElementById("title").textContent = report.title;
  document.getElementById("meta").textContent = `${report.generatedAt} | ${report.timezone}`;

  section("summary", "Shrnutí", list(report.summary));
  section(
    "meetings",
    "Schůzky",
    `<ul>${(report.meetings || [])
      .map(
        (meeting) =>
          `<li><strong>${escapeHtml(meeting.date)} ${escapeHtml(meeting.time)} - ${escapeHtml(meeting.title)}</strong><br><span class="item-meta">${escapeHtml(meeting.importance)}</span></li>`,
      )
      .join("")}</ul>`,
  );
  section("prep", "Co připravit", list(report.prep));
  section(
    "related",
    "Zprávy / dokumenty",
    `<ul>${(report.related || [])
      .map((item) => `<li><strong>${escapeHtml(item.source)}</strong>: ${escapeHtml(item.summary)}</li>`)
      .join("")}</ul>`,
  );

  const expected = report.news?.minimumExpectedItems ?? report.news?.newsMinimumItems ?? 0;
  const newsItems = report.news?.items || [];
  const lowCountWarning =
    expected && newsItems.length < expected
      ? `<p class="warn">Novinek je ${newsItems.length}, očekávané minimum je ${expected}. Nepřidávám starší nebo slabé položky jen kvůli počtu.</p>`
      : "";
  const explicitWarning = report.news?.warning ? `<p class="warn">${escapeHtml(report.news.warning)}</p>` : "";
  section(
    "news",
    "Novinky",
    explicitWarning +
      lowCountWarning +
      `<ul>${newsItems
        .map(
          (item) =>
            `<li><a href="${escapeHtml(item.url)}" rel="noopener">${escapeHtml(item.title)}</a><br><span class="item-meta">${escapeHtml(item.category)}</span><br>${escapeHtml(item.summary)}</li>`,
        )
        .join("")}</ul>`,
  );
  section("risks", "Rizika", list(report.risks));
  section("next", "Další kroky", list(report.nextSteps));
  section(
    "sources",
    "Zdroje a historie",
    list((report.sources || []).concat([`Google Doc: ${report.document?.url || "pending"}`])),
  );
}

async function init() {
  const manifest = await json("data/manifest.json");
  const select = document.getElementById("history");
  (manifest.reports || []).forEach((report) => {
    const option = document.createElement("option");
    option.value = report.path;
    option.textContent = `${report.date} - ${report.title}`;
    select.appendChild(option);
  });
  select.onchange = async () => render(await json(select.value));
  render(await json("data/latest.json"));
}

init().catch((error) => {
  document.body.innerHTML = `<pre>GUMA OS load error: ${escapeHtml(error.message)}</pre>`;
});
