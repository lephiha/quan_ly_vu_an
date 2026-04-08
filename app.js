/* ============================================================
   QUẢN LÝ VỤ ÁN v3 — app.js
   3 giai đoạn: Điều tra → Truy tố → Xét xử
   DB: db.json (đọc/ghi qua server Node.js)
   ============================================================ */
'use strict';

// ══════════════════════════════════════════════════════════
// DB — đọc/ghi file JSON qua API
// ══════════════════════════════════════════════════════════
let db = { version: 3, vuAns: [] };

async function loadDB() {
  try {
    const res = await fetch('/api/db');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    db = await res.json();
    if (!db.vuAns) db.vuAns = [];
  } catch (e) {
    showToast('Không kết nối được server. Dùng localStorage tạm thời.', 'warning');
    // Fallback localStorage
    try {
      const raw = localStorage.getItem('vu_an_v3');
      if (raw) db = JSON.parse(raw);
    } catch {}
  }
}

async function saveDB() {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db, null, 2),
    });
    if (!res.ok) throw new Error();
    updateSaveIndicator(true);
  } catch {
    // Fallback localStorage
    localStorage.setItem('vu_an_v3', JSON.stringify(db));
    updateSaveIndicator(true);
  }
}

function updateSaveIndicator(ok) {
  const el  = document.getElementById('save-time');
  const dot = document.getElementById('save-dot');
  if (!el) return;
  el.textContent = ok ? `Lưu ${new Date().toLocaleTimeString('vi-VN')}` : 'Chưa lưu';
  if (dot) dot.style.background = ok ? 'var(--green)' : 'var(--red)';
}

// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════
let currentPhase    = 'dieu-tra';   // 'dieu-tra' | 'truy-to' | 'xet-xu'
let currentDetailId = null;
let editingId       = null;
let detailTab       = 'tab-tong-quan';
let filterMap       = { 'dieu-tra': 'all', 'truy-to': 'all', 'xet-xu': 'all' };
let searchMap       = { 'dieu-tra': '', 'truy-to': '', 'xet-xu': '' };

// ══════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════
const IC = {
  search:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  edit:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  x:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  check:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  arrow:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>`,
  clock:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  note:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.94"/></svg>`,
  user:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  plus:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  save:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  phase:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  dt_icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  tt_icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>`,
  xx_icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 9l14-6"/><path d="M3 12s0 5 5 5 5-5 5-5-0-5-5-5-5 5-5 5z"/><path d="M16 12s0 5 5 5 5-5 5-5-0-5-5-5-5 5-5 5z"/></svg>`,
  download:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
};

// ══════════════════════════════════════════════════════════
// STATUS CONFIG
// ══════════════════════════════════════════════════════════
const DT_STATUS = {
  'cu':           { label: 'Cũ',                       cls: 'badge-cu'       },
  'moi-nhan-lai': { label: 'Mới nhận lại để ĐT',       cls: 'badge-nhan-lai' },
  'nhan-lai-bs':  { label: 'Nhận lại để ĐT bổ sung',   cls: 'badge-nhan-lai' },
  'tach':         { label: 'Tách',                      cls: 'badge-tach'     },
  'nhap':         { label: 'Nhập',                      cls: 'badge-nhap'     },
  'phuc-hoi':     { label: 'Phục hồi',                  cls: 'badge-phuc-hoi' },
  'moi':          { label: 'Mới',                       cls: 'badge-moi'      },
  'chuyen-den':   { label: 'Chuyển đến',                cls: 'badge-chuyen'   },
  'chuyen-di':    { label: 'Chuyển đi',                 cls: 'badge-chuyen'   },
};

// Giải quyết điều tra
const DT_GIAIQUYET = {
  'dinh-chi':   { label: 'Đình chỉ',      cls: 'badge-dinh-chi-dt' },
  'de-nghi-tt': { label: 'Đề nghị truy tố', cls: 'badge-de-nghi'   },
  'tam-dinh-chi': { label: 'Tạm đình chỉ', cls: 'badge-cho-pc'     },
};

const TT_STATUS = {
  'cu':              { label: 'Cũ',                        cls: 'badge-cu'       },
  'cqdt-hoan':       { label: 'CQĐT hoàn lại sau khi trả', cls: 'badge-nhan-lai' },
  'nhan-lai-bs':     { label: 'Nhận lại để ĐT bổ sung',    cls: 'badge-nhan-lai' },
  'tra-dtbs-chua-nl':{ label: 'Trả ĐTBS chưa nhận lại',    cls: 'badge-cho-pc'   },
  'tach':            { label: 'Tách',                       cls: 'badge-tach'     },
  'nhap':            { label: 'Nhập',                       cls: 'badge-nhap'     },
  'phuc-hoi':        { label: 'Phục hồi',                   cls: 'badge-phuc-hoi' },
  'moi':             { label: 'Mới',                        cls: 'badge-moi'      },
  'chuyen-den':      { label: 'Chuyển đến',                 cls: 'badge-chuyen'   },
  'chuyen-di':       { label: 'Chuyển đi',                  cls: 'badge-chuyen'   },
};

