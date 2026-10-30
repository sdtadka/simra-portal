/*******************************************************************
 * receipt.js : Centralized Receipt Print & Download Logic for all Roles.
 * v3 — Premium Layout (Urdu Header, Right Logo, Card Style) 
 *******************************************************************/

// HTML2Canvas load
if (!document.getElementById('html2canvas-script')) {
  const s1 = document.createElement('script');
  s1.id = 'html2canvas-script';
  s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  document.head.appendChild(s1);
}

// Premium Receipt CSS
if (!document.getElementById('receipt-css')) {
  const style = document.createElement('style');
  style.id = 'receipt-css';
  style.innerHTML = `
    /* --- MAIN RECEIPT BOX --- */
    .rc { 
      background: #fff; 
      border: 3px solid #0f4a9e; 
      border-radius: 12px; 
      padding: 15px; 
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif; 
      color: #000; 
      width: 100%; 
      max-width: 210mm; 
      margin: 0 auto; 
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    /* --- HEADER --- */
    .rc-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      position: relative;
      padding-bottom: 15px;
      border-bottom: 2px solid #d4af37; /* Gold line */
      margin-bottom: 10px;
    }
    .rc-header-left {
      flex: 1;
      padding-right: 20px;
      text-align: center;
    }
    .rc-urdu {
      font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;
      font-size: 32px;
      color: #006633; /* Green */
      font-weight: bold;
      line-height: 1.2;
      margin-bottom: -5px;
    }
    .rc-eng-banner {
      background: #0f4a9e;
      color: #fff;
      display: inline-block;
      padding: 4px 20px;
      border-radius: 20px;
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .rc-address {
      font-size: 12px;
      font-weight: 700;
      color: #0f4a9e;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .rc-reg-banner {
      background: #006633;
      color: #fff;
      display: inline-block;
      padding: 3px 25px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: 700;
      position: relative;
    }
    
    /* --- LOGO (Right Side) --- */
    .rc-logo {
      width: 90px;
      height: 90px;
      flex: 0 0 90px;
      border-radius: 50%;
      border: 3px solid #006633;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      position: relative;
      z-index: 2;
    }
    .rc-logo::before {
      content: '';
      position: absolute;
      inset: 3px;
      border: 1px dashed #d4af37;
      border-radius: 50%;
    }
    .rc-logo img { width: 100%; height: 100%; object-fit: cover; }

    /* --- META BAR --- */
    .rc-meta-bar {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #0f4a9e;
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 12px;
    }
    .rc-meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .rc-meta-icon {
      width: 32px;
      height: 32px;
      background: #0f4a9e;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .rc-meta-icon svg { width: 16px; height: 16px; fill: currentColor; }
    .rc-meta-text span { display: block; font-size: 10px; color: #555; font-weight: 700; text-transform: uppercase; }
    .rc-meta-text b { display: block; font-size: 16px; color: #0f4a9e; font-weight: 900; }

    /* --- MIDDLE SECTION (Left: Person, Right: Money) --- */
    .rc-mid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }

    /* LEFT: Person Details */
    .rc-person {
      border: 2px solid #0f4a9e;
      border-radius: 8px;
      overflow: hidden;
    }
    .rc-app-id-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f4a9e;
      color: #fff;
      padding: 6px 10px;
    }
    .rc-app-id-row span { font-size: 14px; font-weight: 700; text-transform: uppercase; }
    .rc-app-id-row b { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
    .rc-person-rows { padding: 5px 10px; }
    .rc-p-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dashed #bcd3ff;
      font-size: 12px;
    }
    .rc-p-row:last-child { border: none; }
    .rc-p-row span { font-weight: 700; color: #333; text-transform: uppercase; }
    .rc-p-row b { font-weight: 800; color: #000; text-align: right; }

    /* RIGHT: Money Summary */
    .rc-money-box { display: flex; flex-direction: column; gap: 8px; }
    .rc-money-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    
    .rc-money-card {
      border: 2px solid;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .rc-m-icon {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex: 0 0 34px;
    }
    .rc-m-icon svg { width: 18px; height: 18px; fill: currentColor; }
    .rc-m-text span { display: block; font-size: 11px; font-weight: 700; }
    .rc-m-text b { display: block; font-size: 16px; font-weight: 900; }

    /* Colors for cards */
    .card-due { border-color: #006633; background: #f0fdf4; }
    .card-due .rc-m-icon { background: #006633; }
    .card-due .rc-m-text span, .card-due .rc-m-text b { color: #006633; }

    .card-paid { border-color: #0f4a9e; background: #eff6ff; }
    .card-paid .rc-m-icon { background: #0f4a9e; }
    .card-paid .rc-m-text span, .card-paid .rc-m-text b { color: #0f4a9e; }

    .card-bal { border-color: #6b21a8; background: #faf5ff; }
    .card-bal .rc-m-icon { background: #6b21a8; }
    .card-bal .rc-m-text span, .card-bal .rc-m-text b { color: #6b21a8; }

    .card-txn { border-color: #c2410c; background: #fff7ed; }
    .card-txn .rc-m-icon { background: #c2410c; }
    .card-txn .rc-m-text span, .card-txn .rc-m-text b { color: #c2410c; }

    /* Penalty Box */
    .rc-penalty {
      border: 2px solid #e5484d;
      background: #fef2f2;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .rc-penalty .rc-m-icon { background: #e5484d; }
    .rc-penalty .rc-m-text span { color: #b91c1c; }
    .rc-penalty .rc-m-text b { color: #b91c1c; font-size: 18px; }

    /* --- TABLE --- */
    table.rc-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #0f4a9e;
      margin-bottom: 15px;
      border-radius: 8px;
      overflow: hidden;
    }
    table.rc-table th {
      background: #0f4a9e;
      color: #fff;
      padding: 8px;
      font-size: 13px;
      text-align: left;
      border-right: 1px solid #2d6cdb;
    }
    table.rc-table td {
      padding: 8px;
      font-size: 12px;
      border-bottom: 1px solid #bcd3ff;
      border-right: 1px solid #bcd3ff;
      font-weight: 600;
    }
    table.rc-table th:last-child, table.rc-table td:last-child { border-right: none; }
    table.rc-table tr:last-child td { border-bottom: none; }
    table.rc-table tr:nth-child(even) td { background: #f8fafc; }

    /* --- FOOTER --- */
    .rc-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 15px;
      margin-top: 10px;
    }
    .rc-sig {
      width: 40%;
      text-align: center;
    }
    .rc-sig-line { border-top: 2px solid #000; margin-bottom: 5px; }
    .rc-sig b { font-size: 13px; font-weight: 800; color: #0f4a9e; display: block; }
    .rc-sig span { font-size: 11px; font-weight: 600; color: #555; }
    
    .rc-seal { width: 20%; display: flex; justify-content: center; }
    .rc-seal img { max-height: 60px; max-width: 80px; object-fit: contain; opacity: 0.9; }

    /* --- BUTTON FEEDBACK --- */
    .noprint { transition: all 0.2s; }
    .noprint:active:not(:disabled) { transform: scale(0.95); }

    /* --- PRINT STYLES --- */
    @media print {
      @page { size: A4 portrait; margin: 5mm; }
      html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
      body * { visibility: hidden !important; }
      #ov, #ov * { visibility: visible !important; }
      #rc, #rc * { visibility: visible !important; }
      #ov { position: absolute !important; left: 0 !important; top: 0 !important; background: none !important; display: block !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; width: 100% !important; height: auto !important; }
      #ov .box { box-shadow: none !important; max-height: none !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; border-radius: 0 !important; position: static !important; transform: none !important; }
      .noprint { display: none !important; }
      #rc { width: 100% !important; max-width: 195mm !important; border: 3px solid #0f4a9e !important; padding: 10px !important; margin: 0 auto !important; page-break-inside: avoid !important; background: #fff !important; }
      #rc * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  `;
  document.head.appendChild(style);
}

