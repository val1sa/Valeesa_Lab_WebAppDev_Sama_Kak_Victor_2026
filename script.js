
const PRODUCTS = [
  { id: 1, name: "Keyboard Mekanik", category: "Aksesoris", price: 450000, stock: 12 },
  { id: 2, name: "Mouse Wireless",   category: "Aksesoris", price: 185000, stock: 30 },
  { id: 3, name: "Headset Gaming",   category: "Audio",     price: 320000, stock: 8  },
  { id: 4, name: "Earbuds TWS",      category: "Audio",     price: 275000, stock: 0  },
  { id: 5, name: "Flashdisk 64GB",   category: "Penyimpanan", price: 95000,   stock: 45 },
  { id: 6, name: "SSD Eksternal 1TB",category: "Penyimpanan", price: 1150000, stock: 5  },
  { id: 7, name: "Monitor 24 inci",  category: "Display",   price: 1750000, stock: 6  },
  { id: 8, name: "Webcam Full HD",   category: "Display",   price: 649000,  stock: 15 },
  { id: 9, name: "Mousepad XL",      category: "Aksesoris", price: 65000,   stock: 20 },
];

const FREE_SHIPPING_THRESHOLD = 300000;
const SHIPPING_FEE = 15000;
const VOUCHERS = {
  "DISKON10": { type: "percent", value: 10 },
  "HEMAT20K": { type: "flat", value: 20000 },
};


let cart = {};       
let appliedVoucher = null;


const searchInput   = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const sortSelect    = document.getElementById("sortSelect");
const productGrid   = document.getElementById("productGrid");
const resultCount   = document.getElementById("resultCount");
const emptyState    = document.getElementById("emptyState");

const cartList   = document.getElementById("cartList");
const cartEmpty  = document.getElementById("cartEmpty");
const subtotalVal = document.getElementById("subtotalVal");
const discountVal = document.getElementById("discountVal");
const shippingVal = document.getElementById("shippingVal");
const totalVal    = document.getElementById("totalVal");
const shippingNote = document.getElementById("shippingNote");
const progressBar  = document.getElementById("progressBar");
const checkoutBtn  = document.getElementById("checkoutBtn");
const checkoutMsg  = document.getElementById("checkoutMsg");
const voucherInput = document.getElementById("voucherInput");
const voucherBtn   = document.getElementById("voucherBtn");
const voucherMsg   = document.getElementById("voucherMsg");

const themeToggle = document.getElementById("themeToggle");
const themeIcon   = document.getElementById("themeIcon");
const themeLabel  = document.getElementById("themeLabel");


function formatRupiah(n) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

function getFilteredProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  const sortBy = sortSelect.value;

  let list = PRODUCTS.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query);
    const matchesCategory = category === "Semua" || p.category === category;
    return matchesQuery && matchesCategory;
  });

  switch (sortBy) {
    case "price-asc":  list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list.sort((a, b) => b.price - a.price); break;
    case "name-asc":   list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "stock-desc": list.sort((a, b) => b.stock - a.stock); break;
    default: break; // "default" = urutan asli
  }

  return list;
}


function renderCatalog() {
  const list = getFilteredProducts();

  resultCount.textContent = `${list.length} produk ditampilkan dari total ${PRODUCTS.length}`;
  productGrid.innerHTML = "";

  if (list.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = p.id;

    const isOut = p.stock <= 0;
    const inCartQty = cart[p.id] || 0;
    const reachedStock = inCartQty >= p.stock;

    card.innerHTML = `
      <span class="badge">${p.category}</span>
      <p class="product-name">${p.name}</p>
      <p class="product-price">${formatRupiah(p.price)}</p>
      <p class="product-stock ${isOut ? "out" : ""}">${isOut ? "Stok habis" : "Stok tersedia: " + p.stock}</p>
      <button class="add-btn" ${isOut || reachedStock ? "disabled" : ""}>
        ${isOut ? "Habis" : reachedStock ? "Stok maksimum" : "Tambah"}
      </button>
    `;

    const addBtn = card.querySelector(".add-btn");
    addBtn.addEventListener("click", () => addToCart(p.id, card));

    productGrid.appendChild(card);
  });
}


function addToCart(productId, cardEl) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const currentQty = cart[productId] || 0;
  if (currentQty >= product.stock) return;

  cart[productId] = currentQty + 1;

  if (cardEl) {
    cardEl.classList.remove("just-added");
    void cardEl.offsetWidth; // restart animasi
    cardEl.classList.add("just-added");
  }

  renderCatalog();
  renderCart();
}

