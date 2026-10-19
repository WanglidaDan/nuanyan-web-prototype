(() => {
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const toast = message => {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(element._hideTimer);
  element._hideTimer = setTimeout(() => element.classList.remove('show'), 2600);
};
const api = async (path, options = {}) => {
  let response;
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      headers: options.body ? { 'Content-Type': 'application/json' } : {},
      ...options
    });
  } catch {
    throw new Error('暂时无法连接服务，请稍后重试。');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.detail;
    const message = Array.isArray(detail)
      ? detail.map(item => item.msg).filter(Boolean).join('；')
      : detail;
    const error = new Error(message || '请求失败，请稍后重试。');
    error.status = response.status;
    throw error;
  }
  return payload;
};
const json = value => JSON.stringify(value);
const apiPath = path => '/api/v1' + path;

const hour = new Date().getHours();
const greeting = hour < 11 ? '早上好' : hour < 13 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
let currentUser = null;
let authReady = false;
let mineItems = [];
let mineFilter = 'all';
let lastFocus = null;
let drawerCloseTimer = null;

function setGreeting() {
  $('#greet').textContent = currentUser
    ? greeting + '，' + (currentUser.name || currentUser.username)
    : '欢迎来到暖言小站';
}
function setUser(user) {
  currentUser = user || null;
  const loggedIn = Boolean(currentUser);
  $('#acctBtn').hidden = !loggedIn;
  $('#loginBtn').hidden = loggedIn;
  if (loggedIn) {
    const name = currentUser.name || currentUser.username || '员工';
    $('#acctName').textContent = name;
    $('#menuName').textContent = name;
    $('#acctInitial').textContent = [...name][0] || '员';
  }
  setGreeting();
}
async function refreshUser() {
  try {
    const result = await api(apiPath('/auth/me'));
    setUser(result.user);
  } catch (error) {
    setUser(null);
    if (!String(error.message).includes('请先登录') && !String(error.message).includes('登录已过期')) {
      console.warn('Session check failed:', error.message);
    }
  }
}

const statusLabel = status => ({
  PENDING_ACCEPTANCE: '待受理',
  ACCEPTED: '办理中',
  VERIFYING: '办理中',
  PROCESSING: '办理中',
  WAITING_EMPLOYEE: '待补充',
  WAITING_REVIEW: '待复核',
  REPLIED: '已回复',
  CLOSED: '已结束',
  REJECTED: '已结束',
  REOPENED: '办理中'
}[status] || '处理中');
const statusClass = status => ({
  PENDING_ACCEPTANCE: 'p-wait',
  ACCEPTED: 'p-doing',
  VERIFYING: 'p-doing',
  PROCESSING: 'p-doing',
  WAITING_EMPLOYEE: 'p-wait',
  WAITING_REVIEW: 'p-doing',
  REPLIED: 'p-done',
  CLOSED: 'p-done',
  REJECTED: 'p-done',
  REOPENED: 'p-doing'
}[status] || 'p-wait');
const formatDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '日期未知'
    : new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(date);
};
function normalizeFeedback(row) {
  const description = String(row.description || '');
  const parts = description.split(/\n\s*\n/);
  const hasSeparateTitle = parts.length > 1;
  return {
    id: String(row.public_id || ''),
    topic: String(row.department || ''),
    title: hasSeparateTitle ? parts.shift().trim() : String(row.title || '未命名建议'),
    body: hasSeparateTitle ? parts.join('\n\n').trim() : description,
    status: String(row.status || ''),
    date: formatDate(row.created_at),
    createdAt: row.created_at,
    messages: Array.isArray(row.messages) ? row.messages : []
  };
}
function renderMine() {
  const state = $('#mineState');
  const list = $('#flist');
  const filtered = mineItems.filter(item => mineFilter === 'all' || statusLabel(item.status) === mineFilter);
  if (!mineItems.length) {
    state.hidden = false;
    state.textContent = '还没有提交过建议。';
    list.innerHTML = '<li class="mine-empty"><p>写下你遇到的问题或改进想法，平台会记录处理进度。</p><a class="btn primary sm" href="#/write">写一条建议</a></li>';
    return;
  }
  state.hidden = true;
  if (!filtered.length) {
    list.innerHTML = '<li class="mine-empty"><p>这个状态下还没有建议。</p></li>';
    return;
  }
  list.innerHTML = filtered.map(item => {
    const preview = item.messages.length
      ? item.messages[item.messages.length - 1].content
      : item.body;
    return '<li><button class="fitem" data-id="' + esc(item.id) + '" aria-label="查看详情：' + esc(item.title) + '">' +
      '<div><div class="meta"><span class="mono">' + esc(item.id) + '</span><span>' + esc(item.topic) + '</span><span>' + esc(item.date) + ' 提交</span></div>' +
      '<h3>' + esc(item.title) + '</h3><p class="ex">' + esc(preview) + '</p></div>' +
      '<span class="pill ' + statusClass(item.status) + '">' + esc(statusLabel(item.status)) + '</span>' +
      '<svg class="ic" aria-hidden="true"><use href="#chev"/></svg></button></li>';
  }).join('');
}
async function loadMine() {
  const state = $('#mineState');
  state.hidden = false;
  state.textContent = '正在读取你的反馈…';
  $('#flist').replaceChildren();
  try {
    const result = await api(apiPath('/feedbacks/mine'));
    mineItems = Array.isArray(result) ? result.map(normalizeFeedback) : [];
    renderMine();
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const openId = params.get('open');
    if (openId) {
      const item = mineItems.find(feedback => feedback.id === openId);
      if (item) setTimeout(() => openDrawer(item.id), 120);
    }
  } catch (error) {
    if (error.status === 401) {
      setUser(null);
      sessionStorage.setItem('ny_auth_next', '/mine');
      location.hash = '#/auth?mode=login&next=%2Fmine';
      return;
    }
    state.innerHTML = esc(error.message) + ' <button class="link" id="retryMine" type="button">重新加载</button>';
    $('#retryMine').addEventListener('click', loadMine, { once: true });
  }
}

