import { db } from './config.js';
import { showModal, hideModal, showToast } from './ui.js';

let generatedLink = '';

export function openGenerateLink() {
  generatedLink = '';
  document.getElementById('gen-link-form').style.display = '';
  document.getElementById('gen-link-result').style.display = 'none';
  document.getElementById('gen-link-btn-generate').style.display = '';
  document.getElementById('gen-link-btn-copy').style.display = 'none';
  document.getElementById('gen-customer-name').value = '';
  document.getElementById('gen-note').value = '';
  showModal('generate-link-modal');
}

export async function generateBookingLink() {
  const customerName = document.getElementById('gen-customer-name').value.trim();
  const note = document.getElementById('gen-note').value.trim();
  const days = parseInt(document.getElementById('gen-expires').value);
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

  const { data: { user } } = await db.auth.getUser();
  const { data, error } = await db.from('booking_tokens').insert({
    created_by:    user.id,
    customer_name: customerName || null,
    note:          note || null,
    expires_at:    expiresAt,
  }).select('token').single();

  if (error) { showToast('生成失败：' + error.message, 'error'); return; }

  const base = window.location.origin + window.location.pathname.replace('index.html', '');
  generatedLink = `${base}booking.html?token=${data.token}`;

  document.getElementById('gen-link-url').textContent = generatedLink;
  document.getElementById('gen-link-form').style.display = 'none';
  document.getElementById('gen-link-result').style.display = '';
  document.getElementById('gen-link-btn-generate').style.display = 'none';
  document.getElementById('gen-link-btn-copy').style.display = 'flex';
}

export function copyBookingLink() {
  if (!generatedLink) return;
  navigator.clipboard.writeText(generatedLink).then(() => {
    showToast('链接已复制到剪贴板 ✓', 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = generatedLink;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('链接已复制 ✓', 'success');
  });
}

export function resetGenLink() {
  generatedLink = '';
  document.getElementById('gen-link-form').style.display = '';
  document.getElementById('gen-link-result').style.display = 'none';
  document.getElementById('gen-link-btn-generate').style.display = '';
  document.getElementById('gen-link-btn-copy').style.display = 'none';
}

// ── 加载预约申请列表 ────────────────────────────
export async function loadBookingRequests() {
  const { data: tokens } = await db
    .from('booking_tokens')
    .select('id, customer_name, note, used, expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  if (!tokens || tokens.length === 0) return;

  const tokenIds = tokens.filter(t => t.used).map(t => t.id);
  let requests = [];
  if (tokenIds.length > 0) {
    const { data } = await db
      .from('booking_requests')
      .select('token_id, owner_name, cat_name, check_in_date, check_out_date, status, submitted_at')
      .in('token_id', tokenIds)
      .order('submitted_at', { ascending: false });
    if (data) requests = data;
  }

  const container = document.getElementById('booking-requests-list');
  const now = new Date();

  // 更新统计卡片
  const pending   = requests.filter(r => r.status === 'pending').length;
  const confirmed = requests.filter(r => r.status === 'confirmed').length;
  const elPending   = document.getElementById('stat-booking-pending');
  const elConfirmed = document.getElementById('stat-booking-confirmed');
  if (elPending)   elPending.textContent   = pending;
  if (elConfirmed) elConfirmed.textContent = confirmed;

  const statusBadge = {
    pending:   '<span class="badge badge-active">⏳ 待确认</span>',
    confirmed: '<span class="badge badge-completed">✅ 已确认</span>',
    rejected:  '<span class="badge badge-cancelled">已拒绝</span>',
  };

  const rows = tokens.map(t => {
    const req     = requests.find(r => r.token_id === t.id);
    const expired = new Date(t.expires_at) < now;

    if (req) {
      // 已提交的申请 — 用 settings-section 卡片风格
      return `
        <div class="settings-section" style="margin-bottom:10px;padding:14px 16px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
            <div style="min-width:0">
              <div style="font-size:15px;font-weight:700;margin-bottom:4px">🐱 ${req.cat_name} &nbsp;·&nbsp; ${req.owner_name}</div>
              <div style="font-size:13px;color:var(--text-secondary)">${req.check_in_date} → ${req.check_out_date}</div>
              ${t.note ? `<div style="font-size:12px;color:#bbb;margin-top:2px">${t.note}</div>` : ''}
            </div>
            <div style="flex-shrink:0;margin-top:2px">${statusBadge[req.status] || req.status}</div>
          </div>
        </div>`;
    } else {
      // 未提交的 token
      if (expired) return `
        <div class="settings-section" style="margin-bottom:10px;padding:14px 16px;opacity:0.45">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div>
              <div style="font-size:14px;font-weight:600">${t.customer_name ? `${t.customer_name} 的链接` : '链接'}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">已过期 · ${t.expires_at.slice(0,10)}</div>
            </div>
            <span style="font-size:12px;color:#aaa">已过期</span>
          </div>
        </div>`;

      return `
        <div class="settings-section" style="margin-bottom:10px;padding:14px 16px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div style="min-width:0">
              <div style="font-size:14px;font-weight:700">${t.customer_name ? `${t.customer_name} 的链接` : '预约链接'}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${t.note ? t.note + ' · ' : ''}过期 ${t.expires_at.slice(0,10)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
              <span style="font-size:12px;color:#FF9500;font-weight:600">待填写</span>
              <button class="btn btn-xs btn-secondary" onclick="recopyLink('${t.customer_name || ''}')">复制</button>
            </div>
          </div>
        </div>`;
    }
  }).join('');

  container.innerHTML = rows || `<div class="empty-state"><div class="empty-icon">🔗</div><p>点击「生成链接」发给客户，<br>客户填写后自动显示在这里</p></div>`;
}

// 挂载到 window 供 HTML 调用
window.openGenerateLink = openGenerateLink;
window.generateBookingLink = generateBookingLink;
window.copyBookingLink = copyBookingLink;
window.resetGenLink = resetGenLink;