/* =================================================================
 * IMAGE HELPERS — Blogger, Google Drive, koi bhi URL → Base64
 * ================================================================= */
function _blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function _fetchWithTimeout(url, opts, ms) {
  return Promise.race([
    fetch(url, opts),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
  ]);
}

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
    if (m && m[1]) return 'https://lh3.googleusercontent.com/d/' + m[1] + '=w1000';
  }
  return null;
}

async function _imageToDataUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  const originalUrl = url;
  const driveUrl = _normalizeDriveUrl(url);
  if (driveUrl) url = driveUrl;

  try {
    const r = await _fetchWithTimeout(url, { mode: 'cors', credentials: 'omit' }, 5000);
    if (r.ok) { const blob = await r.blob(); if (blob.size > 50) return await _blobToDataUrl(blob); }
  } catch (e) {}

  try {
    return await new Promise((resolve, reject) => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      const t = setTimeout(() => reject(new Error('timeout')), 5000);
      img.onload = () => { clearTimeout(t); try { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); resolve(c.toDataURL('image/png')); } catch (err) { reject(err); } };
      img.onerror = () => { clearTimeout(t); reject(new Error('load fail')); };
      img.src = url;
    });
  } catch (e) {}

  try {
    const clean = url.replace(/^https?:\/\//, '');
    const proxy = 'https://images.weserv.nl/?url=' + encodeURIComponent(clean) + '&w=1000&output=png';
    const r = await _fetchWithTimeout(proxy, { mode: 'cors' }, 6000);
    if (r.ok) { const blob = await r.blob(); if (blob.size > 50) return await _blobToDataUrl(blob); }
  } catch (e) {}

  try {
    const proxy = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    const r = await _fetchWithTimeout(proxy, { mode: 'cors' }, 6000);
    if (r.ok) { const blob = await r.blob(); if (blob.size > 50) return await _blobToDataUrl(blob); }
  } catch (e) {}

  console.warn('Image fetch failed:', originalUrl);
  return url;
}

