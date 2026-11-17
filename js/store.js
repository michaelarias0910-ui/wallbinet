// Clean initialization: purge any legacy keys from older projects once
(function purgeLegacyStorage() {
  const CLEAN_FLAG = 'wallbinet_v2_clean_init';
  if (!localStorage.getItem(CLEAN_FLAG)) {
    localStorage.clear();
    localStorage.setItem(CLEAN_FLAG, 'true');
  }
})();

const WALLBINET_SIZES = [
  { label: 'Small (60 cm × 40 cm)', price: 6499 },
  { label: 'Medium (70 cm × 45 cm)', price: 8199 },
  { label: 'Large (80 cm × 50 cm)', price: 10000 }
];

const WALLBINET_COLORS = ['White', 'Brown', 'Black', 'Wood Grain'];

const StoreState = {
  selectedSize: WALLBINET_SIZES[0].label,
  selectedPrice: WALLBINET_SIZES[0].price,
  selectedColor: 'White',
  selectedQty: 1,
  cart: JSON.parse(localStorage.getItem('wallbinet_cart') || '[]')
};

function formatPHP(amount) {
  return '₱' + Number(amount).toLocaleString('en-PH');
}

function saveCart() {
  localStorage.setItem('wallbinet_cart', JSON.stringify(StoreState.cart));
  renderCart();
}

// Gallery thumbnail switcher
document.querySelectorAll('.thumb-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('mainProductImg').src = btn.dataset.img;
  });
});

// Size selector
document.querySelectorAll('.size-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.size-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    StoreState.selectedSize = card.dataset.size;
    StoreState.selectedPrice = Number(card.dataset.price);
    updateConfiguratorTotals();
  });
});

// Color selector
document.querySelectorAll('.swatch-btn').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.swatch-btn').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    StoreState.selectedColor = swatch.dataset.color;
    document.getElementById('selectedColorName').textContent = StoreState.selectedColor;
  });
});

// Quantity controls on product page
const qtyInput = document.getElementById('productQty');
document.getElementById('qtyMinus').addEventListener('click', () => {
  if (StoreState.selectedQty > 1) {
    StoreState.selectedQty--;
    qtyInput.value = StoreState.selectedQty;
    updateConfiguratorTotals();
  }
});

document.getElementById('qtyPlus').addEventListener('click', () => {
  if (StoreState.selectedQty < 20) {
    StoreState.selectedQty++;
    qtyInput.value = StoreState.selectedQty;
    updateConfiguratorTotals();
  }
});

function updateConfiguratorTotals() {
  document.getElementById('selectedPriceDisplay').textContent = formatPHP(StoreState.selectedPrice);
  const sub = StoreState.selectedPrice * StoreState.selectedQty;
  document.getElementById('btnSubtotal').textContent = formatPHP(sub);
}

// Add to cart
document.getElementById('addToCartBtn').addEventListener('click', () => {
  const existingIndex = StoreState.cart.findIndex(
    item => item.size === StoreState.selectedSize && item.color === StoreState.selectedColor
  );

  if (existingIndex > -1) {
    StoreState.cart[existingIndex].qty += StoreState.selectedQty;
  } else {
    StoreState.cart.push({
      id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: 'Wallbinet Foldable Study & Work Cabinet Table',
      size: StoreState.selectedSize,
      color: StoreState.selectedColor,
      unitPrice: StoreState.selectedPrice,
      qty: StoreState.selectedQty
    });
  }

  saveCart();
  openCartDrawer();
});

// Cart Drawer Open / Close
const cartDrawer = document.getElementById('cartDrawer');
const cartBackdrop = document.getElementById('cartBackdrop');

function openCartDrawer() {
  cartDrawer.classList.add('open');
  cartBackdrop.classList.add('open');
}

function closeCartDrawer() {
  cartDrawer.classList.remove('open');
  cartBackdrop.classList.remove('open');
}

document.getElementById('openCartBtn').addEventListener('click', openCartDrawer);
document.getElementById('closeCartBtn').addEventListener('click', closeCartDrawer);
cartBackdrop.addEventListener('click', closeCartDrawer);

// Render Cart with inline Edit (Size, Color, Quantity) & Delete
function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  const countBadge = document.getElementById('cartCount');
  const subtotalEl = document.getElementById('cartSubtotal');
  const checkoutBtn = document.getElementById('proceedCheckoutBtn');

  const totalItems = StoreState.cart.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = StoreState.cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  countBadge.textContent = totalItems;
  subtotalEl.textContent = formatPHP(totalAmount);
  checkoutBtn.disabled = StoreState.cart.length === 0;

  if (StoreState.cart.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#666;margin-top:40px;">Your cart is empty. Select a Wallbinet size and finish to begin.</p>';
    return;
  }

  container.innerHTML = StoreState.cart.map((item, idx) => {
    const sizeOptions = WALLBINET_SIZES.map(
      s => `<option value="${s.label}" ${s.label === item.size ? 'selected' : ''}>${s.label} —${formatPHP(s.price)}</option>`
    ).join('');

    const colorOptions = WALLBINET_COLORS.map(
      c => `<option value="${c}" ${c === item.color ? 'selected' : ''}>Finish: ${c}</option>`
    ).join('');

    return `
      <div class="cart-item-card">
        <div class="cart-item-top">
          <div>
            <strong>${item.name}</strong>
            <div style="font-size:0.82rem;color:#666;">Edit configuration below:</div>
          </div>
          <strong>${formatPHP(item.unitPrice * item.qty)}</strong>
        </div>

        <div class="cart-item-controls">
          <select aria-label="Edit Size" onchange="editCartItemSize(${idx}, this.value)">
            ${sizeOptions}
          </select>
          <select aria-label="Edit Color" onchange="editCartItemColor(${idx}, this.value)">
            ${colorOptions}
          </select>
        </div>

        <div class="cart-item-bottom">
          <div class="mini-qty">
            <button type="button" onclick="editCartItemQty(${idx}, -1)">−</button>
            <span>${item.qty}</span>
            <button type="button" onclick="editCartItemQty(${idx}, 1)">+</button>
          </div>
          <button type="button" class="delete-item-btn" onclick="deleteCartItem(${idx})">🗑 Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

window.editCartItemSize = function(index, newSizeLabel) {
  const matched = WALLBINET_SIZES.find(s => s.label === newSizeLabel);
  if (matched && StoreState.cart[index]) {
    StoreState.cart[index].size = matched.label;
    StoreState.cart[index].unitPrice = matched.price;
    saveCart();
  }
};

window.editCartItemColor = function(index, newColor) {
  if (StoreState.cart[index]) {
    StoreState.cart[index].color = newColor;
    saveCart();
  }
};

window.editCartItemQty = function(index, delta) {
  if (!StoreState.cart[index]) return;
  const nextQty = StoreState.cart[index].qty + delta;
  if (nextQty <= 0) {
    StoreState.cart.splice(index, 1);
  } else {
    StoreState.cart[index].qty = nextQty;
  }
  saveCart();
};

window.deleteCartItem = function(index) {
  StoreState.cart.splice(index, 1);
  saveCart();
};

// FAQ / Policy Tabs & Mobile Menu
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

document.getElementById('wholesaleForm').addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('wsFeedback').textContent =
    'Thank you! Your wholesale inquiry has been logged for our Sta. Ana, Pampanga team. We will contact you within 24 hours.';
  e.target.reset();
});

// Initial render
renderCart();