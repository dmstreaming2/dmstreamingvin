const PHONE = "51903477698";
const DEFAULT_MSG = "Hola, quiero información de streaming";

function waLink(msg){
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
}

document.querySelectorAll("#waFloat").forEach(b=>{
  b.href = waLink(DEFAULT_MSG);
});

async function fetchJSON(path){
  const res = await fetch(path + "?v=" + Date.now());
  return res.json();
}

/* BANNER */
async function loadBanner(){
  const banner = document.getElementById("topBanner");
  if(!banner) return;

  const posts = await fetchJSON(
    location.pathname.includes("/pages/")
      ? "../data/posts.json"
      : "./data/posts.json"
  );

  if(!posts.length) return;

  banner.hidden = false;
  document.getElementById("bannerTag").textContent = posts[0].tag;
  document.getElementById("bannerTitle").textContent = posts[0].title;
  document.getElementById("bannerCta").href = posts[0].cta_url;
}

/* TIENDA */
async function loadStore(){
  const grid = document.getElementById("storeGrid");
  if(!grid) return;

  const data = await fetchJSON("../data/store.json");

  grid.innerHTML = data.map(p=>`
    <div class="store-item">
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <b>${p.currency_label}</b>
      <a class="btn primary" target="_blank" href="${waLink(p.message)}">
        Comprar
      </a>
    </div>
  `).join("");
}

loadBanner();
loadStore();
