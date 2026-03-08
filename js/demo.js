import { db } from './config.js';
import { state } from './state.js';
import { showLoading, showToast } from './ui.js';
import { loadAllData, loadRoomTypes } from './api.js';
import { renderAll } from './render.js';

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

export async function loadDemoData() {
  if (!confirm('确定载入演示数据？\n（5位主人、8只猫咪、12笔寄养、4笔上门喂养）\n\n若已载入过，会自动跳过，不会重复写入。')) return;
  showLoading(true);
  try {
    const owners = [
      { id: 'a1000001-0000-0000-0000-000000000001', name: '王小明', phone: '0912-345-678', wechat: 'wang_xiaoming', address: '台北市信义区忠孝东路100号', notes: '老客户，养了两只猫' },
      { id: 'a1000002-0000-0000-0000-000000000002', name: '李美华', phone: '0923-456-789', wechat: 'li_meihua',    address: '台北市中山区南京西路50号',  notes: '新客户，猫咪怕生需特别注意' },
      { id: 'a1000003-0000-0000-0000-000000000003', name: '陈建志', phone: '0934-567-890', wechat: 'chen_jianzhi', address: '新北市板桥区文化路200号',   notes: 'VIP客户，两只猫同时寄养' },
      { id: 'a1000004-0000-0000-0000-000000000004', name: '张雅婷', phone: '0945-678-901', wechat: 'zhang_yating', address: '台北市大安区敦化南路30号',  notes: '猫咪年纪较大，需注意饮食' },
      { id: 'a1000005-0000-0000-0000-000000000005', name: '林宏达', phone: '0956-789-012', wechat: 'lin_hongda',   address: '新北市三重区重新路80号',    notes: '长期客户，每次出差都来寄养' },
    ];
    const { error: e1 } = await db.from('owners').upsert(owners, { onConflict: 'id', ignoreDuplicates: true });
    if (e1) throw e1;

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

    await loadRoomTypes();
    const std = state.roomTypes.find(r => r.name === '标准房');
    const lux = state.roomTypes.find(r => r.name === '豪华房');
    if (!std || !lux) throw new Error('找不到标准房或豪华房，请先在设置中新增这两个房型');

    // 演示各主人专属价格（陈建志VIP价格）
    const ownerPrices = [
      { owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: std.id, price_per_day: 40.00 },
      { owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: lux.id, price_per_day: 64.00 },
      { owner_id: 'a1000005-0000-0000-0000-000000000005', room_type_id: lux.id, price_per_day: 68.00 },
      { owner_id: 'a1000001-0000-0000-0000-000000000001', room_type_id: std.id, price_per_day: 45.00 },
    ];
    await db.from('owner_room_prices').upsert(ownerPrices, { onConflict: 'owner_id,room_type_id' });

    const boardings = [
      { id: 'd4000001-0000-0000-0000-000000000001', cat_id: 'b2000001-0000-0000-0000-000000000001', owner_id: 'a1000001-0000-0000-0000-000000000001', room_type_id: std.id, check_in_date: '2026-03-05', check_out_date: '2026-03-12', daily_rate: 45.00, total_price: 315.00, status: 'active',    notes: '喜欢早上玩耍' },
      { id: 'd4000002-0000-0000-0000-000000000002', cat_id: 'b2000004-0000-0000-0000-000000000004', owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: lux.id, check_in_date: '2026-03-07', check_out_date: '2026-03-15', daily_rate: 64.00, total_price: 512.00, status: 'active',    notes: '指定豪华房' },
      { id: 'd4000003-0000-0000-0000-000000000003', cat_id: 'b2000003-0000-0000-0000-000000000003', owner_id: 'a1000002-0000-0000-0000-000000000002', room_type_id: std.id, check_in_date: '2026-03-08', check_out_date: '2026-03-10', daily_rate: 50.00, total_price: 100.00, status: 'active',    notes: '第一次寄养' },
      { id: 'd4000004-0000-0000-0000-000000000004', cat_id: 'b2000007-0000-0000-0000-000000000007', owner_id: 'a1000005-0000-0000-0000-000000000005', room_type_id: lux.id, check_in_date: '2026-03-06', check_out_date: '2026-03-11', daily_rate: 68.00, total_price: 340.00, status: 'active',    notes: null },
      { id: 'd4000005-0000-0000-0000-000000000005', cat_id: 'b2000002-0000-0000-0000-000000000002', owner_id: 'a1000001-0000-0000-0000-000000000001', room_type_id: std.id, check_in_date: '2026-02-20', check_out_date: '2026-02-25', daily_rate: 45.00, total_price: 225.00, status: 'completed', notes: null },
      { id: 'd4000006-0000-0000-0000-000000000006', cat_id: 'b2000005-0000-0000-0000-000000000005', owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: lux.id, check_in_date: '2026-02-14', check_out_date: '2026-02-20', daily_rate: 64.00, total_price: 384.00, status: 'completed', notes: null },
      { id: 'd4000007-0000-0000-0000-000000000007', cat_id: 'b2000006-0000-0000-0000-000000000006', owner_id: 'a1000004-0000-0000-0000-000000000004', room_type_id: std.id, check_in_date: '2026-02-07', check_out_date: '2026-02-12', daily_rate: 50.00, total_price: 250.00, status: 'completed', notes: null },
      { id: 'd4000008-0000-0000-0000-000000000008', cat_id: 'b2000008-0000-0000-0000-000000000008', owner_id: 'a1000005-0000-0000-0000-000000000005', room_type_id: std.id, check_in_date: '2026-02-27', check_out_date: '2026-03-03', daily_rate: 42.50, total_price: 170.00, status: 'completed', notes: null },
      { id: 'd4000009-0000-0000-0000-000000000009', cat_id: 'b2000001-0000-0000-0000-000000000001', owner_id: 'a1000001-0000-0000-0000-000000000001', room_type_id: std.id, check_in_date: '2026-01-18', check_out_date: '2026-01-26', daily_rate: 45.00, total_price: 360.00, status: 'completed', notes: null },
      { id: 'd4000010-0000-0000-0000-000000000010', cat_id: 'b2000007-0000-0000-0000-000000000007', owner_id: 'a1000005-0000-0000-0000-000000000005', room_type_id: lux.id, check_in_date: '2026-01-20', check_out_date: '2026-01-27', daily_rate: 68.00, total_price: 476.00, status: 'completed', notes: null },
      { id: 'd4000011-0000-0000-0000-000000000011', cat_id: 'b2000004-0000-0000-0000-000000000004', owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: lux.id, check_in_date: '2026-01-22', check_out_date: '2026-02-02', daily_rate: 64.00, total_price: 704.00, status: 'completed', notes: null },
      { id: 'd4000012-0000-0000-0000-000000000012', cat_id: 'b2000005-0000-0000-0000-000000000005', owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: std.id, check_in_date: '2026-01-22', check_out_date: '2026-02-02', daily_rate: 40.00, total_price: 440.00, status: 'completed', notes: null },
    ];
    const { error: e3 } = await db.from('boardings').upsert(boardings, { onConflict: 'id', ignoreDuplicates: true });
    if (e3) throw e3;

    const homeVisits = [
      { id: 'c3000001-0000-0000-0000-000000000001', owner_id: 'a1000001-0000-0000-0000-000000000001', cat_id: 'b2000002-0000-0000-0000-000000000002', address: '台北市信义区忠孝东路100号3楼', visit_time: '上午 9:00',  price_per_visit: 80.00,  notes: '雪球在家，需补充干粮',  status: 'active' },
      { id: 'c3000002-0000-0000-0000-000000000002', owner_id: 'a1000004-0000-0000-0000-000000000004', cat_id: 'b2000006-0000-0000-0000-000000000006', address: '台北市大安区敦化南路30号12楼', visit_time: '下午 3:00',  price_per_visit: 100.00, notes: '奶茶需喂处方食品',      status: 'active' },
      { id: 'c3000003-0000-0000-0000-000000000003', owner_id: 'a1000005-0000-0000-0000-000000000005', cat_id: 'b2000008-0000-0000-0000-000000000008', address: '新北市三重区重新路80号5楼',   visit_time: '上午 10:00', price_per_visit: 80.00,  notes: null,               status: 'active' },
      { id: 'c3000004-0000-0000-0000-000000000004', owner_id: 'a1000002-0000-0000-0000-000000000002', cat_id: 'b2000003-0000-0000-0000-000000000003', address: '台北市中山区南京西路50号8楼', visit_time: '下午 6:00',  price_per_visit: 80.00,  notes: '出差一周',           status: 'completed' },
    ];
    const { error: e4 } = await db.from('home_visits').upsert(homeVisits, { onConflict: 'id', ignoreDuplicates: true });
    if (e4) throw e4;

    await db.from('home_visit_dates').delete().in('home_visit_id', DEMO_VISIT_IDS);
    const visitDates = [
      ...['2026-03-06','2026-03-07','2026-03-08','2026-03-09','2026-03-10','2026-03-13','2026-03-14'].map(d => ({ home_visit_id: 'c3000001-0000-0000-0000-000000000001', visit_date: d })),
      ...['2026-03-05','2026-03-06','2026-03-07','2026-03-08','2026-03-09','2026-03-10','2026-03-12','2026-03-13'].map(d => ({ home_visit_id: 'c3000002-0000-0000-0000-000000000002', visit_date: d })),
      ...['2026-03-10','2026-03-11','2026-03-12','2026-03-13','2026-03-14'].map(d => ({ home_visit_id: 'c3000003-0000-0000-0000-000000000003', visit_date: d })),
      ...['2026-02-10','2026-02-11','2026-02-12','2026-02-13','2026-02-14','2026-02-15','2026-02-16'].map(d => ({ home_visit_id: 'c3000004-0000-0000-0000-000000000004', visit_date: d })),
    ];
    const { error: e5 } = await db.from('home_visit_dates').insert(visitDates);
    if (e5) throw e5;

    showToast('演示数据载入成功！', 'success');
    await loadAllData();
    renderAll();
  } catch (err) {
    console.error(err);
    showToast('载入失败：' + err.message, 'error');
  }
  showLoading(false);
}

export async function clearDemoData() {
  if (!confirm('确定清除所有演示数据？')) return;
  showLoading(true);
  try {
    await db.from('home_visit_dates').delete().in('home_visit_id', DEMO_VISIT_IDS);
    await db.from('home_visits').delete().in('id', DEMO_VISIT_IDS);
    await db.from('boardings').delete().in('id', DEMO_BOARDING_IDS);
    await db.from('owners').delete().in('id', DEMO_OWNER_IDS);
    showToast('演示数据已清除', 'success');
    await loadAllData();
    renderAll();
  } catch (err) {
    showToast('清除失败：' + err.message, 'error');
  }
  showLoading(false);
}
