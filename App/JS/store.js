import { addToCart, getCartCount, getCart, clearCart, removeFromCart } from "./cart.js";

// ----- Data (objects/arrays) -----
export const PRODUCTS = [
  { id: 1, name: "Pro Diver", price: 74, tag: "Dress" },
  { id: 2, name: "Expedition Scout", price: 40, tag: "Sport" },
  { id: 3, name: "Seascape Auto", price: 199, tag: "Dress" },
  { id: 4, name: "Trail Runner", price: 89, tag: "Sport" },
  { id: 5, name: "City Classic", price: 129, tag: "Dress" },
  { id: 6, name: "Aero Chrono", price: 159, tag: "Sport" },
];

function findProduct(productId) {
  return PRODUCTS.find(p => p.id === productId);
}

function formatMoney(n) {
  return Number(n).toFixed(2);
}

function renderCartModal() {
  const modal = document.getElementById("cartModal");
  const listEl = document.getElementById("cartList");
  const emptyEl = document.getElementById("cartEmpty");
  const totalEl = document.getElementById("cartTotal");
  if (!modal || !listEl || !emptyEl || !totalEl) return;

  const items = getCart();
  listEl.innerHTML = "";
  let total = 0;

  if (!items.length) {
    emptyEl.style.display = "block";
  } else {
    emptyEl.style.display = "none";
    for (let line of items) {
      const p = findProduct(line.productId);
      if (!p) continue;
      const lineTotal = p.price * line.qty;
      total += lineTotal;

      const row = document.createElement("div");
      row.className = "card";
      row.style.padding = "8px 12px";
      row.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center">
          <div>
            <strong>${p.name}</strong>
            <div class="xsmall">Price: $${formatMoney(p.price)} · Qty: ${line.qty}</div>
          </div>
          <div>$${formatMoney(lineTotal)}</div>
          <div style="display:flex;gap:6px">
            <button class="btn btn--sm btn--outline" data-dec="${p.id}">−</button>
            <button class="btn btn--sm btn--outline" data-inc="${p.id}">+</button>
            <button class="btn btn--sm btn--accent" data-rem="${p.id}">Remove</button>
          </div>
        </div>
      `;
      listEl.appendChild(row);
    }
  }

  totalEl.textContent = formatMoney(total);

  // Row actions (event delegation)
  listEl.onclick = (e) => {
    const dec = e.target.closest("[data-dec]");
    const inc = e.target.closest("[data-inc]");
    const rem = e.target.closest("[data-rem]");
    if (dec) {
      const id = Number(dec.getAttribute("data-dec"));
      removeFromCart(id, 1);
      setCartBadge();
      renderCartModal();
    } else if (inc) {
      const id = Number(inc.getAttribute("data-inc"));
      addToCart(id, 1);
      setCartBadge();
      renderCartModal();
    } else if (rem) {
      const id = Number(rem.getAttribute("data-rem"));
      const current = getCart().find(i => i.productId === id)?.qty || 1;
      removeFromCart(id, current); // remove entire line
      setCartBadge();
      renderCartModal();
    }
  };

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.style.display = "block"; // fallback
  }
}

// ----- DOM helpers -----
function setCartBadge() {
  const el = document.getElementById("cart-badge");
  if (el) el.textContent = `Cart (${getCartCount()})`;
}

function renderGrid(list) {
  const grid = document.getElementById("store-grid");
  if (!grid) return;
  grid.innerHTML = ""; // clear
  for (let p of list) { // for…of loop
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h4>${p.name}</h4>
      <p>$${p.price}</p>
      <p class="xsmall">Category: ${p.tag}</p>
      <button class="btn btn--accent btn--sm" data-add="${p.id}">Add to cart</button>
    `;
    grid.appendChild(card);
  }
  // Delegate: listen for buttons
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const pid = Number(btn.getAttribute("data-add"));
    addToCart(pid, 1);
    setCartBadge();
  }, { once: true }); // attach once per render
}

// ----- Shipping calculator (conditionals + logical ops) -----
export function shippingCostFor(age, points, cartValue, base = 9.99) {
  // guard clauses
  if (age == null || cartValue == null || points == null) return "Please fill all fields.";
  if (Number.isNaN(age) || Number.isNaN(cartValue) || Number.isNaN(points)) return "Use numbers only.";

  if (age > 21) {
    if (cartValue >= 300 || points >= 500) {
      return 0;
    } else {
      return base;
    }
  } else {
    // user is not over 21
    return base; // business decision for demo
  }
}

// ----- Promo switch -----
export function applyPromo(code) {
  const key = String(code || "").trim().toUpperCase();
  switch (key) {
    case "STUDENT":
      return { ok: true, message: "Student promo applied: 10% off" };
    case "FREESHIP":
      return { ok: true, message: "Free shipping applied" };
    default:
      return { ok: false, message: "Invalid promo code" };
  }
}

// ----- Filter helper -----
function filterProducts(category) {
  if (category === "all") return PRODUCTS;
  const out = [];
  for (let p of PRODUCTS) {
    if (p.tag === category) out.push(p); // conditional within loop
  }
  return out;
}

// ----- Init/wiring -----
function init() {
  setCartBadge();
  renderGrid(PRODUCTS);

  const calcBtn = document.getElementById("calcShipBtn");
  if (calcBtn) {
    calcBtn.addEventListener("click", () => {
      const age = Number(document.getElementById("age").value);
      const cartValue = Number(document.getElementById("cartValue").value);
      const points = Number(document.getElementById("points").value);
      const result = shippingCostFor(age, points, cartValue);
      document.getElementById("shippingResult").textContent = String(result);
    });
  }

  const promoBtn = document.getElementById("applyPromoBtn");
  if (promoBtn) {
    promoBtn.addEventListener("click", () => {
      const code = document.getElementById("promoInput").value;
      const res = applyPromo(code);
      const el = document.getElementById("promoResult");
      el.textContent = res.message;
      el.className = "xsmall" + (res.ok ? " success" : " error");
    });
  }

  const filterBtn = document.getElementById("applyFilter");
  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      const val = document.getElementById("categoryFilter").value;
      renderGrid(filterProducts(val));
    });
  }
   // Open modal from the Cart badge
  const cartBadge = document.getElementById("cart-badge");
  if (cartBadge) {
    cartBadge.addEventListener("click", renderCartModal);
  }

  // Close modal
  const closeBtn = document.getElementById("closeCartBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const modal = document.getElementById("cartModal");
      if (!modal) return;
      if (typeof modal.close === "function") modal.close();
      else modal.style.display = "none";
    });
  }

  // Clear cart
  const clearBtn = document.getElementById("clearCartBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearCart();
      setCartBadge();
      renderCartModal();
    });
  }

  // Mock checkout
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      alert("Checkout coming in Week 3 🙂");
    });
  }
}

document.addEventListener("DOMContentLoaded", init);