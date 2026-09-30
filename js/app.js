/* ============================================================
   饥荒联机版百科 · Don't Starve Together —— 交互逻辑 (js/app.js)
   ============================================================ */

/* ---------------- 工具 ---------------- */
const $ = sel => document.querySelector(sel);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = v => (v == null ? '—' : (Number.isInteger(v) ? v : String(Math.round(v * 1000) / 1000)));
const charById = id => CHARACTERS.find(c => c.id === id);
const itemById = id => LIB_ITEMS.find(i => i.id === id);
/* 哪些角色喜爱这种食物：
   direct = 这种食物本身就是他/她的喜爱食物
   via    = 他/她喜爱的是它的加工版（生 ↔ 熟，如「沃尔夫冈 喜爱 烤土豆」） */
function charsFavItem(itemId) {
  const it = itemById(itemId);
  const group = (it && it.pair) ? [it.id, it.pair] : [itemId];
  const direct = [], via = [];
  CHARS.forEach(c => {
    const favs = c.favItems;
    if (!favs || !favs.length) return;
    if (favs.includes(itemId)) direct.push(c);
    else {
      const hit = favs.find(f => group.includes(f));
      if (hit) via.push({ c, favItem: hit });
    }
  });
  return { direct, via };
}
const TAG_ORDER = ['meat', 'fish', 'veggie', 'fruit', 'monster', 'egg', 'sweet', 'dairy', 'inedible', 'frozen', 'decoration', 'magic', 'seed', 'fat'];

/* 单文件版会把图片内联成 base64（window.DST_IMG_DATA），此时优先用它。 */
function imgSrc(file) {
  const inline = window.DST_IMG_DATA;
  return (inline && inline[file]) ? inline[file] : 'images/' + file;
}
/* 专供 background-image:url('...') 使用（调用方一律单引号包裹）。
   官方不少文件名自带单引号（Surf_'n'_Turf.png、Hound's_Tooth.png …），
   直接拼进去会把引号提前闭合，URL 断裂、图不显示 —— 共 37 个条目受影响。
   在这里统一把单引号按 CSS 字符串转义，24 个调用点就不用各自处理。 */
function imgUrl(file) {
  return imgSrc(file).replace(/'/g, "\\'");
}
function dishImg(r, cls) {
  return `<div class="${cls || 'dish-img'}" style="background-image:url('${imgUrl(r.img)}')"></div>`;
}
/* 没有立绘时用文字方块兜底 */
function itemImg(it, cls) {
  const c = cls || 'dish-img';
  if (it.img) return `<div class="${c}" style="background-image:url('${imgUrl(it.img)}')"></div>`;
  return `<div class="${c} noimg">${esc(it.cn.slice(0, 1))}</div>`;
}
function statPills(r) {
  const neg = v => (v == null ? '' : (v < 0 ? ' neg' : ''));
  return `<div class="stats">
    <span class="stat hunger${neg(r.hg)}"><i class="dot"></i><span class="stat-txt">饥饿 ${num(r.hg)}</span></span>
    <span class="stat health${neg(r.hp)}"><i class="dot"></i><span class="stat-txt">生命 ${num(r.hp)}</span></span>
    <span class="stat sanity${neg(r.sa)}"><i class="dot"></i><span class="stat-txt">理智 ${num(r.sa)}</span></span>
  </div>`;
}
function tagClass(key) { return { meat: 'meat', fish: 'fish', veggie: 'veggie', fruit: 'fruit', egg: 'egg', sweet: 'sweet', monster: 'monster', frozen: 'cold' }[key] || ''; }
function tagPills(tags) {
  return Object.keys(tags).map(k =>
    `<span class="pill ${tagClass(k)}">${TAG_META[k].cn} ${num(tags[k])}</span>`).join('');
}
function reqClass(text) {
  if (/肉度/.test(text)) return 'meat';
  if (/鱼度/.test(text)) return 'fish';
  if (/蔬菜度/.test(text)) return 'veggie';
  if (/水果度/.test(text)) return 'fruit';
  if (/蛋度/.test(text)) return 'egg';
  if (/甜度/.test(text)) return 'sweet';
  if (/怪物/.test(text)) return 'monster';
  if (/冰度/.test(text)) return 'cold';
  if (/热/.test(text)) return 'hot';
  return '';
}
function effectPills(r) {
  const out = [];
  if (r.tags && r.tags.includes('hot')) out.push(['hot', '升温']);
  if (r.tags && r.tags.includes('cold')) out.push(['cold', '降温']);
  if (r.eff) r.eff.forEach(() => out.push(['eff', '特殊效果']));
  return out.map(([c, t]) => `<span class="pill ${c}">${t}</span>`).join('');
}
function perishText(v) { return v == null ? '不腐烂 / —' : v + ' 天'; }
function ingredientPerishText(it) {
  return it.perish == null ? '不腐烂或资料未明确' : `${it.perish} 天（常温基准）`;
}

/* ---------------- 一级分页：料理 / 食材 / 机制 / 计算器 ---------------- */
const COOK_SEGS = [
  { id: 'dishes', label: '料理' },
  { id: 'lib', label: '食材' },
  { id: 'mech', label: '机制' },
  { id: 'calc', label: '计算器' }
];
let cookState = { seg: 'dishes' };

function renderCookSegbar() {
  $('#cookSegbar').innerHTML = COOK_SEGS.map(s =>
    `<button class="seg${cookState.seg === s.id ? ' on' : ''}" data-s="${s.id}">${s.label}</button>`).join('');
  $('#cookSegbar').querySelectorAll('.seg').forEach(b => b.onclick = () => switchCookSeg(b.dataset.s));
}
function switchCookSeg(id) {
  cookState.seg = id;
  renderCookSegbar();
  $('#view-cook').querySelectorAll('.subview').forEach(v =>
    v.hidden = v.id !== 'sub-' + id);
  window.scrollTo({ top: 0 });
}
/* 从料理详情 / 食材详情跳到计算器（计算器是料理页里的一个分段） */
function gotoCalc() {
  switchView('view-cook');
  switchCookSeg('calc');
  updateCalc();
}

/* ---------------- 料理筛选 ---------------- */
const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'hunger', label: '饱食 ≥50' },
  { id: 'heal', label: '回血 ≥30' },
  { id: 'sanity', label: '回理智 ≥20' },
  { id: 'hot', label: '升温' },
  { id: 'cold', label: '降温' },
  { id: 'effect', label: '特殊效果' },
  { id: 'monster', label: '怪物料理' },
  { id: 'roughage', label: '非冒险家食物' },
  { id: 'warly', label: '沃利专属' }
];
let state = { filter: 'all', kw: '' };

function renderChips() {
  $('#chipbar').innerHTML = FILTERS.map(f =>
    `<button class="chip${state.filter === f.id ? ' on' : ''}" data-f="${f.id}">${f.label}</button>`).join('');
  $('#chipbar').querySelectorAll('.chip').forEach(b => b.onclick = () => {
    state.filter = b.dataset.f;
    renderChips(); renderGrid(); revealActiveChip('#chipbar');
  });
}
function matchFilter(r, f) {
  switch (f) {
    case 'all': return true;
    case 'hunger': return r.hg >= 50;
    case 'heal': return r.hp >= 30;
    case 'sanity': return r.sa >= 20;
    case 'roughage': return r.tags.includes('roughage');
    default: return r.tags.includes(f);
  }
}
function matchKw(r, kw) {
  if (!kw) return true;
  const favNames = (r.fav || []).map(id => { const c = charById(id); return c ? c.cn + c.en : ''; }).join(' ');
  const hay = [r.cn, r.en, r.note, (r.samples || []).join(' '), (r.req || []).join(' '),
    (r.forbid || []).join(' '), (r.eff || []).join(' '), favNames].join(' ').toLowerCase();
  return hay.includes(kw);
}
function renderGrid() {
  const kw = state.kw.trim().toLowerCase();
  /* 排序控件已移除：固定使用「推荐顺序」（优先级高在前） */
  const list = RECIPES.filter(r => matchFilter(r, state.filter) && matchKw(r, kw))
    .slice().sort((a, b) => (b.prio - a.prio) || (a.id > b.id ? 1 : -1));
  $('#emptyTip').hidden = list.length > 0;
  $('#grid').className = 'mob-grid';
  $('#grid').innerHTML = list.map(r => {
    const sub = r.warly ? '沃利专属料理' : r.tags.includes('roughage') ? '皮弗娄牛食物' : '烹饪料理';
    return `<button class="mob" data-id="${r.id}">
      ${dishImg(r, 'mob-img')}
      <div class="mob-main">
        <div class="mob-name"><h3>${esc(r.cn)}</h3>${r.warly ? '<span class="badge warly">沃利</span>' : ''}</div>
        <div class="mob-sub">${esc(r.en)} · ${sub}</div>
      </div>
      <span class="mob-arrow" aria-hidden="true">›</span>
    </button>`;
  }).join('');
  $('#grid').querySelectorAll('.mob').forEach(el => el.onclick = () => openSheet(el.dataset.id));
}

