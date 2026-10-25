/*******************************************************************
 * api.js : sab pages ke liye ek hi server call.
 * Yahan sirf WEB_APP_URL badalna hai (Apps Script deploy ke baad).
 *******************************************************************/
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwgoRQ1QBkFO7ZCIWgdGXFYnFjfZhZyE_9GzVEznqkfnHDculdhfFDEimhgENe_-Gju/exec';
const API_TIMEOUT_MS = 20000;

/* Ek action ko server par bhejta hai. Jawab JSON object hota hai. */
function apiCall(action, args) {
  return new Promise(function (resolve, reject) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(function () {
      if (ctrl) ctrl.abort();
      reject(new Error('Server did not respond in time. Please try again.'));
    }, API_TIMEOUT_MS);
    fetch(WEB_APP_URL, {
      method: 'POST',
      /* text/plain se browser pehle "preflight" nahin bhejta, isliye call tez hoti hai */
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, args: args || [] }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) { return r.json(); })
      .then(function (j) { clearTimeout(timer); resolve(j); })
      .catch(function (e) {
        clearTimeout(timer);
        reject(new Error(e && e.name === 'AbortError' ? 'Server timeout.' : 'Network error. Check internet and try again.'));
      });
  });
}

/* Page ko doosre page par bhejta hai (same GitHub folder mein relative path) */
function goPage(file) { window.location.href = file; }

/* Role ke hisaab se page */
const ROLE_PAGE = { super_admin: 'super_admin.html', admin: 'admin.html', member: 'member.html', imam: 'imam.html', user: 'user.html' };
