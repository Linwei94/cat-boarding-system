import { db } from './config.js';
import { state } from './state.js';
import { showModal, hideModal, showToast } from './ui.js';
import { formatCurrency, genderBadge, daysBetween } from './utils.js';
import { loadOwners, loadCats, loadOwnerRoomPrices } from './api.js';
import { renderAll } from './render.js';

// ── 主人详情面板 ─────────────────────────────────────────────────
export function openOwnerDetail(ownerId) {
  if (!ownerId) return;
  const o = state.owners.find(x => x.id === ownerId);
  if (!o) return;

  document.getElementById('owner-detail-name').textContent = o.name + ' 的资料';

  const infoItems = [
    ['📞 电话', o.phone || '-'],
    ['💬 微信', o.wechat ? `<span style="color:#07C160">${o.wechat}</span>` : '-'],
    ['📧 邮箱', o.email || '-'],
    ['📍 地址', o.address || '-'],
    ['📝 备注', o.notes || '-'],
  ];
  document.getElementById('owner-detail-info').innerHTML = infoItems.map(([label, val]) =>
    `<div class="detail-info-item"><span class="detail-label">${label}</span><span class="detail-val">${val}</span></div>`
  ).join('');

  // 专属价格
  const priceRows = state.roomTypes.map(rt => {
    const custom = state.ownerRoomPrices.find(p => p.owner_id === ownerId && p.room_type_id === rt.id);
    const price = custom ? parseFloat(custom.price_per_day) : parseFloat(rt.price_per_day);
    const isCustom = !!custom;
    return `<span style="background:${isCustom ? '#FFF3E0' : '#F8F6F4'};border:1px solid ${isCustom ? '#FFB74D' : 'var(--border)'};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600">
      ${rt.name}：${formatCurrency(price)}/天${isCustom ? ' ★' : ''}
    </span>`;
  }).join('');
  document.getElementById('owner-detail-info').innerHTML += priceRows.length
    ? `<div class="detail-info-item" style="grid-column:1/-1"><span class="detail-label">专属价格 ★=自定义</span><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">${priceRows}</div></div>`
    : '';

  // 旗下猫咪
  const ownerCats = state.cats.filter(c => c.owner_id === ownerId);
  const catsEl = document.getElementById('owner-detail-cats');
  catsEl.innerHTML = ownerCats.length === 0
    ? '<p style="color:#aaa;font-size:13px">尚无猫咪资料</p>'
    : ownerCats.map(c => `
        <div class="cat-card" onclick="window.openCatDetail('${c.id}')" style="cursor:pointer">
          <div class="cat-card-name">${c.name} ${genderBadge(c.gender)}</div>
          <div class="cat-card-info">${[c.breed, c.age].filter(Boolean).join(' · ') || '品种未知'}</div>
          ${c.color ? `<div class="cat-card-info">${c.color}</div>` : ''}
          ${c.special_notes ? `<div class="cat-card-info" style="font-size:11px;color:#d04">${c.special_notes}</div>` : ''}
        </div>`).join('');

  // 寄养记录
  const ownerBoardings = state.boardings.filter(b => b.owner_id === ownerId);
  const boardEl = document.getElementById('owner-detail-boardings');
  const sb = { active: '<span class="badge badge-active">进行中</span>', completed: '<span class="badge badge-completed">已完成</span>', cancelled: '<span class="badge badge-cancelled">已取消</span>' };
  boardEl.innerHTML = ownerBoardings.length === 0
    ? '<p style="color:#aaa;font-size:13px">暂无寄养记录</p>'
    : `<table class="data-table" style="font-size:13px">
        <thead><tr><th>猫咪</th><th>入住</th><th>退房</th><th>房型</th><th>总价</th><th>状态</th></tr></thead>
        <tbody>${ownerBoardings.map(b => `<tr>
          <td><span class="link-text" onclick="hideModal('owner-detail-modal');window.openCatDetail('${b.cat_id}')">${b.cat?.name || '-'}</span></td>
          <td>${b.check_in_date}</td><td>${b.check_out_date}</td>
          <td>${b.room_type?.name || '-'}</td>
          <td>${formatCurrency(b.total_price)}</td>
          <td>${sb[b.status] || b.status}</td>
        </tr>`).join('')}</tbody>
      </table>`;

  showModal('owner-detail-modal');
}

