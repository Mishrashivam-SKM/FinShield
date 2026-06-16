import { apiFetch } from './api.js';

export const loadSystemMetrics = async () => {
  try {
    const metrics = await apiFetch('/system/metrics');
    document.getElementById('stat-cpu').innerText = metrics.cpu_cores;
    document.getElementById('stat-mem').innerText = metrics.free_memory_mb;
  } catch(err) {
    console.error('Failed to load system metrics', err);
  }
};
