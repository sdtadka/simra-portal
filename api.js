/*******************************************************************
 * api.js : shared helper for all GitHub-hosted pages.
 * Sirf WEB_APP_URL badalna hai (Apps Script deploy ke baad).
 *******************************************************************/
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxm-4no2hsLqCDXo6seN9DROL3x9ERYG6msiG6sZ4j1zB6bPdW3zkcAHn6M6PemWWvz0g/exec';
const API_TIMEOUT_MS = 20000;

function apiCall(action, args) {
  return new Promise(function (resolve, reject) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(function () {
      if (ctrl) ctrl.abort();
      reject(new Error('Server did not respond in time. Please try again.'));
    }, API_TIMEOUT_MS);
    fetch(WEB_APP_URL, {
      method: 'POST',
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

function goPage(file) { window.location.href = file; }

const ROLE_PAGE = {
  super_admin: 'super_admin.html',
  admin: 'admin.html',
  member: 'member.html',
  imam: 'imam.html',
  user: 'user.html'
};
