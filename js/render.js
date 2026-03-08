import { state } from './state.js';
import { getToday, formatDateCN, formatCurrency, genderBadge, roomBadge, daysBetween } from './utils.js';
import { getTodaysBoardings, updateBoardingStats, updateHomeVisitStats } from './stats.js';

// ── 下拉菜单 ────────────────────────────────────────────────────
export function populateDropdowns() {
  const ownerOptions = '<option value="">请选择主人</option>' +
    state.owners.map(o => `<option value="${o.id}">${o.name}</option>`).join('');

  document.getElementById('boarding-owner').innerHTML = ownerOptions;
  document.getElementById('homevisit-owner').innerHTML = ownerOptions;
  document.getElementById('cat-owner').innerHTML = ownerOptions;

  document.getElementById('boarding-room-type').innerHTML =
    '<option value="">请选择房型</option>' +
    state.roomTypes.map(r => `<option value="${r.id}" data-price="${r.price_per_day}">${r.name}（A$${r.price_per_day}/天）</option>`).join('');
}

// ── 今日猫咪卡片 ────────────────────────────────────────────────
export function renderTodaysCats() {
  const todaysCats = getTodaysBoardings();
  const container = document.getElementById('today-cats-list');
  if (todaysCats.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">😴</div><p>今日没有寄养的猫咪</p></div>';
    return;
  }
  container.innerHTML = todaysCats.map(b => {
    const cat = state.cats.find(c => c.id === b.cat_id);
    return `
      <div class="cat-card" onclick="window.openCatDetail('${b.cat_id}')" style="cursor:pointer">
        <div class="cat-card-name">🐱 ${b.cat?.name || '未知'} ${cat ? genderBadge(cat.gender) : ''}</div>
        <div class="cat-card-info link-text" onclick="event.stopPropagation();window.openOwnerDetail('${b.owner_id}')">主人：${b.owner?.name || '未知'}</div>
        <div class="cat-card-info">入住：${formatDateCN(b.check_in_date)}</div>
        <div class="cat-card-info">退房：${formatDateCN(b.check_out_date)}</div>
        <div class="cat-card-info">日费：${formatCurrency(b.daily_rate)}</div>
        ${roomBadge(b.room_type?.name)}
      </div>`;
  }).join('');
}

// ── 本周预览 ────────────────────────────────────────────────────
export function renderUpcomingWeek() {
  const container = document.getElementById('upcoming-week-list');
  const todayDate = new Date(getToday() + 'T00:00:00');
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  container.innerHTML = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + i + 1);
    const dateStr  = d.toLocaleDateString('en-CA');
    const label    = '周' + dayNames[d.getDay()];
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;

    const cats = state.boardings.filter(b =>
      b.status === 'active' && b.check_in_date <= dateStr && b.check_out_date > dateStr
    );

    const chipsHtml = cats.length > 0
      ? cats.map(b => {
          const cat = state.cats.find(c => c.id === b.cat_id);
          const sym = cat?.gender === 'male' ? '♂' : cat?.gender === 'female' ? '♀' : '';
          return `<span class="week-cat-chip" onclick="window.openCatDetail('${b.cat_id}')" style="cursor:pointer">${sym} ${b.cat?.name || '未知'}</span>`;
        }).join('')
      : '<span class="week-no-cats">—</span>';

    return `
      <div class="week-day-col ${cats.length === 0 ? 'week-day-empty' : ''}">
        <div class="week-day-name">${label}</div>
        <div class="week-day-date">${dateLabel}</div>
        ${chipsHtml}
      </div>`;
  }).join('');
}

// ── 寄养记录表格 ─────────────────────────────────────────────────
const statusBadge = {
  active:    '<span class="badge badge-active">进行中</span>',
  completed: '<span class="badge badge-completed">已完成</span>',
  cancelled: '<span class="badge badge-cancelled">已取消</span>',
};

