const PHONE = "51903477698";
const defaultMsg = "Hola, quiero info de streaming. ¿Me podrías pasar opciones y referencias?";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function normalize(s) {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function waLink(message) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
}

function inPages() {
  return location.pathname.includes("/pages/");
}
function dataUrl(filename) {
  return inPages() ? `../data/${filename}` : `./data/${filename}`;
}
function assetUrl(pathFromRootAssets) {
  // pathFromRootAssets ejemplo: "canva.svg" o "og-cover.png"
  return inPages() ? `../assets/${pathFromRootAssets}` : `./assets/${pathFromRootAssets}`;
}

/* ===== WhatsApp links ===== */
function setWhatsAppLinks() {
  const url = waLink(defaultMsg);
  ["btnWhatsAppTop","btnWhatsAppCard","btnWhatsAppRefs","btnWhatsAppBottom","btnWhatsAppPanel"].forEach((id)=>{
    const el = document.getElementById(id);
    if (el) el.href = url;
  });

  const float = document.getElementById("waFloat");
  if (float) float.href = url;
}

function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

/* ===== Menú móvil ===== */
function mobileMenu() {
  const btn = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const isOpen = !menu.hasAttribute("hidden");
    if (isOpen) {
      menu.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", "false");
    } else {
      menu.removeAttribute("hidden");
      btn.setAttribute("aria-expanded", "true");
    }
  });

  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      menu.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

/* ===== Copiar mensaje (referencias) ===== */
function copyMessage() {
  const btn = document.getElementById("copyBtn");
  const box = document.getElementById("msgBox");
  const ok = document.getElementById("copyOk");
  if (!btn || !box) return;

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(box.textContent.trim());
      if (ok) {
        ok.hidden = false;
        setTimeout(() => (ok.hidden = true), 1400);
      }
    } catch {
      alert("No se pudo copiar. Copia manualmente el texto.");
    }
  });
}

/* ===== Novedades ===== */
function formatDate(iso) {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

async function fetchPosts() {
  const res = await fetch(`${dataUrl("posts.json")}?v=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const posts = await res.json();
  if (!Array.isArray(posts)) return [];
  posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return posts;
}

async function loadPostsPage() {
  const grid = document.getElementById("postsGrid");
  if (!grid) return;

  try {
    const posts = await fetchPosts();

    grid.innerHTML = posts.map((p) => {
      const tag = escapeHtml(p.tag || "Novedad");
      const title = escapeHtml(p.title || "Actualización");
      const text = escapeHtml(p.text || "");
      const date = p.date ? escapeHtml(formatDate(p.date)) : "—";
      const ctaText = escapeHtml(p.cta_text || "Ver");
      const ctaUrl = escapeHtml(p.cta_url || "#");

      return `
        <article class="post">
          <div class="post-top">
            <span class="post-tag">${tag}</span>
            <span class="post-date">${date}</span>
          </div>
          <h3>${title}</h3>
          <p>${text}</p>
          <a class="btn soft" href="${ctaUrl}" target="_blank" rel="noreferrer">${ctaText}</a>
        </article>
      `;
    }).join("");
  } catch (e) {
    grid.innerHTML = `
      <article class="post">
        <div class="post-top"><span class="post-tag">Aviso</span><span class="post-date">—</span></div>
        <h3>No se pudo cargar Novedades</h3>
        <p>Revisa <b>data/posts.json</b>. Error: ${escapeHtml(e?.message || e)}</p>
      </article>
    `;
  }
}

/* ===== Banner automático (novedad más reciente) ===== */
async function loadTopBanner() {
  const banner = document.getElementById("topBanner");
  if (!banner) return;

  try {
    const posts = await fetchPosts();
    if (!posts.length) return;

    const p = posts[0];
    const tag = document.getElementById("bannerTag");
    const title = document.getElementById("bannerTitle");
    const cta = document.getElementById("bannerCta");

    if (tag) tag.textContent = p.tag || "Novedad";
    if (title) title.textContent = p.title || "Actualización";

    const url = p.cta_url || waLink(defaultMsg);
    const text = p.cta_text || "Ver";

    if (cta) {
      cta.textContent = text;
      cta.href = url;
    }

    banner.hidden = false;
  } catch {
    // si falla, no mostramos banner
  }
}

/* ===== Tienda (solo en tienda.html) ===== */
let STORE_ITEMS = [];
let storeCategory = "Todos";
let storeQuery = "";

function getCategories(items) {
  const set = new Set(items.map(x => x.category || "Otros"));
  return ["Todos", ...Array.from(set)];
}

function badgeClassFromText(badgeText){
  const t = normalize(badgeText || "");
  if (t.includes("oferta")) return "badge-offer";
  if (t.includes("nuevo")) return "badge-new";
  if (t.includes("promo")) return "badge-promo";
  return "badge-default";
}

function renderFilters(categories) {
  const el = document.getElementById("storeFilters");
  if (!el) return;

  el.innerHTML = categories.map((c) => {
    const active = c === storeCategory ? "filter active" : "filter";
    return `<button class="${active}" type="button" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
  }).join("");

  el.querySelectorAll("[data-cat]").forEach((b) => {
    b.addEventListener("click", () => {
      storeCategory = b.getAttribute("data-cat") || "Todos";
      renderFilters(categories);
      renderStore();
    });
  });
}