function changeQty(productId, delta) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const newQty = (cart[productId] || 0) + delta;

  if (newQty <= 0) {
    delete cart[productId];
  } else if (newQty > product.stock) {
    cart[productId] = product.stock;
  } else {
    cart[productId] = newQty;
  }

  renderCatalog();
  renderCart();
}

function removeFromCart(productId) {
  delete cart[productId];
  renderCatalog();
  renderCart();
}

function getSubtotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = PRODUCTS.find(p => p.id === Number(id));
    return sum + (product ? product.price * qty : 0);
  }, 0);
}

function getDiscount(subtotal) {
  if (!appliedVoucher) return 0;
  if (appliedVoucher.type === "percent") return subtotal * (appliedVoucher.value / 100);
  return Math.min(appliedVoucher.value, subtotal);
}

function renderCart() {
  const entries = Object.entries(cart);
  cartList.innerHTML = "";

  if (entries.length === 0) {
    cartEmpty.style.display = "block";
  } else {
    cartEmpty.style.display = "none";
  }

  entries.forEach(([id, qty]) => {
    const product = PRODUCTS.find(p => p.id === Number(id));
    if (!product) return;

    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <div>
        <div class="cart-item-name">${product.name}</div>
        <div class="cart-item-sub">${formatRupiah(product.price)} x ${qty}</div>
      </div>
      <div class="qty-controls">
        <button class="dec">−</button>
        <span>${qty}</span>
        <button class="inc">+</button>
      </div>
      <button class="remove-btn">Hapus</button>
    `;

    li.querySelector(".inc").addEventListener("click", () => changeQty(product.id, 1));
    li.querySelector(".dec").addEventListener("click", () => changeQty(product.id, -1));
    li.querySelector(".remove-btn").addEventListener("click", () => removeFromCart(product.id));

    cartList.appendChild(li);
  });

  const subtotal = getSubtotal();
  const discount = getDiscount(subtotal);
  const shippingFee = subtotal === 0 ? 0 : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE);
  const total = Math.max(subtotal - discount + shippingFee, 0);

  subtotalVal.textContent = formatRupiah(subtotal);
  discountVal.textContent = "-" + formatRupiah(discount);
  shippingVal.textContent = subtotal === 0 ? "Rp0" : (shippingFee === 0 ? "Gratis" : formatRupiah(shippingFee));
  totalVal.textContent = formatRupiah(total);

  if (subtotal === 0) {
    shippingNote.textContent = `Belanja ${formatRupiah(FREE_SHIPPING_THRESHOLD)} untuk gratis ongkir.`;
    progressBar.style.width = "0%";
  } else if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingNote.textContent = "Kamu dapat gratis ongkir!";
    progressBar.style.width = "100%";
  } else {
    const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
    shippingNote.textContent = `Belanja ${formatRupiah(remaining)} lagi untuk gratis ongkir.`;
    progressBar.style.width = `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%`;
  }

  checkoutBtn.disabled = entries.length === 0;
  if (entries.length === 0) checkoutMsg.textContent = "";
}


voucherBtn.addEventListener("click", () => {
  const code = voucherInput.value.trim().toUpperCase();

  if (!code) {
    voucherMsg.textContent = "Masukkan kode voucher terlebih dahulu.";
    voucherMsg.classList.add("error");
    return;
  }

  if (VOUCHERS[code]) {
    appliedVoucher = VOUCHERS[code];
    voucherMsg.textContent = `Voucher "${code}" berhasil dipakai.`;
    voucherMsg.classList.remove("error");
  } else {
    appliedVoucher = null;
    voucherMsg.textContent = "Kode voucher tidak valid.";
    voucherMsg.classList.add("error");
  }

  renderCart();
});


checkoutBtn.addEventListener("click", () => {
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = totalVal.textContent;

  checkoutMsg.textContent = `Pesanan ${totalItems} barang senilai ${total} berhasil dibuat.`;

  cart = {};
  appliedVoucher = null;
  voucherInput.value = "";
  voucherMsg.textContent = "";

  renderCatalog();
  renderCart();
});


searchInput.addEventListener("input", renderCatalog);
categorySelect.addEventListener("change", renderCatalog);
sortSelect.addEventListener("change", renderCatalog);


function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "dark") {
    themeIcon.textContent = "☀️";
    themeLabel.textContent = "Mode Terang";
  } else {
    themeIcon.textContent = "🌙";
    themeLabel.textContent = "Mode Gelap";
  }
  localStorage.setItem("tokolab-theme", theme);
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});


const savedTheme = localStorage.getItem("tokolab-theme") || "light";
applyTheme(savedTheme);

renderCatalog();
renderCart();
