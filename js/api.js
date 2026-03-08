import { db } from './config.js';
import { state } from './state.js';

export async function loadOwners() {
  const { data, error } = await db.from('owners').select('*').order('name');
  if (!error && data) state.owners = data;
}

export async function loadCats() {
  const { data, error } = await db.from('cats').select('*').order('name');
  if (!error && data) state.cats = data;
}

export async function loadRoomTypes() {
  const { data, error } = await db.from('room_types').select('*').order('price_per_day');
  if (!error && data) state.roomTypes = data;
}

export async function loadBoardings() {
  const { data, error } = await db.from('boardings')
    .select('*, cat:cats(name), owner:owners(name), room_type:room_types(name, price_per_day)')
    .order('check_in_date', { ascending: false });
  if (!error && data) state.boardings = data;
}

export async function loadHomeVisits() {
  const { data, error } = await db.from('home_visits')
    .select('*, owner:owners(name), cat:cats(name)')
    .order('created_at', { ascending: false });
  if (!error && data) state.homeVisits = data;
}

export async function loadHomeVisitDates() {
  const { data, error } = await db.from('home_visit_dates').select('*').order('visit_date');
  if (!error && data) state.homeVisitDates = data;
}

export async function loadOwnerRoomPrices() {
  const { data, error } = await db.from('owner_room_prices').select('*');
  if (!error && data) state.ownerRoomPrices = data;
}

export async function loadAllData() {
  await Promise.all([
    loadOwners(),
    loadCats(),
    loadRoomTypes(),
    loadBoardings(),
    loadHomeVisits(),
    loadHomeVisitDates(),
    loadOwnerRoomPrices(),
  ]);
}
