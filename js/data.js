/* ============================================================
   饥荒联机版 · 料理 Wiki 数据层 (js/data.js)
   数值来源：官方游戏数据 / 官方维基（Don't Starve Together）
   食物度体系：肉度、鱼度、蔬菜度、水果度、怪物度、蛋度、甜度、
              乳制品度、不可食用度、冰度、装饰度、魔法度、种子度、油脂度
   ============================================================ */

/* ---------- 食物度中文名 / 颜色 ---------- */
const TAG_META = {
  meat:     { cn: '肉度',     color: '#c0563f' },
  fish:     { cn: '鱼度',     color: '#4d8fd6' },
  veggie:   { cn: '蔬菜度',   color: '#5aa86a' },
  fruit:    { cn: '水果度',   color: '#c05a8a' },
  monster:  { cn: '怪物度',   color: '#7a5fa8' },
  egg:      { cn: '蛋度',     color: '#d4b45a' },
  sweet:    { cn: '甜度',     color: '#d98f3c' },
  dairy:    { cn: '乳制品度', color: '#c8c2b4' },
  inedible: { cn: '不可食用度', color: '#8a8177' },
  frozen:   { cn: '冰度',     color: '#5bb3e8' },
  decoration:{ cn: '装饰度',  color: '#b08fd0' },
  magic:    { cn: '魔法度',   color: '#8f7ad6' },
  seed:     { cn: '种子度',   color: '#a8915f' },
  fat:      { cn: '油脂度',   color: '#c9a24d' }
};

/* ---------- 角色与「喜爱的食物」 ---------- */
/* 亲和倍率作用于饥饿值：食用新鲜喜爱料理通常等于额外 +15 饥饿 */
/* 角色数据已独立到 js/characters.js（CHARACTERS / CHARS），这里只保留料理与食物度数据 */

/* ---------- 料理数据 ----------
   hg=饥饿 hp=生命 sa=理智  time=烹饪时间(秒)  perish=保质期(天)  prio=优先级
   req/forbid = 烹饪要求 / 禁忌（展示用）     m = 烹饪计算器用的机器可读条件
   eff = 特殊效果   fav = 喜爱角色   samples = 烹饪材料范例   tags = 筛选标签
   ------------------------------------------------------------ */
