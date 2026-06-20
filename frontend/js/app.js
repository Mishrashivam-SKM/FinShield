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
  var allViews = ['login-view','dashboard-view','policies-view','policy-detail-view','claims-view','claim-detail-view','reports-view','users-view','audit-view','pricing-view','admin-view'];
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
      $('stat-premiums').textContent = '₹' + Number(stats.total_premiums).toLocaleString('en-IN');
      $('stat-claims-amt').textContent = '₹' + Number(stats.total_claims_amount).toLocaleString('en-IN');
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
    // Show create form only for manager+
    $('create-policy-card').style.display = (['admin','manager'].indexOf(state.role) > -1) ? 'block' : 'none';
    try {
      var policies = await apiFetch('/policies');
      var tbody = $('policies-table-body');
      tbody.innerHTML = '';
      policies.forEach(function(p) {
        tbody.innerHTML += '<tr>' +
          '<td>' + p.policy_number + '</td>' +
          '<td>' + p.holder_name + '</td>' +
          '<td>' + p.policy_type.toUpperCase() + '</td>' +
          '<td>₹' + Number(p.premium_amount).toLocaleString('en-IN') + '</td>' +
          '<td>₹' + Number(p.coverage_amount).toLocaleString('en-IN') + '</td>' +
          '<td>' + (p.region || '—') + '</td>' +
          '<td>' + badge(p.status) + '</td></tr>';
      });
      // Make rows clickable
      tbody.querySelectorAll('tr').forEach(function(row, idx) {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function() { loadPolicyDetail(policies[idx].id); });
      });
    } catch(e) { console.error('Policies error', e); }
  }

  // ── Create Policy (Manager+) ──
  $('policy-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var msg = $('pol-msg');
    msg.textContent = 'Creating...'; msg.style.color = 'var(--text-muted)';
    try {
      await apiFetch('/policies', {
        method: 'POST',
        body: JSON.stringify({
          policy_number: $('pol-number').value,
          holder_name: $('pol-holder').value,
          holder_email: $('pol-email').value,
          policy_type: $('pol-type').value,
          premium_amount: parseFloat($('pol-premium').value),
          coverage_amount: parseFloat($('pol-coverage').value),
          start_date: $('pol-start').value,
          end_date: $('pol-end').value,
          region: $('pol-region').value
        })
      });
      msg.textContent = '✅ Policy created!'; msg.style.color = 'var(--accent)';
      $('policy-form').reset();
      loadPolicies();
    } catch(err) {
      msg.textContent = '❌ ' + err.message; msg.style.color = 'var(--error)';
    }
  });

  var currentPolicyId = null;
  async function loadPolicyDetail(id) {
    currentPolicyId = id;
    try {
      var p = await apiFetch('/policies/' + id);
      showView('policy-detail-view');
      $('pd-number').textContent = p.policy_number;
      $('pd-type').textContent = p.policy_type.toUpperCase();
      $('pd-status').innerHTML = badge(p.status);
      $('pd-region').textContent = p.region || '—';
      $('pd-holder').textContent = p.holder_name;
      $('pd-email').textContent = p.holder_email || '—';
      $('pd-premium').textContent = '₹' + Number(p.premium_amount).toLocaleString('en-IN');
      $('pd-coverage').textContent = '₹' + Number(p.coverage_amount).toLocaleString('en-IN');
      $('pd-start').textContent = p.start_date ? p.start_date.split('T')[0] : '—';
      $('pd-end').textContent = p.end_date ? p.end_date.split('T')[0] : '—';
      // Show actions for manager+ (status update), delete only for admin
      $('pd-actions').style.display = (['admin','manager'].indexOf(state.role) > -1) ? 'block' : 'none';
      $('btn-cancel-policy').style.display = (state.role === 'admin') ? 'inline-block' : 'none';
      $('pd-new-status').value = p.status;
      $('pd-msg').textContent = '';
    } catch(e) { console.error('Policy detail error', e); }
  }

  // ── Update Policy Status (Manager+) ──
  $('btn-update-policy').addEventListener('click', async function() {
    if (!currentPolicyId) return;
    try {
      await apiFetch('/policies/' + currentPolicyId, {
        method: 'PUT',
        body: JSON.stringify({ status: $('pd-new-status').value })
      });
      $('pd-msg').textContent = '✅ Status updated'; $('pd-msg').style.color = 'var(--accent)';
      $('pd-status').innerHTML = badge($('pd-new-status').value);
    } catch(err) {
      $('pd-msg').textContent = '❌ ' + err.message; $('pd-msg').style.color = 'var(--error)';
    }
  });

  // ── Delete Policy (Admin) ──
  $('btn-cancel-policy').addEventListener('click', async function() {
    if (!currentPolicyId || !confirm('Delete this policy?')) return;
    try {
      await apiFetch('/policies/' + currentPolicyId, { method: 'DELETE' });
      $('pd-msg').textContent = '✅ Policy deleted'; $('pd-msg').style.color = 'var(--accent)';
      $('pd-status').innerHTML = badge('cancelled');
    } catch(err) {
      $('pd-msg').textContent = '❌ ' + err.message; $('pd-msg').style.color = 'var(--error)';
    }
  });

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
          '<td>₹' + Number(c.claim_amount).toLocaleString('en-IN') + '</td>' +
          '<td>' + badge(c.status) + '</td></tr>';
      });
      // Make rows clickable
      tbody.querySelectorAll('tr').forEach(function(row, idx) {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function() { loadClaimDetail(claims[idx].id); });
      });
    } catch(e) { console.error('Claims error', e); }
  }

  // ── Submit Claim ──
  $('claim-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var msg = $('claim-msg');
    msg.textContent = 'Submitting...'; msg.style.color = 'var(--text-muted)';
    try {
      await apiFetch('/claims', {
        method: 'POST',
        body: JSON.stringify({
          claim_number: 'CLM-' + Date.now(),
          policy_id: parseInt($('claim-policy-id').value),
          claimant_name: $('claim-claimant').value,
          claim_type: $('claim-type').value,
          description: $('claim-desc').value,
          claim_amount: parseFloat($('claim-amount').value)
        })
      });
      msg.textContent = '✅ Claim submitted successfully!'; msg.style.color = 'var(--accent)';
      $('claim-form').reset();
      loadClaims();
    } catch(err) {
      msg.textContent = '❌ ' + err.message; msg.style.color = 'var(--error)';
    }
  });

  var currentClaimId = null;
  async function loadClaimDetail(id) {
    currentClaimId = id;
    try {
      var c = await apiFetch('/claims/' + id);
      showView('claim-detail-view');
      $('cd-number').textContent = c.claim_number;
      $('cd-type').textContent = c.claim_type;
      $('cd-status').innerHTML = badge(c.status);
      $('cd-amount').textContent = '₹' + Number(c.claim_amount).toLocaleString('en-IN');
      $('cd-claimant').textContent = c.claimant_name;
      $('cd-desc').textContent = c.description || '—';
      $('cd-submitted').textContent = c.submitted_at ? new Date(c.submitted_at).toLocaleString() : '—';
      $('cd-resolved').textContent = c.resolved_at ? new Date(c.resolved_at).toLocaleString() : 'Pending';
      // Show status update for manager+
      $('cd-actions').style.display = (['admin','manager'].indexOf(state.role) > -1) ? 'block' : 'none';
      $('cd-new-status').value = c.status;
      $('cd-msg').textContent = '';
    } catch(e) { console.error('Claim detail error', e); }
  }

  // ── Update Claim Status (Manager+) ──
  $('btn-update-claim').addEventListener('click', async function() {
    if (!currentClaimId) return;
    try {
      await apiFetch('/claims/' + currentClaimId, {
        method: 'PUT',
        body: JSON.stringify({ status: $('cd-new-status').value })
      });
      $('cd-msg').textContent = '✅ Status updated'; $('cd-msg').style.color = 'var(--accent)';
      $('cd-status').innerHTML = badge($('cd-new-status').value);
    } catch(err) {
      $('cd-msg').textContent = '❌ ' + err.message; $('cd-msg').style.color = 'var(--error)';
    }
  });

  // ── Reports ──
  async function loadReports() {
    try {
      var report = await apiFetch('/reports/executive');
      $('stat-revenue').textContent = '₹' + Number(report.total_revenue).toLocaleString('en-IN');
      $('stat-payout').textContent = '₹' + Number(report.total_payout).toLocaleString('en-IN');
      var tbody = $('region-table-body');
      tbody.innerHTML = '';
      report.region_breakdown.forEach(function(r) {
        tbody.innerHTML += '<tr><td>' + r.region + '</td><td>' + r.count + '</td><td>₹' + Number(r.revenue).toLocaleString('en-IN') + '</td></tr>';
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
        tbody.innerHTML += '<tr><td>' + u.id + '</td><td>' + u.username + '</td><td>' + u.full_name + '</td><td>' + u.email + '</td>' +
          '<td>' + badge(u.role, 'role') + '</td>' +
          '<td>' +
            '<select data-uid="' + u.id + '" class="role-select" style="padding:0.3rem;border-radius:4px;border:1px solid #475569;background:#0f172a;color:var(--text-main);margin-right:0.5rem;">' +
              '<option value="staff"' + (u.role==='staff'?' selected':'') + '>Staff</option>' +
              '<option value="manager"' + (u.role==='manager'?' selected':'') + '>Manager</option>' +
              '<option value="admin"' + (u.role==='admin'?' selected':'') + '>Admin</option>' +
            '</select>' +
            '<button class="btn-delete-user" data-uid="' + u.id + '" style="background:#ef4444;color:#fff;border:none;padding:0.3rem 0.8rem;border-radius:4px;cursor:pointer;">Delete</button>' +
          '</td></tr>';
      });
      // Role change handlers
      tbody.querySelectorAll('.role-select').forEach(function(sel) {
        sel.addEventListener('change', async function() {
          try {
            await apiFetch('/users/' + sel.dataset.uid + '/role', {
              method: 'PUT', body: JSON.stringify({ role: sel.value })
            });
            loadUsers();
          } catch(e) { console.error('Role update error', e); }
        });
      });
      // Delete handlers
      tbody.querySelectorAll('.btn-delete-user').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          if (!confirm('Delete user #' + btn.dataset.uid + '?')) return;
          try {
            await apiFetch('/users/' + btn.dataset.uid, { method: 'DELETE' });
            loadUsers();
          } catch(e) { console.error('Delete user error', e); }
        });
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

  // Back buttons for detail views
  $('back-to-policies').addEventListener('click', function(e) { e.preventDefault(); showView('policies-view'); loadPolicies(); });
  $('back-to-claims').addEventListener('click', function(e) { e.preventDefault(); showView('claims-view'); loadClaims(); });

  // ── Init ──
  if (state.token) { showView('dashboard-view'); loadDashboard(); }
  else { showView('login-view'); }
})();