// Giải quyết truy tố
const TT_GIAIQUYET = {
  'dinh-chi':      { label: 'Đình chỉ',         cls: 'badge-dinh-chi'  },
  'tam-dinh-chi':  { label: 'Tạm đình chỉ',     cls: 'badge-cho-pc'    },
  'tra-hs-dtbs':   { label: 'Trả hồ sơ ĐT bổ sung', cls: 'badge-nhan-lai'},
  'truy-to':       { label: 'Truy tố',           cls: 'badge-truy-to'   },
};

const XX_STATUS = {
  'xet-xu':        { label: 'Xét xử',           cls: 'badge-dang-xx'   },
  'tam-dinh-chi':  { label: 'Tạm đình chỉ',     cls: 'badge-cho-pc'    },
  'dinh-chi':      { label: 'Đình chỉ',         cls: 'badge-dinh-chi'  },
  'huy-moi-nl-xx': { label: 'Huỷ mới nhận XX lại', cls: 'badge-nhan-lai'},
  'dtbs-moi-nl':   { label: 'ĐTBS mới nhận lại', cls: 'badge-nhan-lai' },
  'phuc-hoi':      { label: 'Phục hồi',          cls: 'badge-phuc-hoi' },
  'moi':           { label: 'Mới',               cls: 'badge-moi'       },
  'chuyen-den':    { label: 'Chuyển đến',         cls: 'badge-chuyen'   },
  'tra-hsdtbs':    { label: 'Trả HSĐTBS',         cls: 'badge-nhan-lai' },
};

// Giải quyết xét xử
const XX_GIAIQUYET = {
  'da-xet-xu':    { label: 'Đã xét xử',      cls: 'badge-da-xx'     },
  'tam-dinh-chi': { label: 'Tạm đình chỉ',   cls: 'badge-cho-pc'    },
  'dinh-chi':     { label: 'Đình chỉ',       cls: 'badge-dinh-chi'  },
};

function getBadgeDT(s) { return _badge(DT_STATUS[s], s); }
function getBadgeTT(s) { return _badge(TT_STATUS[s], s); }
function getBadgeXX(s) { return _badge(XX_STATUS[s], s); }

function _badge(cfg, raw) {
  if (!cfg) return `<span class="badge" style="color:var(--gray)">${raw || '—'}</span>`;
  return `<span class="badge ${cfg.cls}">${cfg.label}</span>`;
}
function getBadgeDTGQ(s) { return _badge(DT_GIAIQUYET[s], s); }
function getBadgeTTGQ(s) { return _badge(TT_GIAIQUYET[s], s); }
function getBadgeXXGQ(s) { return _badge(XX_GIAIQUYET[s], s); }

// ══════════════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════════════
function render() {
  updateTabCounts();
  renderPhase(currentPhase);
}

function updateTabCounts() {
  const dt = db.vuAns.filter(v => v.giaiDoan === 'dieu-tra').length;
  const tt = db.vuAns.filter(v => v.giaiDoan === 'truy-to').length;
  const xx = db.vuAns.filter(v => v.giaiDoan === 'xet-xu').length;
  setEl('count-dt', dt);
  setEl('count-tt', tt);
  setEl('count-xx', xx);

  // Sidebar badges
  setEl('sb-dt', dt);
  setEl('sb-tt', tt);
  setEl('sb-xx', xx);
}

function renderPhase(phase) {
  const q      = searchMap[phase]?.toLowerCase() || '';
  const filter = filterMap[phase] || 'all';

  let data = db.vuAns.filter(v => v.giaiDoan === phase);

  // Apply sub-filter
  if (filter !== 'all') {
    data = data.filter(v => {
      if (phase === 'dieu-tra') return v.dieuTra?.trangThai === filter;
      if (phase === 'truy-to')  return v.truyTo?.trangThai  === filter || v.truyTo?.ketQua === filter;
      if (phase === 'xet-xu')   return v.xetXu?.trangThai   === filter || v.xetXu?.ketQua === filter;
    });
  }

  // Apply search
  if (q) {
    data = data.filter(v =>
      v.dl.toLowerCase().includes(q) ||
      v.tenBiCan.toLowerCase().includes(q) ||
      (v.dieuLuat || '').toLowerCase().includes(q) ||
      (v.ksv || '').toLowerCase().includes(q)
    );
  }

  renderStats(phase, data);

  const tbody = document.getElementById(`tbody-${phase}`);
  const empty = document.getElementById(`empty-${phase}`);
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = data.map((v, i) => renderRow(v, i, phase)).join('');
}