/* =================================================================
 * TOAST HELPER
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
    
    // Logo & Seal
    const logo = o.logo ? `<img src="${esc(o.logo)}" alt="" onerror="this.remove()">` : '<span style="font-size:10px;color:#0f4a9e;font-weight:bold;">LOGO</span>';
    const seal = o.seal ? `<img src="${esc(o.seal)}" alt="" onerror="this.remove()">` : '';

    // Urdu Name (Hardcoded for now, aap apne hisaab se change kar sakte hain)
    const urduName = "مدرسہ فیضان مصطفیٰ"; 

    // Table Rows
    const rowsHtml = r.rows.map(x => `<tr>
      <td>${x.no}</td><td>${esc(x.date)}</td><td>${esc(x.mode)}</td><td>${esc(x.txnRef || '—')}</td>
      <td>${esc(x.collector)}</td>
      <td style="text-align:right;font-weight:900;">${x.reversal ? '−' : ''}${inr(Math.abs(x.amount))}</td>
      <td style="text-align:right;font-weight:900;">${inr(x.balanceAfter)}</td></tr>`).join('');

    // Icons for Meta & Money
    const icoReceipt = `<svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`;
    const icoCalendar = `<svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>`;
    const icoMoney = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c0 1.83-1.38 2.83-3.12 3.16z"/></svg>`;
    const icoChart = `<svg viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>`;
    const icoSwap = `<svg viewBox="0 0 24 24"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/></svg>`;
    const icoAlert = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
    const icoPin = `<svg viewBox="0 0 24 24" width="14" height="14" fill="#0f4a9e"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>`;

    const html = `
      <div class="rc" id="rc">
        
        <!-- HEADER -->
        <div class="rc-header">
          <div class="rc-header-left">
            <div class="rc-urdu">${urduName}</div>
            <div class="rc-eng-banner">${esc(o.name || 'MADRASA FAIZAN-E-MUSTAFA')}</div>
            <div class="rc-address">
              ${icoPin} ${esc(o.address || 'Ward 46, Simra, Dumra, Sitamarhi, Bihar, 843301')}
            </div>
            <div class="rc-reg-banner">Reg. No. ${esc(o.reg || 'STMS/2019/0786')}</div>
          </div>
          <div class="rc-logo">
            ${logo}
          </div>
        </div>

        <!-- META BAR -->
        <div class="rc-meta-bar">
          <div class="rc-meta-item">
            <div class="rc-meta-icon">${icoReceipt}</div>
            <div class="rc-meta-text"><span>Receipt:</span><b>${esc(r.receiptId)}</b></div>
          </div>
          <div class="rc-meta-item">
            <div class="rc-meta-icon">${icoCalendar}</div>
            <div class="rc-meta-text"><span>Date:</span><b>${esc(r.issued)}</b></div>
          </div>
          <div class="rc-meta-item">
            <div class="rc-meta-icon">${icoCalendar}</div>
            <div class="rc-meta-text"><span>Year:</span><b>${r.year}</b></div>
          </div>
        </div>

        <!-- MIDDLE: PERSON & MONEY -->
        <div class="rc-mid">
          
          <!-- LEFT: PERSON -->
          <div class="rc-person">
            <div class="rc-app-id-row">
              <span>Application ID</span>
              <b>${esc(p.appNo)}</b>
            </div>
            <div class="rc-person-rows">
              <div class="rc-p-row"><span>Name</span><b>${esc(p.name)}</b></div>
              <div class="rc-p-row"><span>Father's Name</span><b>${esc(p.father || '—')}</b></div>
              <div class="rc-p-row"><span>Mobile</span><b>${esc(p.mobile || '—')}</b></div>
              <div class="rc-p-row"><span>Address</span><b>${esc(p.address || '—')}</b></div>
            </div>
          </div>

          <!-- RIGHT: MONEY -->
          <div class="rc-money-box">
            <div class="rc-money-grid">
              <div class="rc-money-card card-due">
                <div class="rc-m-icon">${icoMoney}</div>
                <div class="rc-m-text"><span>Total due</span><b>${inr(r.due)}</b></div>
              </div>
              <div class="rc-money-card card-paid">
                <div class="rc-m-icon">${icoMoney}</div>
                <div class="rc-m-text"><span>Total paid</span><b>${inr(r.paid)}</b></div>
              </div>
              <div class="rc-money-card card-bal">
                <div class="rc-m-icon">${icoChart}</div>
                <div class="rc-m-text"><span>Balance</span><b>${inr(r.balance)}</b></div>
              </div>
              <div class="rc-money-card card-txn">
                <div class="rc-m-icon">${icoSwap}</div>
                <div class="rc-m-text"><span>Transactions</span><b>${r.rows.length}</b></div>
              </div>
            </div>
            ${r.penalty > 0 ? `
            <div class="rc-penalty">
              <div class="rc-m-icon">${icoAlert}</div>
              <div class="rc-m-text"><span>Penalty included</span><b>${inr(r.penalty)}</b></div>
            </div>` : ''}
          </div>

        </div>

        <!-- TABLE -->
        <table class="rc-table">
          <thead>
            <tr><th>#</th><th>Date</th><th>Mode</th><th>Txn no.</th><th>Collector</th><th style="text-align:right">Amount</th><th style="text-align:right">Balance</th></tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center;">No transactions.</td></tr>'}
          </tbody>
        </table>

        <!-- FOOTER -->
        <div class="rc-footer">
          <div class="rc-sig">
            <div class="rc-sig-line"></div>
            <b>${esc(r.issuedBy || 'Collector')}</b>
            <span>(Collector)</span>
          </div>
          <div class="rc-seal">${seal}</div>
          <div class="rc-sig">
            <div class="rc-sig-line"></div>
            <b>${esc(o.name || 'Madrasa')}</b>
            <span>Authorised</span>
          </div>
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

  // Clone with fixed width so it doesn't collapse in offscreen rendering
  const clone = element.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.position = 'fixed';
  clone.style.left = '-10000px';
  clone.style.top = '0';
  clone.style.width = '800px'; // Fixed width for high-quality JPG scaling
  clone.style.background = '#fff';
  document.body.appendChild(clone);

  try {
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

    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(resolve => {
        const t = setTimeout(resolve, 5000);
        img.onload = () => { clearTimeout(t); resolve(); };
        img.onerror = () => { clearTimeout(t); resolve(); };
      });
    }));

    const canvas = await html2canvas(clone, {
      scale: 2.5, // Higher scale for sharper text
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 8000
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = imgData;
    a.download = 'Receipt_' + (Date.now()) + '.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();

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
    _dlToast('✅ Receipt download ho gaya!', '#12a150');

  } catch (e) {
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
