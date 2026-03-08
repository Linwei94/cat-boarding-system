import { db } from './config.js';
import { state } from './state.js';
import { showModal, hideModal, showToast } from './ui.js';
import { loadRoomTypes } from './api.js';
import { renderAll } from './render.js';

export function openAddRoomType() {
  document.getElementById('room-type-modal-title').textContent = '新增房型';
  document.getElementById('room-type-form').reset();
  document.getElementById('room-type-id').value = '';
  showModal('add-room-type-modal');
}

export function openEditRoomType(id) {
  const r = state.roomTypes.find(x => x.id === id);
  if (!r) return;
  document.getElementById('room-type-modal-title').textContent = '编辑房型';
  document.getElementById('room-type-id').value          = r.id;
  document.getElementById('room-type-name').value        = r.name;
  document.getElementById('room-type-description').value = r.description || '';
  document.getElementById('room-type-price').value       = r.price_per_day;
  showModal('add-room-type-modal');
}

export function initRoomTypeForm() {
  document.getElementById('room-type-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('room-type-id').value;
    const payload = {
      name:         document.getElementById('room-type-name').value.trim(),
      description:  document.getElementById('room-type-description').value.trim(),
      price_per_day: parseFloat(document.getElementById('room-type-price').value),
    };
    const { error } = id
      ? await db.from('room_types').update(payload).eq('id', id)
      : await db.from('room_types').insert(payload);
    if (error) { showToast('保存失败：' + error.message, 'error'); return; }
    showToast(id ? '房型已更新 ✓' : '房型已新增 ✓', 'success');
    hideModal('add-room-type-modal');
    await loadRoomTypes();
    renderAll();
  });
}

export async function deleteRoomType(id) {
  if (!confirm('确认删除此房型？')) return;
  const { error } = await db.from('room_types').delete().eq('id', id);
  if (error) { showToast('删除失败：' + error.message, 'error'); return; }
  showToast('已删除', 'success');
  state.roomTypes = state.roomTypes.filter(r => r.id !== id);
  renderAll();
}
