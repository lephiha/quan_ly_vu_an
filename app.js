/* ============================================================
   QUAN LY VU AN — app.js
   ============================================================ */

'use strict';

// ── STORAGE ────────────────────────────────────────────────
const STORAGE_KEY = 'quan_ly_vu_an_v2';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { vuAns: [], version: 2 };
  } catch {
    return { vuAns: [], version: 2 };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  updateSaveIndicator();
}

function updateSaveIndicator() {
  const el = document.getElementById('save-time');
  if (!el) return;
  const now = new Date();
  el.textContent = `Lưu lúc ${now.toLocaleTimeString('vi-VN')}`;
  const dot = document.getElementById('save-dot');
  if (dot) { dot.style.background = 'var(--green)'; }
}

// ── STATE ──────────────────────────────────────────────────
let db              = loadData();
let currentFilter   = 'all';
let currentDetailId = null;
let editingId       = null;
let biCanRowIdx     = 0;

if (!db.vuAns) db.vuAns = [];

// ── ICONS (inline SVG strings) ─────────────────────────────
const ICONS = {
  search:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  plus:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  x:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  save:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  file:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  user:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  clock:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  info:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  alert:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  note:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  history:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.94"/></svg>`,
  folder:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  list:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  scales:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 9l14-6"/><path d="M3 12s0 5 5 5 5-5 5-5-0-5-5-5-5 5-5 5z"/><path d="M16 12s0 5 5 5 5-5 5-5-0-5-5-5-5 5-5 5z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>`,
};

// ── STATUS CONFIG ──────────────────────────────────────────
const STATUS = {
  'dieu-tra':    { label: 'Đang điều tra',      cls: 'badge-dieu-tra',    icon: ICONS.search  },
  'de-nghi':     { label: 'Đề nghị truy tố',    cls: 'badge-de-nghi',     icon: ICONS.file    },
  'truy-to':     { label: 'Đã truy tố',          cls: 'badge-truy-to',     icon: ICONS.scales  },
  'dinh-chi':    { label: 'Đình chỉ',            cls: 'badge-dinh-chi',    icon: ICONS.x       },
  'tam-dinh-chi':{ label: 'Tạm đình chỉ',        cls: 'badge-tam-dinh-chi', icon: ICONS.clock  },
};

function getBadge(status) {
  const s = STATUS[status] || { label: status, cls: '', icon: '' };
  return `<span class="badge ${s.cls}">${s.icon}${s.label}</span>`;
}

function getStatusLabel(s) {
  return STATUS[s]?.label || s;
}

// ── RENDER ─────────────────────────────────────────────────
function getFilteredData() {
  const q    = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const sort = document.getElementById('sort-select')?.value || 'date-desc';

  let data = [...db.vuAns];

  if (currentFilter !== 'all') {
    data = data.filter(v => v.trangThai === currentFilter);
  }

  if (q) {
    data = data.filter(v => {
      const bcStr = (v.biCans || []).map(b => b.ten.toLowerCase()).join(' ');
      return v.soVu.toLowerCase().includes(q)
          || v.toiDanh.toLowerCase().includes(q)
          || bcStr.includes(q)
          || (v.ksv || '').toLowerCase().includes(q)
          || (v.dieuKhoan || '').toLowerCase().includes(q);
    });
  }

  const sortFns = {
    'date-desc': (a, b) => new Date(b.ngayKhoiTo || 0) - new Date(a.ngayKhoiTo || 0),
    'date-asc':  (a, b) => new Date(a.ngayKhoiTo || 0) - new Date(b.ngayKhoiTo || 0),
    'so-vu':     (a, b) => a.soVu.localeCompare(b.soVu),
    'status':    (a, b) => a.trangThai.localeCompare(b.trangThai),
  };

  data.sort(sortFns[sort] || sortFns['date-desc']);
  return data;
}

function renderTable() {
  updateStats();

  const data  = getFilteredData();
  const tbody = document.getElementById('table-body');
  const empty = document.getElementById('empty-state');

  if (!data.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  tbody.innerHTML = data.map((v, i) => {
    const bcStr     = (v.biCans || []).map(b => b.ten).join(', ') || '—';
    const bcDisplay = bcStr.length > 28 ? bcStr.slice(0, 28) + '…' : bcStr;
    const badge     = getBadge(v.trangThai);
    const ngay      = formatDate(v.ngayKhoiTo);
    const han       = formatDate(v.hanDieuTra);
    const expiring  = v.hanDieuTra && getDaysLeft(v.hanDieuTra) <= 7 && v.trangThai === 'dieu-tra';
    const hanHtml   = han
      ? `<span style="color:${expiring ? 'var(--red)' : 'inherit'}">${han}${expiring ? ' ⚠' : ''}</span>`
      : '—';

    return `
    <tr onclick="openDetail('${v.id}')">
      <td style="color:var(--gray);font-size:12px">${i + 1}</td>
      <td class="so-vu">${escHtml(v.soVu)}</td>
      <td class="bi-can" title="${escHtml(bcStr)}">${escHtml(bcDisplay)}</td>
      <td class="toi-danh">${escHtml(v.toiDanh)}</td>
      <td>${ngay || '—'}</td>
      <td>${hanHtml}</td>
      <td>${badge}</td>
      <td style="font-size:12px;color:var(--text2)">${escHtml(v.ksv || '—')}</td>
      <td onclick="event.stopPropagation()">
        <div class="action-btns">
          <button class="btn btn-ghost btn-sm" title="Chỉnh sửa" onclick="openEdit('${v.id}')">${ICONS.edit}</button>
          <button class="btn btn-danger btn-sm" title="Xóa" onclick="confirmDelete('${v.id}')">${ICONS.trash}</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function updateStats() {
  const all   = db.vuAns;
  const count = s => all.filter(v => v.trangThai === s).length;

  const stats = {
    all:           all.length,
    'dieu-tra':    count('dieu-tra'),
    'de-nghi':     count('de-nghi'),
    'truy-to':     count('truy-to'),
    'dinh-chi':    count('dinh-chi'),
    'tam-dinh-chi':count('tam-dinh-chi'),
  };

  Object.entries(stats).forEach(([k, v]) => {
    const el = document.getElementById(`stat-${k}`);
    if (el) el.textContent = v;
    const b = document.getElementById(`badge-${k}`);
    if (b) b.textContent = v;
  });

  // Active card highlight
  document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active-filter'));
  const cardMap = { all:'card-all','dieu-tra':'card-dieu-tra','de-nghi':'card-de-nghi','truy-to':'card-truy-to','dinh-chi':'card-dinh-chi' };
  const activeCard = document.getElementById(cardMap[currentFilter]);
  if (activeCard) activeCard.classList.add('active-filter');

  // Active nav btn
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-btn[data-filter="${currentFilter}"]`);
  if (activeNav) activeNav.classList.add('active');
}

function filterByStatus(status) {
  currentFilter = status;
  const titles = {
    all: 'Tất cả vụ án',
    'dieu-tra': 'Đang điều tra',
    'de-nghi': 'Đề nghị truy tố',
    'truy-to': 'Đã truy tố',
    'dinh-chi': 'Đình chỉ',
    'tam-dinh-chi': 'Tạm đình chỉ',
  };
  const el = document.getElementById('page-title');
  if (el) el.textContent = titles[status] || status;
  renderTable();
}

// ── FORM ───────────────────────────────────────────────────
function openAddModal() {
  editingId = null;
  setModalTitle('modal-form', 'Thêm vụ án mới', 'Nhập thông tin vụ án mới');
  clearForm();
  addBiCanRow();
  showModal('modal-form');
}

function openEdit(id) {
  const v = db.vuAns.find(x => x.id === id);
  if (!v) return;
  editingId = id;
  setModalTitle('modal-form', 'Chỉnh sửa vụ án', v.soVu);
  fillForm(v);
  showModal('modal-form');
}

function openEditFromDetail() {
  closeModal('modal-detail');
  openEdit(currentDetailId);
}

function setModalTitle(modalId, title, subtitle) {
  const t = document.getElementById(`${modalId}-title`);
  const s = document.getElementById(`${modalId}-subtitle`);
  if (t) t.textContent = title;
  if (s) s.textContent = subtitle || '';
}

function clearForm() {
  ['f-so-vu','f-toi-danh','f-dieu-khoan','f-ksv','f-ngay-khoi-to','f-han-dt','f-ngay-de-nghi','f-ghi-chu'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const sel = document.getElementById('f-trang-thai');
  if (sel) sel.value = 'dieu-tra';
  biCanRowIdx = 0;
  const rows = document.getElementById('bi-can-rows');
  if (rows) rows.innerHTML = '';
}

function fillForm(v) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('f-so-vu',       v.soVu);
  set('f-toi-danh',    v.toiDanh);
  set('f-dieu-khoan',  v.dieuKhoan);
  set('f-trang-thai',  v.trangThai);
  set('f-ksv',         v.ksv);
  set('f-ngay-khoi-to',v.ngayKhoiTo);
  set('f-han-dt',      v.hanDieuTra);
  set('f-ngay-de-nghi',v.ngayDeNghi);
  set('f-ghi-chu',     v.ghiChu);

  biCanRowIdx = 0;
  const rows = document.getElementById('bi-can-rows');
  if (rows) rows.innerHTML = '';
  (v.biCans || []).forEach(bc => addBiCanRow(bc));
  if (!v.biCans || !v.biCans.length) addBiCanRow();
}

function addBiCanRow(bc) {
  const idx = biCanRowIdx++;
  const row = document.createElement('div');
  row.className = 'bi-can-item';
  row.id = `bc-row-${idx}`;
  row.innerHTML = `
    <input class="form-control" placeholder="Họ tên bị can *" id="bc-ten-${idx}" value="${escAttr(bc?.ten || '')}">
    <input class="form-control" placeholder="Năm sinh" id="bc-ns-${idx}" value="${escAttr(bc?.namSinh || '')}">
    <input class="form-control" placeholder="CCCD / Ghi chú" id="bc-info-${idx}" value="${escAttr(bc?.cccd || '')}">
    <button class="remove-bc" title="Xóa bị can" onclick="removeBiCanRow(${idx})">${ICONS.x}</button>
  `;
  document.getElementById('bi-can-rows')?.appendChild(row);
}

function removeBiCanRow(idx) {
  document.getElementById(`bc-row-${idx}`)?.remove();
}

function collectBiCans() {
  const result = [];
  document.querySelectorAll('#bi-can-rows .bi-can-item').forEach(row => {
    const idx = row.id.replace('bc-row-', '');
    const ten = document.getElementById(`bc-ten-${idx}`)?.value?.trim();
    if (ten) {
      result.push({
        ten,
        namSinh: document.getElementById(`bc-ns-${idx}`)?.value?.trim() || '',
        cccd:    document.getElementById(`bc-info-${idx}`)?.value?.trim() || '',
      });
    }
  });
  return result;
}

function saveVuAn() {
  const soVu    = document.getElementById('f-so-vu')?.value?.trim();
  const toiDanh = document.getElementById('f-toi-danh')?.value?.trim();

  if (!soVu)    { showToast('Vui lòng nhập số vụ án!', 'error'); return; }
  if (!toiDanh) { showToast('Vui lòng nhập tội danh!', 'error'); return; }

  const biCans   = collectBiCans();
  const now      = new Date().toISOString();
  const trangThai = document.getElementById('f-trang-thai')?.value;

  const data = {
    soVu, toiDanh, trangThai,
    dieuKhoan:  document.getElementById('f-dieu-khoan')?.value?.trim() || '',
    ksv:        document.getElementById('f-ksv')?.value?.trim() || '',
    ngayKhoiTo: document.getElementById('f-ngay-khoi-to')?.value || '',
    hanDieuTra: document.getElementById('f-han-dt')?.value || '',
    ngayDeNghi: document.getElementById('f-ngay-de-nghi')?.value || '',
    ghiChu:     document.getElementById('f-ghi-chu')?.value?.trim() || '',
    biCans,
  };

  if (editingId) {
    const idx = db.vuAns.findIndex(v => v.id === editingId);
    if (idx !== -1) {
      const old = db.vuAns[idx];
      if (!old.history) old.history = [];
      if (old.trangThai !== trangThai) {
        old.history.push({ ts: now, text: `Đổi trạng thái: ${getStatusLabel(old.trangThai)} → ${getStatusLabel(trangThai)}` });
      }
      old.history.push({ ts: now, text: 'Cập nhật thông tin vụ án' });
      db.vuAns[idx] = { ...old, ...data, updatedAt: now };
    }
    showToast('Đã cập nhật vụ án!', 'success');
  } else {
    db.vuAns.push({
      id: 'va_' + Date.now(),
      ...data,
      createdAt: now, updatedAt: now,
      notes: [],
      history: [{ ts: now, text: 'Tạo mới vụ án' }],
    });
    showToast('Đã thêm vụ án mới!', 'success');
  }

  saveData(db);
  closeModal('modal-form');
  renderTable();
}

// ── DETAIL ─────────────────────────────────────────────────
function openDetail(id) {
  const v = db.vuAns.find(x => x.id === id);
  if (!v) return;
  currentDetailId = id;

  setModalTitle('modal-detail', v.soVu, v.toiDanh + (v.dieuKhoan ? ' — ' + v.dieuKhoan : ''));

  // Info grid
  document.getElementById('detail-grid').innerHTML = `
    <div class="detail-item"><div class="detail-label">Trạng thái</div><div class="detail-value" style="margin-top:4px">${getBadge(v.trangThai)}</div></div>
    <div class="detail-item"><div class="detail-label">KSV phụ trách</div><div class="detail-value">${escHtml(v.ksv || '—')}</div></div>
    <div class="detail-item"><div class="detail-label">Ngày khởi tố</div><div class="detail-value">${formatDate(v.ngayKhoiTo) || '—'}</div></div>
    <div class="detail-item"><div class="detail-label">Hạn điều tra</div><div class="detail-value">${formatDate(v.hanDieuTra) || '—'}</div></div>
    <div class="detail-item"><div class="detail-label">Ngày đề nghị TT</div><div class="detail-value">${formatDate(v.ngayDeNghi) || '—'}</div></div>
    <div class="detail-item"><div class="detail-label">Số bị can</div><div class="detail-value">${(v.biCans || []).length} người</div></div>
    ${v.ghiChu ? `<div class="detail-item" style="grid-column:1/-1"><div class="detail-label">Ghi chú</div><div class="detail-value" style="color:var(--text2)">${escHtml(v.ghiChu)}</div></div>` : ''}
  `;

  // Bị can list
  const bcList = document.getElementById('detail-bican-list');
  bcList.innerHTML = (v.biCans || []).length === 0
    ? `<div style="color:var(--text2);font-size:13px;padding:10px 0">Chưa có bị can nào</div>`
    : (v.biCans || []).map((b, i) => `
      <div class="bc-detail-item">
        <div class="bc-avatar">${b.ten.charAt(0).toUpperCase()}</div>
        <div>
          <div class="bc-name">${i + 1}. ${escHtml(b.ten)}</div>
          <div class="bc-info">${[b.namSinh ? 'Sinh ' + b.namSinh : '', b.cccd].filter(Boolean).join(' · ') || 'Chưa có thông tin thêm'}</div>
        </div>
      </div>`).join('');

  renderNotes(v);
  renderHistory(v);

  // Reset tabs
  document.querySelectorAll('#modal-detail .tab-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.querySelectorAll('#modal-detail .tab-content').forEach((c, i) => c.classList.toggle('active', i === 0));

  showModal('modal-detail');
}

function renderNotes(v) {
  const list  = document.getElementById('note-list');
  const notes = (v.notes || []).slice().reverse();
  list.innerHTML = notes.length
    ? notes.map(n => `
      <div class="note-item">
        <div class="note-text">${escHtml(n.text)}</div>
        <div class="note-date">${ICONS.clock} ${formatDateTime(n.ts)}</div>
      </div>`).join('')
    : `<div style="color:var(--text2);font-size:13px">Chưa có ghi chú nào</div>`;
}

function renderHistory(v) {
  const list = document.getElementById('history-list');
  const hist = (v.history || []).slice().reverse();
  list.innerHTML = hist.length
    ? `<div class="hist-list">${hist.map(h => `
        <div class="hist-item">
          <div class="hist-dot"></div>
          <div>
            <div class="hist-text">${escHtml(h.text)}</div>
            <div class="hist-time">${formatDateTime(h.ts)}</div>
          </div>
        </div>`).join('')}</div>`
    : `<div style="color:var(--text2);font-size:13px">Chưa có lịch sử</div>`;
}

function addNote() {
  const input = document.getElementById('note-input');
  const text  = input?.value?.trim();
  if (!text) return;
  const v = db.vuAns.find(x => x.id === currentDetailId);
  if (!v) return;
  if (!v.notes) v.notes = [];
  v.notes.push({ text, ts: new Date().toISOString() });
  saveData(db);
  input.value = '';
  renderNotes(v);
  showToast('Đã thêm ghi chú!', 'success');
}

function switchTab(tabId) {
  const tabs    = ['tab-info','tab-bican','tab-note','tab-history'];
  const btns    = document.querySelectorAll('#modal-detail .tab-btn');
  btns.forEach((b, i) => b.classList.toggle('active', tabs[i] === tabId));
  document.querySelectorAll('#modal-detail .tab-content').forEach(c => {
    c.classList.toggle('active', c.id === tabId);
  });
}

// ── DELETE ─────────────────────────────────────────────────
function confirmDelete(id) {
  const v = db.vuAns.find(x => x.id === id);
  if (!v) return;
  document.getElementById('confirm-name').textContent = `${v.soVu} — ${v.toiDanh}`;
  document.getElementById('confirm-delete-btn').onclick = () => deleteVuAn(id);
  showModal('modal-confirm');
}

function deleteVuAn(id) {
  db.vuAns = db.vuAns.filter(v => v.id !== id);
  saveData(db);
  closeModal('modal-confirm');
  closeModal('modal-detail');
  renderTable();
  showToast('Đã xóa vụ án!', 'warning');
}

// ── EXPORT / IMPORT ────────────────────────────────────────
function exportData() {
  download(JSON.stringify(db, null, 2), `vu-an-backup-${dateStamp()}.json`, 'application/json');
  showToast('Đã xuất file backup!', 'success');
}

function exportExcel() {
  const data = getFilteredData();
  const headers = ['STT','Số vụ án','Bị can','Tội danh','Điều khoản','Ngày khởi tố','Hạn điều tra','Trạng thái','KSV phụ trách','Ghi chú'];
  const rows = data.map((v, i) => [
    i + 1, v.soVu,
    (v.biCans || []).map(b => b.ten).join('; '),
    v.toiDanh, v.dieuKhoan || '',
    formatDate(v.ngayKhoiTo) || '',
    formatDate(v.hanDieuTra) || '',
    getStatusLabel(v.trangThai),
    v.ksv || '', v.ghiChu || '',
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  download('\ufeff' + csv, `danh-sach-vu-an-${dateStamp()}.csv`, 'text/csv;charset=utf-8');
  showToast('Đã xuất CSV!', 'success');
}

function importData(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!imported.vuAns) throw new Error('invalid');
      if (!confirm(`Nhập ${imported.vuAns.length} vụ án. Dữ liệu hiện tại sẽ bị ghi đè. Tiếp tục?`)) return;
      db = imported;
      saveData(db);
      renderTable();
      closeModal('modal-import');
      showToast(`Đã nhập ${imported.vuAns.length} vụ án!`, 'success');
    } catch {
      showToast('File không đúng định dạng!', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function clearAllData() {
  if (!confirm('XÓA TOÀN BỘ dữ liệu? Hành động này không thể hoàn tác!')) return;
  db = { vuAns: [], version: 2 };
  saveData(db);
  renderTable();
  closeModal('modal-import');
  showToast('Đã xóa toàn bộ dữ liệu!', 'warning');
}

function openImport() { showModal('modal-import'); }

// ── MODAL HELPERS ──────────────────────────────────────────
function showModal(id) { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

// ── TOAST ──────────────────────────────────────────────────
const TOAST_ICONS = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

function showToast(msg, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${TOAST_ICONS[type] || ''}${escHtml(msg)}`;
  document.getElementById('toast-container')?.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── UTILS ──────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('vi-VN');
}

function formatDateTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('vi-VN');
}

