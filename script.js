/* =========================
   CONFIG
========================= */
const PHONE = "51903477698";
const DEFAULT_MSG = "Hola, quiero información de streaming.";

/* =========================
   HELPERS
========================= */
function waLink(msg){
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
}
function safeText(v){ return (v ?? "").toString(); }

/* =========================
   WHATSAPP LINKS
========================= */
function initWhatsApp(){
  const url = waLink(DEFAULT_MSG);

  [
    "btnWhatsAppTop",
    "btnWhatsAppCard",
    "btnWhatsAppPanel",
    "btnWhatsAppRefs",
    "btnWhatsAppBottom",
    "waFloat"
  ].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.href = url;
  });
}

/* =========================
   BANNER (última novedad)
========================= */
async function initBanner(){
  const banner = document.getElementById("topBanner");
  if(!banner) return;

  const isPages = location.pathname.includes("/pages/");
  const url = isPages ? "../data/posts.json" : "./data/posts.json";

  try{
    const res = await fetch(url + "?v=" + Date.now());
    const posts = await res.json();

    if(!Array.isArray(posts) || posts.length === 0) return;

    // asume que posts[0] es el más reciente
    const p = posts[0];
    const tag = safeText(p.tag) || "Novedad";
    const title = safeText(p.title) || "";
    const ctaUrl = safeText(p.cta_url) || waLink(DEFAULT_MSG);

    banner.hidden = false;
    const elTag = document.getElementById("bannerTag");
    const elTitle = document.getElementById("bannerTitle");
    const elCta = document.getElementById("bannerCta");

    if(elTag) elTag.textContent = tag;
    if(elTitle) elTitle.textContent = title;
    if(elCta) elCta.href = ctaUrl;
  }catch(e){
    // Si falla, no mostramos banner
    console.warn("Banner no cargado:", e);
  }
}

/* =========================
   AÑO FOOTER
========================= */
function initYear(){
  const y = document.getElementById("year");
  if(y) y.textContent = new Date().getFullYear();
}

/* =========================
   NOVEDADES PAGE
   Render en #postsGrid si existe
========================= */
function renderPosts(posts){
  const grid = document.getElementById("postsGrid");
  if(!grid) return;

  if(!Array.isArray(posts) || posts.length === 0){
    grid.innerHTML = `<div class="box"><p>No hay novedades aún.</p></div>`;
    return;
  }

  grid.innerHTML = posts.map(p=>{
    const tag = safeText(p.tag) || "Novedad";
    const title = safeText(p.title) || "";
    const date = safeText(p.date) || "";
    const text = safeText(p.text) || "";
    const ctaText = safeText(p.cta_text) || "Ver";
    const ctaUrl = safeText(p.cta_url) || waLink(DEFAULT_MSG);

    return `
      <article class="post">
        <div class="post-top">
          <span class="post-tag">${tag}</span>
          <span class="post-date">${date}</span>
        </div>
        <h3>${title}</h3>
        <p>${text}</p>
        <a class="btn soft full" href="${ctaUrl}" target="_blank" rel="noreferrer">${ctaText}</a>
      </article>
    `;
  }).join("");
}

async function initPostsPage(){
  const grid = document.getElementById("postsGrid");
  if(!grid) return;

  const url = "../data/posts.json";
  try{
    const res = await fetch(url + "?v=" + Date.now());
    const posts = await res.json();
    renderPosts(posts);
  }catch(e){
    grid.innerHTML = `<div class="box"><p>Error cargando novedades.</p></div>`;
  }
}

/* =========================
   TIENDA PAGE
========================= */
function normalize(s){ return safeText(s).trim().toLowerCase(); }

function badgeClass(b){
  const x = normalize(b);
  if(x.includes("nuevo")) return "badge-new";
  if(x.includes("oferta")) return "badge-offer";
  if(x.includes("promo")) return "badge-promo";
  return "badge-default";
}

function renderStore(items, state){
  const grid = document.getElementById("storeGrid");
  if(!grid) return;

  let out = items.slice();

  // filtro por categoría
  const cat = normalize(state.category);
  if(cat && cat !== "todos"){
    out = out.filter(p => normalize(p.category) === cat);
  }

  // búsqueda
  const q = normalize(state.query);
  if(q){
    out = out.filter(p=>{
      const hay = normalize(p.name + " " + (p.desc||"") + " " + (p.category||""));
      return hay.includes(q);
    });
  }

  if(out.length === 0){
    grid.innerHTML = `<div class="box"><p>No hay resultados con esos filtros.</p></div>`;
    return;
  }

  grid.innerHTML = out.map(p=>{
    const name = safeText(p.name);
    const desc = safeText(p.desc);
    const badge = safeText(p.badge || "");
    const stock = safeText(p.stock_label || "");
    const catLabel = safeText(p.category || "");
    const priceLabel = safeText(p.currency_label || "");
    const featured = !!p.featured;
    const ribbon = safeText(p.ribbon || "");
    const msg = safeText(p.message || `Hola, quiero ${name}.`);
    const img = safeText(p.image || "");

    const imageHtml = img
      ? `<img src="${img}" alt="${name}" onerror="this.style.display='none'; this.parentElement.querySelector('.store-logo-fallback').style.display='block';">`
      : "";

    return `
      <article class="store-item ${featured ? "featured" : ""}">
        ${ribbon ? `<div class="ribbon">${ribbon}</div>` : ""}
        <div class="store-header">
          <div class="store-logo">
            ${imageHtml}
            <div class="store-logo-fallback" style="display:${img ? "none" : "block"}"></div>
          </div>

          <div class="store-headtext">
            <div class="store-name">${name}</div>
            <div class="store-meta">
              ${badge ? `<span class="store-badge ${badgeClass(badge)}">${badge}</span>` : ""}
              ${catLabel ? `<span class="store-badge badge-default">${catLabel}</span>` : ""}
              ${stock ? `<span class="store-stock">${stock}</span>` : ""}
            </div>
          </div>

          ${priceLabel ? `<div class="store-price">${priceLabel}</div>` : ""}
        </div>

        ${desc ? `<p class="store-desc">${desc}</p>` : ""}

        <a class="btn primary full" href="${waLink(msg)}" target="_blank" rel="noreferrer">
          Comprar por WhatsApp
        </a>
      </article>
    `;
  }).join("");
}

async function initStorePage(){
  const grid = document.getElementById("storeGrid");
  if(!grid) return;

  const state = { category: "Todos", query: "" };
  const url = "../data/store.json";

  let items = [];
  const errorBox = document.getElementById("storeError");
  try{
    const res = await fetch(url + "?v=" + Date.now());
    items = await res.json();
    if(!Array.isArray(items)) items = [];
  }catch(e){
    if(errorBox){
      errorBox.textContent = "ERROR: No se pudo cargar data/store.json";
      errorBox.style.display = "block";
    }
    grid.innerHTML = `<div class="box"><p>No se pudo cargar la mini tienda.</p></div>`;
    return;
  }

  // filtros
  const filterBtns = document.querySelectorAll("[data-filter]");
  filterBtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      filterBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      state.category = btn.getAttribute("data-filter") || "Todos";
      renderStore(items, state);
    });
  });

  // search
  const search = document.getElementById("storeSearch");
  if(search){
    search.addEventListener("input", ()=>{
      state.query = search.value || "";
      renderStore(items, state);
    });
  }

  renderStore(items, state);
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", ()=>{
  initWhatsApp();
  initBanner();
  initYear();
  initPostsPage();
  initStorePage();
});
