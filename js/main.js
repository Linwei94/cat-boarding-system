// ================================================================
// 喵喵寄养管理系统 - 主入口
// ================================================================
import { loadAllData } from './api.js';
import { initAuth } from './auth.js';
import { initTabs, initPullToRefresh, showLoading, showToast, hideModal } from './ui.js';
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
         onVisitOwnerChange, initHomeVisitForm } from './homevisit.js';

import { loadDemoData, clearDemoData } from './demo.js';
import { openTodayChart, openMonthChart, openYearChart } from './charts.js';

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
  openAddHomeVisit, openEditHomeVisit, deleteHomeVisit, onVisitOwnerChange,
  // 弹窗
  hideModal,
  // 演示数据
  loadDemoData, clearDemoData,
  // 图表
  openTodayChart, openMonthChart, openYearChart,
  // 供 render.js 内部调用
  __renderModule: { renderBoardingsTable },
});

// ── 启动 ─────────────────────────────────────────────────────────
initTabs();
initBoardingForm();
initOwnerForm();
initCatForm();
initRoomTypeForm();
initHomeVisitForm();

async function refresh() {
  showLoading(true);
  try {
    await loadAllData();
    renderAll();
    showToast('已刷新 ✓', 'success');
  } catch (err) {
    console.error(err);
    showToast('刷新失败，请重试', 'error');
  }
  showLoading(false);
}

initAuth(async () => {
  await refresh().catch(() => {});
  initPullToRefresh(refresh);
});
