// ================================================================
// 喵喵寄养管理系统 - 主应用逻辑
// ================================================================

// ── Supabase 初始化 ─────────────────────────────────────────────
const SUPABASE_URL = 'https://oybxjhsfyiqynpzauhff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YnhqaHNmeWlxeW5wemF1aGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzY3NDQsImV4cCI6MjA4ODQ1Mjc0NH0.Gj43NzQlAOJPpeXlRrzW6gjBQCiUmieqOpiATeIG5XA';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── 全局状态 ────────────────────────────────────────────────────
const state = {
  owners: [],
  cats: [],
  roomTypes: [],
  boardings: [],
  homeVisits: [],
  homeVisitDates: [],
  boardingFilter: 'active'
};

// 上门喂养日历实例（全局，供 HTML onclick 调用）
let datePicker = null;

// ================================================================
// 认证 (Auth)
// ================================================================
async function initApp() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    showApp();
    await loadAllData();
  } else {
    showLogin();
  }

  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      showApp();
      loadAllData();
    } else if (event === 'SIGNED_OUT') {
      Object.assign(state, { owners: [], cats: [], roomTypes: [], boardings: [], homeVisits: [], homeVisitDates: [] });
      showLogin();
    }
  });
}

function showLogin() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  const todayStr = formatDateCN(getToday());
  document.getElementById('today-date').textContent = todayStr;
  document.getElementById('today-date-visit').textContent = todayStr;
}

// 登录
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.className = 'error-msg';
  errorEl.textContent = '';

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = '登录失败：' + (error.message === 'Invalid login credentials' ? '邮箱或密码错误' : error.message);
  }
});

// 注册
document.getElementById('register-btn').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.className = 'error-msg';

  if (!email || !password) { errorEl.textContent = '请填写邮箱和密码'; return; }
  if (password.length < 6) { errorEl.textContent = '密码至少需要 6 位'; return; }

  const { error } = await db.auth.signUp({ email, password });
  if (error) {
    errorEl.textContent = '注册失败：' + error.message;
  } else {
    errorEl.className = 'error-msg success';
    errorEl.textContent = '注册成功！若需要邮箱验证，请查收邮件后再登录。否则直接点登录即可。';
  }
});

// 退出
document.getElementById('logout-btn').addEventListener('click', () => db.auth.signOut());

// ================================================================
// 数据加载
// ================================================================
async function loadAllData() {
  showLoading(true);
  try {
    await Promise.all([loadOwners(), loadCats(), loadRoomTypes(), loadBoardings(), loadHomeVisits(), loadHomeVisitDates()]);
    renderAll();
  } catch (err) {
    console.error('loadAllData error:', err);
    showToast('数据加载失败，请刷新页面重试', 'error');
  }
  showLoading(false);
}

async function loadOwners() {
  const { data, error } = await db.from('owners').select('*').order('name');
  if (!error && data) state.owners = data;
}

async function loadCats() {
  const { data, error } = await db.from('cats').select('*').order('name');
  if (!error && data) state.cats = data;
}

async function loadRoomTypes() {
  const { data, error } = await db.from('room_types').select('*').order('price_per_day');
  if (!error && data) state.roomTypes = data;
}

async function loadBoardings() {
  const { data, error } = await db.from('boardings')
    .select('*, cat:cats(name), owner:owners(name, discount_rate), room_type:room_types(name, price_per_day)')
    .order('check_in_date', { ascending: false });
  if (!error && data) state.boardings = data;
}

async function loadHomeVisits() {
  const { data, error } = await db.from('home_visits')
    .select('*, owner:owners(name), cat:cats(name)')
    .order('created_at', { ascending: false });
  if (!error && data) state.homeVisits = data;
}

async function loadHomeVisitDates() {
  const { data, error } = await db.from('home_visit_dates').select('*').order('visit_date');
  if (!error && data) state.homeVisitDates = data;
}

// ================================================================
// 工具函数
// ================================================================
// 取本地今日日期字串 YYYY-MM-DD
function getToday() {
  return new Date().toLocaleDateString('en-CA');
}

// YYYY-MM-DD → XXXX年XX月XX日
function formatDateCN(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

// 货币格式
function formatCurrency(amount) {
  return 'A$' + parseFloat(amount || 0).toFixed(2);
}

// 性别符号
function genderBadge(gender) {
  if (gender === 'male')   return '<span class="gender-badge male">♂ 公</span>';
  if (gender === 'female') return '<span class="gender-badge female">♀ 母</span>';
  return '<span class="gender-badge unknown">— 未知</span>';
}

// 两日期（YYYY-MM-DD）相差天数
function daysBetween(startStr, endStr) {
  const s = new Date(startStr + 'T00:00:00');
  const e = new Date(endStr + 'T00:00:00');
  return Math.max(0, Math.round((e - s) / 86400000));
}

// ================================================================
// 统计计算
// ================================================================

// 今日正在寄养的记录
function getTodaysBoardings() {
  const today = getToday();
  return state.boardings.filter(b =>
    b.status === 'active' &&
    b.check_in_date <= today &&
    b.check_out_date > today
  );
}

// 计算某时间段内的寄养收入（按日费 × 重叠天数）
function getBoardingIncome(startStr, endStr) {
  return state.boardings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => {
      const overlapStart = b.check_in_date > startStr ? b.check_in_date : startStr;
      const overlapEnd = b.check_out_date < endStr ? b.check_out_date : endStr;
      if (overlapStart < overlapEnd) {
        return sum + daysBetween(overlapStart, overlapEnd) * parseFloat(b.daily_rate || 0);
      }
      return sum;
    }, 0);
}

// 计算某时间段内的上门喂养收入
function getVisitIncome(startStr, endStr) {
  return state.homeVisitDates
    .filter(vd => vd.visit_date >= startStr && vd.visit_date < endStr)
    .reduce((sum, vd) => {
      const visit = state.homeVisits.find(v => v.id === vd.home_visit_id);
      return sum + (visit ? parseFloat(visit.price_per_visit || 0) : 0);
    }, 0);
}

function getPeriods() {
  const today = getToday();
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const tomorrow = new Date(y, m, now.getDate() + 1).toLocaleDateString('en-CA');
  const monthStart = new Date(y, m, 1).toLocaleDateString('en-CA');
  const monthEnd = new Date(y, m + 1, 1).toLocaleDateString('en-CA');
  const yearStart = `${y}-01-01`;
  const yearEnd = `${y + 1}-01-01`;
  return { today, tomorrow, monthStart, monthEnd, yearStart, yearEnd };
}

function updateBoardingStats() {
  const { today, tomorrow, monthStart, monthEnd, yearStart, yearEnd } = getPeriods();
  const todaysCats = getTodaysBoardings();
  document.getElementById('today-cats-count').textContent = todaysCats.length + ' 只';
  document.getElementById('today-boarding-income').textContent = formatCurrency(getBoardingIncome(today, tomorrow));
  document.getElementById('month-boarding-income').textContent = formatCurrency(getBoardingIncome(monthStart, monthEnd));
  document.getElementById('year-boarding-income').textContent = formatCurrency(getBoardingIncome(yearStart, yearEnd));
}

