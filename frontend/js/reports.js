import { apiFetch } from './api.js';

export const loadReports = async () => {
  try {
    const reports = await apiFetch('/reports/executive');
    document.getElementById('stat-revenue').innerText = '$' + reports.total_revenue;
    document.getElementById('stat-payout').innerText = '$' + reports.total_payout;
  } catch(err) {
    console.error('Failed to load reports', err);
  }
};