function renderStats(phase, filtered) {
  const all = db.vuAns.filter(v => v.giaiDoan === phase);

  if (phase === 'dieu-tra') {
    setEl('stat-dt-all',    all.length);
    setEl('stat-dt-moi',    all.filter(v => v.dieuTra?.trangThai === 'moi').length);
    setEl('stat-dt-nhanLai',all.filter(v => v.dieuTra?.trangThai === 'nhan-lai').length);
    setEl('stat-dt-dinh',   all.filter(v => v.dieuTra?.trangThai === 'dinh-chi').length);
  }
  if (phase === 'truy-to') {
    setEl('stat-tt-all',   all.length);
    setEl('stat-tt-denghi',all.filter(v => v.truyTo?.ketQua === 'de-nghi' || v.truyTo?.trangThai === 'de-nghi').length);
    setEl('stat-tt-tt',    all.filter(v => v.truyTo?.ketQua === 'truy-to' || v.truyTo?.trangThai === 'truy-to').length);
    setEl('stat-tt-dinh',  all.filter(v => v.truyTo?.ketQua === 'dinh-chi' || v.truyTo?.trangThai === 'dinh-chi').length);
  }
  if (phase === 'xet-xu') {
    setEl('stat-xx-all',   all.length);
    setEl('stat-xx-dang',  all.filter(v => v.xetXu?.trangThai === 'dang-xx').length);
    setEl('stat-xx-done',  all.filter(v => v.xetXu?.trangThai === 'da-xet-xu' || v.xetXu?.trangThai === 'giai-quyet').length);
  }
}

function renderRow(v, i, phase) {
  const expiring = phase === 'dieu-tra' && v.dieuTra?.hanDieuTra && getDaysLeft(v.dieuTra.hanDieuTra) <= 7;
  const hanHtml = formatDate(v.dieuTra?.hanDieuTra)
    ? `<span style="color:${expiring ? 'var(--red)' : 'inherit'}">${formatDate(v.dieuTra.hanDieuTra)}${expiring ? ' ⚠' : ''}</span>`
    : '—';

  let statusBadge = '';
  let extraCol    = '';
  let advanceBtn  = '';

  if (phase === 'dieu-tra') {
    statusBadge = getBadgeDT(v.dieuTra?.trangThai);
    extraCol    = `<td>${hanHtml}</td>`;
    advanceBtn  = `<button class="btn-advance dt" onclick="event.stopPropagation(); openAdvance('${v.id}','truy-to')" title="Chuyển sang Truy tố">${IC.arrow} Truy tố</button>`;
  } else if (phase === 'truy-to') {
    statusBadge = getBadgeTT(v.truyTo?.trangThai);
    extraCol    = `<td>${formatDate(v.truyTo?.ngayDeNghi) || '—'}</td>`;
    advanceBtn  = `<button class="btn-advance tt" onclick="event.stopPropagation(); openAdvance('${v.id}','xet-xu')" title="Chuyển sang Xét xử">${IC.arrow} Xét xử</button>`;
  } else if (phase === 'xet-xu') {
    statusBadge = getBadgeXX(v.xetXu?.trangThai);
    extraCol    = `<td>${formatDate(v.xetXu?.ngayXetXu) || '—'}</td>`;
    advanceBtn  = '';
  }

  return `
  <tr onclick="openDetail('${v.id}')">
    <td style="color:var(--gray);font-size:11px">${i + 1}</td>
    <td class="dl-col">${escHtml(v.dl)}</td>
    <td class="name-col">${escHtml(v.tenBiCan)}${v.namSinh ? `<div style="font-size:10.5px;color:var(--text3);font-weight:400">${v.namSinh}</div>` : ''}</td>
    <td class="law-col">${escHtml(v.dieuLuat || '—')}</td>
    <td class="ksv-col">${escHtml(v.ksv || '—')}</td>
    ${extraCol}
    <td>${statusBadge}</td>
    <td onclick="event.stopPropagation()">
      <div class="action-btns" style="flex-wrap:wrap;gap:4px;">
        ${advanceBtn}
        <button class="btn btn-ghost btn-sm" title="Sửa" onclick="openEdit('${v.id}')">${IC.edit}</button>
        <button class="btn btn-danger btn-sm" title="Xóa" onclick="confirmDelete('${v.id}')">${IC.trash}</button>
      </div>
    </td>
  </tr>`;
}

