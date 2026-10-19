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
  const name = { '/': 'home', '': 'home', '/write': 'write', '/mine': 'mine', '/help': 'help', '/pool': 'pool' }[path] || 'home';
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

/* ===== v1.1 mailbox ===== */
(() => {
const $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const C = [
 {id:'NY-20261008-012',dept:'行政部',t:'食堂晚餐 18:30 后<br>热菜供应不足',s:'done',date:'10月8日',q:'加班的同事 18:30 以后去食堂，热菜窗口基本都撤了，只剩面条。希望至少保留一个热菜窗口到 19:30。',m:'自 10 月 26 日起，二楼食堂 3 号窗口热菜供应延至 19:30，每日不少于两荤两素。',lim:'10 月 26 日起执行',rd:'10月16日',x:22,y:78,r:-8},
 {id:'NY-20261011-004',dept:'行政部',t:'早班班车时刻<br>希望提前 10 分钟',s:'doing',date:'10月11日',q:'7:20 发车到园区已经 8:05，经常赶不上 8:00 的早会。希望 1 号线班车提前到 7:10。',x:158,y:58,r:-1},
 {id:'NY-20260929-021',dept:'IT 部',t:'会议室预定后<br>常被临时占用',s:'done',date:'9月29日',q:'预定了会议室，到点去发现有人在用，也没法确认谁订的，只能另找地方。',m:'会议室门牌屏接入预定系统，显示当前预定人所在部门；开始 15 分钟未签到自动释放。',lim:'11 月 10 日前',rd:'10月12日',x:296,y:82,r:7},
 {id:'NY-20261002-007',dept:'IT 部',t:'3 楼打印机<br>经常卡纸缺粉',s:'done',date:'10月2日',q:'3 楼东侧打印机一周卡纸好几次，碳粉经常用完没人换，急用时很耽误事。',m:'更换为新型号双面打印机，并由 IT 每周二巡检一次、备用碳粉放在旁边柜子。',lim:'10 月 31 日前',rd:'10月14日',x:54,y:158,r:4},
 {id:'NY-20261013-015',dept:'行政部',t:'午休区照明<br>太亮无法休息',s:'doing',date:'10月13日',q:'5 楼午休区中午灯全开，很难休息。希望 12:00–13:30 能调暗或单独控制。',x:184,y:148,r:-3},
 {id:'NY-20261009-002',dept:'人力资源部',t:'加班餐补标准<br>多年未调整',s:'doing',date:'10月9日',q:'加班餐补 15 元的标准用了好几年，园区周边一份简餐已经 25 元左右。',x:302,y:162,r:6}
];
const box = $('#mbCards'); if (!box) return;
box.innerHTML = C.map((c, i) => `<div class="mb-slotwrap" style="left:${c.x}px;top:${c.y}px;rotate:${c.r}deg;z-index:${i < 3 ? 1 : 2};animation-delay:${-i * 1.3}s;animation-duration:${6 + i % 3}s">
  <button class="mcard" data-i="${i}" aria-haspopup="dialog" aria-label="示例：${c.t.replace('<br>', '')}，${c.dept}，${c.s === 'done' ? '已回复' : '办理中'}">
   <span class="mc-top"><span class="mc-dept">${c.dept}</span><span class="mpill ${c.s}">${c.s === 'done' ? '已回复' : '办理中'}</span></span>
   <span class="mc-title">${c.t}</span><span class="mc-id">${c.id}</span></button></div>`).join('');
const ov = $('#mxOverlay'), stage = $('#mxStage'), card = $('#mxCard'), body = $('#mxBody');
let src = null, busy = false;
const E = 'cubic-bezier(.2,.8,.2,1)';
function render(c) {
  const steps = ['提交', '受理', '办理', '回复'], n = c.s === 'done' ? 4 : 3;
  body.innerHTML = `<div class="mx-meta"><span class="tag">示例</span><span class="mono">${c.id}</span><span>${c.dept}</span><span>${c.date} 提交</span></div>
   <h2 id="mxTitle">${c.t.replace('<br>', '')}</h2>
   <span class="mx-anon"><svg class="ic sm"><use href="#lock"/></svg>员工身份已隐去</span>
   <p class="mx-q">${c.q}</p>
   <ol class="mx-steps">${steps.map((s, k) => `<li class="${k < n - (c.s === 'done' ? 0 : 1) ? 'd' : k === n - 1 ? 'c' : ''}">${s}${k === 3 && c.s === 'done' ? `<small>${c.rd}</small>` : k === 2 && c.s !== 'done' ? '<small>进行中</small>' : ''}</li>`).join('')}</ol>
   ${c.s === 'done' ? `<div class="mx-reply"><div class="mx-reply-h"><span>${c.dept} 答复</span><span>${c.rd}</span></div><dl class="mx-reply-b"><dt>措施</dt><dd>${c.m}</dd><dt>时限</dt><dd>${c.lim}</dd></dl></div>`
   : `<p class="mx-wait">承办部门正在办理，答复后会写明具体措施与时限。</p>`}
   <p class="mx-foot">此为示例，用于展示建议从提交到答复的样子。</p>`;
}
function fromTransform(el) {
  const a = el.getBoundingClientRect(), b = card.getBoundingClientRect();
  const mb = el.closest('.mailbox'), k = mb ? mb.getBoundingClientRect().width / mb.offsetWidth : 1;
  const sx = el.offsetWidth * k / b.width, sy = el.offsetHeight * k / b.height;
  const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
  const r = mb ? parseFloat(el.parentElement.style.rotate) || 0 : 0;
  return { dx, dy, sx, sy, r };
}
function open(el, fill) {
  if (busy) return; busy = true; src = el;
  if (fill) fill(body); else render(C[+el.dataset.i]);
  ov.hidden = stage.hidden = false; document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => ov.classList.add('on'));
  if (RM) { card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); el.style.visibility = 'hidden'; busy = false; $('#mxClose').focus(); return; }
  const f = fromTransform(el);
  el.style.visibility = 'hidden';
  body.style.opacity = 0;
  const an = card.animate([
    { transform: `translate(${f.dx}px,${f.dy}px) rotate(${f.r}deg) scale(${f.sx},${f.sy})`, borderRadius: '60px' },
    { transform: `translate(${f.dx}px,${f.dy - 70}px) rotate(${f.r * .4}deg) scale(${f.sx * 1.06},${f.sy * 1.06})`, offset: .28 },
    { transform: 'none', borderRadius: '28px' }], { duration: 720, easing: E });
  setTimeout(() => body.style.opacity = 1, 380);
  an.onfinish = () => { busy = false; $('#mxClose').focus(); };
}
function close() {
  if (busy || stage.hidden) return; busy = true;
  ov.classList.remove('on');
  const done = () => { card.classList.remove('thread'); stage.hidden = ov.hidden = true; document.body.style.overflow = ''; src.style.visibility = ''; busy = false; src.focus({ preventScroll: true }); };
  if (RM) { card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 }).onfinish = done; return; }
  const f = fromTransform(src);
  body.style.opacity = 0;
  card.animate([{ transform: 'none' },
    { transform: `translate(${f.dx}px,${f.dy - 70}px) rotate(${f.r * .4}deg) scale(${f.sx * 1.06},${f.sy * 1.06})`, offset: .7 },
    { transform: `translate(${f.dx}px,${f.dy}px) rotate(${f.r}deg) scale(${f.sx},${f.sy})` }], { duration: 560, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
    .onfinish = e => { done(); e.target.cancel(); body.style.opacity = 1; };
}
box.addEventListener('click', e => { const b = e.target.closest('.mcard'); if (b) open(b); });
window.__mx = { open, close }; $('#mxClose').onclick = close; ov.onclick = close;
stage.addEventListener('click', e => { if (e.target === stage) close(); });
stage.style.pointerEvents = 'none';
document.addEventListener('keydown', e => {
  if (stage.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); close(); }
  if (e.key === 'Tab') { const f = [...card.querySelectorAll('button,a,textarea,input,[tabindex]:not([tabindex="-1"])')]; const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } else if (!card.contains(document.activeElement)) { e.preventDefault(); a.focus(); } }
});
})();

