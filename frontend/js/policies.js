import { apiFetch } from './api.js';

export const loadPolicies = async () => {
  try {
    const policies = await apiFetch('/policies');
    const tbody = document.getElementById('policies-table-body');
    tbody.innerHTML = '';
    policies.forEach(p => {
      const row = `<tr>
        <td>${p.policy_number}</td>
        <td>${p.holder_name}</td>
        <td>${p.policy_type.toUpperCase()}</td>
        <td><span class="badge status-${p.status}">${p.status}</span></td>
      </tr>`;
      tbody.innerHTML += row;
    });
  } catch(err) {
    console.error('Failed to load policies', err);
  }
};