function getDaysLeft(dateStr) {
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ── KEYBOARD / GLOBAL EVENTS ───────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => closeModal(m.id));
  }
});

document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', function(e) {
    if (e.target === this) closeModal(this.id);
  });
});

// ── DEMO DATA ──────────────────────────────────────────────
function initDemo() {
  if (db.vuAns.length > 0) return;
  const now = new Date().toISOString();
  const mk = (id, soVu, toiDanh, dieuKhoan, trangThai, ksv, ngayKhoiTo, hanDieuTra, ngayDeNghi, ghiChu, biCans) => ({
    id, soVu, toiDanh, dieuKhoan, trangThai, ksv,
    ngayKhoiTo, hanDieuTra, ngayDeNghi, ghiChu,
    biCans: biCans.map(([ten, namSinh, cccd]) => ({ ten, namSinh, cccd })),
    notes: [], history: [{ ts: now, text: 'Tạo mới vụ án' }],
    createdAt: now, updatedAt: now,
  });

  db.vuAns = [
    mk('va_1','42/QĐ-CSHS','Đào lửa','Điều 168 BLHS','truy-to','La Phi Hề','2025-01-15','2025-04-15','2025-03-20','Bao dooki',[
    ['Lê Phạm Lanh Anh','2003','030195001234']
  ]),
    mk('va_2','57/QĐ-CSHS','Lừa đảo chiếm đoạt tài sản','Điều 174 BLHS','de-nghi','Trần Thị B','2025-02-03','2025-08-03','2025-05-01','Chờ VKS phê chuẩn',[['Trần Thị Bình','1988','038088009876']]),
    mk('va_3','61/QĐ-CSHS','Tàng trữ ma túy','Điều 249 BLHS','dieu-tra','Lê Hoàng C','2025-03-20','2025-06-20','','',[ ['Lê Hoàng Cường','2000','']]),
    mk('va_4','74/QĐ-CSHS','Cố ý gây thương tích','Điều 134 BLHS','de-nghi','Phạm Minh D','2025-04-10','2025-07-10','2025-06-05','2 bị can',[['Phạm Minh Đức','1992',''],['Nguyễn Thanh Hải','1990','']]),
    mk('va_5','89/QĐ-CSHS','Trộm cắp tài sản','Điều 173 BLHS','dinh-chi','Hoàng Thị E','2025-05-05','2025-08-05','','Bị hại rút đơn',[['Hoàng Thị Em','2003','']]),
  ];
  saveData(db);
}

// ── BOOT ───────────────────────────────────────────────────
initDemo();
renderTable();
updateSaveIndicator();