import { apiFetch } from './api.js';

export const loadClaims = async () => {
  try {
    const claims = await apiFetch('/claims');
    const tbody = document.getElementById('claims-table-body');
    tbody.innerHTML = '';
    claims.forEach(c => {
      const row = `<tr>
        <td>${c.claim_number}</td>
        <td>${c.claimant_name}</td>
        <td>${c.claim_type}</td>
        <td>$${c.claim_amount}</td>
        <td><span class="badge status-${c.status}">${c.status}</span></td>
      </tr>`;
      tbody.innerHTML += row;
    });
  } catch(err) {
    console.error('Failed to load claims', err);
  }
};