export function renderBoardingsTable() {
  const tbody = document.getElementById('boardings-tbody');
  let list = state.boardings;
  if (state.boardingFilter !== 'all') list = list.filter(b => b.status === state.boardingFilter);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">📋</div><p>暂无记录</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(b => {
    const days = daysBetween(b.check_in_date, b.check_out_date);
    const checkoutBtn = b.status === 'active'
      ? `<button class="btn btn-xs btn-success" onclick="window.checkoutBoarding('${b.id}')">退房</button>` : '';
    return `
      <tr>
        <td><span class="link-text" onclick="window.openCatDetail('${b.cat_id}')">${b.cat?.name || '未知'}</span></td>
        <td><span class="link-text" onclick="window.openOwnerDetail('${b.owner_id}')">${b.owner?.name || '未知'}</span></td>
        <td>${roomBadge(b.room_type?.name)}</td>
        <td>${formatDateCN(b.check_in_date)}</td>
        <td>${formatDateCN(b.check_out_date)}</td>
        <td>${days} 天</td>
        <td>${formatCurrency(b.daily_rate)}</td>
        <td><strong>${formatCurrency(b.total_price)}</strong></td>
        <td>${statusBadge[b.status] || b.status}</td>
        <td>
          <div class="btn-gap">
            <button class="btn btn-xs btn-secondary" onclick="window.openEditBoarding('${b.id}')">编辑</button>
            ${checkoutBtn}
            <button class="btn btn-xs btn-danger" onclick="window.deleteBoarding('${b.id}')">删除</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── 今日上门卡片 ─────────────────────────────────────────────────
export function renderTodaysVisits() {
  const today = getToday();
  const todayDates = state.homeVisitDates.filter(vd => vd.visit_date === today);
  const container = document.getElementById('today-visits-list');
  if (todayDates.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏠</div><p>今日没有上门喂养安排</p></div>';
    return;
  }
  container.innerHTML = todayDates.map(vd => {
    const visit = state.homeVisits.find(v => v.id === vd.home_visit_id);
    if (!visit) return '';
    const owner = state.owners.find(o => o.id === visit.owner_id);
    const cat   = visit.cat_id ? state.cats.find(c => c.id === visit.cat_id) : null;
    return `
      <div class="visit-card">
        <div class="visit-card-time">🕐 ${visit.visit_time || '时间待定'}</div>
        <div class="visit-card-info link-text" onclick="window.openOwnerDetail('${visit.owner_id}')">👤 ${owner?.name || '未知主人'}</div>
        ${cat ? `<div class="visit-card-info link-text" onclick="window.openCatDetail('${visit.cat_id}')">🐱 ${cat.name}</div>` : ''}
        <div class="visit-card-info">📍 ${visit.address}</div>
        <div class="visit-card-info">💰 ${formatCurrency(visit.price_per_visit)} / 次</div>
      </div>`;
  }).join('');
}

// ── 上门记录表格 ─────────────────────────────────────────────────
export function renderHomeVisitsTable() {
  const tbody = document.getElementById('homevisits-tbody');
  if (state.homeVisits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🚗</div><p>暂无记录</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = state.homeVisits.map(v => {
    const dates = state.homeVisitDates.filter(d => d.home_visit_id === v.id);
    const shown = dates.slice(0, 3).map(d => d.visit_date).join('、');
    const dateDisplay = dates.length > 0
      ? shown + (dates.length > 3 ? ` 等共 ${dates.length} 天` : ` (共 ${dates.length} 天)`)
      : '未设置日期';
    return `
      <tr>
        <td><span class="link-text" onclick="window.openOwnerDetail('${v.owner_id}')">${v.owner?.name || '未知'}</span></td>
        <td>${v.cat ? `<span class="link-text" onclick="window.openCatDetail('${v.cat_id}')">${v.cat.name}</span>` : '-'}</td>
        <td>${v.address}</td>
        <td>${v.visit_time || '-'}</td>
        <td style="font-size:12px;max-width:200px">${dateDisplay}</td>
        <td>${formatCurrency(v.price_per_visit)}</td>
        <td>${statusBadge[v.status] || v.status}</td>
        <td>
          <div class="btn-gap">
            <button class="btn btn-xs btn-secondary" onclick="window.openEditHomeVisit('${v.id}')">编辑</button>
            <button class="btn btn-xs btn-danger" onclick="window.deleteHomeVisit('${v.id}')">删除</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── 主人表格 ─────────────────────────────────────────────────────
export function renderOwnersTable() {
  const tbody = document.getElementById('owners-tbody');
  if (state.owners.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:24px;color:#aaa">尚无主人资料，点击「新增主人」开始添加</td></tr>`;
    return;
  }
  tbody.innerHTML = state.owners.map(o => {
    const catCount = state.cats.filter(c => c.owner_id === o.id).length;
    return `
      <tr>
        <td><span class="link-text" onclick="window.openOwnerDetail('${o.id}')">${o.name}</span></td>
        <td>${o.phone || '-'}</td>
        <td>${o.wechat ? `<span style="color:#07C160">💬 ${o.wechat}</span>` : '-'}</td>
        <td><span class="link-text" onclick="window.openOwnerDetail('${o.id}')">${catCount} 只</span></td>
        <td>
          <div class="btn-gap">
            <button class="btn btn-xs btn-secondary" onclick="window.openEditOwner('${o.id}')">编辑</button>
            <button class="btn btn-xs btn-danger" onclick="window.deleteOwner('${o.id}')">删除</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── 猫咪表格 ─────────────────────────────────────────────────────
export function renderCatsTable() {
  const tbody = document.getElementById('cats-tbody');
  if (state.cats.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:24px;color:#aaa">尚无猫咪资料</td></tr>`;
    return;
  }
  tbody.innerHTML = state.cats.map(c => {
    const owner = state.owners.find(o => o.id === c.owner_id);
    return `
      <tr>
        <td><span class="link-text" onclick="window.openCatDetail('${c.id}')">${c.name}</span>${c.color ? `<br><small class="text-muted">${c.color}</small>` : ''}</td>
        <td>${[c.breed, c.age].filter(Boolean).join(' / ') || '-'}</td>
        <td>${genderBadge(c.gender)}</td>
        <td><span class="link-text" onclick="window.openOwnerDetail('${c.owner_id}')">${owner?.name || '-'}</span></td>
        <td style="font-size:12px;color:#888;max-width:160px">${c.special_notes || '-'}</td>
        <td>
          <div class="btn-gap">
            <button class="btn btn-xs btn-secondary" onclick="window.openEditCat('${c.id}')">编辑</button>
            <button class="btn btn-xs btn-danger" onclick="window.deleteCat('${c.id}')">删除</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── 房型表格 ─────────────────────────────────────────────────────
export function renderRoomTypesTable() {
  const tbody = document.getElementById('room-types-tbody');
  if (state.roomTypes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:24px;color:#aaa">尚无房型</td></tr>`;
    return;
  }
  tbody.innerHTML = state.roomTypes.map(r => `
    <tr>
      <td>${roomBadge(r.name)}</td>
      <td style="font-size:13px;color:#666">${r.description || '-'}</td>
      <td><strong>${formatCurrency(r.price_per_day)}</strong> / 天</td>
      <td>
        <div class="btn-gap">
          <button class="btn btn-xs btn-secondary" onclick="window.openEditRoomType('${r.id}')">编辑</button>
          <button class="btn btn-xs btn-danger" onclick="window.deleteRoomType('${r.id}')">删除</button>
        </div>
      </td>
    </tr>`).join('');
}

// ── 渲染全部 ─────────────────────────────────────────────────────
export function renderAll() {
  populateDropdowns();
  renderTodaysCats();
  renderUpcomingWeek();
  renderBoardingsTable();
  renderTodaysVisits();
  renderHomeVisitsTable();
  renderOwnersTable();
  renderCatsTable();
  renderRoomTypesTable();
  updateBoardingStats();
  updateHomeVisitStats();
}
