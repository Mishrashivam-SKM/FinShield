(function() {
  'use strict';

  const BASE_URL = '/api';
  const state = {
    token: localStorage.getItem('token') || null,
    role: localStorage.getItem('role') || null
  };

  // ── Helpers ──
  async function apiFetch(endpoint, options) {
    options = options || {};
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
    if (options.headers) Object.assign(headers, options.headers);
    options.headers = headers;
    const res = await fetch(BASE_URL + endpoint, options);
    if (!res.ok) {
      const err = await res.json().catch(function() { return {}; });
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  function $(id) { return document.getElementById(id); }

  function badge(text, prefix) {
    prefix = prefix || 'status';
    return '<span class="badge ' + prefix + '-' + text + '">' + text + '</span>';
  }

  // ── View Router ──
  var allViews = ['login-view','dashboard-view','policies-view','claims-view','reports-view','users-view','audit-view','pricing-view','admin-view'];
  var adminLinks = ['link-reports','link-users','link-audit','link-admin'];
  var managerLinks = ['link-reports'];

  function showView(viewId) {
    allViews.forEach(function(id) { $(id).style.display = 'none'; });
    $(viewId).style.display = 'block';

    // Nav visibility based on role
    if (state.token) {
      $('btn-logout').classList.remove('nav-hidden');
      // Manager+ links
      managerLinks.forEach(function(id) {
        $(id).classList.toggle('nav-hidden', !(['admin','manager'].indexOf(state.role) > -1));
      });
      // Admin-only links
      ['link-users','link-audit','link-admin'].forEach(function(id) {
        $(id).classList.toggle('nav-hidden', state.role !== 'admin');
      });
    } else {
      $('btn-logout').classList.add('nav-hidden');
      adminLinks.forEach(function(id) { $(id).classList.add('nav-hidden'); });
    }

    // Highlight active nav
    document.querySelectorAll('.nav-links a').forEach(function(a) { a.classList.remove('active-link'); });
    var map = {
      'dashboard-view':'link-dashboard','policies-view':'link-policies','claims-view':'link-claims',
      'reports-view':'link-reports','users-view':'link-users','audit-view':'link-audit',
      'pricing-view':'link-pricing','admin-view':'link-admin'
    };
    if (map[viewId]) { var el = $(map[viewId]); if(el) el.classList.add('active-link'); }
  }

  // ── Dashboard ──
  var claimsChart = null, regionChart = null;
  async function loadDashboard() {
    try {
      var stats = await apiFetch('/dashboard/stats');
      $('stat-policies').textContent = stats.total_policies;
      $('stat-claims').textContent = stats.active_claims;
      $('stat-premiums').textContent = '$' + Number(stats.total_premiums).toLocaleString();
      $('stat-claims-amt').textContent = '$' + Number(stats.total_claims_amount).toLocaleString();
    } catch(e) { console.error('Stats error', e); }

    // Charts (Manager+)
    if (['admin','manager'].indexOf(state.role) > -1) {
      try {
        var charts = await apiFetch('/dashboard/charts');
        $('charts-container').style.display = 'grid';

        // Claims by Type
        if (claimsChart) claimsChart.destroy();
        claimsChart = new Chart($('chart-claims-type'), {
          type: 'doughnut',
          data: {
            labels: charts.claims_by_type.map(function(c) { return c.claim_type; }),
            datasets: [{
              data: charts.claims_by_type.map(function(c) { return c.count; }),
              backgroundColor: ['#00d4aa','#3b82f6','#f59e0b','#ef4444','#a78bfa']
            }]
          },
          options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } } }
        });

        // Policies by Region
        if (regionChart) regionChart.destroy();
        regionChart = new Chart($('chart-policies-region'), {
          type: 'bar',
          data: {
            labels: charts.policies_by_region.map(function(r) { return r.region; }),
            datasets: [{
              label: 'Policies',
              data: charts.policies_by_region.map(function(r) { return r.count; }),
              backgroundColor: '#00d4aa'
            }]
          },
          options: {
            responsive: true,
            scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' }, beginAtZero: true } },
            plugins: { legend: { labels: { color: '#94a3b8' } } }
          }
        });
      } catch(e) {
        console.error('Charts error', e);
      }
    } else {
      $('charts-container').style.display = 'none';
    }
  }

  // ── Policies ──
  async function loadPolicies() {
    try {
      var policies = await apiFetch('/policies');
      var tbody = $('policies-table-body');
      tbody.innerHTML = '';
      policies.forEach(function(p) {
        tbody.innerHTML += '<tr>' +
          '<td>' + p.policy_number + '</td>' +
          '<td>' + p.holder_name + '</td>' +
          '<td>' + p.policy_type.toUpperCase() + '</td>' +
          '<td>$' + Number(p.premium_amount).toLocaleString() + '</td>' +
          '<td>$' + Number(p.coverage_amount).toLocaleString() + '</td>' +
          '<td>' + (p.region || '—') + '</td>' +
          '<td>' + badge(p.status) + '</td></tr>';
      });
    } catch(e) { console.error('Policies error', e); }
  }

  // ── Claims ──
  async function loadClaims() {
    try {
      var claims = await apiFetch('/claims');
      var tbody = $('claims-table-body');
      tbody.innerHTML = '';
      claims.forEach(function(c) {
        tbody.innerHTML += '<tr>' +
          '<td>' + c.claim_number + '</td>' +
          '<td>' + c.claimant_name + '</td>' +
          '<td>' + c.claim_type + '</td>' +
          '<td>$' + Number(c.claim_amount).toLocaleString() + '</td>' +
          '<td>' + badge(c.status) + '</td></tr>';
      });
    } catch(e) { console.error('Claims error', e); }
  }

  // ── Reports ──
  async function loadReports() {
    try {
      var report = await apiFetch('/reports/executive');
      $('stat-revenue').textContent = '$' + Number(report.total_revenue).toLocaleString();
      $('stat-payout').textContent = '$' + Number(report.total_payout).toLocaleString();
      var tbody = $('region-table-body');
      tbody.innerHTML = '';
      report.region_breakdown.forEach(function(r) {
        tbody.innerHTML += '<tr><td>' + r.region + '</td><td>' + r.count + '</td><td>$' + Number(r.revenue).toLocaleString() + '</td></tr>';
      });
    } catch(e) { console.error('Reports error', e); }
  }

  // ── Users ──
  async function loadUsers() {
    try {
      var users = await apiFetch('/users');
      var tbody = $('users-table-body');
      tbody.innerHTML = '';
      users.forEach(function(u) {
        tbody.innerHTML += '<tr><td>' + u.id + '</td><td>' + u.username + '</td><td>' + u.full_name + '</td><td>' + u.email + '</td><td>' + badge(u.role, 'role') + '</td></tr>';
      });
    } catch(e) { console.error('Users error', e); }
  }

  // ── Audit Log ──
  async function loadAuditLog() {
    try {
      var logs = await apiFetch('/system/audit-log');
      var tbody = $('audit-table-body');
      tbody.innerHTML = '';
      logs.forEach(function(l) {
        tbody.innerHTML += '<tr><td>' + new Date(l.timestamp).toLocaleString() + '</td><td>' + (l.username || 'system') + '</td><td>' + l.action + '</td><td>' + (l.target_type || '—') + '</td><td>' + (l.details || '—') + '</td></tr>';
      });
    } catch(e) { console.error('Audit error', e); }
  }

  // ── System Metrics ──
  async function loadSystemMetrics() {
    try {
      var m = await apiFetch('/system/metrics');
      $('stat-cpu').textContent = m.cpu_cores;
      $('stat-mem').textContent = m.free_memory_mb;
      $('stat-load').textContent = m.load_average.map(function(v) { return v.toFixed(2); }).join(' / ');
      $('stat-uptime').textContent = (m.uptime_seconds / 3600).toFixed(1);
    } catch(e) { console.error('Metrics error', e); }
  }

  // ── Auth ──
  $('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
      var data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: $('username').value, password: $('password').value })
      });
      state.token = data.token;
      state.role = data.role;
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      $('login-error').textContent = '';
      showView('dashboard-view');
      loadDashboard();
    } catch(err) {
      $('login-error').textContent = err.message || 'Login failed';
    }
  });

  $('btn-logout').addEventListener('click', function() {
    state.token = null; state.role = null;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    showView('login-view');
  });

  // ── Nav Event Listeners ──
  $('link-dashboard').addEventListener('click', function(e) { e.preventDefault(); if(state.token) { showView('dashboard-view'); loadDashboard(); } });
  $('link-policies').addEventListener('click', function(e) { e.preventDefault(); if(state.token) { showView('policies-view'); loadPolicies(); } });
  $('link-claims').addEventListener('click', function(e) { e.preventDefault(); if(state.token) { showView('claims-view'); loadClaims(); } });
  $('link-reports').addEventListener('click', function(e) { e.preventDefault(); if(state.token) { showView('reports-view'); loadReports(); } });
  $('link-users').addEventListener('click', function(e) { e.preventDefault(); if(state.token) { showView('users-view'); loadUsers(); } });
  $('link-audit').addEventListener('click', function(e) { e.preventDefault(); if(state.token) { showView('audit-view'); loadAuditLog(); } });
  $('link-pricing').addEventListener('click', function(e) { e.preventDefault(); showView('pricing-view'); });
  $('link-admin').addEventListener('click', function(e) { e.preventDefault(); if(state.token) { showView('admin-view'); loadSystemMetrics(); } });

  // ── Init ──
  if (state.token) { showView('dashboard-view'); loadDashboard(); }
  else { showView('login-view'); }
})();
