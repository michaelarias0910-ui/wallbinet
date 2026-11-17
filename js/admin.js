const ADMIN_CRED_KEY = 'wallbinet_admin_account';
const ADMIN_SESSION_KEY = 'wallbinet_admin_logged_in';

const authSection = document.getElementById('adminAuthSection');
const dashboardSection = document.getElementById('adminDashboardSection');
const logoutBtn = document.getElementById('adminLogoutBtn');

function initAdminPortal() {
  const savedAdmin = JSON.parse(localStorage.getItem(ADMIN_CRED_KEY) || 'null');
  const isLoggedIn = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';

  if (savedAdmin && isLoggedIn) {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    renderAdminOrders();
    return;
  }

  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  logoutBtn.classList.add('hidden');

  if (savedAdmin) {
    document.getElementById('authHeading').textContent = 'Admin Login';
    document.getElementById('authSubtext').textContent = 'Sign in with your registered Wallbinet administrator credentials.';
    document.getElementById('adminAuthSubmit').textContent = 'Sign In to Dashboard';
  } else {
    document.getElementById('authHeading').textContent = 'Create Admin Account';
    document.getElementById('authSubtext').textContent = 'No existing admin account found. Register your admin email and password to manage orders.';
    document.getElementById('adminAuthSubmit').textContent = 'Register & Open Dashboard';
  }
}

document.getElementById('adminAuthForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim().toLowerCase();
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('adminAuthError');
  const savedAdmin = JSON.parse(localStorage.getItem(ADMIN_CRED_KEY) || 'null');

  if (!savedAdmin) {
    localStorage.setItem(ADMIN_CRED_KEY, JSON.stringify({ email, password }));
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    errorEl.textContent = '';
    initAdminPortal();
  } else {
    if (savedAdmin.email === email && savedAdmin.password === password) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      errorEl.textContent = '';
      initAdminPortal();
    } else {
      errorEl.textContent = 'Invalid admin email or password.';
    }
  }
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  initAdminPortal();
});

document.getElementById('resetAdminBtn').addEventListener('click', () => {
  if (confirm('Remove current admin credentials? You will be prompted to create a new admin login.')) {
    localStorage.removeItem(ADMIN_CRED_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    initAdminPortal();
  }
});

function renderAdminOrders() {
  const orders = JSON.parse(localStorage.getItem('wallbinet_orders') || '[]');
  const tbody = document.getElementById('adminOrdersBody');

  document.getElementById('statTotalOrders').textContent = orders.length;
  const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  document.getElementById('statTotalRevenue').textContent = '₱' + revenue.toLocaleString('en-PH');
  const active = orders.filter(o => o.status !== 'Delivered').length;
  document.getElementById('statActiveDeliveries').textContent = active;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#666;">No customer orders yet. Orders placed on index.html will appear here automatically.</td></tr>';
    return;
  }

  const STATUS_OPTIONS = [
    'Order Confirmed & Queued',
    'Crafting at Sta. Ana Workshop',
    'Quality Inspection Passed',
    'In Transit to Regional Hub',
    'Out for Delivery',
    'Delivered'
  ];

  tbody.innerHTML = orders.map((order, idx) => {
    const itemsList = order.items
      .map(i => `<div>${i.qty}× ${i.size} (${i.color})</div>`)
      .join('');

    const statusSelect = STATUS_OPTIONS.map(
      st => `<option value="${st}" ${st === order.status ? 'selected' : ''}>${st}</option>`
    ).join('');

    return `
      <tr>
        <td><strong>${order.orderId}</strong></td>
        <td>
          <strong>${order.customerName}</strong><br/>
          <span>${order.customerPhone}</span><br/>
          <small>${order.customerEmail}</small><br/>
          <small style="color:#666;">${order.customerAddress}</small>
        </td>
        <td>${itemsList}</td>
        <td>${order.paymentMethod}</td>
        <td><strong>₱${Number(order.totalAmount).toLocaleString('en-PH')}</strong></td>
        <td>
          <select id="status-${idx}" style="width:100%;padding:6px;margin-bottom:6px;border-radius:6px;">
            ${statusSelect}
          </select>
          <input type="text" id="loc-${idx}" value="${order.currentLocation}" placeholder="Current hub / city" style="width:100%;padding:6px;border-radius:6px;border:1px solid #ccc;" />
        </td>
        <td>
          <button type="button" class="btn-primary" style="padding:8px 12px;font-size:0.82rem;" onclick="updateOrderTracking(${idx})">
            Save Update
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.updateOrderTracking = function(index) {
  const orders = JSON.parse(localStorage.getItem('wallbinet_orders') || '[]');
  const order = orders[index];
  if (!order) return;

  const newStatus = document.getElementById(`status-${index}`).value;
  const newLocation = document.getElementById(`loc-${index}`).value.trim() \vert{}\vert{} order.currentLocation; const nowStr = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });  order.status = newStatus; order.currentLocation = newLocation; order.history.unshift({ time: nowStr, status: newStatus, location: newLocation });  localStorage.setItem('wallbinet_orders', JSON.stringify(orders)); renderAdminOrders(); alert(`Order ${order.orderId} updated! Customers tracking this ID will now see "${newStatus}" at "${newLocation}".`);
};

initAdminPortal();