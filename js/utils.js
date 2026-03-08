import { state } from './state.js';

export function getToday() {
  return new Date().toLocaleDateString('en-CA');
}

export function formatDateCN(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

export function formatCurrency(amount) {
  return 'A$' + parseFloat(amount || 0).toFixed(2);
}

export function genderBadge(gender) {
  if (gender === 'male')   return '<span class="gender-badge male">♂ 公</span>';
  if (gender === 'female') return '<span class="gender-badge female">♀ 母</span>';
  return '<span class="gender-badge unknown">— 未知</span>';
}

export function daysBetween(startStr, endStr) {
  const s = new Date(startStr + 'T00:00:00');
  const e = new Date(endStr + 'T00:00:00');
  return Math.max(0, Math.round((e - s) / 86400000));
}

/**
 * 取得主人对指定房型的专属价格。
 * 若未设定则回传房型预设价格。
 */
export function getOwnerRoomPrice(ownerId, roomTypeId) {
  const custom = state.ownerRoomPrices.find(
    p => p.owner_id === ownerId && p.room_type_id === roomTypeId
  );
  if (custom) return parseFloat(custom.price_per_day);
  const rt = state.roomTypes.find(r => r.id === roomTypeId);
  return parseFloat(rt?.price_per_day || 0);
}
