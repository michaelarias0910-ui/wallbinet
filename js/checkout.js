let generatedOTP = null;
let verifiedEmailAddress = null;

const checkoutModal = document.getElementById('checkoutModal');
const policyReadModal = document.getElementById('policyReadModal');
const successModal = document.getElementById('successModal');

// Open Checkout Modal
document.getElementById('proceedCheckoutBtn').addEventListener('click', () => {
  closeCartDrawer();
  const total = StoreState.cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  document.getElementById('checkoutTotalAmount').textContent = formatPHP(total);
  checkoutModal.classList.add('open');
});

document.getElementById('closeCheckoutBtn').addEventListener('click', () => {
  checkoutModal.classList.remove('open');
});

// Dynamic Payment Inputs (GCash, Maya, PayPal, Credit Card, Debit Card, COD)
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
  radio.addEventListener('change', e => {
    document.querySelectorAll('.pay-option').forEach(opt => opt.classList.remove('active'));
    e.target.closest('.pay-option').classList.add('active');

    const method = e.target.value;
    const container = document.getElementById('paymentDynamicFields');

    if (method === 'GCash' || method === 'Maya') {
      container.innerHTML = `<input type="text" id="payAccountRef" placeholder="${method} Mobile Number (09XX-XXX-XXXX)" required />`;
    } else if (method === 'PayPal') {
      container.innerHTML = `<input type="email" id="payAccountRef" placeholder="PayPal Account Email" required />`;
    } else if (method === 'Credit Card' || method === 'Debit Card') {
      container.innerHTML = `
        <div class="form-row">
          <input type="text" id="payAccountRef" placeholder="${method} Number (XXXX-XXXX-XXXX-XXXX)" maxlength="19" required />
          <input type="text" placeholder="MM/YY • CVV" maxlength="9" required />
        </div>
      `;
    } else {
      container.innerHTML = `<p style="font-size:0.85rem;color:#4A3525;">Cash on Delivery selected: Prepare exact cash upon courier arrival at your address.</p>`;
    }
  });
});

// Policy Quick-Read Modal Contents
const POLICY_TEXTS = {
  shipping: {
    title: 'Wallbinet Shipping & Delivery Policy',
    body: '<p>Orders are handcrafted and quality-checked at our Sta. Ana, Pampanga workshop within 2–4 business days. Standard courier delivery takes 1–3 days within Pampanga/Central Luzon, 2–4 days to Metro Manila, and 3–10 days nationwide. Real-time tracking updates are accessible via your Order Reference Number.</p>'
  },
  return: {
    title: 'Wallbinet Return & Exchange Policy',
    body: '<p>We offer a 7-Day Replacement Guarantee for manufacturing defects, missing mounting hardware, or transit damage reported with unboxing documentation. Units must be unmounted and in original packaging. Size/color exchanges may be requested before workshop dispatch.</p>'
  },
  privacy: {
    title: 'Wallbinet Privacy & Safety Policy',
    body: '<p>Your personal contact details and delivery address are encrypted locally and used strictly for email verification, order fulfillment, and courier dispatch. Always mount your Wallbinet onto solid concrete or wood-stud walls using the supplied anchors.</p>'
  },
  contract: {
    title: 'Wallbinet Purchase & Installation Contract',
    body: '<p>By placing this order, the buyer confirms accurate delivery details, agrees to settle the stated amount via the selected payment method, and acknowledges proper wall-mounting guidelines included in the package.</p>'
  }
};

document.querySelectorAll('.inline-policy-link').forEach(btn => {
  btn.addEventListener('click', () => {
    const info = POLICY_TEXTS[btn.dataset.policy];
    document.getElementById('policyModalTitle').textContent = info.title;
    document.getElementById('policyModalBody').innerHTML = info.body;
    policyReadModal.classList.add('open');
  });
});

document.getElementById('closePolicyModalBtn').addEventListener('click', () => {
  policyReadModal.classList.remove('open');
});

// Check whether all 4 checkboxes + verified email are complete
function evaluateCheckoutReadiness() {
  const c1 = document.getElementById('chkShipping').checked;
  const c2 = document.getElementById('chkReturn').checked;
  const c3 = document.getElementById('chkPrivacy').checked;
  const c4 = document.getElementById('chkContract').checked;
  const currentEmail = document.getElementById('custEmail').value.trim().toLowerCase();
  const isEmailVerified = verifiedEmailAddress && verifiedEmailAddress === currentEmail;

  document.getElementById('confirmPaymentBtn').disabled = !(c1 && c2 && c3 && c4 && isEmailVerified);
}

['chkShipping', 'chkReturn', 'chkPrivacy', 'chkContract'].forEach(id => {
  document.getElementById(id).addEventListener('change', evaluateCheckoutReadiness);
});