// ══════════════════════════════════════════════════════════
// PHASE SWITCHING
// ══════════════════════════════════════════════════════════
function switchPhase(phase) {
  currentPhase = phase;

  // Update phase tab buttons
  document.querySelectorAll('.phase-tab').forEach(b => b.classList.remove('active'));
  const activeTab = document.getElementById(`phase-tab-${phase}`);
  if (activeTab) activeTab.classList.add('active');

  // Update sidebar buttons
  document.querySelectorAll('.nav-btn[data-phase]').forEach(b => b.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-btn[data-phase="${phase}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Show correct panel
  document.querySelectorAll('.phase-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${phase}`)?.classList.add('active');

  renderPhase(phase);
}

function setPhaseFilter(phase, value) {
  filterMap[phase] = value;
  renderPhase(phase);
  // Update active pill
  document.querySelectorAll(`#panel-${phase} .stat-pill`).forEach(p => p.classList.remove('active-filter'));
  event.currentTarget?.closest('.stat-pill')?.classList.add('active-filter');
}

function onSearch(phase) {
  searchMap[phase] = document.getElementById(`search-${phase}`)?.value || '';
  renderPhase(phase);
}

// ══════════════════════════════════════════════════════════
// ADD / EDIT FORM
// ══════════════════════════════════════════════════════════
function openAdd() {
  editingId = null;
  document.getElementById('f-phase').value = currentPhase;
  clearForm();
  document.getElementById('modal-form-title').textContent = 'Thêm vụ án mới';
  document.getElementById('modal-form-subtitle').textContent = 'Tạo ID DL tự động';
  updateFormPhaseFields();
  showModal('modal-form');
}

function openEdit(id) {
  const v = db.vuAns.find(x => x.id === id);
  if (!v) return;
  editingId = id;
  fillForm(v);
  document.getElementById('modal-form-title').textContent = 'Chỉnh sửa vụ án';
  document.getElementById('modal-form-subtitle').textContent = v.dl + ' — ' + v.tenBiCan;
  updateFormPhaseFields();
  showModal('modal-form');
}

function clearForm() {
  const ids = ['f-ten','f-namsinh','f-cccd','f-diachi','f-dieuluat','f-ksv','f-ghichu',
    'f-dt-ngaykhoi','f-dt-han','f-dt-cqdt','f-dt-ghichu',
    'f-tt-ngaydn','f-tt-ngayqd','f-tt-ghichu',
    'f-xx-ngayxx','f-xx-toa','f-xx-ghichu'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const sel = ['f-dt-trangthai','f-tt-trangthai','f-tt-ketqua','f-xx-trangthai','f-xx-ketqua'];
  sel.forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });
}

function fillForm(v) {
  document.getElementById('f-phase').value = v.giaiDoan;
  setVal('f-ten',   v.tenBiCan);
  setVal('f-namsinh', v.namSinh);
  setVal('f-cccd',  v.cccd);
  setVal('f-diachi',v.diaChi);
  setVal('f-dieuluat', v.dieuLuat);
  setVal('f-ksv',   v.ksv);
  setVal('f-ghichu',v.ghiChu);

  if (v.dieuTra) {
    setVal('f-dt-trangthai', v.dieuTra.trangThai);
    setVal('f-dt-ngaykhoi',  v.dieuTra.ngayKhoiTo);
    setVal('f-dt-han',       v.dieuTra.hanDieuTra);
    setVal('f-dt-cqdt',      v.dieuTra.coQuanDieuTra);
    setVal('f-dt-ghichu',    v.dieuTra.ghiChu);
  }
  if (v.truyTo) {
    setVal('f-tt-trangthai', v.truyTo.trangThai);
    setVal('f-tt-ketqua',    v.truyTo.ketQua);
    setVal('f-tt-ngaydn',    v.truyTo.ngayDeNghi);
    setVal('f-tt-ngayqd',    v.truyTo.ngayQuyetDinh);
    setVal('f-tt-ghichu',    v.truyTo.ghiChu);
  }
  if (v.xetXu) {
    setVal('f-xx-trangthai', v.xetXu.trangThai);
    setVal('f-xx-ketqua',    v.xetXu.ketQua);
    setVal('f-xx-ngayxx',    v.xetXu.ngayXetXu);
    setVal('f-xx-toa',       v.xetXu.toaAn);
    setVal('f-xx-ghichu',    v.xetXu.ghiChu);
  }
  updateFormPhaseFields();
}

function updateFormPhaseFields() {
  const phase = document.getElementById('f-phase')?.value || 'dieu-tra';
  ['f-section-dt','f-section-tt','f-section-xx'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'block';
    el.style.opacity = '1';
  });
  // Dim phases not reached yet
  const order = ['dieu-tra','truy-to','xet-xu'];
  const idx   = order.indexOf(editingId ? (db.vuAns.find(v=>v.id===editingId)?.giaiDoan||phase) : phase);
  ['f-section-tt','f-section-xx'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = (i+1 <= idx) ? '1' : '0.4';
  });
}

