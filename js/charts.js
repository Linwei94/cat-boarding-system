import { state } from './state.js';
import { daysBetween } from './utils.js';
import { showModal } from './ui.js';

let chartInstance = null;

function getBoardingIncomeForRange(startStr, endStr) {
  return state.boardings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => {
      const s = b.check_in_date > startStr ? b.check_in_date : startStr;
      const e = b.check_out_date < endStr   ? b.check_out_date : endStr;
      return s < e ? sum + daysBetween(s, e) * parseFloat(b.daily_rate || 0) : sum;
    }, 0);
}

function getVisitIncomeForRange(startStr, endStr) {
  return state.homeVisitDates
    .filter(vd => vd.visit_date >= startStr && vd.visit_date < endStr)
    .reduce((sum, vd) => {
      const visit = state.homeVisits.find(v => v.id === vd.home_visit_id);
      return sum + (visit ? parseFloat(visit.price_per_visit || 0) : 0);
    }, 0);
}

export function openMonthChart() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

  const labels = [], boardingData = [], visitData = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const startStr = new Date(y, m, d).toLocaleDateString('en-CA');
    const endStr   = new Date(y, m, d + 1).toLocaleDateString('en-CA');
    labels.push(`${d}日`);
    boardingData.push(getBoardingIncomeForRange(startStr, endStr));
    visitData.push(getVisitIncomeForRange(startStr, endStr));
  }

  document.getElementById('chart-modal-title').textContent = `${y}年${monthNames[m]} — 每日收入`;
  renderChart(labels, boardingData, visitData);
  showModal('income-chart-modal');
}

export function openYearChart() {
  const now = new Date();
  const y = now.getFullYear();
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const labels = [], boardingData = [], visitData = [];
  for (let m = 0; m < 12; m++) {
    const startStr = new Date(y, m, 1).toLocaleDateString('en-CA');
    const endStr   = new Date(y, m + 1, 1).toLocaleDateString('en-CA');
    labels.push(monthNames[m]);
    boardingData.push(getBoardingIncomeForRange(startStr, endStr));
    visitData.push(getVisitIncomeForRange(startStr, endStr));
  }

  document.getElementById('chart-modal-title').textContent = `${y}年 — 每月收入总览`;
  renderChart(labels, boardingData, visitData);
  showModal('income-chart-modal');
}

function renderChart(labels, boardingData, visitData) {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  const ctx = document.getElementById('income-chart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '🏠 寄养收入',
          data: boardingData,
          backgroundColor: 'rgba(102, 126, 234, 0.82)',
          borderRadius: 5,
        },
        {
          label: '🚗 上门收入',
          data: visitData,
          backgroundColor: 'rgba(72, 199, 162, 0.82)',
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: A$${ctx.parsed.y.toFixed(2)}`,
            footer: items => {
              const total = items.reduce((s, i) => s + i.parsed.y, 0);
              return `合计: A$${total.toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: {
          stacked: true,
          ticks: { callback: v => `A$${v}` },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
    },
  });
}
