import { state } from './state.js';
import { getToday, formatCurrency, daysBetween } from './utils.js';

export function getTodaysBoardings() {
  const today = getToday();
  return state.boardings.filter(b =>
    b.status === 'active' &&
    b.check_in_date <= today &&
    b.check_out_date > today
  );
}

function getPeriods() {
  const today = getToday();
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const tomorrow    = new Date(y, m, now.getDate() + 1).toLocaleDateString('en-CA');
  const monthStart  = new Date(y, m, 1).toLocaleDateString('en-CA');
  const monthEnd    = new Date(y, m + 1, 1).toLocaleDateString('en-CA');
  const yearStart   = `${y}-01-01`;
  const yearEnd     = `${y + 1}-01-01`;
  return { today, tomorrow, monthStart, monthEnd, yearStart, yearEnd };
}

function getBoardingIncome(startStr, endStr) {
  return state.boardings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => {
      const s = b.check_in_date > startStr ? b.check_in_date : startStr;
      const e = b.check_out_date < endStr   ? b.check_out_date : endStr;
      return s < e ? sum + daysBetween(s, e) * parseFloat(b.daily_rate || 0) : sum;
    }, 0);
}

function getVisitIncome(startStr, endStr) {
  return state.homeVisitDates
    .filter(vd => vd.visit_date >= startStr && vd.visit_date < endStr)
    .reduce((sum, vd) => {
      const visit = state.homeVisits.find(v => v.id === vd.home_visit_id);
      return sum + (visit ? parseFloat(visit.price_per_visit || 0) : 0);
    }, 0);
}

export function updateBoardingStats() {
  const { today, tomorrow, monthStart, monthEnd, yearStart, yearEnd } = getPeriods();
  document.getElementById('today-cats-count').textContent   = getTodaysBoardings().length + ' 只';
  document.getElementById('today-boarding-income').textContent = formatCurrency(getBoardingIncome(today, tomorrow));
  document.getElementById('month-boarding-income').textContent = formatCurrency(getBoardingIncome(monthStart, monthEnd));
  document.getElementById('year-boarding-income').textContent  = formatCurrency(getBoardingIncome(yearStart, yearEnd));
}

export function updateHomeVisitStats() {
  const { today, tomorrow, monthStart, monthEnd, yearStart, yearEnd } = getPeriods();
  const todayCount = state.homeVisitDates.filter(vd => vd.visit_date === today).length;
  document.getElementById('today-visits-count').textContent  = todayCount + ' 次';
  document.getElementById('today-visit-income').textContent  = formatCurrency(getVisitIncome(today, tomorrow));
  document.getElementById('month-visit-income').textContent  = formatCurrency(getVisitIncome(monthStart, monthEnd));
  document.getElementById('year-visit-income').textContent   = formatCurrency(getVisitIncome(yearStart, yearEnd));
}
