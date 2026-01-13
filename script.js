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
   NOVEDADES PRO (Feed + filtros + buscar + ver más + pinned + HOY)
========================= */
function parseDateISO(s){
  // espera YYYY-MM-DD
  const t = (s || "").trim();
  // Date.UTC evita cambios raros por zona
  const [y,m,d] = t.split("-").map(n=>parseInt(n,10));
  if(!y || !m || !d) return 0;
  return Date.UTC(y, m-1, d);
}

function isTodayISO(s){
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,"0");
  const d = String(now.getDate()).padStart(2,"0");
  return (s || "") === `${y}-${m}-${d}`;
}

function sortPosts(posts){
  return posts.slice().sort((a,b)=>{
    const ap = !!a.pinned;
    const bp = !!b.pinned;
    if(ap !== bp) return bp - ap; // pinned primero
    return parseDateISO(b.date) - parseDateISO(a.date); // más nuevo primero
  });
}

function uniqueTags(posts){
  const tags = new Set();
  posts.forEach(p=>{
    const t = (p.tag || "").trim();
    if(t) tags.add(t);
  });
  return Array.from(tags);
}

function renderFilterChips(posts, state){
  const wrap = document.getElementById("newsFilters");
  if(!wrap) return;

  const tags = uniqueTags(posts);
  const all = ["Todos", ...tags];

  wrap.innerHTML = all.map(t=>{
    const active = (state.tag === t) ? "active" : "";
    return `<button type="button" class="chip ${active}" data-news-tag="${t}">${t}</button>`;
  }).join("");

  wrap.querySelectorAll("[data-news-tag]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      wrap.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      state.tag = btn.getAttribute("data-news-tag") || "Todos";
      state.page = 1;
      renderPostsPro(posts, state);
    });
  });
}

function cardHTML(p){
  const tag = (p.tag || "Novedad").toString();
  const title = (p.title || "").toString();
  const text = (p.text || "").toString();
  const date = (p.date || "").toString();
  const ctaText = (p.cta_text || "Ver").toString();
  const ctaUrl = (p.cta_url || "").toString();
  const img = (p.image || "").toString();
  const pinned = !!p.pinned;
  const today = isTodayISO(date);

  return `
    <article class="post-pro ${pinned ? "featured" : ""}">
      ${img ? `
        <div class="post-media">
          <img src="${img}" alt="${title || "Novedad"}" loading="lazy">
        </div>
      ` : ""}

      <div class="post-body">
        <div class="post-topline">
          <div class="post-tags">
            <span class="post-tag">${tag}</span>
            ${today ? `<span class="post-today">HOY</span>` : ""}
            ${pinned ? `<span class="post-today">FIJADO</span>` : ""}
          </div>
          <span class="post-date">${date}</span>
        </div>

        <h3>${title}</h3>
        <p>${text}</p>

        <div class="post-actions">
          ${ctaUrl ? `<a class="btn primary" href="${ctaUrl}" target="_blank" rel="noreferrer">${ctaText}</a>` : ""}
          <a class="btn soft" href="../pages/tienda.html">Ver tienda</a>
        </div>
      </div>
    </article>
  `;
}

function applyFilters(posts, state){
  let out = posts.slice();

  // tag
  if(state.tag && state.tag !== "Todos"){
    out = out.filter(p => (p.tag || "").trim() === state.tag);
  }

  // search
  const q = (state.query || "").trim().toLowerCase();
  if(q){
    out = out.filter(p=>{
      const hay = `${p.title||""} ${p.text||""} ${p.tag||""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  return out;
}

function renderPostsPro(posts, state){
  const grid = document.getElementById("postsGrid");
  const btnMore = document.getElementById("postsMore");
  const empty = document.getElementById("postsEmpty");
  if(!grid) return;

  const filtered = applyFilters(posts, state);

  const pageSize = state.pageSize;
  const visibleCount = state.page * pageSize;
  const visible = filtered.slice(0, visibleCount);

  grid.innerHTML = visible.map(cardHTML).join("");

  // empty state
  if(empty){
    empty.style.display = (filtered.length === 0) ? "block" : "none";
  }

  // ver más
  if(btnMore){
    const hasMore = filtered.length > visibleCount;
    btnMore.style.display = hasMore ? "inline-flex" : "none";
  }
}

async function initPostsPage(){
  const grid = document.getElementById("postsGrid");
  if(!grid) return;

  const url = "../data/posts.json";
  const state = {
    tag: "Todos",
    query: "",
    page: 1,
    pageSize: 12
  };

  let posts = [];
  try{
    const res = await fetch(url + "?v=" + Date.now());
    posts = await res.json();
    if(!Array.isArray(posts)) posts = [];
  }catch(e){
    grid.innerHTML = `<div class="box"><p>Error cargando novedades.</p></div>`;
    const btnMore = document.getElementById("postsMore");
    if(btnMore) btnMore.style.display = "none";
    return;
  }

  posts = sortPosts(posts);

  // chips
  renderFilterChips(posts, state);

  // search
  const search = document.getElementById("newsSearch");
  if(search){
    search.addEventListener("input", ()=>{
      state.query = search.value || "";
      state.page = 1;
      renderPostsPro(posts, state);
    });
  }

  // ver más
  const btnMore = document.getElementById("postsMore");
  if(btnMore){
    btnMore.addEventListener("click", ()=>{
      state.page += 1;
      renderPostsPro(posts, state);
    });
  }

  renderPostsPro(posts, state);
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
  initReferencesLightbox(); // ✅ zoom referencias
});
/* =========================
   LIGHTBOX REFERENCIAS
========================= */
function initReferencesLightbox(){
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbClose = document.getElementById("lightboxClose");
  if(!lb || !lbImg || !lbClose) return;

  // Todas las imágenes dentro de la grilla de referencias
  const imgs = document.querySelectorAll(".refs-grid img");
  if(!imgs || imgs.length === 0) return;

  function open(src, alt){
    lbImg.src = src;
    lbImg.alt = alt || "Referencia ampliada";
    lb.hidden = false;
    document.body.style.overflow = "hidden"; // evita scroll en móvil
  }

  function close(){
    lb.hidden = true;
    lbImg.src = "";
    document.body.style.overflow = "";
  }

  imgs.forEach(img=>{
    img.style.cursor = "zoom-in";
    img.addEventListener("click", ()=> open(img.src, img.alt));
  });

  lbClose.addEventListener("click", close);

  // Cerrar tocando el fondo
  lb.addEventListener("click", (e)=>{
    if(e.target === lb) close();
  });

  // Cerrar con ESC
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape" && !lb.hidden) close();
  });
}