document.getElementById('custEmail').addEventListener('input', () => {
  const currentEmail = document.getElementById('custEmail').value.trim().toLowerCase();
  if (verifiedEmailAddress !== currentEmail) {
    verifiedEmailAddress = null;
    document.getElementById('verificationStatus').textContent = '';
  }
  evaluateCheckoutReadiness();
});

// Send 6-Digit Email Verification Code
document.getElementById('sendCodeBtn').addEventListener('click', () => {
  const emailInput = document.getElementById('custEmail');
  const emailVal = emailInput.value.trim();

  if (!emailVal || !emailInput.checkValidity()) {
    emailInput.reportValidity();
    return;
  }

  generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
  verifiedEmailAddress = null;

  const codeBox = document.getElementById('emailCodeInput');
  const verifyBtn = document.getElementById('verifyCodeBtn');
  codeBox.disabled = false;
  verifyBtn.disabled = false;
  codeBox.value = '';
  codeBox.focus();

  document.getElementById('verificationStatus').style.color = '#4A3525';
  document.getElementById('verificationStatus').textContent = `Verification code sent to ${emailVal}. Check your inbox notification.`;

  // Display instant inbox notification so customer can copy the sent code
  document.getElementById('emailToastRecipient').textContent = `To: ${emailVal}`;
  document.getElementById('emailToastCode').textContent = generatedOTP;
  document.getElementById('emailInboxToast').classList.remove('hidden');
});

document.getElementById('closeToastBtn').addEventListener('click', () => {
  document.getElementById('emailInboxToast').classList.add('hidden');
});

// Verify 6-Digit Code
document.getElementById('verifyCodeBtn').addEventListener('click', () => {
  const entered = document.getElementById('emailCodeInput').value.trim();
  const statusEl = document.getElementById('verificationStatus');
  const currentEmail = document.getElementById('custEmail').value.trim().toLowerCase();

  if (entered && entered === generatedOTP) {
    verifiedEmailAddress = currentEmail;
    statusEl.style.color = '#1E7E48';
    statusEl.textContent = '✓ Email verified! You may now confirm your payment.';
    document.getElementById('emailInboxToast').classList.add('hidden');
  } else {
    verifiedEmailAddress = null;
    statusEl.style.color = '#C0392B';
    statusEl.textContent = 'Invalid verification code. Please check the 6-digit code sent to your email.';
  }
  evaluateCheckoutReadiness();
});

// Submit Order & Show Purchase Success
document.getElementById('checkoutForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!verifiedEmailAddress) return;

  const orderId = 'WB-2026-' + Math.floor(1000 + Math.random() * 9000);
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const totalAmount = StoreState.cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const nowStr = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

  const newOrder = {
    orderId,
    customerName: document.getElementById('custName').value.trim(),
    customerPhone: document.getElementById('custPhone').value.trim(),
    customerEmail: verifiedEmailAddress,
    customerAddress: document.getElementById('custAddress').value.trim(),
    paymentMethod,
    items: [...StoreState.cart],
    totalAmount,
    status: 'Order Confirmed & Queued',
    currentLocation: 'Wallbinet Workshop — Sta. Ana, Pampanga',
    history: [
      {
        time: nowStr,
        status: 'Order Confirmed & Payment Verified',
        location: 'Sta. Ana, Pampanga Workshop'
      }
    ]
  };

  const existingOrders = JSON.parse(localStorage.getItem('wallbinet_orders') || '[]');
  existingOrders.unshift(newOrder);
  localStorage.setItem('wallbinet_orders', JSON.stringify(existingOrders));

  // Clear cart and reset form
  StoreState.cart = [];
  saveCart();
  e.target.reset();
  generatedOTP = null;
  verifiedEmailAddress = null;
  document.getElementById('verificationStatus').textContent = '';
  document.getElementById('confirmPaymentBtn').disabled = true;
  checkoutModal.classList.remove('open');

  // Populate Purchase Success Receipt
  document.getElementById('receiptDetails').innerHTML = `
    <div><strong>Order Reference ID:</strong> ${newOrder.orderId}</div>
    <div><strong>Customer:</strong> ${newOrder.customerName} (${newOrder.customerEmail})</div>
    <div><strong>Payment Method:</strong> ${newOrder.paymentMethod} — <strong>Paid / Confirmed</strong></div>
    <div><strong>Total Amount:</strong> ${formatPHP(newOrder.totalAmount)}</div>
    <div><strong>Current Location:</strong> ${newOrder.currentLocation}</div>
    <div><strong>Direct Tracking Link:</strong> <a href="?track=${newOrder.orderId}#track-order">index.html?track=${newOrder.orderId}#track-order</a></div>
  `;

  document.getElementById('trackNewOrderBtn').onclick = () => {
    successModal.classList.remove('open');
    document.getElementById('trackingInput').value = newOrder.orderId;
    renderOrderTracking(newOrder.orderId);
  };

  successModal.classList.add('open');
});

document.getElementById('closeSuccessBtn').addEventListener('click', () => {
  successModal.classList.remove('open');
});