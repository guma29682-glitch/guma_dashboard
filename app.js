const manifestUrl = "data/manifest.json";

const sections = {
  summary: document.querySelector("#summary"),
  products: document.querySelector("#products"),
  meetings: document.querySelector("#meetings"),
  prep: document.querySelector("#prep"),
  related: document.querySelector("#related"),
  news: document.querySelector("#news"),
  risks: document.querySelector("#risks"),
  nextSteps: document.querySelector("#nextSteps")
};

const historySelect = document.querySelector("#history");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeUrl(value) {
  const url = String(value || "");
  return /^https?:\/\//.test(url) ? url : "";
}

function list(title, items) {
  const rows = (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  if (!rows) return "";
  return `<h2>${escapeHtml(title)}</h2><ul class="list">${rows}</ul>`;
}

function cards(title, items, renderItem) {
  const rows = (items || []).map((item) => `<article class="item">${renderItem(item)}</article>`).join("");
  if (!rows) return "";
  return `<h2>${escapeHtml(title)}</h2><div class="cards">${rows}</div>`;
}

function productTable(items, summaryText) {
  if (!items || items.length === 0) return "";
  const summary = summaryText ? `<p class="meta">${escapeHtml(summaryText)}</p>` : "";
  const rows = items.map((item) => `
    <tr>
      <td>${escapeHtml(item.status ?? item.id ?? "")}</td>
      <td>${safeUrl(item.productUrl) ? `<a href="${escapeHtml(safeUrl(item.productUrl))}">${escapeHtml(item.product ?? item.name)}</a>` : escapeHtml(item.product ?? item.name)}</td>
      <td>${escapeHtml(item.store)}</td>
      <td>${escapeHtml(item.priceToday)}</td>
      <td>${escapeHtml(item.priceYesterday)}</td>
      <td>${escapeHtml(item.change ?? item.sale ?? "")}</td>
      <td>${escapeHtml(item.note ?? "")}</td>
    </tr>
  `).join("");
  return `<h2>COST HUNTER - sledovane ceny</h2>${summary}
    <div class="table-wrap">
      <table>
        <thead><tr><th>Status</th><th>Produkt</th><th>Obchod</th><th>Cena dnes</th><th>Cena vcera</th><th>Zmena</th><th>Poznamka jen pri &gt;=10 %</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderReport(report) {
  document.querySelector("#title").textContent = report.title;
  document.querySelector("#meta").textContent = `${report.generatedAt} | ${report.timezone}`;

  sections.summary.innerHTML = list("Kratke shrnuti dne", report.summary);
  sections.products.innerHTML = productTable(report.productPrices, report.productPriceSummary);
  sections.meetings.innerHTML = cards("Nadchazejici schuzky a proc jsou dulezite", report.calendar?.meetings, (meeting) => `
    <h3>${escapeHtml(meeting.title)}</h3>
    <p class="meta">${escapeHtml(meeting.start)} -> ${escapeHtml(meeting.end)} | ${escapeHtml(meeting.transparency)}</p>
    <p>${escapeHtml(meeting.whyItMatters)}</p>
  `);
  sections.prep.innerHTML = list("Co si k nim pripravit", report.prep);
  sections.related.innerHTML = cards("Dulezite souvisejici zpravy, e-maily nebo dokumenty", report.relatedContext, (item) => `
    <h3>${escapeHtml(item.source)} <span class="tag">${escapeHtml(item.label)}</span></h3>
    <p>${escapeHtml(item.summary)}</p>
  `);

  const news = report.news || {};
  const warning = news.warning ? `<p class="meta">${escapeHtml(news.warning)}</p>` : "";
  sections.news.innerHTML = `<h2>Novinky</h2>${warning}<div class="cards">${(news.items || []).map((item, index) => `
    <article class="item">
      <span class="tag">${index + 1}. ${escapeHtml(item.category)}</span>
      <h3><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></h3>
      <p>${escapeHtml(item.summary)}</p>
    </article>
  `).join("")}</div>`;

  sections.risks.innerHTML = list("Rizika, kolize nebo nejasnosti", report.risks);
  sections.nextSteps.innerHTML = list("Doporucene dalsi kroky", report.nextSteps);
}

async function loadReport(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Nepodarilo se nacist ${url}`);
  renderReport(await response.json());
}

async function init() {
  const manifestResponse = await fetch(manifestUrl);
  const manifest = await manifestResponse.json();
  const reports = manifest.reports || [];

  historySelect.innerHTML = reports
    .map((report) => `<option value="${escapeHtml(report.url)}">${escapeHtml(report.title)}</option>`)
    .join("");
  historySelect.addEventListener("change", () => loadReport(historySelect.value));

  await loadReport(manifest.latest || reports[0]?.url);
}

init().catch((error) => {
  document.querySelector("#title").textContent = "Dashboard se nepodarilo nacist";
  document.querySelector("#meta").textContent = error.message;
});
