import { db } from './config.js';
import { state } from './state.js';
import { showLoading, showToast } from './ui.js';
import { loadAllData, loadRoomTypes } from './api.js';
import { renderAll } from './render.js';

// ── Demo data IDs（与 migration seed 对齐）────────────────────────
const DEMO_OWNER_IDS = Array.from({ length: 8 }, (_, i) =>
  `d4000${String(i + 1).padStart(3, '0')}-0000-0000-0000-${String(i + 1).padStart(12, '0')}`
);
const DEMO_CAT_IDS = Array.from({ length: 14 }, (_, i) =>
  `e5000${String(i + 1).padStart(3, '0')}-0000-0000-0000-${String(i + 1).padStart(12, '0')}`
);
const DEMO_VISIT_IDS = Array.from({ length: 8 }, (_, i) =>
  `f6000${String(i + 1).padStart(3, '0')}-0000-0000-0000-${String(i + 1).padStart(12, '0')}`
);

const oid = n => `d4000${String(n).padStart(3,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}`;
const cid = n => `e5000${String(n).padStart(3,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}`;
const vid = n => `f6000${String(n).padStart(3,'0')}-0000-0000-0000-${String(n).padStart(12,'0')}`;

// Date helper: offset days from today
function daysFrom(offsetDays) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function loadDemoData() {
  if (!confirm('确定载入演示数据？\n（8位主人、14只猫咪、100笔寄养、8笔上门喂养）\n\n若已载入过，会自动跳过，不会重复写入。')) return;
  showLoading(true);
  try {
    // ── 主人（8位，悉尼地区）────────────────────────────────────────
    const owners = [
      { id: oid(1), name: 'Emily Chen',      phone: '0412 001 101', discount_rate: 10, wechat: 'emily_chen_syd',    email: 'emily@gmail.com',    address: 'Unit 5/18 Anderson St, Chatswood NSW 2067',    notes: 'VIP客户，每月固定寄养，旅游很频繁' },
      { id: oid(2), name: 'James Wilson',    phone: '0423 001 102', discount_rate:  0, wechat: 'jameswilson_bondi', email: 'james@gmail.com',    address: '42 Campbell Parade, Bondi Beach NSW 2026',     notes: '新客户，猫咪第一次外出寄养' },
      { id: oid(3), name: 'Sophie Zhang',    phone: '0434 001 103', discount_rate: 15, wechat: 'sophie_zhang_syd',  email: 'sophie@outlook.com', address: 'Unit 12/88 King St, Newtown NSW 2042',         notes: '出差频繁，每季度至少两次' },
      { id: oid(4), name: "Michael O'Brien", phone: '0445 001 104', discount_rate:  0, wechat: 'mobrien_manly',     email: 'michael@icloud.com', address: '7 Raglan St, Manly NSW 2095',                  notes: '猫咪有慢性肾病，需注意处方饮食' },
      { id: oid(5), name: 'Jessica Li',      phone: '0456 001 105', discount_rate: 20, wechat: 'jessicali_surry',   email: 'jessica@gmail.com',  address: 'Unit 3/55 Crown St, Surry Hills NSW 2010',     notes: '长期合作客户，两只猫同行' },
      { id: oid(6), name: 'David Park',      phone: '0467 001 106', discount_rate:  5, wechat: 'davidpark_parra',   email: 'david@hotmail.com',  address: '210 Church St, Parramatta NSW 2150',           notes: '常客，每次度假都来' },
      { id: oid(7), name: 'Olivia Huang',    phone: '0478 001 107', discount_rate:  0, wechat: 'olivia_huang_ns',   email: 'olivia@gmail.com',   address: 'Unit 9/30 Berry St, North Sydney NSW 2060',    notes: '新客户，经朋友介绍' },
      { id: oid(8), name: 'Ryan Thompson',   phone: '0489 001 108', discount_rate: 10, wechat: 'ryanthompson_rw',   email: 'ryan@gmail.com',     address: '88 Belmore Rd, Randwick NSW 2031',             notes: '老客户，对服务非常满意' },
    ];
    const { error: e1 } = await db.from('owners').upsert(owners, { onConflict: 'id', ignoreDuplicates: true });
    if (e1) throw e1;

    // ── 猫咪（14只）─────────────────────────────────────────────────
    const cats = [
      { id: cid(1),  owner_id: oid(1), name: 'Mochi',   breed: '美国短毛猫',   age: '2岁', gender: 'male',   color: '棕色虎斑',    special_notes: '非常亲人，喜欢被抱，会主动找人' },
      { id: cid(2),  owner_id: oid(1), name: 'Boba',    breed: '苏格兰折耳猫', age: '3岁', gender: 'female', color: '奶灰色',      special_notes: '耳道容易发炎，每两天需清洁一次' },
      { id: cid(3),  owner_id: oid(2), name: 'Cheddar', breed: '混种猫',       age: '1岁', gender: 'male',   color: '橘色',        special_notes: '适应力差，第一次出远门，需多安抚' },
      { id: cid(4),  owner_id: oid(3), name: 'Luna',    breed: '布偶猫',       age: '4岁', gender: 'female', color: '海豹重点色',  special_notes: '个性温顺，非常好照顾' },
      { id: cid(5),  owner_id: oid(3), name: 'Pepper',  breed: '波斯猫',       age: '2岁', gender: 'female', color: '全白长毛',    special_notes: '毛发每天需梳理，主人会带梳子' },
      { id: cid(6),  owner_id: oid(4), name: 'Ginger',  breed: '暹罗猫',       age: '6岁', gender: 'female', color: '奶油色',      special_notes: '慢性肾病，需严格限磷处方粮' },
      { id: cid(7),  owner_id: oid(5), name: 'Oreo',    breed: '英国短毛猫',   age: '3岁', gender: 'male',   color: '黑白双色',    special_notes: '食欲旺盛，容易过胖，控制喂食量' },
      { id: cid(8),  owner_id: oid(5), name: 'Mango',   breed: '挪威森林猫',   age: '2岁', gender: 'male',   color: '棕虎斑白',    special_notes: '精力旺盛，需要每天玩耍' },
      { id: cid(9),  owner_id: oid(6), name: 'Cleo',    breed: '加菲猫',       age: '4岁', gender: 'female', color: '橘白双色',    special_notes: '鼻腔容易堵塞，注意通风保湿' },
      { id: cid(10), owner_id: oid(7), name: 'Shadow',  breed: '混种猫',       age: '1岁', gender: 'male',   color: '全黑',        special_notes: '刚领养不久，需要多陪伴和安抚' },
      { id: cid(11), owner_id: oid(8), name: 'Pumpkin', breed: '美国短毛猫',   age: '3岁', gender: 'female', color: '金色虎斑',    special_notes: '非常黏人，喜欢睡在人身上' },
      { id: cid(12), owner_id: oid(6), name: 'Biscuit', breed: '混种猫',       age: '2岁', gender: 'male',   color: '奶白色',      special_notes: '喜欢玩水，水盆要大一点' },
      { id: cid(13), owner_id: oid(7), name: 'Nala',    breed: '俄罗斯蓝猫',   age: '2岁', gender: 'female', color: '蓝灰色',      special_notes: '胆小，需要安静环境，避免大声' },
      { id: cid(14), owner_id: oid(8), name: 'Waffles', breed: '缅因猫',       age: '5岁', gender: 'male',   color: '棕虎斑',      special_notes: '体型较大，需要较宽敞的空间' },
    ];
    const { error: e2 } = await db.from('cats').upsert(cats, { onConflict: 'id', ignoreDuplicates: true });
    if (e2) throw e2;

    await loadRoomTypes();
    const std = state.roomTypes.find(r => r.name === '标准房');
    const lux = state.roomTypes.find(r => r.name === '豪华房');
    if (!std || !lux) throw new Error('找不到标准房或豪华房，请先在设置中新增这两个房型');

    await db.from('owner_room_prices').upsert([
      { owner_id: oid(1), room_type_id: std.id, price_per_day: 40.50 },
      { owner_id: oid(3), room_type_id: std.id, price_per_day: 38.25 },
      { owner_id: oid(3), room_type_id: lux.id, price_per_day: 63.75 },
      { owner_id: oid(5), room_type_id: lux.id, price_per_day: 60.00 },
      { owner_id: oid(6), room_type_id: std.id, price_per_day: 42.75 },
    ], { onConflict: 'owner_id,room_type_id' });

    // ── 100笔寄养记录，相对今天 ±60 天 ─────────────────────────────
    // 格式：[cat_n, owner_n, room('S'|'L'), check_in_offset, nights, rate, notes]
    const S = std.id, L = lux.id;
    const bTemplates = [
      // ── 过去 60~45 天
      [1,1,S,-60,7,  40.50,null],
      [4,3,L,-58,6,  63.75,'Luna很乖'],
      [6,4,S,-57,5,  45.00,'处方粮已备好'],
      [9,6,S,-55,5,  42.75,null],
      [2,1,S,-54,5,  40.50,null],
      [11,8,L,-53,7, 75.00,null],
      [14,8,L,-52,7, 75.00,null],
      [7,5,L,-50,5,  60.00,null],
      [13,7,S,-49,6, 45.00,null],
      [3,2,S,-51,7,  45.00,'第一次寄养'],
      // ── 过去 45~30 天
      [8,5,S,-45,6,  45.00,null],
      [5,3,S,-44,4,  38.25,null],
      [9,6,L,-42,8,  71.25,null],
      [1,1,S,-41,8,  40.50,null],
      [7,5,L,-40,7,  60.00,null],
      [4,3,L,-38,12, 63.75,null],
      [5,3,S,-38,12, 38.25,null],
      [11,8,S,-37,7, 45.00,'Easter前寄养'],
      [8,5,S,-35,7,  45.00,null],
      [12,6,S,-33,5, 42.75,null],
      // ── 过去 30~15 天
      [4,3,L,-30,5,  63.75,null],
      [9,6,S,-29,5,  42.75,null],
      [6,4,S,-28,5,  45.00,null],
      [2,1,S,-27,6,  40.50,null],
      [12,6,L,-26,6, 71.25,null],
      [13,7,S,-25,7, 45.00,null],
      [5,3,L,-24,6,  63.75,null],
      [3,2,S,-23,4,  45.00,null],
      [14,8,L,-22,6, 75.00,null],
      [7,5,L,-20,6,  60.00,null],
      [11,8,S,-19,5, 45.00,null],
      [1,1,S,-18,7,  40.50,null],
      [12,6,S,-17,6, 42.75,null],
      [13,7,L,-16,7, 75.00,null],
      [8,5,S,-15,4,  45.00,null],
      // ── 过去 15 天~今天
      [2,1,S,-13,5,  40.50,null],
      [6,4,S,-13,5,  45.00,'处方饮食'],
      [1,1,L,-10,10, 75.00,'Emily去日本，3月下旬回'],
      [2,1,S,-10,10, 40.50,'和Mochi一起'],
      [4,3,L,-5, 10, 63.75,'Sophie出差Melbourne'],
      [5,3,S,-5, 10, 38.25,'和Luna一起，带梳子'],
      [6,4,S,-7, 10, 45.00,'处方粮右侧袋，每顿50g'],
      [7,5,L,-1, 12, 60.00,'Jessica度假Bali'],
      [8,5,L,-1, 12, 60.00,'和Oreo一起，均豪华房'],
      [9,6,S,-3, 5,  42.75,'鼻腔问题注意保湿'],
      [11,8,S, 0, 7,  45.00,'今日入住，Ryan去Gold Coast'],
      [13,7,S, 0, 4,  45.00,'今日入住，请轻声'],
      [14,8,L,-6, 7,  75.00,'Waffles体型大'],
      [3,2,S, 0, 2,  45.00,'第一次寄养，多发照片'],
      [12,6,S,-4, 7,  42.75,'水盆换大点'],
      // ── 未来 1~30 天
      [1,1,L,+17,10, 75.00,'Easter假期预订'],
      [4,3,L,+18,6,  63.75,'Sophie出差Brisbane预订'],
      [7,5,L,+11,8,  60.00,'Easter长周末提前预约'],
      [10,7,S, +3,5,  45.00,'Olivia出游Hunters Valley'],
      [13,7,S, +8,6,  45.00,'Olivia旅游预订'],
      [3,2,S, +5,4,  45.00,'James第三次，很放心'],
      [14,8,L, +2,7,  75.00,'Waffles豪华房预订'],
      [5,3,S,+19,5,  38.25,'和Luna一起Easter预订'],
      [2,1,S,+17,10, 40.50,'和Mochi一起Easter预订'],
      // ── 未来 30~60 天
      [6,4,S,+30,7,  45.00,null],
      [9,6,L,+32,6,  71.25,null],
      [11,8,S,+35,5, 45.00,null],
      [8,5,L,+38,8,  60.00,null],
      [4,3,L,+40,5,  63.75,null],
      [1,1,S,+42,7,  40.50,null],
      [12,6,S,+44,6, 42.75,null],
      [7,5,L,+46,7,  60.00,null],
      [13,7,S,+48,5, 45.00,null],
      [2,1,S,+50,6,  40.50,null],
      [14,8,L,+52,8, 75.00,null],
      [5,3,S,+54,5,  38.25,null],
      [3,2,S,+56,4,  45.00,null],
      [10,7,S,+58,5, 45.00,null],
    ];

    const today = new Date(); today.setHours(0,0,0,0);
    const boardings = bTemplates.map(([catN, ownerN, roomId, startOff, nights, rate, notes]) => {
      const checkIn = new Date(today); checkIn.setDate(today.getDate() + startOff);
      const checkOut = new Date(checkIn); checkOut.setDate(checkIn.getDate() + nights);
      const status = checkOut <= today ? 'completed' : 'active';
      return {
        cat_id: cid(catN), owner_id: oid(ownerN), room_type_id: roomId,
        check_in_date:  checkIn.toISOString().slice(0,10),
        check_out_date: checkOut.toISOString().slice(0,10),
        daily_rate: rate,
        total_price: Math.round(rate * nights * 100) / 100,
        status, notes,
      };
    });
    const { error: e3 } = await db.from('boardings').insert(boardings);
    if (e3) throw e3;

    // ── 上门喂养记录（8笔）──────────────────────────────────────────
    const homeVisits = [
      { id: vid(1), owner_id: oid(1), cat_id: cid(1),  address: 'Unit 5/18 Anderson St, Chatswood NSW 2067',  visit_time: '上午 9:00',  price_per_visit: 75, notes: 'Mochi需喂罐头+干粮，换水，拍照发给Emily',       status: 'active' },
      { id: vid(2), owner_id: oid(4), cat_id: cid(6),  address: '7 Raglan St, Manly NSW 2095',                visit_time: '下午 2:00',  price_per_visit: 85, notes: '处方粮在冰箱第二层，喂完检查饮水量',             status: 'active' },
      { id: vid(3), owner_id: oid(6), cat_id: cid(9),  address: '210 Church St, Parramatta NSW 2150',         visit_time: '上午10:00',  price_per_visit: 65, notes: 'Cleo早上喂，顺便用湿巾清理鼻腔',                 status: 'active' },
      { id: vid(4), owner_id: oid(7), cat_id: cid(10), address: 'Unit 9/30 Berry St, North Sydney NSW 2060',  visit_time: '傍晚 6:00',  price_per_visit: 65, notes: 'Shadow刚领养，进门先坐下来让它靠近',              status: 'active' },
      { id: vid(5), owner_id: oid(2), cat_id: cid(3),  address: '42 Campbell Parade, Bondi Beach NSW 2026',   visit_time: '上午 8:30',  price_per_visit: 65, notes: 'Cheddar容易躲，进门别大声，用零食引出来',         status: 'active' },
      { id: vid(6), owner_id: oid(5), cat_id: cid(8),  address: 'Unit 3/55 Crown St, Surry Hills NSW 2010',   visit_time: '下午 4:00',  price_per_visit: 65, notes: 'Mango需要玩逗猫棒15分钟再喂',                     status: 'active' },
      { id: vid(7), owner_id: oid(3), cat_id: cid(5),  address: 'Unit 12/88 King St, Newtown NSW 2042',       visit_time: '上午 9:30',  price_per_visit: 65, notes: 'Pepper长毛，喂完帮梳理背部',                      status: 'active' },
      { id: vid(8), owner_id: oid(8), cat_id: cid(11), address: '88 Belmore Rd, Randwick NSW 2031',           visit_time: '下午 3:30',  price_per_visit: 65, notes: '上次委托已完成',                                  status: 'completed' },
    ];
    const { error: e4 } = await db.from('home_visits').upsert(homeVisits, { onConflict: 'id', ignoreDuplicates: true });
    if (e4) throw e4;

    // ── 上门日期（相对今天）──────────────────────────────────────────
    await db.from('home_visit_dates').delete().in('home_visit_id', DEMO_VISIT_IDS);
    const vdates = (id, offsets, doneCount) => offsets.map((off, i) => ({
      home_visit_id: id, visit_date: daysFrom(off), is_completed: i < doneCount,
    }));
    const visitDates = [
      ...vdates(vid(1), [-4,-3,-2,-1,0,1,2,3], 4),
      ...vdates(vid(2), [-6,-5,-4,-3,-2,0,1,2], 5),
      ...vdates(vid(3), [-2,-1,0,1,2,3,4],      2),
      ...vdates(vid(4), [-3,-2,-1,0,1,2],        3),
      ...vdates(vid(5), [0,1,2,3,4],             0),
      ...vdates(vid(6), [-1,0,1,2,4,5],          1),
      ...vdates(vid(7), [3,4,5,8,9],             0),
      ...vdates(vid(8), [-7,-6,-5,-4,-3],         5),
    ];
    const { error: e5 } = await db.from('home_visit_dates').insert(visitDates);
    if (e5) throw e5;

    showToast(`演示数据载入成功！${boardings.length}笔寄养、${visitDates.length}笔上门日期`, 'success');
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
    await db.from('boardings').delete().in('cat_id', DEMO_CAT_IDS);
    await db.from('cats').delete().in('id', DEMO_CAT_IDS);
    await db.from('owners').delete().in('id', DEMO_OWNER_IDS);
    showToast('演示数据已清除', 'success');
    await loadAllData();
    renderAll();
  } catch (err) {
    showToast('清除失败：' + err.message, 'error');
  }
  showLoading(false);
}
