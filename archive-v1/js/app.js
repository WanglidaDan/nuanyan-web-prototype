(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400); };

/* greeting */
const h = new Date().getHours();
const part = h < 11 ? '早上好' : h < 13 ? '中午好' : h < 18 ? '下午好' : '晚上好';
$('#greet').textContent = `${part}，小王`;

/* data */
const items = [
 {id:'NY-20261012-003',topic:'行政与食堂班车',dept:'行政部',title:'食堂晚餐 18:30 后基本没有热菜',body:'加班的同事 18:30 以后去食堂，热菜窗口基本都撤了，只剩面条。希望至少保留一个热菜窗口到 19:30。',status:'已回复',date:'10月12日',
  tl:[['提交','10月12日 09:14','已匿名归档'],['受理','10月12日 15:40','分派至 行政部'],['办理','10月14日','行政部与食堂供应商沟通排班'],['回复','10月18日','已给出书面答复']],
  reply:{dept:'行政部',date:'10月18日',m:'自 10 月 26 日起，二楼食堂 3 号窗口供应热菜至 19:30，每日不少于两荤两素；11 月底前收集一次满意度反馈。',lim:'10 月 26 日起执行'}},
 {id:'NY-20261015-011',topic:'IT与设备',dept:'IT 部',title:'新员工电脑开通账号要等三天',body:'入职当天拿到电脑，但邮箱和内网账号第三天才开通，前两天基本没法工作。',status:'办理中',date:'10月15日',
  tl:[['提交','10月15日 10:02','已匿名归档'],['受理','10月16日 11:20','分派至 IT 部'],['办理','进行中','IT 部正在梳理入职开通流程']],now:2},
 {id:'NY-20261019-008',topic:'安全与环境',dept:'安全环保部',title:'B 栋东侧楼梯间夜间照明不足',body:'B 栋东侧楼梯 3–5 层的灯坏了两盏，晚上下楼看不清台阶。',status:'待受理',date:'10月19日',
  tl:[['提交','10月19日 09:36','已匿名归档']],now:1},
 {id:'NY-20260921-005',topic:'人事与薪酬',dept:'人力资源部',title:'希望培训报名结果能提前一周通知',body:'外部培训报名结果经常在开课前一两天才通知，很难提前安排手头工作。',status:'已回复',date:'9月21日',
  tl:[['提交','9月21日 14:30','已匿名归档'],['受理','9月22日 10:05','分派至 人力资源部'],['办理','9月24日','人力资源部调整培训审批节点'],['回复','9月30日','已给出书面答复']],
  reply:{dept:'人力资源部',date:'9月30日',m:'培训审批由 3 级精简为 2 级；自 10 月起，所有外部培训报名结果于开课前 7 个工作日前通过邮件通知。',lim:'10 月 1 日起执行'}}
];
const pc = s => s === '待受理' ? 'p-wait' : s === '办理中' ? 'p-doing' : 'p-done';
let filter = 'all';
function renderList() {
  $('#flist').innerHTML = items.filter(i => filter === 'all' || i.status === filter).map(i => `
   <li><button class="fitem reveal in" data-id="${i.id}" aria-label="查看详情：${i.title}">
     <div><div class="meta"><span class="mono">${i.id}</span><span>${i.topic}</span><span>${i.date} 提交</span></div>
     <h3>${i.title}</h3><p class="ex">${i.reply ? i.dept + '：' + i.reply.m : i.body}</p></div>
     <span class="pill ${pc(i.status)}">${i.status}</span><svg class="ic"><use href="#chev"/></svg></button></li>`).join('');
}
$$('.f').forEach(b => b.onclick = () => { $$('.f').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); filter = b.dataset.f; renderList(); });
$('#flist').addEventListener('click', e => { const b = e.target.closest('.fitem'); if (b) openDrawer(b.dataset.id, b); });

