/*******************************************************************
 * receipt.js : Centralized Receipt Print & Download Logic for all Roles.
 * v7 — JPG garbage fixed. PDF untouched. Exact CSS ID mapping.
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

// Receipt CSS (Untouched from your perfect PDF version)
if (!document.getElementById('receipt-css')) {
  const style = document.createElement('style');
  style.id = 'receipt-css';
  style.innerHTML = `
    #rc {
      box-sizing: border-box;
      width: 100%;
      max-width: 800px;
      margin: auto;
      padding: 20px 25px;
      background: #fff;
      border: 4px solid #174d38;
      border-radius: 12px;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      position: relative;
      overflow: hidden;
    }
    #rc * { box-sizing: border-box; }
    
    #rc .header-top { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 700; margin-bottom: 15px; }
    #rc .header-top .reg { text-align: right; }
    #rc .bismillah { font-size: 22px; white-space: nowrap; }
    
    #rc .header-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; gap: 15px; }
    #rc .title-area { flex: 1; text-align: center; min-width: 0; }
    
    #rc .urdu-text { font-family: 'Noto Nastaliq Urdu', serif; font-size: 42px; font-weight: 400; color: #00851f; text-align: center; direction: rtl; line-height: 1.8; margin: 0 auto 5px; white-space: nowrap; }
    #rc .main-title { font-size: 26px; font-weight: 900; line-height: 1.2; margin: 3px 0 6px; color: #111; }
    #rc .address { font-size: 13px; font-weight: 700; line-height: 1.4; }
    
    #rc .logo { width: 100px; height: 100px; flex-shrink: 0; display: flex; justify-content: center; align-items: center; border: none; padding: 0; overflow: hidden; }
    #rc .logo img { width: 100px; height: 100px; object-fit: contain; }
    
    #rc .separator { border: 0; border-top: 4px solid #174d38; margin: 15px 0; }
    
    #rc .receipt-info { display: flex; justify-content: space-between; align-items: center; border: 2px solid #444; padding: 10px 15px; font-size: 15px; font-weight: 800; margin-bottom: 15px; }
    
    #rc .body-split { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 15px; }
    
    #rc .details-box { flex: 1.3; border: 2px solid #555; padding: 10px 15px; min-width: 0; }
    #rc .detail-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding: 8px 0; border-bottom: 1px dotted #aaa; font-size: 14px; }
    #rc .detail-row:last-child { border-bottom: none; }
    #rc .detail-label { font-weight: 800; flex-shrink: 0; }
    #rc .detail-value { font-weight: 800; text-align: right; overflow-wrap: anywhere; }
    
    #rc .financial-box { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
    #rc .financial-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    #rc .fin-item { flex: 1 1 calc(50% - 10px); border: 2px solid #555; text-align: center; padding: 10px 5px; font-weight: 700; font-size: 13px; }
    #rc .fin-item span { display: block; font-size: 20px; font-weight: 900; margin-top: 3px; }
    
    #rc .penalty-box { border: 2px solid #c77c7c; background: #fff5f5; color: #a52c32; text-align: center; padding: 10px 5px; font-weight: 800; font-size: 15px; }
    #rc .penalty-box span { display: block; font-size: 22px; margin-top: 3px; }
    
    #rc .table-wrap { width: 100%; overflow-x: auto; margin-bottom: 20px; }
    #rc table { width: 100%; border-collapse: collapse; font-size: 13px; }
    #rc thead { background: #174d38; color: #fff; }
    #rc th { padding: 10px 8px; text-align: left; border: 1px solid #9aa69e; white-space: nowrap; }
    #rc td { border: 1px solid #555; padding: 10px 8px; font-weight: 700; white-space: nowrap; }
    #rc tbody tr:nth-child(even) { background: #f4f7f5; }
    #rc .text-center { text-align: center; }
    #rc .text-right { text-align: right; }
    
    #rc .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding: 0 10px 10px; }
    #rc .signature { width: 45%; text-align: center; font-weight: 700; font-size: 14px; line-height: 1.4; }
    
    #rc .sig-img { display: flex; align-items: flex-end; justify-content: center; margin-bottom: 5px; height: 65px; }
    #rc .sig-img.coll img { max-height: 35px; max-width: 110px; object-fit: contain; }
    #rc .sig-img.auth img { max-height: 60px; max-width: 160px; object-fit: contain; }
    
    #rc .sign-line { width: 100%; border-top: 2px solid #444; margin-bottom: 8px; }

    .noprint { transition: all 0.2s; }
    .noprint:active:not(:disabled) { transform: scale(0.95); }

    @media print {
      @page { size: A4 portrait; margin: 5mm; }
      body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
      body * { visibility: hidden !important; }
      #ov, #ov * { visibility: visible !important; }
      #rc, #rc * { visibility: visible !important; }
      
      #ov { position: absolute !important; left: 0 !important; top: 0 !important; background: none !important; display: block !important; padding: 0 !important; margin: 0 !important; }
      #ov .box { box-shadow: none !important; border: none !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; transform: none !important; }
      .noprint { display: none !important; }
      
      #rc {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 auto !important;
        border: 3px solid #174d38 !important;
        padding: 15px 20px !important;
        min-height: auto !important;
        page-break-inside: avoid !important;
      }
      #rc * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
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
    
    const logoHtml = o.logo ? `<img src="${esc(o.logo)}" style="width:100px;height:100px;object-fit:contain;" onerror="this.remove()">` : 'LOGO';
    
    const rowsHtml = r.rows.map(x => `<tr>
      <td>${x.no}</td><td>${esc(x.date)}</td><td>${esc(x.mode)}</td><td class="text-center">${esc(x.txnRef || '—')}</td>
      <td>${esc(x.collector)}</td>
      <td class="text-right">${x.reversal ? '−' : ''}${inr(Math.abs(x.amount))}</td>
      <td class="text-right">${inr(x.balanceAfter)}</td></tr>`).join('');

    const html = `
      <div id="rc">
        
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
            <div class="sig-img coll">
              ${o.sigCollector ? `<img src="${esc(o.sigCollector)}" onerror="this.remove()">` : ''}
            </div>
            <div class="sign-line"></div>
            <div>${esc(r.issuedBy || 'Collector')}</div>
            <div>(Collector)</div>
          </div>
          <div class="signature">
            <div class="sig-img auth">
              ${o.sigAuth ? `<img src="${esc(o.sigAuth)}" onerror="this.remove()">` : ''}
            </div>
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
 * JPG DOWNLOAD FUNCTION (Fixed: 9:16 Layout with Correct CSS ID)
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

  try {
    // 1. Convert images to base64 IN PLACE (Fixes CORS/Blanking issues)
    const imgs = [...element.querySelectorAll('img')];
    if (imgs.length) {
      await Promise.all(imgs.map(async (img) => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          const b64 = await _imageToDataUrl(src);
          if (b64) img.src = b64;
        }
      }));
    }

    // 2. Wait for them to fully load into the DOM
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(resolve => {
        const t = setTimeout(resolve, 3000);
        img.onload = () => { clearTimeout(t); resolve(); };
        img.onerror = () => { clearTimeout(t); resolve(); };
      });
    }));

    // 3. Render canvas with 'onclone' to force 9:16 layout without breaking CSS ID
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 5000,
      onclone: (clonedDoc, clonedElement) => {
        // Force the cloned element to 9:16 ratio for the JPG
        clonedElement.style.position = 'fixed';
        clonedElement.style.left = '-9999px'; // Move it offscreen
        clonedElement.style.top = '0';
        clonedElement.style.width = '800px';
        clonedElement.style.height = '1420px'; // 9:16 Ratio
        clonedElement.style.display = 'flex';
        clonedElement.style.flexDirection = 'column';
        clonedElement.style.margin = '0';
        clonedElement.style.padding = '25px 30px'; // Extra breathing space for mobile view
        clonedElement.style.boxSizing = 'border-box';
        clonedElement.style.background = '#ffffff';
        
        // Push footer to the absolute bottom
        const footer = clonedElement.querySelector('.footer');
        if (footer) {
           footer.style.marginTop = 'auto';
           footer.style.paddingBottom = '15px';
        }
      }
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
  }
}