function openDrawer(id, from) {
  const item = mineItems.find(feedback => feedback.id === id);
  if (!item) return;
  lastFocus = from || document.activeElement;
  const messages = item.messages.map(message =>
    '<li class="' + (message.sender_type === 'ADMIN' ? 'done' : '') + '">' +
    '<span class="n"></span><b>' + (message.sender_type === 'ADMIN' ? '平台回复' : '补充说明') + '</b>' +
    '<time>' + esc(formatDate(message.created_at)) + '</time><p>' + esc(message.content) + '</p></li>'
  ).join('');
  const statusEvents = '<li class="done"><span class="n"></span><b>提交</b><time>' +
    esc(item.date) + '</time><p>建议已提交至平台。</p></li>';
  $('#dId').textContent = item.id;
  $('#dBody').innerHTML =
    '<span class="pill ' + statusClass(item.status) + '">' + esc(statusLabel(item.status)) + '</span>' +
    '<h2 id="dTitle">' + esc(item.title) + '</h2>' +
    '<p class="d-sub">' + esc(item.topic) + ' · ' + esc(item.date) + ' 提交</p>' +
    '<div class="d-q">' + esc(item.body) + '</div>' +
    '<p class="d-sec">当前状态</p><div class="d-empty">' + esc(statusLabel(item.status)) +
    '。状态更新与平台回复会显示在这里。</div>' +
    '<p class="d-sec">提交记录与回复</p><ol class="tl">' + statusEvents +
    (messages || '<li><span class="n"></span><b>等待回复</b><p>平台回复后会显示在这里。</p></li>') + '</ol>';
  $('#scrim').hidden = false;
  $('#drawer').hidden = false;
  document.body.classList.add('modal-open');
  $('#dClose').focus();
}
function closeDrawer() {
  const drawer = $('#drawer');
  const scrim = $('#scrim');
  if (drawer.hidden) return;
  drawer.classList.add('closing');
  scrim.classList.add('closing');
  clearTimeout(drawerCloseTimer);
  drawerCloseTimer = setTimeout(() => {
    drawer.hidden = true;
    scrim.hidden = true;
    drawer.classList.remove('closing');
    scrim.classList.remove('closing');
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  }, 280);
}
$('#dClose').addEventListener('click', closeDrawer);
$('#scrim').addEventListener('click', closeDrawer);
$('#flist').addEventListener('click', event => {
  const button = event.target.closest('.fitem');
  if (button) openDrawer(button.dataset.id, button);
});
$$('.f').forEach(button => button.addEventListener('click', () => {
  $$('.f').forEach(item => {
    const active = item === button;
    item.classList.toggle('on', active);
    item.setAttribute('aria-selected', String(active));
  });
  mineFilter = button.dataset.f;
  renderMine();
}));

const menu = $('#acctMenu');
const accountButton = $('#acctBtn');
function closeMenu() {
  menu.hidden = true;
  accountButton.setAttribute('aria-expanded', 'false');
  $('#logoutConfirm').hidden = true;
}
accountButton.addEventListener('click', event => {
  event.stopPropagation();
  const shouldOpen = menu.hidden;
  closeMenu();
  if (shouldOpen) {
    menu.hidden = false;
    accountButton.setAttribute('aria-expanded', 'true');
    $('.menu-item', menu).focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.acct')) closeMenu();
});
$('#logoutBtn').addEventListener('click', () => {
  $('#logoutConfirm').hidden = false;
  $('#logoutYes').focus();
});
$('#logoutNo').addEventListener('click', () => { $('#logoutConfirm').hidden = true; });
$('#logoutYes').addEventListener('click', async () => {
  try {
    await api(apiPath('/auth/logout'), { method: 'POST' });
  } catch (error) {
    toast(error.message);
    return;
  }
  closeMenu();
  setUser(null);
  mineItems = [];
  location.hash = '#/';
  toast('已退出登录');
});

const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
function closeNavigation() {
  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', '打开菜单');
}
navToggle.addEventListener('click', event => {
  event.stopPropagation();
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
  if (open) $('a', navLinks).focus();
});
navLinks.addEventListener('click', event => {
  if (event.target.closest('a')) closeNavigation();
});
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-in')) closeNavigation();
});

