/* ============================================================
   路由与深链（js/router.js）
   ------------------------------------------------------------
   目的：
     1. 每个词条都有可分享 / 可收藏的 URL（#/mob/deerclops）
     2. 浏览器「后退」能退回上一个词条 / 上一页，而不是直接退出站点
     3. 刷新页面后能恢复到原来的位置
     4. 支持收藏（localStorage）

   为什么单独一个文件：app.js 已经 2000 行，路由是一块独立职责，
   拆出来便于维护，也避免继续把 app.js 撑大。

   URL 规则（全部挂在 hash 上，静态托管 / file:// 都能用）：
     #/cook/dishes            一级页 + 二级分段
     #/mob/deerclops          词条详情
     #/resource/boss/xxx      带分类的词条
     #/fav                     收藏夹
   ============================================================ */

const ROUTE_VIEWS = {
  cook: 'view-cook', mob: 'view-mobs', item: 'view-items',
  env: 'view-env', setpiece: 'view-setpiece',
  resource: 'view-resources', char: 'view-chars'
};
/* 词条类型 → 打开函数名（这些函数定义在 app.js）。
   world 的打开函数签名不同（openWorldSheet(cat, id)），在 installRouter 里单独处理。 */
const ROUTE_OPENERS = {
  dish: 'openSheet',
  ing: 'openItemSheet',
  mob: 'openMobSheet',
  char: 'openCharSheet',
  npc: 'openNpcSheet',
  item: 'openCraftItemSheet',
  material: 'openMatSheet',
  env: 'openEnvSheet',
  setpiece: 'openSpSheet',
  world: 'openWorldSheet'
};
/* 签名是 (cat, id) 而非 (id) 的类型 */
const ROUTE_TWO_ARG = { world: true };

/* 词条类型 → 它属于哪个一级页（用于切 tab） */
const KIND_TO_VIEW = {
  dish: 'view-cook', ing: 'view-cook',
  mob: 'view-mobs',
  item: 'view-items',
  env: 'view-env',
  setpiece: 'view-setpiece',
  material: 'view-resources', world: 'view-resources',
  char: 'view-chars', npc: 'view-chars'
};

/* 记住当前状态，避免自己的 pushState 又触发一遍渲染 */
let routeApplying = false;
/* 历史栈里当前是否已经有一条词条记录（用于 closeSheet 时回退） */
let routeDepth = 0;

/* ---------- 解析 / 生成 ---------- */

