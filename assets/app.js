const app = document.querySelector("#app");
const reportSelect = document.querySelector("#report-select");

const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const safeHref = (value = "") => {
  try {
    const url = new URL(String(value), window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? esc(url.href) : "";
  } catch {
    return "";
  }
};

const list = (items = []) => items.map((item) => {
  const title = esc(item.title || item);
  const href = item.url ? safeHref(item.url) : "";
  const heading = href
    ? `<a href="${href}" rel="noopener noreferrer"><strong>${title}</strong></a>`
    : `<strong>${title}</strong>`;
  return `<li>${heading}${item.detail ? `<span class="meta">${esc(item.detail)}</span>` : ""}</li>`;
}).join("");

function render(report) {
  const costs = report.costHunter;
  const newsItems = report.news?.items || [];
  const expectedNews = Number(report.newsMinimumItems || 0);
  const newsWarning = expectedNews && newsItems.length < expectedNews
    ? `<p class="status-note">Ověřených novinek je ${newsItems.length}; očekávané minimum je ${expectedNews}. ${esc(report.news.note || "")}</p>`
    : `<p class="status-note">${esc(report.news?.note || "")}</p>`;
  const rows = costs.products.map((item) => `
    <tr>
      <td><span class="status">${esc(item.status)}</span></td>
      <td><a href="${safeHref(item.productUrl)}" rel="noopener noreferrer">${esc(item.product)}</a></td>
      <td>${esc(item.store)}</td>
      <td>${esc(item.priceToday)}</td>
      <td>${esc(item.priceYesterday)}</td>
      <td>${esc(item.change)}</td>
      <td>${esc(item.note)}</td>
    </tr>`
  ).join("");

  app.innerHTML = `
    <section class="masthead">
      <div>
        <p class="eyebrow">Denní systémový update</p>
        <h1>${esc(report.title)}</h1>
      </div>
      <div class="freshness">${esc(report.updatedLabel)}<br>${esc(report.publicSafety)}</div>
    </section>

    <section class="signal-strip" aria-label="Hlavní signály">
      <div class="signal"><strong>${esc(report.signals.meetings)}</strong><span>schůzky a kolize</span></div>
      <div class="signal"><strong>${esc(report.signals.freeWindow)}</strong><span>nejdelší volné okno</span></div>
      <div class="signal"><strong>${esc(report.signals.newMail)}</strong><span>nový relevantní inbox</span></div>
      <div class="signal"><strong>${esc(report.signals.unknownPrices)}</strong><span>nezjištěné ceny</span></div>
    </section>

    <div class="content-grid">
      <div>
        <section class="section-block">
          <h2>Dnes</h2>
          <p class="lead">${esc(report.daySummary)}</p>
          <ul class="clean-list">${list(report.summaryItems)}</ul>
          <ul class="clean-list">${list(report.calendar.context)}</ul>
        </section>

        <section class="section-block">
          <h2>COST HUNTER</h2>
          <p class="lead">${esc(costs.summary)}</p>
          <p class="status-note">${esc(costs.freshnessNote)}</p>
          <div class="price-wrap">
            <table>
              <thead><tr><th>Status</th><th>Produkt</th><th>Obchod</th><th>Cena dnes</th><th>Cena včera</th><th>Změna</th><th>Poznámka jen při ≥10 %</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <p class="smallprint">${esc(costs.linkNote)}</p>
        </section>
      </div>

      <aside>
        <section class="section-block">
          <h2>Co připravit</h2>
          <ul class="clean-list">${list(report.prep)}</ul>
        </section>
        <section class="section-block">
          <h2>Podklady</h2>
          <ul class="clean-list">${list(report.context)}</ul>
        </section>
        <section class="section-block">
          <h2>Novinky</h2>
          ${newsWarning}
          <ul class="clean-list">${list(newsItems)}</ul>
        </section>
        <section class="section-block">
          <h2>Rizika</h2>
          <ul class="clean-list">${list(report.risks)}</ul>
        </section>
        <section class="section-block">
          <h2>Další kroky</h2>
          <ul class="clean-list">${list(report.nextSteps)}</ul>
        </section>
      </aside>
    </div>`;
}

async function loadReport(path) {
  app.innerHTML = '<section class="loading">Načítám update…</section>';
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    render(await response.json());
  } catch (error) {
    app.innerHTML = `<section class="error">Report se nepodařilo načíst. ${esc(error.message)}</section>`;
  }
}

async function boot() {
  try {
    const response = await fetch("data/manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();
    reportSelect.innerHTML = manifest.reports.map((item) =>
      `<option value="${esc(item.path)}">${esc(item.label)}</option>`
    ).join("");
    reportSelect.addEventListener("change", (event) => loadReport(event.target.value));
    await loadReport(manifest.latest);
  } catch (error) {
    app.innerHTML = `<section class="error">Manifest historie se nepodařilo načíst. ${esc(error.message)}</section>`;
  }
}

boot();
