/*******************************************************************
 * receipt.js : Centralized Receipt Print & Download Logic for all Roles.
 * v2 — Logo fix (Blogger + Google Drive + CORS proxy) + Button feedback
 *******************************************************************/

// HTML2Canvas load
if (!document.getElementById('html2canvas-script')) {
  const s1 = document.createElement('script');
  s1.id = 'html2canvas-script';
  s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  document.head.appendChild(s1);
}

// Receipt CSS
if (!document.getElementById('receipt-css')) {
  const style = document.createElement('style');
  style.id = 'receipt-css';
  style.innerHTML = `
    .rc { background:#fff; border:2px solid #1b4332; border-radius:8px; padding:10px 12px; font-family:Arial,Helvetica,sans-serif; font-weight:700; font-size:11px; color:#000; width:100%; max-width:195mm; margin:0 auto; box-sizing:border-box; }
    .rc-head { display:grid; grid-template-columns:60px 1fr 60px; align-items:center; gap:8px; border-bottom:2px solid #1b4332; padding-bottom:5px; margin-bottom:5px; }
    .rc-head .lg { width:56px; height:56px; border-radius:50%; border:2px solid #1b4332; display:grid; place-items:center; overflow:hidden; }
    .rc-head .lg img { width:100%; height:100%; object-fit:cover; }
    .rc-head .ttl { text-align:center; }
    .rc-head h2 { font-size:15px; font-weight:900; text-transform:uppercase; }
    .rc-head p { font-size:9.5px; font-weight:700; }
    .rc-meta { display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px; border:1px solid #000; padding:3px 6px; margin-bottom:5px; font-size:10px; }
    .rc-mid { display:grid; grid-template-columns:1.3fr 1fr; gap:5px; margin-bottom:5px; }
    .rc-box { border:1px solid #000; padding:4px 6px; }
    .rc-box div { display:flex; justify-content:space-between; gap:6px; padding:1px 0; border-bottom:1px dotted #777; font-size:9.5px; }
    .rc-box div:last-child { border:0; }
    .rc-box span { font-weight:700; text-transform:uppercase; }
    .rc-box b { text-align:right; font-weight:900; }
    .rc-box .rcid { font-size:12px; }
    .rc-sum { display:grid; grid-template-columns:1fr 1fr; gap:4px; }
    .rc-sum div { border:1px solid #000; padding:3px; text-align:center; font-size:8.5px; }
    .rc-sum b { display:block; font-size:11px; font-weight:900; }
    table.rt { width:100%; border-collapse:collapse; font-size:9px; border:1px solid #000; }
    table.rt th { background:#1b4332; color:#fff; padding:2px 3px; text-align:left; font-size:8.5px; font-weight:900; }
    table.rt td { padding:1px 3px; border-bottom:1px solid #999; font-weight:700; white-space:nowrap; }
    .rc-sig { display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px; gap:10px; }
    .rc-sig>div { width:33%; text-align:center; font-size:9px; }
    .rc-sig .si { height:34px; display:flex; align-items:flex-end; justify-content:center; }
    .rc-sig .si img { max-height:34px; max-width:130px; object-fit:contain; }
    .rc-sig .ln { border-bottom:1px solid #000; margin:2px 0; }
    .rc-sig b { display:block; font-size:9px; font-weight:900; }
    .rc-sig .seal-img img { max-height:52px; max-width:80px; object-fit:contain; opacity:.85; }

    /* Button feedback transitions */
    .noprint { transition: background .25s ease, opacity .2s ease, transform .1s ease; }
    .noprint:active:not(:disabled) { transform: scale(0.97); }

    @media print {
      @page { size: A4 portrait; margin: 5mm; }
      html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
      body * { visibility: hidden !important; }
      #ov, #ov * { visibility: visible !important; }
      #rc, #rc * { visibility: visible !important; }
      #ov { position: absolute !important; left: 0 !important; top: 0 !important; background: none !important; display: block !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; width: 100% !important; height: auto !important; }
      #ov .box { box-shadow: none !important; max-height: none !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; border-radius: 0 !important; position: static !important; transform: none !important; }
      .noprint { display: none !important; }
      #rc { width: 100% !important; max-width: 195mm !important; border: 1.5px solid #1b4332 !important; padding: 4mm !important; margin: 0 auto !important; box-sizing: border-box !important; page-break-inside: avoid !important; page-break-after: avoid !important; background: #fff !important; }
      #rc * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  `;
  document.head.appendChild(style);
}