async function saveVuAn() {
  const ten     = getVal('f-ten')?.trim();
  const dieuluat= getVal('f-dieuluat')?.trim();
  if (!ten)      { showToast('Vui lòng nhập tên bị can!', 'error'); return; }
  if (!dieuluat) { showToast('Vui lòng nhập điều luật!', 'error'); return; }

  const now   = new Date().toISOString();
  const phase = document.getElementById('f-phase')?.value || 'dieu-tra';

  const dieuTra = {
    trangThai:      getVal('f-dt-trangthai') || 'moi',
    ngayKhoiTo:     getVal('f-dt-ngaykhoi') || '',
    hanDieuTra:     getVal('f-dt-han') || '',
    coQuanDieuTra:  getVal('f-dt-cqdt') || '',
    ghiChu:         getVal('f-dt-ghichu') || '',
  };

  if (editingId) {
    const idx = db.vuAns.findIndex(v => v.id === editingId);
    if (idx === -1) return;
    const old = db.vuAns[idx];
    if (!old.history) old.history = [];
    old.history.push({ ts: now, text: 'Cập nhật thông tin vụ án' });

    db.vuAns[idx] = {
      ...old,
      tenBiCan: ten,
      namSinh:  getVal('f-namsinh') || '',
      cccd:     getVal('f-cccd') || '',
      diaChi:   getVal('f-diachi') || '',
      dieuLuat: dieuluat,
      ksv:      getVal('f-ksv') || '',
      ghiChu:   getVal('f-ghichu') || '',
      dieuTra,
      truyTo: old.truyTo ? {
        ...old.truyTo,
        trangThai:      getVal('f-tt-trangthai') || old.truyTo.trangThai,
        ketQua:         getVal('f-tt-ketqua')    || old.truyTo.ketQua,
        ngayDeNghi:     getVal('f-tt-ngaydn')    || old.truyTo.ngayDeNghi,
        ngayQuyetDinh:  getVal('f-tt-ngayqd')    || old.truyTo.ngayQuyetDinh,
        ghiChu:         getVal('f-tt-ghichu')    || old.truyTo.ghiChu,
      } : null,
      xetXu: old.xetXu ? {
        ...old.xetXu,
        trangThai:  getVal('f-xx-trangthai') || old.xetXu.trangThai,
        ketQua:     getVal('f-xx-ketqua')    || old.xetXu.ketQua,
        ngayXetXu:  getVal('f-xx-ngayxx')   || old.xetXu.ngayXetXu,
        toaAn:      getVal('f-xx-toa')       || old.xetXu.toaAn,
        ghiChu:     getVal('f-xx-ghichu')    || old.xetXu.ghiChu,
      } : null,
      updatedAt: now,
    };
    showToast('Đã cập nhật vụ án!', 'success');
  } else {
    const dl = genDL();
    db.vuAns.push({
      id: 'va_' + Date.now(),
      dl, tenBiCan: ten,
      namSinh:  getVal('f-namsinh') || '',
      cccd:     getVal('f-cccd') || '',
      diaChi:   getVal('f-diachi') || '',
      dieuLuat: dieuluat,
      ksv:      getVal('f-ksv') || '',
      ghiChu:   getVal('f-ghichu') || '',
      giaiDoan: 'dieu-tra',
      dieuTra,
      truyTo: null, xetXu: null,
      notes: [],
      history: [{ ts: now, text: 'Tạo vụ án mới — giai đoạn Điều tra' }],
      createdAt: now, updatedAt: now,
    });
    showToast('Đã thêm vụ án mới!', 'success');
  }

  await saveDB();
  closeModal('modal-form');
  render();
}

function genDL() {
  const max = db.vuAns.reduce((m, v) => {
    const n = parseInt((v.dl || '').replace(/\D/g, '')) || 0;
    return Math.max(m, n);
  }, 0);
  return 'DL' + String(max + 1).padStart(3, '0');
}

// ══════════════════════════════════════════════════════════
// ADVANCE PHASE (the core feature)
// ══════════════════════════════════════════════════════════
function openAdvance(id, targetPhase) {
  const v = db.vuAns.find(x => x.id === id);
  if (!v) return;
  currentDetailId = id;

  const phaseLabel = { 'truy-to': 'Truy tố', 'xet-xu': 'Xét xử' }[targetPhase];
  document.getElementById('adv-title').textContent = `Chuyển sang giai đoạn ${phaseLabel}`;
  document.getElementById('adv-subtitle').textContent = `${v.dl} — ${v.tenBiCan}`;

  // Show/hide relevant fields
  document.getElementById('adv-tt-fields').style.display = targetPhase === 'truy-to' ? 'block' : 'none';
  document.getElementById('adv-xx-fields').style.display = targetPhase === 'xet-xu'  ? 'block' : 'none';

  // Clear fields
  ['adv-tt-trangthai','adv-tt-ketqua','adv-tt-ngaydn','adv-tt-ngayqd','adv-tt-ghichu',
   'adv-xx-trangthai','adv-xx-ketqua','adv-xx-ngayxx','adv-xx-toa','adv-xx-ghichu'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = ''; }
  });

  document.getElementById('btn-confirm-advance').onclick = () => confirmAdvance(id, targetPhase);
  showModal('modal-advance');
}

async function confirmAdvance(id, targetPhase) {
  const v   = db.vuAns.find(x => x.id === id);
  if (!v) return;
  const now = new Date().toISOString();

  if (targetPhase === 'truy-to') {
    v.truyTo = {
      trangThai:      getVal('adv-tt-trangthai') || 'de-nghi',
      ketQua:         getVal('adv-tt-ketqua')    || 'de-nghi',
      ngayDeNghi:     getVal('adv-tt-ngaydn')    || '',
      ngayQuyetDinh:  getVal('adv-tt-ngayqd')    || '',
      ghiChu:         getVal('adv-tt-ghichu')    || '',
    };
    v.giaiDoan = 'truy-to';
    v.history.push({ ts: now, text: '→ Chuyển sang giai đoạn Truy tố' });
    showToast(`✅ ${v.dl} đã chuyển sang tab Truy tố!`, 'success');
  } else if (targetPhase === 'xet-xu') {
    v.xetXu = {
      trangThai:  getVal('adv-xx-trangthai') || 'dang-xx',
      ketQua:     getVal('adv-xx-ketqua')    || 'dang-xx',
      ngayXetXu:  getVal('adv-xx-ngayxx')   || '',
      toaAn:      getVal('adv-xx-toa')       || '',
      ghiChu:     getVal('adv-xx-ghichu')    || '',
    };
    v.giaiDoan = 'xet-xu';
    v.history.push({ ts: now, text: '→ Chuyển sang giai đoạn Xét xử' });
    showToast(`✅ ${v.dl} đã chuyển sang tab Xét xử!`, 'success');
  }

  v.updatedAt = now;
  await saveDB();
  closeModal('modal-advance');
  closeModal('modal-detail');

  // Auto-switch to target tab
  setTimeout(() => switchPhase(targetPhase), 300);
}

