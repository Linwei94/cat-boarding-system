import { db } from './config.js';
import { showToast } from './ui.js';
import { getToday, formatDateCN } from './utils.js';

export function showLogin() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

export function showApp() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  const d = formatDateCN(getToday());
  document.getElementById('today-date').textContent = d;
  document.getElementById('today-date-visit').textContent = d;
}

export function initAuth(onSignedIn) {
  db.auth.getSession().then(({ data: { session } }) => {
    if (session) { showApp(); onSignedIn(); }
    else showLogin();
  });

  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') { showApp(); onSignedIn(); }
    else if (event === 'SIGNED_OUT') showLogin();
  });

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    errorEl.className = 'error-msg';
    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = '登录中…';

    const { error } = await db.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;
    submitBtn.textContent = '登录';

    if (error) {
      const msg = error.message === 'Invalid login credentials'
        ? '邮箱或密码错误，请检查后重试'
        : error.message === 'Email not confirmed'
        ? '请先验证邮箱后再登录'
        : ('登录失败：' + error.message);
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      // 轻震动提示
      document.getElementById('login-form').classList.add('shake');
      setTimeout(() => document.getElementById('login-form').classList.remove('shake'), 500);
    }
  });

  // Register button
  document.getElementById('register-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.className = 'error-msg';
    if (!email || !password) { errorEl.textContent = '请填写邮箱和密码'; return; }
    if (password.length < 6) { errorEl.textContent = '密码至少需要 6 位'; return; }
    const { error } = await db.auth.signUp({ email, password });
    if (error) {
      errorEl.textContent = '注册失败：' + error.message;
    } else {
      errorEl.className = 'error-msg success';
      errorEl.textContent = '注册成功！若需要邮箱验证，请查收邮件后再登录。';
    }
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => db.auth.signOut());
}
