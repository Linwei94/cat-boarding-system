import { db } from './config.js';
import { state } from './state.js';
import { showModal, hideModal, showToast } from './ui.js';
import { getToday, formatCurrency, daysBetween, getOwnerRoomPrice } from './utils.js';
import { loadBoardings } from './api.js';
import { renderAll } from './render.js';

export function openAddBoarding() {
  document.getElementById('boarding-modal-title').textContent = '新增寄养';
  document.getElementById('boarding-form').reset();
  document.getElementById('boarding-id').value = '';
  document.getElementById('boarding-checkin').value = getToday();
  document.getElementById('boarding-cat').innerHTML = '<option value="">请先选择主人</option>';
  showModal('add-boarding-modal');
}

export function openEditBoarding(id) {
  const b = state.boardings.find(x => x.id === id);
  if (!b) return;
  document.getElementById('boarding-modal-title').textContent = '编辑寄养记录';
  document.getElementById('boarding-id').value          = b.id;
  document.getElementById('boarding-owner').value       = b.owner_id;
  onBoardingOwnerChange();
  setTimeout(() => { document.getElementById('boarding-cat').value = b.cat_id; }, 0);
  document.getElementById('boarding-room-type').value   = b.room_type_id;
  document.getElementById('boarding-checkin').value     = b.check_in_date;
  document.getElementById('boarding-checkout').value    = b.check_out_date;
  document.getElementById('boarding-daily-rate').value  = b.daily_rate;
  document.getElementById('boarding-days').value        = daysBetween(b.check_in_date, b.check_out_date);
  document.getElementById('boarding-total-price').value = b.total_price;
  document.getElementById('boarding-status').value      = b.status;
  document.getElementById('boarding-notes').value       = b.notes || '';
  showModal('add-boarding-modal');
}

export function onBoardingOwnerChange() {
  const ownerId = document.getElementById('boarding-owner').value;
  const cats = ownerId ? state.cats.filter(c => c.owner_id === ownerId) : [];
  document.getElementById('boarding-cat').innerHTML =
    '<option value="">请选择猫咪</option>' +
    cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  // 更新房型下拉显示该主人的专属价格
  const roomTypeId = document.getElementById('boarding-room-type').value;
  document.getElementById('boarding-room-type').innerHTML =
    '<option value="">请选择房型</option>' +
    state.roomTypes.map(r => {
      const price = ownerId ? getOwnerRoomPrice(ownerId, r.id) : r.price_per_day;
      const label = ownerId && price !== parseFloat(r.price_per_day)
        ? `${r.name}（★ A$${price}/天）`
        : `${r.name}（A$${price}/天）`;
      return `<option value="${r.id}" ${r.id === roomTypeId ? 'selected' : ''}>${label}</option>`;
    }).join('');

  calculateBoardingPrice();
}

export function calculateBoardingPrice() {
  const ownerId    = document.getElementById('boarding-owner').value;
  const roomTypeId = document.getElementById('boarding-room-type').value;
  const checkin    = document.getElementById('boarding-checkin').value;
  const checkout   = document.getElementById('boarding-checkout').value;

  if (ownerId && roomTypeId) {
    const dailyRate = getOwnerRoomPrice(ownerId, roomTypeId);
    document.getElementById('boarding-daily-rate').value = dailyRate.toFixed(2);

    if (checkin && checkout && checkout > checkin) {
      const days = daysBetween(checkin, checkout);
      document.getElementById('boarding-days').value        = days;
      document.getElementById('boarding-total-price').value = (days * dailyRate).toFixed(2);
    }
  }
}

export function filterBoardings(filter) {
  state.boardingFilter = filter;
  const { renderBoardingsTable } = window.__renderModule;
  renderBoardingsTable();
}

export async function checkoutBoarding(id) {
  if (!confirm('确认办理退房？状态将更改为「已完成」。')) return;
  const { error } = await db.from('boardings').update({ status: 'completed' }).eq('id', id);
  if (error) { showToast('操作失败', 'error'); return; }
  showToast('退房成功！', 'success');
  await loadBoardings();
  renderAll();
}

export async function deleteBoarding(id) {
  if (!confirm('确认删除此寄养记录？')) return;
  const { error } = await db.from('boardings').delete().eq('id', id);
  if (error) { showToast('删除失败', 'error'); return; }
  showToast('已删除', 'success');
  state.boardings = state.boardings.filter(b => b.id !== id);
  renderAll();
}

export function initBoardingForm() {
  document.getElementById('boarding-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id         = document.getElementById('boarding-id').value;
    const catId      = document.getElementById('boarding-cat').value;
    const ownerId    = document.getElementById('boarding-owner').value;
    const roomTypeId = document.getElementById('boarding-room-type').value;
    const checkIn    = document.getElementById('boarding-checkin').value;
    const checkOut   = document.getElementById('boarding-checkout').value;
    const dailyRate  = parseFloat(document.getElementById('boarding-daily-rate').value) || 0;
    const totalPrice = parseFloat(document.getElementById('boarding-total-price').value) || 0;

    if (!catId || !ownerId || !roomTypeId || !checkIn || !checkOut) {
      showToast('请填写所有必填项目', 'error'); return;
    }
    if (checkOut <= checkIn) {
      showToast('退房日期必须晚于入住日期', 'error'); return;
    }

    const payload = {
      cat_id: catId, owner_id: ownerId, room_type_id: roomTypeId,
      check_in_date: checkIn, check_out_date: checkOut,
      daily_rate: dailyRate, total_price: totalPrice,
      status: document.getElementById('boarding-status').value,
      notes:  document.getElementById('boarding-notes').value,
    };

    const { error } = id
      ? await db.from('boardings').update(payload).eq('id', id)
      : await db.from('boardings').insert(payload);

    if (error) { showToast('保存失败：' + error.message, 'error'); return; }
    showToast(id ? '寄养记录已更新 ✓' : '寄养记录已新增 ✓', 'success');
    hideModal('add-boarding-modal');
    await loadBoardings();
    renderAll();
  });
}