// ══════════════════════════════════════════════════════════
// DETAIL
// ══════════════════════════════════════════════════════════
function openDetail(id) {
  const v = db.vuAns.find(x => x.id === id);
  if (!v) return;
  currentDetailId = id;

  document.getElementById('detail-title').textContent    = v.dl;
  document.getElementById('detail-subtitle').textContent = `${v.tenBiCan} — ${v.dieuLuat}`;

  // Journey
  const order  = ['dieu-tra','truy-to','xet-xu'];
  const curIdx = order.indexOf(v.giaiDoan);
  const journey = document.getElementById('detail-journey');
  journey.innerHTML = [
    { phase:'dieu-tra', label:'Điều tra', icon: IC.dt_icon, date: v.dieuTra?.ngayKhoiTo },
    { phase:'truy-to',  label:'Truy tố',  icon: IC.tt_icon, date: v.truyTo?.ngayDeNghi  },
    { phase:'xet-xu',   label:'Xét xử',   icon: IC.xx_icon, date: v.xetXu?.ngayXetXu    },
  ].map((s, i) => {
    const cls = i < curIdx ? 'done' : i === curIdx ? 'current' : 'pending';
    const dotIcon = cls === 'done' ? IC.check : s.icon;
    return `
    <div class="journey-step ${cls}">
      <div class="journey-dot">${dotIcon}</div>
      <div class="journey-label">${s.label}</div>
      <div class="journey-sub">${formatDate(s.date) || ''}</div>
    </div>`;
  }).join('');

  // Tổng quan tab
  document.getElementById('detail-info').innerHTML = `
    <div class="detail-grid" style="margin-bottom:16px">
      <div class="detail-item"><div class="detail-label">Mã DL</div><div class="detail-value" style="font-family:monospace;color:var(--accent);font-weight:700">${escHtml(v.dl)}</div></div>
      <div class="detail-item"><div class="detail-label">Giai đoạn hiện tại</div><div class="detail-value" style="margin-top:3px">${phaseLabel(v.giaiDoan)}</div></div>
      <div class="detail-item"><div class="detail-label">Họ tên bị can</div><div class="detail-value">${escHtml(v.tenBiCan)}</div></div>
      <div class="detail-item"><div class="detail-label">Năm sinh / CCCD</div><div class="detail-value">${escHtml(v.namSinh||'—')} ${v.cccd?'/ '+v.cccd:''}</div></div>
      <div class="detail-item"><div class="detail-label">Điều luật</div><div class="detail-value">${escHtml(v.dieuLuat||'—')}</div></div>
      <div class="detail-item"><div class="detail-label">KSV phụ trách</div><div class="detail-value">${escHtml(v.ksv||'—')}</div></div>
      ${v.ghiChu?`<div class="detail-item" style="grid-column:1/-1"><div class="detail-label">Ghi chú</div><div class="detail-value" style="color:var(--text2)">${escHtml(v.ghiChu)}</div></div>`:''}
    </div>

    <div class="phase-section dt">
      <div class="phase-section-header">${IC.dt_icon} Giai đoạn Điều tra</div>
      <div class="phase-section-grid">
        <div class="phase-field"><div class="phase-field-label">Trạng thái</div><div>${getBadgeDT(v.dieuTra?.trangThai)}</div></div>
        <div class="phase-field"><div class="phase-field-label">Ngày khởi tố</div><div class="phase-field-value">${formatDate(v.dieuTra?.ngayKhoiTo)||'—'}</div></div>
        <div class="phase-field"><div class="phase-field-label">Hạn điều tra</div><div class="phase-field-value">${formatDate(v.dieuTra?.hanDieuTra)||'—'}</div></div>
        <div class="phase-field"><div class="phase-field-label">CQ điều tra</div><div class="phase-field-value">${escHtml(v.dieuTra?.coQuanDieuTra||'—')}</div></div>
      </div>
    </div>

    <div class="phase-section tt ${!v.truyTo?'pending':''}">
      <div class="phase-section-header">${IC.tt_icon} Giai đoạn Truy tố ${!v.truyTo?'<span style="color:var(--text3);font-weight:400;margin-left:6px;font-size:10px">(chưa có)</span>':''}</div>
      ${v.truyTo?`
      <div class="phase-section-grid">
        <div class="phase-field"><div class="phase-field-label">Trạng thái</div><div>${getBadgeTT(v.truyTo.trangThai)}</div></div>
        <div class="phase-field"><div class="phase-field-label">Kết quả</div><div>${getBadgeTT(v.truyTo.ketQua)}</div></div>
        <div class="phase-field"><div class="phase-field-label">Ngày đề nghị</div><div class="phase-field-value">${formatDate(v.truyTo.ngayDeNghi)||'—'}</div></div>
        <div class="phase-field"><div class="phase-field-label">Ngày quyết định</div><div class="phase-field-value">${formatDate(v.truyTo.ngayQuyetDinh)||'—'}</div></div>
        ${v.truyTo.ghiChu?`<div class="phase-field" style="grid-column:1/-1"><div class="phase-field-label">Ghi chú</div><div class="phase-field-value" style="color:var(--text2)">${escHtml(v.truyTo.ghiChu)}</div></div>`:''}
      </div>`:'<div style="color:var(--text3);font-size:12px">Chưa chuyển sang giai đoạn này</div>'}
    </div>

    <div class="phase-section xx ${!v.xetXu?'pending':''}">
      <div class="phase-section-header">${IC.xx_icon} Giai đoạn Xét xử ${!v.xetXu?'<span style="color:var(--text3);font-weight:400;margin-left:6px;font-size:10px">(chưa có)</span>':''}</div>
      ${v.xetXu?`
      <div class="phase-section-grid">
        <div class="phase-field"><div class="phase-field-label">Trạng thái</div><div>${getBadgeXX(v.xetXu.trangThai)}</div></div>
        <div class="phase-field"><div class="phase-field-label">Kết quả</div><div>${getBadgeXX(v.xetXu.ketQua)}</div></div>
        <div class="phase-field"><div class="phase-field-label">Ngày xét xử</div><div class="phase-field-value">${formatDate(v.xetXu.ngayXetXu)||'—'}</div></div>
        <div class="phase-field"><div class="phase-field-label">Toà án</div><div class="phase-field-value">${escHtml(v.xetXu.toaAn||'—')}</div></div>
        ${v.xetXu.ghiChu?`<div class="phase-field" style="grid-column:1/-1"><div class="phase-field-label">Ghi chú</div><div class="phase-field-value" style="color:var(--text2)">${escHtml(v.xetXu.ghiChu)}</div></div>`:''}
      </div>`:'<div style="color:var(--text3);font-size:12px">Chưa chuyển sang giai đoạn này</div>'}
    </div>
  `;

  // Notes
  renderDetailNotes(v);
  // History
  renderDetailHistory(v);

  // Reset detail tabs
  document.querySelectorAll('.detail-tab-btn').forEach((b,i) => b.classList.toggle('active', i===0));
  document.querySelectorAll('.detail-tab-panel').forEach((p,i) => p.classList.toggle('active', i===0));

  // Advance buttons in footer
  const advDiv = document.getElementById('detail-advance-btns');
  if (advDiv) {
    advDiv.innerHTML = '';
    if (v.giaiDoan === 'dieu-tra') {
      advDiv.innerHTML = `<button class="btn-advance dt" onclick="closeModal('modal-detail'); openAdvance('${v.id}','truy-to')">${IC.arrow} Chuyển sang Truy tố</button>`;
    } else if (v.giaiDoan === 'truy-to') {
      advDiv.innerHTML = `<button class="btn-advance tt" onclick="closeModal('modal-detail'); openAdvance('${v.id}','xet-xu')">${IC.arrow} Chuyển sang Xét xử</button>`;
    }
  }

  showModal('modal-detail');
}

