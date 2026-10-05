const DEFAULT_API = "http://localhost:3400";

const $ = (id) => document.getElementById(id);
const show = (id) => {
  for (const pane of ["idle", "busy", "result", "failed"]) $(pane).hidden = pane !== id;
};

const STAGES = [
  "Reading the page",
  "Collecting the photographs",
  "Reverse image searching every photo",
  "Still searching. This step drives a real search engine",
  "Weighing up the findings",
];

let stageTimer = null;

async function apiBase() {
  const { apiBase } = await chrome.storage.sync.get("apiBase");
  return (apiBase || DEFAULT_API).replace(/\/$/, "");
}

/* ── Settings ─────────────────────────────────────────────────────────── */
$("settings-toggle").addEventListener("click", async () => {
  const panel = $("settings");
  panel.hidden = !panel.hidden;
  if (!panel.hidden) $("api-base").value = await apiBase();
});

$("api-base").addEventListener("change", (e) => {
  chrome.storage.sync.set({ apiBase: e.target.value.trim() });
});

/* ── Which page are we on ─────────────────────────────────────────────── */
async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

currentTab().then((tab) => {
  if (!tab?.url) return;
  try {
    $("page-host").textContent = `This tab: ${new URL(tab.url).host}`;
  } catch {
    /* internal pages have no useful host */
  }
});

/* ── Scan ─────────────────────────────────────────────────────────────── */
async function scan() {
  const tab = await currentTab();
  if (!tab?.id || !/^https?:/.test(tab.url ?? "")) {
    return fail("Open a rental listing in this tab first.");
  }

  show("busy");
  let step = 0;
  $("stage").textContent = STAGES[0];
  stageTimer = setInterval(() => {
    step = Math.min(step + 1, STAGES.length - 1);
    $("stage").textContent = STAGES[step];
  }, 9000);

  try {
    // Read the DOM in the page itself. This is what gets past portals that
    // refuse requests coming from a server.
    const [{ result: scraped }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["scrape.js"],
    });

    if (!scraped?.images?.length) {
      return fail("No usable photographs found on this page.");
    }

    const base = await apiBase();
    const res = await fetch(`${base}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scraped }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
    render(json, base);
  } catch (e) {
    const msg = String(e?.message ?? e);
    fail(
      /Failed to fetch|NetworkError/i.test(msg)
        ? `Could not reach the app at ${await apiBase()}. Set the address with the gear icon.`
        : msg
    );
  } finally {
    clearInterval(stageTimer);
  }
}

function fail(message) {
  clearInterval(stageTimer);
  $("error-text").textContent = message;
  show("failed");
}

/* ── Render ───────────────────────────────────────────────────────────── */
const COLOUR = {
  "almost certainly a scam": "var(--danger)",
  "high risk": "var(--danger)",
  "worth checking": "var(--warn)",
  "looks clean": "var(--safe)",
};

function render(data, base) {
  const { verdict, matches, listing } = data;
  const colour = COLOUR[verdict.band] ?? "var(--muted)";

  $("verdict").innerHTML = `
    <div class="score">
      <b style="color:${colour}">${verdict.score}</b>
      <span style="color:${colour}">${esc(verdict.band)}</span>
    </div>
    <p class="headline">${esc(verdict.headline)}</p>`;

  $("findings").innerHTML = verdict.findings
    .map(
      (f) => `
      <div class="finding">
        <div class="finding-top">
          <span class="tag ${f.level}">${esc(f.level)}</span>
          <span class="finding-label">${esc(f.label)}</span>
        </div>
        <p class="finding-detail">${esc(f.detail)}</p>
      </div>`
    )
    .join("");

  // Only the pages that disagree are worth the popup's limited room.
  const conflicting = matches
    .flatMap((m) => m.elsewhere)
    .filter((e) => e.concern !== "none")
    .sort((a, b) => (b.concern === "high" ? 1 : 0) - (a.concern === "high" ? 1 : 0))
    .slice(0, 5);

  $("matches").innerHTML = conflicting.length
    ? `<h3 class="section">Pages that disagree</h3>` +
      conflicting
        .map(
          (e) => `
        <div class="match">
          ${
            e.url
              ? `<a href="${esc(e.url)}" target="_blank" rel="noreferrer">${esc(e.title.slice(0, 80))}</a>`
              : `<span class="title">${esc(e.title.slice(0, 80))}</span>`
          }
          <p class="host">${esc(e.host)}${e.url ? "" : " (no direct link)"}</p>
          <ul>${e.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
        </div>`
        )
        .join("")
    : "";

  const full = new URL(base);
  full.searchParams.set("url", listing.url || "");
  $("open-full").href = full.toString();
  show("result");
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

$("scan").addEventListener("click", scan);
$("retry").addEventListener("click", () => show("idle"));
