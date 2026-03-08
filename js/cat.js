import { db } from './config.js';
import { state } from './state.js';
import { showModal, hideModal, showToast } from './ui.js';
import { formatCurrency, genderBadge, daysBetween } from './utils.js';
import { loadCats } from './api.js';
import { renderAll } from './render.js';

export function openCatDetail(catId) {
  if (!catId) return;
  const c = state.cats.find(x => x.id === catId);
  if (!c) return;
  const owner = state.owners.find(o => o.id === c.owner_id);

  document.getElementById('cat-detail-name').innerHTML = c.name + ' ' + genderBadge(c.gender);
  document.getElementById('cat-detail-edit-btn').onclick = () => { hideModal('cat-detail-modal'); openEditCat(catId); };

  const infoItems = [
    ['🐾 品种', c.breed || '-'],
    ['🎂 年龄', c.age || '-'],
    ['🎨 颜色', c.color || '-'],
    ['👤 主人', owner ? `<span class="link-text" onclick="window.hideModal('cat-detail-modal');window.openOwnerDetail('${owner.id}')">${owner.name}</span>` : '-'],
    ['📞 主人电话', owner?.phone || '-'],
    ['📝 特殊说明', c.special_notes || '无'],
  ];
  document.getElementById('cat-detail-info').innerHTML = infoItems.map(([label, val]) =>
    `<div class="detail-info-item"><span class="detail-label">${label}</span><span class="detail-val">${val}</span></div>`
  ).join('');

  const catBoardings = state.boardings.filter(b => b.cat_id === catId);
  const boardEl = document.getElementById('cat-detail-boardings');
  const sb = { active: '<span class="badge badge-active">进行中</span>', completed: '<span class="badge badge-completed">已完成</span>', cancelled: '<span class="badge badge-cancelled">已取消</span>' };
  boardEl.innerHTML = catBoardings.length === 0
    ? '<p style="color:#aaa;font-size:13px">暂无寄养记录</p>'
    : `<table class="data-table" style="font-size:13px">
        <thead><tr><th>入住</th><th>退房</th><th>天数</th><th>房型</th><th>日费</th><th>总价</th><th>状态</th></tr></thead>
        <tbody>${catBoardings.map(b => `<tr>
          <td>${b.check_in_date}</td><td>${b.check_out_date}</td>
          <td>${daysBetween(b.check_in_date, b.check_out_date)} 天</td>
          <td>${b.room_type?.name || '-'}</td>
          <td>${formatCurrency(b.daily_rate)}</td>
          <td><strong>${formatCurrency(b.total_price)}</strong></td>
          <td>${sb[b.status] || b.status}</td>
        </tr>`).join('')}</tbody>
      </table>`;

  showModal('cat-detail-modal');
}

export function openAddCat() {
  document.getElementById('cat-modal-title').textContent = '新增猫咪';
  document.getElementById('cat-form').reset();
  document.getElementById('cat-id').value = '';
  showModal('add-cat-modal');
}

export function openEditCat(id) {
  const c = state.cats.find(x => x.id === id);
  if (!c) return;
  document.getElementById('cat-modal-title').textContent = '编辑猫咪资料';
  document.getElementById('cat-id').value      = c.id;
  document.getElementById('cat-name').value    = c.name;
  document.getElementById('cat-owner').value   = c.owner_id;
  document.getElementById('cat-breed').value   = c.breed || '';
  document.getElementById('cat-age').value     = c.age || '';
  document.getElementById('cat-gender').value  = c.gender || 'unknown';
  document.getElementById('cat-color').value   = c.color || '';
  document.getElementById('cat-notes').value   = c.special_notes || '';
  showModal('add-cat-modal');
}

export function initCatForm() {
  document.getElementById('cat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const payload = {
      name:          document.getElementById('cat-name').value.trim(),
      owner_id:      document.getElementById('cat-owner').value,
      breed:         document.getElementById('cat-breed').value.trim(),
      age:           document.getElementById('cat-age').value.trim(),
      gender:        document.getElementById('cat-gender').value,
      color:         document.getElementById('cat-color').value.trim(),
      special_notes: document.getElementById('cat-notes').value.trim(),
    };
    const { error } = id
      ? await db.from('cats').update(payload).eq('id', id)
      : await db.from('cats').insert(payload);
    if (error) { showToast('保存失败：' + error.message, 'error'); return; }
    showToast(id ? '猫咪资料已更新 ✓' : '猫咪已新增 ✓', 'success');
    hideModal('add-cat-modal');
    await loadCats();
    renderAll();
  });
}

export async function deleteCat(id) {
  if (!confirm('确认删除此猫咪？')) return;
  const { error } = await db.from('cats').delete().eq('id', id);
  if (error) { showToast('删除失败', 'error'); return; }
  showToast('已删除', 'success');
  state.cats = state.cats.filter(c => c.id !== id);
  renderAll();
}
