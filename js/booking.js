import { db, SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { showModal, hideModal, showToast } from './ui.js';

let generatedLink = '';

// 兼容 HTTP 和 HTTPS 的剪贴板写入
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0.01;top:0;left:0;width:1px;height:1px;pointer-events:none';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); ta.remove(); return Promise.resolve(); }
  catch (e) { ta.remove(); return Promise.reject(e); }
}

// ── 生成预约链接 ─────────────────────────────────
export async function openGenerateLink() {
  const btn = document.querySelector('[onclick="openGenerateLink()"]');
  if (btn) { btn.disabled = true; btn.textContent = '生成中…'; }

  try {
    const { data: { user }, error: authErr } = await db.auth.getUser();
    if (authErr || !user) { showToast('请先登录', 'error'); return; }

    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const { data, error } = await db.from('booking_tokens').insert({
      created_by: user.id,
      expires_at:  expiresAt,
    }).select('token').single();

    if (error || !data) { showToast('生成失败：' + (error?.message ?? ''), 'error'); return; }

    const base = window.location.origin + window.location.pathname.replace('index.html', '');
    generatedLink = `${base}booking.html?token=${data.token}`;

    // 刷新列表
    await loadBookingRequests();

    // 弹出复制框（新的用户手势 → iOS 可以复制）
    const urlEl = document.getElementById('link-ready-url');
    if (urlEl) urlEl.textContent = generatedLink;
    showModal('link-ready-modal');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '+ 生成链接'; }
  }
}

// 分享/复制按钮：优先用 Web Share API（iOS 原生分享面板），降级到剪贴板
export async function copyFromLinkModal() {
  // Web Share API：iOS Safari 弹出原生分享面板（复制/微信/AirDrop 等）
  if (navigator.share) {
    try {
      await navigator.share({ url: generatedLink, title: '阿里嘎多猫咪寄养预约链接' });
      hideModal('link-ready-modal');
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; // 用户取消，不报错
    }
  }
  // 降级：剪贴板（HTTPS 环境）
  try {
    await copyText(generatedLink);
    showToast('🔗 链接已复制！', 'success');
    setTimeout(() => hideModal('link-ready-modal'), 500);
  } catch {
    showToast('请长按上方链接文字手动复制', 'warning');
  }
}

export function copyBookingLink() {
  if (!generatedLink) return;
  copyText(generatedLink).then(() => {
    showToast('链接已复制 ✓', 'success');
  }).catch(() => {
    showToast('复制失败，请手动复制', 'error');
  });
}

// ── 管理员通知邮箱 ────────────────────────────────
export async function loadAdminEmail() {
  const { data } = await db.from('admin_settings').select('notification_email').maybeSingle();
  const input = document.getElementById('notification-email');
  if (input && data?.notification_email) input.value = data.notification_email;
}

export async function saveAdminEmail() {
  const email = document.getElementById('notification-email')?.value?.trim();
  const { data: { user } } = await db.auth.getUser();
  const { error } = await db.from('admin_settings').upsert({
    user_id: user.id,
    notification_email: email || null,
    updated_at: new Date().toISOString(),
  });
  if (error) showToast('保存失败：' + error.message, 'error');
  else showToast('通知邮箱已保存 ✓', 'success');
}

// ── 缓存完整预约记录（供详情弹窗使用） ──────────────
let _cachedRequests = [];