function updateHomeVisitStats() {
  const { today, tomorrow, monthStart, monthEnd, yearStart, yearEnd } = getPeriods();
  const todayVisitDates = state.homeVisitDates.filter(vd => vd.visit_date === today);
  document.getElementById('today-visits-count').textContent = todayVisitDates.length + ' 次';
  document.getElementById('today-visit-income').textContent = formatCurrency(getVisitIncome(today, tomorrow));
  document.getElementById('month-visit-income').textContent = formatCurrency(getVisitIncome(monthStart, monthEnd));
  document.getElementById('year-visit-income').textContent = formatCurrency(getVisitIncome(yearStart, yearEnd));
}

// ================================================================
// 渲染函数
// ================================================================
function renderAll() {
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

// 本周预览（明天起 6 天，只显示猫咪名字）
function renderUpcomingWeek() {
  const container = document.getElementById('upcoming-week-list');
  const todayDate = new Date(getToday() + 'T00:00:00');
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  container.innerHTML = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + i + 1);
    const dateStr = d.toLocaleDateString('en-CA');
    const label = '周' + dayNames[d.getDay()];
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;

    const cats = state.boardings.filter(b =>
      b.status === 'active' &&
      b.check_in_date <= dateStr &&
      b.check_out_date > dateStr
    );

    const chipsHtml = cats.length > 0
      ? cats.map(b => {
          const cat = state.cats.find(c => c.id === b.cat_id);
          const sym = cat?.gender === 'male' ? '♂' : cat?.gender === 'female' ? '♀' : '';
          return `<span class="week-cat-chip" onclick="openCatDetail('${b.cat_id}')" style="cursor:pointer">${sym} ${b.cat?.name || '未知'}</span>`;
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

// 今日寄养猫咪卡片
function renderTodaysCats() {
  const todaysCats = getTodaysBoardings();
  const container = document.getElementById('today-cats-list');
  if (todaysCats.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">😴</div><p>今日没有寄养的猫咪</p></div>';
    return;
  }
  container.innerHTML = todaysCats.map(b => {
    const cat = state.cats.find(c => c.id === b.cat_id);
    return `
    <div class="cat-card" onclick="openCatDetail('${b.cat_id}')" style="cursor:pointer">
      <div class="cat-card-name">🐱 ${b.cat?.name || '未知猫咪'} ${cat ? genderBadge(cat.gender) : ''}</div>
      <div class="cat-card-info" style="cursor:pointer;color:var(--primary)" onclick="event.stopPropagation();openOwnerDetail('${b.owner_id}')">主人：${b.owner?.name || '未知'}</div>
      <div class="cat-card-info">入住：${formatDateCN(b.check_in_date)}</div>
      <div class="cat-card-info">退房：${formatDateCN(b.check_out_date)}</div>
      <div class="cat-card-info">日费：${formatCurrency(b.daily_rate)}</div>
      <span class="cat-card-room">${b.room_type?.name || '未知房型'}</span>
    </div>`;
  }).join('');
}

// 寄养记录表格
function renderBoardingsTable() {
  const tbody = document.getElementById('boardings-tbody');
  let boardings = state.boardings;
  if (state.boardingFilter !== 'all') {
    boardings = boardings.filter(b => b.status === state.boardingFilter);
  }

  if (boardings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">📋</div><p>暂无记录</p></div></td></tr>`;
    return;
  }

  const statusBadge = {
    active: '<span class="badge badge-active">进行中</span>',
    completed: '<span class="badge badge-completed">已完成</span>',
    cancelled: '<span class="badge badge-cancelled">已取消</span>'
  };

  tbody.innerHTML = boardings.map(b => {
    const days = daysBetween(b.check_in_date, b.check_out_date);
    const checkoutBtn = b.status === 'active'
      ? `<button class="btn btn-xs btn-success" onclick="checkoutBoarding('${b.id}')">退房</button>`
      : '';
    return `
      <tr>
        <td><span class="link-text" onclick="openCatDetail('${b.cat_id}')">${b.cat?.name || '未知'}</span></td>
        <td><span class="link-text" onclick="openOwnerDetail('${b.owner_id}')">${b.owner?.name || '未知'}</span></td>
        <td>${b.room_type?.name || '未知'}</td>
        <td>${formatDateCN(b.check_in_date)}</td>
        <td>${formatDateCN(b.check_out_date)}</td>
        <td>${days} 天</td>
        <td>${formatCurrency(b.daily_rate)}</td>
        <td><strong>${formatCurrency(b.total_price)}</strong></td>
        <td>${statusBadge[b.status] || b.status}</td>
        <td>
          <div class="btn-gap">
            <button class="btn btn-xs btn-secondary" onclick="openEditBoarding('${b.id}')">编辑</button>
            ${checkoutBtn}
            <button class="btn btn-xs btn-danger" onclick="deleteBoarding('${b.id}')">删除</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// 今日上门喂养卡片
function renderTodaysVisits() {
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
    const cat = visit.cat_id ? state.cats.find(c => c.id === visit.cat_id) : null;
    return `
      <div class="visit-card">
        <div class="visit-card-time">🕐 ${visit.visit_time || '时间待定'}</div>
        <div class="visit-card-info">👤 ${owner?.name || '未知主人'}</div>
        ${cat ? `<div class="visit-card-info">🐱 ${cat.name}</div>` : ''}
        <div class="visit-card-info">📍 ${visit.address}</div>
        <div class="visit-card-info">💰 ${formatCurrency(visit.price_per_visit)} / 次</div>
      </div>`;
  }).join('');
}

// 上门喂养记录表格
function renderHomeVisitsTable() {
  const tbody = document.getElementById('homevisits-tbody');
  if (state.homeVisits.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🚗</div><p>暂无记录</p></div></td></tr>`;
    return;
  }

  const statusBadge = {
    active: '<span class="badge badge-active">进行中</span>',
    completed: '<span class="badge badge-completed">已完成</span>',
    cancelled: '<span class="badge badge-cancelled">已取消</span>'
  };

  tbody.innerHTML = state.homeVisits.map(v => {
    const dates = state.homeVisitDates.filter(d => d.home_visit_id === v.id);
    let dateDisplay = '未设置日期';
    if (dates.length > 0) {
      const shown = dates.slice(0, 3).map(d => d.visit_date).join('、');
      dateDisplay = shown + (dates.length > 3 ? ` 等共 ${dates.length} 天` : ` (共 ${dates.length} 天)`);
    }
    return `
      <tr>
        <td><strong>${v.owner?.name || '未知'}</strong></td>
        <td>${v.cat?.name || '-'}</td>
        <td>${v.address}</td>
        <td>${v.visit_time || '-'}</td>
        <td style="font-size:12px;max-width:200px">${dateDisplay}</td>
        <td>${formatCurrency(v.price_per_visit)}</td>
        <td>${statusBadge[v.status] || v.status}</td>
        <td>
          <div class="btn-gap">
            <button class="btn btn-xs btn-secondary" onclick="openEditHomeVisit('${v.id}')">编辑</button>
            <button class="btn btn-xs btn-danger" onclick="deleteHomeVisit('${v.id}')">删除</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// 主人表格
function renderOwnersTable() {
  const tbody = document.getElementById('owners-tbody');
  if (state.owners.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:24px;color:#aaa">尚无主人资料，点击「新增主人」开始添加</td></tr>`;
    return;
  }
  tbody.innerHTML = state.owners.map(o => {
    const catCount = state.cats.filter(c => c.owner_id === o.id).length;
    const discountLabel = o.discount_rate > 0 ? `${o.discount_rate}%` : '-';
    return `
      <tr>
        <td><span class="link-text" onclick="openOwnerDetail('${o.id}')">${o.name}</span></td>
        <td>${o.phone || '-'}</td>
        <td>${o.wechat ? `<span style="color:#07C160">💬 ${o.wechat}</span>` : '-'}</td>
        <td>${discountLabel}</td>
        <td><span class="link-text" onclick="openOwnerDetail('${o.id}')">${catCount} 只</span></td>
        <td>
          <div class="btn-gap">
            <button class="btn btn-xs btn-secondary" onclick="openEditOwner('${o.id}')">编辑</button>
            <button class="btn btn-xs btn-danger" onclick="deleteOwner('${o.id}')">删除</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// 猫咪表格
function renderCatsTable() {
  const tbody = document.getElementById('cats-tbody');
  if (state.cats.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:24px;color:#aaa">尚无猫咪资料</td></tr>`;
    return;
  }
  tbody.innerHTML = state.cats.map(c => {
    const owner = state.owners.find(o => o.id === c.owner_id);
    return `
      <tr>
        <td><span class="link-text" onclick="openCatDetail('${c.id}')">${c.name}</span>${c.color ? `<br><small class="text-muted">${c.color}</small>` : ''}</td>
        <td>${[c.breed, c.age].filter(Boolean).join(' / ') || '-'}</td>
        <td>${genderBadge(c.gender)}</td>
        <td><span class="link-text" onclick="openOwnerDetail('${c.owner_id}')">${owner?.name || '-'}</span></td>
        <td style="font-size:12px;color:#888;max-width:160px">${c.special_notes || '-'}</td>
        <td>
          <div class="btn-gap">
            <button class="btn btn-xs btn-secondary" onclick="openEditCat('${c.id}')">编辑</button>
            <button class="btn btn-xs btn-danger" onclick="deleteCat('${c.id}')">删除</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// 房型表格
function renderRoomTypesTable() {
  const tbody = document.getElementById('room-types-tbody');
  if (state.roomTypes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:24px;color:#aaa">尚无房型</td></tr>`;
    return;
  }
  tbody.innerHTML = state.roomTypes.map(r => `
    <tr>
      <td><strong>${r.name}</strong></td>
      <td style="font-size:13px;color:#666">${r.description || '-'}</td>
      <td><strong>${formatCurrency(r.price_per_day)}</strong> / 天</td>
      <td>
        <div class="btn-gap">
          <button class="btn btn-xs btn-secondary" onclick="openEditRoomType('${r.id}')">编辑</button>
          <button class="btn btn-xs btn-danger" onclick="deleteRoomType('${r.id}')">删除</button>
        </div>
      </td>
    </tr>`).join('');
}

// 填充所有下拉菜单
function populateDropdowns() {
  const ownerOptions = '<option value="">请选择主人</option>' +
    state.owners.map(o => {
      const label = o.discount_rate > 0 ? `${o.name}（${o.discount_rate}%折）` : o.name;
      return `<option value="${o.id}">${label}</option>`;
    }).join('');

  document.getElementById('boarding-owner').innerHTML = ownerOptions;
  document.getElementById('homevisit-owner').innerHTML = ownerOptions;
  document.getElementById('cat-owner').innerHTML = ownerOptions;

  document.getElementById('boarding-room-type').innerHTML =
    '<option value="">请选择房型</option>' +
    state.roomTypes.map(r => `<option value="${r.id}" data-price="${r.price_per_day}">${r.name}（¥${r.price_per_day}/天）</option>`).join('');
}

// ================================================================
// Tab 切换 & 弹窗控制
// ================================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
  });
});

function showModal(id) { document.getElementById(id).classList.remove('hidden'); }
function hideModal(id) { document.getElementById(id).classList.add('hidden'); }

// ================================================================
// 寄养 CRUD
// ================================================================
function openAddBoarding() {
  document.getElementById('boarding-modal-title').textContent = '新增寄养';
  document.getElementById('boarding-form').reset();
  document.getElementById('boarding-id').value = '';
  document.getElementById('boarding-checkin').value = getToday();
  document.getElementById('boarding-cat').innerHTML = '<option value="">请先选择主人</option>';
  showModal('add-boarding-modal');
}

function openEditBoarding(id) {
  const b = state.boardings.find(x => x.id === id);
  if (!b) return;
  document.getElementById('boarding-modal-title').textContent = '编辑寄养记录';
  document.getElementById('boarding-id').value = b.id;
  document.getElementById('boarding-owner').value = b.owner_id;
  onBoardingOwnerChange();
  // 等 DOM 更新后再设置 cat
  setTimeout(() => {
    document.getElementById('boarding-cat').value = b.cat_id;
  }, 0);
  document.getElementById('boarding-room-type').value = b.room_type_id;
  document.getElementById('boarding-checkin').value = b.check_in_date;
  document.getElementById('boarding-checkout').value = b.check_out_date;
  document.getElementById('boarding-daily-rate').value = b.daily_rate;
  document.getElementById('boarding-days').value = daysBetween(b.check_in_date, b.check_out_date);
  document.getElementById('boarding-total-price').value = b.total_price;
  document.getElementById('boarding-status').value = b.status;
  document.getElementById('boarding-notes').value = b.notes || '';
  showModal('add-boarding-modal');
}

// 当选择主人时，过滤猫咪下拉 + 更新价格
function onBoardingOwnerChange() {
  const ownerId = document.getElementById('boarding-owner').value;
  const cats = ownerId ? state.cats.filter(c => c.owner_id === ownerId) : [];
  document.getElementById('boarding-cat').innerHTML =
    '<option value="">请选择猫咪</option>' +
    cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  calculateBoardingPrice();
}

// 自动计算日费和总价
function calculateBoardingPrice() {
  const ownerId = document.getElementById('boarding-owner').value;
  const roomTypeId = document.getElementById('boarding-room-type').value;
  const checkin = document.getElementById('boarding-checkin').value;
  const checkout = document.getElementById('boarding-checkout').value;

  const owner = state.owners.find(o => o.id === ownerId);
  const roomType = state.roomTypes.find(r => r.id === roomTypeId);

  if (owner && roomType) {
    const discount = parseFloat(owner.discount_rate || 0);
    const dailyRate = parseFloat((roomType.price_per_day * (1 - discount / 100)).toFixed(2));
    document.getElementById('boarding-daily-rate').value = dailyRate;

    if (checkin && checkout && checkout > checkin) {
      const days = daysBetween(checkin, checkout);
      document.getElementById('boarding-days').value = days;
      document.getElementById('boarding-total-price').value = (days * dailyRate).toFixed(2);
    }
  }
}

document.getElementById('boarding-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('boarding-id').value;
  const catId = document.getElementById('boarding-cat').value;
  const ownerId = document.getElementById('boarding-owner').value;
  const roomTypeId = document.getElementById('boarding-room-type').value;
  const checkIn = document.getElementById('boarding-checkin').value;
  const checkOut = document.getElementById('boarding-checkout').value;
  const dailyRate = parseFloat(document.getElementById('boarding-daily-rate').value) || 0;
  const totalPrice = parseFloat(document.getElementById('boarding-total-price').value) || 0;
  const status = document.getElementById('boarding-status').value;
  const notes = document.getElementById('boarding-notes').value;

  if (!catId || !ownerId || !roomTypeId || !checkIn || !checkOut) {
    showToast('请填写所有必填项目', 'error'); return;
  }
  if (checkOut <= checkIn) {
    showToast('退房日期必须晚于入住日期', 'error'); return;
  }

  const payload = { cat_id: catId, owner_id: ownerId, room_type_id: roomTypeId, check_in_date: checkIn, check_out_date: checkOut, daily_rate: dailyRate, total_price: totalPrice, status, notes };
  const { error } = id
    ? await db.from('boardings').update(payload).eq('id', id)
    : await db.from('boardings').insert(payload);

  if (error) { showToast('保存失败：' + error.message, 'error'); return; }
  showToast(id ? '寄养记录已更新 ✓' : '寄养记录已新增 ✓', 'success');
  hideModal('add-boarding-modal');
  await loadBoardings();
  renderAll();
});

async function checkoutBoarding(id) {
  if (!confirm('确认办理退房？状态将更改为「已完成」。')) return;
  const { error } = await db.from('boardings').update({ status: 'completed' }).eq('id', id);
  if (error) { showToast('操作失败', 'error'); return; }
  showToast('退房成功！', 'success');
  await loadBoardings();
  renderAll();
}

async function deleteBoarding(id) {
  if (!confirm('确认删除此寄养记录？此操作无法恢复。')) return;
  const { error } = await db.from('boardings').delete().eq('id', id);
  if (error) { showToast('删除失败', 'error'); return; }
  showToast('已删除', 'success');
  state.boardings = state.boardings.filter(b => b.id !== id);
  renderAll();
}

function filterBoardings(filter) {
  state.boardingFilter = filter;
  renderBoardingsTable();
}

// ================================================================
// 主人 CRUD
// ================================================================
function openAddOwner() {
  document.getElementById('owner-modal-title').textContent = '新增主人';
  document.getElementById('owner-form').reset();
  document.getElementById('owner-id').value = '';
  document.getElementById('owner-discount').value = 0;
  showModal('add-owner-modal');
}

function openEditOwner(id) {
  const o = state.owners.find(x => x.id === id);
  if (!o) return;
  document.getElementById('owner-modal-title').textContent = '编辑主人资料';
  document.getElementById('owner-id').value = o.id;
  document.getElementById('owner-name').value = o.name;
  document.getElementById('owner-phone').value = o.phone || '';
  document.getElementById('owner-email').value = o.email || '';
  document.getElementById('owner-wechat').value = o.wechat || '';
  document.getElementById('owner-address').value = o.address || '';
  document.getElementById('owner-discount').value = o.discount_rate || 0;
  document.getElementById('owner-notes').value = o.notes || '';
  showModal('add-owner-modal');
}

document.getElementById('owner-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('owner-id').value;
  const payload = {
    name: document.getElementById('owner-name').value.trim(),
    phone: document.getElementById('owner-phone').value.trim(),
    email: document.getElementById('owner-email').value.trim(),
    wechat: document.getElementById('owner-wechat').value.trim(),
    address: document.getElementById('owner-address').value.trim(),
    discount_rate: parseFloat(document.getElementById('owner-discount').value) || 0,
    notes: document.getElementById('owner-notes').value.trim()
  };

  const { error } = id
    ? await db.from('owners').update(payload).eq('id', id)
    : await db.from('owners').insert(payload);

  if (error) { showToast('保存失败：' + error.message, 'error'); return; }
  showToast(id ? '主人资料已更新 ✓' : '主人已新增 ✓', 'success');
  hideModal('add-owner-modal');
  await loadOwners();
  renderAll();
});

async function deleteOwner(id) {
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

// ================================================================
// 猫咪 CRUD
// ================================================================
function openAddCat() {
  document.getElementById('cat-modal-title').textContent = '新增猫咪';
  document.getElementById('cat-form').reset();
  document.getElementById('cat-id').value = '';
  showModal('add-cat-modal');
}

function openEditCat(id) {
  const c = state.cats.find(x => x.id === id);
  if (!c) return;
  document.getElementById('cat-modal-title').textContent = '编辑猫咪资料';
  document.getElementById('cat-id').value = c.id;
  document.getElementById('cat-name').value = c.name;
  document.getElementById('cat-owner').value = c.owner_id;
  document.getElementById('cat-breed').value = c.breed || '';
  document.getElementById('cat-age').value = c.age || '';
  document.getElementById('cat-gender').value = c.gender || 'unknown';
  document.getElementById('cat-color').value = c.color || '';
  document.getElementById('cat-notes').value = c.special_notes || '';
  showModal('add-cat-modal');
}

document.getElementById('cat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('cat-id').value;
  const payload = {
    name: document.getElementById('cat-name').value.trim(),
    owner_id: document.getElementById('cat-owner').value,
    breed: document.getElementById('cat-breed').value.trim(),
    age: document.getElementById('cat-age').value.trim(),
    gender: document.getElementById('cat-gender').value,
    color: document.getElementById('cat-color').value.trim(),
    special_notes: document.getElementById('cat-notes').value.trim()
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

async function deleteCat(id) {
  if (!confirm('确认删除此猫咪？')) return;
  const { error } = await db.from('cats').delete().eq('id', id);
  if (error) { showToast('删除失败', 'error'); return; }
  showToast('已删除', 'success');
  state.cats = state.cats.filter(c => c.id !== id);
  renderAll();
}

// ================================================================
// 房型 CRUD
// ================================================================
function openAddRoomType() {
  document.getElementById('room-type-modal-title').textContent = '新增房型';
  document.getElementById('room-type-form').reset();
  document.getElementById('room-type-id').value = '';
  showModal('add-room-type-modal');
}

function openEditRoomType(id) {
  const r = state.roomTypes.find(x => x.id === id);
  if (!r) return;
  document.getElementById('room-type-modal-title').textContent = '编辑房型';
  document.getElementById('room-type-id').value = r.id;
  document.getElementById('room-type-name').value = r.name;
  document.getElementById('room-type-description').value = r.description || '';
  document.getElementById('room-type-price').value = r.price_per_day;
  showModal('add-room-type-modal');
}

document.getElementById('room-type-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('room-type-id').value;
  const payload = {
    name: document.getElementById('room-type-name').value.trim(),
    description: document.getElementById('room-type-description').value.trim(),
    price_per_day: parseFloat(document.getElementById('room-type-price').value)
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

async function deleteRoomType(id) {
  if (!confirm('确认删除此房型？')) return;
  const { error } = await db.from('room_types').delete().eq('id', id);
  if (error) { showToast('删除失败：' + error.message, 'error'); return; }
  showToast('已删除', 'success');
  state.roomTypes = state.roomTypes.filter(r => r.id !== id);
  renderAll();
}

// ================================================================
// 多选日期日历组件
// ================================================================
class MultiDatePicker {
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
        <button type="button" onclick="datePicker.prevMonth()">&#8249;</button>
        <span>${year}年 ${monthNames[month]}</span>
        <button type="button" onclick="datePicker.nextMonth()">&#8250;</button>
      </div>
      <div class="cal-grid">
        <div class="cal-weekday">日</div><div class="cal-weekday">一</div>
        <div class="cal-weekday">二</div><div class="cal-weekday">三</div>
        <div class="cal-weekday">四</div><div class="cal-weekday">五</div>
        <div class="cal-weekday">六</div>`;

    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-day empty"></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let cls = 'cal-day';
      if (this.selectedDates.has(dateStr)) cls += ' selected';
      if (dateStr === today) cls += ' today';
      html += `<div class="${cls}" onclick="datePicker.toggleDate('${dateStr}')">${d}</div>`;
    }
    html += '</div>';
    this.container.innerHTML = html;
  }

  toggleDate(dateStr) {
    if (this.selectedDates.has(dateStr)) {
      this.selectedDates.delete(dateStr);
    } else {
      this.selectedDates.add(dateStr);
    }
    this.render();
    this._updateDisplay();
  }

  _updateDisplay() {
    const dates = this.getDates();
    document.getElementById('homevisit-dates').value = JSON.stringify(dates);
    const el = document.getElementById('selected-dates-text');
    if (dates.length === 0) {
      el.innerHTML = '请在上方点击日期选择';
    } else {
      el.innerHTML = dates.map(d => `<span class="date-chip">${d}</span>`).join('');
    }
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

// ================================================================
// 上门喂养 CRUD
// ================================================================
function openAddHomeVisit() {
  document.getElementById('homevisit-modal-title').textContent = '新增上门喂养';
  document.getElementById('homevisit-form').reset();
  document.getElementById('homevisit-id').value = '';
  document.getElementById('homevisit-price').value = 0;
  document.getElementById('homevisit-cat').innerHTML = '<option value="">全部猫咪 / 不指定</option>';
  document.getElementById('homevisit-dates').value = '[]';
  document.getElementById('selected-dates-text').innerHTML = '请在上方点击日期选择';

  datePicker = new MultiDatePicker('visit-calendar');
  datePicker.render();
  showModal('add-homevisit-modal');
}

function openEditHomeVisit(id) {
  const v = state.homeVisits.find(x => x.id === id);
  if (!v) return;
  document.getElementById('homevisit-modal-title').textContent = '编辑上门喂养';
  document.getElementById('homevisit-id').value = v.id;
  document.getElementById('homevisit-owner').value = v.owner_id;
  onVisitOwnerChange();
  setTimeout(() => {
    document.getElementById('homevisit-cat').value = v.cat_id || '';
  }, 0);
  document.getElementById('homevisit-address').value = v.address;
  document.getElementById('homevisit-time').value = v.visit_time || '';
  document.getElementById('homevisit-price').value = v.price_per_visit || 0;
  document.getElementById('homevisit-status').value = v.status || 'active';
  document.getElementById('homevisit-notes').value = v.notes || '';

  const existingDates = state.homeVisitDates
    .filter(d => d.home_visit_id === id)
    .map(d => d.visit_date);

  datePicker = new MultiDatePicker('visit-calendar');
  datePicker.setDates(existingDates);
  document.getElementById('homevisit-dates').value = JSON.stringify(existingDates);

  const el = document.getElementById('selected-dates-text');
  el.innerHTML = existingDates.length > 0
    ? existingDates.map(d => `<span class="date-chip">${d}</span>`).join('')
    : '请在上方点击日期选择';

  showModal('add-homevisit-modal');
}

function onVisitOwnerChange() {
  const ownerId = document.getElementById('homevisit-owner').value;
  const cats = ownerId ? state.cats.filter(c => c.owner_id === ownerId) : [];
  document.getElementById('homevisit-cat').innerHTML =
    '<option value="">全部猫咪 / 不指定</option>' +
    cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

document.getElementById('homevisit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('homevisit-id').value;
  const ownerId = document.getElementById('homevisit-owner').value;
  const catId = document.getElementById('homevisit-cat').value;
  const address = document.getElementById('homevisit-address').value.trim();
  const dates = JSON.parse(document.getElementById('homevisit-dates').value || '[]');

  if (!ownerId) { showToast('请选择主人', 'error'); return; }
  if (!address) { showToast('请填写上门地址', 'error'); return; }

  const payload = {
    owner_id: ownerId,
    cat_id: catId || null,
    address,
    visit_time: document.getElementById('homevisit-time').value.trim(),
    price_per_visit: parseFloat(document.getElementById('homevisit-price').value) || 0,
    notes: document.getElementById('homevisit-notes').value.trim(),
    status: document.getElementById('homevisit-status').value
  };

  let visitId = id;
  let error;

  if (id) {
    ({ error } = await db.from('home_visits').update(payload).eq('id', id));
    if (!error) {
      await db.from('home_visit_dates').delete().eq('home_visit_id', id);
    }
  } else {
    const { data, error: insertErr } = await db.from('home_visits').insert(payload).select('id').single();
    error = insertErr;
    if (data) visitId = data.id;
  }

  if (error) { showToast('保存失败：' + error.message, 'error'); return; }

  if (dates.length > 0 && visitId) {
    const { error: dateErr } = await db.from('home_visit_dates').insert(
      dates.map(d => ({ home_visit_id: visitId, visit_date: d }))
    );
    if (dateErr) { showToast('日期保存失败：' + dateErr.message, 'error'); return; }
  }

  showToast(id ? '上门喂养已更新 ✓' : '上门喂养已新增 ✓', 'success');
  hideModal('add-homevisit-modal');
  await Promise.all([loadHomeVisits(), loadHomeVisitDates()]);
  renderAll();
});

async function deleteHomeVisit(id) {
  if (!confirm('确认删除此上门喂养记录？相关日期也会一并删除。')) return;
  const { error } = await db.from('home_visits').delete().eq('id', id);
  if (error) { showToast('删除失败', 'error'); return; }
  showToast('已删除', 'success');
  await Promise.all([loadHomeVisits(), loadHomeVisitDates()]);
  renderAll();
}

// ================================================================
// UI 工具
// ================================================================
function showLoading(show) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ================================================================
// 详情面板
// ================================================================
function openOwnerDetail(ownerId) {
  if (!ownerId) return;
  const o = state.owners.find(x => x.id === ownerId);
  if (!o) return;

  document.getElementById('owner-detail-name').textContent = o.name + ' 的资料';

  // 基本信息卡
  const infoItems = [
    ['📞 电话', o.phone || '-'],
    ['💬 微信', o.wechat ? `<span style="color:#07C160">${o.wechat}</span>` : '-'],
    ['📧 邮箱', o.email || '-'],
    ['🏷️ 折扣', o.discount_rate > 0 ? `${o.discount_rate}% 折扣` : '无折扣'],
    ['📍 地址', o.address || '-'],
    ['📝 备注', o.notes || '-'],
  ];
  document.getElementById('owner-detail-info').innerHTML = infoItems.map(([label, val]) =>
    `<div class="detail-info-item"><span class="detail-label">${label}</span><span class="detail-val">${val}</span></div>`
  ).join('');

  // 旗下猫咪
  const ownerCats = state.cats.filter(c => c.owner_id === ownerId);
  const catsEl = document.getElementById('owner-detail-cats');
  if (ownerCats.length === 0) {
    catsEl.innerHTML = '<p style="color:#aaa;font-size:13px">尚无猫咪资料</p>';
  } else {
    catsEl.innerHTML = ownerCats.map(c => `
      <div class="cat-card" onclick="openCatDetail('${c.id}')" style="cursor:pointer">
        <div class="cat-card-name">${c.name} ${genderBadge(c.gender)}</div>
        <div class="cat-card-info">${[c.breed, c.age].filter(Boolean).join(' · ') || '品种未知'}</div>
        ${c.color ? `<div class="cat-card-info">${c.color}</div>` : ''}
        ${c.special_notes ? `<div class="cat-card-info" style="font-size:11px;color:#e07">${c.special_notes}</div>` : ''}
      </div>`).join('');
  }

  // 寄养记录
  const ownerBoardings = state.boardings.filter(b => b.owner_id === ownerId);
  const boardEl = document.getElementById('owner-detail-boardings');
  const statusBadge = { active: '<span class="badge badge-active">进行中</span>', completed: '<span class="badge badge-completed">已完成</span>', cancelled: '<span class="badge badge-cancelled">已取消</span>' };
  if (ownerBoardings.length === 0) {
    boardEl.innerHTML = '<p style="color:#aaa;font-size:13px">暂无寄养记录</p>';
  } else {
    boardEl.innerHTML = `<table class="data-table" style="font-size:13px">
      <thead><tr><th>猫咪</th><th>入住</th><th>退房</th><th>房型</th><th>总价</th><th>状态</th></tr></thead>
      <tbody>${ownerBoardings.map(b => `<tr>
        <td><span class="link-text" onclick="hideModal('owner-detail-modal');openCatDetail('${b.cat_id}')">${b.cat?.name || '-'}</span></td>
        <td>${b.check_in_date}</td><td>${b.check_out_date}</td>
        <td>${b.room_type?.name || '-'}</td>
        <td>${formatCurrency(b.total_price)}</td>
        <td>${statusBadge[b.status] || b.status}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  }

  showModal('owner-detail-modal');
}

function openCatDetail(catId) {
  if (!catId) return;
  const c = state.cats.find(x => x.id === catId);
  if (!c) return;
  const owner = state.owners.find(o => o.id === c.owner_id);

  document.getElementById('cat-detail-name').innerHTML = c.name + ' ' + genderBadge(c.gender);

  const infoItems = [
    ['🐾 品种', c.breed || '-'],
    ['🎂 年龄', c.age || '-'],
    ['🎨 颜色', c.color || '-'],
    ['👤 主人', owner ? `<span class="link-text" onclick="hideModal('cat-detail-modal');openOwnerDetail('${owner.id}')">${owner.name}</span>` : '-'],
    ['📞 主人电话', owner?.phone || '-'],
    ['📝 特殊说明', c.special_notes || '无'],
  ];
  document.getElementById('cat-detail-info').innerHTML = infoItems.map(([label, val]) =>
    `<div class="detail-info-item"><span class="detail-label">${label}</span><span class="detail-val">${val}</span></div>`
  ).join('');

  // 寄养历史
  const catBoardings = state.boardings.filter(b => b.cat_id === catId);
  const boardEl = document.getElementById('cat-detail-boardings');
  const statusBadge = { active: '<span class="badge badge-active">进行中</span>', completed: '<span class="badge badge-completed">已完成</span>', cancelled: '<span class="badge badge-cancelled">已取消</span>' };
  if (catBoardings.length === 0) {
    boardEl.innerHTML = '<p style="color:#aaa;font-size:13px">暂无寄养记录</p>';
  } else {
    boardEl.innerHTML = `<table class="data-table" style="font-size:13px">
      <thead><tr><th>入住</th><th>退房</th><th>天数</th><th>房型</th><th>日费</th><th>总价</th><th>状态</th></tr></thead>
      <tbody>${catBoardings.map(b => `<tr>
        <td>${b.check_in_date}</td><td>${b.check_out_date}</td>
        <td>${daysBetween(b.check_in_date, b.check_out_date)} 天</td>
        <td>${b.room_type?.name || '-'}</td>
        <td>${formatCurrency(b.daily_rate)}</td>
        <td><strong>${formatCurrency(b.total_price)}</strong></td>
        <td>${statusBadge[b.status] || b.status}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  }

  showModal('cat-detail-modal');
}

// ================================================================
// 演示数据
// ================================================================
const DEMO_OWNER_IDS = [
  'a1000001-0000-0000-0000-000000000001',
  'a1000002-0000-0000-0000-000000000002',
  'a1000003-0000-0000-0000-000000000003',
  'a1000004-0000-0000-0000-000000000004',
  'a1000005-0000-0000-0000-000000000005',
];
const DEMO_VISIT_IDS = [
  'c3000001-0000-0000-0000-000000000001',
  'c3000002-0000-0000-0000-000000000002',
  'c3000003-0000-0000-0000-000000000003',
  'c3000004-0000-0000-0000-000000000004',
];
const DEMO_BOARDING_IDS = [
  'd4000001-0000-0000-0000-000000000001','d4000002-0000-0000-0000-000000000002',
  'd4000003-0000-0000-0000-000000000003','d4000004-0000-0000-0000-000000000004',
  'd4000005-0000-0000-0000-000000000005','d4000006-0000-0000-0000-000000000006',
  'd4000007-0000-0000-0000-000000000007','d4000008-0000-0000-0000-000000000008',
  'd4000009-0000-0000-0000-000000000009','d4000010-0000-0000-0000-000000000010',
  'd4000011-0000-0000-0000-000000000011','d4000012-0000-0000-0000-000000000012',
];

async function loadDemoData() {
  if (!confirm('确定载入演示数据？\n（5位主人、8只猫咪、12笔寄养、4笔上门喂养）\n\n若已载入过，会自动跳过，不会重复写入。')) return;

  showLoading(true);
  try {
    // ── 1. 主人 ──────────────────────────────────────────
    const owners = [
      { id: 'a1000001-0000-0000-0000-000000000001', name: '王小明', phone: '0912-345-678', discount_rate: 10, address: '台北市信义区忠孝东路100号', notes: '老客户，养了两只猫，喜欢拍照' },
      { id: 'a1000002-0000-0000-0000-000000000002', name: '李美华', phone: '0923-456-789', discount_rate:  0, address: '台北市中山区南京西路50号',  notes: '新客户，猫咪怕生需特别注意' },
      { id: 'a1000003-0000-0000-0000-000000000003', name: '陈建志', phone: '0934-567-890', discount_rate: 20, address: '新北市板桥区文化路200号',   notes: 'VIP客户，两只猫同时寄养' },
      { id: 'a1000004-0000-0000-0000-000000000004', name: '张雅婷', phone: '0945-678-901', discount_rate:  0, address: '台北市大安区敦化南路30号',  notes: '猫咪年纪较大，需注意饮食' },
      { id: 'a1000005-0000-0000-0000-000000000005', name: '林宏达', phone: '0956-789-012', discount_rate: 15, address: '新北市三重区重新路80号',    notes: '长期客户，每次出差都来寄养' },
    ];
    const { error: e1 } = await db.from('owners').upsert(owners, { onConflict: 'id', ignoreDuplicates: true });
    if (e1) throw e1;

    // ── 2. 猫咪 ──────────────────────────────────────────
    const cats = [
      { id: 'b2000001-0000-0000-0000-000000000001', owner_id: 'a1000001-0000-0000-0000-000000000001', name: '橘子', breed: '混种猫',       age: '3岁', gender: 'male',   color: '橘色虎斑',    special_notes: '活泼好动，喜欢玩逗猫棒' },
      { id: 'b2000002-0000-0000-0000-000000000002', owner_id: 'a1000001-0000-0000-0000-000000000001', name: '雪球', breed: '波斯猫',       age: '2岁', gender: 'female', color: '全白长毛',    special_notes: '毛发需每日梳理，怕噪音' },
      { id: 'b2000003-0000-0000-0000-000000000003', owner_id: 'a1000002-0000-0000-0000-000000000002', name: '小黑', breed: '混种猫',       age: '1岁', gender: 'male',   color: '全黑短毛',    special_notes: '适应力差，需多安抚' },
      { id: 'b2000004-0000-0000-0000-000000000004', owner_id: 'a1000003-0000-0000-0000-000000000003', name: '豆腐', breed: '布偶猫',       age: '4岁', gender: 'female', color: '蓝白双色',    special_notes: '个性温顺，非常爱撒娇' },
      { id: 'b2000005-0000-0000-0000-000000000005', owner_id: 'a1000003-0000-0000-0000-000000000003', name: '可可', breed: '英国短毛猫',   age: '2岁', gender: 'male',   color: '蓝灰色',      special_notes: '食欲旺盛，每日需喂三次' },
      { id: 'b2000006-0000-0000-0000-000000000006', owner_id: 'a1000004-0000-0000-0000-000000000004', name: '奶茶', breed: '暹罗猫',       age: '5岁', gender: 'female', color: '奶油色重点色', special_notes: '年纪大，需特别注意饮水' },
      { id: 'b2000007-0000-0000-0000-000000000007', owner_id: 'a1000005-0000-0000-0000-000000000005', name: '饼干', breed: '美国短毛猫',   age: '3岁', gender: 'male',   color: '银色虎斑',    special_notes: '非常友善，容易相处' },
      { id: 'b2000008-0000-0000-0000-000000000008', owner_id: 'a1000005-0000-0000-0000-000000000005', name: '芝麻', breed: '苏格兰折耳猫', age: '1岁', gender: 'female', color: '灰白色',      special_notes: '耳朵需定期检查清洁' },
    ];
    const { error: e2 } = await db.from('cats').upsert(cats, { onConflict: 'id', ignoreDuplicates: true });
    if (e2) throw e2;

    // ── 3. 取房型 ID ────────────────────────────────────
    await loadRoomTypes();
    const std = state.roomTypes.find(r => r.name === '标准房');
    const lux = state.roomTypes.find(r => r.name === '豪华房');
    if (!std || !lux) throw new Error('找不到标准房或豪华房，请先在设置中新增这两个房型');

    // ── 4. 寄养记录 ──────────────────────────────────────
    const boardings = [
      // 今日进行中（2026-03-08）
      { id: 'd4000001-0000-0000-0000-000000000001', cat_id: 'b2000001-0000-0000-0000-000000000001', owner_id: 'a1000001-0000-0000-0000-000000000001', room_type_id: std.id, check_in_date: '2026-03-05', check_out_date: '2026-03-12', daily_rate: 45.00,  total_price: 315.00,  status: 'active',    notes: '喜欢早上玩耍' },
      { id: 'd4000002-0000-0000-0000-000000000002', cat_id: 'b2000004-0000-0000-0000-000000000004', owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: lux.id, check_in_date: '2026-03-07', check_out_date: '2026-03-15', daily_rate: 64.00,  total_price: 512.00,  status: 'active',    notes: '指定豪华房' },
      { id: 'd4000003-0000-0000-0000-000000000003', cat_id: 'b2000003-0000-0000-0000-000000000003', owner_id: 'a1000002-0000-0000-0000-000000000002', room_type_id: std.id, check_in_date: '2026-03-08', check_out_date: '2026-03-10', daily_rate: 50.00,  total_price: 100.00,  status: 'active',    notes: '第一次寄养，注意情绪' },
      { id: 'd4000004-0000-0000-0000-000000000004', cat_id: 'b2000007-0000-0000-0000-000000000007', owner_id: 'a1000005-0000-0000-0000-000000000005', room_type_id: lux.id, check_in_date: '2026-03-06', check_out_date: '2026-03-11', daily_rate: 68.00,  total_price: 340.00,  status: 'active',    notes: null },
      // 2月已完成
      { id: 'd4000005-0000-0000-0000-000000000005', cat_id: 'b2000002-0000-0000-0000-000000000002', owner_id: 'a1000001-0000-0000-0000-000000000001', room_type_id: std.id, check_in_date: '2026-02-20', check_out_date: '2026-02-25', daily_rate: 45.00,  total_price: 225.00,  status: 'completed', notes: null },
      { id: 'd4000006-0000-0000-0000-000000000006', cat_id: 'b2000005-0000-0000-0000-000000000005', owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: lux.id, check_in_date: '2026-02-14', check_out_date: '2026-02-20', daily_rate: 64.00,  total_price: 384.00,  status: 'completed', notes: null },
      { id: 'd4000007-0000-0000-0000-000000000007', cat_id: 'b2000006-0000-0000-0000-000000000006', owner_id: 'a1000004-0000-0000-0000-000000000004', room_type_id: std.id, check_in_date: '2026-02-07', check_out_date: '2026-02-12', daily_rate: 50.00,  total_price: 250.00,  status: 'completed', notes: null },
      { id: 'd4000008-0000-0000-0000-000000000008', cat_id: 'b2000008-0000-0000-0000-000000000008', owner_id: 'a1000005-0000-0000-0000-000000000005', room_type_id: std.id, check_in_date: '2026-02-27', check_out_date: '2026-03-03', daily_rate: 42.50,  total_price: 170.00,  status: 'completed', notes: null },
      // 1月已完成
      { id: 'd4000009-0000-0000-0000-000000000009', cat_id: 'b2000001-0000-0000-0000-000000000001', owner_id: 'a1000001-0000-0000-0000-000000000001', room_type_id: std.id, check_in_date: '2026-01-18', check_out_date: '2026-01-26', daily_rate: 45.00,  total_price: 360.00,  status: 'completed', notes: null },
      { id: 'd4000010-0000-0000-0000-000000000010', cat_id: 'b2000007-0000-0000-0000-000000000007', owner_id: 'a1000005-0000-0000-0000-000000000005', room_type_id: lux.id, check_in_date: '2026-01-20', check_out_date: '2026-01-27', daily_rate: 68.00,  total_price: 476.00,  status: 'completed', notes: null },
      { id: 'd4000011-0000-0000-0000-000000000011', cat_id: 'b2000004-0000-0000-0000-000000000004', owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: lux.id, check_in_date: '2026-01-22', check_out_date: '2026-02-02', daily_rate: 64.00,  total_price: 704.00,  status: 'completed', notes: null },
      { id: 'd4000012-0000-0000-0000-000000000012', cat_id: 'b2000005-0000-0000-0000-000000000005', owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: std.id, check_in_date: '2026-01-22', check_out_date: '2026-02-02', daily_rate: 40.00,  total_price: 440.00,  status: 'completed', notes: null },
    ];
    const { error: e3 } = await db.from('boardings').upsert(boardings, { onConflict: 'id', ignoreDuplicates: true });
    if (e3) throw e3;

    // ── 5. 上门喂养主记录 ────────────────────────────────
    const homeVisits = [
      { id: 'c3000001-0000-0000-0000-000000000001', owner_id: 'a1000001-0000-0000-0000-000000000001', cat_id: 'b2000002-0000-0000-0000-000000000002', address: '台北市信义区忠孝东路100号3楼', visit_time: '上午 9:00',  price_per_visit: 80.00,  notes: '雪球在家，需补充干粮和换水',  status: 'active' },
      { id: 'c3000002-0000-0000-0000-000000000002', owner_id: 'a1000004-0000-0000-0000-000000000004', cat_id: 'b2000006-0000-0000-0000-000000000006', address: '台北市大安区敦化南路30号12楼', visit_time: '下午 3:00',  price_per_visit: 100.00, notes: '奶茶需喂处方食品，罐头放冰箱', status: 'active' },
      { id: 'c3000003-0000-0000-0000-000000000003', owner_id: 'a1000005-0000-0000-0000-000000000005', cat_id: 'b2000008-0000-0000-0000-000000000008', address: '新北市三重区重新路80号5楼',   visit_time: '上午 10:00', price_per_visit: 80.00,  notes: null,                          status: 'active' },
      { id: 'c3000004-0000-0000-0000-000000000004', owner_id: 'a1000002-0000-0000-0000-000000000002', cat_id: 'b2000003-0000-0000-0000-000000000003', address: '台北市中山区南京西路50号8楼', visit_time: '下午 6:00',  price_per_visit: 80.00,  notes: '出差一周',                    status: 'completed' },
    ];
    const { error: e4 } = await db.from('home_visits').upsert(homeVisits, { onConflict: 'id', ignoreDuplicates: true });
    if (e4) throw e4;

    // ── 6. 上门日期明细 ──────────────────────────────────
    // 先删除旧的演示日期（避免重复），再重新插入
    await db.from('home_visit_dates').delete().in('home_visit_id', DEMO_VISIT_IDS);

    const visitDates = [
      // 王小明-雪球（3月，今日3/8有安排）
      ...['2026-03-06','2026-03-07','2026-03-08','2026-03-09','2026-03-10','2026-03-13','2026-03-14']
        .map(d => ({ home_visit_id: 'c3000001-0000-0000-0000-000000000001', visit_date: d })),
      // 张雅婷-奶茶（3月，今日3/8有安排）
      ...['2026-03-05','2026-03-06','2026-03-07','2026-03-08','2026-03-09','2026-03-10','2026-03-12','2026-03-13']
        .map(d => ({ home_visit_id: 'c3000002-0000-0000-0000-000000000002', visit_date: d })),
      // 林宏达-芝麻（3月）
      ...['2026-03-10','2026-03-11','2026-03-12','2026-03-13','2026-03-14']
        .map(d => ({ home_visit_id: 'c3000003-0000-0000-0000-000000000003', visit_date: d })),
      // 李美华-小黑（2月，已完成）
      ...['2026-02-10','2026-02-11','2026-02-12','2026-02-13','2026-02-14','2026-02-15','2026-02-16']
        .map(d => ({ home_visit_id: 'c3000004-0000-0000-0000-000000000004', visit_date: d })),
    ];
    const { error: e5 } = await db.from('home_visit_dates').insert(visitDates);
    if (e5) throw e5;

    showToast('演示数据载入成功！', 'success');
    await loadAllData();
  } catch (err) {
    console.error(err);
    showToast('载入失败：' + err.message, 'error');
  }
  showLoading(false);
}

async function clearDemoData() {
  if (!confirm('确定清除所有演示数据？\n（只会删除演示用的5位主人及其相关记录）')) return;
  showLoading(true);
  try {
    // 删除上门日期 → 上门记录 → 寄养记录 → 猫咪 → 主人（级联）
    await db.from('home_visit_dates').delete().in('home_visit_id', DEMO_VISIT_IDS);
    await db.from('home_visits').delete().in('id', DEMO_VISIT_IDS);
    await db.from('boardings').delete().in('id', DEMO_BOARDING_IDS);
    // 删除主人会级联删除猫咪
    await db.from('owners').delete().in('id', DEMO_OWNER_IDS);
    showToast('演示数据已清除', 'success');
    await loadAllData();
  } catch (err) {
    console.error(err);
    showToast('清除失败：' + err.message, 'error');
  }
  showLoading(false);
}

// ================================================================
// 启动
// ================================================================
initApp();