let writeStep = 1;
const draft = { topic: null, department: null };
const bodyInput = $('#body');
const titleInput = $('#ttl');
let bodyTouched = false;
$$('.topic').forEach(topic => topic.addEventListener('click', () => {
  $$('.topic').forEach(item => item.setAttribute('aria-checked', String(item === topic)));
  draft.topic = topic.dataset.t;
  draft.department = topic.dataset.d;
  updateWrite();
}));
$('.topics').addEventListener('keydown', event => {
  const topics = $$('.topic');
  const current = topics.indexOf(document.activeElement);
  if (['ArrowRight', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    topics[(current + 1) % topics.length].focus();
  } else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) {
    event.preventDefault();
    topics[(current - 1 + topics.length) % topics.length].focus();
  }
});
bodyInput.addEventListener('input', () => { bodyTouched = true; updateWrite(); });
bodyInput.addEventListener('blur', () => { bodyTouched = true; updateWrite(); });
titleInput.addEventListener('input', updateWrite);
function validWrite(step) {
  if (step === 1) return Boolean(draft.department);
  if (step === 2) return titleInput.value.trim().length > 0 && bodyInput.value.trim().length >= 10;
  return true;
}
function updateWrite() {
  const length = bodyInput.value.trim().length;
  $('#count').textContent = bodyInput.value.length + '/450';
  const hint = $('#bodyHint');
  hint.className = 'hint' + (length >= 10 ? ' ok' : bodyTouched && length > 0 ? ' warn' : '');
  hint.textContent = length >= 10
    ? '描述清楚了，谢谢'
    : bodyTouched && length > 0
      ? '再写 ' + (10 - length) + ' 个字就可以了'
      : '至少 10 个字';
  $('#nextBtn').disabled = !validWrite(writeStep);
  $('#footMsg').textContent = writeStep === 1 && !draft.department
    ? '请选择承办部门'
    : writeStep === 2 && !titleInput.value.trim()
      ? '还差一个标题'
      : '';
}
function goWriteStep(nextStep, backwards = false) {
  writeStep = nextStep;
  $$('.stage').forEach(stage => {
    const active = Number(stage.dataset.step) === nextStep;
    stage.hidden = !active;
    if (active) {
      stage.classList.remove('back-anim', 'step-in');
      void stage.offsetHeight;
      stage.classList.toggle('back-anim', backwards);
      stage.classList.toggle('step-in', !backwards);
    }
  });
  $$('.steps li[data-s]').forEach(item => {
    const number = Number(item.dataset.s);
    item.classList.toggle('cur', number === nextStep);
    item.classList.toggle('done', number < nextStep);
    if (number === nextStep) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  $$('.steps .bar').forEach((bar, index) => bar.classList.toggle('done', index + 1 < nextStep));
  $('#pfoot').hidden = nextStep === 4;
  $('.save-note').classList.toggle('is-hidden', nextStep === 4);
  $('.write-top .steps').classList.toggle('is-hidden', nextStep === 4);
  $('#prevBtn').classList.toggle('is-hidden', nextStep === 1);
  $('#nextBtn').textContent = nextStep === 3 ? '确认提交' : '下一步';
  if (nextStep === 3) {
    $('#sTopic').textContent = draft.topic;
    $('#sDept').textContent = draft.department;
    $('#sTitle').textContent = titleInput.value.trim();
    $('#sBody').textContent = bodyInput.value.trim();
  }
  updateWrite();
  const heading = $('.stage[data-step="' + nextStep + '"] h1');
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}
async function submitFeedback() {
  const button = $('#nextBtn');
  const footMessage = $('#footMsg');
  const content = titleInput.value.trim() + '\n\n' + bodyInput.value.trim();
  if (!currentUser) {
    sessionStorage.setItem('ny_auth_next', '/write');
    location.hash = '#/auth?mode=login&next=%2Fwrite';
    return;
  }
  button.disabled = true;
  button.textContent = '正在提交…';
  footMessage.textContent = '';
  try {
    const result = await api(apiPath('/feedbacks'), {
      method: 'POST',
      body: json({ department: draft.department, content })
    });
    $('#sid').textContent = result.public_id;
    $('#successMine').href = '#/mine?open=' + encodeURIComponent(result.public_id);
    goWriteStep(4);
  } catch (error) {
    footMessage.textContent = error.message;
  } finally {
    button.textContent = '确认提交';
    updateWrite();
  }
}
$('#nextBtn').addEventListener('click', () => {
  if (!validWrite(writeStep)) return;
  if (writeStep === 3) submitFeedback();
  else goWriteStep(writeStep + 1);
});
$('#prevBtn').addEventListener('click', () => goWriteStep(writeStep - 1, true));
$$('[data-go]').forEach(button => button.addEventListener('click', () => goWriteStep(Number(button.dataset.go), true)));

function authMode() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const mode = ['register', 'reset'].includes(params.get('mode')) ? params.get('mode') : 'login';
  $('#loginForm').hidden = mode !== 'login';
  $('#registerForm').hidden = mode !== 'register';
  $('#resetForm').hidden = mode !== 'reset';
  $('#authTitle').textContent = mode === 'register' ? '创建员工账号' : mode === 'reset' ? '重置密码' : '登录暖言小站';
  $('#authMessage').textContent = '';
}
function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}
async function withBusy(button, busyText, action) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = busyText;
  try {
    await action();
  } catch (error) {
    $('#authMessage').textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}
