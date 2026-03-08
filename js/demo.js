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
  'a1000006-0000-0000-0000-000000000006',
  'a1000007-0000-0000-0000-000000000007',
  'a1000008-0000-0000-0000-000000000008',
];
const DEMO_VISIT_IDS = [
  'c3000001-0000-0000-0000-000000000001',
  'c3000002-0000-0000-0000-000000000002',
  'c3000003-0000-0000-0000-000000000003',
  'c3000004-0000-0000-0000-000000000004',
  'c3000005-0000-0000-0000-000000000005',
  'c3000006-0000-0000-0000-000000000006',
  'c3000007-0000-0000-0000-000000000007',
  'c3000008-0000-0000-0000-000000000008',
];
const DEMO_BOARDING_IDS = Array.from({ length: 52 }, (_, i) => {
  const n = String(i + 1).padStart(3, '0');
  return `d4000${n}-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
});

function bid(n) {
  const s = String(n).padStart(3, '0');
  return `d4000${s}-0000-0000-0000-${String(n).padStart(12, '0')}`;
}

export async function loadDemoData() {
  if (!confirm('确定载入演示数据？\n（8位主人、14只猫咪、52笔寄养、8笔上门喂养）\n\n若已载入过，会自动跳过，不会重复写入。')) return;
  showLoading(true);
  try {
    // ── 主人（8位）────────────────────────────────────────────────
    const owners = [
      { id: 'a1000001-0000-0000-0000-000000000001', name: '王小明', phone: '0412 345 678', wechat: 'wang_xiaoming', email: 'xiaoming@gmail.com',  address: '100 George Street, Sydney NSW 2000',        notes: '老客户，养了两只猫' },
      { id: 'a1000002-0000-0000-0000-000000000002', name: '李美华', phone: '0423 456 789', wechat: 'li_meihua',    email: 'meihua@hotmail.com',  address: '50 Pitt Street, Sydney NSW 2000',           notes: '新客户，猫咪怕生需特别注意' },
      { id: 'a1000003-0000-0000-0000-000000000003', name: '陈建志', phone: '0434 567 890', wechat: 'chen_jianzhi', email: 'jianzhi@outlook.com', address: '200 Pacific Highway, Crows Nest NSW 2065',  notes: 'VIP客户，两只猫同时寄养' },
      { id: 'a1000004-0000-0000-0000-000000000004', name: '张雅婷', phone: '0445 678 901', wechat: 'zhang_yating', email: 'yating@gmail.com',    address: '30 King Street, Newtown NSW 2042',          notes: '猫咪年纪较大，需注意饮食' },
      { id: 'a1000005-0000-0000-0000-000000000005', name: '林宏达', phone: '0456 789 012', wechat: 'lin_hongda',   email: 'hongda@gmail.com',    address: '80 Harris Street, Pyrmont NSW 2009',        notes: '长期客户，每次出差都来寄养' },
      { id: 'a1000006-0000-0000-0000-000000000006', name: '郭美玲', phone: '0467 890 123', wechat: 'guo_meiling',  email: 'meiling@icloud.com',  address: '5 Crown Street, Surry Hills NSW 2010',      notes: '猫咪很粘人，需要多陪伴' },
      { id: 'a1000007-0000-0000-0000-000000000007', name: '赵天宇', phone: '0478 901 234', wechat: 'zhao_tianyu',  email: 'tianyu@gmail.com',    address: '22 Campbell Parade, Bondi Beach NSW 2026',  notes: '出差频繁，每月都会来' },
      { id: 'a1000008-0000-0000-0000-000000000008', name: '黄雅琪', phone: '0489 012 345', wechat: 'huang_yaqi',   email: 'yaqi@hotmail.com',    address: '88 Victoria Avenue, Chatswood NSW 2067',   notes: '两只猫需分开安置' },
    ];
    const { error: e1 } = await db.from('owners').upsert(owners, { onConflict: 'id', ignoreDuplicates: true });
    if (e1) throw e1;

    // ── 猫咪（14只）───────────────────────────────────────────────
    const cats = [
      { id: 'b2000001-0000-0000-0000-000000000001', owner_id: 'a1000001-0000-0000-0000-000000000001', name: '橘子', breed: '混种猫',       age: '3岁', gender: 'male',   color: '橘色虎斑',     special_notes: '活泼好动，喜欢玩逗猫棒' },
      { id: 'b2000002-0000-0000-0000-000000000002', owner_id: 'a1000001-0000-0000-0000-000000000001', name: '雪球', breed: '波斯猫',       age: '2岁', gender: 'female', color: '全白长毛',     special_notes: '毛发需每日梳理，怕噪音' },
      { id: 'b2000003-0000-0000-0000-000000000003', owner_id: 'a1000002-0000-0000-0000-000000000002', name: '小黑', breed: '混种猫',       age: '1岁', gender: 'male',   color: '全黑短毛',     special_notes: '适应力差，需多安抚' },
      { id: 'b2000004-0000-0000-0000-000000000004', owner_id: 'a1000003-0000-0000-0000-000000000003', name: '豆腐', breed: '布偶猫',       age: '4岁', gender: 'female', color: '蓝白双色',     special_notes: '个性温顺，非常爱撒娇' },
      { id: 'b2000005-0000-0000-0000-000000000005', owner_id: 'a1000003-0000-0000-0000-000000000003', name: '可可', breed: '英国短毛猫',   age: '2岁', gender: 'male',   color: '蓝灰色',       special_notes: '食欲旺盛，每日需喂三次' },
      { id: 'b2000006-0000-0000-0000-000000000006', owner_id: 'a1000004-0000-0000-0000-000000000004', name: '奶茶', breed: '暹罗猫',       age: '5岁', gender: 'female', color: '奶油色重点色',  special_notes: '年纪大，需特别注意饮水' },
      { id: 'b2000007-0000-0000-0000-000000000007', owner_id: 'a1000005-0000-0000-0000-000000000005', name: '饼干', breed: '美国短毛猫',   age: '3岁', gender: 'male',   color: '银色虎斑',     special_notes: '非常友善，容易相处' },
      { id: 'b2000008-0000-0000-0000-000000000008', owner_id: 'a1000005-0000-0000-0000-000000000005', name: '芝麻', breed: '苏格兰折耳猫', age: '1岁', gender: 'female', color: '灰白色',       special_notes: '耳朵需定期检查清洁' },
      { id: 'b2000009-0000-0000-0000-000000000009', owner_id: 'a1000006-0000-0000-0000-000000000006', name: '布丁', breed: '布偶猫',       age: '2岁', gender: 'male',   color: '海豹双色',     special_notes: '非常粘人，喜欢被抱' },
      { id: 'b2000010-0000-0000-0000-000000000010', owner_id: 'a1000006-0000-0000-0000-000000000006', name: '糯米', breed: '混种猫',       age: '3岁', gender: 'female', color: '三花猫',       special_notes: '怕陌生人，适应后很乖' },
      { id: 'b2000011-0000-0000-0000-000000000011', owner_id: 'a1000007-0000-0000-0000-000000000007', name: '花花', breed: '英国短毛猫',   age: '1岁', gender: 'female', color: '金渐层',       special_notes: '好奇心强，喜欢探索' },
      { id: 'b2000012-0000-0000-0000-000000000012', owner_id: 'a1000007-0000-0000-0000-000000000007', name: '豆豆', breed: '暹罗猫',       age: '4岁', gender: 'male',   color: '蓝色重点色',   special_notes: '话多爱叫，需要安抚' },
      { id: 'b2000013-0000-0000-0000-000000000013', owner_id: 'a1000008-0000-0000-0000-000000000008', name: '毛毛', breed: '美国短毛猫',   age: '2岁', gender: 'male',   color: '棕色虎斑',     special_notes: '活力充沛，需要大空间' },
      { id: 'b2000014-0000-0000-0000-000000000014', owner_id: 'a1000008-0000-0000-0000-000000000008', name: '咪咪', breed: '混种猫',       age: '5岁', gender: 'female', color: '奶牛花纹',     special_notes: '与毛毛需分开安置' },
    ];
    const { error: e2 } = await db.from('cats').upsert(cats, { onConflict: 'id', ignoreDuplicates: true });
    if (e2) throw e2;

    await loadRoomTypes();
    const std = state.roomTypes.find(r => r.name === '标准房');
    const lux = state.roomTypes.find(r => r.name === '豪华房');
    if (!std || !lux) throw new Error('找不到标准房或豪华房，请先在设置中新增这两个房型');

    const ownerPrices = [
      { owner_id: 'a1000001-0000-0000-0000-000000000001', room_type_id: std.id, price_per_day: 45.00 },
      { owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: std.id, price_per_day: 40.00 },
      { owner_id: 'a1000003-0000-0000-0000-000000000003', room_type_id: lux.id, price_per_day: 64.00 },
      { owner_id: 'a1000005-0000-0000-0000-000000000005', room_type_id: lux.id, price_per_day: 68.00 },
      { owner_id: 'a1000007-0000-0000-0000-000000000007', room_type_id: lux.id, price_per_day: 75.00 },
    ];
    await db.from('owner_room_prices').upsert(ownerPrices, { onConflict: 'owner_id,room_type_id' });

    // ── 寄养记录（52笔）────────────────────────────────────────────
    // 缩写：O1-O8=主人, C1-C14=猫咪, S=标准房, L=豪华房
    // std默认$50, lux默认$80；陈建志std=40/lux=64；林宏达lux=68；赵天宇lux=75；王小明std=45
    const S = std.id, L = lux.id;
    const [O1,O2,O3,O4,O5,O6,O7,O8] = DEMO_OWNER_IDS;
    const C1='b2000001-0000-0000-0000-000000000001', C2='b2000002-0000-0000-0000-000000000002',
          C3='b2000003-0000-0000-0000-000000000003', C4='b2000004-0000-0000-0000-000000000004',
          C5='b2000005-0000-0000-0000-000000000005', C6='b2000006-0000-0000-0000-000000000006',
          C7='b2000007-0000-0000-0000-000000000007', C8='b2000008-0000-0000-0000-000000000008',
          C9='b2000009-0000-0000-0000-000000000009', C10='b2000010-0000-0000-0000-000000000010',
          C11='b2000011-0000-0000-0000-000000000011',C12='b2000012-0000-0000-0000-000000000012',
          C13='b2000013-0000-0000-0000-000000000013',C14='b2000014-0000-0000-0000-000000000014';
    const done='completed', act='active';

    // [n, cat, owner, room, check_in, check_out, rate, total, status]
    const bRows = [
      // ─── 1月（21笔）
      [ 1, C1, O1, S,'2026-01-02','2026-01-09', 45, 315,done],
      [ 2, C4, O3, L,'2026-01-03','2026-01-10', 64, 448,done],
      [ 3, C6, O4, L,'2026-01-03','2026-01-10', 80, 560,done],
      [ 4, C9, O6, S,'2026-01-04','2026-01-09', 50, 250,done],
      [ 5, C2, O1, S,'2026-01-05','2026-01-10', 45, 225,done],
      [ 6, C10,O6, L,'2026-01-04','2026-01-09', 80, 400,done],
      [ 7, C11,O7, S,'2026-01-06','2026-01-13', 50, 350,done],
      [ 8, C14,O8, L,'2026-01-05','2026-01-12', 80, 560,done],
      [ 9, C12,O7, L,'2026-01-09','2026-01-16', 75, 525,done],
      [10, C7, O5, L,'2026-01-12','2026-01-17', 68, 340,done],
      [11, C13,O8, S,'2026-01-11','2026-01-17', 50, 300,done],
      [12, C3, O2, S,'2026-01-08','2026-01-15', 50, 350,done],
      [13, C8, O5, S,'2026-01-14','2026-01-20', 50, 300,done],
      [14, C5, O3, S,'2026-01-15','2026-01-19', 40, 160,done],
      [15, C9, O6, L,'2026-01-20','2026-01-28', 80, 640,done],
      [16, C1, O1, S,'2026-01-18','2026-01-26', 45, 360,done],
      [17, C7, O5, L,'2026-01-20','2026-01-27', 68, 476,done],
      [18, C4, O3, L,'2026-01-22','2026-02-02', 64, 704,done],
      [19, C5, O3, S,'2026-01-22','2026-02-02', 40, 440,done],
      [20, C11,O7, S,'2026-01-25','2026-02-01', 50, 350,done],
      [21, C8, O5, S,'2026-01-28','2026-02-04', 50, 350,done],
      // ─── 2月（19笔）
      [22, C4, O3, L,'2026-02-05','2026-02-10', 64, 320,done],
      [23, C9, O6, S,'2026-02-02','2026-02-07', 50, 250,done],
      [24, C6, O4, S,'2026-02-01','2026-02-06', 50, 250,done],
      [25, C2, O1, S,'2026-02-08','2026-02-14', 45, 270,done],
      [26, C10,O6, L,'2026-02-05','2026-02-11', 80, 480,done],
      [27, C12,O7, L,'2026-02-08','2026-02-14', 75, 450,done],
      [28, C13,O8, S,'2026-02-10','2026-02-17', 50, 350,done],
      [29, C5, O3, L,'2026-02-14','2026-02-20', 64, 384,done],
      [30, C3, O2, S,'2026-02-15','2026-02-19', 50, 200,done],
      [31, C14,O8, L,'2026-02-12','2026-02-18', 80, 480,done],
      [32, C7, O5, L,'2026-02-22','2026-02-28', 68, 408,done],
      [33, C11,O7, S,'2026-02-18','2026-02-23', 50, 250,done],
      [34, C1, O1, S,'2026-02-22','2026-03-01', 45, 270,done],
      [35, C12,O7, S,'2026-02-20','2026-02-25', 50, 250,done],
      [36, C6, O4, S,'2026-02-07','2026-02-12', 50, 250,done],
      [37, C10,O6, S,'2026-02-24','2026-03-02', 50, 350,done],
      [38, C13,O8, L,'2026-02-25','2026-03-03', 80, 480,done],
      [39, C8, O5, S,'2026-02-27','2026-03-03', 50, 200,done],
      [40, C2, O1, S,'2026-02-20','2026-02-25', 45, 225,done],
      // ─── 3月（12笔）
      [41, C1, O1, S,'2026-03-05','2026-03-12', 45, 315,act],
      [42, C4, O3, L,'2026-03-07','2026-03-15', 64, 512,act],
      [43, C3, O2, S,'2026-03-08','2026-03-10', 50, 100,act],
      [44, C7, O5, L,'2026-03-06','2026-03-11', 68, 340,act],
      [45, C11,O7, L,'2026-03-04','2026-03-11', 75, 525,act],
      [46, C12,O7, S,'2026-03-06','2026-03-14', 50, 400,act],
      [47, C14,O8, S,'2026-03-07','2026-03-13', 50, 300,act],
      [48, C13,O8, L,'2026-03-09','2026-03-16', 80, 560,act],
      [49, C10,O6, L,'2026-03-10','2026-03-17', 80, 560,act],
      [50, C9, O6, S,'2026-03-04','2026-03-09', 50, 250,done],
      [51, C5, O3, S,'2026-03-03','2026-03-08', 40, 200,done],
      [52, C8, O5, S,'2026-03-01','2026-03-05', 50, 200,done],
    ];
    const boardings = bRows.map(([n, cat_id, owner_id, room_type_id, i, o, rate, total, status]) => ({
      id: bid(n), cat_id, owner_id, room_type_id,
      check_in_date: i, check_out_date: o, daily_rate: rate, total_price: total, status, notes: null,
    }));
    // 加备注
    boardings.find(b => b.id === bid(41)).notes = '喜欢早上玩耍';
    boardings.find(b => b.id === bid(42)).notes = '指定豪华房';
    boardings.find(b => b.id === bid(43)).notes = '第一次寄养';

    const { error: e3 } = await db.from('boardings').upsert(boardings, { onConflict: 'id', ignoreDuplicates: true });
    if (e3) throw e3;

    // ── 上门喂养记录（8笔）────────────────────────────────────────
    const homeVisits = [
      { id: 'c3000001-0000-0000-0000-000000000001', owner_id: O1, cat_id: C2, address: '100 George Street, Sydney NSW 2000',        visit_time: '上午 9:00',  price_per_visit: 80,  notes: '雪球在家，需补充干粮',   status: 'active' },
      { id: 'c3000002-0000-0000-0000-000000000002', owner_id: O4, cat_id: C6, address: '30 King Street, Newtown NSW 2042',          visit_time: '下午 3:00',  price_per_visit: 100, notes: '奶茶需喂处方食品',       status: 'active' },
      { id: 'c3000003-0000-0000-0000-000000000003', owner_id: O5, cat_id: C8, address: '80 Harris Street, Pyrmont NSW 2009',        visit_time: '上午 10:00', price_per_visit: 80,  notes: null,                  status: 'active' },
      { id: 'c3000004-0000-0000-0000-000000000004', owner_id: O2, cat_id: C3, address: '50 Pitt Street, Sydney NSW 2000',           visit_time: '下午 6:00',  price_per_visit: 80,  notes: '出差一周',             status: 'completed' },
      { id: 'c3000005-0000-0000-0000-000000000005', owner_id: O3, cat_id: C5, address: '200 Pacific Highway, Crows Nest NSW 2065',  visit_time: '上午 11:00', price_per_visit: 90,  notes: '可可很活跃，记得关好门', status: 'completed' },
      { id: 'c3000006-0000-0000-0000-000000000006', owner_id: O1, cat_id: C1, address: '100 George Street, Sydney NSW 2000',        visit_time: '下午 5:00',  price_per_visit: 80,  notes: '橘子喜欢找人玩',         status: 'completed' },
      { id: 'c3000007-0000-0000-0000-000000000007', owner_id: O6, cat_id: C10,address: '5 Crown Street, Surry Hills NSW 2010',      visit_time: '上午 9:30',  price_per_visit: 80,  notes: '糯米害羞，进门动作要轻', status: 'completed' },
      { id: 'c3000008-0000-0000-0000-000000000008', owner_id: O7, cat_id: C11,address: '22 Campbell Parade, Bondi Beach NSW 2026',  visit_time: '下午 4:00',  price_per_visit: 90,  notes: '花花喜欢玩球',           status: 'completed' },
    ];
    const { error: e4 } = await db.from('home_visits').upsert(homeVisits, { onConflict: 'id', ignoreDuplicates: true });
    if (e4) throw e4;

    // ── 上门喂养日期（57笔，横跨 1-3 月）────────────────────────────
    await db.from('home_visit_dates').delete().in('home_visit_id', DEMO_VISIT_IDS);
    const vd = (vid, dates) => dates.map(d => ({ home_visit_id: vid, visit_date: d }));
    const visitDates = [
      // c3000001 王小明家（雪球）— 3月上旬 7笔
      ...vd('c3000001-0000-0000-0000-000000000001',
        ['2026-03-06','2026-03-07','2026-03-08','2026-03-09','2026-03-10','2026-03-13','2026-03-14']),
      // c3000002 张雅婷家（奶茶）— 3月上旬 8笔
      ...vd('c3000002-0000-0000-0000-000000000002',
        ['2026-03-05','2026-03-06','2026-03-07','2026-03-08','2026-03-09','2026-03-10','2026-03-12','2026-03-13']),
      // c3000003 林宏达家（芝麻）— 3月中旬 5笔
      ...vd('c3000003-0000-0000-0000-000000000003',
        ['2026-03-10','2026-03-11','2026-03-12','2026-03-13','2026-03-14']),
      // c3000004 李美华家（小黑）— 2月 7笔
      ...vd('c3000004-0000-0000-0000-000000000004',
        ['2026-02-10','2026-02-11','2026-02-12','2026-02-13','2026-02-14','2026-02-15','2026-02-16']),
      // c3000005 陈建志家（可可）— 1月+2月 12笔
      ...vd('c3000005-0000-0000-0000-000000000005',
        ['2026-01-10','2026-01-11','2026-01-12','2026-01-15','2026-01-16','2026-01-17',
         '2026-02-18','2026-02-19','2026-02-20','2026-02-23','2026-02-24','2026-02-25']),
      // c3000006 王小明家（橘子）— 1月 9笔
      ...vd('c3000006-0000-0000-0000-000000000006',
        ['2026-01-20','2026-01-21','2026-01-22','2026-01-23','2026-01-24',
         '2026-01-25','2026-01-27','2026-01-28','2026-01-29']),
      // c3000007 郭美玲家（糯米）— 2月 10笔
      ...vd('c3000007-0000-0000-0000-000000000007',
        ['2026-02-02','2026-02-03','2026-02-04','2026-02-05','2026-02-06',
         '2026-02-09','2026-02-10','2026-02-11','2026-02-12','2026-02-13']),
      // c3000008 赵天宇家（花花）— 1月+2月 9笔（截至今日前）
      ...vd('c3000008-0000-0000-0000-000000000008',
        ['2026-01-05','2026-01-06','2026-01-07','2026-01-08',
         '2026-02-22','2026-02-23','2026-02-24','2026-02-25','2026-02-26']),
    ];
    const { error: e5 } = await db.from('home_visit_dates').insert(visitDates);
    if (e5) throw e5;

    showToast(`演示数据载入成功！52笔寄养、${visitDates.length}笔上门日期`, 'success');
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
