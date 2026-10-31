/*******************************************************************
 * receipt.js : Centralized Receipt Print & Download Logic for all Roles.
 * v5 — Fixed JPG layout, 9:16 aspect ratio, optimized PDF size.
 *******************************************************************/

// HTML2Canvas load
if (!document.getElementById('html2canvas-script')) {
  const s1 = document.createElement('script');
  s1.id = 'html2canvas-script';
  s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  document.head.appendChild(s1);
}

// Urdu Font load
if (!document.getElementById('urdu-font-link')) {
  const l1 = document.createElement('link');
  l1.id = 'urdu-font-link';
  l1.rel = 'preconnect';
  l1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(l1);
  
  const l2 = document.createElement('link');
  l2.id = 'urdu-font-css';
  l2.rel = 'stylesheet';
  l2.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap';
  document.head.appendChild(l2);
}

// Receipt CSS
if (!document.getElementById('receipt-css')) {
  const style = document.createElement('style');
  style.id = 'receipt-css';
  style.innerHTML = `
    /* Scoped to .receipt-container to prevent affecting app layout */
    .receipt-container {
      box-sizing: border-box;
      width: 100%;
      max-width: 800px;
      margin: auto;
      padding: 18px 20px;
      background: #fff;
      border: 4px solid #174d38;
      border-radius: 15px;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      position: relative;
      overflow: hidden;
    }
    .receipt-container * { box-sizing: border-box; }
    
    .receipt-container .header-top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; margin-bottom: 16px; }
    .receipt-container .header-top .reg { text-align: right; }
    .receipt-container .bismillah { font-size: 22px; white-space: nowrap; }
    .receipt-container .header-main { display: grid; grid-template-columns: 1fr 96px; align-items: center; gap: 12px; margin-bottom: 16px; }
    .receipt-container .title-area { text-align: center; min-width: 0; }
    
    .receipt-container .urdu-text { font-family: 'Noto Nastaliq Urdu', serif; font-size: clamp(36px, 6.5vw, 62px); font-weight: 400; color: #00851f; text-align: center; direction: rtl; line-height: 1.65; margin: 0 auto 7px; white-space: nowrap; letter-spacing: 0; }
    .receipt-container .main-title { font-size: clamp(18px, 3.5vw, 29px); font-weight: 900; line-height: 1.2; letter-spacing: .3px; margin: 3px 0 8px; color: #111; }
    .receipt-container .address { font-size: 13px; font-weight: 700; line-height: 1.5; }
    
    /* Logo border removed */
    .receipt-container .logo { width: 96px; height: 96px; border: none; outline: none; border-radius: 50%; display: flex; justify-content: center; align-items: center; text-align: center; font-size: 11px; font-weight: bold; color: #174d38; background: transparent; padding: 0; overflow: hidden; }
    .receipt-container .logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
    
    .receipt-container .separator { border: 0; border-top: 4px solid #174d38; margin: 12px 0; }
    
    .receipt-container .receipt-info { display: grid; grid-template-columns: 1.5fr 1fr auto; gap: 8px; align-items: center; border: 2px solid #444; padding: 9px 10px; font-size: 15px; font-weight: 800; margin-bottom: 12px; }
    
    .receipt-container .body-split { display: grid; grid-template-columns: 1.3fr 1fr; gap: 12px; margin-bottom: 12px; }
    
    .receipt-container .details-box { border: 2px solid #555; padding: 10px 12px; min-width: 0; }
    .receipt-container .detail-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 7px 0; border-bottom: 1px dotted #aaa; font-size: 14px; }
    .receipt-container .detail-row:last-child { border-bottom: none; }
    .receipt-container .detail-label { font-weight: 800; flex-shrink: 0; }
    .receipt-container .detail-value { font-weight: 800; text-align: right; overflow-wrap: anywhere; }
    
    .receipt-container .financial-box { display: flex; flex-direction: column; gap: 9px; min-width: 0; }
    .receipt-container .financial-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .receipt-container .fin-item { border: 2px solid #555; text-align: center; padding: 9px 4px; font-weight: 700; font-size: 13px; }
    .receipt-container .fin-item span { display: block; font-size: 20px; font-weight: 900; margin-top: 3px; }
    
    .receipt-container .penalty-box { border: 2px solid #c77c7c; background: #fff5f5; color: #a52c32; text-align: center; padding: 9px 4px; font-weight: 800; font-size: 15px; }
    .receipt-container .penalty-box span { display: block; font-size: 22px; margin-top: 3px; }
    
    .receipt-container .table-wrap { width: 100%; overflow-x: auto; margin-top: 10px; }
    .receipt-container table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .receipt-container thead { background: #174d38; color: #fff; }
    .receipt-container th { padding: 9px 6px; text-align: left; border: 1px solid #9aa69e; white-space: nowrap; }
    .receipt-container td { border: 1px solid #555; padding: 8px 6px; font-weight: 700; white-space: nowrap; }
    .receipt-container tbody tr:nth-child(even) { background: #f4f7f5; }
    .receipt-container .text-center { text-align: center; }
    .receipt-container .text-right { text-align: right; }
    
    .receipt-container .footer { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-top: 50px; padding: 0 5px 10px; }
    .receipt-container .signature { width: 42%; text-align: center; font-weight: 700; font-size: 14px; line-height: 1.4; }
    
    /* Signature sizes customized */
    .receipt-container .sig-img { display: flex; align-items: flex-end; justify-content: center; margin-bottom: 4px; }
    .receipt-container .sig-img.collector { height: 35px; }
    .receipt-container .sig-img.collector img { max-height: 35px; max-width: 110px; object-fit: contain; }
    .receipt-container .sig-img.authorised { height: 60px; }
    .receipt-container .sig-img.authorised img { max-height: 60px; max-width: 160px; object-fit: contain; }
    
    .receipt-container .sign-line { width: 100%; border-top: 2px solid #444; margin-bottom: 6px; }

    /* BUTTON FEEDBACK */
    .noprint { transition: all 0.2s; }
    .noprint:active:not(:disabled) { transform: scale(0.95); }

    /* SCREEN MOBILE RESPONSIVE */
    @media screen and (max-width: 560px) {
      .receipt-container { padding: 10px; border-width: 3px; border-radius: 12px; }
      .receipt-container .header-top { font-size: 9px; gap: 3px; }
      .receipt-container .bismillah { font-size: 14px; }
      .receipt-container .header-main { grid-template-columns: 1fr 52px; gap: 7px; }
      .receipt-container .logo { width: 52px; height: 52px; font-size: 7px; }
      .receipt-container .urdu-text { font-size: clamp(28px, 7vw, 40px); line-height: 1.8; }
      .receipt-container .main-title { font-size: clamp(12px, 3.5vw, 18px); }
      .receipt-container .address { font-size: 9px; }
      .receipt-container .receipt-info { grid-template-columns: 1fr; gap: 5px; font-size: 12px; }
      .receipt-container .body-split { grid-template-columns: 1fr; }
      .receipt-container .detail-row { font-size: 12px; }
      .receipt-container .fin-item { font-size: 12px; }
      .receipt-container .fin-item span { font-size: 17px; }
      .receipt-container table { min-width: 620px; font-size: 12px; }
      .receipt-container .footer { margin-top: 30px; padding: 0 0 10px; }
      .receipt-container .signature { font-size: 11px; }
    }

    /* PRINT (PDF) SETTINGS - SINGLE PAGE A4 */
    @media print {
      @page { size: A4 portrait; margin: 5mm; }
      body { background: #fff !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
      body * { visibility: hidden !important; }
      #ov, #ov * { visibility: visible !important; }
      .receipt-container, .receipt-container * { visibility: visible !important; }
      
      #ov { position: absolute !important; left: 0 !important; top: 0 !important; background: none !important; display: block !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; width: 100% !important; height: auto !important; }
      #ov .box { box-shadow: none !important; max-height: none !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; border-radius: 0 !important; position: static !important; transform: none !important; }
      .noprint { display: none !important; }
      
      .receipt-container {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 auto !important;
        border: 3px solid #174d38 !important;
        padding: 15px !important;
        page-break-inside: avoid !important;
        box-shadow: none !important;
        min-height: auto !important;
      }
      .receipt-container * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  `;
  document.head.appendChild(style);
}