function parseHash(hash) {
  const raw = String(hash || '').replace(/^#\/?/, '');
  if (!raw) return { view: 'view-cook', seg: null, kind: null, cat: null, id: null, fav: false };
  const p = raw.split('/').filter(Boolean).map(decodeURIComponent);
  if (p[0] === 'fav') return { view: null, fav: true, seg: null, kind: null, cat: null, id: null };

  /* #/cook/dishes —— 一级页 +（可选）二级分段 */
  const view = ROUTE_VIEWS[p[0]];
  if (!view) return { view: 'view-cook', seg: null, kind: null, cat: null, id: null, fav: false };

  /* #/cook/dish/meatballs —— 词条：首段是页、次段是类型、其余是 id */
  const kind = p[1] && ROUTE_OPENERS[p[1]] ? p[1] : null;
  if (kind) {
    return { view, seg: null, kind, cat: p[2] || null, id: (p[3] || p[2] || null), fav: false };
  }
  /* #/resource/boss/bones —— 资源页带分类段。
     资源和「材料 / 世界」两类共用这一种形状，
     靠数据反查到底是哪一类（材料在前，世界在后，与 openLinked 的优先级一致）。 */
  if (p[0] === 'resource' && p[2]) {
    const cat = p[1], id = p[2];
    let kind = 'material';
    if (typeof WORLD !== 'undefined' && WORLD.some(x => x.cat === cat && x.id === id)) kind = 'world';
    return { view, seg: null, kind, cat, id, fav: false };
  }
  /* #/mob/deerclops —— 类型省略时按页推断默认类型。
     注意：这里不要另外硬编码一份映射表，直接用 VIEW_DEFAULT_KIND，
     否则新增页面时容易漏掉（曾经就漏过 setpiece，导致 #/setpiece/xxx 解析不出来）。 */
  const defKind = VIEW_DEFAULT_KIND[view];
  if (p[1] && defKind) return { view, seg: null, kind: defKind, cat: null, id: p[1], fav: false };
  /* 否则当成二级分段：#/cook/dishes */
  return { view, seg: p[1] || null, kind: null, cat: null, id: null, fav: false };
}

/* 词条类型 → 该页的默认类型（写 URL 时省略，避免出现 #/mob/mob/xxx 这种重复段） */
const VIEW_DEFAULT_KIND = {
  'view-cook': 'dish', 'view-mobs': 'mob', 'view-items': 'item',
  'view-env': 'env', 'view-setpiece': 'setpiece',
  'view-chars': 'char', 'view-resources': 'material'
};

function routeFor(viewId, kind, cat, id) {
  const viewKey = Object.keys(ROUTE_VIEWS).find(k => ROUTE_VIEWS[k] === viewId) || 'cook';
  if (kind && id) {
    if (kind === 'material' && cat) return `#/resource/${cat}/${encodeURIComponent(id)}`;
    if (kind === 'world') return `#/resource/${cat || 'world'}/${encodeURIComponent(id)}`;
    /* 与页面默认类型相同时省略类型段： #/mob/deerclops 而不是 #/mob/mob/deerclops */
    if (VIEW_DEFAULT_KIND[viewId] === kind) return `#/${viewKey}/${encodeURIComponent(id)}`;
    return `#/${viewKey}/${kind}/${encodeURIComponent(id)}`;
  }
  return `#/${viewKey}`;
}

/* 当前正在展示的词条（供「复制链接」「收藏」用） */
let currentEntry = null;

function pushRoute(viewId, kind, cat, id, replace) {
  /* 收藏夹走独立的 #/fav */
  const hash = (kind === 'fav') ? '#/fav' : routeFor(viewId, kind, cat, id);
  if (location.hash === hash) return;
  routeApplying = true;
  if (replace) history.replaceState({ viewId, kind, cat, id }, '', hash);
  else { routeDepth += 1; history.pushState({ viewId, kind, cat, id }, '', hash); }
  routeApplying = false;
}

/* ---------- 应用路由 ---------- */

function applyRoute() {
  const r = parseHash(location.hash);
  /* 防止 applyRoute 内部调用 switchView → pushRoute 再次触发 hashchange 造成递归 */
  if (routeApplying) return;
  routeApplying = true;
  try {
    if (r.fav) {
      /* openFavorites 内部会调 switchView('view-fav') → renderFavs() */
      if (typeof openFavorites === 'function') openFavorites();
      return;
    }
    if (r.view) switchView(r.view);
    if (r.seg && r.view === 'view-cook' && typeof switchCookSeg === 'function') {
      switchCookSeg(r.seg);
    }
    if (r.kind && r.id) {
      const fn = ROUTE_OPENERS[r.kind];
      if (fn && typeof window[fn] === 'function') {
        if (ROUTE_TWO_ARG[r.kind]) window[fn](r.cat, r.id);
        else window[fn](r.id);
      }
    } else {
      closeSheet();
      currentEntry = null;
    }
  } finally {
    routeApplying = false;
  }
}

/* 包装所有 open* 函数：打开时自动写 URL，并记录当前词条 */
function installRouter() {
  Object.keys(ROUTE_OPENERS).forEach(kind => {
    const fnName = ROUTE_OPENERS[kind];
    const orig = window[fnName];
    if (typeof orig !== 'function' || orig.__routed) return;
    const wrapped = function (a, b) {
      const twoArg = ROUTE_TWO_ARG[kind];
      const res = twoArg ? orig.call(this, a, b) : orig.call(this, a);
      if (!routeApplying) {
        const id = twoArg ? b : a;
        const cat = twoArg ? a : null;
        currentEntry = { kind, cat, id, viewId: KIND_TO_VIEW[kind] || null };
        if (currentEntry.viewId) pushRoute(currentEntry.viewId, kind, cat, id);
      }
      return res;
    };
    wrapped.__routed = true;
    window[fnName] = wrapped;
  });

  /* 关闭面板后回退 URL：由 app.js 的 closeSheet() 直接调用 onSheetClosed()，
     因为 closeSheet 是函数声明，无法从外部替换。 */

  /* hashchange / popstate 都要重新应用路由。
     注意：不要用 routeApplying 做门禁 —— pushRoute 里它是「同步置位又立刻复位」的，
     而 hashchange 是异步派发的，等它到达时标志早已是 false，
     门禁形同虚设；真正需要防的是「applyRoute 自己触发的 hash 变化」，那个由
     applyRoute 内部临时置位来兜住。 */
  window.addEventListener('hashchange', applyRoute);
  window.addEventListener('popstate', applyRoute);
}

/* closeSheet 被调用后：清空当前词条并回退 URL */
function onSheetClosed() {
  currentEntry = null;
  if (routeApplying) return;
  const active = document.querySelector('.view.active');
  const viewId = active ? active.id : 'view-cook';
  routeApplying = true;
  history.replaceState({ viewId }, '', routeFor(viewId));
  routeApplying = false;
}

/* ---------- 分享 / 当前链接 ---------- */

function currentShareUrl() {
  return location.origin === 'null'
    ? location.href
    : location.origin + location.pathname + location.search + location.hash;
}

function copyCurrentLink() {
  const url = currentShareUrl();
  const done = ok => {
    const tip = document.getElementById('shareTip');
    if (tip) {
      tip.textContent = ok ? '链接已复制' : '复制失败，请手动复制地址栏';
      tip.hidden = false;
      clearTimeout(copyCurrentLink._t);
      copyCurrentLink._t = setTimeout(() => { tip.hidden = true; }, 1800);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => done(true), () => done(fallbackCopy(url, done)));
  } else {
    done(fallbackCopy(url, done));
  }
}
function fallbackCopy(text, done) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
}

