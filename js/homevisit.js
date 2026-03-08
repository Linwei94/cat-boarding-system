import { db } from './config.js';
import { state } from './state.js';
import { showModal, hideModal, showToast } from './ui.js';
import { getToday } from './utils.js';
import { loadHomeVisits, loadHomeVisitDates } from './api.js';
import { renderAll } from './render.js';

// ── 多选日历 ─────────────────────────────────────────────────────
export class MultiDatePicker {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.selectedDates = new Set();
    this.viewDate = new Date();
  }

  setDates(dates) {
    this.selectedDates = new Set(dates);
    this.render();
  }

  getDates() {
    return Array.from(this.selectedDates).sort();
  }

  render() {
    if (!this.container) return;
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const today = getToday();
    const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `
      <div class="cal-header">
        <button type="button" onclick="window.datePicker.prevMonth()">&#8249;</button>
        <span>${year}年 ${monthNames[month]}</span>
        <button type="button" onclick="window.datePicker.nextMonth()">&#8250;</button>
      </div>
      <div class="cal-grid">
        <div class="cal-weekday">日</div><div class="cal-weekday">一</div>
        <div class="cal-weekday">二</div><div class="cal-weekday">三</div>
        <div class="cal-weekday">四</div><div class="cal-weekday">五</div>
        <div class="cal-weekday">六</div>`;

    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let cls = 'cal-day';
      if (this.selectedDates.has(dateStr)) cls += ' selected';
      if (dateStr === today) cls += ' today';
      html += `<div class="${cls}" onclick="window.datePicker.toggleDate('${dateStr}')">${d}</div>`;
    }
    html += '</div>';
    this.container.innerHTML = html;
  }

  toggleDate(dateStr) {
    this.selectedDates.has(dateStr) ? this.selectedDates.delete(dateStr) : this.selectedDates.add(dateStr);
    this.render();
    this._updateDisplay();
  }

  _updateDisplay() {
    const dates = this.getDates();
    document.getElementById('homevisit-dates').value = JSON.stringify(dates);
    const el = document.getElementById('selected-dates-text');
    el.innerHTML = dates.length === 0
      ? '请在上方点击日期选择'
      : dates.map(d => `<span class="date-chip">${d}</span>`).join('');
  }

  prevMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.render();
  }

  nextMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.render();
  }
}

// ── 上门喂养 CRUD ─────────────────────────────────────────────────
export function openAddHomeVisit() {
  document.getElementById('homevisit-modal-title').textContent = '新增上门喂养';
  document.getElementById('homevisit-form').reset();
  document.getElementById('homevisit-id').value    = '';
  document.getElementById('homevisit-price').value = 0;
  document.getElementById('homevisit-cat').innerHTML = '<option value="">全部猫咪 / 不指定</option>';
  document.getElementById('homevisit-dates').value   = '[]';
  document.getElementById('selected-dates-text').innerHTML = '请在上方点击日期选择';
  window.datePicker = new MultiDatePicker('visit-calendar');
  window.datePicker.render();
  showModal('add-homevisit-modal');
}

export function openEditHomeVisit(id) {
  const v = state.homeVisits.find(x => x.id === id);
  if (!v) return;
  document.getElementById('homevisit-modal-title').textContent = '编辑上门喂养';
  document.getElementById('homevisit-id').value       = v.id;
  document.getElementById('homevisit-owner').value    = v.owner_id;
  onVisitOwnerChange();
  setTimeout(() => { document.getElementById('homevisit-cat').value = v.cat_id || ''; }, 0);
  document.getElementById('homevisit-address').value  = v.address;
  document.getElementById('homevisit-time').value     = v.visit_time || '';
  document.getElementById('homevisit-price').value    = v.price_per_visit || 0;
  document.getElementById('homevisit-status').value   = v.status || 'active';
  document.getElementById('homevisit-notes').value    = v.notes || '';

  const existingDates = state.homeVisitDates
    .filter(d => d.home_visit_id === id)
    .map(d => d.visit_date);

  window.datePicker = new MultiDatePicker('visit-calendar');
  window.datePicker.setDates(existingDates);
  document.getElementById('homevisit-dates').value = JSON.stringify(existingDates);
  document.getElementById('selected-dates-text').innerHTML = existingDates.length > 0
    ? existingDates.map(d => `<span class="date-chip">${d}</span>`).join('')
    : '请在上方点击日期选择';
  showModal('add-homevisit-modal');
}

export function onVisitOwnerChange() {
  const ownerId = document.getElementById('homevisit-owner').value;
  const cats = ownerId ? state.cats.filter(c => c.owner_id === ownerId) : [];
  document.getElementById('homevisit-cat').innerHTML =
    '<option value="">全部猫咪 / 不指定</option>' +
    cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

export function initHomeVisitForm() {
  document.getElementById('homevisit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id      = document.getElementById('homevisit-id').value;
    const ownerId = document.getElementById('homevisit-owner').value;
    const catId   = document.getElementById('homevisit-cat').value;
    const address = document.getElementById('homevisit-address').value.trim();
    const dates   = JSON.parse(document.getElementById('homevisit-dates').value || '[]');

    if (!ownerId) { showToast('请选择主人', 'error'); return; }
    if (!address) { showToast('请填写上门地址', 'error'); return; }

    const payload = {
      owner_id:       ownerId,
      cat_id:         catId || null,
      address,
      visit_time:     document.getElementById('homevisit-time').value.trim(),
      price_per_visit: parseFloat(document.getElementById('homevisit-price').value) || 0,
      notes:          document.getElementById('homevisit-notes').value.trim(),
      status:         document.getElementById('homevisit-status').value,
    };

    let visitId = id;
    let error;
    if (id) {
      ({ error } = await db.from('home_visits').update(payload).eq('id', id));
      if (!error) await db.from('home_visit_dates').delete().eq('home_visit_id', id);
    } else {
      const { data, error: ie } = await db.from('home_visits').insert(payload).select('id').single();
      error = ie;
      if (data) visitId = data.id;
    }
    if (error) { showToast('保存失败：' + error.message, 'error'); return; }

    if (dates.length > 0 && visitId) {
      const { error: de } = await db.from('home_visit_dates').insert(
        dates.map(d => ({ home_visit_id: visitId, visit_date: d }))
      );
      if (de) { showToast('日期保存失败：' + de.message, 'error'); return; }
    }

    showToast(id ? '上门喂养已更新 ✓' : '上门喂养已新增 ✓', 'success');
    hideModal('add-homevisit-modal');
    await Promise.all([loadHomeVisits(), loadHomeVisitDates()]);
    renderAll();
  });
}

export async function deleteHomeVisit(id) {
  if (!confirm('确认删除此上门喂养记录？相关日期也会一并删除。')) return;
  const { error } = await db.from('home_visits').delete().eq('id', id);
  if (error) { showToast('删除失败', 'error'); return; }
  showToast('已删除', 'success');
  await Promise.all([loadHomeVisits(), loadHomeVisitDates()]);
  renderAll();
}