function applyStoreFilters(items) {
  let out = [...items];

  out.sort((a, b) => {
    const fa = Number(!!a.featured);
    const fb = Number(!!b.featured);
    if (fb !== fa) return fb - fa;
    const pa = Number(a.price_soles ?? 999999);
    const pb = Number(b.price_soles ?? 999999);
    return pa - pb;
  });

  if (storeCategory !== "Todos") {
    out = out.filter(x => (x.category || "Otros") === storeCategory);
  }

  if (storeQuery.trim()) {
    const q = normalize(storeQuery.trim());
    out = out.filter(x => {
      const blob = normalize(`${x.name || ""} ${x.desc || ""} ${x.badge || ""} ${x.category || ""} ${x.currency_label || ""} ${x.stock_label || ""}`);
      return blob.includes(q);
    });
  }

  return out;
}

function resolveStoreImage(img) {
  // img puede ser "canva.svg" o "crunchyroll.png" o "whatsapp.svg"
  // se resuelve a ./assets/... o ../assets/... según la página
  if (!img) return "";
  if (/^https?:\/\//i.test(img)) return img; // si fuese URL externa
  return assetUrl(img);
}

function renderStoreItem(p) {
  const name = escapeHtml(p.name || "Producto");
  const desc = escapeHtml(p.desc || "");
  const badge = escapeHtml(p.badge || "");
  const category = escapeHtml(p.category || "Otros");
  const stock = escapeHtml(p.stock_label || "");
  const img = escapeHtml(resolveStoreImage(p.image || ""));
  const priceLabel = escapeHtml(p.currency_label || "Consultar");

  const msg = p.message || `Hola, quiero comprar: ${p.name || "Producto"}`;
  const link = waLink(msg);

  const isFeatured = !!p.featured;
  const itemClass = isFeatured ? "store-item featured" : "store-item";
  const bClass = badgeClassFromText(p.badge);

  return `
    <article class="${itemClass}">
      ${isFeatured ? `<div class="ribbon">DESTACADO</div>` : ``}

      <div class="store-header">
        <div class="store-logo" aria-hidden="true">
          ${img ? `<img src="${img}" alt="" loading="lazy" />` : `<div class="store-logo-fallback"></div>`}
        </div>

        <div class="store-headtext">
          <div class="store-name">${name}</div>
          <div class="store-meta">
            ${badge ? `<span class="store-badge ${bClass}">${badge}</span>` : ``}
            <span class="store-cat">${category}</span>
            ${stock ? `<span class="store-stock">${stock}</span>` : ``}
          </div>
        </div>

        <div class="store-price big">${priceLabel}</div>
      </div>

      <div class="store-desc">${desc}</div>

      <a class="btn primary full" href="${link}" target="_blank" rel="noreferrer">
        Comprar por WhatsApp
      </a>
    </article>
  `;
}

function renderStore() {
  const grid = document.getElementById("storeGrid");
  if (!grid) return;
  const filtered = applyStoreFilters(STORE_ITEMS);

  grid.innerHTML = filtered.length
    ? filtered.map(renderStoreItem).join("")
    : `<article class="store-item"><div class="store-name">Sin resultados</div><div class="store-desc">Prueba otra categoría o cambia la búsqueda.</div></article>`;
}

function setupStoreSearch() {
  const input = document.getElementById("storeSearch");
  if (!input) return;

  input.addEventListener("input", () => {
    storeQuery = input.value || "";
    renderStore();
  });
}

async function loadStore() {
  const grid = document.getElementById("storeGrid");
  if (!grid) return;

  const debug = document.getElementById("storeDebug");

  try {
    const res = await fetch(`${dataUrl("store.json")}?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    STORE_ITEMS = Array.isArray(json) ? json : [];
    if (!STORE_ITEMS.length) throw new Error("store.json vacío o inválido");

    const cats = getCategories(STORE_ITEMS);
    renderFilters(cats);
    setupStoreSearch();
    renderStore();

    if (debug) { debug.hidden = true; debug.textContent = ""; }
  } catch (e) {
    grid.innerHTML = `
      <article class="store-item">
        <div class="store-name">Mini tienda no disponible</div>
        <div class="store-desc">No se pudo cargar <b>data/store.json</b>.</div>
        <a class="btn soft full" href="${waLink(defaultMsg)}" target="_blank" rel="noreferrer">
          Pedir opciones por WhatsApp
        </a>
      </article>
    `;
    if (debug) {
      debug.hidden = false;
      debug.textContent = `ERROR: ${String(e?.message || e)}`;
    }
  }
}

/* ===== Init ===== */
setWhatsAppLinks();
setYear();
mobileMenu();
copyMessage();
loadTopBanner();
loadPostsPage();
loadStore();
