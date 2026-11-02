/*******************************************************************
 * posts.js : Unified post/section system for all roles.
 * Depends on globals from each dashboard: api, ic, iconHtml, esc, inr,
 *   modal, closeM, toast, val, avatarHtml, callLink, waLink, linkify,
 *   compressImage, ME
 *******************************************************************/
(function () {
  'use strict';

  const SECTION_LABELS = { madrasa: 'Madrasa', masjid: 'Masjid', eidgah: 'Eidgah', kabristan: 'Kabristan', notice: 'Notice' };
  const PHOTO_MIMES = /^image\//i;
  const MAX_PHOTOS = 10;
  const MAX_FILES = 10;
  const MAX_FILE_BYTES = 25 * 1024 * 1024;

  // ---- Resolve dashboard globals at CALL TIME (safe TDZ) ----
  function D() {
    return {
      api: (typeof api !== 'undefined') ? api : null,
      ic: (typeof ic !== 'undefined') ? ic : null,
      iconHtml: (typeof iconHtml !== 'undefined') ? iconHtml : null,
      esc: (typeof esc !== 'undefined') ? esc : String,
      inr: (typeof inr !== 'undefined') ? inr : (n => '₹' + n),
      modal: (typeof modal !== 'undefined') ? modal : null,
      closeM: (typeof closeM !== 'undefined') ? closeM : null,
      toast: (typeof toast !== 'undefined') ? toast : alert,
      val: (typeof val !== 'undefined') ? val : (id => (document.getElementById(id) || {}).value || ''),
      avatarHtml: (typeof avatarHtml !== 'undefined') ? avatarHtml : (n => (n || '?').charAt(0)),
      callLink: (typeof callLink !== 'undefined') ? callLink : (() => ''),
      waLink: (typeof waLink !== 'undefined') ? waLink : (() => ''),
      linkify: (typeof linkify !== 'undefined') ? linkify : (s => String(s || '')),
      compressImage: (typeof compressImage !== 'undefined') ? compressImage : null,
      ME: (typeof ME !== 'undefined') ? ME : null
    };
  }

  function clean(s) { return String(s == null ? '' : s).trim(); }

  function ytId(url) {
    if (!url) return '';
    const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  }
  function ytEmbed(url) {
    const id = ytId(url);
    return id ? `<div class="yt-wrap"><iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : '';
  }

  // ---- Drive blob cache ----
  const _blobCache = new Map();
  async function getBlob(fileId, mime) {
    if (!fileId) return null;
    if (_blobCache.has(fileId)) return _blobCache.get(fileId);
    const { api } = D();
    try {
      const r = await api('apiFileBlob', fileId);
      if (!r || r.ok === false) return null;
      const bin = atob(r.b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: r.mime || mime || 'application/octet-stream' });
      _blobCache.set(fileId, blob);
      return blob;
    } catch (e) { return null; }
  }

  async function resolvePhotoSrc(p) {
    if (!p) return '';
    if (p.preview) return p.preview;
    if (p.public && p.url) return p.url;
    if (p.id) {
      const blob = await getBlob(p.id, p.mime);
      if (blob) return URL.createObjectURL(blob);
    }
    return p.url || '';
  }

  // ---- Share / Download / Open ----
  async function sharePhoto(p) {
    const { toast } = D();
    try {
      let blob;
      if (p.preview) { blob = await (await fetch(p.preview)).blob(); }
      else if (p.id) { blob = await getBlob(p.id, p.mime); }
      else if (p.url) { blob = await (await fetch(p.url)).blob(); }
      if (!blob) return toast('Could not load file');
      const file = new File([blob], p.name || 'photo.jpg', { type: p.mime || blob.type || 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        toast('Sharing not supported');
      }
    } catch (e) { toast('Share failed: ' + e.message); }
  }

  async function downloadPhoto(p) {
    const { toast } = D();
    try {
      let blob;
      if (p.preview) { blob = await (await fetch(p.preview)).blob(); }
      else if (p.id) { blob = await getBlob(p.id, p.mime); }
      else if (p.url) { blob = await (await fetch(p.url)).blob(); }
      if (!blob) return toast('Could not load file');
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = p.name || 'file';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { toast('Download failed: ' + e.message); }
  }

  async function openPhoto(p) {
    const { toast } = D();
    try {
      let blob;
      if (p.preview) { blob = await (await fetch(p.preview)).blob(); }
      else if (p.id) { blob = await getBlob(p.id, p.mime); }
      else if (p.url) { blob = await (await fetch(p.url)).blob(); }
      if (!blob) return toast('Could not load file');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { toast('Open failed: ' + e.message); }
  }

  // ---- Fullscreen viewer with pinch-zoom ----
  async function openViewer(photos, startIdx) {
    if (!photos || !photos.length) return;
    const resolved = await Promise.all(photos.map(async p => ({ ...p, src: await resolvePhotoSrc(p) })));
    let idx = startIdx || 0, scale = 1, tx = 0, ty = 0;
    const ov = document.createElement('div');
    ov.className = 'ps-viewer';
    ov.innerHTML = `
      <style>
        .ps-viewer{position:fixed;inset:0;background:rgba(0,0,0,.96);z-index:500;display:flex;align-items:center;justify-content:center;touch-action:none;overflow:hidden}
        .ps-viewer img{max-width:100%;max-height:100%;touch-action:none;user-select:none;transition:transform .06s linear;will-change:transform}
        .ps-viewer .pv-close{position:absolute;top:14px;right:14px;background:rgba(255,255,255,.22);color:#fff;border:0;width:44px;height:44px;border-radius:50%;font-size:22px;cursor:pointer;z-index:10}
        .ps-viewer .pv-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.22);color:#fff;border:0;width:44px;height:44px;border-radius:50%;font-size:22px;cursor:pointer;z-index:10}
        .ps-viewer .pv-prev{left:14px}.ps-viewer .pv-next{right:14px}
        .ps-viewer .pv-count{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);color:#fff;font-size:13px;background:rgba(0,0,0,.55);padding:5px 14px;border-radius:99px}
        .ps-viewer .pv-act{position:absolute;bottom:14px;right:14px;display:flex;gap:8px;z-index:10}
        .ps-viewer .pv-act button{background:rgba(255,255,255,.22);color:#fff;border:0;padding:8px 14px;border-radius:99px;font-size:12.5px;cursor:pointer}
      </style>
      <button class="pv-close">×</button>
      ${resolved.length > 1 ? `<button class="pv-nav pv-prev">‹</button><button class="pv-nav pv-next">›</button>` : ''}
      <img src="" alt="">
      <div class="pv-count"></div>
      <div class="pv-act">
        <button class="pv-share">Share</button>
        <button class="pv-dl">Download</button>
      </div>`;
    document.body.appendChild(ov);
    const img = ov.querySelector('img');
    const count = ov.querySelector('.pv-count');
    function apply() { img.style.transform = `scale(${scale}) translate(${tx / scale}px,${ty / scale}px)`; }
    function show(i) {
      idx = (i + resolved.length) % resolved.length;
      scale = 1; tx = 0; ty = 0;
      img.src = resolved[idx].src || '';
      count.textContent = (idx + 1) + ' / ' + resolved.length;
      apply();
    }
    show(idx);
    ov.querySelector('.pv-close').onclick = () => document.body.removeChild(ov);
    if (resolved.length > 1) {
      ov.querySelector('.pv-prev').onclick = () => show(idx - 1);
      ov.querySelector('.pv-next').onclick = () => show(idx + 1);
    }
    ov.querySelector('.pv-share').onclick = () => sharePhoto(resolved[idx]);
    ov.querySelector('.pv-dl').onclick = () => downloadPhoto(resolved[idx]);
    let drag = false, sx = 0, sy = 0, stx = 0, sty = 0;
    img.addEventListener('pointerdown', e => { drag = true; sx = e.clientX; sy = e.clientY; stx = tx; sty = ty; });
    img.addEventListener('pointermove', e => {
      if (!drag) return;
      if (scale > 1) { tx = stx + (e.clientX - sx); ty = sty + (e.clientY - sy); apply(); }
      else {
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 60) { drag = false; show(dx > 0 ? idx - 1 : idx + 1); }
      }
    });
    img.addEventListener('pointerup', () => { drag = false; });
    img.addEventListener('dblclick', () => { scale = scale > 1 ? 1 : 2.5; tx = 0; ty = 0; apply(); });
    img.addEventListener('wheel', e => { e.preventDefault(); scale = Math.max(1, Math.min(5, scale - e.deltaY * 0.0015)); apply(); }, { passive: false });
  }

  // ---- Card rendering ----
  function card(post, opts) {
    const { esc, callLink, waLink, linkify, ic } = D();
    opts = opts || {};
    const isMine = opts.currentApp && post.authorApp && String(post.authorApp) === String(opts.currentApp);
    const canEdit = opts.canManage || (opts.ownerRole === 'imam' && isMine);
    const canDelete = canEdit;
    const photos = Array.isArray(post.photos) && post.photos.length
      ? post.photos
      : (post.photo ? [{ id: '', url: post.photo, mime: 'image/jpeg', public: true }] : []);
    const files = Array.isArray(post.files) ? post.files : [];

    const photoIdsJson = esc(JSON.stringify(photos.map(p => ({ id: p.id || '', url: p.url || '', mime: p.mime || '', public: !!p.public, name: p.name || '' }))));

    const photosHtml = photos.length
      ? `<div class="post-photos" data-photos='${photoIdsJson}'>${photos.map((p, i) => `
          <div class="post-photo" data-act="ps-view" data-i="${i}">
            <img src="" data-file-id="${esc(p.id || '')}" data-direct="${esc(p.public && p.url ? p.url : '')}" alt="" loading="lazy">
          </div>`).join('')}</div>`
      : '';

    const filesHtml = files.length
      ? `<div class="post-files">${files.map(f => `
          <div class="post-file">
            <div class="pf-icon">${ic('eye')}</div>
            <div class="pf-info"><b>${esc(f.name || 'File')}</b><span>${f.size ? (f.size / 1024).toFixed(0) + ' KB' : ''}</span></div>
            <div class="pf-actions">
              <button class="btn light sm" data-act="ps-open" data-id="${esc(f.id || '')}" data-mime="${esc(f.mime || '')}" data-name="${esc(f.name || '')}">Open</button>
              <button class="btn light sm" data-act="ps-dl" data-id="${esc(f.id || '')}" data-mime="${esc(f.mime || '')}" data-name="${esc(f.name || '')}">Download</button>
            </div>
          </div>`).join('')}</div>`
      : '';

    const colorStyle = post.titleColor ? ` style="color:${esc(post.titleColor)}"` : '';

    return `<div class="post-card" data-id="${esc(post.id)}">
      <h2 class="post-title"${colorStyle}>${esc(post.title)}</h2>
      <div class="post-meta"><span>${esc(post.date || '')}</span>${post.authorName ? ` • <span style="color:var(--blue);font-weight:600">${esc(post.authorName)}</span>` : ''}</div>
      ${photosHtml}
      ${post.body ? `<div class="post-body">${linkify(post.body)}</div>` : ''}
      ${post.videoUrl ? ytEmbed(post.videoUrl) : ''}
      ${post.mapEmbed ? `<div class="post-map">${post.mapEmbed}</div>` : ''}
      ${filesHtml}
      <div class="post-actions">
        ${post.authorMobile ? `${callLink(post.authorMobile)}${waLink(post.authorMobile)}` : ''}
        ${canEdit ? `<button class="btn light sm" data-act="ps-edit" data-id="${esc(post.id)}">Edit</button>` : ''}
        ${canDelete ? `<button class="btn red sm" data-act="ps-del" data-id="${esc(post.id)}">Delete</button>` : ''}
      </div>
    </div>`;
  }

  function renderCards(list, opts) {
    if (!list || !list.length) return `<div class="empty">No posts yet.</div>`;
    return list.map(p => card(p, opts)).join('');
  }

  // ---- Composer ----
  function openComposer(section, existingPost, opts, onDone) {
    const { esc, ic, modal, closeM, toast, val, api, compressImage } = D();
    opts = opts || {};
    const target = opts.target || (section === 'madrasa' ? 'POSTS' : 'ANNOUNCEMENTS');
    const label = SECTION_LABELS[section] || section;
    const isEdit = !!existingPost;
    const initial = existingPost || {};

    const photos = Array.isArray(initial.photos) ? initial.photos.slice() :
      (initial.photo ? [{ url: initial.photo, id: '', mime: 'image/jpeg', public: true }] : []);
    const files = Array.isArray(initial.files) ? initial.files.slice() : [];

    modal(isEdit ? 'Edit post' : `New · ${label}`,
      `<div class="fgrid">
        <div>
          <label class="fl">Title *</label>
          <div style="display:flex;gap:6px">
            <input class="inp" id="pc-title" value="${esc(initial.title || '')}">
            <input type="color" id="pc-color" value="${esc(initial.titleColor || '#0b2a5b')}" style="width:48px;padding:2px;border:1px solid var(--line);border-radius:10px;height:auto">
          </div>
        </div>
        <div><label class="fl">Description</label><textarea class="inp" id="pc-body" rows="4">${esc(initial.body || '')}</textarea></div>
        <div><label class="fl">YouTube link (optional)</label><input class="inp" id="pc-video" value="${esc(initial.videoUrl || '')}" placeholder="https://youtu.be/..."></div>
        <div><label class="fl">Google Maps embed (optional)</label><textarea class="inp" id="pc-map" rows="2" placeholder="&lt;iframe src='...'&gt;&lt;/iframe&gt;">${esc(initial.mapEmbed || '')}</textarea></div>
        <div><label class="fl">Auto-delete (optional)</label><input class="inp" type="datetime-local" id="pc-expires" value="${initial.expiresAt ? String(initial.expiresAt).slice(0, 16) : ''}"></div>
        <div><label class="fl">Photos (max ${MAX_PHOTOS})</label><input type="file" id="pc-photos" accept="image/*" multiple class="inp"><div id="pc-photo-list" class="pc-list"></div></div>
        <div><label class="fl">Files (max ${MAX_FILES})</label><input type="file" id="pc-files" multiple class="inp"><div id="pc-file-list" class="pc-list"></div></div>
        <div id="pc-status" class="hint"></div>
      </div>
      <style>
        .pc-list{display:grid;gap:6px;margin-top:6px}
        .pc-item{display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f7f9fd;border:1px solid var(--line);border-radius:10px;font-size:13px}
        .pc-item .x{margin-left:auto;border:0;background:none;color:var(--red);cursor:pointer;font-weight:700;font-size:18px;line-height:1}
        .pc-thumb{width:36px;height:36px;border-radius:8px;object-fit:cover;flex:0 0 36px}
      </style>`,
      `<button class="btn light" data-act="close">Cancel</button>
       <button class="btn green" id="pc-publish">${isEdit ? 'Save' : 'Publish'}</button>`, true);

    function renderLists() {
      const pl = document.getElementById('pc-photo-list');
      pl.innerHTML = photos.length ? photos.map((p, i) => `
        <div class="pc-item">
          <img class="pc-thumb" src="${esc(p.preview || p.url || '')}" alt="">
          <span>${esc(p.name || ('Photo ' + (i + 1)))}</span>
          <button class="x" data-rm-photo="${i}">×</button>
        </div>`).join('') : '<div class="muted" style="font-size:12px">No photos.</div>';
      const fl = document.getElementById('pc-file-list');
      fl.innerHTML = files.length ? files.map((f, i) => `
        <div class="pc-item">
          <span>📄 ${esc(f.name || 'File')}</span>
          <button class="x" data-rm-file="${i}">×</button>
        </div>`).join('') : '<div class="muted" style="font-size:12px">No files.</div>';
      pl.querySelectorAll('[data-rm-photo]').forEach(b => b.onclick = () => { photos.splice(Number(b.dataset.rmPhoto), 1); renderLists(); });
      fl.querySelectorAll('[data-rm-file]').forEach(b => b.onclick = () => { files.splice(Number(b.dataset.rmFile), 1); renderLists(); });
    }
    renderLists();

    document.getElementById('pc-photos').addEventListener('change', async e => {
      const arr = Array.from(e.target.files || []);
      e.target.value = '';
      for (const f of arr) {
        if (!PHOTO_MIMES.test(f.type)) { toast('Skip (not an image): ' + f.name); continue; }
        if (photos.length >= MAX_PHOTOS) { toast('Max ' + MAX_PHOTOS + ' photos'); break; }
        try {
          let b64, mime = f.type, name = f.name, preview;
          if (compressImage) {
            const c = await compressImage(f);
            b64 = c.b64; mime = c.mime; name = c.name;
            preview = 'data:' + c.mime + ';base64,' + c.b64;
          } else {
            const reader = new FileReader();
            const dataUrl = await new Promise((res, rej) => { reader.onload = () => res(reader.result); reader.onerror = rej; reader.readAsDataURL(f); });
            b64 = String(dataUrl).split(',')[1];
            preview = String(dataUrl);
          }
          photos.push({ file: f, b64, mime, name, preview });
          renderLists();
        } catch (err) { toast('Photo failed: ' + err.message); }
      }
    });

    document.getElementById('pc-files').addEventListener('change', e => {
      const arr = Array.from(e.target.files || []);
      e.target.value = '';
      for (const f of arr) {
        if (files.length >= MAX_FILES) { toast('Max ' + MAX_FILES + ' files'); break; }
        if (f.size > MAX_FILE_BYTES) { toast('Too large: ' + f.name); continue; }
        files.push({ file: f, name: f.name, mime: f.type, size: f.size });
      }
      renderLists();
    });

    document.getElementById('pc-publish').addEventListener('click', async () => {
      const btn = document.getElementById('pc-publish');
      if (btn.disabled) return;
      const status = document.getElementById('pc-status');
      const title = val('pc-title');
      if (!title) { toast('Title required'); return; }
      btn.disabled = true;

      const uploadedPhotos = [], uploadedFiles = [];
      try {
        for (let i = 0; i < photos.length; i++) {
          const p = photos[i];
          status.textContent = `Uploading photo ${i + 1}/${photos.length}…`;
          if (p.id) { uploadedPhotos.push({ id: p.id, url: p.url, mime: p.mime, name: p.name }); continue; }
          const r = await api('apiPostUploadFile', p.b64, p.mime, p.name, false);
          uploadedPhotos.push({ id: r.fileId, url: r.url, mime: p.mime, name: p.name });
        }
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          status.textContent = `Uploading file ${i + 1}/${files.length}…`;
          if (f.id) { uploadedFiles.push({ id: f.id, url: f.url, mime: f.mime, name: f.name, size: f.size }); continue; }
          const b64 = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(String(reader.result).split(',')[1]);
            reader.onerror = rej;
            reader.readAsDataURL(f.file);
          });
          const r = await api('apiPostUploadFile', b64, f.mime, f.name, false);
          uploadedFiles.push({ id: r.fileId, url: r.url, mime: f.mime, name: f.name, size: f.size });
        }
        status.textContent = 'Saving…';

        if (isEdit) {
          if (target === 'ANNOUNCEMENTS') {
            await api('apiSectionSave', {
              id: existingPost.id, section, title, body: val('pc-body'),
              photos: uploadedPhotos, files: uploadedFiles,
              titleColor: val('pc-color'), videoUrl: val('pc-video'),
              mapEmbed: val('pc-map'), expiresAt: val('pc-expires')
            });
          } else {
            await api('apiPostEdit', existingPost.id, {
              title, body: val('pc-body'),
              photos: uploadedPhotos, files: uploadedFiles,
              titleColor: val('pc-color'), videoUrl: val('pc-video'),
              mapEmbed: val('pc-map'), expiresAt: val('pc-expires')
            });
          }
        } else {
          if (target === 'ANNOUNCEMENTS') {
            await api('apiSectionSave', {
              section, title, body: val('pc-body'),
              photos: uploadedPhotos, files: uploadedFiles,
              titleColor: val('pc-color'), videoUrl: val('pc-video'),
              mapEmbed: val('pc-map'), expiresAt: val('pc-expires')
            });
          } else {
            await api('apiPostCreate', section, title, val('pc-body'), {
              photos: uploadedPhotos, files: uploadedFiles,
              titleColor: val('pc-color'), videoUrl: val('pc-video'),
              mapEmbed: val('pc-map'), expiresAt: val('pc-expires')
            });
          }
        }
        toast(isEdit ? 'Updated' : 'Published');
        closeM();
        if (onDone) onDone();
      } catch (e) {
        for (const p of uploadedPhotos) if (p.id) { try { await api('apiDeleteFile', p.url); } catch (e2) {} }
        for (const f of uploadedFiles) if (f.id) { try { await api('apiDeleteFile', f.url); } catch (e2) {} }
        status.innerHTML = '❌ ' + esc(e.message || 'Upload failed');
        btn.disabled = false;
      }
    });
  }

  // ---- Render a full section page ----
  async function renderSection(c, opts) {
    const { api, esc, ic, toast, ME } = D();
    opts = opts || {};
    const section = opts.section || 'madrasa';
    const role = opts.role || 'user';
    const canPost = !!opts.canPost;
    const include = Array.isArray(opts.include) ? opts.include : ['posts', 'announcements'];
    const wantPosts = include.indexOf('posts') >= 0 && section === 'madrasa';
    const wantAnns = include.indexOf('announcements') >= 0;

    c.innerHTML = '<div class="loading">Loading…</div>';

    const [sec, pl] = await Promise.all([
      wantAnns ? api('apiSectionList', section).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
      wantPosts ? api('apiPostList', section).catch(() => ({ list: [] })) : Promise.resolve({ list: [] })
    ]);

    c.__psCtx = { section, sec, pl, opts };

    const showAddPosts = canPost && wantPosts;
    const showAddAnns = canPost && wantAnns;
    const addBtns = [
      showAddPosts ? `<button class="btn green" data-act="ps-new-posts">${ic('plus')}Add Post</button>` : '',
      showAddAnns ? `<button class="btn orange" data-act="ps-new-anns">${ic('plus')}Add Update</button>` : ''
    ].filter(Boolean).join(' ');

    const postOpts = { canManage: role === 'super_admin' || role === 'admin', ownerRole: role, currentApp: ME && ME.appNo };
    const annOpts = { canManage: role === 'super_admin' || role === 'admin' };

    c.innerHTML = `
      <div class="pagehead"><h2>${SECTION_LABELS[section] || section}</h2></div>
      <p class="psub">Latest updates.</p>
      ${addBtns ? `<div class="toolbar">${addBtns}</div>` : ''}
      ${wantPosts ? `<div class="sec-title"><h3>Posts</h3></div>${renderCards(pl.list, postOpts)}` : ''}
      ${wantAnns ? `<div class="sec-title"><h3>Official Updates</h3></div>${renderCards(sec.items.map(a => ({
        id: a.id, title: a.title, body: a.body, photos: a.photos, files: a.files,
        titleColor: a.titleColor, videoUrl: a.videoUrl, mapEmbed: a.mapEmbed,
        date: a.date, authorName: a.by, authorMobile: ''
      })), annOpts)}` : ''}
    `;

    // Hydrate private photo blobs
    c.querySelectorAll('img[data-file-id]').forEach(async img => {
      const id = img.getAttribute('data-file-id');
      const direct = img.getAttribute('data-direct');
      if (direct) { img.src = direct; return; }
      if (!id) return;
      const blob = await getBlob(id);
      if (blob) img.src = URL.createObjectURL(blob);
    });

    if (!c.__psWired) {
      c.__psWired = true;
      c.addEventListener('click', async e => {
        const ctx = c.__psCtx;
        if (!ctx) return;
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const act = btn.getAttribute('data-act');
        const refresh = () => renderSection(c, ctx.opts);

        if (act === 'ps-new-posts') return openComposer(ctx.section, null, { target: 'POSTS' }, refresh);
        if (act === 'ps-new-anns') return openComposer(ctx.section, null, { target: 'ANNOUNCEMENTS' }, refresh);
        if (act === 'ps-view') {
          const list = JSON.parse(btn.closest('.post-photos').getAttribute('data-photos') || '[]');
          return openViewer(list, Number(btn.getAttribute('data-i') || 0));
        }
        if (act === 'ps-edit') {
          const id = btn.getAttribute('data-id');
          const inPost = ctx.pl.list.find(p => String(p.id) === id);
          const inAnn = ctx.sec.items.find(a => String(a.id) === id);
          const target = inPost ? 'POSTS' : 'ANNOUNCEMENTS';
          const post = inPost || inAnn;
          if (post) openComposer(ctx.section, post, { target }, refresh);
          return;
        }
        if (act === 'ps-del') {
          if (!confirm('Delete this post? Files will be trashed.')) return;
          try {
            await api('apiPostDelete', btn.getAttribute('data-id'));
            toast('Deleted');
            refresh();
          } catch (err) { toast('Delete failed: ' + err.message); }
        }
        if (act === 'ps-open') {
          return openPhoto({ id: btn.getAttribute('data-id'), mime: btn.getAttribute('data-mime'), name: btn.getAttribute('data-name') });
        }
        if (act === 'ps-dl') {
          return downloadPhoto({ id: btn.getAttribute('data-id'), mime: btn.getAttribute('data-mime'), name: btn.getAttribute('data-name') });
        }
      });
    }
  }

  window.Posts = { renderSection, openComposer, openViewer, renderCards, sharePhoto, downloadPhoto, openPhoto, getBlob };
})();