/* ===== v1.1 留言池 ===== */
(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const animals = ['小松鼠','小刺猬','小水獭','小海豹','小麋鹿','小企鹅','小柴犬','小橘猫','小熊猫','小鲸鱼'];
const hues = ['#DCE7D9','#F6DCC4','#E9E1CF','#D9E3E6','#EBD9D2'];
let P = [
 {a:'匿名·小水獭',t:'工作技巧',ago:'12 分钟前',m:'分享一个小技巧：会议纪要模板里加一栏「下一步 · 负责人 · 截止」，开完会直接发，跟进效率高很多。',l:24,r:[['匿名·小企鹅','已抄作业，周会用上了。'],['匿名·小麋鹿','再加一栏「待确认」会更好。']]},
 {a:'匿名·小橘猫',t:'生活服务',ago:'35 分钟前',m:'园区东门新开的那家面馆，牛肉面分量很足，12 点前去不用排队。',l:41,r:[['匿名·小柴犬','酸菜鱼面也不错！'],['匿名·小松鼠','周五人特别多，建议 11:40 出发。'],['匿名·小鲸鱼','求问有没有素的选择？']]},
 {a:'匿名·小麋鹿',t:'活动组织',ago:'1 小时前',m:'有没有同事想组个周三晚上的羽毛球局？园区体育馆 7 点到 9 点，可以 AA 场地费。',l:18,r:[['匿名·小刺猬','算我一个，水平一般。']]},
 {a:'匿名·小熊猫',t:'闲聊',ago:'2 小时前',m:'今天 5 楼窗外的晚霞太好看了，下班前记得抬头看一眼。',l:57,r:[]},
 {a:'匿名·小企鹅',t:'工作技巧',ago:'3 小时前',m:'Excel 里按 Ctrl + E 可以快速填充拆分数据，比写公式快多了，整理名单时特别好用。',l:33,r:[['匿名·小水獭','这个真的救命。']]},
 {a:'匿名·小海豹',t:'生活服务',ago:'今天 09:20',m:'提醒一下：快递柜旁边新增了一个冷藏格，生鲜可以放那边，取件码会单独发短信。',l:29,r:[['匿名·小熊猫','原来如此，昨天还以为柜子坏了。']]},
 {a:'匿名·小柴犬',t:'活动组织',ago:'昨天',m:'读书角想换一批新书，大家有推荐的吗？我先推荐《置身事内》。',l:22,r:[['匿名·小橘猫','《被讨厌的勇气》！'],['匿名·小海豹','推荐一些绘本，带娃的同事可以借。']]},
 {a:'匿名·小刺猬',t:'闲聊',ago:'昨天',m:'新来的咖啡机终于会做燕麦拿铁了，谁反馈的，谢谢你。',l:46,r:[]},
 {a:'匿名·小鲸鱼',t:'工作技巧',ago:'2 天前',m:'用日历给自己每天下午 3 点锁 1 小时「专注时间」，被拉会的次数明显少了。',l:38,r:[['匿名·小麋鹿','好主意，已经锁上了。']]}
].map((p, i) => ({ ...p, id: i, liked: false, ex: true, h: hues[i % hues.length] }));
let topic = '全部', sort = 'new', nid = 100;
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const av = p => `<span class="pav" style="--h:${p.h}" aria-hidden="true"></span>`;
const card = (p, teaser) => `<article class="pcard${teaser ? ' teaser' : ''}" data-id="${p.id}">
  <header class="pc-h">${av(p)}<span class="pc-a">${p.a}</span><span class="pc-time">${p.ago}</span>${p.ex ? '<span class="tag">示例</span>' : ''}</header>
  ${teaser ? `<a class="pc-open" href="#/pool">${esc(p.m)}</a>` : `<button class="pc-open" aria-haspopup="dialog" aria-label="查看讨论：${esc(p.m.slice(0, 20))}">${esc(p.m)}</button>`}
  <footer class="pc-f"><span class="ptopic">${p.t}</span>
   ${teaser ? `<span class="pc-stat">♥ ${p.l}</span><span class="pc-stat">💬 ${p.r.length}</span>` :
   `<button class="like${p.liked ? ' on' : ''}" aria-pressed="${p.liked}" aria-label="有同感，${p.l} 人"><span class="hrt">♥</span><span class="lc">${p.l}</span><span class="lt">有同感</span></button>
   <span class="pc-stat" aria-label="${p.r.length} 条回复">💬 ${p.r.length}</span>
   <span class="more"><button class="more-b" aria-haspopup="menu" aria-expanded="false" aria-label="更多操作">…</button><span class="more-m" role="menu" hidden><button role="menuitem" class="rep">举报</button></span></span>`}
  </footer></article>`;
const tz = $('#poolTeaser'); if (tz) tz.innerHTML = [P[1], P[0], P[3]].map(p => card(p, true)).join('');
const list = $('#poolList');
function render(newId) {
  let a = P.filter(p => topic === '全部' || p.t === topic);
  if (sort === 'hot') a = [...a].sort((x, y) => (y.l + y.r.length * 3) - (x.l + x.r.length * 3));
  list.innerHTML = a.length ? a.map(p => card(p)).join('') : '<p class="empty">这个话题还没有留言，来说第一句吧。</p>';
  if (newId != null) { const el = list.querySelector(`[data-id="${newId}"]`); el && el.classList.add('enter'); }
}
render();
$$('.chipf').forEach(b => b.onclick = () => { $$('.chipf').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); topic = b.dataset.t; render(); });
$$('.sort button').forEach(b => b.onclick = () => { $$('.sort button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); sort = b.dataset.s; render(); });
/* composer */
const tx = $('#pcText'), anon = $('#pcAnon'); let alias = '匿名·' + animals[Math.floor(Math.random() * animals.length)];
const showAlias = () => $('#pcAlias').textContent = anon.checked ? `将显示为「${alias}」` : '将显示为「小王 · 行政部」';
showAlias(); anon.onchange = showAlias;
tx.oninput = () => { const n = tx.value.trim().length; $('#pcCount').textContent = `${tx.value.length}/200`; $('#pcSend').disabled = n < 2; };
$('#composer').onsubmit = e => { e.preventDefault(); const m = tx.value.trim(); if (m.length < 2) return;
  const p = { id: nid++, a: anon.checked ? alias : '小王 · 行政部', t: $('#pcTopic').value, ago: '刚刚', m, l: 0, r: [], liked: false, ex: false, h: hues[nid % hues.length] };
  P.unshift(p); tx.value = ''; tx.oninput(); if (topic !== '全部' && topic !== p.t) { topic = '全部'; $$('.chipf').forEach((x, i) => { x.classList.toggle('on', !i); x.setAttribute('aria-selected', !i); }); }
  sort = 'new'; $$('.sort button').forEach((x, i) => x.classList.toggle('on', !i)); render(p.id);
  alias = '匿名·' + animals[Math.floor(Math.random() * animals.length)]; showAlias(); };
/* card interactions */
list.addEventListener('click', e => {
  const art = e.target.closest('.pcard'); if (!art) return; const p = P.find(x => x.id == art.dataset.id);
  const lk = e.target.closest('.like');
  if (lk) { p.liked = !p.liked; p.l += p.liked ? 1 : -1; lk.classList.toggle('on', p.liked); lk.setAttribute('aria-pressed', p.liked); lk.querySelector('.lc').textContent = p.l;
    lk.classList.remove('pop'); void lk.offsetWidth; p.liked && lk.classList.add('pop'); return; }
  const mb = e.target.closest('.more-b');
  if (mb) { const m = mb.nextElementSibling; const o = m.hidden; $$('.more-m').forEach(x => x.hidden = true); m.hidden = !o; mb.setAttribute('aria-expanded', o); o && m.querySelector('button').focus(); return; }
  if (e.target.closest('.rep')) { e.target.closest('.more-m').hidden = true; toast('已举报，管理员会尽快审核'); return; }
  if (e.target.closest('.pc-open')) openThread(art, p);
});
document.addEventListener('click', e => { if (!e.target.closest('.more')) $$('.more-m').forEach(x => x.hidden = true); });
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400); }
function thread(body, p) {
  body.innerHTML = `<div class="mx-meta"><span class="ptopic">${p.t}</span>${p.ex ? '<span class="tag">示例</span>' : ''}<span>留言池 · 同事可见</span></div>
   <div class="th-post"><header class="pc-h">${av(p)}<span class="pc-a">${p.a}</span><span class="pc-time">${p.ago}</span></header><h2 id="mxTitle" class="th-text">${esc(p.m)}</h2>
   <p class="th-stat">♥ ${p.l} 人有同感 · 💬 ${p.r.length} 条回复</p></div>
   <ul class="th-replies">${p.r.map(r => `<li><span class="pav sm" style="--h:${hues[r[0].length % 5]}"></span><div><b>${r[0]}</b><p>${esc(r[1])}</p></div></li>`).join('') || '<li class="th-empty">还没有回复，来说第一句吧。</li>'}</ul>
   <form class="th-form"><label class="sr" for="thIn">回复</label><textarea id="thIn" rows="2" maxlength="200" placeholder="友善回复，以「${alias}」身份发布"></textarea><button class="btn primary sm" type="submit">回复</button></form>
   <p class="mx-foot">原型示例，回复仅保存在当前页面。</p>`;
  body.querySelector('.th-form').onsubmit = e => { e.preventDefault(); const v = body.querySelector('#thIn').value.trim(); if (!v) return;
    p.r.push([alias, v]); const ul = body.querySelector('.th-replies'); ul.querySelector('.th-empty')?.remove();
    ul.insertAdjacentHTML('beforeend', `<li class="enter"><span class="pav sm" style="--h:${hues[2]}"></span><div><b>${alias}</b><p>${esc(v)}</p></div></li>`);
    body.querySelector('#thIn').value = ''; body.querySelector('.th-stat').textContent = `♥ ${p.l} 人有同感 · 💬 ${p.r.length} 条回复`; render(); };
}
function openThread(art, p) { $('#mxCard').classList.add('thread'); window.__mx.open(art, b => thread(b, p)); }
})();
