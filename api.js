/*******************************************************************
 * api.js : shared helper for all GitHub-hosted pages.
 * Sirf WEB_APP_URL badalna hai (Apps Script deploy ke baad).
 *******************************************************************/
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzJFIJBE-RRqlusPcLxdfbWCMksT6Viwam-24KM_d8WFuCkLD9E3W2ygS6Y7TH8t-y6/exec';
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

function goPage(file) { window.location.replace(file); } /* replace: login page history mein nahi rehta */

const ROLE_PAGE = {
  super_admin: 'super_admin.html',
  admin: 'admin.html',
  member: 'member.html',
  imam: 'imam.html',
  user: 'user.html'
};


/* ============ LOCAL CACHE (fast screens + offline view) ============
   Sirf read-only API calls cache hote hain. Koi bhi write call successful
   hone par cache clear ho jata hai, taki purana data na dikhe. */
const CACHE_KEY = 'pl_cache';
const CACHE_FRESH_MS = 5 * 60 * 1000;
const READ_ACTIONS = {
  apiMyPerson:1, apiImamOverview:1, apiUserOverview:1, apiMemberOverview:1, apiDashboard:1,
  apiSuperOverview:1, apiPersonDirectory:1, apiPersonView:1, apiPersonSections:1, apiReceiptView:1,
  apiSectionList:1, apiPostList:1, apiNoticeList:1, apiListPeople:1, apiSuperPeople:1,
  apiGetPerson:1, apiSuperGetPerson:1, apiSuperGetOrg:1, apiExpenseList:1, apiExpenseView:1,
  apiPenaltyList:1, apiListAdmins:1, apiListRates:1, apiMyProfile:1, apiAdminGetPhoto:1,
  apiGetIcons:1, apiSalaryTotal:1, apiGetSalary:1, apiSearch:1, apiSuperReceipt:1
};
function cacheStore_() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (e) { return {}; } }
function cacheSave_(o) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(o)); } catch (e) {} }
function cacheClear() { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} }

async function cachedCall_(fn, args) {
  if (!READ_ACTIONS[fn]) {
    const r = await apiCall(fn, args);
    if (r && r.ok !== false) cacheClear();
    return r;
  }
  const key = fn + '|' + JSON.stringify(args.slice(1));
  const hit = cacheStore_()[key];
  if (hit && Date.now() - hit.t < CACHE_FRESH_MS) return hit.r;
  if (hit) { refreshInBackground_(fn, args, key, hit.r); return hit.r; } /* stale: turant dikhao, background mein update */
  try {
    const r = await apiCall(fn, args);
    if (r && r.ok !== false) { const s = cacheStore_(); s[key] = { t: Date.now(), r: r }; cacheSave_(s); }
    return r;
  } catch (e) { throw e; }
}

async function refreshInBackground_(fn, args, key, oldR) {
  try {
    const r = await apiCall(fn, args);
    if (!r || r.ok === false) return;
    const s = cacheStore_(); s[key] = { t: Date.now(), r: r }; cacheSave_(s);
    if (JSON.stringify(r) !== JSON.stringify(oldR) && typeof go === 'function' && window.D && !document.querySelector('#ov.open')) {
      go(D.view, D.arg, true); /* data badla: screen refresh, naya history entry nahi */
    }
  } catch (e) { /* offline: purana cache hi dikhega */ }
}