/* =================================================================
 * IMAGE HELPERS
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
    
    const logoHtml = o.logo ? `<img src="${esc(o.logo)}" alt="" onerror="this.remove()">` : 'LOGO';
    
    const rowsHtml = r.rows.map(x => `<tr>
      <td>${x.no}</td><td>${esc(x.date)}</td><td>${esc(x.mode)}</td><td class="text-center">${esc(x.txnRef || '—')}</td>
      <td>${esc(x.collector)}</td>
      <td class="text-right">${x.reversal ? '−' : ''}${inr(Math.abs(x.amount))}</td>
      <td class="text-right">${inr(x.balanceAfter)}</td></tr>`).join('');

    const html = `
      <div class="receipt-container" id="rc">
        
        <div class="header-top">
          <div>Estd : 1990</div>
          <div class="bismillah" dir="rtl">786/92</div>
          <div class="reg">Reg. No. ${esc(o.reg || 'STM/2019/0786')}</div>
        </div>

        <div class="header-main">
          <div class="title-area">
            <div class="urdu-text" lang="ur">مدرسہ فیضان مصطفی</div>
            <div class="main-title">${esc(o.name || 'MADARSA FAIZAN-E-MUSTAFA')}</div>
            <div class="address">Address : ${esc(o.address || 'Ward 46, Simra, Dumra, Sitamarhi, Bihar, 843301')}</div>
          </div>
          <div class="logo">
            ${logoHtml}
          </div>
        </div>

        <hr class="separator">

        <div class="receipt-info">
          <div>Receipt: ${esc(r.receiptId)}</div>
          <div>Date: ${esc(r.issued)}</div>
          <div>Year: ${r.year}</div>
        </div>

        <div class="body-split">
          <div class="details-box">
            <div class="detail-row"><div class="detail-label">APPLICATION ID</div><div class="detail-value">${esc(p.appNo)}</div></div>
            <div class="detail-row"><div class="detail-label">NAME</div><div class="detail-value">${esc(p.name)}</div></div>
            <div class="detail-row"><div class="detail-label">FATHER'S NAME</div><div class="detail-value">${esc(p.father || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">MOBILE</div><div class="detail-value">${esc(p.mobile || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">ADDRESS</div><div class="detail-value">${esc(p.address || '—')}</div></div>
          </div>

          <div class="financial-box">
            <div class="financial-grid">
              <div class="fin-item">Total due<span>${inr(r.due)}</span></div>
              <div class="fin-item">Total paid<span>${inr(r.paid)}</span></div>
              <div class="fin-item">Balance<span>${inr(r.balance)}</span></div>
              <div class="fin-item">Transactions<span>${r.rows.length}</span></div>
            </div>
            ${r.penalty > 0 ? `<div class="penalty-box">Penalty Included<span>${inr(r.penalty)}</span></div>` : ''}
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Mode</th><th>Txn no.</th><th>Collector</th><th class="text-right">Amount</th><th class="text-right">Balance</th></tr></thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="7" class="text-center">No transactions.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div class="signature">
            <div class="sig-img collector">${o.sigCollector ? `<img src="${esc(o.sigCollector)}" alt="" onerror="this.remove()">` : ''}</div>
            <div class="sign-line"></div>
            <div>${esc(r.issuedBy || 'Collector')}</div>
            <div>(Collector)</div>
          </div>
          <div class="signature">
            <div class="sig-img authorised">${o.sigAuth ? `<img src="${esc(o.sigAuth)}" alt="" onerror="this.remove()">` : ''}</div>
            <div class="sign-line"></div>
            <div>${esc(o.name || 'Madarsa Faizan-E-Mustafa')}</div>
            <div>Authorised</div>
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
 * JPG DOWNLOAD FUNCTION (9:16 Ratio Fixed)
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

  // --- CLONE RECEIPT (Force 9:16 ratio, 800x1422) ---
  const clone = element.cloneNode(true);
  clone.id = 'rc-clone';
  clone.style.position = 'fixed';
  clone.style.left = '-10000px';
  clone.style.top = '0';
  clone.style.width = '800px';
  clone.style.minHeight = '1422px'; // 9:16 ratio for 800px width
  clone.style.background = '#fff';
  clone.style.display = 'flex';
  clone.style.flexDirection = 'column';
  
  // Push footer to the bottom to fill 9:16 space perfectly
  const footer = clone.querySelector('.footer');
  if (footer) footer.style.marginTop = 'auto';

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
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 8000,
      windowWidth: 800,
      windowHeight: 1422
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