function phaseLabel(p) {
  const m = {'dieu-tra':'<span class="badge badge-moi">Điều tra</span>','truy-to':'<span class="badge badge-de-nghi">Truy tố</span>','xet-xu':'<span class="badge badge-da-xx">Xét xử</span>'};
  return m[p] || p;
}

function renderDetailNotes(v) {
  const list = document.getElementById('detail-notes');
  const notes = (v.notes||[]).slice().reverse();
  list.innerHTML = notes.length
    ? notes.map(n=>`<div class="note-item"><div class="note-text">${escHtml(n.text)}</div><div class="note-date">${IC.clock} ${formatDateTime(n.ts)}</div></div>`).join('')
    : '<div style="color:var(--text3);font-size:12.5px">Chưa có ghi chú</div>';
}

function renderDetailHistory(v) {
  const list = document.getElementById('detail-history');
  const hist = (v.history||[]).slice().reverse();
  list.innerHTML = hist.length
    ? `<div class="hist-list">${hist.map(h=>`<div class="hist-item"><div class="hist-dot"></div><div><div class="hist-text">${escHtml(h.text)}</div><div class="hist-time">${formatDateTime(h.ts)}</div></div></div>`).join('')}</div>`
    : '<div style="color:var(--text3);font-size:12.5px">Chưa có lịch sử</div>';
}

function switchDetailTab(tabId) {
  const tabs = ['tab-tong-quan','tab-notes','tab-history'];
  document.querySelectorAll('.detail-tab-btn').forEach((b,i) => b.classList.toggle('active', tabs[i]===tabId));
  document.querySelectorAll('.detail-tab-panel').forEach(p => p.classList.toggle('active', p.id===tabId));
}