// ── 加载预约申请列表 ────────────────────────────
export async function loadBookingRequests() {
  const { data: tokens } = await db
    .from('booking_tokens')
    .select('id, token, customer_name, note, used, expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  if (!tokens || tokens.length === 0) {
    const container = document.getElementById('booking-requests-list');
    if (container) container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔗</div><p>点击「生成链接」发给客户，<br>客户填写后自动显示在这里</p></div>`;
    ['stat-booking-pending','stat-booking-confirmed','stat-booking-active','stat-booking-total']
      .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = 0; });
    return;
  }

  const tokenIds = tokens.filter(t => t.used).map(t => t.id);
  let requests = [];
  if (tokenIds.length > 0) {
    const { data } = await db
      .from('booking_requests')
      .select('id, token_id, owner_name, owner_phone, owner_wechat, owner_email, owner_address, cat_name, cat_gender, cat_neutered, cat_breed, cat_age, cat_notes, additional_cats, check_in_date, check_out_date, transport, booking_notes, status, submitted_at')
      .in('token_id', tokenIds)
      .order('submitted_at', { ascending: false });
    if (data) requests = data;
  }
  _cachedRequests = requests;

  const container = document.getElementById('booking-requests-list');
  const now = new Date();

  // 更新统计卡片
  const pending   = requests.filter(r => r.status === 'pending').length;
  const confirmed = requests.filter(r => r.status === 'confirmed').length;
  const active    = tokens.filter(t => !t.used && new Date(t.expires_at) >= now).length;
  const total     = tokens.length;
  ['stat-booking-pending','stat-booking-confirmed','stat-booking-active','stat-booking-total']
    .forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.textContent = [pending, confirmed, active, total][i];
    });

  const statusBadge = {
    pending:   '<span class="badge badge-active">⏳ 待确认</span>',
    confirmed: '<span class="badge badge-completed">✅ 已确认</span>',
    rejected:  '<span class="badge badge-cancelled">已拒绝</span>',
  };

  const rows = tokens.map((t, i) => {
    const req     = requests.find(r => r.token_id === t.id);
    const expired = new Date(t.expires_at) < now;
    const createdDate = t.created_at.slice(0, 10);
    const num = `#${tokens.length - i}`;

    if (req) {
      // 已填写 → 点击打开详情弹窗
      const catNames = req.additional_cats?.length
        ? `${req.cat_name} 等${1 + req.additional_cats.length}只`
        : req.cat_name;
      return `
        <div class="settings-section booking-filled-card" style="margin-bottom:10px;overflow:hidden">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px;cursor:pointer" onclick="openBookingDetail('${req.id}')">
            <div style="min-width:0">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span style="font-size:14px;font-weight:700">🐱 ${catNames} · ${req.owner_name}</span>
                ${statusBadge[req.status] || req.status}
              </div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${req.check_in_date} → ${req.check_out_date}</div>
            </div>
            <span style="font-size:16px;color:var(--text-secondary);flex-shrink:0">›</span>
          </div>
        </div>`;
    } else if (expired) {
      return `
        <div class="settings-section" style="margin-bottom:10px;padding:14px 16px;opacity:0.5">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div>
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px">${num} · ${createdDate}</div>
              <div style="font-size:14px;font-weight:600">${t.customer_name ? `${t.customer_name} 的链接` : '预约链接'}</div>
              ${t.note ? `<div style="font-size:12px;color:#bbb;margin-top:2px">${t.note}</div>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              <span style="font-size:12px;color:#aaa">已过期</span>
              <button class="btn btn-xs btn-danger" onclick="deleteBookingToken('${t.id}')">删除</button>
            </div>
          </div>
        </div>`;
    } else {
      const daysLeft = Math.ceil((new Date(t.expires_at) - now) / 86400000);
      return `
        <div class="settings-section" style="margin-bottom:10px;padding:14px 16px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div style="min-width:0">
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px">${num} · ${createdDate}</div>
              <div style="font-size:14px;font-weight:700">${t.customer_name ? `${t.customer_name} 的链接` : '预约链接'}</div>
              ${t.note ? `<div style="font-size:12px;color:#bbb;margin-top:2px">${t.note}</div>` : ''}
              <div style="font-size:12px;color:#FF9500;margin-top:3px">待填写 · 还剩 ${daysLeft} 天</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
              <button class="btn btn-xs btn-secondary" onclick="recopyLink('${t.token}')">复制</button>
              <button class="btn btn-xs btn-danger" onclick="deleteBookingToken('${t.id}')">删除</button>
            </div>
          </div>
        </div>`;
    }
  }).join('');

  container.innerHTML = rows || `<div class="empty-state"><div class="empty-icon">🔗</div><p>点击「生成链接」发给客户，<br>客户填写后自动显示在这里</p></div>`;
}

export function toggleBookingCard(id) {
  const detail = document.getElementById(`detail-${id}`);
  const arrow  = document.getElementById(`arrow-${id}`);
  if (!detail) return;
  const open = detail.classList.toggle('hidden');
  if (arrow) arrow.style.transform = open ? '' : 'rotate(90deg)';
}

export async function deleteBookingToken(id) {
  const { error } = await db.from('booking_tokens').delete().eq('id', id);
  if (error) { showToast('删除失败：' + error.message, 'error'); return; }
  showToast('已删除 ✓', 'success');
  await loadBookingRequests();
}

export function recopyLink(token) {
  const base = window.location.origin + window.location.pathname.replace('index.html', '');
  const url = `${base}booking.html?token=${token}`;
  copyText(url).then(() => {
    showToast('链接已复制 ✓', 'success');
  }).catch(() => {
    showToast('复制失败，请手动复制', 'error');
  });
}

// ── 预约详情弹窗 ──────────────────────────────────
let _activeRequestId = null;

function genderLabel(v) {
  return v === 'male' ? '弟弟（公猫）' : v === 'female' ? '妹妹（母猫）' : v || '-';
}
function neuteredLabel(v) {
  return v === 'yes' ? '是' : v === 'no' ? '否' : v === 'unknown' ? '不确定' : '-';
}
function transportLabel(v) {
  return v === 'self' ? '自送' : v === 'pickup' ? '上门接送' : v || '-';
}
function statusConfig(s) {
  if (s === 'confirmed') return { label: '已确认入住', color: 'var(--success)', bg: 'rgba(52,199,89,0.12)' };
  if (s === 'rejected')  return { label: '已取消',     color: '#8E8E93',        bg: 'rgba(142,142,147,0.12)' };
  return                        { label: '待确认',      color: '#FF9500',        bg: 'rgba(255,149,0,0.12)' };
}

// build an iOS-style grouped row list
function bdRows(...items) {
  const rows = items.filter(Boolean).map(([label, val, extra]) =>
    `<div class="bd-row${extra ? ' bd-row-full' : ''}">
       <span class="bd-row-label">${label}</span>
       <span class="bd-row-value">${val}</span>
     </div>`
  ).join('');
  return `<div class="bd-rows">${rows}</div>`;
}

function catSection(cat, title) {
  const rows = [
    ['性别',   genderLabel(cat.cat_gender)],
    ['绝育',   neuteredLabel(cat.cat_neutered)],
    cat.cat_breed ? ['品种', cat.cat_breed] : null,
    cat.cat_age   ? ['年龄', cat.cat_age]   : null,
    cat.cat_notes ? ['备注', cat.cat_notes, 'full'] : null,
  ];
  return `
    <div class="bd-section">
      <div class="bd-section-header">${title}</div>
      ${bdRows(...rows)}
    </div>`;
}

export function openBookingDetail(requestId) {
  const req = _cachedRequests.find(r => r.id === requestId);
  if (!req) return;
  _activeRequestId = requestId;

  const cats = [req, ...(req.additional_cats || [])];
  const allCatNames = cats.map(c => c.cat_name).join('、');
  const sc = statusConfig(req.status);
  const nights = Math.round((new Date(req.check_out_date) - new Date(req.check_in_date)) / 86400000);

  // Multi-cat tabs (only when > 1)
  const catTabs = cats.length > 1
    ? `<div class="bd-cat-tabs">${cats.map((c, i) =>
        `<button class="bd-cat-tab${i === 0 ? ' active' : ''}" onclick="switchBdCat(${i})" data-idx="${i}">
          🐱 ${c.cat_name}
        </button>`).join('')}</div>`
    : '';

  // Build cat sections (all rendered, toggled via JS)
  const catSections = cats.map((c, i) =>
    `<div class="bd-cat-panel${i === 0 ? ' active' : ''}" data-cat-idx="${i}">
      ${catSection(c, cats.length > 1 ? `第 ${i + 1} 只 · ${c.cat_name}` : '猫咪信息')}
    </div>`
  ).join('');

  const body = document.getElementById('booking-detail-body');
  body.innerHTML = `
    <!-- Hero -->
    <div class="bd-hero">
      <button class="bd-close" onclick="hideModal('booking-detail-modal')">✕</button>
      <div class="bd-hero-emoji">🐱</div>
      <div class="bd-hero-names">${allCatNames}</div>
      <div class="bd-hero-owner">${req.owner_name}</div>
      <div class="bd-hero-badge" style="background:${sc.bg};color:${sc.color}">${sc.label}</div>
      <div class="bd-hero-dates">
        <span>${req.check_in_date}</span>
        <span class="bd-hero-arrow">→</span>
        <span>${req.check_out_date}</span>
        <span class="bd-hero-nights">${nights} 晚</span>
      </div>
    </div>

    <!-- 主人 -->
    <div class="bd-section">
      <div class="bd-section-header">主人</div>
      ${bdRows(
        ['姓名', req.owner_name],
        ['电话', `<a href="tel:${req.owner_phone}" class="bd-link">${req.owner_phone}</a>`],
        req.owner_wechat  ? ['微信', req.owner_wechat]  : null,
        req.owner_email   ? ['邮箱', req.owner_email]   : null,
        req.owner_address ? ['地址', req.owner_address, 'full'] : null,
      )}
    </div>

    <!-- 猫咪 -->
    ${catTabs}
    ${catSections}

    <!-- 寄养安排 -->
    <div class="bd-section">
      <div class="bd-section-header">寄养安排</div>
      ${bdRows(
        ['入住', req.check_in_date],
        ['退房', req.check_out_date],
        ['天数', `${nights} 晚`],
        req.transport     ? ['接送', transportLabel(req.transport)] : null,
        req.booking_notes ? ['备注', req.booking_notes, 'full']     : null,
      )}
    </div>

    <div style="font-size:11px;color:var(--text-tertiary);text-align:center;padding:8px 0 4px">
      提交于 ${req.submitted_at?.slice(0, 16).replace('T', ' ')}
    </div>
  `;

  // action buttons state
  const confirmBtn = document.getElementById('bd-confirm-btn');
  const rejectBtn  = document.getElementById('bd-reject-btn');
  confirmBtn.disabled = req.status === 'confirmed';
  confirmBtn.textContent = req.status === 'confirmed' ? '✅ 已确认入住' : '✅ 确认入住';
  rejectBtn.disabled = req.status === 'rejected';
  rejectBtn.textContent = req.status === 'rejected' ? '已取消' : '✕ 取消预约';

  showModal('booking-detail-modal');
}

export function switchBdCat(idx) {
  document.querySelectorAll('.bd-cat-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  document.querySelectorAll('.bd-cat-panel').forEach((p, i) => p.classList.toggle('active', i === idx));
}

export async function updateBookingStatus(status) {
  if (!_activeRequestId) return;
  const { error } = await db
    .from('booking_requests')
    .update({ status })
    .eq('id', _activeRequestId);
  if (error) { showToast('更新失败：' + error.message, 'error'); return; }
  showToast(status === 'confirmed' ? '已确认入住 ✓' : '已取消预约', 'success');
  hideModal('booking-detail-modal');
  await loadBookingRequests();
}

// 挂载到 window 供 HTML 调用
window.openGenerateLink   = openGenerateLink;
window.copyBookingLink    = copyBookingLink;
window.copyFromLinkModal  = copyFromLinkModal;
window.recopyLink         = recopyLink;
window.deleteBookingToken = deleteBookingToken;
window.toggleBookingCard  = toggleBookingCard;
window.saveAdminEmail     = saveAdminEmail;
window.openBookingDetail   = openBookingDetail;
window.updateBookingStatus = updateBookingStatus;
window.switchBdCat         = switchBdCat;
