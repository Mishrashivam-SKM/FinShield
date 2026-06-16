import { apiFetch } from './api.js';

export const loadDashboardStats = async () => {
  try {
    const stats = await apiFetch('/dashboard/stats');
    document.getElementById('stat-policies').innerText = stats.total_policies;
    document.getElementById('stat-claims').innerText = stats.active_claims;
  } catch(err) {
    console.error('Failed to update stats', err);
  }
};