/* drawer */
let lastFocus;
function openDrawer(id, from) {
  const i = items.find(x => x.id === id); if (!i) return;
  lastFocus = from || document.activeElement;
  const steps = ['提交', '受理', '办理', '回复'];
  const tl = steps.map((s, k) => { const d = i.tl[k]; const cls = d ? (i.now === k ? 'cur' : 'done') : '';
    return `<li class="${cls}"><span class="n"></span><b>${s}</b>${d ? `<time>${d[1]}</time><p>${d[2]}</p>` : '<p>尚未开始</p>'}</li>`; }).join('');
  $('#dId').textContent = i.id;
  $('#dBody').innerHTML = `<span class="pill ${pc(i.status)}">${i.status}</span><h2 id="dTitle">${i.title}</h2>
   <p class="d-sub">${i.topic} · 承办：${i.dept} · ${i.date} 提交</p><div class="d-q">${i.body}</div>
   <p class="d-sec">处理进度</p><ol class="tl">${tl}</ol><p class="d-sec">部门答复</p>
   ${i.reply ? `<div class="reply"><div class="reply-h"><span>${i.reply.dept} 答复</span><span>${i.reply.date}</span></div><div class="reply-b"><p class="lbl">具体措施</p><p>${i.reply.m}</p><p class="lbl">时限</p><p>${i.reply.lim}</p></div></div>
   <div class="d-actions"><button class="btn primary sm" data-t="感谢你的评价，已记录为「满意」">这个答复解决了我的问题</button><button class="btn ghost sm" data-t="已重新进入办理，并抄送平台运营组">继续反馈</button></div>`
   : `<div class="d-empty">承办部门答复后会显示在这里，并通过站内消息通知你。</div>`}`;
  $('#scrim').hidden = $('#drawer').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#dClose').focus();
}
function closeDrawer() {
  const d = $('#drawer'), s = $('#scrim'); if (d.hidden) return;
  d.classList.add('closing'); s.classList.add('closing');
  setTimeout(() => { d.hidden = s.hidden = true; d.classList.remove('closing'); s.classList.remove('closing'); document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }, 280);
}
$('#dClose').onclick = closeDrawer; $('#scrim').onclick = closeDrawer;
$('#dBody').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) toast(b.dataset.t); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeDrawer(); closeMenu(); }
  if (e.key === 'Tab' && !$('#drawer').hidden) { const f = $$('button,a', $('#drawer')); const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
});

/* account menu */
const menu = $('#acctMenu'), ab = $('#acctBtn');
function closeMenu() { menu.hidden = true; ab.setAttribute('aria-expanded', false); $('#logoutConfirm').hidden = true; }
ab.onclick = e => { e.stopPropagation(); const o = menu.hidden; closeMenu(); if (o) { menu.hidden = false; ab.setAttribute('aria-expanded', true); $('.menu-item', menu).focus(); } };
document.addEventListener('click', e => { if (!e.target.closest('.acct')) closeMenu(); });
$('#logoutBtn').onclick = () => { $('#logoutConfirm').hidden = false; $('#logoutYes').focus(); };
$('#logoutNo').onclick = () => { $('#logoutConfirm').hidden = true; };
const setGuest = g => { document.body.classList.toggle('guest', g); ab.hidden = g; $('#loginBtn').hidden = !g; };
$('#logoutYes').onclick = () => { closeMenu(); setGuest(true); location.hash = '#/'; toast('已退出登录'); };
$('#guestToggle').onclick = () => { closeMenu(); setGuest(true); };
$('#loginBtn').onclick = e => { e.preventDefault(); setGuest(false); toast('欢迎回来，小王'); };
$('#settingsBtn').onclick = () => { closeMenu(); toast('个人设置：通知方式、默认主题（原型未展开）'); };

/* write flow */
let step = 1; const draft = { topic: null, dept: null };
$$('.topic').forEach(t => t.onclick = () => { $$('.topic').forEach(x => x.setAttribute('aria-checked', x === t)); draft.topic = t.dataset.t; draft.dept = t.dataset.d; update(); });
$('.topics').addEventListener('keydown', e => { const ts = $$('.topic'), i = ts.indexOf(document.activeElement);
  if (['ArrowRight','ArrowDown'].includes(e.key)) { e.preventDefault(); ts[(i + 1) % ts.length].focus(); }
  if (['ArrowLeft','ArrowUp'].includes(e.key)) { e.preventDefault(); ts[(i - 1 + ts.length) % ts.length].focus(); } });