function returnAfterAuth() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const requested = params.get('next') || sessionStorage.getItem('ny_auth_next') || '/';
  sessionStorage.removeItem('ny_auth_next');
  const safePath = ['/', '/write', '/mine', '/pool', '/help'].includes(requested) ? requested : '/';
  location.hash = '#' + safePath;
}
$('#loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const button = $('button[type="submit"]', event.currentTarget);
  withBusy(button, '正在登录…', async () => {
    const result = await api(apiPath('/auth/login'), {
      method: 'POST',
      body: json(formValues(event.currentTarget))
    });
    setUser(result.user);
    toast('登录成功');
    returnAfterAuth();
  });
});
$('#registerForm').addEventListener('submit', event => {
  event.preventDefault();
  const button = $('button[type="submit"]', event.currentTarget);
  withBusy(button, '正在创建…', async () => {
    const result = await api(apiPath('/auth/register'), {
      method: 'POST',
      body: json(formValues(event.currentTarget))
    });
    setUser(result.user);
    toast('账号创建成功');
    returnAfterAuth();
  });
});
$('#resetForm').addEventListener('submit', event => {
  event.preventDefault();
  const button = $('button[type="submit"]', event.currentTarget);
  withBusy(button, '正在重置…', async () => {
    await api(apiPath('/auth/password-reset/confirm'), {
      method: 'POST',
      body: json(formValues(event.currentTarget))
    });
    toast('密码已重置，请使用新密码登录。');
    $('#resetForm').reset();
    location.hash = '#/auth?mode=login';
  });
});
$('#sendRegisterCode').addEventListener('click', event => {
  const button = event.currentTarget;
  withBusy(button, '发送中…', async () => {
    await api(apiPath('/auth/email-verification/request'), {
      method: 'POST',
      body: json({ username: $('#registerUsername').value.trim(), email: $('#registerEmail').value.trim() })
    });
    $('#authMessage').textContent = '如果邮箱可用于注册，验证码将发送到该邮箱。';
  });
});
$('#sendResetCode').addEventListener('click', event => {
  const button = event.currentTarget;
  withBusy(button, '发送中…', async () => {
    await api(apiPath('/auth/password-reset/request'), {
      method: 'POST',
      body: json({ username: $('#resetUsername').value.trim(), email: $('#resetEmail').value.trim() })
    });
    $('#authMessage').textContent = '如果账号与邮箱匹配，验证码将发送到该邮箱。';
  });
});