const RECIPES = [
  {
    id: 'meatballs', cn: '肉丸', en: 'Meatballs', img: 'Meatballs.png',
    hg: 62.5, hp: 3, sa: 5, time: 15, perish: 10, prio: -1,
    req: ['肉度 ≥ 0.25', '填充物不能是不可食用'], forbid: ['不可食用度'],
    m: { min: { meat: 0.25 }, forbid: ['inedible'] },
    tags: ['hunger', 'meat'],
    samples: ['大肉 ×1 + 浆果 ×3', '小肉 ×2 + 胡萝卜 ×2', '鸡腿 ×1 + 蘑菇 ×2 + 浆果 ×1'],
    note: '最万能的填饱肚子方案，只要有一点点肉度就能出，优先级最低（-1），因此当其它食谱条件满足时会被顶掉。'
  },
  {
    id: 'meaty_stew', cn: '肉汤', en: 'Meaty Stew', img: 'Meaty_Stew.png',
    hg: 150, hp: 12, sa: 5, time: 15, perish: 10, prio: 0,
    req: ['肉度 ≥ 3'], forbid: ['不可食用度'],
    m: { min: { meat: 3 }, forbid: ['inedible'] },
    tags: ['hunger', 'meat'],
    samples: ['大肉 ×3 + 胡萝卜 ×1', '大肉 ×2 + 小肉 ×2'],
    note: '饥饿恢复天花板（150），代价是要 3 点肉度，前期不太划算，打 boss 前补给很合适。'
  },
  {
    id: 'bacon_and_eggs', cn: '培根煎蛋', en: 'Bacon and Eggs', img: 'Bacon_and_Eggs.png',
    hg: 75, hp: 20, sa: 5, time: 40, perish: 20, prio: 10,
    req: ['肉度 ≥ 1.25', '蛋度 ≥ 2', '填充物不能是蔬菜'], forbid: ['蔬菜度'],
    m: { min: { meat: 1.25, egg: 2 }, forbid: ['veggie'] },
    tags: ['hunger', 'meat', 'egg'],
    fav: ['wilson'],
    samples: ['大肉 ×2 + 鸟蛋 ×2', '怪物肉 ×1 + 大肉 ×1 + 鸟蛋 ×2', '大肉 ×1 + 小肉 ×1 + 鸟蛋 ×2'],
    note: '20 天保质期 + 高饥饿，是威尔逊的喜爱料理（×1.2 → 饥饿 90）。注意不能加蔬菜。'
  },
  {
    id: 'honey_ham', cn: '蜜汁火腿', en: 'Honey Ham', img: 'Honey_Ham.png',
    hg: 75, hp: 30, sa: 5, time: 40, perish: 15, prio: 2,
    req: ['蜂蜜 ≥ 1', '肉度 > 1.5'], forbid: ['不可食用度'],
    m: { need: { honey: 1 }, min: { meat: 1.51 }, forbid: ['inedible'] },
    tags: ['hunger', 'meat', 'hot'],
    eff: ['热食：体感温度 +40（10 秒）'],
    samples: ['蜂蜜 ×1 + 大肉 ×2 + 小肉 ×1', '蜂蜜 ×1 + 大肉 ×1 + 小肉 ×2 + 浆果 ×1'],
    note: '回血 30 的优质肉料理；只放 1 个怪物肉不会被顶成怪物千层饼。'
  },
  {
    id: 'honey_nuggets', cn: '蜜汁卤肉', en: 'Honey Nuggets', img: 'Honey_Nuggets.png',
    hg: 37.5, hp: 20, sa: 5, time: 40, perish: 15, prio: 2,
    req: ['蜂蜜 ≥ 1', '肉度 > 0 且 ≤ 1.5'], forbid: ['不可食用度'],
    m: { need: { honey: 1 }, min: { meat: 0.01 }, max: { meat: 1.5 }, forbid: ['inedible'] },
    tags: ['meat', 'egg'],
    fav: ['woodie'],
    samples: ['蜂蜜 ×1 + 大肉 ×1 + 浆果 ×2', '蜂蜜 ×1 + 蛙腿 ×2 + 胡萝卜 ×1'],
    note: '肉度超过 1.5 就会变成蜜汁火腿，所以要「少放肉、多放填充」。伍迪喜爱（×1.4）。'
  },
  {
    id: 'butter_muffin', cn: '蝴蝶松饼', en: 'Butter Muffin', img: 'Butter_Muffin.png', alias: ['黄油松饼'],
    hg: 37.5, hp: 20, sa: 5, time: 40, perish: 15, prio: 1,
    req: ['蝴蝶翅膀 / 月蛾翅膀 ≥ 1', '蔬菜度 ≥ 0.5'], forbid: ['肉度'],
    m: { need: { butterfly_wing: 1 }, min: { veggie: 0.5 }, forbid: ['meat'],
         alt: [{ need: { moon_moth_wing: 1 }, min: { veggie: 0.5 }, forbid: ['meat'] }] },
    tags: ['veggie'],
    fav: ['wx78'],
    samples: ['蝴蝶翅膀 ×1 + 胡萝卜 ×1 + 浆果 ×2', '蝴蝶翅膀 ×1 + 番茄 ×1 + 浆果 ×2'],
    note: '蝴蝶翅膀本身就是 2 点装饰度，顺手打蝴蝶就能做。WX-78 喜爱（×1.4）。'
  },
  {
    id: 'dragonpie', cn: '火龙果派', en: 'Dragonpie', img: 'Dragonpie.png',
    hg: 75, hp: 40, sa: 5, time: 40, perish: 15, prio: 1,
    req: ['火龙果 ≥ 1'], forbid: ['肉度'],
    m: { need: { dragonfruit: 1 }, forbid: ['meat'] },
    tags: ['fruit', 'hunger', 'heal', 'hot'],
    eff: ['热食：体感温度 +40（10 秒）'],
    samples: ['火龙果 ×1 + 浆果 ×3', '火龙果 ×1 + 树枝 ×1 + 浆果 ×2'],
    note: '素食天花板：75 饥饿 + 40 生命，还能取暖。种火龙果的农场玩家必备。'
  },
  {
    id: 'mandrake_soup', cn: '曼德拉草汤', en: 'Mandrake Soup', img: 'Mandrake_Soup.png',
    hg: 150, hp: 100, sa: 5, time: 60, perish: 6, prio: 10,
    req: ['曼德拉草 ≥ 1'], forbid: [],
    m: { need: { mandrake: 1 } },
    tags: ['veggie', 'hunger', 'heal'],
    samples: ['曼德拉草 ×1 + 浆果 ×3'],
    note: '全游戏综合恢复最强的一碗汤（100 生命 / 150 饥饿）。曼德拉草稀少，留到关键时刻喝。'
  },
  {
    id: 'pierogi', cn: '波兰水饺', en: 'Pierogi', img: 'Pierogi.png',
    hg: 37.5, hp: 40, sa: 5, time: 20, perish: 20, prio: 5,
    req: ['蛋度 ≥ 1', '肉度 ≥ 0.25', '蔬菜度 ≥ 0.5'], forbid: ['不可食用度'],
    m: { min: { egg: 1, meat: 0.25, veggie: 0.5 }, forbid: ['inedible'] },
    tags: ['meat', 'egg', 'veggie', 'heal'],
    samples: ['鸟蛋 ×1 + 蘑菇 ×1 + 小肉 ×1 + 浆果 ×1', '鸟蛋 ×1 + 胡萝卜 ×1 + 蛙腿 ×1 + 浆果 ×1'],
    note: '性价比最高的回血料理：40 生命、20 天保质期，材料全是常见货。'
  },
  {
    id: 'fishsticks', cn: '炸鱼排', en: 'Fishsticks', img: 'Fishsticks.png', alias: ['鱼肉条'],
    hg: 37.5, hp: 40, sa: 5, time: 40, perish: 10, prio: 10,
    req: ['鱼度 ≥ 0.25', '树枝 ≥ 1', '填充物里最多 1 个不可食用'], forbid: ['其它不可食用度'],
    m: { min: { fish: 0.25 }, need: { twigs: 1 }, max: { inedible: 1 } },
    tags: ['fish', 'heal'],
    samples: ['鱼 ×1 + 树枝 ×1 + 浆果 ×2', '小鱼块 ×2 + 树枝 ×1 + 胡萝卜 ×1'],
    note: '前期最好做的回血料理，只要一条鱼 + 一根树枝。注意树枝之外不要再放不可食用物。'
  },
  {
    id: 'surf_n_turf', cn: '海鲜牛排', en: "Surf 'n' Turf", img: "Surf_'n'_Turf.png",
    hg: 37.5, hp: 60, sa: 33, time: 20, perish: 10, prio: 30,
    req: ['肉度 ≥ 2.5', '鱼度 ≥ 1.5'], forbid: ['冰度'],
    m: { min: { meat: 2.5, fish: 1.5 }, forbid: ['frozen'] },
    tags: ['meat', 'fish', 'heal', 'sanity'],
    fav: ['wickerbottom'],
    samples: ['大肉 ×2 + 鳗鱼 ×2', '怪物肉 ×1 + 大肉 ×1 + 鳗鱼 ×1 + 鱼 ×1'],
    note: '三维全能（60 生命 / 33 理智），鱼本身同时带肉度，所以「2 大肉 + 2 鱼」就能满足。薇克巴顿喜爱（×1.4）。'
  },
  {
    id: 'lobster_dinner', cn: '龙虾正餐', en: 'Wobster Dinner', img: 'Lobster_Dinner.png',
    hg: 37.5, hp: 60, sa: 50, time: 20, perish: 15, prio: 25,
    req: ['龙虾 ≥ 1', '黄油 ≥ 1', '填充物不能是肉 / 鱼 / 冰块'], forbid: ['肉度', '冰度'],
    m: { need: { lobster: 1, butter: 1 }, max: { meat: 1, fish: 1 }, forbid: ['frozen'] },
    tags: ['fish', 'heal', 'sanity'],
    fav: ['maxwell'],
    samples: ['龙虾 ×1 + 黄油 ×1 + 浆果 ×2'],
    note: '理智 +50，是麦斯威尔的喜爱料理（×1.4）。黄油难得，通常配龙虾刷理智。'
  },
  {
    id: 'lobster_bisque', cn: '龙虾汤', en: 'Lobster Bisque', img: 'Lobster_Bisque.png',
    hg: 25, hp: 60, sa: 10, time: 10, perish: 10, prio: 30,
    req: ['龙虾 ≥ 1', '冰度 ≥ 1'], forbid: [],
    m: { need: { lobster: 1 }, min: { frozen: 1 } },
    tags: ['fish', 'heal'],
    samples: ['龙虾 ×1 + 冰块 ×1 + 浆果 ×2'],
    note: '只要 10 秒就能出锅的高效回血餐，冰块的经典用法。'
  },
  {
    id: 'ice_cream', cn: '冰淇淋', en: 'Ice Cream', img: 'Ice_Cream.png',
    hg: 25, hp: 0, sa: 50, time: 10, perish: 3, prio: 10,
    req: ['冰度 ≥ 1', '乳制品度 ≥ 1', '甜度 ≥ 1'], forbid: ['肉度', '蛋度', '蔬菜度', '不可食用度'],
    m: { min: { frozen: 1, dairy: 1, sweet: 1 }, forbid: ['meat', 'egg', 'veggie', 'inedible'] },
    tags: ['sanity'],
    fav: ['webber'],
    samples: ['冰块 ×1 + 黄油 ×1 + 蜂蜜 ×1 + 浆果 ×1'],
    note: '理智 +50，但只有 3 天保质期（放进冰箱再吃）。韦伯喜爱（×1.6）。'
  },
  {
    id: 'banana_pop', cn: '香蕉冻', en: 'Banana Pop', img: 'Banana_Pop.png',
    hg: 12.5, hp: 20, sa: 33, time: 10, perish: 3, prio: 20,
    req: ['香蕉 ≥ 1', '冰度 ≥ 1', '树枝 ≥ 1'], forbid: ['肉度', '鱼度'],
    m: { need: { banana: 1, twigs: 1 }, min: { frozen: 1 }, forbid: ['meat', 'fish'] },
    tags: ['fruit', 'sanity'],
    fav: ['wendy'],
    samples: ['香蕉 ×1 + 冰块 ×1 + 树枝 ×1 + 浆果 ×1'],
    note: '理智 33 + 回血 20。温蒂喜爱（×2.2 → 饥饿 27.5）。洞穴香蕉的多用途之一。'
  },
  {
    id: 'frozen_banana_daiquiri', cn: '冰香蕉冻唇蜜', en: 'Frozen Banana Daiquiri', img: 'Frozen_Banana_Daiquiri.png',
    hg: 18.75, hp: 30, sa: 15, time: 20, perish: 15, prio: 2,
    req: ['香蕉 ≥ 1', '冰度 ≥ 1'], forbid: ['肉度', '鱼度'],
    m: { need: { banana: 1 }, min: { frozen: 1 }, forbid: ['meat', 'fish'] },
    tags: ['fruit', 'heal', 'cold', 'effect'],
    eff: ['冷食：体感温度 −40（10 秒）'],
    samples: ['香蕉 ×1 + 冰块 ×1 + 浆果 ×2'],
    note: '夏季救急降温 + 回血 30，材料只要香蕉和冰。'
  },
  {
    id: 'banana_shake', cn: '香蕉奶昔', en: 'Banana Shake', img: 'Banana_Shake.png',
    hg: 25, hp: 8, sa: 33, time: 10, perish: 15, prio: 1,
    req: ['香蕉 ≥ 2'], forbid: ['肉度', '鱼度', '怪物度'],
    m: { need: { banana: 2 }, forbid: ['meat', 'fish', 'monster'] },
    tags: ['fruit', 'sanity'],
    samples: ['香蕉 ×2 + 浆果 ×2'],
    note: '理智 +33 且能存 15 天，洞穴/月岛系列常用。'
  },
  {
    id: 'trail_mix', cn: '什锦干果', en: 'Trail Mix', img: 'Trail_Mix.png', alias: ['什锦果仁'],
    hg: 12.5, hp: 30, sa: 5, time: 10, perish: 15, prio: 10,
    req: ['桦栗果 ≥ 1', '浆果 / 多汁浆果 ≥ 1', '水果度 ≥ 0.5'], forbid: ['肉度', '蛋度', '蔬菜度', '乳制品度'],
    m: { need: { birchnut: 1 }, min: { fruit: 0.5 }, forbid: ['meat', 'egg', 'veggie', 'dairy'] },
    tags: ['fruit', 'heal'],
    fav: ['walter'],
    samples: ['桦栗果 ×1 + 浆果 ×2 + 无花果 ×1'],
    note: '回血 30 的素食方案，沃尔特喜爱（×2.2）。桦栗果 + 浆果就能起步。'
  },
  {
    id: 'jam', cn: '果酱', en: 'Fist Full of Jam', img: 'Fist_Full_of_Jam.png',
    hg: 37.5, hp: 3, sa: 5, time: 10, perish: 15, prio: 0,
    req: ['水果度 ≥ 0.5'], forbid: ['肉度', '蔬菜度', '不可食用度'],
    m: { min: { fruit: 0.5 }, forbid: ['meat', 'veggie', 'inedible'] },
    tags: ['fruit', 'hunger'],
    samples: ['浆果 ×4', '浆果 ×2 + 石榴 ×1 + 无花果 ×1'],
    note: '纯水果填充的默认产物，10 秒出锅。水果度 ≥ 3 时会升级成水果拼盘。'
  },
  {
    id: 'fruit_medley', cn: '水果拼盘', en: 'Fruit Medley', img: 'Fruit_Medley.png',
    hg: 25, hp: 20, sa: 5, time: 10, perish: 6, prio: 0,
    req: ['水果度 ≥ 3'], forbid: ['肉度', '蔬菜度'],
    m: { min: { fruit: 3 }, forbid: ['meat', 'veggie'] },
    tags: ['fruit'],
    samples: ['浆果 ×2 + 石榴 ×1 + 西瓜 ×1', '浆果 ×4 + 石榴 ×1'],
    note: '要 3 点水果度，通常用浆果堆量，品质比果酱好但保质期更短。'
  },
  {
    id: 'ratatouille', cn: '蔬菜杂烩', en: 'Ratatouille', img: 'Ratatouille.png',
    hg: 25, hp: 3, sa: 5, time: 20, perish: 15, prio: 0,
    req: ['蔬菜度 ≥ 0.5'], forbid: ['肉度', '不可食用度'],
    m: { min: { veggie: 0.5 }, forbid: ['meat', 'inedible'] },
    tags: ['veggie'],
    samples: ['胡萝卜 ×1 + 蘑菇 ×1 + 浆果 ×2'],
    note: '纯素食的兜底料理；4 个烤胡萝卜直接做反而亏，注意食材基础属性。'
  },
  {
    id: 'pumpkin_cookie', cn: '南瓜饼干', en: 'Pumpkin Cookie', img: 'Pumpkin_Cookie.png',
    hg: 37.5, hp: 0, sa: 15, time: 40, perish: 10, prio: 10,
    req: ['南瓜 ≥ 1', '甜度 ≥ 2'], forbid: [],
    m: { need: { pumpkin: 1 }, min: { sweet: 2 } },
    tags: ['veggie', 'sanity'],
    samples: ['南瓜 ×1 + 蜂蜜 ×2 + 浆果 ×1'],
    note: '理智 +15，南瓜 + 蜂蜜的固定搭配。'
  },
  {
    id: 'taffy', cn: '太妃糖', en: 'Taffy', img: 'Taffy.png',
    hg: 25, hp: -3, sa: 15, time: 40, perish: 15, prio: 10,
    req: ['甜度 ≥ 3'], forbid: ['肉度'],
    m: { min: { sweet: 3 }, forbid: ['meat'] },
    tags: ['sanity'],
    fav: ['wanda'],
    samples: ['蜂蜜 ×3 + 浆果 ×1'],
    note: '蜂蜜换理智的经典手段，代价是 −3 生命。旺达喜爱（×1.6）。'
  },
  {
    id: 'waffles', cn: '华夫饼', en: 'Waffles', img: 'Waffles.png',
    hg: 37.5, hp: 60, sa: 5, time: 10, perish: 6, prio: 10,
    req: ['黄油 ≥ 1', '浆果 / 多汁浆果 ≥ 1', '蛋度 ≥ 1'], forbid: [],
    m: { need: { butter: 1 }, min: { egg: 1 } },
    tags: ['egg', 'heal'],
    samples: ['黄油 ×1 + 浆果 ×1 + 鸟蛋 ×2'],
    note: '回血 60 的第二名（仅次于曼德拉草汤/海鲜牛排），但黄油很看脸。'
  },
  {
    id: 'flower_salad', cn: '花沙拉', en: 'Flower Salad', img: 'Flower_Salad.png', alias: ['鲜花沙拉'],
    hg: 12.5, hp: 40, sa: 5, time: 10, perish: 6, prio: 10,
    req: ['仙人掌花 ≥ 1', '蔬菜度 ≥ 1.5'], forbid: ['水果度', '肉度', '蛋度', '甜度', '不可食用度'],
    m: { need: { cactus_flower: 1 }, min: { veggie: 1.5 }, forbid: ['fruit', 'meat', 'egg', 'sweet', 'inedible'] },
    tags: ['veggie', 'heal'],
    samples: ['仙人掌花 ×1 + 仙人掌肉 ×1 + 胡萝卜 ×1 + 蘑菇 ×1'],
    note: '前期沙漠区的止血药：10 秒出锅、回血 40，但不能加任何水果和甜味。'
  },
  {
    id: 'guacamole', cn: '鳄梨酱', en: 'Guacamole', img: 'Guacamole.png',
    hg: 37.5, hp: 20, sa: 0, time: 10, perish: 10, prio: 10,
    req: ['鼹鼠 ≥ 1', '仙人掌肉 或 熟石果 ≥ 1'], forbid: ['水果度'],
    m: { need: { moleworm: 1 }, forbid: ['fruit'] },
    tags: ['veggie'],
    samples: ['鼹鼠 ×1 + 仙人掌肉 ×1 + 胡萝卜 ×2'],
    note: '鼹鼠的经典用法，理智收益为 0，但饥饿和回血都不差。'
  },
  {
    id: 'spicy_chili', cn: '辣椒炖肉', en: 'Spicy Chili', img: 'Spicy_Chili.png',
    hg: 37.5, hp: 20, sa: 0, time: 10, perish: 10, prio: 10,
    req: ['蔬菜度 ≥ 1.5', '肉度 ≥ 1.5'], forbid: [],
    m: { min: { veggie: 1.5, meat: 1.5 } },
    tags: ['meat', 'veggie', 'hot', 'effect'],
    eff: ['热食：体感温度 +40（15 秒）'],
    samples: ['大肉 ×2 + 胡萝卜 ×1 + 蘑菇 ×1', '小肉 ×3 + 胡萝卜 ×1 + 蘑菇 ×1'],
    note: '冬天临时升温的快捷方案，也是薇洛的喜爱料理（×1.4）。'
  },
  {
    id: 'bunny_stew', cn: '炖兔子', en: 'Bunny Stew', img: 'Bunny_Stew.png',
    hg: 37.5, hp: 20, sa: 5, time: 10, perish: 10, prio: 1,
    req: ['肉度 < 1', '冰度 ≥ 2'], forbid: ['不可食用度'],
    m: { min: { meat: 0.01, frozen: 2 }, max: { meat: 0.99 }, forbid: ['inedible'] },
    tags: ['meat', 'hot'],
    eff: ['热食：体感温度 +40（5 秒）'],
    samples: ['小肉 ×1 + 冰块 ×2 + 浆果 ×1'],
    note: '专门消耗冰块和小肉的配方，肉度一超过 0.75 就会变成其它菜。'
  },
  {
    id: 'froggle_bunwich', cn: '蛙腿三明治', en: 'Froggle Bunwich', img: 'Froggle_Bunwich.png',
    hg: 37.5, hp: 20, sa: 5, time: 40, perish: 15, prio: 1,
    req: ['蛙腿 ≥ 1', '蔬菜度 ≥ 0.5'], forbid: [],
    m: { need: { frog_leg: 1 }, min: { veggie: 0.5 } },
    tags: ['meat', 'veggie'],
    samples: ['蛙腿 ×1 + 胡萝卜 ×1 + 浆果 ×2'],
    note: '池塘边最好做的正餐之一，把蛙腿从「生吃」升级成 37.5 饥饿。'
  },
  {
    id: 'stuffed_eggplant', cn: '酿茄子', en: 'Stuffed Eggplant', img: 'Stuffed_Eggplant.png',
    hg: 37.5, hp: 3, sa: 5, time: 40, perish: 15, prio: 1,
    req: ['茄子 ≥ 1', '蔬菜度 ≥ 0.5'], forbid: [],
    m: { need: { eggplant: 1 }, min: { veggie: 0.5 } },
    tags: ['veggie', 'hot'],
    eff: ['热食：体感温度 +40（5 秒）'],
    samples: ['茄子 ×1 + 蘑菇 ×1 + 浆果 ×2'],
    note: '农场茄子的常规去处。'
  },
  {
    id: 'kabobs', cn: '肉串', en: 'Kabobs', img: 'Kabobs.png',
    hg: 37.5, hp: 3, sa: 5, time: 40, perish: 15, prio: 5,
    req: ['肉度 ≥ 0.25', '树枝 ≥ 1', '填充物里最多 1 个不可食用'], forbid: ['其它不可食用度'],
    m: { min: { meat: 0.25 }, need: { twigs: 1 }, max: { inedible: 1 } },
    tags: ['meat', 'hot'],
    eff: ['热食：体感温度 +40（15 秒）'],
    samples: ['小肉 ×1 + 树枝 ×1 + 胡萝卜 ×1 + 浆果 ×1'],
    note: '顺手把树枝消耗掉的配方；放 1 个怪物肉也不会变怪物料理。'
  },
  {
    id: 'fish_tacos', cn: '鱼塔可', en: 'Fish Tacos', img: 'Fish_Tacos.png',
    hg: 37.5, hp: 20, sa: 5, time: 10, perish: 6, prio: 10,
    req: ['玉米 ≥ 1', '鱼度 ≥ 0.25'], forbid: [],
    m: { need: { corn: 1 }, min: { fish: 0.25 } },
    tags: ['fish', 'veggie'],
    samples: ['玉米 ×1 + 鱼 ×1 + 浆果 ×2'],
    note: '10 秒出锅；藤壶只要有 0.25 鱼度就够触发。'
  },
  {
    id: 'seafood_gumbo', cn: '海鲜浓汤', en: 'Seafood Gumbo', img: 'Seafood_Gumbo.png',
    hg: 37.5, hp: 40, sa: 20, time: 20, perish: 10, prio: 10,
    req: ['鱼度 > 2'], forbid: [],
    m: { min: { fish: 2.01 } },
    tags: ['fish', 'heal', 'sanity'],
    samples: ['鳗鱼 ×2 + 鱼 ×1 + 浆果 ×1', '鳗鱼 ×3 + 浆果 ×1'],
    note: '钓鱼流的主力：回血 40 + 理智 20，性价比很高。'
  },
  {
    id: 'unagi', cn: '鳗鱼饭', en: 'Unagi', img: 'Unagi.png',
    hg: 37.5, hp: 20, sa: 5, time: 10, perish: 10, prio: 20,
    req: ['鳗鱼 ≥ 1', '海带叶 ≥ 1'], forbid: [],
    m: { need: { eel: 1 }, min: { veggie: 0.5 } },
    tags: ['fish', 'heal'],
    samples: ['鳗鱼 ×1 + 海带叶 ×1 + 浆果 ×2'],
    note: '洞穴鳗鱼池玩家的日常口粮：10 秒出锅，回 20 血，是洞穴里最稳的回血料理。'
  },
  {
    id: 'california_roll', cn: '加州卷', en: 'California Roll', img: 'California_Roll.png',
    hg: 37.5, hp: 20, sa: 10, time: 10, perish: 10, prio: 20,
    req: ['海带叶 ≥ 2', '鱼度 ≥ 1'], forbid: [],
    m: { min: { fish: 1 }, need: { kelp: 2 } },
    tags: ['fish', 'sanity'],
    samples: ['海带叶 ×2 + 鳗鱼 ×1 + 浆果 ×1'],
    note: '海洋版块常用：海带管饱 + 鱼肉提品质。'
  },
  {
    id: 'monster_lasagna', cn: '怪物千层饼', en: 'Monster Lasagna', img: 'Monster_Lasagna.png',
    hg: 37.5, hp: -20, sa: -20, time: 10, perish: 10, prio: 10,
    req: ['怪物度 ≥ 2'], forbid: ['不可食用度'],
    m: { min: { monster: 2 }, forbid: ['inedible'] },
    tags: ['monster'],
    samples: ['怪物肉 ×2 + 浆果 ×2'],
    note: '怪物肉的「陷阱」：只要有 2 点怪物度就会强制出这道菜（优先级 10）。韦伯、沃特等角色可无惩罚食用。'
  },
  {
    id: 'monster_tartare', cn: '怪物鞑靼', en: 'Monster Tartare', img: 'Monster_Tartare.png',
    hg: 62.5, hp: -20, sa: -20, time: 10, perish: 10, prio: 30,
    req: ['怪物度 ≥ 2'], forbid: [], warly: true,
    m: { min: { monster: 2 }, forbid: ['inedible'] },
    tags: ['monster', 'warly'],
    samples: ['怪物肉 ×2 + 浆果 ×2'],
    note: '沃利专属：饥饿 62.5 比怪物千层饼高，但同样 −20 生命 / −20 理智，适合韦伯这类怪物肉无副作用的角色。'
  },
  {
    id: 'wet_goop', cn: '湿糯糊糊', en: 'Wet Goop', img: 'Wet_Goop.png',
    hg: 0, hp: 0, sa: 0, time: 10, perish: 6, prio: -10,
    req: ['不满足任何有效食谱'], forbid: [],
    m: { impossible: true },
    tags: ['monster'],
    samples: ['3 树枝 + 1 大肉（相互冲突的搭配）'],
    note: '配方失败时的产物，完全没有恢复效果；但它可以用来做「陆地夯实器」相关道具。'
  },
  {
    id: 'mushy_cake', cn: '蘑菇蛋糕', en: 'Mushy Cake', img: 'Mushy_Cake.png',
    hg: 25, hp: 0, sa: 10, time: 20, perish: 15, prio: 30,
    req: ['月亮蘑菇 ≥ 1', '红蘑菇 ≥ 1', '蓝蘑菇 ≥ 1', '绿蘑菇 ≥ 1'], forbid: [],
    m: { need: { mushroom_lunar: 1, mushroom_red: 1, mushroom_blue: 1, mushroom_green: 1 } },
    tags: ['veggie', 'sanity'],
    samples: ['月亮蘑菇 ×1 + 红蘑菇 ×1 + 蓝蘑菇 ×1 + 绿蘑菇 ×1'],
    note: '四种蘑菇各一个的固定配方，是唯一需要「集齐四色」的料理。'
  },
  {
    id: 'plain_omelette', cn: '普通煎蛋', en: 'Plain Omelette', img: 'Plain_Omelette.png',
    hg: 50, hp: 3, sa: 5, time: 10, perish: 10, prio: 0,
    req: ['蛋度 ≥ 3'], forbid: [],
    m: { min: { egg: 3 } },
    tags: ['egg', 'hunger'],
    samples: ['鸟蛋 ×3 + 蜂蜜 ×1', '高脚鸟蛋 ×1 + 树枝 ×2 + 浆果 ×1'],
    note: '蛋太多时的消耗口，50 饥饿够实在；高脚鸟蛋 1 个就满足 4 蛋度。'
  },
  {
    id: 'powdercake', cn: '粉末蛋糕', en: 'Powdercake', img: 'Powdercake.png',
    hg: 0, hp: -3, sa: 0, time: 10, perish: 18750, prio: 10,
    req: ['玉米（或爆米花鱼 / 玉米鳕鱼）≥ 1', '蜂蜜 ≥ 1', '树枝 ≥ 1'], forbid: [],
    m: { need: { corn: 1, honey: 1, twigs: 1 } },
    tags: ['monster'],
    samples: ['玉米 ×1 + 蜂蜜 ×1 + 树枝 ×1 + 冰块 ×1'],
    note: '保质期长达 18750 天（约 51 年），几乎没有实际用途，主要是「永久保存」的趣味玩法。'
  },
  {
    id: 'salsa_fresca', cn: '莎莎酱', en: 'Salsa Fresca', img: 'Salsa_Fresca.png',
    hg: 25, hp: 3, sa: 33, time: 10, perish: 15, prio: 20,
    req: ['番茄 ≥ 1', '洋葱 ≥ 1'], forbid: ['肉度', '蛋度', '不可食用度'],
    m: { need: { tomato: 1, onion: 1 }, forbid: ['meat', 'egg', 'inedible'] },
    tags: ['veggie', 'sanity'],
    samples: ['番茄 ×1 + 洋葱 ×1 + 浆果 ×2'],
    note: '理智 +33 的素食方案，10 秒出锅，前期农场流很实用。'
  },
  {
    id: 'soothing_tea', cn: '舒缓茶', en: 'Soothing Tea', img: 'Soothing_Tea.png',
    hg: 0, hp: 3, sa: 15, time: 20, perish: 3, prio: 1,
    req: ['勿忘我 ≥ 1', '甜度 ≥ 1', '冰度 ≥ 1'], forbid: ['肉度', '怪物度', '鱼度', '蔬菜度', '不可食用度', '乳制品度', '蛋度'],
    m: { need: { forget_me_not: 1 }, min: { sweet: 1, frozen: 1 }, forbid: ['meat', 'monster', 'fish', 'veggie', 'inedible', 'dairy', 'egg'] },
    tags: ['sanity', 'effect', 'hot'],
    eff: ['理智 +15，并在 1 分钟内再持续恢复 +30', '热食：体感温度 +40（5 秒）'],
    samples: ['勿忘我 ×1 + 蜂蜜 ×1 + 冰块 ×1 + 浆果 ×1'],
    note: '持续回理智的茶饮，和彩虹糖豆的持续回血效果可以叠加。'
  },
  {
    id: 'steamed_twigs', cn: '蒸树枝', en: 'Steamed Twigs', img: 'Steamed_Twigs.png',
    hg: 100, hp: 15, sa: 0, time: 10, perish: 20, prio: -5,
    req: ['不可食用度 ≥ 1（树枝 ×1）'], forbid: ['怪物度', '肉度', '鱼度', '蛋度', '油脂度', '乳制品度', '魔法度'],
    m: { min: { inedible: 1 }, forbid: ['monster', 'meat', 'fish', 'egg', 'fat', 'dairy', 'magic'] },
    tags: ['roughage'],
    samples: ['树枝 ×3 + 桦栗果 ×1', '树枝 ×2 + 骨头碎片 ×2'],
    note: '「非冒险家食物」：玩家自己不能吃，是专给皮弗娄牛（和饼干切割机）的饲料，喂牛相当于回 60 生命 / 100 饥饿。'
  },
  {
    id: 'stuffed_fish_heads', cn: '酿鱼头', en: 'Stuffed Fish Heads', img: 'Stuffed_Fish_Heads.png',
    hg: 75, hp: 20, sa: 0, time: 40, perish: 3, prio: 26,
    req: ['藤壶 ≥ 1', '鱼度 ≥ 1'], forbid: [],
    m: { need: { barnacle: 1 }, min: { fish: 1 } },
    tags: ['fish', 'hunger'],
    samples: ['藤壶 ×2 + 鱼 ×1 + 浆果 ×1'],
    note: '饥饿 75 的海鲜料理，代价是只有 3 天保质期，现做现吃。'
  },
  {
    id: 'stuffed_night_cap', cn: '酿蘑菇盖', en: 'Stuffed Night Cap', img: 'Stuffed_Night_Cap.png',
    hg: 18.75, hp: -20, sa: -15, time: 20, perish: 15, prio: 30,
    req: ['月亮蘑菇 ≥ 2', '怪物度 ≥ 1'], forbid: [],
    m: { min: { monster: 1 }, need: { mushroom_lunar: 2 } },
    tags: ['monster'],
    samples: ['月亮蘑菇 ×2 + 怪物肉 ×1 + 浆果 ×1'],
    note: '月亮蘑菇 + 怪物肉的「暗黑料理」，负面属性明显，一般只当作消耗怪物肉的手段。'
  },
  {
    id: 'stuffed_pepper_poppers', cn: '爆炒填馅辣椒', en: 'Stuffed Pepper Poppers', img: 'Stuffed_Pepper_Poppers.png',
    hg: 25, hp: 30, sa: -5, time: 40, perish: 15, prio: 20,
    req: ['辣椒 ≥ 1', '肉度 ≤ 1.5'], forbid: ['不可食用度'],
    m: { need: { pepper: 1 }, max: { meat: 1.5 }, forbid: ['inedible'] },
    tags: ['hot', 'heal', 'effect'],
    eff: ['热食：体感温度 +40（15 秒）'],
    samples: ['辣椒 ×1 + 小肉 ×2 + 胡萝卜 ×1'],
    note: '回血 30 且能升体感温度，冬季远行的好口粮。'
  },
  {
    id: 'tall_scotch_eggs', cn: '苏格兰蛋', en: 'Tall Scotch Eggs', img: 'Tall_Scotch_Eggs.png',
    hg: 150, hp: 60, sa: 5, time: 40, perish: 15, prio: 10,
    req: ['高脚鸟蛋 ≥ 1', '蔬菜度 ≥ 1'], forbid: [],
    m: { need: { tallbird_egg: 1 }, min: { veggie: 1 } },
    tags: ['hunger', 'heal', 'egg'],
    samples: ['高脚鸟蛋 ×1 + 胡萝卜 ×1 + 浆果 ×2'],
    note: '饥饿 150 + 回血 60 的超规格料理，只要一颗高脚鸟蛋，性价比极高。'
  },
  {
    id: 'turkey_dinner', cn: '火鸡正餐', en: 'Turkey Dinner', img: 'Turkey_Dinner.png',
    hg: 75, hp: 20, sa: 5, time: 60, perish: 6, prio: 10,
    req: ['鸡腿 ≥ 2', '肉度 ≥ 0.5', '蔬菜度 或 水果度 ≥ 0.5'], forbid: [],
    m: { need: { drumstick: 2 }, min: { meat: 0.5, veggie: 0.5 }, alt: [{ need: { drumstick: 2 }, min: { meat: 0.5, fruit: 0.5 } }] },
    tags: ['meat', 'hunger', 'hot', 'effect'],
    eff: ['热食：体感温度 +40（10 秒）'],
    fav: ['wigfrid'],
    samples: ['鸡腿 ×2 + 小肉 ×1 + 胡萝卜 ×1'],
    note: '需要两个鸡腿（火鸡 / 鸡腿来源），烹饪 60 秒偏慢。薇格弗德喜爱（×1.2）。'
  },
  {
    id: 'veggie_burger', cn: '素食汉堡', en: 'Veggie Burger', img: 'Veggie_Burger.png',
    hg: 37.5, hp: 30, sa: 33, time: 40, perish: 6, prio: 26,
    req: ['叶肉 ≥ 1', '洋葱 ≥ 1', '蔬菜度 ≥ 1'], forbid: [],
    m: { need: { leafy_meat: 1, onion: 1 }, min: { veggie: 1 } },
    tags: ['veggie', 'heal', 'sanity'],
    samples: ['叶肉 ×1 + 洋葱 ×1 + 蘑菇 ×2'],
    note: '叶肉的最佳去处：三维（37.5 / 30 / 33）都很均衡。'
  },
  {
    id: 'vegetable_stinger', cn: '蔬菜鸡尾酒', en: 'Vegetable Stinger', img: 'Vegetable_Stinger.png',
    hg: 25, hp: 3, sa: 33, time: 10, perish: 15, prio: 15,
    req: ['芦笋 ≥ 1 或 番茄 ≥ 1', '蔬菜度 ≥ 1.5', '冰度 ≥ 1'], forbid: ['肉度', '蛋度', '不可食用度'],
    m: { need: { asparagus: 1 }, min: { veggie: 1.5, frozen: 1 }, forbid: ['meat', 'egg', 'inedible'], alt: [{ need: { tomato: 1 }, min: { veggie: 1.5, frozen: 1 }, forbid: ['meat', 'egg', 'inedible'] }] },
    tags: ['veggie', 'sanity'],
    fav: ['winona'],
    samples: ['芦笋 ×1 + 冰块 ×1 + 蘑菇 ×2', '番茄 ×1 + 冰块 ×1 + 胡萝卜 ×1 + 蘑菇 ×1'],
    note: '理智 +33，薇诺娜喜爱（×1.6）。芦笋/番茄 + 冰 + 蔬菜即可。'
  },
  {
    id: 'ceviche', cn: '酸橘汁腌鱼', en: 'Ceviche', img: 'Ceviche.png',
    hg: 25, hp: 20, sa: 5, time: 10, perish: 10, prio: 20,
    req: ['冰度 ≥ 1', '鱼度 ≥ 2'], forbid: ['蛋度', '不可食用度'],
    m: { min: { fish: 2, frozen: 1 }, forbid: ['egg', 'inedible'] },
    tags: ['fish', 'cold', 'effect'],
    eff: ['冷食：体感温度 −40（10 秒）'],
    samples: ['冰块 ×1 + 鳗鱼 ×2 + 浆果 ×1'],
    note: '夏季降温 + 回血 20 的实用组合。'
  },
  {
    id: 'figatoni', cn: '无花果意面', en: 'Figatoni', img: 'Figatoni.png',
    hg: 56.25, hp: 30, sa: 15, time: 40, perish: 6, prio: 30,
    req: ['无花果 ≥ 1', '蔬菜度 ≥ 2'], forbid: ['肉度'],
    m: { need: { fig: 1 }, min: { veggie: 2 }, forbid: ['meat'] },
    tags: ['fruit', 'veggie', 'heal'],
    samples: ['无花果 ×1 + 胡萝卜 ×2 + 蘑菇 ×1'],
    note: '「月岛 / 猪镇」系列无花果的主力料理，三维都挺舒服。'
  },
  {
    id: 'figgy_frogwich', cn: '无花果蛙腿三明治', en: 'Figgy Frogwich', img: 'Figgy_Frogwich.png',
    hg: 25, hp: 20, sa: 5, time: 20, perish: 15, prio: 1,
    req: ['无花果 ≥ 1', '蛙腿 ≥ 1'], forbid: [],
    m: { need: { fig: 1, frog_leg: 1 } },
    tags: ['meat', 'fruit', 'hot'],
    eff: ['热食：体感温度 +40（15 秒）'],
    samples: ['无花果 ×1 + 蛙腿 ×1 + 浆果 ×2'],
    note: '无花果版蛙腿三明治，顺手加温。'
  },
  {
    id: 'figkabab', cn: '无花果烤串', en: 'Figkabab', img: 'Figkabab.png',
    hg: 37.5, hp: 20, sa: 10, time: 20, perish: 15, prio: 30,
    req: ['无花果 ≥ 1', '肉度 ≥ 1', '树枝 ≥ 1'], forbid: [],
    m: { need: { fig: 1, twigs: 1 }, min: { meat: 1 } },
    tags: ['meat', 'fruit', 'hot'],
    eff: ['热食：体感温度 +40（15 秒）'],
    samples: ['无花果 ×1 + 大肉 ×1 + 树枝 ×1 + 浆果 ×1'],
    note: '消耗无花果和树枝的套餐，自带升温效果。'
  },
  {
    id: 'fig_stuffed_trunk', cn: '无花果酿象鼻', en: 'Fig-Stuffed Trunk', img: 'Fig-Stuffed_Trunk.png',
    hg: 150, hp: 60, sa: 15, time: 40, perish: 15, prio: 40,
    req: ['无花果 ≥ 1', '考拉象鼻 ≥ 1'], forbid: [],
    m: { need: { fig: 1, koalefant_trunk: 1 } },
    tags: ['meat', 'hunger', 'heal'],
    samples: ['无花果 ×1 + 考拉象鼻 ×1 + 浆果 ×2'],
    note: '象鼻的正确用法：150 饥饿 + 60 血 + 15 理智，是整个游戏最全能的料理之一。'
  },
  {
    id: 'barnacle_linguine', cn: '藤壶意面', en: 'Barnacle Linguine', img: 'Barnacle_Linguine.png',
    hg: 75, hp: 30, sa: 20, time: 40, perish: 6, prio: 30,
    req: ['藤壶 ≥ 2', '蔬菜度 ≥ 2'], forbid: [],
    m: { need: { barnacle: 2 }, min: { veggie: 2 } },
    tags: ['fish', 'hunger', 'heal'],
    samples: ['藤壶 ×2 + 胡萝卜 ×2'],
    note: '海边玩家的高端主食：75 饥饿 + 30 血 + 20 理智。'
  },
  {
    id: 'barnacle_nigiri', cn: '藤壶握寿司', en: 'Barnacle Nigiri', img: 'Barnacle_Nigiri.png',
    hg: 37.5, hp: 40, sa: 15, time: 10, perish: 10, prio: 30,
    req: ['藤壶 ≥ 1', '海带叶 ≥ 1', '蛋度 ≥ 1'], forbid: [],
    m: { need: { barnacle: 1 }, min: { veggie: 0.5, egg: 1 } },
    tags: ['fish', 'heal'],
    samples: ['藤壶 ×1 + 海带叶 ×1 + 鸟蛋 ×1 + 浆果 ×1'],
    note: '10 秒出锅、回血 40，海边最有效率的回血食谱之一。'
  },
  {
    id: 'barnacle_pita', cn: '藤壶皮塔饼', en: 'Barnacle Pita', img: 'Barnacle_Pita.png',
    hg: 37.5, hp: 20, sa: 5, time: 40, perish: 15, prio: 25,
    req: ['藤壶 ≥ 1', '蔬菜度 ≥ 0.5'], forbid: [],
    m: { need: { barnacle: 1 }, min: { veggie: 0.5 } },
    tags: ['fish'],
    samples: ['藤壶 ×1 + 蘑菇 ×1 + 浆果 ×2'],
    note: '藤壶的最省事用法。'
  },
  {
    id: 'beefy_greens', cn: '牛肉绿叶菜', en: 'Beefy Greens', img: 'Beefy_Greens.png',
    hg: 75, hp: 40, sa: 5, time: 40, perish: 6, prio: 25,
    req: ['叶肉 ≥ 1', '蔬菜度 ≥ 3'], forbid: [],
    m: { need: { leafy_meat: 1 }, min: { veggie: 3 } },
    tags: ['veggie', 'hunger', 'heal'],
    samples: ['叶肉 ×1 + 胡萝卜 ×3'],
    note: '叶肉 + 3 点蔬菜度（3 个胡萝卜），75 饥饿 + 40 血。'
  },
  {
    id: 'leafy_meatloaf', cn: '叶肉糕', en: 'Leafy Meatloaf', img: 'Leafy_Meatloaf.png',
    hg: 37.5, hp: 8, sa: 5, time: 40, perish: 20, prio: 25,
    req: ['叶肉 ≥ 2'], forbid: [],
    m: { need: { leafy_meat: 2 } },
    tags: ['veggie'],
    samples: ['叶肉 ×2 + 浆果 ×2'],
    note: '叶肉的兜底配方，保质期 20 天，适合囤。'
  },
  {
    id: 'breakfast_skillet', cn: '早餐锅', en: 'Breakfast Skillet', img: 'Breakfast_Skillet.png',
    hg: 37.5, hp: 20, sa: 5, time: 20, perish: 20, prio: 1,
    req: ['蛋度 ≥ 1', '蔬菜度 ≥ 1'], forbid: ['肉度', '乳制品度'],
    m: { min: { egg: 1, veggie: 1 }, forbid: ['meat', 'dairy'] },
    tags: ['egg', 'veggie'],
    samples: ['鸟蛋 ×1 + 胡萝卜 ×1 + 浆果 ×2'],
    note: '纯蛋 + 菜的早餐组合，20 天保质期很适合远征。'
  },
  {
    id: 'creamy_potato_puree', cn: '奶油土豆泥', en: 'Creamy Potato Purée', img: 'Creamy_Potato_Puree.png',
    hg: 37.5, hp: 20, sa: 33, time: 20, perish: 15, prio: 20,
    req: ['土豆 ≥ 2', '大蒜 ≥ 1'], forbid: ['肉度', '不可食用度'],
    m: { need: { potato: 2, garlic: 1 }, forbid: ['meat', 'inedible'] },
    tags: ['veggie', 'sanity', 'heal'],
    samples: ['土豆 ×2 + 大蒜 ×1 + 浆果 ×1'],
    note: '理智 +33 且回血 20，是农场流的「血压」料理。'
  },
  {
    id: 'fancy_spiralled_tubers', cn: '精致螺旋土豆', en: 'Fancy Spiralled Tubers', img: 'Fancy_Spiralled_Tubers.png',
    hg: 37.5, hp: 3, sa: 15, time: 15, perish: 10, prio: 10,
    req: ['土豆 ≥ 1', '树枝 ≥ 1', '不可食用度 ≤ 2', '怪物度 ≤ 1'], forbid: ['肉度'],
    m: { need: { potato: 1, twigs: 1 }, max: { inedible: 2, monster: 1 }, forbid: ['meat'] },
    tags: ['veggie', 'sanity'],
    samples: ['土豆 ×1 + 树枝 ×1 + 浆果 ×2'],
    note: '土豆 + 树枝的小吃，理智 +15，专门用来消化多余树枝。'
  },
  {
    id: 'jelly_salad', cn: '果冻沙拉', en: 'Jelly Salad', img: 'Jelly_Salad.png',
    hg: 37.5, hp: 0, sa: 50, time: 40, perish: 6, prio: 50,
    req: ['叶肉 ≥ 2', '甜度 ≥ 2'], forbid: [],
    m: { need: { leafy_meat: 2 }, min: { sweet: 2 } },
    tags: ['sanity'],
    samples: ['叶肉 ×2 + 蜂蜜 ×2'],
    note: '理智 +50 的高优先级配方（50），叶肉 + 蜂蜜，性价比很好。'
  },
  {
    id: 'jellybeans', cn: '彩虹糖豆', en: 'Jellybeans', img: 'Jellybeans.png',
    hg: 0, hp: 2, sa: 5, time: 50, perish: null, prio: 12,
    req: ['蜂王浆 ≥ 1'], forbid: ['不可食用度', '怪物度'],
    m: { need: { royal_jelly: 1 }, forbid: ['inedible', 'monster'] },
    tags: ['effect', 'heal'],
    eff: ['食用后 2 分钟内持续恢复共 120 生命', '永不腐烂'],
    samples: ['蜂王浆 ×1 + 浆果 ×3'],
    note: 'Boss 战前的保命糖豆：持续回血 120，且不会腐烂，可以长期囤在背包里。'
  },
  {
    id: 'beefalo_treats', cn: '皮弗娄牛零食', en: 'Beefalo Treats', img: 'Beefalo_Treats.png',
    hg: 25, hp: 75, sa: 0, time: 40, perish: 20, prio: -4,
    req: ['桦栗果 ≥ 1', '不可食用度 ≥ 1', '勿忘我 ≥ 1'], forbid: ['肉度', '怪物度', '鱼度', '蛋度', '乳制品度', '噩梦燃料'],
    m: { need: { birchnut: 1, forget_me_not: 1 }, min: { inedible: 1 }, forbid: ['meat', 'monster', 'fish', 'egg', 'dairy'] },
    tags: ['roughage', 'heal'],
    samples: ['桦栗果 ×1 + 勿忘我 ×1 + 树枝 ×2'],
    note: '同样是喂牛的零食（玩家不能吃），喂皮弗娄牛能大幅回血，配合驯化系统使用。'
  },
  {
    id: 'asparagus_soup', cn: '芦笋汤', en: 'Asparagus Soup', img: 'Asparagus_Soup.png',
    hg: 18.75, hp: 20, sa: 5, time: 10, perish: 15, prio: 10,
    req: ['芦笋 ≥ 1', '蔬菜度 ≥ 1.5'], forbid: ['肉度', '不可食用度'],
    m: { need: { asparagus: 1 }, min: { veggie: 1.5 }, forbid: ['meat', 'inedible'] },
    tags: ['veggie', 'heal'],
    samples: ['芦笋 ×1 + 蘑菇 ×1 + 胡萝卜 ×1 + 浆果 ×1'],
    note: '芦笋的基础料理，10 秒出锅回血 20。'
  },
  {
    id: 'melonsicle', cn: '西瓜冰棍', en: 'Melonsicle', img: 'Melonsicle.png',
    hg: 12.5, hp: 3, sa: 20, time: 10, perish: 3, prio: 10,
    req: ['西瓜 ≥ 1', '冰度 ≥ 1', '树枝 ≥ 1'], forbid: ['肉度', '蛋度', '蔬菜度'],
    m: { need: { watermelon: 1, twigs: 1 }, min: { frozen: 1 }, forbid: ['meat', 'egg', 'veggie'] },
    tags: ['fruit', 'cold', 'sanity', 'effect'],
    eff: ['冷食：体感温度 −40（10 秒）'],
    samples: ['西瓜 ×1 + 冰块 ×1 + 树枝 ×1 + 浆果 ×1'],
    note: '理智 +20 且能降温，夏天农场西瓜的好去处。'
  },
  /* ---------- 沃利（便携烹饪锅）专属 ---------- */
  {
    id: 'bone_bouillon', cn: '骨头汤', en: 'Bone Bouillon', img: 'Bone_Bouillon.png',
    hg: 150, hp: 32, sa: 5, time: 40, perish: 10, prio: 30,
    req: ['骨头碎片 ≥ 2', '洋葱 ≥ 1', '不可食用度 < 3'], forbid: [], warly: true,
    m: { need: { bone_shard: 2, onion: 1 }, max: { inedible: 2 } },
    tags: ['hunger', 'warly'],
    samples: ['骨头碎片 ×2 + 洋葱 ×1 + 浆果 ×1'],
    note: '沃利专属：骨头碎片（复活后掉落 / 骨头堆）指定料理，150 饥饿的超廉价饱食方案，也属于「肉类食物」。'
  },
  {
    id: 'fresh_fruit_crepes', cn: '鲜果可丽饼', en: 'Fresh Fruit Crepes', img: 'Fresh_Fruit_Crepes.png',
    hg: 150, hp: 60, sa: 15, time: 40, perish: 10, prio: 30,
    req: ['水果度 ≥ 1.5', '黄油 ≥ 1', '蜂蜜 ≥ 1'], forbid: [], warly: true,
    m: { min: { fruit: 1.5 }, need: { butter: 1, honey: 1 } },
    tags: ['fruit', 'hunger', 'heal', 'warly'],
    fav: ['wes'],
    samples: ['黄油 ×1 + 蜂蜜 ×1 + 石榴 ×1 + 浆果 ×1'],
    note: '沃利专属，全游戏最强的「大餐」之一（150/60/15）。韦斯喜爱（×1.1）。'
  },
  {
    id: 'moqueca', cn: '海鲜杂烩', en: 'Moqueca', img: 'Moqueca.png',
    hg: 112.5, hp: 60, sa: 33, time: 40, perish: 8, prio: 30,
    req: ['鱼度 ≥ 0.25', '洋葱 ≥ 1', '番茄 ≥ 1'], forbid: [], warly: true,
    m: { min: { fish: 0.25 }, need: { onion: 1, tomato: 1 } },
    tags: ['fish', 'hunger', 'heal', 'sanity', 'warly'],
    samples: ['鱼 ×1 + 洋葱 ×1 + 番茄 ×1 + 浆果 ×1'],
    note: '沃利专属的均衡主菜：112.5 饥饿 / 60 血 / 33 理智，只要求 1 点鱼度。'
  },
  {
    id: 'puffed_potato_souffle', cn: '蓬松土豆蛋奶酥', en: 'Puffed Potato Soufflé', img: 'Puffed_Potato_Souffle.png',
    hg: 37.5, hp: 20, sa: 15, time: 40, perish: 10, prio: 30,
    req: ['土豆 ≥ 2', '蛋度 ≥ 1', '不能有肉'], forbid: ['肉度'], warly: true,
    m: { need: { potato: 2 }, min: { egg: 1 }, forbid: ['meat'] },
    tags: ['veggie', 'egg', 'warly'],
    samples: ['土豆 ×2 + 鸟蛋 ×2'],
    note: '沃利专属：土豆 + 蛋的日常口粮，材料极好凑。'
  },
  {
    id: 'hot_dragon_chili_salad', cn: '辣龙椒沙拉', en: 'Hot Dragon Chili Salad', img: 'Hot_Dragon_Chili_Salad.png',
    hg: 25, hp: -3, sa: 10, time: 15, perish: 15, prio: 30,
    req: ['辣椒 ≥ 1', '火龙果 ≥ 1', '蔬菜度 / 水果度填充'], forbid: [], warly: true,
    m: { need: { pepper: 1, dragonfruit: 1 } },
    tags: ['hot', 'effect', 'warly'],
    eff: ['热食：体感温度 +40，持续 5 分钟（且不会被环境冷却）'],
    samples: ['辣椒 ×1 + 火龙果 ×1 + 浆果 ×1 + 胡萝卜 ×1'],
    note: '沃利专属：冬季长时间保暖的核心料理，升温效果长达 5 分钟且不会因环境冷却而衰减。'
  },
  {
    id: 'asparagazpacho', cn: '芦笋冷汤', en: 'Asparagazpacho', img: 'Asparagazpacho.png',
    hg: 25, hp: 3, sa: 10, time: 10, perish: 15, prio: 30,
    req: ['芦笋 ≥ 2', '冰度 ≥ 2'], forbid: [], warly: true,
    m: { need: { asparagus: 2 }, min: { frozen: 2 } },
    tags: ['cold', 'effect', 'warly'],
    eff: ['冷食：体感温度 −40，持续 5 分钟（且不会被环境冷却）'],
    samples: ['芦笋 ×2 + 冰块 ×2'],
    note: '沃利专属：夏季防中暑的对应方案，降温 5 分钟。'
  },
  {
    id: 'fish_cordon_bleu', cn: '蓝带鱼排', en: 'Fish Cordon Bleu', img: 'Fish_Cordon_Bleu.png',
    hg: 37.5, hp: 20, sa: -10, time: 40, perish: 8, prio: 30,
    req: ['淡水鱼 ≥ 2', '蛙腿 ≥ 2'], forbid: [], warly: true,
    m: { min: { fish: 1, meat: 1 }, need: { frog_leg: 2 } },
    tags: ['fish', 'effect', 'warly'],
    eff: ['立刻清空潮湿度，并在 5 分钟内保持干燥'],
    samples: ['淡水鱼 ×2 + 蛙腿 ×2'],
    note: '沃利专属：雨季 / 洪水环境的对策料理，吃完直接「烘干」。'
  },
  {
    id: 'volt_goat_chaud_froid', cn: '伏特羊肉冻', en: 'Volt Goat Chaud-Froid', img: 'Volt_Goat_Chaud-Froid.png',
    hg: 37.5, hp: 3, sa: 10, time: 40, perish: 10, prio: 30,
    req: ['伏特羊角 ≥ 1', '甜度 ≥ 2'], forbid: [], warly: true,
    m: { need: { volt_goat_horn: 1 }, min: { sweet: 2 } },
    tags: ['effect', 'warly'],
    eff: ['攻击附带电击伤害，持续 5 分钟（对潮湿目标伤害提升 150%）'],
    samples: ['伏特羊角 ×1 + 蜂蜜 ×3'],
    note: '沃利专属的「战斗附魔」料理，配合潮湿目标能打出额外伤害。'
  },
  {
    id: 'grim_galette', cn: '恐怖国王饼', en: 'Grim Galette', img: 'Grim_Galette.png',
    hg: 25, hp: 1, sa: 5, time: 40, perish: 10, prio: 30,
    req: ['噩梦燃料 ≥ 2', '土豆 ≥ 1', '洋葱 ≥ 1'], forbid: [], warly: true,
    m: { need: { nightmare_fuel: 2, potato: 1, onion: 1 } },
    tags: ['effect', 'warly'],
    eff: ['食用后生命值与理智值对换'],
    samples: ['噩梦燃料 ×2 + 土豆 ×1 + 洋葱 ×1'],
    note: '沃利专属：血多理智低时「对调」状态，是翻身用的特殊手段。'
  },
  {
    id: 'glow_berry_mousse', cn: '发光浆果慕斯', en: 'Glow Berry Mousse', img: 'Glow_Berry_Mousse.png',
    hg: 37.5, hp: 3, sa: 10, time: 20, perish: 8, prio: 30,
    req: ['发光浆果 ≥ 1 或 小发光浆果 ≥ 2', '水果度 ≥ 1'], forbid: [], warly: true,
    m: { need: { glow_berry: 1 }, min: { fruit: 1 }, alt: [{ need: { glow_berry_small: 2 }, min: { fruit: 1 } }] },
    tags: ['fruit', 'effect', 'warly'],
    eff: ['食用后自身发光（提供照明），光照范围随时间衰减'],
    samples: ['小发光浆果 ×2 + 浆果 ×2', '发光浆果 ×1 + 香蕉 ×1 + 浆果 ×2'],
    note: '沃利专属：带一颗进洞穴就不用带光源，光照会慢慢变小。'
  }
];

/* ---------- 官方图片清单（images/ 目录） ---------- */
const IMG_ICONS = {
  hunger: 'images/icon_Hunger_Icon.png',
  sanity: 'images/icon_Sanity_Icon.png',
  health: 'images/icon_Health_Icon.png',
  rot: 'images/icon_Rot.png',
  pot: 'images/icon_Crock_Pot.png',
  prio: 'images/icon_Priority.png'
};