const body = $('#body'), ttl = $('#ttl'), hint = $('#bodyHint');
let touched = false;
body.addEventListener('input', () => { touched = true; update(); });
body.addEventListener('blur', () => { touched = true; update(); });
ttl.addEventListener('input', update);
function valid(s) { if (s === 1) return !!draft.topic; if (s === 2) return ttl.value.trim().length > 0 && body.value.trim().length >= 10; return true; }
function update() {
  const n = body.value.trim().length;
  $('#count').textContent = `${body.value.length}/500`;
  hint.className = 'hint' + (n >= 10 ? ' ok' : touched && n > 0 ? ' warn' : '');
  hint.textContent = n >= 10 ? '描述清楚了，谢谢' : touched && n > 0 ? `再写 ${10 - n} 个字就可以了` : '至少 10 个字';
  $('#nextBtn').disabled = !valid(step);
  $('#footMsg').textContent = step === 1 && !draft.topic ? '请选择一个主题' : step === 2 && !valid(2) ? (ttl.value.trim() ? '' : '还差一个标题') : '';
}
function go(s, back) {
  step = s;
  $$('.stage').forEach(x => { const on = +x.dataset.step === s; x.hidden = !on; if (on) { x.classList.toggle('back-anim', !!back); x.style.animation = 'none'; x.offsetHeight; x.style.animation = ''; } });
  $$('.steps li[data-s]').forEach(li => { const k = +li.dataset.s; li.classList.toggle('cur', k === s); li.classList.toggle('done', k < s); li.toggleAttribute('aria-current', k === s); });
  $$('.steps .bar').forEach((b, k) => b.classList.toggle('done', k + 1 < s));
  $('#pfoot').hidden = s === 4; $('.save-note').style.visibility = s === 4 ? 'hidden' : ''; $('.write-top .steps').style.visibility = s === 4 ? 'hidden' : '';
  $('#prevBtn').style.visibility = s === 1 ? 'hidden' : '';
  $('#nextBtn').textContent = s === 3 ? '确认提交' : '下一步';
  if (s === 3) { $('#sTopic').textContent = draft.topic; $('#sDept').textContent = draft.dept; $('#sTitle').textContent = ttl.value.trim(); $('#sBody').textContent = body.value.trim(); }
  if (s === 4) { items.unshift({ id: 'NY-20261019-009', topic: draft.topic, dept: draft.dept, title: ttl.value.trim(), body: body.value.trim(), status: '待受理', date: '10月19日', tl: [['提交', '刚刚', '已匿名归档']], now: 1 }); $('#sid').textContent = 'NY-20261019-009'; $('.success .btn.primary').href = '#/mine?open=NY-20261019-009'; renderList(); }
  update();
  const h = $(`.stage[data-step="${s}"] h1`); h.tabIndex = -1; h.focus({ preventScroll: true });
}
$('#nextBtn').onclick = () => valid(step) && go(step + 1);
$('#prevBtn').onclick = () => go(step - 1, true);
$$('[data-go]').forEach(b => b.onclick = () => go(+b.dataset.go, true));
$('.attach').onclick = () => toast('附件上传为原型占位');
window.__nyFill = (t, b, topic) => { $$('.topic').find(x => x.dataset.t === topic).click(); ttl.value = t; body.value = b; touched = true; update(); };
window.__nyGo = go;

/* router */
const views = $$('.view');
function route() {
  const [path, q] = location.hash.replace(/^#/, '').split('?');
  const name = { '/': 'home', '': 'home', '/write': 'write', '/mine': 'mine', '/help': 'help' }[path] || 'home';
  closeDrawer();
  views.forEach(v => v.hidden = v.dataset.view !== name);
  $$('[data-nav]').forEach(a => { const on = a.dataset.nav === name; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  $('.foot').hidden = name === 'write';
  window.scrollTo(0, 0);
  if (name === 'write') { draft.topic = null; $$('.topic').forEach(x => x.setAttribute('aria-checked', false)); ttl.value = body.value = ''; touched = false; go(1); }
  if (name === 'mine') { renderList(); const m = /open=([\w-]+)/.exec(q || ''); if (m) setTimeout(() => openDrawer(m[1]), 250); }
  if (name === 'help' && sessionStorage.scrollTo) { const el = $('#' + sessionStorage.scrollTo); sessionStorage.removeItem('scrollTo'); setTimeout(() => { el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1700); }, 60); }
  observe();
}
$$('[data-scroll]').forEach(a => a.addEventListener('click', () => sessionStorage.scrollTo = a.dataset.scroll));
window.addEventListener('hashchange', route);

/* reveal */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
function observe() { $$('.reveal:not(.in)').forEach((el, k) => { const sib = [...el.parentElement.children].filter(c => c.classList.contains('reveal')).indexOf(el); el.style.transitionDelay = (sib * 80) + 'ms'; io ? io.observe(el) : el.classList.add('in'); }); }
window.addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 8), { passive: true });
route();
})();
