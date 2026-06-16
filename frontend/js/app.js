const BASE_URL = 'http://localhost:3000/api';

// State
let state = {
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role')
};

// Elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const policiesView = document.getElementById('policies-view');
const loginForm = document.getElementById('login-form');
const btnLogout = document.getElementById('btn-logout');

// Router
function showView(viewId) {
  [loginView, dashboardView, policiesView].forEach(v => {
    v.style.display = 'none';
  });
  document.getElementById(viewId).style.display = 'block';

  if(state.token) {
    btnLogout.style.display = 'inline-block';
  } else {
    btnLogout.style.display = 'none';
  }
}

// Check Auth on load
if(state.token) {
  showView('dashboard-view');
  loadDashboardStats();
} else {
  showView('login-view');
}

// Navigation
document.getElementById('link-dashboard').addEventListener('click', (e) => {
  e.preventDefault();
  if(state.token) {
    showView('dashboard-view');
    loadDashboardStats();
  }
});

document.getElementById('link-policies').addEventListener('click', (e) => {
  e.preventDefault();
  if(state.token) {
    showView('policies-view');
    loadPolicies();
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if(res.ok) {
      state.token = data.token;
      state.role = data.role;
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      document.getElementById('login-error').innerText = '';
      showView('dashboard-view');
      loadDashboardStats();
    } else {
      document.getElementById('login-error').innerText = data.error;
    }
  } catch (err) {
    document.getElementById('login-error').innerText = 'Network error during login';
  }
});

// Logout
btnLogout.addEventListener('click', () => {
  state.token = null;
  state.role = null;
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  showView('login-view');
});

// Load Dashboard Stats
async function loadDashboardStats() {
  try {
    const res = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if(res.ok) {
      const stats = await res.json();
      document.getElementById('stat-policies').innerText = stats.total_policies;
      document.getElementById('stat-claims').innerText = stats.active_claims;
    }
  } catch(err) {
    console.error('Failed to update stats', err);
  }
}

// Load Policies
async function loadPolicies() {
  try {
    const res = await fetch(`${BASE_URL}/policies`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    if(res.ok) {
      const policies = await res.json();
      const tbody = document.getElementById('policies-table-body');
      tbody.innerHTML = '';
      policies.forEach(p => {
        const row = `<tr>
          <td>${p.policy_number}</td>
          <td>${p.holder_name}</td>
          <td>${p.policy_type}</td>
          <td>$${p.premium_amount}</td>
          <td><span class="badge status-${p.status}">${p.status}</span></td>
        </tr>`;
        tbody.innerHTML += row;
      });
    }
  } catch(err) {
    console.error('Failed to load policies', err);
  }
}