/* ---------- 收藏（localStorage 持久化） ---------- */

const FAV_KEY = 'dstwiki:fav';
const FAV_META = {
  dish:     { label: '料理',     view: 'view-cook',      icon: '🍲' },
  ing:      { label: '食材',     view: 'view-cook',      icon: '🥕' },
  mob:      { label: '生物',     view: 'view-mobs',      icon: '🐾' },
  item:     { label: '制作',     view: 'view-items',     icon: '🛠️' },
  env:      { label: '环境',     view: 'view-env',       icon: '🌦️' },
  material: { label: '材料',     view: 'view-resources', icon: '📦' },
  world:    { label: '世界',     view: 'view-resources', icon: '🗺️' },
  char:     { label: '角色',     view: 'view-chars',     icon: '🧑' },
  npc:      { label: '居民',     view: 'view-chars',     icon: '🏠' }
};

function loadFavs() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
function saveFavs(list) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
}
function favKey(e) { return e.kind + '|' + (e.cat || '') + '|' + e.id; }
function isFaved(e) { return loadFavs().some(x => favKey(x) === favKey(e)); }
function toggleFav(e) {
  const list = loadFavs();
  const k = favKey(e);
  const i = list.findIndex(x => favKey(x) === k);
  if (i >= 0) list.splice(i, 1); else list.push(e);
  saveFavs(list);
  return i < 0;    /* true = 刚被收藏 */
}
/* 取词条的显示对象（用于收藏列表的图标与名称）。
   这些数据数组定义在各自的 js 文件里，router.js 在其后加载，运行时可用。 */
function favEntryInfo(e) {
  const find = (arr, id) => (arr || []).find(x => x.id === id);
  switch (e.kind) {
    case 'dish': return find(RECIPES, e.id) || { cn: e.id };
    case 'ing': return find(LIB_ITEMS, e.id) || { cn: e.id };
    case 'mob': return find(MOBS, e.id) || { cn: e.id };
    case 'item': return find(ITEMS, e.id) || { cn: e.id };
    case 'material': return find(MATERIALS, e.id) || { cn: e.id };
    case 'char': return find(CHARS, e.id) || { cn: e.id };
    case 'npc': return find(NPCS, e.id) || { cn: e.id };
    case 'env': return find(ENVIRONMENT, e.id) || { cn: e.id };
    case 'world':
      return (WORLD || []).find(x => x.id === e.id && (!e.cat || x.cat === e.cat)) || { cn: e.id };
    default: return { cn: e.id };
  }
}
