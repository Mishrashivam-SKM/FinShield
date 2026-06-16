import { apiFetch } from './api.js';
import { showView } from './app.js';
import { loadDashboardStats } from './dashboard.js';

export const handleLogin = async (username, password) => {
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    document.getElementById('login-error').innerText = '';
    
    // Auth State transition
    window.appState.token = data.token;
    window.appState.role = data.role;
    
    showView('dashboard-view');
    loadDashboardStats();
  } catch (err) {
    document.getElementById('login-error').innerText = err.message || 'Login failed';
  }
};

export const handleLogout = () => {
  window.appState.token = null;
  window.appState.role = null;
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  showView('login-view');
};
