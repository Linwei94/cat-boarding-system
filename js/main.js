// ================================================================
// 喵喵寄养管理系统 - 主入口
// ================================================================
import { VERSION } from './version.js';
import { loadAllData } from './api.js';
import { initAuth } from './auth.js';
import { initTabs, initPullToRefresh, initSheetDismiss, showLoading, showToast, hideModal } from './ui.js';
import { renderAll, renderBoardingsTable } from './render.js';

import { openAddBoarding, openEditBoarding, onBoardingOwnerChange,
         calculateBoardingPrice, checkoutBoarding, deleteBoarding,
         filterBoardings, initBoardingForm } from './boarding.js';

import { openAddOwner, openEditOwner, deleteOwner,
         openOwnerDetail, renderOwnerRoomPriceInputs, initOwnerForm } from './owner.js';

import { openAddCat, openEditCat, deleteCat,
         openCatDetail, initCatForm } from './cat.js';

import { openAddRoomType, openEditRoomType, deleteRoomType,
         initRoomTypeForm } from './roomtype.js';

import { openAddHomeVisit, openEditHomeVisit, deleteHomeVisit,
         openHomeVisitDetail, onVisitOwnerChange, initHomeVisitForm } from './homevisit.js';

import { loadDemoData, clearDemoData } from './demo.js';
import { openTodayChart, openMonthChart, openYearChart } from './charts.js';
import { openGenerateLink, copyBookingLink, recopyLink, deleteBookingToken, loadBookingRequests } from './booking.js';

// ── 暴露到 window（供 HTML onclick 调用）────────────────────────
Object.assign(window, {
  // 寄养
  openAddBoarding, openEditBoarding, onBoardingOwnerChange,
  calculateBoardingPrice, checkoutBoarding, deleteBoarding,
  filterBoardings,
  // 主人
  openAddOwner, openEditOwner, deleteOwner, openOwnerDetail,
  // 猫咪
  openAddCat, openEditCat, deleteCat, openCatDetail,
  // 房型
  openAddRoomType, openEditRoomType, deleteRoomType,
  // 上门喂养
  openAddHomeVisit, openEditHomeVisit, deleteHomeVisit, openHomeVisitDetail, onVisitOwnerChange,
  // 弹窗
  hideModal,
  // 演示数据
  loadDemoData, clearDemoData,
  // 预约链接
  openGenerateLink, copyBookingLink, recopyLink, deleteBookingToken,
  // 图表
  openTodayChart, openMonthChart, openYearChart,
  // 供 render.js 内部调用
  __renderModule: { renderBoardingsTable },
});

// ── 版本号注入 ───────────────────────────────────────────────────
document.querySelectorAll('#app-version, #app-version-desktop').forEach(el => { el.textContent = VERSION; });

// ── 启动 ─────────────────────────────────────────────────────────
initTabs();
initBoardingForm();
initOwnerForm();
initCatForm();
initRoomTypeForm();
initHomeVisitForm();

async function loadInitial() {
  showLoading(true);
  try {
    await loadAllData();
    renderAll();
    loadBookingRequests().catch(() => {});
  } catch (err) {
    console.error(err);
    showToast('数据加载失败，请重试', 'error');
  }
  showLoading(false);
}

async function refresh() {
  try {
    await loadAllData();
    renderAll();
    showToast('已刷新 ✓', 'success');
  } catch (err) {
    console.error(err);
    showToast('刷新失败，请重试', 'error');
  }
}

initAuth(async () => {
  await loadInitial();
  initPullToRefresh(refresh);
  initSheetDismiss();
});
