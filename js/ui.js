export function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('app').style.overflow = 'hidden';
}

export function hideModal(id) {
  document.getElementById(id).classList.add('hidden');
  // restore scroll only if no other modal is open
  const anyOpen = document.querySelectorAll('.modal:not(.hidden)').length > 0;
  if (!anyOpen) document.getElementById('app').style.overflow = '';
}

export function showLoading(show) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

let toastTimer;
export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function updatePillPosition(activeBtn) {
  const pill = document.querySelector('.bottom-nav-pill');
  if (!pill) return;
  const btns = [...pill.querySelectorAll('.tab-btn')];
  const idx = btns.indexOf(activeBtn);
  if (idx >= 0) pill.style.setProperty('--pill-index', idx);
}

export function initPullToRefresh(onRefresh) {
  const el = document.getElementById('app');
  if (!el) return;

  let startY = 0;
  let pulling = false;
  let indicator = null;

  function getIndicator() {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'ptr-indicator';
      indicator.innerHTML = '<div class="ptr-spinner"></div>';
      document.body.appendChild(indicator);
    }
    return indicator;
  }

  el.addEventListener('touchstart', e => {
    if (el.scrollTop === 0 && !document.querySelector('.modal:not(.hidden)')) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });

  el.addEventListener('touchmove', e => {
    if (!pulling) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      const progress = Math.min(dy / 80, 1);
      const ind = getIndicator();
      ind.style.opacity = progress;
      ind.style.transform = `translateX(-50%) translateY(${Math.min(dy * 0.4, 32)}px)`;
      ind.classList.toggle('ptr-ready', progress >= 1);
    }
  }, { passive: true });

  el.addEventListener('touchend', async e => {
    if (!pulling) return;
    pulling = false;
    const dy = e.changedTouches[0].clientY - startY;
    const ind = getIndicator();
    if (dy >= 80) {
      ind.classList.add('ptr-loading');
      ind.style.opacity = 1;
      ind.style.transform = 'translateX(-50%) translateY(20px)';
      try { await onRefresh(); } catch (_) {}
    }
    ind.style.opacity = 0;
    ind.style.transform = 'translateX(-50%) translateY(-40px)';
    ind.classList.remove('ptr-ready', 'ptr-loading');
  });
}

export function initTabs() {
  const bottomBtns = document.querySelectorAll('.bottom-nav .tab-btn');
  bottomBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
      updatePillPosition(btn);
    });
  });
  // Also sync desktop tabs
  document.querySelectorAll('.desktop-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
      // sync bottom nav pill
      const matching = document.querySelector(`.bottom-nav .tab-btn[data-tab="${btn.dataset.tab}"]`);
      if (matching) updatePillPosition(matching);
    });
  });
  // Set initial pill position
  const activeBottomBtn = document.querySelector('.bottom-nav .tab-btn.active');
  if (activeBottomBtn) updatePillPosition(activeBottomBtn);
}