/* ---------------- 料理详情 ---------------- */
function openSheet(id) {
  const r = RECIPES.find(x => x.id === id);
  if (!r) return;
  const selfKey = { kind: 'dish', id: r.id };
  const favHtml = (r.fav || []).map(cid => {
    const c = charById(cid);
    const after = Math.round(r.hg * c.mul * 100) / 100;
    return `<div class="favbox">★ <b>${esc(c.cn)}</b>（${esc(c.en)}）喜爱料理 · 亲和倍率 ×${c.mul}<br>
      饥饿：${num(r.hg)} → <b>${num(after)}</b>（+${num(Math.round((after - r.hg) * 100) / 100)} 饥饿）。
      <button class="pill link" data-char="${c.id}">查看 ${esc(c.cn)} →</button></div>`;
  }).join('');

  $('#sheet').innerHTML = `
    <div class="sheet-grip"></div>
    ${sheetTools({ kind: 'dish', id: r.id })}
    <div class="sheet-head">
      ${dishImg(r)}
      <div>
        <h2>${esc(r.cn)}${r.warly ? ' <span class="badge warly">沃利专属</span>' : ''}</h2>
        <em>${esc(r.en)}</em>
      </div>
    </div>
    ${statPills(r)}
    <div class="sheet-sec">
      <h3>烹饪参数</h3>
      <div class="kv">
        <span class="pill">烹饪时间 ${r.time == null ? '—' : r.time + ' 秒'}</span>
        <span class="pill">保质期 ${r.perish == null ? '永不腐烂' : r.perish + ' 天'}</span>
        <span class="pill">优先级 ${r.prio}</span>
      </div>
    </div>
    <div class="sheet-sec">
      <h3>烹饪要求（食物度）</h3>
      <div class="kv">
        ${(r.req || []).map(t => `<span class="pill ${reqClass(t)}">${esc(t)}</span>`).join('') || '<span class="pill">—</span>'}
      </div>
      ${(r.forbid && r.forbid.length) ? `<p class="hint" style="margin:8px 0 0">禁忌：${r.forbid.map(esc).join('、')}</p>` : ''}
    </div>
    ${r.eff ? `<div class="sheet-sec"><h3>特殊效果</h3><div class="effbox">${r.eff.map(t => linkify(t, selfKey)).join('<br>')}</div></div>` : ''}
    ${favHtml ? `<div class="sheet-sec"><h3>喜爱的角色</h3>${favHtml}</div>` : ''}
    <div class="sheet-sec">
      <h3>烹饪材料范例</h3>
      <div class="samples">
        ${(r.samples || []).map((s, i) => `<div class="sample"><i>#${i + 1}</i><span>${linkify(s, selfKey)}</span></div>`).join('')}
      </div>
    </div>
    <div class="sheet-sec">
      <h3>笔记</h3>
      <p class="sheet-note" style="margin:0">${linkify(r.note || '—', selfKey)}</p>
    </div>
    <div class="sheet-sec">
      <button class="btn primary" id="tryCalc">把这个配方放进计算器</button>
    </div>`;

  openPanel();
  bindSheetTools({ kind: 'dish', id: r.id });
  $('#tryCalc').onclick = () => { closeSheet(); gotoCalc(); };
  $('#sheet').querySelectorAll('[data-char]').forEach(b => b.onclick = () => openCharSheet(b.dataset.char));
}

/* ---------------- 食材库 ---------------- */
const LIB_SEGS = [
  { id: 'all', label: '全部' },
  { id: 'raw', label: '生鲜' },
  { id: 'roast', label: '火烤' },
  { id: 'dry', label: '晾晒' },
  { id: 'misc', label: '不可食用 / 调味' }
];
const CAT_ORDER = ['raw', 'roast', 'dry', 'misc'];
let libState = { seg: 'all', kw: '' };

function renderSegbar() {
  $('#segbar').innerHTML = LIB_SEGS.map(s =>
    `<button class="seg${libState.seg === s.id ? ' on' : ''}" data-s="${s.id}">${s.label}</button>`).join('');
  $('#segbar').querySelectorAll('.seg').forEach(b => b.onclick = () => {
    libState.seg = b.dataset.s; renderSegbar(); renderLib(); revealActiveChip('#segbar');
  });
}
function libMatchKw(it, kw) {
  if (!kw) return true;
  const hay = [it.cn, it.en, it.source, it.tip, LIB_CATS[it.cat].cn,
    Object.keys(it.tags).map(k => TAG_META[k].cn).join(' ')].join(' ').toLowerCase();
  return hay.includes(kw);
}
function renderLib() {
  const kw = libState.kw.trim().toLowerCase();
  /* 排序控件已移除：固定按分类分组（生鲜 → 火烤 → 晾晒 → 其它） */
  const list = LIB_ITEMS.filter(it =>
    (libState.seg === 'all' || it.cat === libState.seg) && libMatchKw(it, kw))
    .slice().sort((a, b) =>
      CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat) || LIB_ITEMS.indexOf(a) - LIB_ITEMS.indexOf(b));
  $('#libEmpty').hidden = list.length > 0;
  $('#libGrid').className = 'mob-grid';
  $('#libGrid').innerHTML = list.map(it => `
    <button class="mob" data-id="${it.id}">
      ${itemImg(it, 'mob-img')}
      <div class="mob-main">
        <div class="mob-name"><h3>${esc(it.cn)}</h3>${it.restricted ? '<span class="badge">喂牛</span>' : ''}</div>
        <div class="mob-sub">${esc(it.en)} · ${esc(LIB_CATS[it.cat].cn)}</div>
      </div>
      <span class="mob-arrow" aria-hidden="true">›</span>
    </button>`).join('');
  $('#libGrid').querySelectorAll('.mob').forEach(el => el.onclick = () => openItemSheet(el.dataset.id));
}

function compareRow(label, it) {
  const star = charsFavItem(it.id).direct.length ? ' <span class="favmark">★</span>' : '';
  return `<div class="cmp-row">
    <span class="cmp-label">${esc(label)}</span>
    ${itemImg(it, 'cmp-img')}
    <span class="cmp-name">${esc(it.cn)}${star}</span>
    <span class="cmp-val">${num(it.hg)} / ${num(it.hp)} / ${num(it.sa)}</span>
    <span class="cmp-perish">${ingredientPerishText(it)}</span>
  </div>`;
}
function openItemSheet(id) {
  const it = itemById(id);
  if (!it) return;
  const selfKey = { kind: 'ing', id: it.id };
  const other = it.pair ? itemById(it.pair) : null;
  const raw = it.cat === 'raw' ? it : (other && other.cat === 'raw' ? other : null);
  const cooked = it.cat === 'raw' ? other : it;
  const dishes = RECIPES.filter(r => (r.m && r.m.need && r.m.need[it.id])
    || (r.samples || []).some(s => s.includes(it.cn) || s.includes(it.en)));
  const filler = Object.keys(it.tags).map(k => `${TAG_META[k].cn} ${num(it.tags[k])}`).join(' + ');

  $('#sheet').innerHTML = `
    <div class="sheet-grip"></div>
    ${sheetTools({ kind: 'ing', id: it.id })}
    <div class="sheet-head">
      ${itemImg(it)}
      <div>
        <h2>${esc(it.cn)}</h2>
        <em>${esc(it.en)}</em>
        <div style="margin-top:6px"><span class="badge cat-${it.cat}">${LIB_CATS[it.cat].cn}</span>
        ${it.restricted ? '<span class="badge">喂牛 · 玩家不能吃</span>' : ''}</div>
      </div>
    </div>
    <div class="stats">
      <span class="stat hunger${it.hg < 0 ? ' neg' : ''}"><i class="dot"></i>饥饿 ${num(it.hg)}</span>
      <span class="stat health${it.hp < 0 ? ' neg' : ''}"><i class="dot"></i>生命 ${num(it.hp)}</span>
      <span class="stat sanity${it.sa < 0 ? ' neg' : ''}"><i class="dot"></i>理智 ${num(it.sa)}</span>
    </div>
    <p class="hint" style="margin:8px 0 0">以上是「直接吃掉」的恢复量。</p>
    <div class="sheet-sec">
      <h3>保质期</h3>
      <p class="sheet-note" style="margin:0">${ingredientPerishText(it)}。放入冰箱可延长保存时间；标注未明确的条目不作确定推断。</p>
    </div>

    <div class="sheet-sec">
      <h3>食物度（进锅用）</h3>
      <div class="kv">${tagPills(it.tags)}</div>
      ${(!dishes.length) ? `<p class="hint" style="margin:8px 0 0">通常作为「${filler}」的通用填充物使用。</p>` : ''}
    </div>

    ${(raw || cooked) ? `<div class="sheet-sec">
      <h3>生 / 熟 对比</h3>
      <div class="cmp-head"><span class="cmp-label"></span><span></span><span class="cmp-name">食材</span><span class="cmp-val">饥 / 血 / 智</span><span class="cmp-perish">保质期</span></div>
      ${raw ? compareRow('生鲜', raw) : ''}
      ${cooked ? compareRow('加工', cooked) : ''}
    </div>` : ''}

    <div class="sheet-sec">
      <h3>获取途径</h3>
      <p class="sheet-note" style="margin:0">${linkify(it.source || '资料暂缺', selfKey)}</p>
    </div>

    ${other ? `<div class="sheet-sec">
      <h3>生 / 熟关联</h3>
      <div class="kv"><button class="pill link" data-ing="${other.id}">查看${LIB_CATS[other.cat].cn}：${esc(other.cn)}</button></div>
    </div>` : ''}

    ${(() => {
      const fav = charsFavItem(it.id);
      if (!fav.direct.length && !fav.via.length) return '';
      const lines = fav.direct.map(c => `★ <b>${esc(c.cn)}</b> 的喜爱食物就是它`);
      const KIND = { raw: '生鲜版', roast: '火烤版', dry: '晾晒版', misc: '另一形态' };
      fav.via.forEach(o => {
        const favIt = itemById(o.favItem) || {};
        lines.push(`<b>${esc(o.c.cn)}</b> 喜爱的是它的${KIND[favIt.cat] || '另一形态'}「${esc(favIt.cn || '')}」`);
      });
      return `<div class="sheet-sec">
        <h3>喜爱这种食物的角色</h3>
        <div class="effbox">${lines.join('<br>')}<br>
          <span class="hint">食用喜爱食物额外 +15 饥饿。</span></div>
        ${fav.direct.length ? `<div class="kv" style="margin-top:8px">${fav.direct.map(c =>
          `<button class="pill link" data-char="${c.id}">${esc(c.cn)} →</button>`).join('')}</div>` : ''}
        ${fav.via.length ? `<div class="kv" style="margin-top:8px">${fav.via.map(o =>
          `<button class="pill link" data-ing="${o.favItem}">查看「${esc((itemById(o.favItem) || {}).cn || '')}」→</button>`).join('')}</div>` : ''}
      </div>`;
    })()}

    ${dishes.length ? `<div class="sheet-sec">
      <h3>指定要它的料理（${dishes.length}）</h3>
      <div class="kv">${dishes.map(d => `<button class="pill link" data-dish="${d.id}">${esc(d.cn)}</button>`).join('')}</div>
    </div>` : ''}

    ${it.tip ? `<div class="sheet-sec"><h3>小提示</h3><div class="effbox">${linkify(it.tip, selfKey)}</div></div>` : ''}

    <div class="sheet-sec">
      <button class="btn primary" id="putCalc">把「${esc(it.cn)}」放进计算器</button>
    </div>`;

  openPanel();
  bindSheetTools({ kind: 'ing', id: it.id });
  $('#putCalc').onclick = () => {
    if (slots.length < 4) slots.push(it.id);
    closeSheet(); gotoCalc();
    $('.slots').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  $('#sheet').querySelectorAll('[data-dish]').forEach(b => b.onclick = () => openSheet(b.dataset.dish));
  $('#sheet').querySelectorAll('[data-ing]').forEach(b => b.onclick = () => openItemSheet(b.dataset.ing));
  $('#sheet').querySelectorAll('[data-char]').forEach(b => b.onclick = () => openCharSheet(b.dataset.char));
}

/* ---------------- 生物图鉴 ---------------- */
const MOB_SEGS = [
  { id: 'all', label: '全部' },
  { id: 'boss', label: '巨兽 / Boss' },
  { id: 'hostile', label: '敌对怪物' },
  { id: 'neutral', label: '中立生物' },
  { id: 'passive', label: '被动生物' }
];
const MOB_CAT_ORDER = ['boss', 'hostile', 'neutral', 'passive'];
let mobState = { seg: 'all', kw: '' };

function renderMobSegbar() {
  $('#mobSegbar').innerHTML = MOB_SEGS.map(s =>
    `<button class="seg${mobState.seg === s.id ? ' on' : ''}" data-s="${s.id}">${s.label}</button>`).join('');
  $('#mobSegbar').querySelectorAll('.seg').forEach(b => b.onclick = () => {
    mobState.seg = b.dataset.s; renderMobSegbar(); renderMobs(); revealActiveChip('#mobSegbar');
  });
}
function mobMatchKw(m, kw) {
  if (!kw) return true;
  const hay = [m.cn, m.en, m.where, m.note, (m.drops || []).join(' '),
    m.dmg || '', m.hpText || '', MOB_CATS[m.cat].cn].join(' ').toLowerCase();
  return hay.includes(kw);
}
/* 卡片上只放简短血量，括号里的说明留在详情面板，避免撑破卡片 */
const shortText = t => String(t == null ? '' : t).replace(/（[^）]*）/g, '').trim();
/* 复合伤害（多阶段 / 多种攻击）在列表里只显示第一段主值 */
function shortDmg(m) {
  if (!m.dmg) return '—';
  let t = shortText(String(m.dmg).split(/[；;]/)[0]);
  if (t.length > 16) t = t.slice(0, 16) + '…';
  return t;
}
function mobNumbers(m) {
  const hpTxt = m.hpText ? shortText(m.hpText) : '生命 ' + num(m.hp);
  return `<div class="stats">
    <span class="stat hp"><i class="dot"></i><span class="stat-txt">${esc(hpTxt)}</span></span>
    <span class="stat dmg"><i class="dot"></i><span class="stat-txt">伤害 ${esc(shortDmg(m))}</span></span>
    ${m.atk != null ? `<span class="stat atk"><i class="dot"></i><span class="stat-txt">攻击间隔 ${esc(m.atk)} 秒</span></span>` : ''}
  </div>`;
}
/* 一级列表保持极简：只有立绘 + 名称 + 一行小字（英文 · 分类），
   生命 / 伤害 / 掉落 / 打法全部收进点开后的详情面板 */
function renderMobs() {
  const kw = mobState.kw.trim().toLowerCase();
  /* 排序控件已移除：固定按分类顺序（Boss → 敌对 → 中立 → 被动） */
  const list = MOBS.filter(m => (mobState.seg === 'all' || m.cat === mobState.seg) && mobMatchKw(m, kw))
    .slice().sort((a, b) =>
      MOB_CAT_ORDER.indexOf(a.cat) - MOB_CAT_ORDER.indexOf(b.cat) || MOBS.indexOf(a) - MOBS.indexOf(b));
  $('#mobEmpty').hidden = list.length > 0;
  $('#mobGrid').innerHTML = list.map(m => `
    <button class="mob" data-id="${m.id}">
      <div class="mob-img" style="background-image:url('${imgUrl(m.img)}')"></div>
      <div class="mob-main">
        <div class="mob-name"><h3>${esc(m.cn)}</h3></div>
        <div class="mob-sub">${esc(m.en)} · ${esc(MOB_CATS[m.cat].cn)}</div>
      </div>
      <span class="mob-arrow" aria-hidden="true">›</span>
    </button>`).join('');
  $('#mobGrid').querySelectorAll('.mob').forEach(el => el.onclick = () => openMobSheet(el.dataset.id));
}
/* 详情面板统一的来源说明。
   原来每个面板底部都挂一整段免责文字（五种不同措辞），翻几个词条就重复五遍，
   视觉上很吵。这里收敛成一行极小的灰字。 */
const SHEET_SOURCE_NOTE =
  '<p class="sheet-src">资料按官方维基的联机版词条核对（2026-09），以游戏内为准。</p>';

function openMobSheet(id) {
  const m = MOBS.find(x => x.id === id);
  if (!m) return;
  const selfKey = { kind: 'mob', id: m.id };
  const kv = [];
  kv.push(`生命值 ${m.hpText ? m.hpText : num(m.hp)}`);
  kv.push(`伤害 ${m.dmg || '—'}`);
  if (m.atk != null) kv.push(`攻击间隔 ${m.atk} 秒`);
  if (m.range != null) kv.push(`攻击范围 ${m.range}`);
  if (m.speed) kv.push(`移动速度 ${m.speed}`);
  const sanTxt = v => (typeof v === 'number' && v > 0 ? '+' + v : v);
  if (m.sanity != null) {
    kv.push(`理智光环 ${sanTxt(m.sanity)}/分${m.sanity > 0 ? '（站在旁边回理智）' : ''}`
      + (m.saneFight ? `（战斗 ${sanTxt(m.saneFight)}/分）` : ''));
  } else if (m.saneFight) kv.push(`理智光环 战斗时 ${sanTxt(m.saneFight)}/分`);

  $('#sheet').innerHTML = `
    <div class="sheet-grip"></div>
    ${sheetTools({ kind: 'mob', id: m.id })}
    <div class="sheet-head">
      <div class="dish-img" style="background-image:url('${imgUrl(m.img)}')"></div>
      <div>
        <h2>${esc(m.cn)}</h2>
        <em>${esc(m.en)}</em>
        <div style="margin-top:6px"><span class="badge cat-${m.cat}">${MOB_CATS[m.cat].cn}</span></div>
      </div>
    </div>
    ${mobNumbers(m)}
    <div class="sheet-sec">
      <h3>数值</h3>
      <div class="kv">${kv.map(t => `<span class="pill">${esc(t)}</span>`).join('')}</div>
    </div>
    <div class="sheet-sec">
      <h3>出现条件与位置</h3>
      <p class="sheet-note" style="margin:0">${linkify(m.where, selfKey)}</p>
    </div>
    <div class="sheet-sec">
      <h3>掉落物</h3>
      ${(m.drops && m.drops.length)
        ? `<div class="samples">${m.drops.map(d => `<div class="sample"><i>🎁</i><span>${linkify(d, selfKey)}</span></div>`).join('')}</div>`
        : '<p class="sheet-note" style="margin:0">没有掉落物。</p>'}
    </div>
    ${m.note ? `<div class="sheet-sec"><h3>打法与机制</h3><div class="effbox">${linkify(m.note, selfKey)}</div></div>` : ''}
    ${SHEET_SOURCE_NOTE}`;
  openPanel();
  bindSheetTools({ kind: 'mob', id: m.id });
}

/* ---------------- 角色图鉴 ----------------
   分段里最后的「居民 / NPC」是猪王、寄居蟹老奶奶这些不能玩但能互动的居民，
   数据在 NPCS（js/characters.js），卡片与详情面板和角色共用一套样式。 */
const CHAR_SEGS = [{ id: 'all', label: '全部' }]
  .concat(CHAR_TAGS.map(t => ({ id: t, label: t })))
  .concat([{ id: 'hidden', label: '隐藏角色' }, { id: 'npc', label: '居民 / NPC' }]);
let charState = { seg: 'all', kw: '' };

function renderCharSegbar() {
  $('#charSegbar').innerHTML = CHAR_SEGS.map(s =>
    `<button class="seg${charState.seg === s.id ? ' on' : ''}" data-s="${s.id}">${s.label}</button>`).join('');
  $('#charSegbar').querySelectorAll('.seg').forEach(b => b.onclick = () => {
    charState.seg = b.dataset.s; renderCharSegbar(); renderChars(); revealActiveChip('#charSegbar');
  });
}
function charMatchKw(c, kw) {
  if (!kw) return true;
  const hay = [c.cn, c.en, c.fav, c.tip, c.role, c.where, c.note,
    (c.tags || []).join(' '), (c.start || []).join(' '), (c.alias || []).join(' '),
    (c.perks || []).join(' '), (c.dis || []).join(' '),
    (c.trade || []).join(' '), (c.quests || []).join(' ')].join(' ').toLowerCase();
  return hay.includes(kw);
}
/* 三维在列表里用小标签展示 */
function charStats(c) {
  const hpTxt = c.hpText ? '—' : c.hp;
  const wurt = c.id === 'wurt';
  return `<div class="char-stats">
    <span class="s-hp"><i>生命</i>${esc(hpTxt)}${wurt ? '<em>250*</em>' : ''}</span>
    <span class="s-hg"><i>饥饿</i>${esc(c.hg)}${wurt ? '<em>250*</em>' : ''}</span>
    <span class="s-sa"><i>理智</i>${esc(c.sa)}${wurt ? '<em>200*</em>' : ''}</span>
  </div>`;
}
/* 居民卡片：一级页只放「立绘 + 名称 + 英文 · 分类」，
   交易 / 任务 / 位置 / 注意事项全部收进点开后的详情面板 */
/* 居民默认按分类分组显示：交易 → 任务 → 活动 → 小游戏 → 主线 */
function npcSorted(list) {
  return list.slice().sort((a, b) => NPC_CAT_ORDER.indexOf(a.cat) - NPC_CAT_ORDER.indexOf(b.cat));
}
function renderChars() {
  const kw = charState.kw.trim().toLowerCase();
  const pool = charState.seg === 'npc' ? npcSorted(NPCS)
    : charState.seg === 'all' ? CHARS.concat(npcSorted(NPCS)) : CHARS;
  const list = pool.filter(c =>
    (charState.seg === 'all' || charState.seg === 'npc'
      || (charState.seg === 'hidden' ? c.hidden : (c.tags || []).includes(charState.seg)))
    && charMatchKw(c, kw));
  $('#charEmpty').hidden = list.length > 0;
  $('#charGrid').innerHTML = list.map(c => {
    if (c.npc) {
      return `<button class="mob" data-id="${c.id}" data-npc="1">
        <div class="mob-img char-img" style="background-image:url('${imgUrl(c.img)}')"></div>
        <div class="mob-main">
          <div class="mob-name"><h3>${esc(c.cn)}</h3></div>
          <div class="mob-sub">${esc(c.en)} · ${esc(NPC_CATS[c.cat])}</div>
        </div>
        <span class="mob-arrow" aria-hidden="true">›</span>
      </button>`;
    }
    return `<button class="mob${c.hidden ? ' mob-hidden' : ''}" data-id="${c.id}">
      <div class="mob-img char-img" style="background-image:url('${imgUrl(c.img)}')"></div>
      <div class="mob-main">
        <div class="mob-name"><h3>${esc(c.cn)}</h3>${c.hidden ? '<span class="tag-hidden">隐藏</span>' : ''}</div>
        <div class="mob-sub">${esc(c.en)} · ${esc(c.hidden ? '被诅咒才出现' : (c.tags || []).join(' / '))}</div>
      </div>
      ${charStats(c)}
      <span class="mob-arrow" aria-hidden="true">›</span>
    </button>`;
  }).join('');
  $('#charGrid').querySelectorAll('.mob').forEach(el => el.onclick = () =>
    el.dataset.npc ? openNpcSheet(el.dataset.id) : openCharSheet(el.dataset.id));
}
/* 角色详情的「喜爱的食物」一栏 */
function favBoxHtml(c, r, after) {
  if (c.noFav) {
    return `<div class="effbox">沃利是唯一<b>没有喜爱食物</b>的角色：他没有任何食物亲和加成。</div>`;
  }
  const items = (c.favItems || []).map(itemById).filter(Boolean);
  let body;
  if (r) {
    body = `食用时饥饿 ${num(r.hg)} → <b>${num(after)}</b>（额外 +${num(Math.round((after - r.hg) * 100) / 100)} 饥饿）。`;
  } else if (items.length) {
    body = '属于<b>基础食物</b>（不用烹饪锅，直接烤 / 晒或生吃）。食用时饥饿 '
      + items.map(it => `${num(it.hg)} → <b>${num(it.hg + 15)}</b>`).join(' / ')
      + '，各额外 +15 饥饿。';
  } else {
    body = '食用时额外 +15 饥饿。';
  }
  const links = [];
  if (r) links.push(`<button class="pill link" data-dish="${r.id}">查看「${esc(r.cn)}」的配方 →</button>`);
  items.forEach(it => links.push(`<button class="pill link" data-ing="${it.id}">查看「${esc(it.cn)}」→</button>`));
  return `<div class="effbox">★ <b>${esc(c.fav)}</b>${(r && c.mul) ? ` · 亲和倍率 ×${c.mul}` : ''}<br>${body}`
    + (c.favNote ? `<br><span class="hint">${esc(c.favNote)}</span>` : '')
    + `</div>`
    + (links.length ? `<div class="kv" style="margin-top:8px">${links.join('')}</div>` : '');
}

function openCharSheet(id) {
  const c = CHARS.find(x => x.id === id);
  if (!c) return;
  const selfKey = { kind: 'char', id: c.id };
  const r = c.favId ? RECIPES.find(x => x.id === c.favId) : null;
  const after = (r && c.mul) ? Math.round(r.hg * c.mul * 100) / 100 : null;

  const kv = [];
  kv.push(`生命 ${c.hpText || c.hp}`);
  kv.push(`饥饿 ${c.hg}`);
  kv.push(`理智 ${c.sa}`);
  if (c.note) kv.push(c.note);

  $('#sheet').innerHTML = `
    <div class="sheet-grip"></div>
    ${sheetTools({ kind: 'char', id: c.id })}
    <div class="sheet-head">
      <div class="dish-img char-img" style="background-image:url('${imgUrl(c.img)}')"></div>
      <div>
        <h2>${esc(c.cn)}</h2>
        <em>${esc(c.en)}</em>
        <div style="margin-top:6px">
          ${c.hidden ? '<span class="badge badge-hidden">🕯️ 隐藏角色</span> ' : ''}
          ${(c.tags || []).map(t => `<span class="badge">${esc(t)}</span>`).join(' ')}
        </div>
      </div>
    </div>
    ${c.unlock ? `<div class="sheet-sec">
      <h3>怎么获得</h3>
      <div class="effbox unlockbox">${linkify(c.unlock, selfKey)}</div>
    </div>` : ''}
    <div class="sheet-sec">
      <h3>三维上限</h3>
      <div class="kv">${kv.map(t => `<span class="pill">${esc(t)}</span>`).join('')}</div>
    </div>
    <div class="sheet-sec">
      <h3>喜爱的食物</h3>
      ${favBoxHtml(c, r, after)}
    </div>
    <div class="sheet-sec">
      <h3>初始物品</h3>
      ${(c.start && c.start.length)
        ? `<div class="samples">${c.start.map(s => `<div class="sample"><i>🎒</i><span>${linkify(s, selfKey)}</span></div>`).join('')}</div>`
        : '<p class="sheet-note" style="margin:0">没有初始物品。</p>'}
    </div>
    <div class="sheet-sec">
      <h3>能力与特性</h3>
      <ul class="list">${(c.perks || []).map(p => `<li>${linkify(p, selfKey)}</li>`).join('')}</ul>
    </div>
    ${(c.dis && c.dis.length) ? `<div class="sheet-sec">
      <h3>缺点与限制</h3>
      <ul class="list">${c.dis.map(p => `<li>${linkify(p, selfKey)}</li>`).join('')}</ul>
    </div>` : ''}
    ${c.tip ? `<div class="sheet-sec"><h3>上手建议</h3><div class="effbox">${linkify(c.tip, selfKey)}</div></div>` : ''}
    ${(typeof CHAR_ITEMS !== 'undefined' && CHAR_ITEMS[c.id] && CHAR_ITEMS[c.id].length) ? `<div class="sheet-sec">
      <h3>专属物品</h3>
      <div class="kv"><button class="pill link" data-citems="${c.id}">查看 ${esc(c.cn)} 的专属物品（${CHAR_ITEMS[c.id].length} 项）→</button></div>
    </div>` : ''}
    ${SHEET_SOURCE_NOTE}`;

  openPanel();
  bindSheetTools({ kind: 'char', id: c.id });
  $('#sheet').querySelectorAll('[data-dish]').forEach(b => b.onclick = () => openSheet(b.dataset.dish));
  $('#sheet').querySelectorAll('[data-ing]').forEach(b => b.onclick = () => openItemSheet(b.dataset.ing));
  $('#sheet').querySelectorAll('[data-citems]').forEach(b => b.onclick = () => {
    closeSheet();
    switchView('view-items');
    itemState.filter = 'survivor';
    itemState.char = b.dataset.citems;
    itemState.kw = '';
    const s = $('#itemSearch'); if (s) s.value = '';
    renderItemCrumb(); renderItems();
  });
}
/* ---------------- 居民 / NPC 详情 ---------------- */
function openNpcSheet(id) {
  const n = NPCS.find(x => x.id === id);
  if (!n) return;
  const selfKey = { kind: 'npc', id: n.id };
  const listSec = (title, items, icon) => (items && items.length)
    ? `<div class="sheet-sec"><h3>${esc(title)}</h3><div class="samples">${items.map(t =>
        `<div class="sample"><i>${icon}</i><span>${linkify(t, selfKey)}</span></div>`).join('')}</div></div>`
    : '';
  $('#sheet').innerHTML = `
    <div class="sheet-grip"></div>
    ${sheetTools({ kind: 'npc', id: n.id })}
    <div class="sheet-head">
      <div class="dish-img char-img" style="background-image:url('${imgUrl(n.img)}')"></div>
      <div>
        <h2>${esc(n.cn)}</h2>
        <em>${esc(n.en)}</em>
        <div style="margin-top:6px">
          <span class="badge npc-cat-${n.cat}">${esc(NPC_CATS[n.cat])}</span>
          <span class="badge">居民 / NPC</span>
        </div>
      </div>
    </div>
    <div class="sheet-sec">
      <h3>它 / 她是干嘛的</h3>
      <p class="sheet-note" style="margin:0">${linkify(n.role || '—', selfKey)}</p>
    </div>
    <div class="sheet-sec">
      <h3>位置与出现方式</h3>
      <p class="sheet-note" style="margin:0">${linkify(n.where || '—', selfKey)}</p>
    </div>
    ${listSec('交易 / 给予明细', n.trade, '💰')}
    ${listSec('任务与事件流程', n.quests, '📋')}
    ${n.note ? `<div class="sheet-sec"><h3>机制与注意事项</h3><div class="effbox">${linkify(n.note, selfKey)}</div></div>` : ''}
    ${n.tip ? `<div class="sheet-sec"><h3>实用建议</h3><div class="effbox">${linkify(n.tip, selfKey)}</div></div>` : ''}
    ${n.mob ? `<div class="sheet-sec">
      <button class="pill link" data-mob="${n.mob}">查看生物图鉴里的战斗数值 →</button>
    </div>` : ''}
    <div class="sheet-sec">
      <p class="sheet-note" style="margin:0">NPC 不能作为角色游玩，也没有三维；资料按官方维基的联机版词条核对（2026-09）。</p>
    </div>`;
  openPanel();
  bindSheetTools({ kind: 'npc', id: n.id });
  $('#sheet').querySelectorAll('[data-mob]').forEach(b => b.onclick = () => openMobSheet(b.dataset.mob));
}

/* ============================================================
   物品 · 制作图鉴（对齐游戏内的「制作」筛选栏）
   三层导航：制作分类 → （冒险家物品还要先选角色）→ 物品 → 详情
   ============================================================ */
const craftFilter = id => ITEM_FILTERS.find(f => f.id === id);
const craftItem = id => ITEMS.find(i => i.id === id);
let itemState = { filter: null, char: null, kw: '' };

/* 某分类下的物品（按 ITEMS 顺序） */
function filterItems(fid) {
  return ITEMS.filter(i => i.filters.includes(fid));
}
function charItems(cid) {
  return (CHAR_ITEMS[cid] || []).map(craftItem).filter(Boolean);
}
/* 配方里材料的数量：1 个的按游戏里不写数量 */
function matLabel(name, cnt) {
  return name + (cnt && String(cnt) !== '1' ? ' ×' + cnt : '');
}
function itemRecipeText(it) {
  if (!it.recipe || !it.recipe.length) return '不可制作（只能采集 / 掉落 / 交易获得）';
  return it.recipe.map(r => matLabel(r[0], r[1])).join(' + ');
}
const PROTOTYPERS = new Set([
  '科学机器', '炼金引擎', '灵子分解器', '暗影操纵者', '智囊团', '钓具容器',
  '大地夯具', '木工马', '书架'
]);
const SKILL_EN = {
  '转化': 'Transmutation',
  '转化矿石 I': 'Transmute Ore I', '转化矿石 II': 'Transmute Ore II', '转化矿石 III': 'Transmute Ore III',
  '转化宝石 I': 'Transmute Gems I', '转化宝石 II': 'Transmute Gems II', '转化宝石 III': 'Transmute Gems III',
  '转化秽物 I': 'Transmute Icky I', '转化秽物 II': 'Transmute Icky II', '转化秽物 III': 'Transmute Icky III',
  '暗影侍臣': 'Shadow Courtier', '月之革新者': 'Lunar Innovator'
};
function itemConditionInfo(it) {
  if (!it.recipe || !it.recipe.length) {
    return { title: '制作条件', text: '不可制作；这件物品只能在世界里采集、打怪掉落或和 NPC 交易获得。' };
  }
  if (it.alch && !it.station) {
    return { title: '威尔逊炼金转化',
      text: `不是靠科学机器一类原理解锁的常规配方，而是威尔逊专属的炼金转化：学会技能「${it.alch.skill}」后，在制作栏「冒险家物品 → 威尔逊」里转化。` };
  }
  if (!it.station) return { title: '制作条件', text: '未记录。这里不推断为徒手、开局可制作或无需科技，请以游戏内配方显示为准。' };
  if (PROTOTYPERS.has(it.station)) {
    return { title: '原型科技解锁', text: `首次解锁需在${it.station}旁原型；原型解锁后通常可在任意地点制作。` };
  }
  return { title: '专用制作站', text: `需使用${it.station}制作；此类条件与科学机器等原型解锁分开标注。` };
}
/* 威尔逊炼金转化：技能 / 来源 / 每次产出（数据见 js/items.js 的 alch 字段） */
function alchSection(it) {
  const a = it.alch;
  if (!a) return '';
  const en = SKILL_EN[a.skill] || '';
  const from = a.from || (it.recipe || []).map(([n, c]) => matLabel(n, c)).join(' + ');
  const out = a.out && a.out > 1 ? `，每次产出 ${a.out} 个` : '';
  return `<div class="sheet-sec">
    <h3>威尔逊炼金转化</h3>
    <div class="effbox">
      <b>${esc(a.skill)}${en ? `（${esc(en)}）` : ''}</b> · 仅威尔逊可用<br>
      用 ${linkify(from, { kind: 'item', id: it.id })} 转化而来${out}。
      <br><span class="hint">炼金技能在威尔逊技能树里逐级解锁：转化 → 转化矿石 / 转化宝石 / 转化秽物（I → II → III）；「暗影侍臣」与「月之革新者」是亲和技能，需要先击败远古织影者 / 天体英雄，并且已解锁共 12 个技能。</span>
    </div>
  </div>`;
}
function itemStationText(it) {
  return itemConditionInfo(it).text;
}
function itemMatchKw(it, kw) {
  if (!kw) return true;
  const hay = [it.cn, it.en, itemRecipeText(it), it.station, it.desc,
    it.filters.map(f => (craftFilter(f) || {}).cn).join(' ')].join(' ').toLowerCase();
  return hay.includes(kw);
}
/* 面包屑：物品 › 冒险家物品 › 威尔逊 */
function renderItemCrumb() {
  const box = $('#itemsCrumb');
  const f = itemState.filter ? craftFilter(itemState.filter) : null;
  if (!f) { box.hidden = true; box.innerHTML = ''; return; }
  const parts = [`<button class="crumb-item" data-go="root">物品</button>`];
  parts.push(`<button class="crumb-item" data-go="filter">${esc(f.cn)}</button>`);
  if (itemState.char) {
    parts.push(`<button class="crumb-item on" data-go="char">${esc(CHAR_ITEM_NAMES[itemState.char] || '')}</button>`);
  }
  box.hidden = false;
  box.innerHTML = parts.join('<i>›</i>');
  box.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
    if (b.dataset.go === 'root') { itemState.filter = null; itemState.char = null; itemState.kw = ''; }
    else if (b.dataset.go === 'filter') { itemState.char = null; }
    renderItemCrumb(); renderItems();
  });
}
function renderItems() {
  const kw = itemState.kw.trim().toLowerCase();
  const grid = $('#itemsGrid');
  $('#itemsEmpty').hidden = true;

  /* 有搜索词时：跨全部 45 个分类搜，不再要求先点分类。
     （否则用户在分类总览页输入关键词会毫无反应。） */
  if (kw && !itemState.filter) {
    const hits = ITEMS.filter(it => itemMatchKw(it, kw));
    $('#itemsEmpty').hidden = hits.length > 0;
    $('#itemsEmpty').textContent = '没有匹配的物品，换个关键词试试。';
    grid.className = 'mob-grid';
    grid.innerHTML = hits.slice(0, 200).map(it => `
      <button class="mob" data-i="${it.id}">
        ${it.img
          ? `<div class="mob-img" style="background-image:url('${imgUrl(it.img)}')"></div>`
          : `<div class="mob-img noimg"><i>${esc((it.cn || it.en || '?').slice(0, 1))}</i></div>`}
        <div class="mob-main">
          <div class="mob-name"><h3>${esc(it.cn)}</h3></div>
          <div class="mob-sub">${esc(it.en)} · ${(it.filters || []).map(f => (craftFilter(f) || {}).cn || '').filter(Boolean).slice(0, 2).join(' / ')}</div>
        </div>
        <span class="mob-arrow" aria-hidden="true">›</span>
      </button>`).join('');
    grid.querySelectorAll('.mob').forEach(el => el.onclick = () => openCraftItemSheet(el.dataset.i));
    const tip = $('#itemMoreTip');
    if (hits.length > 200) {
      if (tip) tip.textContent = `匹配 ${hits.length} 项，只显示前 200 项，请补充关键词缩小范围。`;
      else grid.insertAdjacentHTML('afterend',
        `<p class="hint" id="itemMoreTip">匹配 ${hits.length} 项，只显示前 200 项，请补充关键词缩小范围。</p>`);
    } else if (tip) {
      tip.remove();
    }
    return;
  }
  const staleTip = $('#itemMoreTip'); if (staleTip) staleTip.remove();

  /* 第 1 层：制作分类 */
  if (!itemState.filter) {
    grid.className = 'filter-grid';
    grid.innerHTML = ITEM_FILTERS.map(f => {
      const n = f.kind === 'char'
        ? CHAR_ITEM_ORDER.filter(c => charItems(c).length).length + ' 位角色'
        : filterItems(f.id).length + ' 项';
      const empty = f.kind !== 'char' && filterItems(f.id).length === 0;
      return `<button class="fcard${empty ? ' fcard-empty' : ''}" data-f="${f.id}">
        <div class="fcard-img" style="background-image:url('${imgUrl(f.icon)}')"></div>
        <div class="fcard-txt">
          <b>${esc(f.cn)}</b>
          <em>${esc(f.en)} · ${esc(empty ? '制作站分页' : n)}</em>
        </div>
      </button>`;
    }).join('');
    grid.querySelectorAll('.fcard').forEach(el => el.onclick = () => {
      itemState.filter = el.dataset.f;
      itemState.char = null;
      renderItemCrumb(); renderItems();
    });
    return;
  }

  const f = craftFilter(itemState.filter);

  /* 第 2 层（冒险家物品）：先选角色 */
  if (f.kind === 'char' && !itemState.char) {
    const chars = CHAR_ITEM_ORDER.filter(c => charItems(c).length);
    grid.className = 'filter-grid';
    grid.innerHTML = chars.map(c => {
      const ch = charById(c) || {};
      const img = ch.img || ('char_' + c + '.png');
      return `<button class="fcard" data-c="${c}">
        <div class="fcard-img char" style="background-image:url('${imgUrl(img)}')"></div>
        <div class="fcard-txt">
          <b>${esc(CHAR_ITEM_NAMES[c] || c)}</b>
          <em>${esc((ch.en || c))} · ${charItems(c).length} 项</em>
        </div>
      </button>`;
    }).join('');
    grid.querySelectorAll('.fcard').forEach(el => el.onclick = () => {
      itemState.char = el.dataset.c;
      renderItemCrumb(); renderItems();
    });
    return;
  }

  /* 第 3 层：物品列表 */
  let list = itemState.char ? charItems(itemState.char) : filterItems(itemState.filter);
  list = list.filter(it => itemMatchKw(it, kw));
  $('#itemsEmpty').hidden = list.length > 0;
  const catInfo = craftFilter(itemState.filter);
  $('#itemsEmpty').textContent = itemState.char
    ? (CHAR_ITEM_NAMES[itemState.char] || '') + ' 的专属物品还没有收录。'
    : (kw ? '这一栏里没有匹配「' + itemState.kw.trim() + '」的物品。'
          : (catInfo && catInfo.note) || '这个分类还没有收录物品。');
  grid.className = 'mob-grid';
  grid.innerHTML = list.map(it => `
    <button class="mob" data-i="${it.id}">
      ${it.img
        ? `<div class="mob-img" style="background-image:url('${imgUrl(it.img)}')"></div>`
        : `<div class="mob-img noimg"><i>${esc((it.cn || it.en || '?').slice(0, 1))}</i></div>`}
      <div class="mob-main">
        <div class="mob-name"><h3>${esc(it.cn)}</h3></div>
        <div class="mob-sub">${esc(it.en)}</div>
      </div>
      <span class="mob-arrow" aria-hidden="true">›</span>
    </button>`).join('');
  grid.querySelectorAll('.mob').forEach(el => el.onclick = () => openCraftItemSheet(el.dataset.i));
}
/* 制作图鉴物品详情：配方 / 制作站 / 中文简介 / 所属分类 */
function openCraftItemSheet(id) {
  const it = craftItem(id);
  if (!it) return;
  const faceted = it.filters.map(f => craftFilter(f)).filter(Boolean);
  const mats = (it.recipe || []).map(([name, cnt]) => {
    const label = esc(matLabel(name, cnt));
    const material = typeof MATERIALS !== 'undefined'
      ? MATERIALS.find(m => m.cn === name || (m.alias || []).includes(name)) : null;
    if (material) return `<button class="pill link" data-matref="${material.id}">${label}</button>`;
    const hit = ITEMS.find(x => x.cn === name || x.en === name || (x.alias || []).includes(name));
    if (hit) return `<button class="pill link" data-mat="${hit.id}">${label}</button>`;
    const ingredient = typeof LIB_ITEMS !== 'undefined'
      ? LIB_ITEMS.find(x => x.cn === name || x.en === name || (x.alias || []).includes(name)) : null;
    if (ingredient) return `<button class="pill link" data-ingref="${ingredient.id}">${label}</button>`;
    /* 配方材料也可能是料理锅菜（如小动物要的「辣椒炖肉」「太妃糖」） */
    const dish = typeof RECIPES !== 'undefined'
      ? RECIPES.find(x => x.cn === name || x.en === name || (x.alias || []).includes(name)) : null;
    if (dish) return `<button class="pill link" data-dishref="${dish.id}">${label}</button>`;
    /* 单字名（草 / 冰 / 丝 / 蛋…）按精确匹配再兜一次，避免被 LINK_MIN_LEN 漏掉 */
    const shortMat = typeof MATERIALS !== 'undefined'
      ? MATERIALS.find(m => m.cn === name || (m.alias || []).includes(name)) : null;
    if (shortMat) return `<button class="pill link" data-matref="${shortMat.id}">${label}</button>`;
    /* 配方里也可能直接写活体生物（蜜蜂 / 兔子 / 萤火虫 / 月蛾…）当作材料 */
    const mob = typeof MOBS !== 'undefined'
      ? MOBS.find(x => x.cn === name || x.en === name || (x.alias || []).includes(name)
          || linkMainName(x) === name) : null;
    if (mob) return `<button class="pill link" data-mob="${mob.id}">${label}</button>`;
    const target = typeof LINK_TARGETS !== 'undefined' ? LINK_TARGETS.get(name) : null;
    return target
      ? `<button class="pill link" data-link="${target.kind}|${target.cat || ''}|${target.id}">${label}</button>`
      : `<span class="pill" data-missing-recipe-link="${esc(name)}">${label}</span>`;
  }).join('');
  $('#sheet').innerHTML = `
    <div class="sheet-grip"></div>
    ${sheetTools({ kind: 'item', id: it.id })}
    <div class="sheet-head">
      <div class="dish-img" style="background-image:url('${imgUrl(it.img)}')"></div>
      <div>
        <h2>${esc(it.cn)}</h2>
        <em>${esc(it.en)}</em>
        <div style="margin-top:6px">
          ${faceted.map(f => `<button class="badge badge-btn" data-gofilter="${f.id}">${esc(f.cn)}</button>`).join(' ')}
        </div>
      </div>
    </div>
    <div class="sheet-sec">
      <h3>配方</h3>
      ${it.recipe && it.recipe.length
        ? `<div class="kv">${mats}</div>`
        : '<p class="sheet-note" style="margin:0">这件物品不能制作，只能在世界里采集、打怪掉落或和 NPC 交易获得。</p>'}
    </div>
    <div class="sheet-sec">
      <h3>${esc(itemConditionInfo(it).title)}</h3>
      <p class="sheet-note" style="margin:0">${esc(itemStationText(it))}</p>
      ${(!it.alch && it.recipe && it.recipe.length) ? '<p class="hint" style="margin:8px 0 0">解锁条件与实际制作地点并不总是相同：普通原型科技解锁后通常可在任意地点制作；专用制作站则通常每次制作都要在该站完成。</p>' : ''}
    </div>
    ${alchSection(it)}
    ${matRefSection(it)}
    ${it.desc ? `<div class="sheet-sec"><h3>说明</h3><div class="effbox">${esc(it.desc)}</div></div>` : ''}
    ${SHEET_SOURCE_NOTE}`;
  openPanel();
  bindSheetTools({ kind: 'item', id: it.id });
  $('#sheet').querySelectorAll('[data-mat]').forEach(b => b.onclick = () => openCraftItemSheet(b.dataset.mat));
  $('#sheet').querySelectorAll('[data-matref]').forEach(b => b.onclick = () => openMatSheet(b.dataset.matref));
  $('#sheet').querySelectorAll('[data-ingref]').forEach(b => b.onclick = () => openItemSheet(b.dataset.ingref));
  $('#sheet').querySelectorAll('[data-dishref]').forEach(b => b.onclick = () => {
    switchView('view-cook'); switchCookSeg('dishes'); openSheet(b.dataset.dishref);
  });
  $('#sheet').querySelectorAll('[data-link]').forEach(b => b.onclick = () => {
    const [kind, cat, targetId] = b.dataset.link.split('|');
    openLinked(kind, cat, targetId);
  });
  $('#sheet').querySelectorAll('[data-gofilter]').forEach(b => b.onclick = () => {
    itemState.filter = b.dataset.gofilter;
    itemState.char = null;
    itemState.kw = '';
    const s = $('#itemSearch'); if (s) s.value = '';
    closeSheet();
    switchView('view-items');
    renderItemCrumb(); renderItems();
  });
}

/* ---------------- 词条自动链接 ----------------
   索引在启动时按现有数据自动生成：以后往任何数据文件里加条目，
   只要它有 cn 名称，就自动变成可点击链接，不需要额外配置。
   新增一个模块时，只需在 LINK_SOURCES 里加一行描述。 */
const LINK_MIN_LEN = 2;                 /* 少于 2 个字的名称不参与链接，避免「花」「鱼」这类误伤 */
/* 这些词是通用名词而不是词条名，一旦被注册成链接目标，正文里到处都会被串成链接。
   典型来源：条目的括号补充说明（「冰箱陷阱（冬季）」里的「冬季」）。 */
const LINK_BLOCKED = new Set([
  '冬季', '夏季', '春季', '秋季', '秋天', '地上', '地下', '地表', '洞穴', '海洋',
  '联机版', '单机版', '活动', '限定', '安全', '危险', '稀有', '常见', '事件', '普通',
  '世界', '角色', '生物', '资源', '材料', '制作', '环境', '天气', '分类'
]);
/* 名称 = 括号前的主名；括号里的内容（如「独眼巨鹿（鹿角怪）」里的「鹿角怪」）自动作为别名 */
const linkMainName = e => String(e.cn || '').split(/[（(]/)[0].trim();
function linkAliases(e) {
  const out = [];
  const m = String(e.cn || '').match(/[（(][^）)]*[）)]/g) || [];
  m.forEach(part => part.slice(1, -1).split(/[\/、,，]/).forEach(x => {
    const t = x.trim();
    if (t) out.push(t);
  }));
  return (e.alias || []).concat(out);
}
const LINK_SOURCES = [
  /* 材料放最前：「木头 / 猪皮 / 触手皮」这类名字优先指向「资源」页，
     那里有获取方式 + 用途汇总，页内再跳转到「制作」页看配方。 */
  { kind: 'material', list: () => MATERIALS, alias: e => e.alias },
  { kind: 'dish',  list: () => RECIPES,   alias: e => e.alias },
  { kind: 'ing',   list: () => LIB_ITEMS, alias: e => e.alias },
  { kind: 'mob',   list: () => MOBS },
  { kind: 'item',  list: () => ITEMS },
  { kind: 'char',  list: () => CHARS },
  { kind: 'npc',   list: () => NPCS, alias: e => e.alias },
  { kind: 'world', list: () => WORLD },
  { kind: 'setpiece', list: () => SETPIECES }
];
let LINK_TARGETS = new Map();   /* 名称 -> { kind, id, cat } */
let LINK_MAP = new Map();       /* 首字 -> [名称...]（长词优先） */
function buildLinkIndex() {
  LINK_TARGETS = new Map();
  const add = (term, kind, e) => {
    const t = String(term == null ? '' : term).trim();
    if (t.length < LINK_MIN_LEN || LINK_BLOCKED.has(t) || LINK_TARGETS.has(t)) return;
    LINK_TARGETS.set(t, { kind, id: e.id, cat: e.cat });
  };
  /* 先注册主名，再注册别名 —— 保证主名的优先级更高 */
  LINK_SOURCES.forEach(src => (src.list() || []).forEach(e => add(linkMainName(e), src.kind, e)));
  LINK_SOURCES.forEach(src => (src.list() || []).forEach(e => {
    const al = src.alias ? src.alias(e) : null;
    (al || []).forEach(a => add(a, src.kind, e));
    linkAliases(e).forEach(a => add(a, src.kind, e));
  }));
  /* 「灯泡虫」是球状光虫的常用名；生物掉落/来源信息优先于同名可捕获物条目。 */
  const lightbug = MOBS.find(e => e.id === 'lightbug');
  if (lightbug) LINK_TARGETS.set('灯泡虫', { kind: 'mob', id: lightbug.id, cat: lightbug.cat });
  LINK_MAP = new Map();
  LINK_TARGETS.forEach((v, t) => {
    const k = t[0];
    if (!LINK_MAP.has(k)) LINK_MAP.set(k, []);
    LINK_MAP.get(k).push(t);
  });
  /* 同一个首字下按长度倒序：先试最长的词，避免「大肉」抢先命中「大肉干」 */
  LINK_MAP.forEach(arr => arr.sort((a, b) => b.length - a.length));
}
/* 把一段文字里的词条名替换成可点击链接；selfKey 用来避免「自己链自己」 */
function linkify(text, selfKey) {
  const src = String(text == null ? '' : text);
  if (!src || !LINK_MAP.size) return esc(src);
  let out = '', i = 0;
  while (i < src.length) {
    const cands = LINK_MAP.get(src[i]);
    let hit = null;
    if (cands) {
      for (const term of cands) {
        if (src.startsWith(term, i)) { hit = term; break; }
      }
    }
    if (!hit) { out += esc(src[i]); i += 1; continue; }
    const tgt = LINK_TARGETS.get(hit);
    const isSelf = selfKey && tgt.kind === selfKey.kind && tgt.id === selfKey.id;
    if (isSelf) {
      out += esc(hit);                       /* 自己：原样输出，并整词跳过，避免再匹配到更短的词 */
    } else {
      out += `<button type="button" class="xlink" data-link="${tgt.kind}|${tgt.cat || ''}|${tgt.id}">${esc(hit)}</button>`;
    }
    i += hit.length;
  }
  return out;
}
/* 点击链接 → 打开对应词条 */
function openLinked(kind, cat, id) {
  const exists = kind === 'dish' ? RECIPES.some(x => x.id === id)
    : kind === 'ing' ? LIB_ITEMS.some(x => x.id === id)
    : kind === 'item' ? ITEMS.some(x => x.id === id)
    : kind === 'material' ? MATERIALS.some(x => x.id === id)
    : kind === 'mob' ? MOBS.some(x => x.id === id)
    : kind === 'char' ? CHARS.some(x => x.id === id)
    : kind === 'npc' ? NPCS.some(x => x.id === id)
    : kind === 'world' ? WORLD.some(x => x.cat === cat && x.id === id) : false;
  if (!exists) return;
  if (kind === 'dish') openSheet(id);
  else if (kind === 'ing') openItemSheet(id);
  else if (kind === 'item') openCraftItemSheet(id);
  else if (kind === 'material') openMatSheet(id);
  else if (kind === 'mob') openMobSheet(id);
  else if (kind === 'char') openCharSheet(id);
  else if (kind === 'npc') openNpcSheet(id);
  else if (kind === 'world') openWorldSheet(cat, id);
}

/* ---------------- 可访问性辅助 ---------------- */
/* 屏幕阅读器播报（视觉上不可见） */
function announce(msg) {
  const el = document.getElementById('liveRegion');
  if (el) el.textContent = msg;
}
/* 记住打开面板前的焦点元素，关闭时还回去，避免键盘用户「掉到页面顶部」 */
let lastFocused = null;
function rememberFocus() {
  lastFocused = document.activeElement;
}
function restoreFocus() {
  if (lastFocused && typeof lastFocused.focus === 'function') {
    try { lastFocused.focus({ preventScroll: true }); } catch (e) {}
  }
  lastFocused = null;
}
/* 让列表支持方向键上下移动（每张卡片本身是 <button>，天然可 Tab 到）。
   这里补的是「进入列表后用 ↑↓ 快速浏览」的手感。 */
function installListKeyboard() {
  const GRIDS = ['#grid', '#libGrid', '#mobGrid', '#charGrid', '#itemsGrid',
    '#resourceGrid', '#envGrid', '#favGrid'];
  GRIDS.forEach(sel => {
    const grid = $(sel);
    if (!grid || grid.__kbd) return;
    grid.__kbd = true;
    grid.addEventListener('keydown', e => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' &&
          e.key !== 'Home' && e.key !== 'End') return;
      const items = Array.from(grid.querySelectorAll('.mob, .fcard, .dish'));
      if (!items.length) return;
      const cur = items.indexOf(document.activeElement);
      let next = cur;
      if (e.key === 'ArrowDown') next = cur < 0 ? 0 : Math.min(items.length - 1, cur + 1);
      else if (e.key === 'ArrowUp') next = cur <= 0 ? 0 : cur - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;
      if (next !== cur || cur < 0) {
        e.preventDefault();
        items[next].focus();
        items[next].scrollIntoView({ block: 'nearest' });
      }
    });
  });
}

/* ---------------- 面板 ---------------- */
let sheetScrollLock = null;
/* 面板头部右上角的三颗工具按钮：分享 / 收藏 / 关闭。
   抽出来是因为 9 个详情面板都要用，避免各写一遍。 */
function sheetTools(entry) {
  const faved = entry && typeof isFaved === 'function' ? isFaved(entry) : false;
  return `<div class="sheet-tools">
    <button class="tool-btn" id="shareBtn" type="button" title="复制这个词条的链接" aria-label="复制链接">🔗</button>
    <button class="tool-btn${faved ? ' on' : ''}" id="favBtn" type="button"
      title="${faved ? '取消收藏' : '收藏这个词条'}" aria-label="收藏">${faved ? '★' : '☆'}</button>
    <button class="close-x" id="sheetClose" type="button" aria-label="关闭">×</button>
  </div>
  <span class="share-tip" id="shareTip" hidden></span>`;
}
/* 绑定工具按钮（每个 open*Sheet 末尾调用一次） */
function bindSheetTools(entry) {
  const sb = $('#shareBtn');
  if (sb) sb.onclick = () => copyCurrentLink();
  const fb = $('#favBtn');
  if (fb) fb.onclick = () => {
    if (!entry) return;
    const on = toggleFav(entry);
    fb.textContent = on ? '★' : '☆';
    fb.classList.toggle('on', on);
    fb.title = on ? '取消收藏' : '收藏这个词条';
    renderFavCount();
    /* 如果此刻正停在收藏页（例如从收藏里点进词条再取消收藏），
       列表要跟着更新，否则会出现「徽标变了但列表还是旧的」 */
    if (document.querySelector('.view.active') &&
        document.querySelector('.view.active').id === 'view-fav') renderFavs();
    const tip = $('#shareTip');
    if (tip) { tip.textContent = on ? '已加入收藏' : '已取消收藏'; tip.hidden = false;
      clearTimeout(bindSheetTools._t); bindSheetTools._t = setTimeout(() => { tip.hidden = true; }, 1500); }
  };
  const cb = $('#sheetClose');
  if (cb) cb.onclick = closeSheet;
}
/* 底部导航上的收藏计数徽标 */
function renderFavCount() {
  const badge = $('#favBadge');
  if (!badge) return;
  const n = loadFavs().length;
  badge.textContent = n > 99 ? '99+' : String(n);
  badge.hidden = n === 0;
}
function openPanel() {
  if ($('#sheet').hidden) rememberFocus();
  $('#sheetMask').hidden = false;
  $('#sheet').hidden = false;
  if (!sheetScrollLock) {
    const body = document.body;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    sheetScrollLock = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = 'hidden';
    if (scrollbarWidth) body.style.paddingRight = `calc(${sheetScrollLock.paddingRight || '0px'} + ${scrollbarWidth}px)`;
  }
  $('#sheet').scrollTop = 0;
  $('#sheetMask').onclick = closeSheet;
  /* 焦点移进面板，方便键盘用户直接滚动 / Esc 关闭 */
  const sheet = $('#sheet');
  sheet.setAttribute('tabindex', '-1');
  try { sheet.focus({ preventScroll: true }); } catch (e) {}
}
/* 把 Tab 焦点限制在面板内（模态对话框的标准行为） */
function trapFocus(e) {
  if ($('#sheet').hidden || e.key !== 'Tab') return;
  const focusables = $('#sheet').querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function closeSheet() {
  const wasOpen = !$('#sheet').hidden;
  $('#sheetMask').hidden = true;
  $('#sheet').hidden = true;
  if (sheetScrollLock) {
    document.body.style.overflow = sheetScrollLock.overflow;
    document.body.style.paddingRight = sheetScrollLock.paddingRight;
    sheetScrollLock = null;
  }
  /* 通知路由把 URL 退回「只剩当前页」（见 js/router.js 的 onSheetClosed） */
  if (wasOpen && typeof onSheetClosed === 'function') onSheetClosed();
  if (wasOpen) restoreFocus();
}

/* ---------------- 底部导航 ---------------- */
/* ---------------- 页面背景：官方载入画面 ----------------
   每个一级页对应「专属」的一张底图（只此一层，不叠第二张，避免重影）。
   注意：每页的图不能重复，否则切 tab 时看起来像「背景没换」。
   共有 6 张底图 / 6 个页面，正好一对一。 */
const PAGE_BG = {
  'view-cook': 'art_bg_marsh.jpg',
  'view-mobs': 'art_bg_terrors.jpg',
  'view-items': 'art_bg_overture.jpg',
  'view-env': 'art_bg_weather.jpg',
  'view-resources': 'art_bg_from_beyond.jpg',
  'view-chars': 'art_bg_never_alone.jpg'
};
function applyHero(viewId) {
  const file = PAGE_BG[viewId];
  if (!file) return;
  /* 关键：这个 URL 是写进 CSS 变量 --bg-art、由 css/style.css 消费的，
     而 CSS 里的相对 URL 是相对「样式表所在目录」解析的，不是相对文档。
     所以这里必须用 ../images/ 而不是 imgUrl() 返回的 images/。
     之前用裸路径，浏览器去请求 /css/images/art_bg_marsh.jpg，一直 404，
     页面底图其实从来没有显示出来过。 */
  let url;
  if (window.DST_IMG_DATA && window.DST_IMG_DATA[file]) {
    url = window.DST_IMG_DATA[file];          /* 单文件版：base64，绝对可用 */
  } else {
    /* 先算出站点根（document.baseURI 去掉末尾文件名），再拼 images/。
       这样 /、/dst-wiki/（GitHub Pages 子路径）、file:// 都能正确解析。
       曾经写死 '../images/'，在根路径下侥幸正确，但在 /dst-wiki/ 下会
       跳出去变成 https://user.github.io/images/... → 404。 */
    const base = document.baseURI.replace(/[^/]*$/, '');
    url = new URL('images/' + file, base).href;
  }
  document.body.style.setProperty('--bg-art', `url("${url}")`);
  document.body.dataset.view = viewId;
}

function switchView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === id));
  applyHero(id);
  window.scrollTo({ top: 0 });
  /* 收藏夹的内容要现算：URL 里已经是 #/fav 时 hash 不变、hashchange 不会触发，
     只靠路由回调会导致「点进收藏页却是空的」。这里直接渲染。 */
  if (id === 'view-fav') renderFavs();
  /* 切页时同步 URL */
  if (typeof pushRoute === 'function' && typeof routeApplying !== 'undefined' && !routeApplying) {
    if (id === 'view-fav') pushRoute(id, 'fav', null, 'fav');
    else pushRoute(id, null, null, null);
  }
}
document.querySelectorAll('.tab').forEach(t => t.onclick = () => switchView(t.dataset.view));

/* ---------------- 烹饪计算器 ---------------- */
let slots = [];
let showWarly = false;   /* 是否把沃利专属料理（便携烹饪锅）也算进来 */
const CURATED = [
  ['meat_big', 'berries', 'berries', 'berries'],
  ['meat_big', 'meat_big', 'egg', 'egg'],
  ['monster_meat', 'meat_big', 'egg', 'egg'],
  ['berries', 'berries', 'berries', 'berries'],
  ['honey', 'honey', 'honey', 'berries'],
  ['ice', 'butter', 'honey', 'berries'],
  ['dragonfruit', 'berries', 'berries', 'berries'],
  ['potato', 'potato', 'garlic', 'berries'],
  ['fish', 'fish', 'meat_big', 'meat_big'],
  ['meat_big', 'onion', 'tomato', 'fish'],
  ['corn', 'honey', 'twigs', 'ice'],
  ['eel', 'kelp', 'berries', 'berries'],
  ['twigs', 'twigs', 'twigs', 'birchnut'],
  ['butterfly_wing', 'carrot', 'berries', 'berries'],
  ['leafy_meat', 'honey', 'honey', 'berries']
];
function slotName(id) { const it = itemById(id); return it ? it.cn : id; }

function renderSlots() {
  let html = '';
  for (let i = 0; i < 4; i++) {
    const id = slots[i];
    html += id
      ? `<div class="slot filled" data-i="${i}"><span class="rm">×</span><span>${esc(slotName(id))}</span></div>`
      : `<div class="slot"><span>锅位 ${i + 1}</span></div>`;
  }
  $('#slots').innerHTML = html;
  $('#slots').querySelectorAll('.slot.filled .rm').forEach(el => {
    el.onclick = e => { e.stopPropagation(); slots.splice(+el.closest('.slot').dataset.i, 1); updateCalc(); };
  });
}
function sums() {
  const t = {}, cnt = {};
  slots.forEach(id => {
    const it = itemById(id);
    if (!it) return;
    cnt[id] = (cnt[id] || 0) + 1;
    for (const k in it.tags) t[k] = (t[k] || 0) + it.tags[k];
  });
  return { t, cnt };
}
function renderTagSum() {
  const { t } = sums();
  const keys = TAG_ORDER.filter(k => t[k]);
  $('#tagSum').innerHTML = keys.length
    ? keys.map(k => `<span class="pill" style="color:${TAG_META[k].color};border-color:${TAG_META[k].color}66">
        ${TAG_META[k].cn} ${num(Math.round(t[k] * 100) / 100)}</span>`).join('')
    : '<span class="hint" style="margin:0">还没有放入食材</span>';
}
function matchCond(m, t, cnt) {
  if (!m || m.impossible) return false;
  if (m.min) for (const k in m.min) if (!(t[k] >= m.min[k])) return false;
  if (m.max) for (const k in m.max) if ((t[k] || 0) > m.max[k]) return false;
  if (m.need) for (const k in m.need) if ((cnt[k] || 0) < m.need[k]) return false;
  if (m.forbid) for (const k of m.forbid) if ((t[k] || 0) > 0) return false;
  return true;
}
/* m.alt = 同一道菜的其它合法配方（官方维基给了多套要求时用） */
function checkRecipe(r, t, cnt) {
  const m = r.m;
  if (!m || m.impossible) return false;
  if (matchCond(m, t, cnt)) return true;
  return (m.alt || []).some(a => matchCond(Object.assign({}, m, a), t, cnt));
}
function updateCalc() {
  renderSlots();
  renderTagSum();
  const { t, cnt } = sums();
  if (slots.length < 4) {
    $('#calcResult').innerHTML = `<p class="hint" style="margin:0">还差 ${4 - slots.length} 个锅位。饥荒的烹饪锅必须四个格子全部填满才会开始烹饪。</p>`;
    return;
  }
  const pool = RECIPES.filter(r => showWarly || !r.warly);
  const hits = pool.filter(r => checkRecipe(r, t, cnt)).sort((a, b) => b.prio - a.prio);
  if (!hits.length) {
    const goop = RECIPES.find(r => r.id === 'wet_goop');
    $('#calcResult').innerHTML = `<div class="result-alt">
      <b>${goop.cn}</b>（湿糯糊糊）
      <div class="sub">这套食材不满足任何有效食谱，做出的会是一锅糊糊（无任何恢复效果）。</div>
    </div>`;
    return;
  }
  const top = hits.filter(h => h.prio === hits[0].prio);
  const rest = hits.filter(h => h.prio !== hits[0].prio);
  $('#calcResult').innerHTML = `
    <div class="result-main">
      <h4>${top.map(h => esc(h.cn)).join(' / ')}</h4>
      <div class="sub">优先级 ${top[0].prio}${top.length > 1 ? '（并列，等概率随机产出其中一种）' : '（最高优先级，必出）'}</div>
      ${statPills(top[0])}
      <div class="meta">
        <span>⏱ ${top[0].time == null ? '—' : top[0].time + ' 秒'}</span>
        <span>🥫 保质 ${top[0].perish == null ? '永不腐烂' : top[0].perish + ' 天'}</span>
      </div>
    </div>
    ${rest.length ? `<div class="result-alt">
      <b>同时满足、但优先级更低的食谱</b>
      <div class="sub">${rest.map(h => `${esc(h.cn)}（优先级 ${h.prio}）`).join('、')}</div>
    </div>` : ''}
    ${showWarly ? '' : '<p class="hint" style="margin:10px 0 0">沃利专属的 11 道料理要用便携烹饪锅，默认不参与普通锅的判定；需要的话勾选上面的开关。</p>'}`;
}
function renderIngList(kw) {
  const k = (kw || '').toLowerCase();
  const list = LIB_ITEMS.filter(i => !k || i.cn.toLowerCase().includes(k) || i.en.toLowerCase().includes(k));
  $('#ingList').innerHTML = list.map(i => {
    const vals = Object.keys(i.tags).map(t => `${TAG_META[t].cn} ${num(i.tags[t])}`).join(' · ');
    return `<button class="ing" data-id="${i.id}">
      <span>${esc(i.cn)}<em class="ing-cat">${LIB_CATS[i.cat].cn}</em></span>
      <span class="val">${vals}</span></button>`;
  }).join('');
  $('#ingList').querySelectorAll('.ing').forEach(b => b.onclick = () => {
    if (slots.length >= 4) return;
    slots.push(b.dataset.id);
    updateCalc();
  });
}

/* ---------------- 食物度速查表 ---------------- */
function renderFoodTable() {
  const prim = it => TAG_ORDER.find(k => it.tags[k]) || 'meat';
  const list = LIB_ITEMS.slice().sort((a, b) =>
    TAG_ORDER.indexOf(prim(a)) - TAG_ORDER.indexOf(prim(b)) || a.cn.localeCompare(b.cn, 'zh'));
  let html = '', lastGroup = '';
  list.forEach(i => {
    const g = prim(i);
    if (g !== lastGroup) {
      lastGroup = g;
      html += `<div class="food-group" style="color:${TAG_META[g].color}">${TAG_META[g].cn}</div>`;
    }
    html += `<div class="food-row">
      <span>${esc(i.cn)}<em class="food-cat">${LIB_CATS[i.cat].cn}</em></span>
      <span class="v">${Object.keys(i.tags).map(k =>
        `<span class="tagv" style="color:${TAG_META[k].color}">${TAG_META[k].cn} ${num(i.tags[k])}</span>`).join('')}</span>
    </div>`;
  });
  $('#foodTable').innerHTML = html;
}

/* ---------------- 喜爱料理表 ---------------- */
function renderFavTable() {
  $('#favTable').innerHTML = CHARACTERS.filter(c => !c.npc).map(c => {
    const r = c.favId ? RECIPES.find(x => x.id === c.favId) : null;
    const after = r && c.mul ? Math.round(r.hg * c.mul * 100) / 100 : null;
    return `<div class="fav-row">
      <span class="who">${esc(c.cn)}</span>
      <span class="dish">${esc(c.fav)}</span>
      <span class="mul">${c.mul ? '×' + c.mul : '无'}</span>
      ${r ? `<span class="gcd">喜爱加成：饥饿 ${num(r.hg)} → ${num(after)}</span>` : ''}
    </div>`;
  }).join('');
}

/* ---------------- 资源图鉴：原材料 + 世界生态 ----------------
   世界条目的详情沿用 world.js 数据模型；分类、搜索和入口统一在资源页。 */
/* UI 文案集中在这里（中文界面，词条正文见 js/world.js） */
const L10N = {
  cn: {
    tabWorld: '世界',
    chipAll: '全部',
    empty: '没有匹配的条目。',
    kindVein: '可开采',
    kindItem: '开采产物',
    secWhere: '生成环境与分布',
    secStages: '生长阶段',
    secProduce: '采集产物',
    secRes: '可生成资源',
    secUse: '作用与产出',
    secYield: '产出物',
    secMine: '开采方式',
    secRegen: '再生条件',
    secAccess: '位置与连通方式',
    secTerrain: '地形构成',
    secSpecial: '特产资源',
    secRelated: '相关条目',
    secNote: '实用提示',
    brief1p: '产物', brief2p: '环境',
    brief1b: '资源', brief2b: '分布',
    brief1s: '作用', brief2s: '位置',
    brief1m: '产出', brief2m: '开采',
    brief1i: '特产', brief2i: '抵达',
    worldRefTitle: '怎么看这些资料',
    worldRefTips: [
      '<b>植物</b>：一类是灌木 / 草本（浆果丛、草丛、芦苇…），一类是树木，还有洞穴与海洋里的特殊植物。重点看「生长阶段」和「采集产物」。',
      '<b>群系（地段）</b>：地表地形 → 森林世界群系（固定 / 概率）→ 月岛 → 洞穴 → 遗迹 → 海洋。群系是世界生成单位，决定了你会遇到什么资源、什么危险，选址就靠它。',
      '<b>建筑</b>：世界里自然生成的结构与地标（格罗姆雕像、试金石、远古大门、蜘蛛巢…）。「作用与产出」写清它能给你什么；可自己动手造的建筑在「制作」页。',
      '<b>矿物</b>：分「可开采对象」（矿脉，带镐子图标标记）和「开采产物」（拿在手里的材料）。想长期不缺矿，先看它的「再生条件」。',
      '<b>岛屿</b>：远洋区域必须造船才能到，看「位置与连通方式」和「特产资源」两栏最省时间。'
    ],
    worldScope: '共 {n} 条'
  }
};
/* 世界页只保留中文界面（中英切换按钮已按需求移除） */
const LANG = 'cn';
const T = k => (L10N.cn[k] != null ? L10N.cn[k] : k);
/* 字段值可以是字符串，也可以是 { cn, en } 对象 —— 统一取中文 */
const tr = v => (v && typeof v === 'object' && !Array.isArray(v))
  ? (v.cn || v.en || '') : (v == null ? '' : String(v));
const trList = a => (a || []).map(tr);

let worldState = { cat: WORLD_CAT_ORDER[0], sub: 'all', kw: '' };
let resourceState = { group: 'all', sub: 'all' };

function worldSubs(cat) {
  return Object.keys(WORLD_SUBS).filter(k => WORLD_SUBS[k].cat === cat
    && WORLD.some(x => x.cat === cat && x.sub === k));
}
function renderWorldSegbar() {
  $('#worldSegbar').innerHTML = WORLD_CAT_ORDER.map(c =>
    `<button class="seg${worldState.cat === c ? ' on' : ''}" data-c="${c}">`
    + `${WORLD_CATS[c].icon} ${esc(tr(WORLD_CATS[c]))}<span class="seg-n">${WORLD.filter(x => x.cat === c && x.id !== 'driftwood').length}</span></button>`).join('');
  $('#worldSegbar').querySelectorAll('.seg').forEach(b => b.onclick = () => {
    worldState.cat = b.dataset.c;
    worldState.sub = 'all';
    renderWorldSegbar(); renderWorldChips(); renderWorld();
  });
}
/* 工具栏：分类（带条数）→ 子类（带条数）→ 当前范围条数，一行说明就够，
   详细怎么看数据留在页面底部的「怎么看这些资料」卡片里 */
function renderWorldChips() {
  const subs = worldSubs(worldState.cat);
  const bar = $('#worldChipbar');
  bar.hidden = subs.length < 2;
  const items = [{ id: 'all', label: T('chipAll'), n: WORLD.filter(x => x.cat === worldState.cat && x.id !== 'driftwood').length }]
    .concat(subs.map(s => ({
      id: s, label: tr(WORLD_SUBS[s]),
      n: WORLD.filter(x => x.cat === worldState.cat && x.sub === s && x.id !== 'driftwood').length
    })));
  bar.innerHTML = items.map(i =>
    `<button class="chip${worldState.sub === i.id ? ' on' : ''}" data-s="${i.id}">${esc(i.label)}`
    + `<em class="chip-n">${i.n}</em></button>`).join('');
  bar.querySelectorAll('.chip').forEach(b => b.onclick = () => {
    worldState.sub = b.dataset.s; renderWorldChips(); renderWorld();
  });
}
function worldMatchKw(x, kw) {
  if (!kw) return true;
  const hay = [x.cn, x.en, tr(x.where), tr(x.access), tr(x.note), tr(x.mine), tr(x.regen), tr(x.stages),
    tr(WORLD_CATS[x.cat]), tr(WORLD_SUBS[x.sub] || {})]
    .concat(trList(x.produce), trList(x.res), trList(x.yield), trList(x.terrain), trList(x.special))
    .join(' ').toLowerCase();
  return hay.includes(kw);
}
const wtxt = (t, n) => { t = String(t == null ? '' : t); return t.length > n ? t.slice(0, n) + '…' : t; };
/* 「速览」：每个分类各取最能说明问题的两组关键信息，只放在详情面板顶部（一级列表不再显示） */
function worldBrief(x) {
  const pick = n => (v) => wtxt(tr(v).split(/[（(]/)[0], n);
  const p = pick(9);
  if (x.cat === 'plant') {
    return [[T('brief1p'), (x.produce || []).slice(0, 2).map(p).join(' / ')],
      [T('brief2p'), wtxt(tr(x.where).split(/[；;，,]/)[0], 18)]];
  }
  if (x.cat === 'mineral') {
    return [[T('brief1m'), (x.yield || []).slice(0, 2).map(p).join(' / ')],
      [T('brief2m'), wtxt(tr(x.mine).split(/[；;，,]/)[0], 18)]];
  }
  if (x.cat === 'structure') {
    return [[T('brief1s'), (x.res || []).slice(0, 2).map(p).join(' / ')],
      [T('brief2s'), wtxt(tr(x.where).split(/[；;，,]/)[0], 18)]];
  }
  if (x.cat === 'island') {
    return [[T('brief1i'), (x.special || []).slice(0, 1).map(p).join('')],
      [T('brief2i'), wtxt(tr(x.access).split(/[；;，,]/)[0], 18)]];
  }
  return [[T('brief1b'), (x.res || []).slice(0, 2).map(p).join(' / ')],
    [T('brief2b'), wtxt(tr(x.where).split(/[；;，,]/)[0], 18)]];
}
/* 一级列表保持极简：只有立绘 + 名称 + 一行小字（英文 · 子类），
   产出 / 位置 / 地形 / 资源全部收进点开后的详情面板 */
function renderWorld() {
  const kw = worldState.kw.trim().toLowerCase();
  /* 排序控件已移除：固定按子类分组显示 */
  const subOrder = worldSubs(worldState.cat);
  const list = WORLD.filter(x => x.id !== 'driftwood' && x.cat === worldState.cat
    && (worldState.sub === 'all' || x.sub === worldState.sub) && worldMatchKw(x, kw))
    .slice().sort((a, b) => subOrder.indexOf(a.sub) - subOrder.indexOf(b.sub) || WORLD.indexOf(a) - WORLD.indexOf(b));
  $('#worldEmpty').hidden = list.length > 0;
  $('#worldEmpty').textContent = T('empty');
  const scope = $('#worldScope');
  if (scope) {
    const scopeName = tr(WORLD_CATS[worldState.cat])
      + (worldState.sub === 'all' ? '' : ' / ' + tr(WORLD_SUBS[worldState.sub] || {}));
    scope.textContent = T('worldScope').replace('{n}', list.length) + ' · ' + scopeName;
  }
  $('#worldGrid').innerHTML = list.map(x => {
    const kind = x.kind ? ` · ${T(x.kind === 'vein' ? 'kindVein' : 'kindItem')}` : '';
    return `<button class="mob" data-id="${x.id}" data-cat="${x.cat}">
      <div class="mob-img" style="background-image:url('${imgUrl(x.img)}')"></div>
      <div class="mob-main">
        <div class="mob-name"><h3>${esc(x.cn)}</h3></div>
        <div class="mob-sub">${esc(x.en)} · ${esc(tr(WORLD_SUBS[x.sub] || {}))}${esc(kind)}</div>
      </div>
      <span class="mob-arrow" aria-hidden="true">›</span>
    </button>`;
  }).join('');
  $('#worldGrid').querySelectorAll('.mob').forEach(el =>
    el.onclick = () => openWorldSheet(el.dataset.cat, el.dataset.id));
}
/* 详情面板：按分类组合板块 */
function worldSections(x) {
  const selfKey = { kind: 'world', id: x.id, cat: x.cat };
  const note = t => `<p class="sheet-note" style="margin:0">${linkify(t, selfKey)}</p>`;
  const boxItem = (icon, t) => `<div class="sample"><i>${icon}</i><span>${linkify(t, selfKey)}</span></div>`;
  const listSec = (title, items, icon) => (items && items.length)
    ? `<div class="sheet-sec"><h3>${esc(title)}</h3><div class="samples">`
      + items.map(v => boxItem(icon, tr(v))).join('') + '</div></div>'
    : '';
  const textSec = (title, body) => body
    ? `<div class="sheet-sec"><h3>${esc(title)}</h3>${note(tr(body))}</div>` : '';
  const out = [];
  if (x.cat === 'plant') {
    out.push(textSec(T('secWhere'), x.where));
    out.push(textSec(T('secStages'), x.stages));
    out.push(listSec(T('secProduce'), x.produce, '🌾'));
  } else if (x.cat === 'biome' || x.cat === 'structure') {
    out.push(textSec(T('secWhere'), x.where));
    out.push(listSec(x.cat === 'structure' ? T('secUse') : T('secRes'), x.res,
      x.cat === 'structure' ? '🏛' : '📦'));
  } else if (x.cat === 'mineral') {
    out.push(listSec(T('secYield'), x.yield, '⛏'));
    out.push(textSec(T('secMine'), x.mine));
    out.push(textSec(T('secRegen'), x.regen));
    out.push(textSec(T('secWhere'), x.where));
  } else {
    out.push(textSec(T('secAccess'), x.access));
    out.push(listSec(T('secTerrain'), x.terrain, '⛰'));
    out.push(listSec(T('secSpecial'), x.special, '⭐'));
  }
  if (x.note) out.push(`<div class="sheet-sec"><h3>${esc(T('secNote'))}</h3><div class="effbox">${linkify(tr(x.note), selfKey)}</div></div>`);
  const rel = (x.rel || []).map(r => WORLD.find(y => y.cat === r.c && y.id === r.i)).filter(Boolean);
  if (rel.length) {
    out.push(`<div class="sheet-sec"><h3>${esc(T('secRelated'))}</h3><div class="kv">`
      + rel.map(y => `<button class="pill link" data-rel="${y.cat}|${y.id}">${esc(y.cn)} →</button>`).join('')
      + '</div></div>');
  }
  return out.join('');
}
function openWorldSheet(cat, id) {
  if (id === 'driftwood' && matById('driftwood')) { openMatSheet('driftwood'); return; }
  const x = WORLD.find(y => y.cat === cat && y.id === id);
  if (!x) return;
  const kindBadge = x.kind
    ? `<span class="badge world-kind">${esc(T(x.kind === 'vein' ? 'kindVein' : 'kindItem'))}</span>` : '';
  const b = worldBrief(x);
  $('#sheet').innerHTML = `
    <div class="sheet-grip"></div>
    ${sheetTools({ kind: 'world', cat: x.cat, id: x.id })}
    <div class="sheet-head">
      <div class="dish-img" style="background-image:url('${imgUrl(x.img)}')"></div>
      <div>
        <h2>${esc(x.cn)}</h2>
        <em>${esc(x.en)}</em>
        <div style="margin-top:6px">
          <span class="badge world-cat-${x.cat}">${esc(tr(WORLD_CATS[x.cat]))}</span>
          <span class="badge">${esc(tr(WORLD_SUBS[x.sub] || {}))}</span>
          ${kindBadge}
        </div>
      </div>
    </div>
    <div class="sheet-sec">
      <h3>速览</h3>
      <div class="kv">
        <span class="pill">${esc(b[0][0])} · ${esc(b[0][1] || '—')}</span>
        <span class="pill">${esc(b[1][0])} · ${esc(b[1][1] || '—')}</span>
      </div>
    </div>
    ${worldSections(x)}
    <div class="sheet-sec">
      <p class="sheet-note" style="margin:0">${esc((T('worldRefTips') || []).slice(-1)[0] || '')}</p>
    </div>`;
  openPanel();
  bindSheetTools({ kind: 'world', cat: x.cat, id: x.id });
  $('#sheet').querySelectorAll('[data-rel]').forEach(b => b.onclick = () => {
    const [c, i] = b.dataset.rel.split('|');
    openWorldSheet(c, i);
  });
}
function renderWorldRef() {
  const ul = $('#worldRefList');
  if (!ul) return;
  ul.innerHTML = (T('worldRefTips') || []).slice(0, -1).map(t => `<li>${t}</li>`).join('');
}
function applyL10N() {
  document.documentElement.lang = 'zh-CN';
  document.querySelectorAll('[data-l10n]').forEach(el => { el.textContent = T(el.dataset.l10n); });
  renderWorldRef();
}

/* ---------------- 资源 · 材料与世界（数据见 js/materials.js / js/world.js） ----------------
   这里收录采集 / 打怪 / 挖掘获得的原材料，以及植物、地段、矿物与岛屿资料。
   可制作的条目在「制作」页，两边通过名称互相跳转。 */
const MAT_SEGS = [{ id: 'all', label: '全部' }]
  .concat(Object.keys(MAT_CATS).map(k => ({ id: k, label: MAT_CATS[k].cn })));
let matState = { seg: 'all', kw: '' };

const matById = id => MATERIALS.find(m => m.id === id);
const matNames = m => [m.cn].concat(m.alias || []);
/* 用某个材料做出来的制作物品 */
function matUses(m) {
  const names = new Set(matNames(m));
  return ITEMS.filter(it => (it.recipe || []).some(([n]) => names.has(n)));
}
/* 会掉这个材料的生物 / 会在世界里产出它的条目 */
function matDrops(m) {
  const names = matNames(m);
  const special = {
    jet_feather: /漆黑羽毛|黑色羽毛|乌鸦羽毛/,
    crimson_feather: /深红羽毛|红色羽毛|红鸟羽毛/,
    azure_feather: /天蓝羽毛|蓝色羽毛|雪雀羽毛|雪鸟羽毛/,
    saffron_feather: /藏红花羽毛|藏红羽毛|黄色羽毛/,
    broken_shell: /破碎壳|破碎贝壳/,
    moon_moth_wings: /月蛾翅膀|月蛾翅膀/,
    glommer_wings: /格罗姆之翼|格罗姆翅膀/,
    glommer_goop: /格罗姆黏液/,
    light_bulb: /荧光果|灯泡/,
    down_feather: /麋鹿鹅羽毛|绒羽/,
    malbatross_feather: /邪天翁羽毛|邪天翁羽毛|羽毛（受击掉落）/
  };
  const re = special[m.id];
  const matchesDrop = drop => names.some(n => String(drop).includes(n)) || (re && re.test(String(drop)));
  return MOBS.filter(x => (x.drops || []).some(matchesDrop));
}
function matWorld(m) {
  const names = matNames(m);
  const has = v => names.some(n => tr(v).includes(n));
  return WORLD.filter(x => x.id !== 'driftwood' && [].concat(x.produce || [], x.yield || [], x.special || [], x.res || [])
    .some(has));
}
/* 制作条目 ↔ 物品条目 互跳 */
function matByName(name) {
  return MATERIALS.find(m => m.cn === name || (m.alias || []).includes(name));
}
function craftByMatName(name) {
  return ITEMS.find(it => it.cn === name);
}
function renderResourceSegbar() {
  const counts = id => id === 'all' ? MATERIALS.length + WORLD.filter(x => x.id !== 'driftwood').length
    : id === 'mineral' ? WORLD.filter(x => x.cat === 'mineral' && x.id !== 'driftwood').length
    : ['biome', 'island', 'structure'].includes(id) ? WORLD.filter(x => x.cat === id).length
    : MATERIALS.filter(m => m.cat === id).length + WORLD.filter(x => x.cat === id && x.id !== 'driftwood').length;
  const segs = [{ id: 'all', label: '全部' }]
    .concat(Object.keys(MAT_CATS).map(id => ({ id, label: MAT_CATS[id].cn })));
  $('#resourceSegbar').innerHTML = segs.map(s =>
    `<button class="seg${resourceState.group === s.id ? ' on' : ''}" data-g="${s.id}">${s.label}<span class="seg-n">${counts(s.id)}</span></button>`).join('');
  $('#resourceSegbar').querySelectorAll('.seg').forEach(b => b.onclick = () => {
    resourceState.group = b.dataset.g; resourceState.sub = 'all';
    renderResourceSegbar(); renderResourceChips(); renderResources();
    revealActiveChip('#resourceSegbar');
  });
}
function renderResourceChips() {
  const bar = $('#resourceChipbar'), cat = resourceState.group;
  const subs = ['plant', 'biome', 'structure', 'mineral', 'island'].includes(cat) ? worldSubs(cat) : [];
  const worldCount = cat === 'all' ? MATERIALS.length + WORLD.filter(x => x.id !== 'driftwood').length
    : cat === 'mineral' ? WORLD.filter(x => x.cat === cat && x.id !== 'driftwood').length
    : ['biome', 'island', 'structure'].includes(cat) ? WORLD.filter(x => x.cat === cat).length
    : MATERIALS.filter(m => m.cat === cat).length + WORLD.filter(x => x.cat === cat && x.id !== 'driftwood').length;
  const items = [{ id: 'all', label: '不限', n: worldCount }]
    .concat(subs.map(s => ({ id: s, label: tr(WORLD_SUBS[s]), n: WORLD.filter(x => x.cat === cat && x.sub === s && x.id !== 'driftwood').length })));
  bar.hidden = items.length < 2;
  bar.innerHTML = items.map(i => `<button class="chip${resourceState.sub === i.id ? ' on' : ''}" data-s="${i.id}">${esc(i.label)}<em class="chip-n">${i.n}</em></button>`).join('');
  bar.querySelectorAll('.chip').forEach(b => b.onclick = () => {
    resourceState.sub = b.dataset.s; renderResourceChips(); renderResources();
    revealActiveChip('#resourceChipbar');
  });
  revealActiveChip('#resourceChipbar');
}
/* 让横向筛选栏里被选中的那一项自动滚进可视区。
   小屏上分类很多，选中项常常在屏幕外，用户会以为「没反应」。 */
function revealActiveChip(sel) {
  const bar = $(sel);
  if (!bar || bar.hidden) return;
  const on = bar.querySelector('.chip.on, .seg.on');
  if (!on) return;
  const left = on.offsetLeft, right = left + on.offsetWidth;
  const viewL = bar.scrollLeft, viewR = viewL + bar.clientWidth;
  if (left < viewL) bar.scrollLeft = Math.max(0, left - 8);
  else if (right > viewR) bar.scrollLeft = right - bar.clientWidth + 8;
}
/* ============================================================
   环境 · 天气页（js/environment.js）
   与「资源」页的分工：资源页收录「东西」，这一页收录「发生的事」。
   ============================================================ */
let envState = { cat: 'all', sub: 'all', kw: '' };

function renderEnvSegbar() {
  const counts = id => id === 'all' ? ENVIRONMENT.length
    : ENVIRONMENT.filter(x => x.cat === id).length;
  const segs = [{ id: 'all', label: '全部' }]
    .concat(ENV_CAT_ORDER.map(id => ({ id, label: ENV_CATS[id].cn })));
  $('#envSegbar').innerHTML = segs.map(s =>
    `<button class="seg${envState.cat === s.id ? ' on' : ''}" data-g="${s.id}" role="tab">${esc(s.label)}<span class="seg-n">${counts(s.id)}</span></button>`).join('');
  $('#envSegbar').querySelectorAll('.seg').forEach(b => b.onclick = () => {
    envState.cat = b.dataset.g; envState.sub = 'all';
    renderEnvSegbar(); renderEnvChips(); renderEnv();
    revealActiveChip('#envSegbar');
  });
  revealActiveChip('#envSegbar');
}
function renderEnvChips() {
  const bar = $('#envChipbar'), cat = envState.cat;
  const subs = Object.keys(ENV_SUBS).filter(s => ENV_SUBS[s].cat === cat);
  const n = s => ENVIRONMENT.filter(x => x.sub === s).length;
  const total = cat === 'all' ? ENVIRONMENT.length : ENVIRONMENT.filter(x => x.cat === cat).length;
  const items = [{ id: 'all', label: '不限', n: total }]
    .concat(subs.map(s => ({ id: s, label: ENV_SUBS[s].cn, n: n(s) })));
  bar.hidden = items.length < 2;
  bar.innerHTML = items.map(i =>
    `<button class="chip${envState.sub === i.id ? ' on' : ''}" data-s="${i.id}">${esc(i.label)}<em class="chip-n">${i.n}</em></button>`).join('');
  bar.querySelectorAll('.chip').forEach(b => b.onclick = () => {
    envState.sub = b.dataset.s; renderEnvChips(); renderEnv();
    revealActiveChip('#envChipbar');
  });
  revealActiveChip('#envChipbar');
}
function envMatchKw(x, kw) {
  if (!kw) return true;
  return [x.cn, x.en, x.trigger, (x.effect || []).join(' '), (x.counter || []).join(' '),
    x.note || '', (x.numbers || []).map(v => v.k + ' ' + v.v).join(' ')]
    .join(' ').toLowerCase().includes(kw);
}
function renderEnv() {
  const kw = envState.kw.trim().toLowerCase();
  const list = ENVIRONMENT.filter(x =>
    (envState.cat === 'all' || x.cat === envState.cat)
    && (envState.sub === 'all' || x.sub === envState.sub)
    && envMatchKw(x, kw));
  $('#envEmpty').hidden = list.length > 0;
  $('#envEmpty').textContent = kw ? '没有匹配「' + envState.kw.trim() + '」的天气或机制。'
    : '这一栏还没有收录条目。';
  $('#envScope').textContent = `共 ${list.length} 条`;
  $('#envGrid').innerHTML = list.map(x => `
    <button class="mob env-card" data-id="${x.id}" data-cat="${x.cat}">
      <div class="mob-img env-i env-i-${x.cat}">${envIconSvg(x.icon)}</div>
      <div class="mob-main">
        <div class="mob-name"><h3>${esc(x.cn)}</h3></div>
        <div class="mob-sub">${esc(x.en)} · ${esc(ENV_CATS[x.cat].cn)}</div>
      </div>
      <span class="mob-arrow" aria-hidden="true">›</span>
    </button>`).join('');
  $('#envGrid').querySelectorAll('.mob').forEach(el =>
    el.onclick = () => openEnvSheet(el.dataset.id));
}
function openEnvSheet(id) {
  const x = ENVIRONMENT.find(e => e.id === id);
  if (!x) return;
  const selfKey = { kind: 'env', id: x.id };
  const sec = (title, body) => body
    ? `<div class="sheet-sec"><h3>${esc(title)}</h3>${body}</div>` : '';
  const ul = arr => arr && arr.length
    ? `<ul class="list">${arr.map(t => `<li>${linkify(t, selfKey)}</li>`).join('')}</ul>` : '';
  $('#sheet').innerHTML = `
    <div class="sheet-grip"></div>
    ${sheetTools({ kind: 'env', id: x.id })}
    <div class="sheet-head">
      <div class="dish-img env-i env-i-${x.cat}" data-icon="${esc(x.icon)}">${envIconSvg(x.icon)}</div>
      <div>
        <h2>${esc(x.cn)}</h2>
        <em>${esc(x.en)}</em>
        <div style="margin-top:6px"><span class="badge env-cat-${x.cat}">${esc(ENV_CATS[x.cat].cn)}</span></div>
      </div>
    </div>
    ${sec('什么时候会发生', x.trigger ? `<p class="sheet-note" style="margin:0">${linkify(x.trigger, selfKey)}</p>` : '')}
    ${sec('会造成什么后果', ul(x.effect))}
    ${sec('关键数值', x.numbers && x.numbers.length ? `<div class="numtable">${x.numbers.map(v =>
        `<div class="numrow"><span class="numk">${esc(v.k)}</span><span class="numv">${linkify(String(v.v), selfKey)}</span></div>`).join('')}</div>` : '')}
    ${sec('怎么防 / 怎么解', ul(x.counter))}
    ${x.note ? `<div class="sheet-sec"><h3>实战提示</h3><div class="effbox">${linkify(x.note, selfKey)}</div></div>` : ''}
    ${SHEET_SOURCE_NOTE}`;
  openPanel();
  bindSheetTools({ kind: 'env', id: x.id });
}

/* ==================== 地图彩蛋（布景） ==================== */
let spState = { where: 'all', tag: 'all', kw: '' };

function renderSpSegbar() {
  const counts = id => id === 'all' ? SETPIECES.length
    : SETPIECES.filter(x => x.where === id).length;
  const segs = [{ id: 'all', label: '全部' }]
    .concat(Object.keys(SETPIECE_WHERE).map(id => ({ id, label: SETPIECE_WHERE[id].cn })));
  $('#spSegbar').innerHTML = segs.map(s =>
    `<button class="seg${spState.where === s.id ? ' on' : ''}" data-g="${s.id}" role="tab">${esc(s.label)}<span class="seg-n">${counts(s.id)}</span></button>`).join('');
  $('#spSegbar').querySelectorAll('.seg').forEach(b => b.onclick = () => {
    spState.where = b.dataset.g; spState.tag = 'all';
    renderSpSegbar(); renderSpChips(); renderSp();
    revealActiveChip('#spSegbar');
  });
  revealActiveChip('#spSegbar');
}
/* 第二排：危险度 + 版本筛选。
   注意第一项不要再叫「全部」——上面那一排（出现位置）已经有一个「全部」，
   两排并排出现两个一模一样的「全部 N」，用户分不清哪个管什么。
   这里用「不限危险度」明确它管的是标签维度。 */
function renderSpChips() {
  const bar = $('#spChipbar'), w = spState.where;
  const pool = SETPIECES.filter(x => w === 'all' || x.where === w);
  const tags = [
    { id: 'all', label: '不限', n: pool.length },
    { id: 'low', label: SETPIECE_DANGER.low.cn, n: pool.filter(x => x.danger === 'low').length },
    { id: 'mid', label: SETPIECE_DANGER.mid.cn, n: pool.filter(x => x.danger === 'mid').length },
    { id: 'high', label: SETPIECE_DANGER.high.cn, n: pool.filter(x => x.danger === 'high').length },
    { id: 'only', label: SETPIECE_SCOPE.only.cn, n: pool.filter(x => x.dst === 'only').length },
    { id: 'event', label: SETPIECE_SCOPE.event.cn, n: pool.filter(x => x.dst === 'event').length }
  ].filter(t => t.id === 'all' || t.n > 0);
  bar.hidden = tags.length < 2;
  bar.innerHTML = tags.map(i =>
    `<button class="chip${spState.tag === i.id ? ' on' : ''}" data-s="${i.id}">${esc(i.label)}<em class="chip-n">${i.n}</em></button>`).join('');
  bar.querySelectorAll('.chip').forEach(b => b.onclick = () => {
    spState.tag = b.dataset.s; renderSpChips(); renderSp();
    revealActiveChip('#spChipbar');
  });
  revealActiveChip('#spChipbar');
}
function spMatchKw(x, kw) {
  if (!kw) return true;
  return [x.cn, x.en, x.spawn, (x.contains || []).join(' '), (x.loot || []).join(' '),
    x.tip || '', x.note || ''].join(' ').toLowerCase().includes(kw);
}
function spHit(x) {
  const t = spState.tag;
  if (t === 'all') return true;
  if (t === 'low' || t === 'mid' || t === 'high') return x.danger === t;
  return x.dst === t;
}
function renderSp() {
  const kw = spState.kw.trim().toLowerCase();
  const list = SETPIECES.filter(x =>
    (spState.where === 'all' || x.where === spState.where) && spHit(x) && spMatchKw(x, kw));
  $('#spEmpty').hidden = list.length > 0;
  $('#spEmpty').textContent = kw ? '没有匹配「' + spState.kw.trim() + '」的地图彩蛋。'
    : '这一栏还没有收录条目。';
  $('#spScope').textContent = `共 ${list.length} 处`;
  $('#spGrid').innerHTML = list.map(x => {
    const d = SETPIECE_DANGER[x.danger];
    return `
    <button class="mob" data-id="${x.id}">
      <div class="mob-img" style="background-image:url('${imgUrl(x.img)}')"></div>
      <div class="mob-main">
        <div class="mob-name"><h3>${esc(x.cn)}</h3></div>
        <div class="mob-sub">${esc(SETPIECE_WHERE[x.where].cn)} · <span style="color:${d.color}">${esc(d.cn)}</span>${x.dst === 'only' ? ' · 联机版' : (x.dst === 'event' ? ' · 活动' : '')}</div>
      </div>
      <span class="mob-arrow" aria-hidden="true">›</span>
    </button>`;
  }).join('');
  $('#spGrid').querySelectorAll('.mob').forEach(el =>
    el.onclick = () => openSpSheet(el.dataset.id));
}
function openSpSheet(id) {
  const x = SETPIECES.find(e => e.id === id);
  if (!x) return;
  const selfKey = { kind: 'setpiece', id: x.id };
  const d = SETPIECE_DANGER[x.danger];
  const sec = (title, body) => body
    ? `<div class="sheet-sec"><h3>${esc(title)}</h3>${body}</div>` : '';
  const ul = arr => arr && arr.length
    ? `<ul class="list">${arr.map(t => `<li>${linkify(t, selfKey)}</li>`).join('')}</ul>` : '';
  const rows = [
    { k: '出现位置', v: SETPIECE_WHERE[x.where].cn },
    { k: '危险度', v: d.cn }
  ];
  if (x.spawn) rows.push({ k: '游戏内 ID', v: x.spawn });
  $('#sheet').innerHTML = `
    <div class="sheet-grip"></div>
    ${sheetTools({ kind: 'setpiece', id: x.id })}
    <div class="sheet-head">
      <div class="dish-img" style="background-image:url('${imgUrl(x.img)}')"></div>
      <div>
        <h2>${esc(x.cn)}</h2>
        <em>${esc(x.en)}</em>
        <div style="margin-top:6px">
          <span class="badge">${esc(SETPIECE_WHERE[x.where].cn)}</span>
          <span class="badge" style="color:${d.color}">${esc(d.cn)}</span>
          <span class="badge">${esc(SETPIECE_SCOPE[x.dst].cn)}</span>
        </div>
      </div>
    </div>
    ${sec('场景里有什么', ul(x.contains))}
    ${sec('能捞到什么', ul(x.loot))}
    <div class="sheet-sec"><h3>基本信息</h3><div class="numtable">${rows.map(v =>
      `<div class="numrow"><span class="numk">${esc(v.k)}</span><span class="numv">${esc(v.v)}</span></div>`).join('')}</div></div>
    ${x.tip ? `<div class="sheet-sec"><h3>实战建议</h3><div class="effbox">${linkify(x.tip, selfKey)}</div></div>` : ''}
    ${x.note ? `<div class="sheet-sec"><h3>补充</h3><p class="sheet-note" style="margin:0">${linkify(x.note, selfKey)}</p></div>` : ''}
    ${SHEET_SOURCE_NOTE}`;
  openPanel();
  bindSheetTools({ kind: 'setpiece', id: x.id });
}

function renderResources() {
  const kw = matState.kw.trim().toLowerCase(), group = resourceState.group;
  const matList = MATERIALS.filter(m => (group === 'all' || m.cat === group)
    && (resourceState.sub === 'all' || !['plant', 'biome', 'structure', 'mineral', 'island'].includes(group))
    && (!kw || [m.cn, m.en, m.src, m.note || '', matNames(m).join(' ')].join(' ').toLowerCase().includes(kw)));
  const worldList = WORLD.filter(x => x.id !== 'driftwood' && (group === 'all' || x.cat === group)
    && (resourceState.sub === 'all' || x.sub === resourceState.sub) && worldMatchKw(x, kw));
  const entries = matList.map(m => ({ type: 'mat', entry: m })).concat(worldList.map(x => ({ type: 'world', entry: x })));
  $('#resourceEmpty').hidden = entries.length > 0;
  $('#resourceEmpty').textContent = T('empty');
  $('#resourceScope').textContent = `共 ${entries.length} 条资源`;
  $('#resourceGrid').innerHTML = entries.map(({ type, entry }) => type === 'mat'
    ? `<button class="mob" data-type="mat" data-id="${entry.id}">${entry.img ? `<div class="mob-img" style="background-image:url('${imgUrl(entry.img)}')"></div>` : `<div class="mob-img noimg"><i>${esc(entry.cn.slice(0, 1))}</i></div>`}<div class="mob-main"><div class="mob-name"><h3>${esc(entry.cn)}</h3></div><div class="mob-sub">${esc(entry.en)} · ${esc(MAT_CATS[entry.cat].cn)}</div></div><span class="mob-arrow" aria-hidden="true">›</span></button>`
    : `<button class="mob" data-type="world" data-id="${entry.id}" data-cat="${entry.cat}"><div class="mob-img" style="background-image:url('${imgUrl(entry.img)}')"></div><div class="mob-main"><div class="mob-name"><h3>${esc(entry.cn)}</h3></div><div class="mob-sub">${esc(entry.en)} · ${esc(tr(WORLD_CATS[entry.cat]))} / ${esc(tr(WORLD_SUBS[entry.sub] || {}))}</div></div><span class="mob-arrow" aria-hidden="true">›</span></button>`).join('');
  $('#resourceGrid').querySelectorAll('.mob').forEach(el => el.onclick = () => el.dataset.type === 'mat'
    ? openMatSheet(el.dataset.id) : openWorldSheet(el.dataset.cat, el.dataset.id));
}
function renderMatSegbar() { renderResourceSegbar(); }
function renderMats() { renderResources(); }
function openMatSheet(id) {
  const m = matById(id);
  if (!m) return;
  const selfKey = { kind: 'material', id: m.id };
  const crafts = matUses(m);
  const drops = matDrops(m);
  const srcs = matWorld(m);
  const craft = craftByMatName(m.cn);
  const aliases = (m.alias || []).filter(a => a !== m.cn);

  $('#sheet').innerHTML = `
    <div class="sheet-grip"></div>
    ${sheetTools({ kind: 'material', id: m.id })}
    <div class="sheet-head">
      ${m.img ? `<div class="dish-img" style="background-image:url('${imgUrl(m.img)}')"></div>`
        : `<div class="dish-img noimg">${esc(m.cn.slice(0, 1))}</div>`}
      <div>
        <h2>${esc(m.cn)}</h2>
        <em>${esc(m.en)}</em>
        <div style="margin-top:6px">
          <span class="badge cat-${m.cat}">${esc(MAT_CATS[m.cat].cn)}</span>
          ${m.stack ? `<span class="badge">堆叠 ${esc(m.stack)}</span>` : ''}
          ${m.dstOnly ? '<span class="badge">联机版</span>' : ''}
        </div>
      </div>
    </div>
    <div class="sheet-sec">
      <h3>怎么获得</h3>
      <p class="sheet-note" style="margin:0">${linkify(m.src || '资料暂缺', selfKey)}</p>
    </div>
    ${drops.length ? `<div class="sheet-sec">
      <h3>掉落自（${drops.length}）</h3>
      <div class="kv">${drops.map(x => `<button class="pill link" data-mob="${x.id}">${esc(x.cn)} →</button>`).join('')}</div>
    </div>` : ''}
    ${srcs.length ? `<div class="sheet-sec">
      <h3>在世界里的产出（${srcs.length}）</h3>
      <div class="kv">${srcs.map(x => `<button class="pill link" data-world="${x.cat}|${x.id}">${esc(x.cn)} →</button>`).join('')}</div>
    </div>` : ''}
    ${crafts.length ? `<div class="sheet-sec">
      <h3>用于制作（${crafts.length} 项）</h3>
      <div class="kv">${crafts.slice(0, 40).map(it =>
        `<button class="pill link" data-craft="${it.id}">${esc(it.cn)}</button>`).join('')}</div>
      ${crafts.length > 40 ? '<p class="hint" style="margin:8px 0 0">只列出前 40 项，更多请到「制作」页查看。</p>' : ''}
    </div>` : ''}
    ${m.note ? `<div class="sheet-sec"><h3>小提示</h3><div class="effbox">${linkify(m.note, selfKey)}</div></div>` : ''}
    ${aliases.length ? `<div class="sheet-sec">
      <h3>别名</h3>
      <div class="kv">${aliases.map(a => `<span class="pill">${esc(a)}</span>`).join('')}</div>
    </div>` : ''}
    ${craft ? `<div class="sheet-sec">
      <h3>相关</h3>
      <div class="kv"><button class="pill link" data-craft="${craft.id}">在「制作」页看它的配方与制作条件 →</button></div>
    </div>` : ''}
    ${SHEET_SOURCE_NOTE}`;
  openPanel();
  bindSheetTools({ kind: 'material', id: m.id });
  $('#sheet').querySelectorAll('[data-mob]').forEach(b => b.onclick = () => openMobSheet(b.dataset.mob));
  $('#sheet').querySelectorAll('[data-craft]').forEach(b => b.onclick = () => openCraftItemSheet(b.dataset.craft));
  $('#sheet').querySelectorAll('[data-world]').forEach(b => b.onclick = () => {
    const [c, i] = b.dataset.world.split('|');
    openWorldSheet(c, i);
  });
  $('#sheet').querySelectorAll('[data-matref]').forEach(b => b.onclick = () => openMatSheet(b.dataset.matref));
  $('#sheet').querySelectorAll('[data-link]').forEach(b => b.onclick = () => {
    const [kind, cat, targetId] = b.dataset.link.split('|');
    openLinked(kind, cat, targetId);
  });
}
/* 制作条目详情里，如果这件东西同时是「资源」页收录的材料，给一个跳转 */
function matRefSection(it) {
  const m = matByName(it.cn);
  if (!m || m.id === it.id) return '';
  return `<div class="sheet-sec">
    <h3>相关</h3>
    <div class="kv"><button class="pill link" data-matref="${m.id}">在「资源」页看它的获取方式与用途 →</button></div>
  </div>`;
}

/* ---------------- 收藏夹（数据存取在 js/router.js） ---------------- */
let favState = { kw: '' };
/* 词条类型 → 显示名，供收藏列表用 */
const FAV_KIND_LABEL = {
  dish: '料理', ing: '食材', mob: '生物', item: '制作',
  env: '环境', setpiece: '彩蛋', material: '材料', world: '世界', char: '角色', npc: '居民'
};

function renderFavs() {
  const kw = favState.kw.trim().toLowerCase();
  const all = loadFavs();
  const list = all.map(e => ({ e, obj: favEntryInfo(e) }))
    .filter(({ obj }) => !kw || [obj.cn, obj.en].join(' ').toLowerCase().includes(kw));

  $('#favEmpty').hidden = list.length > 0;
  $('#favEmpty').textContent = all.length === 0
    ? '还没有收藏。打开任意词条，点右上角的 ☆ 即可加入。'
    : '收藏里没有匹配「' + favState.kw.trim() + '」的条目。';
  /* 没有收藏（或搜不到任何结果）时，不该出现「清空全部收藏」——
     一个让人清空「零条」的按钮只会让人怀疑是不是坏了。 */
  const acts = $('#favActions');
  if (acts) acts.hidden = list.length === 0;
  $('#favScope').textContent = all.length
    ? `共收藏 ${all.length} 条${kw ? '，筛出 ' + list.length + ' 条' : ''}`
    : '还没有收藏';

  $('#favGrid').innerHTML = list.map(({ e, obj }) => `
    <button class="mob" data-k="${e.kind}" data-c="${esc(e.cat || '')}" data-i="${esc(e.id)}">
      ${obj.img
        ? `<div class="mob-img" style="background-image:url('${imgUrl(obj.img)}')"></div>`
        : `<div class="mob-img noimg"><i>${esc((obj.cn || '?').slice(0, 1))}</i></div>`}
      <div class="mob-main">
        <div class="mob-name"><h3>${esc(obj.cn)}</h3></div>
        <div class="mob-sub">${esc(obj.en || '')} · ${esc(FAV_KIND_LABEL[e.kind] || '词条')}</div>
      </div>
      <span class="fav-del" aria-label="移除收藏">×</span>
      <span class="mob-arrow" aria-hidden="true">›</span>
    </button>`).join('');

  $('#favGrid').querySelectorAll('.mob').forEach(el => el.onclick = ev => {
    if (ev.target.classList.contains('fav-del')) {
      ev.stopPropagation();
      toggleFav({ kind: el.dataset.k, cat: el.dataset.c || null, id: el.dataset.i });
      renderFavs(); renderFavCount();
      return;
    }
    openLinked(el.dataset.k, el.dataset.c, el.dataset.i);
  });
}
function openFavorites() {
  switchView('view-fav');
  renderFavs();
}

/* ---------------- 全局搜索：跨目录检索所有百科词条 ---------------- */
const GLOBAL_SEARCH_GROUPS = [
  { kind: 'dish', label: '料理', list: () => RECIPES, name: x => x.cn, sub: x => x.en, img: x => x.img,
    hay: x => JSON.stringify(x), open: x => { switchView('view-cook'); switchCookSeg('dishes'); openSheet(x.id); } },
  { kind: 'ing', label: '食材', list: () => LIB_ITEMS, name: x => x.cn, sub: x => `${x.en} · ${LIB_CATS[x.cat].cn}`, img: x => x.img,
    hay: x => JSON.stringify(x), open: x => { switchView('view-cook'); switchCookSeg('lib'); openItemSheet(x.id); } },
  { kind: 'mob', label: '生物', list: () => MOBS, name: x => x.cn, sub: x => `${x.en} · ${MOB_CATS[x.cat].cn}`, img: x => x.img,
    hay: x => JSON.stringify(x), open: x => { switchView('view-mobs'); openMobSheet(x.id); } },
  { kind: 'env', label: '环境 · 天气', list: () => ENVIRONMENT, name: x => x.cn,
    sub: x => `${x.en} · ${ENV_CATS[x.cat].cn}`, img: () => null,
    hay: x => JSON.stringify(x),
    open: x => { switchView('view-env'); envState.cat = 'all'; envState.sub = 'all'; envState.kw = '';
      renderEnvSegbar(); renderEnvChips(); renderEnv(); openEnvSheet(x.id); } },
  { kind: 'setpiece', label: '地图彩蛋', list: () => SETPIECES, name: x => x.cn,
    sub: x => `${x.en} · ${SETPIECE_WHERE[x.where].cn} · ${SETPIECE_DANGER[x.danger].cn}`, img: x => x.img,
    hay: x => JSON.stringify(x),
    open: x => { switchView('view-setpiece'); spState.where = 'all'; spState.tag = 'all'; spState.kw = '';
      renderSpSegbar(); renderSpChips(); renderSp(); openSpSheet(x.id); } },
  { kind: 'char', label: '角色', list: () => CHARS, name: x => x.cn, sub: x => x.en, img: x => x.img,
    hay: x => JSON.stringify(x), open: x => { switchView('view-chars'); openCharSheet(x.id); } },
  { kind: 'npc', label: '居民 / NPC', list: () => NPCS, name: x => x.cn, sub: x => `${x.en} · ${NPC_CATS[x.cat] || ''}`, img: x => x.img,
    hay: x => JSON.stringify(x), open: x => { switchView('view-chars'); openNpcSheet(x.id); } },
  { kind: 'item', label: '制作', list: () => ITEMS, name: x => x.cn, sub: x => `${x.en} · ${(x.filters || []).map(f => (craftFilter(f) || {}).cn || '').filter(Boolean).join(' / ')}`, img: x => x.img,
    hay: x => JSON.stringify(x), open: x => { switchView('view-items'); openCraftItemSheet(x.id); } },
  { kind: 'resource', label: '资源', list: () => MATERIALS.map(data => ({ type: 'mat', data }))
      .concat(WORLD.filter(x => x.id !== 'driftwood').map(data => ({ type: 'world', data }))),
    name: x => x.data.cn,
    sub: x => x.type === 'mat' ? `${x.data.en} · ${MAT_CATS[x.data.cat].cn}` : `${x.data.en} · ${tr(WORLD_CATS[x.data.cat])} / ${tr(WORLD_SUBS[x.data.sub] || {})}`,
    img: x => x.data.img, hay: x => JSON.stringify(x.data),
    open: x => {
      switchView('view-resources'); resourceState.group = x.data.cat; resourceState.sub = 'all'; matState.kw = '';
      renderResourceSegbar(); renderResourceChips(); renderResources();
      if (x.type === 'mat') openMatSheet(x.data.id); else openWorldSheet(x.data.cat, x.data.id);
    } }
];
/* 把命中的关键词包成 <mark>，让用户一眼看到为什么这条被搜出来。
   先 esc 再插标签，避免 XSS。 */
function highlight(text, kw) {
  const s = String(text == null ? '' : text);
  if (!kw) return esc(s);
  const low = s.toLowerCase(), k = kw.toLowerCase();
  let out = '', i = 0;
  while (i < s.length) {
    const at = low.indexOf(k, i);
    if (at < 0) { out += esc(s.slice(i)); break; }
    out += esc(s.slice(i, at)) + '<mark>' + esc(s.slice(at, at + k.length)) + '</mark>';
    i = at + k.length;
  }
  return out;
}
/* 每个词条参与搜索的全部文本（含别名），别名也是用户会输入的常见写法 */
function entryHay(group, entry) {
  const e = entry.data || entry;
  return [
    group.name(entry), group.sub(entry) || '',
    (e.alias || []).join(' '),
    (e.en || ''), (e.cn || ''),
    group.hay(entry)
  ].join(' ').toLocaleLowerCase();
}
/* 相关性：名称完全匹配 > 名称开头 > 名称包含 > 仅别名/正文命中。
   这样「肉丸」会排在「怪物肉丸汤」之前，而不是按数据顺序乱排。 */
function scoreEntry(group, entry, kw) {
  const name = String(group.name(entry) || '').toLocaleLowerCase();
  const e = entry.data || entry;
  const en = String(e.en || '').toLocaleLowerCase();
  const alias = (e.alias || []).join(' ').toLocaleLowerCase();
  if (name === kw || en === kw) return 100;
  if (name.startsWith(kw) || en.startsWith(kw)) return 80;
  if (name.includes(kw) || en.includes(kw)) return 60;
  if (alias.includes(kw)) return 40;
  return 20;
}
function globalSearchResults(query) {
  const kw = String(query || '').trim().toLocaleLowerCase();
  if (!kw) return [];
  const out = [];
  GLOBAL_SEARCH_GROUPS.forEach(group => (group.list() || []).forEach(entry => {
    if (!entryHay(group, entry).includes(kw)) return;
    out.push({ group, entry, score: scoreEntry(group, entry, kw) });
  }));
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, 60);
}
function renderGlobalSearch(query) {
  const box = $('#globalResults');
  const kw = String(query || '').trim();
  if (!kw) { box.hidden = true; box.innerHTML = ''; return; }
  const results = globalSearchResults(kw);
  if (!results.length) {
    box.innerHTML = '<div class="global-no-results">没有找到匹配的百科条目。换个关键词，或试试它的别名 / 英文名。</div>';
  } else {
    const groups = [];
    results.forEach(result => {
      let bucket = groups.find(x => x.group === result.group);
      if (!bucket) { bucket = { group: result.group, entries: [] }; groups.push(bucket); }
      bucket.entries.push(result.entry);
    });
    box.innerHTML = groups.map(bucket => `<div class="global-result-section">
      <div class="global-result-group">${esc(bucket.group.label)}<em>${bucket.entries.length}</em></div>
      ${bucket.entries.map(entry => {
        const image = bucket.group.img(entry);
        return `<button class="global-result" type="button">
          ${image ? `<img src="${esc(imgSrc(image))}" alt="" loading="lazy">` : '<span class="global-result-icon"></span>'}
          <span class="global-result-main"><span class="global-result-name">${highlight(bucket.group.name(entry), kw)}</span>
          <span class="global-result-sub">${highlight(bucket.group.sub(entry) || '', kw)}</span></span>
        </button>`;
      }).join('')}
    </div>`).join('');
    box.querySelectorAll('.global-result').forEach((btn, index) => {
      let groupIndex = 0, entryIndex = index;
      for (; groupIndex < groups.length; groupIndex++) {
        if (entryIndex < groups[groupIndex].entries.length) break;
        entryIndex -= groups[groupIndex].entries.length;
      }
      const bucket = groups[groupIndex];
      const entry = bucket && bucket.entries[entryIndex];
      btn.onclick = () => {
        if (!entry) return;
        box.hidden = true;
        bucket.group.open(entry);
      };
    });
  }
  box.hidden = false;
}
function setGlobalSearch(value) {
  const input = $('#globalSearch');
  const close = $('#globalSearchClose');
  if (input && input.value !== value) input.value = value;
  if (close) close.hidden = false;
  renderGlobalSearch(value);
}

/* 全局搜索面板的展开 / 收起。
   移动端默认收起，省下一整行；桌面端由 CSS 强制常显（.global-search 的 hidden 会被覆盖），
   所以这里只管属性与 aria 状态。 */
function setGlobalSearchOpen(open) {
  const panel = $('#globalSearchPanel');
  const btn = $('#gsToggle');
  if (!panel) return;
  panel.hidden = !open;
  if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    const input = $('#globalSearch');
    if (input && document.documentElement.clientWidth >= 1024) return;  /* 桌面端不抢焦点 */
    if (input) setTimeout(() => input.focus(), 0);
  } else {
    setGlobalSearch('');
    const box = $('#globalResults');
    if (box) box.hidden = true;
  }
}

/* 桌面端搜索是常显的（CSS 用 .global-search[hidden]{display:block} 强制显示），
   但 DOM 上的 hidden 属性仍然会是 true。属性与视觉不一致时，
   任何读 .hidden 判断状态的代码都会判断错，所以启动和窗口变化时同步一次。
   另外搜索面板常显时，结果区需要有自己的消失逻辑（不再依赖面板开关），
   所以输入框清空时要主动收起结果。 */
function syncGlobalSearchState() {
  const panel = $('#globalSearchPanel');
  const btn = $('#gsToggle');
  if (!panel) return;
  if (document.documentElement.clientWidth >= 1024) {
    panel.hidden = false;
    if (btn) btn.setAttribute('aria-expanded', 'true');
  } else {
    /* 回到窄屏：收起，避免在手机上凭空占一行 */
    panel.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
    setGlobalSearch('');
  }
}

/* ---------------- 启动 ---------------- */
function init() {
  buildLinkIndex();
  /* 全页底纹：每个一级页一张官方载入画面，同一次会话内保持稳定 */
  applyHero('view-cook');
  renderCookSegbar();
  renderChips(); renderGrid();
  renderSegbar(); renderLib();
  renderMobSegbar(); renderMobs();
  renderCharSegbar(); renderChars();
  renderResourceSegbar(); renderResourceChips(); renderResources();
  renderEnvSegbar(); renderEnvChips(); renderEnv();
  renderSpSegbar(); renderSpChips(); renderSp();
  renderItemCrumb(); renderItems();
  renderFoodTable(); renderFavTable();
  renderSlots(); renderTagSum(); renderIngList('');
  updateCalc();

  $('#globalSearch').oninput = e => setGlobalSearch(e.target.value);
  /* 桌面端搜索常显、移动端默认收起：启动时按当前宽度对齐一次 DOM 状态，
     并在窗口跨过 1024px 断点时重新对齐（否则旋转屏幕 / 缩放窗口后会错位）。 */
  syncGlobalSearchState();
  let _gsRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(_gsRaf);
    _gsRaf = requestAnimationFrame(syncGlobalSearchState);
  });
  /* 搜索开关：点开 / 收起。收起时清空输入与结果，避免下次打开还留着旧结果。 */
  const gsBtn = $('#gsToggle');
  if (gsBtn) gsBtn.onclick = () => {
    const panel = $('#globalSearchPanel');
    setGlobalSearchOpen(!!panel && panel.hidden);
  };
  $('#globalSearchClose').onclick = () => {
    ['globalSearch', 'search', 'libSearch', 'mobSearch', 'charSearch', 'itemSearch', 'ingSearch', 'resourceSearch', 'envSearch'].forEach(id => {
      const input = $('#' + id);
      if (input) input.value = '';
    });
    state.kw = ''; libState.kw = ''; mobState.kw = ''; charState.kw = ''; worldState.kw = ''; itemState.kw = ''; matState.kw = ''; envState.kw = '';
    resourceState.group = 'all'; resourceState.sub = 'all';
    renderGrid(); renderLib(); renderMobs(); renderChars(); renderItems(); renderResourceSegbar(); renderResourceChips(); renderResources(); renderIngList('');
    setGlobalSearch('');
    setGlobalSearchOpen(false);
  };
  /* 注：各页的就地搜索框在下面的 LOCAL_SEARCH 里统一接线，
     这里不要再把它们挂到全局搜索上（会互相覆盖，导致输入无效）。 */
  $('#sheet').addEventListener('click', e => {
    const b = e.target.closest('.xlink');
    if (!b) return;
    const p = b.dataset.link.split('|');
    openLinked(p[0], p[1], p[2]);
  });
  applyL10N();
  $('#ingSearch').oninput = e => {
    renderIngList(e.target.value.trim());
    setGlobalSearch(e.target.value);
  };
  /* 各页自己的搜索框：就地过滤该页列表。
     （这些框在改版时丢过一轮，只剩全局搜索，等于页面没法就地筛选；
       这里统一接回各页的 kw 状态与 render 函数。） */
  const LOCAL_SEARCH = [
    ['search', 'state', renderGrid],
    ['libSearch', 'libState', renderLib],
    ['mobSearch', 'mobState', renderMobs],
    ['charSearch', 'charState', renderChars],
    ['itemSearch', 'itemState', renderItems],
    ['resourceSearch', 'matState', renderResources],
    ['envSearch', 'envState', renderEnv],
    ['spSearch', 'spState', renderSp]
  ];
  LOCAL_SEARCH.forEach(([id, stateVar, render]) => {
    const input = $('#' + id);
    if (!input) return;
    const box = () => ({ state, libState, mobState, charState, itemState, matState, envState })[stateVar];
    input.oninput = e => { box().kw = e.target.value; render(); };
    input.onkeydown = e => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      input.value = ''; box().kw = ''; render();
    };
  });
  /* 清空按钮要把这些就地搜索框一起复位 */
  document.querySelectorAll('input[type="search"]').forEach(i => {
    i.addEventListener('search', () => {
      if (i.value === '' && i.oninput) i.oninput({ target: i });
    });
  });
  /* 「这页怎么用」展开状态记住，不用每次重新点开。
     但只在宽屏记忆：手机上一旦展开就会一直占掉首屏约 40px，
     而首屏能多露一条词条对查资料的人更重要，所以窄屏每次进来都按收起处理。 */
  document.querySelectorAll('details.howto').forEach(d => {
    const key = 'howto:' + (d.closest('main') || {}).id;
    if (document.documentElement.clientWidth >= 700) {
      try { if (localStorage.getItem(key) === '1') d.open = true; } catch (err) {}
    } else {
      d.open = false;
    }
    d.addEventListener('toggle', () => {
      if (document.documentElement.clientWidth < 700) return;
      try { localStorage.setItem(key, d.open ? '1' : '0'); } catch (err) {}
    });
  });
  $('#calcWarly').onchange = e => { showWarly = e.target.checked; updateCalc(); };
  $('#clearSlots').onclick = () => { slots = []; updateCalc(); };
  $('#randomFill').onclick = () => {
    slots = CURATED[Math.floor(Math.random() * CURATED.length)].slice();
    updateCalc();
  };

  /* ---- 收藏夹 ---- */
  renderFavCount();
  const favSearch = $('#favSearch');
  if (favSearch) favSearch.oninput = e => { favState.kw = e.target.value; renderFavs(); };
  const favClear = $('#favClear');
  if (favClear) favClear.onclick = () => {
    if (!loadFavs().length) return;
    if (!confirm('确定要清空全部收藏吗？此操作无法撤销。')) return;
    saveFavs([]); renderFavs(); renderFavCount();
  };

  /* ---- 路由：包裹所有 open*Sheet，让每次打开都写进 URL ---- */
  if (typeof installRouter === 'function') installRouter();
  /* 键盘快捷键：/ 聚焦全局搜索，Esc 关闭面板或清空搜索 */
  document.addEventListener('keydown', e => {
    trapFocus(e);
    if (e.key === 'Escape') { closeSheet(); return; }
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      setGlobalSearchOpen(true);
      const gs = $('#globalSearch');
      if (gs) gs.focus();
    }
  });
  installListKeyboard();
  /* 首屏按 URL 恢复位置（#/mob/deerclops 这类深链） */
  if (location.hash && location.hash.length > 1 && typeof applyRoute === 'function') applyRoute();
}
document.addEventListener('DOMContentLoaded', init);