// ── 主人 CRUD ────────────────────────────────────────────────────
export function openAddOwner() {
  document.getElementById('owner-modal-title').textContent = '新增主人';
  document.getElementById('owner-form').reset();
  document.getElementById('owner-id').value = '';
  renderOwnerRoomPriceInputs(null);
  showModal('add-owner-modal');
}

export function openEditOwner(id) {
  const o = state.owners.find(x => x.id === id);
  if (!o) return;
  document.getElementById('owner-modal-title').textContent = '编辑主人资料';
  document.getElementById('owner-id').value   = o.id;
  document.getElementById('owner-name').value  = o.name;
  document.getElementById('owner-phone').value = o.phone || '';
  document.getElementById('owner-email').value = o.email || '';
  document.getElementById('owner-wechat').value = o.wechat || '';
  document.getElementById('owner-address').value = o.address || '';
  document.getElementById('owner-notes').value  = o.notes || '';
  renderOwnerRoomPriceInputs(o.id);
  showModal('add-owner-modal');
}

// 动态渲染各房型价格输入栏
export function renderOwnerRoomPriceInputs(ownerId) {
  const container = document.getElementById('owner-room-prices-inputs');
  if (state.roomTypes.length === 0) {
    container.innerHTML = '<p style="color:#aaa;font-size:13px;padding:6px 0">请先在设置中新增房型</p>';
    return;
  }
  container.innerHTML = state.roomTypes.map(rt => {
    const custom = ownerId
      ? state.ownerRoomPrices.find(p => p.owner_id === ownerId && p.room_type_id === rt.id)
      : null;
    const val = custom ? parseFloat(custom.price_per_day) : '';
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="flex:1;font-size:13px;color:#555">${rt.name}</span>
        <input type="number" class="owner-room-price-input"
          data-room-type-id="${rt.id}"
          value="${val}"
          step="0.01" min="0"
          placeholder="默认 A$${rt.price_per_day}"
          style="width:130px;padding:7px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:14px">
        <span style="font-size:12px;color:#999;width:40px">A$/天</span>
      </div>`;
  }).join('');
}

export function initOwnerForm() {
  document.getElementById('owner-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('owner-id').value;
    const payload = {
      name:          document.getElementById('owner-name').value.trim(),
      phone:         document.getElementById('owner-phone').value.trim(),
      email:         document.getElementById('owner-email').value.trim(),
      wechat:        document.getElementById('owner-wechat').value.trim(),
      address:       document.getElementById('owner-address').value.trim(),
      notes:         document.getElementById('owner-notes').value.trim(),
    };

    let ownerId = id;
    let error;
    if (id) {
      ({ error } = await db.from('owners').update(payload).eq('id', id));
    } else {
      const { data, error: ie } = await db.from('owners').insert(payload).select('id').single();
      error = ie;
      if (data) ownerId = data.id;
    }
    if (error) { showToast('保存失败：' + error.message, 'error'); return; }

    // 保存各房型专属价格
    const priceInputs = document.querySelectorAll('.owner-room-price-input');
    for (const inp of priceInputs) {
      const priceVal = inp.value.trim();
      if (priceVal === '') {
        // 留空 = 删除自定义价格（使用房型默认）
        await db.from('owner_room_prices')
          .delete()
          .eq('owner_id', ownerId)
          .eq('room_type_id', inp.dataset.roomTypeId);
      } else {
        await db.from('owner_room_prices').upsert({
          owner_id:     ownerId,
          room_type_id: inp.dataset.roomTypeId,
          price_per_day: parseFloat(priceVal),
        }, { onConflict: 'owner_id,room_type_id' });
      }
    }

    showToast(id ? '主人资料已更新 ✓' : '主人已新增 ✓', 'success');
    hideModal('add-owner-modal');
    await Promise.all([loadOwners(), loadOwnerRoomPrices()]);
    renderAll();
  });
}

export async function deleteOwner(id) {
  const catCount = state.cats.filter(c => c.owner_id === id).length;
  const msg = catCount > 0
    ? `此主人有 ${catCount} 只猫咪，删除主人将一并删除所有猫咪记录。确定继续？`
    : '确认删除此主人？';
  if (!confirm(msg)) return;
  const { error } = await db.from('owners').delete().eq('id', id);
  if (error) { showToast('删除失败：' + error.message, 'error'); return; }
  showToast('已删除', 'success');
  await Promise.all([loadOwners(), loadCats()]);
  renderAll();
}
