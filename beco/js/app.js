const WHATSAPP_PHONE = "5511969784382";

let CATALOG = [];
let currentFilter = "todos";
let searchQuery = "";
let chosenSizes = {};
let cart = [];

const fmtBRL = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function setSize(id, size) {
  chosenSizes[id] = size;
  renderAll();
}

function openImageZoom(src, alt) {
  const modal = document.getElementById("imageZoom");
  const image = document.getElementById("zoomedImage");
  image.src = src;
  image.alt = alt || "Imagem ampliada do produto";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("zoom-open");
}

function closeImageZoom(event) {
  if (event && event.target.id === "zoomedImage") return;
  const modal = document.getElementById("imageZoom");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("zoom-open");
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeImageZoom();
});

function cardHTML(item) {
  const size = chosenSizes[item.id] || "M";
  const off = Math.round(((item.oldPrice - item.pixPrice) / item.oldPrice) * 100);
  const inst = (item.pixPrice * 1.06) / 6;

  return `
    <article class="product-card">
      <div class="product-badges">
        <span class="badge-flag">${item.flag}</span>
        <span class="badge-discount">-${off}%</span>
      </div>
      <div class="product-media">
        <button class="product-zoom-button" type="button"
                onclick="openImageZoom('${encodeURI(item.img)}', '${item.name.replace(/'/g, "\\'")}')"
                aria-label="Ampliar imagem de ${item.name}">
          <img
            src="${encodeURI(item.img)}"
            alt="${item.name}"
            loading="lazy"
            onerror="this.onerror=null; this.src='assets/logo-original.jpeg';"
          >
          <span class="zoom-hint">⌕ Ampliar foto</span>
        </button>
      </div>
      <div class="product-body">
        <h3 class="product-name">${item.name}</h3>
        <div class="price-compare">De ${fmtBRL(item.oldPrice)}</div>
        <div class="price-pix">${fmtBRL(item.pixPrice)} <span>no Pix</span></div>
        <div class="price-installment">ou 6x de ${fmtBRL(inst)}</div>
        <div class="size-row">
          ${["P", "M", "G", "GG"].map(s => `
            <button type="button" class="size-chip ${size === s ? "active" : ""}" onclick="setSize(${item.id}, '${s}')">${s}</button>
          `).join("")}
        </div>
        <button type="button" class="btn-add" onclick="addItem(${item.id})">Adicionar ao Carrinho</button>
      </div>
    </article>
  `;
}

function renderAll() {
  const matches = CATALOG.filter(item => {
    const matchTab = currentFilter === "todos" || item.section === currentFilter || item.flag.toLowerCase().includes(currentFilter);
    const matchText = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchText;
  });

  const ofertas = matches.filter(i => i.section === "ofertas");
  const lancamentos = matches.filter(i => i.section !== "ofertas");

  document.getElementById("offersSection").style.display = ofertas.length ? "block" : "none";
  document.getElementById("offersGrid").innerHTML = ofertas.map(cardHTML).join("");

  document.getElementById("catalogTitleText").textContent = currentFilter === "todos" ? "Catálogo Completo" : `Filtrado: ${currentFilter}`;
  document.getElementById("catalogGrid").innerHTML =
    lancamentos.map(cardHTML).join("");
}

function addItem(id) {
  const prod = CATALOG.find(p => p.id === id);
  if (!prod) return;
  const size = chosenSizes[id] || "M";
  const found = cart.find(c => c.id === id && c.size === size);
  if (found) found.qty += 1;
  else cart.push({ ...prod, size, qty: 1 });
  syncCart();
  toggleDrawer(true);
}

function changeItemQty(idx, delta) {
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  syncCart();
}

function syncCart() {
  const count = cart.reduce((acc, i) => acc + i.qty, 0);
  const total = cart.reduce((acc, i) => acc + i.pixPrice * i.qty, 0);
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent = fmtBRL(total);

  const box = document.getElementById("cartList");
  if (!cart.length) {
    box.innerHTML = `<p style="color:#6b7280;text-align:center;margin-top:32px;">Seu carrinho está vazio.</p>`;
    return;
  }

  box.innerHTML = cart.map((item, idx) => `
    <div class="cart-row">
      <img src="${encodeURI(item.img)}" alt="${item.name}" onerror="this.onerror=null; this.src='assets/logo-original.jpeg';">
      <div style="flex:1">
        <div style="font-weight:700;font-size:0.86rem;">${item.name}</div>
        <div style="font-size:0.76rem;color:#6b7280;">Tam: <strong>${item.size}</strong> • ${fmtBRL(item.pixPrice)}</div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:6px;">
          <button type="button" onclick="changeItemQty(${idx}, -1)" style="width:22px;height:22px;cursor:pointer;">-</button>
          <span>${item.qty}</span>
          <button type="button" onclick="changeItemQty(${idx}, 1)" style="width:22px;height:22px;cursor:pointer;">+</button>
        </div>
      </div>
    </div>
  `).join("");
}

function toggleDrawer(force = null) {
  const drawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  const open = force !== null ? force : !drawer.classList.contains("open");
  drawer.classList.toggle("open", open);
  backdrop.classList.toggle("open", open);
}

function sendWhatsApp() {
  if (!cart.length) return alert("Adicione ao menos um item ao carrinho.");
  const total = cart.reduce((acc, i) => acc + i.pixPrice * i.qty, 0);
  let msg = "Olá! Quero finalizar meu pedido na *Beco Fitness Esporte Clube*:\n\n";
  cart.forEach(i => {
    msg += `• ${i.qty}x ${i.name} (Tam: *${i.size}*) — ${fmtBRL(i.pixPrice * i.qty)}\n`;
  });
  msg += `\n*Total no Pix:* ${fmtBRL(total)}`;
  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
}

document.querySelectorAll(".nav-pill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderAll();
  });
});

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderAll();
});

const offerDeadline = new Date(2026, 11, 3, 23, 59, 0);

function updateOfferTimer() {
  const timer = document.getElementById("offerTimer");
  if (!timer) return;

  const remaining = Math.max(0, offerDeadline.getTime() - Date.now());

  if (remaining === 0) {
    timer.textContent = "OFERTA ENCERRADA";
    return;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");

  timer.textContent = `${h}h : ${m}m : ${s}s`;
}

updateOfferTimer();
setInterval(updateOfferTimer, 1000);

fetch("js/catalog-generated.json")
  .then(r => r.json())
  .then(data => {
    CATALOG = data;
    renderAll();
    syncCart();
  });