function addDetailNote() {
  const input = document.getElementById('detail-note-input');
  const text  = input?.value?.trim();
  if (!text) return;
  const v = db.vuAns.find(x => x.id === currentDetailId);
  if (!v) return;
  if (!v.notes) v.notes = [];
  v.notes.push({ text, ts: new Date().toISOString() });
  saveDB();
  input.value = '';
  renderDetailNotes(v);
  showToast('Đã thêm ghi chú!', 'success');
}

// ══════════════════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════════════════
function confirmDelete(id) {
  const v = db.vuAns.find(x => x.id === id);
  if (!v) return;
  document.getElementById('confirm-name').textContent = `${v.dl} — ${v.tenBiCan}`;
  document.getElementById('btn-confirm-del').onclick = () => doDelete(id);
  showModal('modal-confirm');
}

async function doDelete(id) {
  db.vuAns = db.vuAns.filter(v => v.id !== id);
  await saveDB();
  closeModal('modal-confirm');
  closeModal('modal-detail');
  render();
  showToast('Đã xóa vụ án!', 'warning');
}

// ══════════════════════════════════════════════════════════
// EXPORT / IMPORT
// ══════════════════════════════════════════════════════════
function exportJSON() {
  dl(JSON.stringify(db, null, 2), `vu-an-${dateStamp()}.json`, 'application/json');
  showToast('Đã xuất file JSON!', 'success');
}

function exportCSV() {
  const headers = ['STT','DL','Tên bị can','Năm sinh','Điều luật','KSV','Ngày khởi tố','Hạn ĐT','Giai đoạn','Trạng thái ĐT','Kết quả TT','Kết quả XX','Ghi chú'];
  const phaseMap = {'dieu-tra':'Điều tra','truy-to':'Truy tố','xet-xu':'Xét xử'};
  const rows = db.vuAns.map((v,i) => [
    i+1, v.dl, v.tenBiCan, v.namSinh||'', v.dieuLuat||'', v.ksv||'',
    formatDate(v.dieuTra?.ngayKhoiTo)||'',
    formatDate(v.dieuTra?.hanDieuTra)||'',
    phaseMap[v.giaiDoan]||v.giaiDoan,
    DT_STATUS[v.dieuTra?.trangThai]?.label||'',
    TT_STATUS[v.truyTo?.ketQua]?.label||'',
    XX_STATUS[v.xetXu?.ketQua]?.label||'',
    v.ghiChu||'',
  ]);
  const csv = [headers,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  dl('\ufeff'+csv, `vu-an-${dateStamp()}.csv`, 'text/csv;charset=utf-8');
  showToast('Đã xuất CSV!', 'success');
}

function onImportFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const imp = JSON.parse(ev.target.result);
      if (!imp.vuAns) throw new Error();
      if (!confirm(`Nhập ${imp.vuAns.length} vụ án. Dữ liệu hiện tại sẽ bị ghi đè. Tiếp tục?`)) return;
      db = imp;
      await saveDB();
      render();
      closeModal('modal-import');
      showToast(`Đã nhập ${imp.vuAns.length} vụ án!`, 'success');
    } catch { showToast('File không đúng định dạng!', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

async function clearAll() {
  if (!confirm('XÓA TOÀN BỘ dữ liệu? Không thể hoàn tác!')) return;
  db = { version:3, vuAns:[] };
  await saveDB();
  render();
  closeModal('modal-import');
  showToast('Đã xóa toàn bộ!', 'warning');
}

// ══════════════════════════════════════════════════════════
// MODAL HELPERS
// ══════════════════════════════════════════════════════════
function showModal(id) { document.getElementById(id)?.classList.add('show'); }
function closeModal(id){ document.getElementById(id)?.classList.remove('show'); }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.show').forEach(m => closeModal(m.id));
});
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', function(e) { if (e.target===this) closeModal(this.id); });
});

// ══════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════
function showToast(msg, type='') {
  const icons = {
    success:`<svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:  `<svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning:`<svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icons[type]||''}${escHtml(msg)}`;
  document.getElementById('toast-container')?.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ══════════════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════════════
function setEl(id, v)  { const el=document.getElementById(id); if(el) el.textContent=v; }
function getVal(id)    { return document.getElementById(id)?.value; }
function setVal(id, v) { const el=document.getElementById(id); if(el) el.value=v||''; }

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('vi-VN');
}
function formatDateTime(ts) { if (!ts) return ''; return new Date(ts).toLocaleString('vi-VN'); }
function getDaysLeft(s) { return Math.ceil((new Date(s)-Date.now())/86400000); }
function dateStamp()   { return new Date().toISOString().slice(0,10); }
function dl(content, filename, type) {
  const b=new Blob([content],{type}), u=URL.createObjectURL(b);
  Object.assign(document.createElement('a'),{href:u,download:filename}).click();
  URL.revokeObjectURL(u);
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ══════════════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════════════
(async () => {
  await loadDB();
  switchPhase('dieu-tra');
  updateSaveIndicator(true);

  // Re-attach close handlers after DOM is stable
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', function(e) { if (e.target===this) closeModal(this.id); });
  });
})();

// ── THEME ──────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  btn.title = theme === 'dark' ? 'Chuyển sáng' : 'Chuyển tối';
}