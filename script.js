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

/* =========================
   WHATSAPP LINKS
========================= */
function initWhatsApp(){
  const url = waLink(DEFAULT_MSG);

  [
    "btnWhatsAppTop",
    "btnWhatsAppCard",
    "btnWhatsAppRefs",
    "btnWhatsAppBottom",
    "btnWhatsAppPanel",
    "waFloat"
  ].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.href = url;
  });
}

/* =========================
   MENÚ MÓVIL (FIX)
========================= */
function initMobileMenu(){
  const btn = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");

  if(!btn || !menu) return;

  btn.addEventListener("click", () => {
    const isOpen = !menu.hasAttribute("hidden");

    if(isOpen){
      menu.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", "false");
    } else {
      menu.removeAttribute("hidden");
      btn.setAttribute("aria-expanded", "true");
    }
  });

  // cerrar menú al hacer click en un link
  menu.querySelectorAll("a").forEach(link=>{
    link.addEventListener("click", ()=>{
      menu.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

/* =========================
   BANNER (NOVEDAD)
========================= */
async function initBanner(){
  const banner = document.getElementById("topBanner");
  if(!banner) return;

  const url = location.pathname.includes("/pages/")
    ? "../data/posts.json"
    : "./data/posts.json";

  try{
    const res = await fetch(url + "?v=" + Date.now());
    const posts = await res.json();

    if(!Array.isArray(posts) || posts.length === 0) return;

    const p = posts[0];
    banner.hidden = false;

    document.getElementById("bannerTag").textContent = p.tag || "Novedad";
    document.getElementById("bannerTitle").textContent = p.title || "";
    document.getElementById("bannerCta").href = p.cta_url || waLink(DEFAULT_MSG);
  }catch(e){
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
   INIT
========================= */
document.addEventListener("DOMContentLoaded", ()=>{
  initWhatsApp();
  initMobileMenu();   // <-- ESTE ERA EL PROBLEMA
  initBanner();
  initYear();
});