const views = $$('.view');
function route() {
  if (!authReady) return;
  const [rawPath, rawQuery] = location.hash.replace(/^#/, '').split('?');
  const path = rawPath || '/';
  const params = new URLSearchParams(rawQuery || '');
  const viewName = {
    '/': 'home',
    '/write': 'write',
    '/mine': 'mine',
    '/help': 'help',
    '/pool': 'pool',
    '/auth': 'auth'
  }[path] || 'home';
  if (['write', 'mine'].includes(viewName) && !currentUser) {
    sessionStorage.setItem('ny_auth_next', path);
    location.hash = '#/auth?mode=login&next=' + encodeURIComponent(path);
    return;
  }
  closeDrawer();
  if (!stage.hidden) closeMailbox();
  closeMenu();
  closeNavigation();
  views.forEach(view => { view.hidden = view.dataset.view !== viewName; });
  $$('[data-nav]').forEach(link => {
    const active = link.dataset.nav === viewName;
    link.classList.toggle('on', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $$('[data-tab]').forEach(link => {
    const active = link.dataset.tab === viewName;
    link.classList.toggle('on', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $('.foot').hidden = viewName === 'write';
  window.scrollTo(0, 0);
  if (viewName === 'auth') authMode();
  if (viewName === 'write') {
    draft.topic = null;
    draft.department = null;
    $$('.topic').forEach(topic => topic.setAttribute('aria-checked', 'false'));
    titleInput.value = '';
    bodyInput.value = '';
    bodyTouched = false;
    goWriteStep(1);
  }
  if (viewName === 'mine') loadMine();
  if (viewName === 'help' && sessionStorage.getItem('ny_scroll_to')) {
    const target = $('#' + sessionStorage.getItem('ny_scroll_to'));
    sessionStorage.removeItem('ny_scroll_to');
    if (target) setTimeout(() => {
      target.scrollIntoView({ block: 'start' });
      target.classList.add('flash');
      setTimeout(() => target.classList.remove('flash'), 1700);
    }, 60);
  }
  observeReveals();
}
$$('[data-scroll]').forEach(link => link.addEventListener('click', () => {
  sessionStorage.setItem('ny_scroll_to', link.dataset.scroll);
}));
window.addEventListener('hashchange', route);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const observer = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    }), { rootMargin: '0px 0px -8% 0px' })
  : null;
function observeReveals() {
  $$('.reveal:not(.in)').forEach(element => {
    if (reduceMotion || !observer) element.classList.add('in');
    else observer.observe(element);
  });
}
window.addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', window.scrollY > 8), { passive: true });

const journeyDetails = [
  { title: '提交', time: '提交后可查询', desc: '选择最接近的承办部门，写清标题和问题描述。提交成功后，系统会返回一个建议编号。', points: ['提交前可修改内容', '提交后可在「我的反馈」查看记录'] },
  { title: '受理', time: '状态可查看', desc: '平台按内部流程核对建议并转交承办部门。具体受理安排由单位当前流程确定。', points: ['建议会显示当前处理状态', '页面不承诺固定办理时限'] },
  { title: '办理', time: '进度持续更新', desc: '承办人员更新建议状态；如有补充说明，会记录在建议详情中。', points: ['员工账号信息不会出现在承办列表接口中', '请避免在描述中写入密码或证件号'] },
  { title: '回复', time: '查看处理结果', desc: '平台回复会保存在建议详情里，你可以通过建议编号或「我的反馈」查看。', points: ['回复内容与时间会显示在记录中', '如需进一步帮助，请联系单位公布的支持渠道'] }
];
const journey = $('#journey');
const journeyDetail = $('#jdetail');
function showJourney(index) {
  const selected = journey.querySelector('[data-j="' + index + '"]');
  const wasOpen = selected.getAttribute('aria-expanded') === 'true';
  journey.querySelectorAll('[data-j]').forEach(item => {
    const active = item === selected && !wasOpen;
    item.setAttribute('aria-expanded', String(active));
    item.classList.toggle('selected', active);
  });
  if (wasOpen) {
    journeyDetail.hidden = true;
    return;
  }
  const detail = journeyDetails[index];
  $('#jdNum').textContent = String(index + 1).padStart(2, '0');
  $('#jdTitle').textContent = detail.title;
  $('#jdTime').textContent = detail.time;
  $('#jdDesc').textContent = detail.desc;
  const points = $('#jdPoints');
  points.replaceChildren(...detail.points.map(text => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));
  journeyDetail.hidden = false;
}
journey.addEventListener('click', event => {
  const item = event.target.closest('[data-j]');
  if (item) showJourney(Number(item.dataset.j));
});
journey.addEventListener('keydown', event => {
  if (!['Enter', ' '].includes(event.key)) return;
  const item = event.target.closest('[data-j]');
  if (!item) return;
  event.preventDefault();
  showJourney(Number(item.dataset.j));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeDrawer();
    closeMenu();
    closeNavigation();
    journeyDetail.hidden = true;
    journey.querySelectorAll('[data-j]').forEach(item => {
      item.setAttribute('aria-expanded', 'false');
      item.classList.remove('selected');
    });
    if (!$('#mxStage').hidden) closeMailbox();
  }
  if (event.key !== 'Tab') return;
  if (!$('#drawer').hidden) {
    const focusable = $$('button,a', $('#drawer'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

/* Read-only example cards for the mailbox visual */
const mailboxCards = [
  { id: 'NY-EXAMPLE-01', dept: '综合办公室', title: '食堂晚餐 18:30 后<br>热菜供应不足', status: 'done', date: '示例', question: '加班同事晚到食堂时，热菜窗口已经撤下，希望适当延长供应时间。', reply: '示例答复：调整晚餐供应时间，并持续收集员工反馈。', limit: '示例时限', replyDate: '示例', rotation: -8 },
  { id: 'NY-EXAMPLE-02', dept: '运行管理部', title: '早班班车时刻<br>希望提前 10 分钟', status: 'doing', date: '示例', question: '早班通勤时间紧张，希望进一步评估班车发车时间。', rotation: -1 },
  { id: 'NY-EXAMPLE-03', dept: '综合办公室', title: '会议室预定后<br>常被临时占用', status: 'done', date: '示例', question: '预约会议室后偶尔遇到占用，希望优化预约状态提醒。', reply: '示例答复：完善预约屏状态展示和签到提醒。', limit: '示例时限', replyDate: '示例', rotation: 7 },
  { id: 'NY-EXAMPLE-04', dept: '运行管理部', title: '打印设备维护<br>希望增加巡检', status: 'done', date: '示例', question: '打印设备卡纸或耗材不足影响日常工作，希望增加巡检。', reply: '示例答复：明确设备巡检频次并设置耗材提示。', limit: '示例时限', replyDate: '示例', rotation: 4 },
  { id: 'NY-EXAMPLE-05', dept: '综合服务中心', title: '午休区照明<br>希望更便于调节', status: 'doing', date: '示例', question: '午休时照明较亮，希望评估分区控制方案。', rotation: -3 },
  { id: 'NY-EXAMPLE-06', dept: '人事部', title: '培训报名结果<br>希望提前通知', status: 'doing', date: '示例', question: '培训报名结果通知较晚，希望预留更多准备时间。', rotation: 6 }
];
const mailbox = $('#mbCards');
const overlay = $('#mxOverlay');
const stage = $('#mxStage');
const modalCard = $('#mxCard');
const modalBody = $('#mxBody');
let modalSource = null;
let modalBusy = false;
const motionCurve = 'cubic-bezier(.2,.8,.2,1)';
function renderMailboxCard(card, index) {
  const state = card.status === 'done' ? '已回复' : '办理中';
  return '<div class="mb-slotwrap pos-' + (index + 1) + '" data-rotation="' + card.rotation + '">' +
    '<button class="mcard" data-index="' + index + '" aria-haspopup="dialog" aria-label="示例：' +
    esc(card.title.replace('<br>', '')) + '，' + esc(card.dept) + '，' + state + '">' +
    '<span class="mc-top"><span class="mc-dept">' + esc(card.dept) + '</span><span class="mpill ' +
    card.status + '">' + state + '</span></span><span class="mc-title">' + card.title +
    '</span><span class="mc-id">' + esc(card.id) + '</span></button></div>';
}
mailbox.innerHTML = mailboxCards.map(renderMailboxCard).join('');
const mobileStrip = $('#mStrip');
if (mobileStrip) {
  mobileStrip.innerHTML = mailboxCards.map((card, index) => {
    const state = card.status === 'done' ? '已回复' : '办理中';
    const progress = card.status === 'done' ? 'done' : 'doing';
    return '<button class="ms-card" type="button" data-index="' + index + '" aria-label="查看示例：' +
      esc(card.title.replace('<br>', '')) + '，' + state + '"><span class="ms-no">示例 · ' + esc(card.id) +
      '</span><span class="ms-title">' + esc(card.title.replace('<br>', ' ')) +
      '</span><span class="ms-meta">' + state + '</span><span class="ms-bar"><i class="' + progress + '"></i></span></button>';
  }).join('');
  mobileStrip.addEventListener('click', event => {
    const button = event.target.closest('.ms-card');
    if (button) openMailbox(button);
  });
}
function renderMailboxDetail(card) {
  const labels = ['提交', '受理', '办理', '回复'];
  const count = card.status === 'done' ? 4 : 3;
  const steps = labels.map((label, index) => {
    const complete = index < count - (card.status === 'done' ? 0 : 1);
    const current = index === count - 1;
    return '<li class="' + (complete ? 'd' : current ? 'c' : '') + '">' + label +
      (index === 2 && card.status !== 'done' ? '<small>示例</small>' : '') +
      (index === 3 && card.status === 'done' ? '<small>示例</small>' : '') + '</li>';
  }).join('');
  modalBody.innerHTML =
    '<div class="mx-meta"><span class="tag">示例</span><span class="mono">' + esc(card.id) +
    '</span><span>' + esc(card.dept) + '</span><span>' + esc(card.date) + '</span></div>' +
    '<h2 id="mxTitle">' + card.title.replace('<br>', '') + '</h2>' +
    '<span class="mx-anon"><svg class="ic sm"><use href="#lock"/></svg>展示示例，不代表真实工单</span>' +
    '<p class="mx-q">' + esc(card.question) + '</p>' +
    '<ol class="mx-steps">' + steps + '</ol>' +
    (card.reply
      ? '<div class="mx-reply"><div class="mx-reply-h"><span>' + esc(card.dept) + ' · 示例回复</span><span>' +
        esc(card.replyDate) + '</span></div><dl class="mx-reply-b"><dt>措施</dt><dd>' + esc(card.reply) +
        '</dd><dt>时限</dt><dd>' + esc(card.limit) + '</dd></dl></div>'
      : '<p class="mx-wait">示例：承办部门正在办理，答复后会显示措施与时限。</p>') +
    '<p class="mx-foot">此卡片仅用于展示界面。</p>';
}
function cardTransform(element) {
  const sourceRect = element.getBoundingClientRect();
  const targetRect = modalCard.getBoundingClientRect();
  const mailboxElement = element.closest('.mailbox');
  const scale = mailboxElement ? mailboxElement.getBoundingClientRect().width / mailboxElement.offsetWidth : 1;
  const sx = element.offsetWidth * scale / targetRect.width;
  const sy = element.offsetHeight * scale / targetRect.height;
  const dx = sourceRect.left + sourceRect.width / 2 - (targetRect.left + targetRect.width / 2);
  const dy = sourceRect.top + sourceRect.height / 2 - (targetRect.top + targetRect.height / 2);
  const rotation = Number(element.parentElement.dataset.rotation || 0);
  return { dx, dy, sx, sy, rotation };
}
function openMailbox(element, fill) {
  if (modalBusy) return;
  modalBusy = true;
  modalSource = element;
  if (fill) fill(modalBody);
  else renderMailboxDetail(mailboxCards[Number(element.dataset.index)]);
  overlay.hidden = false;
  stage.hidden = false;
  document.body.classList.add('modal-open');
  element.classList.add('source-hidden');
  requestAnimationFrame(() => overlay.classList.add('on'));
  if (reduceMotion) {
    modalCard.classList.add('is-open');
    modalBusy = false;
    $('#mxClose').focus();
    return;
  }
  const transform = cardTransform(element);
  const animation = modalCard.animate([
    { transform: 'translate(' + transform.dx + 'px,' + transform.dy + 'px) rotate(' + transform.rotation + 'deg) scale(' + transform.sx + ',' + transform.sy + ')', borderRadius: '60px' },
    { transform: 'translate(' + transform.dx + 'px,' + (transform.dy - 70) + 'px) rotate(' + (transform.rotation * .4) + 'deg) scale(' + (transform.sx * 1.06) + ',' + (transform.sy * 1.06) + ')', offset: .28 },
    { transform: 'none', borderRadius: '28px' }
  ], { duration: 720, easing: motionCurve });
  setTimeout(() => modalBody.classList.remove('is-fading'), 380);
  modalBody.classList.add('is-fading');
  animation.onfinish = () => {
    modalBody.classList.remove('is-fading');
    modalBusy = false;
    $('#mxClose').focus();
  };
}
function closeMailbox() {
  if (modalBusy || stage.hidden) return;
  modalBusy = true;
  overlay.classList.remove('on');
  const done = () => {
    modalCard.classList.remove('thread', 'is-open');
    stage.hidden = true;
    overlay.hidden = true;
    document.body.classList.remove('modal-open');
    modalBody.classList.remove('is-fading');
    if (modalSource) {
      modalSource.classList.remove('source-hidden');
      modalSource.focus({ preventScroll: true });
    }
    modalBusy = false;
  };
  if (reduceMotion) {
    done();
    return;
  }
  const transform = cardTransform(modalSource);
  modalBody.classList.add('is-fading');
  modalCard.animate([
    { transform: 'none' },
    { transform: 'translate(' + transform.dx + 'px,' + (transform.dy - 70) + 'px) rotate(' + (transform.rotation * .4) + 'deg) scale(' + (transform.sx * 1.06) + ',' + (transform.sy * 1.06) + ')', offset: .7 },
    { transform: 'translate(' + transform.dx + 'px,' + transform.dy + 'px) rotate(' + transform.rotation + 'deg) scale(' + transform.sx + ',' + transform.sy + ')', borderRadius: '60px' }
  ], { duration: 560, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = done;
}
function openThread(post) {
  modalCard.classList.add('thread');
  openMailbox(post.element, target => {
    const replies = post.replies.length
      ? post.replies.map((reply, index) =>
        '<li><span class="pav sm hue-' + (index % 5) + '" aria-hidden="true"></span><div><b>' +
        esc(reply[0]) + '</b><p>' + esc(reply[1]) + '</p></div></li>'
      ).join('')
      : '<li class="th-empty">示例中暂无回复。</li>';
    target.innerHTML =
      '<div class="mx-meta"><span class="ptopic">' + esc(post.topic) +
      '</span><span class="tag">示例</span><span>留言池 · 只读</span></div>' +
      '<div class="th-post"><header class="pc-h"><span class="pav hue-' + (post.avatar % 5) +
      '" aria-hidden="true"></span><span class="pc-a">' + esc(post.author) +
      '</span><span class="pc-time">' + esc(post.time) + '</span></header><h2 id="mxTitle" class="th-text">' +
      esc(post.message) + '</h2><p class="th-stat">示例互动：♥ ' + post.likes +
      ' 人有同感 · 💬 ' + post.replies.length + ' 条回复</p></div>' +
      '<ul class="th-replies">' + replies + '</ul>' +
      '<p class="mx-foot">示例内容仅用于展示，不代表真实同事发言。</p>';
  });
}
$('#mxClose').addEventListener('click', closeMailbox);
overlay.addEventListener('click', closeMailbox);
stage.addEventListener('click', event => { if (event.target === stage) closeMailbox(); });
mailbox.addEventListener('click', event => {
  const button = event.target.closest('.mcard');
  if (button) openMailbox(button);
});
document.addEventListener('keydown', event => {
  if (stage.hidden) return;
  if (event.key === 'Tab') {
    const focusable = $$('button,a,textarea,input,[tabindex]:not([tabindex="-1"])', modalCard);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!modalCard.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }
});

/* Read-only sample content for the pool */
const poolPosts = [
  { author: '匿名·小水獭', topic: '工作技巧', time: '示例', message: '分享一个小技巧：会议纪要模板里加一栏「下一步 · 负责人 · 截止」，开完会直接发，跟进效率高很多。', likes: 24, replies: [['匿名·小企鹅', '已抄作业，周会用上了。'], ['匿名·小麋鹿', '再加一栏「待确认」会更好。']], avatar: 0 },
  { author: '匿名·小橘猫', topic: '生活服务', time: '示例', message: '园区东门新开的那家面馆，牛肉面分量很足，12 点前去不用排队。', likes: 41, replies: [['匿名·小柴犬', '酸菜鱼面也不错！'], ['匿名·小松鼠', '周五人特别多，建议 11:40 出发。']], avatar: 1 },
  { author: '匿名·小麋鹿', topic: '活动组织', time: '示例', message: '有没有同事想组个周三晚上的羽毛球局？园区体育馆 7 点到 9 点，可以 AA 场地费。', likes: 18, replies: [['匿名·小刺猬', '算我一个，水平一般。']], avatar: 2 },
  { author: '匿名·小熊猫', topic: '闲聊', time: '示例', message: '今天窗外的晚霞很漂亮，下班前记得抬头看一眼。', likes: 57, replies: [], avatar: 3 },
  { author: '匿名·小企鹅', topic: '工作技巧', time: '示例', message: 'Excel 里按 Ctrl + E 可以快速填充拆分数据，整理名单时很方便。', likes: 33, replies: [['匿名·小水獭', '这个真的救命。']], avatar: 4 },
  { author: '匿名·小海豹', topic: '生活服务', time: '示例', message: '提醒一下：快递柜旁边新增了一个冷藏格，生鲜可以放那边。', likes: 29, replies: [['匿名·小熊猫', '原来如此。']], avatar: 0 },
  { author: '匿名·小柴犬', topic: '活动组织', time: '示例', message: '读书角想换一批新书，大家有推荐的吗？', likes: 22, replies: [['匿名·小橘猫', '可以看看《置身事内》。']], avatar: 1 },
  { author: '匿名·小刺猬', topic: '闲聊', time: '示例', message: '新来的咖啡机终于会做燕麦拿铁了。', likes: 46, replies: [], avatar: 2 },
  { author: '匿名·小鲸鱼', topic: '工作技巧', time: '示例', message: '用日历给自己留一小时专注时间，被临时拉会的次数少了很多。', likes: 38, replies: [['匿名·小麋鹿', '好主意。']], avatar: 3 }
];
let poolTopic = '全部';
let poolSort = 'new';
function poolCard(post, teaser) {
  const avatarClass = 'pav hue-' + (post.avatar % 5);
  return '<article class="pcard' + (teaser ? ' teaser' : '') + '" data-id="' + post.id + '">' +
    '<header class="pc-h"><span class="' + avatarClass + '" aria-hidden="true"></span><span class="pc-a">' +
    esc(post.author) + '</span><span class="pc-time">' + esc(post.time) +
    '</span><span class="tag">示例</span></header>' +
    (teaser
      ? '<a class="pc-open" href="#/pool">' + esc(post.message) + '</a>'
      : '<button class="pc-open" aria-haspopup="dialog" aria-label="查看示例讨论：' + esc(post.message.slice(0, 20)) + '">' + esc(post.message) + '</button>') +
    '<footer class="pc-f"><span class="ptopic">' + esc(post.topic) + '</span>' +
    '<span class="pc-stat">示例 ♥ ' + post.likes + '</span><span class="pc-stat">示例回复 ' + post.replies.length + '</span>' +
    '</footer></article>';
}
poolPosts.forEach((post, index) => { post.id = 'sample-' + index; });
const teaser = $('#poolTeaser');
teaser.innerHTML = [poolPosts[1], poolPosts[0], poolPosts[3]].map(post => poolCard(post, true)).join('');
const poolList = $('#poolList');
function renderPool() {
  let posts = poolPosts.filter(post => poolTopic === '全部' || post.topic === poolTopic);
  if (poolSort === 'hot') posts = [...posts].sort((a, b) =>
    (b.likes + b.replies.length * 3) - (a.likes + a.replies.length * 3)
  );
  poolList.innerHTML = posts.length
    ? posts.map(post => poolCard(post, false)).join('')
    : '<p class="empty">这个话题暂无示例。</p>';
}
renderPool();
$$('.chipf').forEach(button => button.addEventListener('click', () => {
  $$('.chipf').forEach(item => {
    const active = item === button;
    item.classList.toggle('on', active);
    item.setAttribute('aria-selected', String(active));
  });
  poolTopic = button.dataset.t;
  renderPool();
}));
$$('.sort button').forEach(button => button.addEventListener('click', () => {
  $$('.sort button').forEach(item => {
    const active = item === button;
    item.classList.toggle('on', active);
    item.setAttribute('aria-pressed', String(active));
  });
  poolSort = button.dataset.s;
  renderPool();
}));
poolList.addEventListener('click', event => {
  const button = event.target.closest('.pc-open');
  if (!button) return;
  const article = button.closest('.pcard');
  const post = poolPosts.find(item => item.id === article.dataset.id);
  if (post) openThread({ ...post, element: article });
});

async function initialize() {
  await refreshUser();
  authReady = true;
  route();
}
initialize();
})();