/* =================================================================
 * IMAGE HELPERS — Blogger, Google Drive, koi bhi URL → Base64
 * ================================================================= */

// Blob → Data URL
function _blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Fetch with timeout
function _fetchWithTimeout(url, opts, ms) {
  return Promise.race([
    fetch(url, opts),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
  ]);
}

// Google Drive URL → CORS-friendly URL
function _normalizeDriveUrl(url) {
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/?#]+)/,
    /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&#]+)/,
    /drive\.google\.com\/open\?(?:[^#]*&)?id=([^&#]+)/,
    /drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([^&#]+)/,
    /docs\.google\.com\/uc\?(?:[^#]*&)?id=([^&#]+)/,
    /lh3\.googleusercontent\.com\/d\/([^/=?#]+)/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) {
      return 'https://lh3.googleusercontent.com/d/' + m[1] + '=w1000';
    }
  }
  return null;
}

// MAIN: Koi bhi image URL → base64 (5-level fallback)
async function _imageToDataUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  const originalUrl = url;

  // 1) Google Drive ko normalize karo
  const driveUrl = _normalizeDriveUrl(url);
  if (driveUrl) url = driveUrl;

  // 2) Direct fetch
  try {
    const r = await _fetchWithTimeout(url, { mode: 'cors', credentials: 'omit' }, 5000);
    if (r.ok) {
      const blob = await r.blob();
      if (blob.size > 50) return await _blobToDataUrl(blob);
    }
  } catch (e) { /* continue */ }

  // 3) Canvas with crossOrigin
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const t = setTimeout(() => reject(new Error('timeout')), 5000);
      img.onload = () => {
        clearTimeout(t);
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          resolve(c.toDataURL('image/png'));
        } catch (err) { reject(err); }
      };
      img.onerror = () => { clearTimeout(t); reject(new Error('load fail')); };
      img.src = url;
    });
  } catch (e) { /* continue */ }

  // 4) weserv.nl proxy (sabse reliable)
  try {
    const clean = url.replace(/^https?:\/\//, '');
    const proxy = 'https://images.weserv.nl/?url=' + encodeURIComponent(clean) + '&w=1000&output=png';
    const r = await _fetchWithTimeout(proxy, { mode: 'cors' }, 6000);
    if (r.ok) {
      const blob = await r.blob();
      if (blob.size > 50) return await _blobToDataUrl(blob);
    }
  } catch (e) { /* continue */ }

  // 5) allorigins proxy
  try {
    const proxy = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    const r = await _fetchWithTimeout(proxy, { mode: 'cors' }, 6000);
    if (r.ok) {
      const blob = await r.blob();
      if (blob.size > 50) return await _blobToDataUrl(blob);
    }
  } catch (e) { /* continue */ }

  // 6) corsproxy.io (last resort)
  try {
    const proxy = 'https://corsproxy.io/?' + encodeURIComponent(url);
    const r = await _fetchWithTimeout(proxy, { mode: 'cors' }, 6000);
    if (r.ok) {
      const blob = await r.blob();
      if (blob.size > 50) return await _blobToDataUrl(blob);
    }
  } catch (e) { /* continue */ }

  console.warn('Image fetch failed (all methods):', originalUrl);
  return url; // fallback: original URL (may skip in JPG but won't crash)
}

/* =================================================================
 * TOAST HELPER — agar page pe toast() function na ho
 * ================================================================= */
function _dlToast(msg, color) {
  if (typeof toast === 'function') { toast(msg); return; }
  let t = document.getElementById('_dl_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_dl_toast';
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.3);max-width:90vw;text-align:center;font-family:system-ui,sans-serif;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = color || '#0f172a';
  t.style.display = 'block';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => { t.style.display = 'none'; }, 3500);
}

/* =================================================================
 * MAIN RECEIPT FUNCTION
 * ================================================================= */
async function openReceipt(id) {
  if (typeof api !== 'function' || typeof modal !== 'function') {
    return alert('System error: API or Modal function missing.');
  }

  const role = (typeof ME !== 'undefined' && ME && ME.role) ? ME.role : 'user';
  const apiAction = (role === 'super_admin' || role === 'admin') ? 'apiSuperReceipt' : 'apiReceiptView';

  try {
    const r = await api(apiAction, id);
    const o = r.org, p = r.person;
    const logo = o.logo ? `<img src="${esc(o.logo)}" alt="" onerror="this.remove()">` : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 21V11.5C3.5 7 7.3 4 12 4s8.5 3 8.5 7.5V21"/><path d="M2 21h20"/><path d="M12 2v2"/></svg>';
    const seal = o.seal ? `<img src="${esc(o.seal)}" alt="" onerror="this.remove()">` : '';

    const rowsHtml = r.rows.map(x => `<tr>
      <td>${x.no}</td><td>${esc(x.date)}</td><td>${esc(x.mode)}</td><td>${esc(x.txnRef || '—')}</td>
      <td>${esc(x.collector)}</td>
      <td style="text-align:right">${x.reversal ? '−' : ''}${inr(Math.abs(x.amount))}</td>
      <td style="text-align:right">${inr(x.balanceAfter)}</td></tr>`).join('');

    const html = `
      <div class="rc" id="rc">
        <div class="rc-head">
          <div class="lg">${logo}</div>
          <div class="ttl"><h2>${esc(o.name)}</h2><p>${esc(o.address)}${o.reg ? ' · ' + esc(o.reg) : ''}</p></div>
          <div class="lg">${logo}</div>
        </div>
        <div class="rc-meta">
          <span>Receipt: <b>${esc(r.receiptId)}</b></span>
          <span>Date: <b>${esc(r.issued)}</b></span>
          <span>Year: <b>${r.year}</b></span>
        </div>
        <div class="rc-mid">
          <div class="rc-box">
            <div><span>Application ID</span><b class="rcid">${esc(p.appNo)}</b></div>
            <div><span>Name</span><b>${esc(p.name)}</b></div>
            <div><span>Father's name</span><b>${esc(p.father || '—')}</b></div>
            <div><span>Mobile</span><b>${esc(p.mobile || '—')}</b></div>
            <div><span>Address</span><b>${esc(p.address || '—')}</b></div>
          </div>
          <div class="rc-sum">
            <div><span>Total due</span><b>${inr(r.due)}</b></div>
            <div><span>Total paid</span><b>${inr(r.paid)}</b></div>
            <div><span>Balance</span><b>${inr(r.balance)}</b></div>
            <div><span>Transactions</span><b>${r.rows.length}</b></div>
            ${r.penalty > 0 ? `<div style="grid-column:1/-1;border:1px solid #b42328;background:#fff5f5;color:#b42328"><span>Penalty Included</span><b>${inr(r.penalty)}</b></div>` : ''}
          </div>
        </div>
        <table class="rt">
          <thead><tr><th>#</th><th>Date</th><th>Mode</th><th>Txn no.</th><th>Collector</th><th style="text-align:right">Amount</th><th style="text-align:right">Balance</th></tr></thead>
          <tbody>${rowsHtml || '<tr><td colspan="7">No transactions.</td></tr>'}</tbody>
        </table>
        <div class="rc-sig">
          <div><div class="si">${o.sigCollector ? `<img src="${esc(o.sigCollector)}" alt="" onerror="this.remove()">` : ''}</div><div class="ln"></div><b>${esc(r.issuedBy || '—')}</b>(Collector)</div>
          <div class="seal-img"><div class="si">${seal}</div></div>
          <div><div class="si">${o.sigAuth ? `<img src="${esc(o.sigAuth)}" alt="" onerror="this.remove()">` : ''}</div><div class="ln"></div><b>${esc(o.name)}</b>Authorised</div>
        </div>
      </div>
    `;

    modal('Receipt', html, `
      <button class="btn light noprint" onclick="closeM()">Close</button>
      <button class="btn noprint" style="background:var(--blue)" onclick="downloadReceiptJpg(this)">Download JPG</button>
      <button class="btn noprint" onclick="window.print()">Print / PDF</button>
    `, true);

  } catch (e) {
    if (e.message !== 'expired') alert(e.message || 'Error loading receipt.');
  }
}

/* =================================================================
 * JPG DOWNLOAD — Full feedback + logo fix
 * ================================================================= */
async function downloadReceiptJpg(btn) {
  if (btn && btn.disabled) return;

  const element = document.getElementById('rc');
  if (!element) return alert('Receipt not found.');

  if (typeof html2canvas === 'undefined') {
    return alert('Download library load ho rahi hai... 2 second baad try karein.');
  }

  // --- LOCK BUTTON + VISUAL FEEDBACK ---
  const originalHtml = btn ? btn.innerHTML : '';
  const originalBg   = btn ? (btn.style.background || 'var(--blue)') : '';
  if (btn) {
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.75';
    btn.style.cursor = 'wait';
    btn.style.background = 'var(--gold)';
    btn.innerHTML = '⏳ Downloading...';
  }
  _dlToast('⏳ Receipt download ho raha hai...', '#b45309');

  // --- CLONE RECEIPT OFFSREEN ---
  const clone = element.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.position = 'fixed';
  clone.style.left = '-10000px';
  clone.style.top = '0';
  clone.style.width = element.offsetWidth + 'px';
  clone.style.background = '#fff';
  document.body.appendChild(clone);

  try {
    // --- CONVERT ALL IMAGES TO BASE64 (logo fix) ---
    const imgs = [...clone.querySelectorAll('img')];
    if (imgs.length) {
      await Promise.all(imgs.map(async (img) => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          const b64 = await _imageToDataUrl(src);
          if (b64) img.src = b64;
        }
      }));
    }

    // --- WAIT FOR ALL IMAGES TO LOAD (max 5 sec each) ---
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(resolve => {
        const t = setTimeout(resolve, 5000);
        img.onload = () => { clearTimeout(t); resolve(); };
        img.onerror = () => { clearTimeout(t); resolve(); };
      });
    }));

    // --- CAPTURE ---
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 8000
    });

    // --- DOWNLOAD ---
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = imgData;
    a.download = 'Receipt_' + (Date.now()) + '.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();

    // --- SUCCESS FEEDBACK ---
    if (btn) {
      btn.innerHTML = '✅ Downloaded!';
      btn.style.background = 'var(--green)';
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        btn.style.pointerEvents = 'auto';
        btn.style.background = originalBg;
      }, 2000);
    }
    _dlToast('✅ Receipt download ho gaya! Check Downloads folder.', '#12a150');

  } catch (e) {
    // --- FAIL FEEDBACK ---
    if (btn) {
      btn.innerHTML = '❌ Failed — Retry';
      btn.style.background = 'var(--red)';
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        btn.style.pointerEvents = 'auto';
        btn.style.background = originalBg;
      }, 2500);
    }
    _dlToast('❌ Download fail: ' + (e.message || 'Unknown error'), '#e5484d');
    console.error('[Receipt JPG] fail:', e);

  } finally {
    clone.remove();
  }
}
