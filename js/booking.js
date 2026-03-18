import { db } from './config.js';
import { showModal, hideModal, showToast } from './ui.js';

let generatedLink = '';

export function openGenerateLink() {
  document.getElementById('gen-link-form').style.display = '';
  document.getElementById('gen-link-result').style.display = 'none';
  document.getElementById('gen-customer-name').value = '';
  document.getElementById('gen-note').value = '';
  showModal('generate-link-modal');
}

export async function generateBookingLink() {
  const customerName = document.getElementById('gen-customer-name').value.trim();
  const note = document.getElementById('gen-note').value.trim();
  const days = parseInt(document.getElementById('gen-expires').value);
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

  const { data, error } = await db.from('booking_tokens').insert({
    customer_name: customerName || null,
    note: note || null,
    expires_at: expiresAt,
  }).select('token').single();

  if (error) { showToast('生成失败：' + error.message, 'error'); return; }

  const base = window.location.origin + window.location.pathname.replace('index.html', '');
  generatedLink = `${base}booking.html?token=${data.token}`;

  document.getElementById('gen-link-url').textContent = generatedLink;
  document.getElementById('gen-link-form').style.display = 'none';
  document.getElementById('gen-link-result').style.display = '';
}

export function copyBookingLink() {
  if (!generatedLink) return;
  navigator.clipboard.writeText(generatedLink).then(() => {
    showToast('链接已复制到剪贴板 ✓', 'success');
  }).catch(() => {
    // fallback
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
}

// ── 加载预约申请列表 ────────────────────────────
export async function loadBookingRequests() {
  const { data: tokens } = await db.from('booking_tokens').select('id, customer_name, note, used, expires_at, created_at').order('created_at', { ascending: false }).limit(20);
  if (!tokens || tokens.length === 0) return;

  const tokenIds = tokens.filter(t => t.used).map(t => t.id);
  let requests = [];
  if (tokenIds.length > 0) {
    const { data } = await db.from('booking_requests')
      .select('token_id, owner_name, cat_name, check_in_date, check_out_date, status, submitted_at')
      .in('token_id', tokenIds)
      .order('submitted_at', { ascending: false });
    if (data) requests = data;
  }

  const container = document.getElementById('booking-requests-list');
  const now = new Date();

  const rows = tokens.map(t => {
    const req = requests.find(r => r.token_id === t.id);
    const expired = new Date(t.expires_at) < now;

    if (req) {
      const statusMap = { pending: '⏳ 待确认', confirmed: '✅ 已确认', rejected: '❌ 已拒绝' };
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);gap:8px">
          <div style="min-width:0">
            <div style="font-size:14px;font-weight:700">${req.owner_name} · ${req.cat_name}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${req.check_in_date} → ${req.check_out_date}</div>
          </div>
          <div style="flex-shrink:0">
            <span style="font-size:12px;font-weight:600">${statusMap[req.status] || req.status}</span>
          </div>
        </div>`;
    } else {
      const label = t.customer_name ? `为 ${t.customer_name}` : '待发出';
      const statusTag = t.used ? '已提交' : expired ? '<span style="color:#999">已过期</span>' : '<span style="color:#FF9500">待填写</span>';
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);gap:8px;opacity:${expired && !t.used ? 0.5 : 1}">
          <div style="min-width:0">
            <div style="font-size:14px;font-weight:600">${label}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${t.note || ''}${t.note && !expired ? ' · ' : ''}过期：${t.expires_at.slice(0,10)}</div>
          </div>
          <div style="flex-shrink:0;font-size:12px">${statusTag}</div>
        </div>`;
    }
  }).join('');

  container.innerHTML = rows || '<div style="padding:24px;text-align:center;color:#aaa;font-size:13px">暂无预约记录</div>';
}

// 挂载到 window 供 HTML 调用
window.openGenerateLink = openGenerateLink;
window.generateBookingLink = generateBookingLink;
window.copyBookingLink = copyBookingLink;
window.resetGenLink = resetGenLink;
