function renderOrderTracking(rawId) {
  const cleanId = rawId.trim().toUpperCase();
  const resultBox = document.getElementById('trackingResult');
  const orders = JSON.parse(localStorage.getItem('wallbinet_orders') || '[]');
  const order = orders.find(o => o.orderId.toUpperCase() === cleanId);

  resultBox.classList.remove('hidden');

  if (!order) {
    resultBox.innerHTML = `
      <p style="color:#C0392B;font-weight:600;">
        No order found matching "${cleanId}". Please double-check your Order Reference Number from your Purchase Success receipt.
      </p>
    `;
    return;
  }

  const itemsSummary = order.items
    .map(i => `${i.qty}× Wallbinet (${i.size},${i.color})`)
    .join('; ');

  const timelineHTML = order.history
    .map(
      step => `
      <li>
        <strong>${step.status}</strong> — <span>${step.location}</span>
        <div style="font-size:0.8rem;color:#666;">${step.time}</div>
      </li>
    `
    )
    .join('');

  resultBox.innerHTML = `
    <div class="track-meta">
      <div>
        <div><strong>Order ID:</strong> ${order.orderId}</div>
        <div><strong>Recipient:</strong> ${order.customerName}</div>
        <div><strong>Items:</strong> ${itemsSummary}</div>
      </div>
      <div>
        <div><strong>Current Status:</strong> <span style="color:#1E7E48;font-weight:700;">${order.status}</span></div>
        <div><strong>Current Location:</strong> ${order.currentLocation}</div>
        <div><strong>Payment:</strong> ${order.paymentMethod}</div>
      </div>
    </div>
    <h4 style="margin-bottom:12px;">Shipment &amp; Location History</h4>
    <ul class="timeline">
      ${timelineHTML}
    </ul>
  `;
}

document.getElementById('trackingForm').addEventListener('submit', e => {
  e.preventDefault();
  const val = document.getElementById('trackingInput').value;
  if (val) {
    renderOrderTracking(val);
  }
});

// Support direct URL link format: index.html?track=WB-2026-XXXX#track-order
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const trackParam = params.get('track');
  if (trackParam) {
    document.getElementById('trackingInput').value = trackParam;
    renderOrderTracking(trackParam);
  }
});