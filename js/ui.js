export function showModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('hidden');
  // Reset any leftover transform from previous dismiss gesture
  const content = modal.querySelector('.modal-content');
  if (content) {
    content.style.transition = '';
    content.style.transform = '';
    content.style.opacity = '';
  }
  document.getElementById('app').style.overflow = 'hidden';
}

export function hideModal(id) {
  const modal = document.getElementById(id);
  const content = modal.querySelector('.modal-content');
  const overlay = modal.querySelector('.modal-overlay');
  if (content) {
    content.style.transition = 'transform 0.26s cubic-bezier(0.4,0,1,1), opacity 0.18s';
    content.style.transform = 'translateY(110%)';
    content.style.opacity = '0';
    if (overlay) {
      overlay.style.transition = 'opacity 0.22s ease';
      overlay.style.opacity = '0';
    }
    setTimeout(() => {
      modal.classList.add('hidden');
      content.style.transition = '';
      content.style.transform = '';
      content.style.opacity = '';
      if (overlay) { overlay.style.transition = ''; overlay.style.opacity = ''; }
      const anyOpen = document.querySelectorAll('.modal:not(.hidden)').length > 0;
      if (!anyOpen) document.getElementById('app').style.overflow = '';
    }, 260);
  } else {
    modal.classList.add('hidden');
    const anyOpen = document.querySelectorAll('.modal:not(.hidden)').length > 0;
    if (!anyOpen) document.getElementById('app').style.overflow = '';
  }
}

// iOS-style swipe-down-to-dismiss for modal sheets
export function initSheetDismiss() {
  document.querySelectorAll('.modal').forEach(modal => {
    const content = modal.querySelector('.modal-content');
    if (!content) return;

    let startY = 0, startScrollTop = 0, dragging = false;

    content.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
      startScrollTop = content.scrollTop;
      dragging = false;
    }, { passive: true });

    content.addEventListener('touchmove', e => {
      const dy = e.touches[0].clientY - startY;
      // Only dismiss-drag when at top of scroll AND pulling down
      if (dy > 0 && content.scrollTop <= 0) {
        dragging = true;
        const resistance = dy > 60 ? 60 + (dy - 60) * 0.3 : dy;
        content.style.transition = 'none';
        content.style.transform = `translateY(${resistance}px)`;
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) overlay.style.opacity = Math.max(0, 1 - resistance / 120);
      }
    }, { passive: true });

    content.addEventListener('touchend', e => {
      if (!dragging) return;
      dragging = false;
      const dy = e.changedTouches[0].clientY - startY;
      const threshold = window.innerHeight * 0.22;
      if (dy > threshold) {
        hideModal(modal.id);
      } else {
        // Spring back
        content.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        content.style.transform = '';
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) overlay.style.transition = 'opacity 0.3s';
        if (overlay) overlay.style.opacity = '';
      }
    }, { passive: true });
  });
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

  const THRESHOLD = 80;
  let startY = 0, pulling = false, refreshing = false;

  // Build indicator
  const ind = document.createElement('div');
  ind.id = 'ptr-indicator';
  ind.innerHTML = `
    <div class="ptr-track">
      <div class="ptr-bubble"><span class="ptr-cat">🐱</span></div>
      <div class="ptr-label">下拉刷新</div>
    </div>`;
  document.body.appendChild(ind);

  const bubble = ind.querySelector('.ptr-bubble');
  const label  = ind.querySelector('.ptr-label');

  el.addEventListener('touchstart', e => {
    if (refreshing || el.scrollTop > 0 || document.querySelector('.modal:not(.hidden)')) return;
    startY = e.touches[0].clientY;
    pulling = true;
    ind.style.transition = '';
  }, { passive: true });

  el.addEventListener('touchmove', e => {
    if (!pulling) return;
    const dy = Math.max(0, e.touches[0].clientY - startY);
    if (dy === 0) return;
    const pull = dy < THRESHOLD ? dy : THRESHOLD + (dy - THRESHOLD) * 0.25;
    const progress = Math.min(pull / THRESHOLD, 1);

    ind.style.opacity = Math.min(progress * 2, 1);
    ind.style.transform = `translateX(-50%) translateY(${-56 + pull * 0.75}px)`;

    const scale = 0.5 + progress * 0.6;
    bubble.style.transform = `scale(${scale}) rotate(${progress * 20}deg)`;
    if (progress >= 1) {
      label.textContent = '松手刷新 ✨';
      ind.classList.add('ptr-ready');
    } else {
      label.textContent = '下拉刷新';
      ind.classList.remove('ptr-ready');
    }
  }, { passive: true });

  el.addEventListener('touchend', async e => {
    if (!pulling) return;
    pulling = false;
    const dy = Math.max(0, e.changedTouches[0].clientY - startY);

    if (dy >= THRESHOLD) {
      refreshing = true;
      ind.classList.add('ptr-loading');
      ind.classList.remove('ptr-ready');
      // Spring into position
      ind.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
      ind.style.transform = 'translateX(-50%) translateY(20px)';
      ind.style.opacity = '1';
      bubble.style.transform = 'scale(1) rotate(0deg)';
      label.textContent = '刷新中…';

      try { await onRefresh(); } catch (_) {}

      // Bounce out on complete
      ind.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s 0.15s';
      ind.style.transform = 'translateX(-50%) translateY(-60px) scale(1.3)';
      ind.style.opacity = '0';
      setTimeout(() => {
        ind.style.transition = '';
        ind.classList.remove('ptr-loading');
        bubble.style.transform = '';
        refreshing = false;
      }, 600);
    } else {
      ind.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s';
      ind.style.opacity = '0';
      ind.style.transform = 'translateX(-50%) translateY(-56px)';
      bubble.style.transform = '';
      setTimeout(() => { ind.style.transition = ''; ind.classList.remove('ptr-ready'); }, 400);
    }
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
