/* ============================================================
   饥荒联机版百科 —— 世界 · 资源 数据 (js/world.js)
   四类：植物 plant · 地段 biome · 矿物 mineral · 岛屿 island

   数值与机制全部按 Don't Starve Together（联机版）核对，
   来源为官方维基各词条（含 /DST 页面）与词条正文，2026-09 校对。

   字段说明（自由文本字段可写「字符串」或 { cn, en } 对象，
   写成对象即自动按当前语言显示，方便后续补英文）：
     cat        分类（plant / biome / mineral / island）
     sub        二级分组 id（对应 WORLD_SUBS，用于顶部筛选条）
     kind       仅矿物用：vein 可开采对象 / item 开采产物
     where      生成环境 · 分布区域
     stages     生长阶段（植物）
     produce    采集产物（植物）        res     可生成资源（地段）
     yield      产出物（矿物）          mine    开采方式（矿物）
     regen      再生条件（矿物）
     access     位置与连通方式（岛屿）
     terrain    地形构成（岛屿）        special 特产资源（岛屿）
     note       补充说明 / 实用提示
     rel        关联条目 [{ c:'mineral', i:'moon_glass' }]
   ============================================================ */

const WORLD_CATS = {
  plant:   { cn: '植物', en: 'Plants',   icon: '🌿', color: '#7fc08a' },
  biome:   { cn: '群系', en: 'Biomes',   icon: '🗺️', color: '#c9a227' },
  mineral: { cn: '矿物', en: 'Minerals', icon: '⛏️', color: '#8fb8d0' },
  island:  { cn: '岛屿', en: 'Islands',  icon: '🏝️', color: '#6fb0d8' },
  structure: { cn: '建筑', en: 'Structures', icon: '🏛️', color: '#b08d6a' }
};
const WORLD_CAT_ORDER = ['plant', 'biome', 'structure', 'mineral', 'island'];

const WORLD_SUBS = {
  /* 植物 */
  p_shrub: { cn: '灌木 · 采集丛', en: 'Bushes',        cat: 'plant' },
  p_herb:  { cn: '草本 · 地面',   en: 'Herbs & Ground', cat: 'plant' },
  p_tree:  { cn: '树木',          en: 'Trees',          cat: 'plant' },
  p_cave:  { cn: '洞穴 · 海洋',   en: 'Cave & Ocean',   cat: 'plant' },
  /* 地段 */
  b_surface: { cn: '地表地形概览', en: 'Surface Terrain',   cat: 'biome' },
  b_special: { cn: '特殊区域',     en: 'Special',    cat: 'biome' },
  b_cave:    { cn: '洞穴地形',     en: 'Caves',      cat: 'biome' },
  b_ruins:   { cn: '远古遗迹',     en: 'Ruins',      cat: 'biome' },
  b_ocean:   { cn: '海洋地形',     en: 'Ocean',      cat: 'biome' },
  /* 群系（照官方「生物群系」词条分组） */
  b_biome_fixed: { cn: '森林世界 · 固定', en: 'Forest (Fixed)', cat: 'biome' },
  b_biome_rand:  { cn: '森林世界 · 概率', en: 'Forest (Random)', cat: 'biome' },
  b_lunar_biome: { cn: '月岛群系', en: 'Lunar Island', cat: 'biome' },
  b_cave_biome:  { cn: '洞穴 · 固定', en: 'Caves (Fixed)', cat: 'biome' },
  b_ruins_biome: { cn: '遗迹 · 固定', en: 'Ruins (Fixed)', cat: 'biome' },
  b_cave_rand:   { cn: '洞穴 · 概率', en: 'Caves (Random)', cat: 'biome' },
  b_ruins_rand:  { cn: '遗迹 · 概率', en: 'Ruins (Random)', cat: 'biome' },
  /* 建筑 */
  s_land:  { cn: '地标与奇观', en: 'Landmarks', cat: 'structure' },
  s_ruins: { cn: '远古遗迹建筑', en: 'Ancient Ruins', cat: 'structure' },
  s_field: { cn: '地表结构', en: 'Surface', cat: 'structure' },
  s_cave:  { cn: '洞穴结构', en: 'Caves', cat: 'structure' },
  s_ocean: { cn: '海洋结构', en: 'Ocean', cat: 'structure' },
  s_event: { cn: '活动结构', en: 'Events', cat: 'structure' },
  /* 矿物 */
  m_vein: { cn: '矿脉 · 可开采', en: 'Deposits', cat: 'mineral' },
  m_item: { cn: '矿物 · 产物',   en: 'Minerals', cat: 'mineral' },
  /* 岛屿 */
  i_lunar: { cn: '月亮群岛', en: 'Lunar',  cat: 'island' },
  i_far:   { cn: '远洋岛屿', en: 'Remote', cat: 'island' }
};

const WORLD = [

  /* ============================================================
     一、植物
     ============================================================ */
  /* ---------------- 灌木 · 采集丛 ---------------- */
  {
    id: 'berry_bush', cn: '浆果丛', en: 'Berry Bush', img: 'world_berry_bush.png',
    cat: 'plant', sub: 'p_shrub',
    where: '常见于草原，森林中偶尔生成；洞穴也可能生成。新世界的普通 / 多汁浆果丛变体由世界设置决定，地表和洞穴可分别不同。',
    stages: '3 个阶段：空枝（不可采） → 结满浆果（可采） → 被摘空（回到空枝）',
    produce: ['浆果 ×1', '被采摘时有概率惊出火鸡（Gobbler）', '烧毁后留下灰烬 ×1'],
    note: '摘完后需要 3–5 天重新结果（下雨会缩短）。用铲子可以挖起来移栽，但移栽后的丛需要先用粪便 / 腐烂物施肥才会结果，而且施肥一次只管 3–5 次采摘，越摘越慢（最长 7 天）。它是前期最稳的素菜来源，但极易燃，营地附近别点太多火把。'
  },
  {
    id: 'juicy_berry_bush', cn: '多汁浆果丛', en: 'Juicy Berry Bush', img: 'world_juicy_berry.png',
    cat: 'plant', sub: 'p_shrub',
    where: '联机版专属变体：开图时要么全地图都是普通浆果丛，要么都换成多汁浆果丛（地表与洞穴各自独立）',
    stages: '空枝 → 结果 → 被摘空；被摘后需要 9–13 天才能再次结果',
    produce: ['多汁浆果 ×3（直接掉在地上，要自己捡）', '同样有概率惊出火鸡（Gobbler）'],
    note: '产量是普通浆果丛的 3 倍，但多汁浆果腐烂极快——生吃只有约 2 天保质期，烤过只剩 1 天。适合“摘了马上吃”，不适合囤。'
  },
  {
    id: 'sapling', cn: '树枝（树苗）', en: 'Sapling', img: 'world_sapling.png',
    cat: 'plant', sub: 'p_shrub',
    where: '草原、森林最常见，其它地形也有',
    stages: '可采（带枝） → 被摘（光秃） → 4 天后重新长出树枝',
    produce: ['树枝 ×1', '烧毁后留下灰烬 ×1'],
    note: '冬天不会重新长枝，夏天会枯萎成「枯萎树苗」。和草丛不同，移栽后不需要施肥就能继续长，所以很适合在营地旁边排一排。它永远不会长成树。'
  },
  {
    id: 'grass_tuft', cn: '草丛', en: 'Grass Tuft', img: 'world_grass_tuft.png',
    cat: 'plant', sub: 'p_shrub',
    where: '萨瓦纳、草原最常见；洞穴的沉没森林也有',
    stages: '可采（长草） → 被割（秃） → 3 天后重新长草',
    produce: ['干草 ×1', '烧毁后留下灰烬 ×1'],
    note: '移栽后要先施肥才能长草，且每采摘 20 次需要再施一次肥；冬天不生长。草丛可用铲子挖起后移栽；默认生存模式下，野生草丛通常不通过常规资源再生自动补充。不建议把整丛当燃料烧。'
  },
  {
    id: 'spiky_bush', cn: '尖刺灌木', en: 'Spiky Bush', img: 'world_spiky_bush.png',
    cat: 'plant', sub: 'p_shrub',
    where: '沼泽与沙漠',
    stages: '可采 → 被采（光秃） → 4 天后重新长出',
    produce: ['树枝 ×1（采摘会扣 3 点生命）', '用铲子挖起：树枝 ×1 + 树苗 ×1'],
    note: '夏天和冬天都会重新长枝，是两种「不怕季节」的树枝来源之一。想安全拿树枝就用铲子直接挖（挖的过程不扣血）。'
  },
  {
    id: 'stone_fruit_bush', cn: '石果灌木', en: 'Stone Fruit Bush', img: 'world_stone_fruit.png',
    cat: 'plant', sub: 'p_shrub',
    where: '只长在月岛（含月森林、月浴场一带）',
    stages: '4 个阶段循环：幼苗 → 挂果 → 成熟可采（Pick） → 干裂；只有「成熟可采」阶段能采，其它阶段摘不到东西',
    produce: ['石果 ×3'],
    note: '冬天照样结果，是月岛最实用的蔬菜来源。铲子挖走重栽要先施肥（施肥一次管 3 次采摘）；如果用「正在发芽的石果」种下，则完全不需要施肥。'
  },
  {
    id: 'marble_shrub', cn: '大理石灌木（大理石芽）', en: 'Marble Shrub', img: 'world_marble_shrub.png',
    cat: 'plant', sub: 'p_shrub',
    where: '由玩家用大理石豆种出的可再生长资源，野外不自然生成',
    stages: '大理石芽（种下）→ 3 个阶段的灌木（圆球 / 方块 / 尖锥三种外形），需要镐子开采',
    produce: ['大理石', '用铲子挖掉会返还大理石豆'],
    note: '生长周期比常青树更慢：种下约 0.3–0.6 天到第 1 阶段，之后每个阶段 5–6.25 天；第 3 阶段停留 5–6.25 天后回到第 1 阶段。生长不受季节影响，但第 2 阶段到第 3 阶段需要附近有大理石。大理石豆可种成灌木并循环产出大理石；这是一种可持续来源，但不是唯一补充途径。'
  },

  /* ---------------- 草本 · 地面 ---------------- */
  {
    id: 'reeds', cn: '芦苇', en: 'Reeds', img: 'world_reeds.png',
    cat: 'plant', sub: 'p_herb',
    where: '沼泽（通常是成片出现，旁边往往就是触手区）',
    stages: '可割（长满） → 被割 → 3 天后重新长出',
    produce: ['芦苇 ×1', '烧毁后留下灰烬 ×1'],
    note: '不能挖走重栽。冬天不长；但如果被火烧掉，反而变成可再生的——被烧后的芦苇会在春天用 5 天重新长出来。沼泽里有著名的固定组合「芦苇陷阱」，一大片芦苇底下埋着密集触手，采之前先看清楚。'
  },
  {
    id: 'cactus', cn: '仙人掌', en: 'Cactus', img: 'world_cactus.png',
    cat: 'plant', sub: 'p_herb',
    where: '沙漠（绿洲沙漠里是外形不同的「绿洲仙人掌」，掉落一样）',
    stages: '可采（有果） → 被采 → 4 天后重新结果（春天只要 3 天）',
    produce: ['仙人掌肉（采摘时扣 6 点生命，穿护甲可以减伤）', '夏天额外掉仙人掌花'],
    note: '仙人掌是少数「冬天也照常生长」的植物，所以沙漠基地冬天也不缺菜。它不能铲走，只能等它自己重新长出来。'
  },
  {
    id: 'mandrake', cn: '曼德拉草', en: 'Mandrake', img: 'world_mandrake.png',
    cat: 'plant', sub: 'p_herb',
    where: '只出现在曼德拉草森林的草原地皮上；每个世界通常生成 2–5 株，常集中在同一区域。',
    stages: '没有生长阶段，一直是「种在地里」的状态，拔出来就会变成会跑的活曼德拉草',
    produce: ['曼德拉草（生吃 / 烤熟效果完全不同）'],
    note: '曼德拉草不能像普通作物一样种植；挖起后可在适宜条件下重新种回地面。地里的植株可再生：被烧毁后约 12.5 天会在附近有效位置尝试重新生成（受地形与障碍影响），因此并非只限于开局数量。活曼德拉草也可能通过特定掉落途径获得。'
  },
  {
    id: 'lureplant', cn: '食人花', en: 'Lureplant', img: 'world_lureplant.png',
    cat: 'plant', sub: 'p_herb',
    where: '每年春天会自己出现在玩家去过的地方；也可以用「肉球」手动种在任意位置',
    stages: '肉球 → 抽出花茎并长出眼球草丛（攻击范围） → 被击杀后掉回肉球',
    produce: ['肉球 ×1（击杀掉落，可再次种植）', '它肚子里吞掉的所有东西'],
    note: '食人花本身不攻击，但周围会生成一圈「眼球草」：会咬靠近的生物、并把地上的掉落物抢回花里。想回收被抢的东西，打死食人花就能全部拿回来。放在基地外围可以当自动拾荒器，但也会吃掉你想捡的东西。'
  },
  {
    id: 'flower', cn: '花', en: 'Flower', img: 'world_flower.png',
    cat: 'plant', sub: 'p_herb',
    where: '草原、森林、萨瓦纳；沼泽与岩石地带不长',
    stages: '没有真正的阶段，采摘后原地消失，一段时间后在别处重新生成',
    produce: ['花瓣 ×1（吃下 +1 生命）', '采摘本身 +5 理智'],
    note: '一共 10 种外观，效果完全相同。摘花是最早期、最安全的「回理智」手段；采花瓣还能做花环、蜜蜂相关道具。'
  },
  {
    id: 'tumbleweed', cn: '风滚草', en: 'Tumbleweed', img: 'world_tumbleweed.png',
    cat: 'plant', sub: 'p_herb',
    where: '沙漠里成片滚动，也常被风带进旁边地形；浣熊猫也会吐出来',
    stages: '没有阶段，滚过来直接采摘即可',
    produce: ['随机 3 件物品（含草、树枝、花瓣、硝石、宝石、蓝图，甚至怪物）'],
    note: '每件物品都是独立随机的，所以一个风滚草可能开出好几个同样的东西。如果开出来的是非被动生物，它会立刻攻击你——采完别站着发呆。'
  },

  /* ---------------- 树木 ---------------- */
  {
    id: 'evergreen', cn: '常青树', en: 'Evergreen', img: 'world_evergreen.png',
    cat: 'plant', sub: 'p_tree',
    where: '森林、草原最常见；除岩石地带与萨瓦纳外几乎到处都有（也可以自己种）',
    stages: '4 个阶段循环：小 → 中 → 大 → 老（老年树针叶变灰）',
    produce: ['小树：木头 ×1', '中树：木头 ×2 + 松果 ×1', '老树：松果 ×1', '树桩用铲子挖：木头 ×1'],
    note: '砍倒后会留下树桩，用铲子挖还能再拿 1 根木头。森林里连续砍太多会刷出树精，砍之前先看一眼周围有没有会动的树。'
  },
  {
    id: 'birchnut_tree', cn: '白桦树', en: 'Birchnut Tree', img: 'world_birchnut_tree.png',
    cat: 'plant', sub: 'p_tree',
    where: '草原常见，落叶林里成片生长',
    stages: '3 个阶段循环：矮 → 中 → 高（秋天叶子变红，冬天掉光叶子）',
    produce: ['木头 ×1–3', '桦栗果 ×0–2（秋天最多，冬天一个都不掉）'],
    note: '站在树下能挡一部分雨水、减缓过热。掉落的桦栗果既是食物也能烤着吃，还能种出新的白桦树。'
  },
  {
    id: 'spiky_tree', cn: '多刺树', en: 'Spiky Tree', img: 'world_spiky_tree.png',
    cat: 'plant', sub: 'p_tree',
    where: '沼泽与沙漠',
    stages: '没有生长周期，砍倒就没有了（也无法重栽）',
    produce: ['树枝（主要掉落）', '木头 ×1（20% 概率）', '树桩用铲子挖：木头 ×1'],
    note: '沼泽里非常方便的树枝来源，代价是树本身就是障碍物、砍的时候得挤在触手堆旁边操作。'
  },
  {
    id: 'palmcone_tree', cn: '棕榈松树', en: 'Palmcone Tree', img: 'world_palmcone_tree.png',
    cat: 'plant', sub: 'p_tree',
    where: '只在月港（猴岛）生成；用「异常传送门」掉出的棕榈松果芽可以再种',
    stages: '矮 → 中 → 高（只有高阶段才会掉棕榈松果芽）',
    produce: ['高树：木头 ×3 + 棕榈松果鳞 ×2 + 棕榈松果芽 ×1', '树桩用铲子挖：木头 ×2'],
    note: '棕榈松果鳞是做船炮套件、码头套件的材料。它不会刷树精，所以可以放心让熊獾反复撞它来刷木头。'
  },
  {
    id: 'twiggy_tree', cn: '树枝树', en: 'Twiggy Tree', img: 'world_twiggy_tree.png',
    cat: 'plant', sub: 'p_tree',
    where: '洞穴（沉没森林等），是联机版对树苗的资源型替代',
    stages: '4 个阶段循环：矮 → 中 → 高 → 老，一整轮 9.5–15.5 天',
    produce: ['树枝', '木头', '树枝树锥果（可种）'],
    note: '四个季节都不受影响，是洞穴里最稳定的树枝来源；每次从「老」变回「矮」时还会往地上丢树枝。'
  },
  {
    id: 'totally_normal_tree', cn: '完全正常的树', en: 'Totally Normal Tree', img: 'world_totally_normal_tree.png',
    cat: 'plant', sub: 'p_tree',
    where: '森林地形，周围常常围着一圈邪恶花；不是每张地图都有',
    stages: '没有阶段，砍倒即止',
    produce: ['活木 ×2', '清扫器 ×1（25% 概率）', '树桩用铲子挖：活木 ×1'],
    note: '活木是做活木法杖、活木盔甲的核心材料，早期别把这棵树当普通柴火砍了。砍完那圈邪恶花不会消失。'
  },
  {
    id: 'marble_tree', cn: '大理石树', en: 'Marble Tree', img: 'world_marble_tree.png',
    cat: 'plant', sub: 'p_tree',
    where: '棋子地形，通常长在棋盘地面上，周围是邪恶花',
    stages: '没有阶段，只能开采',
    produce: ['大理石 ×1', '大理石 ×1（50% 概率额外一块）'],
    note: '不可燃、不生长，用普通镐子慢慢挖就行。棋子地形往往还有大理石柱、发条生物，是早期最危险也最肥的大理石来源。'
  },

  /* ---------------- 洞穴 · 海洋 ---------------- */
  {
    id: 'light_flower', cn: '光花', en: 'Light Flower', img: 'world_light_flower.png',
    cat: 'plant', sub: 'p_cave',
    where: '洞穴与远古遗迹，泥泞地形最密集',
    stages: '3 种形态：单灯泡 / 双灯泡 / 三灯泡；可以采下发光的那半（采完就不再发光）',
    produce: ['灯泡 ×1–3（单 / 双 / 三灯泡分别给 1 / 2 / 3 个）'],
    note: '光花本身是洞穴里可靠的天然光源，能保护玩家免受查理袭击；在联机版中，附近有其他光源时才会点亮，随后会进入休眠期。采摘后会暂时失去发光能力。单灯泡约 3 天再生，双灯泡 4–5 天，三灯泡约 6 天；联机版可再生。'
  },
  {
    id: 'mushtree', cn: '蘑菇树', en: 'Mushtree', img: 'world_mushtree.png',
    cat: 'plant', sub: 'p_cave',
    where: '洞穴中自然生成，同时充当天然光源',
    stages: '普通形态与「开花」形态；蓝 / 红 / 绿三种颜色',
    produce: ['蓝色蘑菇树：木头 ×2 + 蓝蘑菇', '红色 / 绿色蘑菇树：木头 ×1 + 对应蘑菇', '树桩用铲子挖：木头 ×1'],
    note: '砍掉会失去一处光源，建议留几棵当路标。三种颜色分别对应蓝 / 红 / 绿蘑菇，可以直接在洞穴里凑齐蘑菇料理的材料。'
  },
  {
    id: 'cave_lichen', cn: '洞穴地衣', en: 'Cave Lichen', img: 'world_cave_lichen.png',
    cat: 'plant', sub: 'p_cave',
    where: '远古遗迹，荒野地形最常见，村庄偶见，迷宫尽头也有少量',
    stages: '可采 → 被采 → 3–5 天后重新长出',
    produce: ['地衣 ×1', '烧毁后留下灰烬 ×1'],
    note: '地衣算蔬菜，可以下锅；遗迹里数量非常多，是洞穴玩家最容易囤的一类素菜。不能移栽，冬天不长。'
  },
  {
    id: 'fern', cn: '蕨类', en: 'Fern', img: 'world_fern.png',
    cat: 'plant', sub: 'p_cave',
    where: '洞穴各处随机生长，遗迹里更多',
    stages: '普通蕨类；在喷气孔地形会变成「枯萎蕨类」',
    produce: ['蕨叶 ×1（吃下 +1 生命）', '枯萎蕨类采到的是干草 ×1'],
    note: '遗迹进入噩梦期时，部分蕨类会变红。本身没什么大用处，但早期在洞穴里迷路时可以靠它回一点血。'
  },
  {
    id: 'bull_kelp', cn: '海带', en: 'Bull Kelp', img: 'world_bull_kelp.png',
    cat: 'plant', sub: 'p_cave',
    where: '海洋里成片生长，岩石海滩上也有搁浅的',
    stages: '没有阶段，靠近即可采集海带叶',
    produce: ['海带叶 ×1（可晒成干海带；用大晾肉架晒还能额外得到盐晶）', '海洋漂浮物里也能开出海带叶'],
    note: '海带叶生吃会掉血掉理智，但下锅是很好的蔬菜填充物，也是加州卷的必需材料。出海前记得带够，它是远洋航行最方便的口粮。',
    rel: [{ c: 'biome', i: 'ocean' }, { c: 'biome', i: 'rocky_beach' }]
  },

  /* ============================================================
     二、地段
     ============================================================ */
  /* ---------------- 地表主要地形 ---------------- */
  {
    id: 'forest', cn: '森林', en: 'Forest', img: 'world_forest.png',
    cat: 'biome', sub: 'b_surface',
    where: '深绿色的地面，地图上成片出现，也可能出现在其它地形的中央',
    res: ['常青树（极密集）', '岩石', '坟墓', '蜘蛛巢', '萤火虫', '蘑菇'],
    note: '资源最杂也最危险的地形：树太密，一次雷击或一次砍伐过量就可能引发大火、刷出树精。新手不要在森林深处过夜。'
  },
  {
    id: 'grassland', cn: '草原', en: 'Grassland', img: 'world_grassland.png',
    cat: 'biome', sub: 'b_surface',
    where: '玩家每次进入新世界都一定出生在草原上（哪怕是小小一条）',
    res: ['草丛', '树枝（树苗）', '胡萝卜', '花', '浆果丛', '燧石', '少许常青树', '鼹鼠窝'],
    note: '最安全、资源最均衡的落脚点，缺点是木头和石头都得往外跑。想稳一点发育，基地就建在草原与森林的交界上。'
  },
  {
    id: 'savanna', cn: '萨瓦纳草原', en: 'Savanna', img: 'world_savanna.png',
    cat: 'biome', sub: 'b_surface',
    where: '金黄色干草地面，常与草原、森林相邻',
    res: ['密集草丛', '皮弗娄牛（唯一的天然产地）', '兔子', '红鸟 / 乌鸦', '偶尔的花与蝴蝶', '罕见的蜘蛛巢'],
    note: '植物稀少的「牛场」——需要牛毛、牛粪、牛奶就盯着这里。牛群被激怒会集体冲锋，定居前先确认距离。'
  },
  {
    id: 'rockyland', cn: '岩石地带', en: 'Rockyland', img: 'world_rockyland.png',
    cat: 'biome', sub: 'b_surface',
    where: '岩石地面与光秃地面交错',
    res: ['大量岩石（含金矿变体）', '迷你冰川（冰块）', '高脚鸟巢（常有 4–5 个）', '只有乌鸦', '零星的树苗 / 草丛'],
    note: '联机版矿石和冰块的主产地。高脚鸟护巢攻击性很强，取石前先把巢周围的鸟引开或干掉。'
  },
  {
    id: 'marsh', cn: '沼泽', en: 'Marsh', img: 'world_marsh.png',
    cat: 'biome', sub: 'b_surface',
    where: '暗绿偏褐色的沼泽地面，常与水边、森林相接',
    res: ['触手（主动攻击）', '鱼人', '芦苇', '尖刺灌木', '青蛙', '蜘蛛巢', '绿蘑菇', '芦苇陷阱固定组合'],
    note: '公认最危险的地形：触手不会警告就直接抽人，鱼人走近即群起围攻。好处是蜘蛛、触手、鱼人天天互殴，地上经常能白捡一堆战利品。'
  },
  {
    id: 'mosaic', cn: '混合地形', en: 'Mosaic', img: 'world_mosaic.png',
    cat: 'biome', sub: 'b_surface',
    where: '每张地图通常只有一块，但面积很大',
    res: ['森林地面为主，夹杂沼泽 / 岩石 / 萨瓦纳地面与无地面', '若干圆形小湖泊（小片海洋）', '兔王 / 猪王', '混合的植物与矿物'],
    note: '标志是「一块地里有好几种地面」加上几个小湖。因为物产杂，找稀有资源时常来这里碰运气。'
  },
  {
    id: 'deciduous', cn: '落叶林（桦树林）', en: 'Deciduous Forest', img: 'world_deciduous.png',
    cat: 'biome', sub: 'b_surface',
    where: '落叶地面，通常与草原相连',
    res: ['白桦树（成片）', '空心树桩（浣熊猫）', '格罗姆雕像（唯一产地，守着格罗姆）', '全地图最密集的萤火虫'],
    note: '冬天的落叶林树叶会掉光，视野反而变好。格罗姆雕像每年满月会刷出格罗姆，是重要的理智/理智管理道具来源。'
  },
  {
    id: 'desert', cn: '沙漠', en: 'Desert', img: 'world_desert.png',
    cat: 'biome', sub: 'b_surface',
    where: '每张地图有两个沙漠：一个住着龙蝇，另一个有绿洲（绿洲沙漠）',
    res: ['仙人掌', '尖刺灌木', '多刺树', '风滚草', '岩石', '骨头', '龙蝇（龙蝇沙漠）', '蚁狮与绿洲（绿洲沙漠）'],
    note: '两个沙漠内容完全不同：龙蝇沙漠适合刷宝石和鳞片，绿洲沙漠夏天能靠绿洲降温、还能找蚁狮做交易。仙人掌只在沙漠有。'
  },
  {
    id: 'chess', cn: '棋子地形', en: 'Chess Biome', img: 'world_chess.png',
    cat: 'biome', sub: 'b_surface',
    where: '棋盘地面，通常围着「木质传送装置」出现',
    res: ['大理石树与大理石柱', '发条骑士 / 主教 / 战车', '邪恶花', '棋盘地面（可铲走做地板）'],
    note: '大理石来源之一，同时是早期最危险的区域——发条生物伤害高、成组出现。想拿大理石，最好带护甲和至少一把长矛。'
  },

  /* ---------------- 特殊区域 ---------------- */
  {
    id: 'beehive', cn: '蜂巢群（蜂王平原）', en: 'Gigantic Beehive Area', img: 'world_beehive.png',
    cat: 'biome', sub: 'b_special',
    where: '只出现在草原上：整张地图只有 1 座巨型蜂巢，随机落在草原某处，旁边通常成组分布普通蜂巢与杀人蜂巢',
    res: ['巨型蜂巢（敲击掉蜂蜜 / 蜜脾，敲多了会召出蜂王）', '普通蜂巢（蜂蜜 ×3 + 蜜脾 ×1）', '杀人蜂巢（蜂蜜 ×3 + 蜜脾 ×1）', '蜜蜂与杀人蜂'],
    note: '整张图唯一能「白拿蜂蜜」的地方：每敲一下约 49% 掉 1 个蜂蜜、1% 掉 1 个蜜脾，蜂蜜流约每 120 秒恢复一点，所以耐心点敲可以不惊动蜂王。敲的次数够多蜂王就会现身——她是联机版最早的 Boss 之一，单挑非常吃力。蜂巢被毁后会变成一小块蜂蜜，20 天内分 4 个阶段长回巨型蜂巢，因此蜜脾是可再生资源。'
  },
  {
    id: 'pig_village', cn: '猪人村', en: 'Pig Village', img: 'world_pig_village.png',
    cat: 'biome', sub: 'b_special',
    where: '地表固定小区域（多出现在草原 / 森林交界），以猪王的居住地为中心：一圈猪屋围着猪王',
    res: ['猪人与猪人守卫', '猪屋（可锤掉拿木板和猪皮）', '猪王（用肉类 / 玩具换金块）'],
    note: '早期最实用的交易点：喂猪人吃怪物肉能收买跟班（会帮你砍树、打架），给猪王“礼物”能换金块。满月时猪人会变疯猪，别在满月的夜里待在猪村。'
  },

  /* ---------------- 洞穴地形 ---------------- */
  {
    id: 'sunken_forest', cn: '沉没森林', en: 'Sunken Forest', img: 'world_sunken_forest.png',
    cat: 'biome', sub: 'b_cave',
    where: '洞穴层，通常在洞口附近',
    res: ['草地面与森林地面', '树苗、草丛、浆果丛、常青树', '洞穴光源', '兔子', '池塘', '蜘蛛巢'],
    note: '洞穴里最适合当据点的地形：光照、植被、水源、兔子都齐，与地表草原几乎一样安全。缺点是离远古遗迹很远。'
  },
  {
    id: 'mushroom_forest', cn: '蓝蘑菇树林', en: 'Mushtree Forest', img: 'world_mushroom_forest.png',
    cat: 'biome', sub: 'b_cave',
    where: '洞穴层，成片蓝色蘑菇树连成一片；月亮洞穴总是紧挨着它生成',
    res: ['密集的蓝色蘑菇树（木头 + 蓝蘑菇）', '光花', '蓝色蘑菇（地面）'],
    note: '洞穴里少数自带光照的区域，也是找月亮洞穴的路标——看到大片蓝蘑菇树，月亮洞穴就在旁边。'
  },
  {
    id: 'fumarole', cn: '喷气孔地形', en: 'Fumarole Biome', img: 'world_fumarole.png',
    cat: 'biome', sub: 'b_cave',
    where: '洞穴层，成片喷气孔汇聚的地方',
    res: ['喷气孔（地热）', '巨石枝树（Boulderbough）', '大型枯萎怪（被动但会伤人的机制）', '枯萎蕨类（干草）'],
    note: '洞穴里最容易「热到中暑」的地方，靠近喷气孔会持续升温，影缝开启后伤害更高。带保温石和降温物品再进去，或者干脆夏天别来。'
  },

  /* ---------------- 远古遗迹 ---------------- */
  {
    id: 'wilds', cn: '荒野（遗迹未开发区）', en: 'Wilds', img: 'world_wilds.png',
    cat: 'biome', sub: 'b_ruins',
    where: '远古遗迹层，占遗迹面积最大的一块',
    res: ['洞穴地衣', '池塘', '光花', '啜食者', '蓝蘑菇', '噩梦裂隙', '深渊蠕虫（随机埋伏）'],
    note: '遗迹的“荒野”：除了少数通往别处的符文地面小径，其余全是泥地面。深渊蠕虫埋在土里突然冒头，走路别贴墙、别一路直线猛冲。'
  },
  {
    id: 'village', cn: '远古村庄', en: 'Village', img: 'world_village.png',
    cat: 'biome', sub: 'b_ruins',
    where: '远古遗迹层，曾是远古文明的居住区',
    res: ['弹跳猴（Splumonkey）', '洞穴香蕉树（香蕉）', '坍塌的远古建筑', '完整 / 破损的遗迹器物（可锤出铥矿）'],
    note: '遗迹里最容易“全武行”的地方——弹跳猴会成群抢东西。香蕉树能提供稳定的洞穴食物，也是做香蕉料理的原料。'
  },
  {
    id: 'military', cn: '军事区', en: 'Military Biome', img: 'world_military.png',
    cat: 'biome', sub: 'b_ruins',
    where: '远古遗迹层；入口一定是一座螺旋符文地面小岛，中央立着一尊远古雕像',
    res: ['大量破损发条生物', '远古雕像', '远古宝箱', '洞穴地面为主'],
    note: '破损发条生物遍布整块区域，走两步就被追。好处是它们是齿轮（做冰箱、发条装备）的稳定来源，可以逐个引出来打死。'
  },
  {
    id: 'sacred', cn: '圣地', en: 'Sacred Biome', img: 'world_sacred.png',
    cat: 'biome', sub: 'b_ruins',
    where: '远古遗迹层，一定与迷宫的最深处相连',
    res: ['紫色符文地面', '远古雕像', '噩梦灯（噩梦燃料来源）', '成群的破损发条生物（“兵营”区块）'],
    note: '外观与军事区很像，靠地面的紫符文区分。噩梦灯是刷噩梦燃料的主场，也是远古织影者（Boss）的所在地。'
  },
  {
    id: 'labyrinth', cn: '迷宫', en: 'Labyrinth', img: 'world_labyrinth.png',
    cat: 'biome', sub: 'b_ruins',
    where: '远古遗迹层，在圣地之前的一段扭曲迷宫',
    res: ['华丽宝箱（死胡同里，必有一只）', '悬吊深渊潜伏者（密集）', '铥矿', '光花与地衣', '极少的噩梦灯'],
    note: '每条死胡同尽头都有一只华丽宝箱，价值很高；但潜伏者会在地面织网，踩到立刻被围。走迷宫时贴着蛛网边缘绕，或者用瞬移道具直接跳过去。'
  },

  /* ---------------- 海洋地形 ---------------- */
  {
    id: 'ocean', cn: '海洋', en: 'Ocean', img: 'world_ocean.png',
    cat: 'biome', sub: 'b_ocean',
    where: '环绕整块大陆；联机版里可以航行的水域（离陆地越远浪越大）',
    res: ['海带', '盐岩（盐晶）', '海草', '漂浮木与海骨', '岩石大白鲨 / 饼干切割机 / 龙虾', '海洋鱼类', '漂流瓶'],
    note: '必须造船或木筏才能进入远洋。海上没有掩体、血线一低就很难跑，出海前一定要带足食物、灯具、修船材料，还有回程的导航（指北针 / 地图）。',
    rel: [{ c: 'plant', i: 'bull_kelp' }, { c: 'mineral', i: 'salt_formation' }, { c: 'island', i: 'lunar_island' }]
  },
  {
    id: 'rocky_beach', cn: '岩石海滩', en: 'Rocky Beach', img: 'world_rocky_beach.png',
    cat: 'biome', sub: 'b_ocean',
    where: '只作为月岛区域的一部分出现，铺满岩石海滩地面',
    res: ['无眼怪（踩上去 60 伤害的陷阱）', '破碎蜘蛛洞（月蜘蛛）', '芦苇', '岩石', '漂浮木与海骨', '搁浅的海带'],
    note: '登月岛的“玄关”，也是月岛最危险的一段：无眼怪埋在地上看不出区别，踩上去瞬间掉 60 血；还有成群月蜘蛛。带护甲再走。',
    rel: [{ c: 'island', i: 'lunar_island' }]
  },

  /* ============================================================
     三、矿物
     ============================================================ */
  /* ---------------- 矿脉 · 可开采 ---------------- */
  {
    id: 'boulder', cn: '岩石（矿石）', en: 'Boulder', img: 'world_boulder.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '萨瓦纳与岩石地带最密集，其它地形也可能出现；按大小分三档状态',
    yield: ['普通岩石：石头 ×1 + 燧石（概率）', '光滑岩石：石头 + 硝石 ×1 以上', '含金岩石：石头 + 金块'],
    mine: '镐子 / 华丽镐 / 镐斧；一株岩石要敲几下（大岩石更多）',
    regen: '矿脉本身不重生，但地表有两条可再生途径：陨石雨落下新矿、蚁狮落石；洞穴里影缝开启时的地震也会带来新矿',
    note: '整块地图的矿石总量是有限的，所以石头用完之前最好别把地板全铺成石头。想稳定刷矿就盯着陨石雨区域和蚁狮的落石。'
  },
  {
    id: 'gold_boulder', cn: '含金岩石', en: 'Gold Veined Boulder', img: 'world_gold_boulder.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '与普通岩石混在一起生成，岩石地带与萨瓦纳最多',
    yield: ['石头', '金块 ×1 以上'],
    mine: '镐子 / 华丽镐 / 镐斧',
    regen: '同普通岩石：靠陨石雨、蚁狮落石、影缝地震补充',
    note: '外观上有一道金色矿脉，很好认。前期缺金块（做科学机器、金工具）时优先找它，也可以让猪王用肉类换。'
  },
  {
    id: 'stalagmite', cn: '石笋', en: 'Stalagmite', img: 'world_stalagmite.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '洞穴层的「岩石」对应物，分普通石笋与高石笋，各有完整 / 中等 / 残破三种状态',
    yield: ['石头 ×3', '燧石 ×1.6（1 个 + 60% 再掉 1 个）', '金块 ×1.25（1 个 + 25% 再掉 1 个）', '红 / 蓝宝石等（低概率）'],
    mine: '镐子 / 华丽镐 / 镐斧',
    regen: '与地表岩石同理：洞穴里会随着落石 / 地震事件补充新的石笋',
    note: '宝石的稳定来源之一，也是洞穴里最容易拿到的金块来源。三种状态的掉落表不同，挑大的打更划算。'
  },
  {
    id: 'marble_pillar', cn: '大理石柱', en: 'Marble Pillar', img: 'world_marble_pillar.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '棋子地形，常围绕「木质传送装置」出现，旁边一般有发条生物',
    yield: ['大理石 ×2–3（2 块 + 33% 概率多 1 块）'],
    mine: '普通镐子需要敲 10 下，镐斧只要 8 下',
    regen: '不会再生；想持续获得大理石要靠大理石灌木（大理石豆）循环',
    note: '前期大理石主要来源，但柱子在棋子地形正中央，通常要先清掉发条生物才能安心挖。',
    rel: [{ c: 'plant', i: 'marble_shrub' }, { c: 'mineral', i: 'marble' }]
  },
  {
    id: 'mini_glacier', cn: '迷你冰川', en: 'Mini Glacier', img: 'world_mini_glacier.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '地表各处，岩石地带尤其多',
    yield: ['冰块', '石头'],
    mine: '镐子 / 华丽镐 / 镐斧',
    regen: '冬天结到最满、春天开始融化，到夏天只剩一小滩水，秋天再慢慢冻回来；旁边放火堆会加速融化',
    note: '冰块是做冰淇淋、冰帽、保温石的关键材料。想在夏天用冰，就得在冬天（或秋天的冰块还满时）提前囤。'
  },
  {
    id: 'meteor_boulder', cn: '陨石 / 月岩矿', en: 'Meteor Boulder', img: 'world_meteor_boulder.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '陨石落在「岩石地带与混合地形交界」一带，砸出的坑里留下带蓝色裂纹的月岩矿',
    yield: ['石头 ×1', '燧石 ×1', '月岩 ×2', '月岩 ×1（60% 概率第三块）', '月岩 ×1（30% 概率第四块）'],
    mine: '镐子 / 华丽镐 / 镐斧；可疑的月岩雕像也能挖出月岩',
    regen: '陨石会持续从天而降（落点有影子预警，被砸中掉 50 血），属于持续再生资源',
    note: '月岩是做月岩墙、月岩棋盘、月岩雕像的材料。站在陨石区域时注意脚下阴影——影子变大就是有石头要砸下来了。',
    rel: [{ c: 'mineral', i: 'moon_rock' }]
  },
  {
    id: 'moon_glass', cn: '月玻璃', en: 'Moon Glass', img: 'world_moon_glass.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '月岛（月矿场、月浴场一带），月亮洞穴的玻璃绿洲上方',
    yield: ['月亮碎片 ×2', '月亮碎片 ×1（25% 概率额外一块）'],
    mine: '镐子 / 华丽镐 / 镐斧',
    regen: '玻璃绿洲里的月玻璃每次满月有 10% 概率重新出现，所以是可再生的',
    note: '月亮碎片是月玻璃斧、月玻璃刀、玻璃制品的原料。登月岛之后优先清一批。',
    rel: [{ c: 'island', i: 'lunar_island' }, { c: 'mineral', i: 'moon_shard' }]
  },
  {
    id: 'vitreoasis', cn: '玻璃绿洲', en: 'Vitreoasis', img: 'world_vitreoasis.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '只出现在洞穴的月亮洞穴地形',
    yield: ['一池子里有 3 块月玻璃，每块挖出月亮碎片 ×2', '月亮碎片 ×1（50% 概率额外一块）'],
    mine: '镐子 / 华丽镐 / 镐斧',
    regen: '每次满月，每块被挖过的月玻璃有 10% 概率重新长出来',
    note: '洞穴里最稳定的月亮碎片来源，比爬月岛安全得多。挖完就等满月，别一次性搬空。',
    rel: [{ c: 'island', i: 'lunar_grotto' }, { c: 'mineral', i: 'moon_glass' }]
  },
  {
    id: 'salt_formation', cn: '盐岩层', en: 'Salt Formation', img: 'world_salt_formation.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '海洋里的「盐水浅滩」固定组合区，常成组出现',
    yield: ['盐晶（小 / 中阶段的盐岩被开采后掉落）'],
    mine: '镐子；也可以直接用船撞——盐岩会伤船，强度够的话也能把它撞碎',
    regen: '有 4 个生长阶段，采完的小 / 中阶段会重新长大；只剩树桩的阶段无法开采、也无法破坏',
    note: '盐晶是做盐箱（保存食物的关键设备）的必需材料。撞的时候注意船的血量，别为了省几镐把船撞沉。',
    rel: [{ c: 'biome', i: 'ocean' }]
  },
  {
    id: 'inviting_formation', cn: '邀请之岩', en: 'Inviting Formation', img: 'world_inviting.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '只出现在月矿场（月岛的一部分）',
    yield: ['天体祭坛碎片（搭建天体祭坛用）'],
    mine: '镐子 / 华丽镐 / 镐斧',
    regen: '不会再生；一座月矿场里的数量是固定的',
    note: '天体祭坛是通往天体英雄（Boss）的必经环节，所以这几个碎片别拿去乱做别的。',
    rel: [{ c: 'island', i: 'lunar_mine' }]
  },

  /* ---------------- 矿物 · 开采产物 ---------------- */
  {
    id: 'rocks', cn: '石头', en: 'Rocks', img: 'world_rocks.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '开采岩石 / 石笋获得，地面上偶尔能直接捡到',
    yield: ['制作火堆、火坑、石墙、科学机器等大量基础建筑', '精炼成切割石（Cut Stone）'],
    mine: '也可通过锤子 / 解构法杖拆除火坑、破屋等结构回收',
    regen: '石头本身不会再生，但岩石矿脉会通过陨石雨、蚁狮落石、影缝地震补充',
    note: '全游戏消耗量最大的材料之一。前期别把石头全铺成地板，留够做火坑和科学机器的量。'
  },
  {
    id: 'flint', cn: '燧石', en: 'Flint', img: 'world_flint.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '地上直接捡，或开采普通 / 含金岩石获得',
    yield: ['斧头、镐子、长矛等最基础的工具与武器'],
    mine: '—（可直接拾取）',
    regen: '不长，但地图上遍地都是；鼹鼠也会把它翻出来',
    note: '开局第一件事就是捡燧石做斧头和镐子。身上常备几块，工具坏了立刻能补。'
  },
  {
    id: 'gold_nugget', cn: '金块', en: 'Gold Nugget', img: 'world_gold_nugget.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '开采含金岩石或洞穴石笋；坟墓、岩石地形地面也能捡到；洞穴地震时从顶上掉下来',
    yield: ['金工具、金护甲相关配方、科学机器升级', '也可用于和猪王 / 蚁狮做交易'],
    mine: '—（开采矿脉获得，或直接拾取）',
    regen: '靠新矿脉补充；也可以用硝石在技能解锁后转换（威尔逊的「转换矿石 II」）',
    note: '猪王收肉类、玩具换金块，是前期最稳的金块来源。缺金块时先想猪王，再想下矿。'
  },
  {
    id: 'nitre', cn: '硝石', en: 'Nitre', img: 'world_nitre.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '开采「光滑岩石」必定至少掉 1 个；洞穴地震时偶尔从顶上掉落；也可以挖鼹鼠窝得到',
    yield: ['盐舔砖（吸引皮弗娄牛）', '火药', '吸热火 / 吸热火坑', '启明星（晨星锤）'],
    mine: '—（开采矿脉获得）',
    regen: '靠岩石矿脉再生；也可以挖新的鼹鼠窝',
    note: '最实用的用途其实是当吸热火坑的燃料——夏天在营地放一个吸热火坑，比冰块省事得多。'
  },
  {
    id: 'marble', cn: '大理石', en: 'Marble', img: 'world_marble.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '开采大理石柱、大理石树、大理石雕像 / 雕塑、竖琴雕像、麦斯威尔雕像获得；也能从「触摸石」上取',
    yield: ['大理石护甲（早期最强护甲之一）', '大理石豆（种出大理石灌木，实现大理石再生）'],
    mine: '镐子 / 华丽镐 / 镐斧',
    regen: '把大理石精炼成大理石豆 → 种成大理石灌木 → 开采，即可循环再生；洞穴地震时也会掉',
    note: '前期最大的价值是那套大理石护甲，能明显降低打 Boss 的死亡率。长期则靠大理石灌木循环。',
    rel: [{ c: 'mineral', i: 'marble_pillar' }, { c: 'plant', i: 'marble_shrub' }]
  },
  {
    id: 'moon_rock', cn: '月岩', en: 'Moon Rock', img: 'world_moon_rock.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '开采落地陨石留下的月岩矿，或开采「可疑的月岩雕像」',
    yield: ['月岩墙', '月岩棋盘地面、月岩测绘仪', '月岩雕像、月岩祭坛相关配方'],
    mine: '—（开采矿脉获得）',
    regen: '陨石会持续落下，属于可持续获取的资源',
    note: '月岩雕像可以用来把玩家传送到月岛方向，是懒得划船时的取巧办法。',
    rel: [{ c: 'mineral', i: 'meteor_boulder' }]
  },
  {
    id: 'moon_shard', cn: '月亮碎片', en: 'Moon Shard', img: 'world_moon_shard.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '开采月玻璃（月岛）与玻璃绿洲（月亮洞穴）、月矿场地面直接捡、玻璃温泉；月光龙虾与天体系 Boss 也会掉',
    yield: ['月玻璃斧 / 月玻璃刀等月玻璃装备', '月石与月系配方（月石法杖、月亮祭坛相关）'],
    mine: '—（开采矿脉获得，或击杀掉落）',
    regen: '玻璃绿洲与月玻璃在满月有概率重生，属于可再生资源',
    note: '灌注月亮碎片放久了自己会变成普通月亮碎片，别囤太久。',
    rel: [{ c: 'mineral', i: 'moon_glass' }, { c: 'mineral', i: 'vitreoasis' }]
  },
  {
    id: 'thulecite', cn: '铥矿', en: 'Thulecite', img: 'world_thulecite.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '用镐子 / 火药破坏远古雕像获得；也可用懒人拾荒者从洞穴裂缝里掏；华丽宝箱（10%）与大华丽宝箱（75%）里也可能开出',
    yield: ['铥矿墙、铥矿盔甲、铥矿法杖等远古装备', '修复破损的远古伪科学机器（解锁更多远古配方）'],
    mine: '6 个铥矿碎片 + 站在远古伪科学机器旁边即可合成',
    regen: '击杀远古织影者后会触发事件，重新刷出远古雕像，形成铥矿与宝石的再生循环（每次要等 20 天）；给尘蛾喂琥珀糖也能让附近的整理洞长出可开采的铥矿碎片',
    note: '远古装备是全游戏最强的一档，但都要在远古伪科学机器旁才能制作。第一次下遗迹时，优先修好那台机器。',
    rel: [{ c: 'biome', i: 'military' }, { c: 'mineral', i: 'thulecite_frag' }]
  },
  {
    id: 'thulecite_frag', cn: '铥矿碎片', en: 'Thulecite Fragments', img: 'world_thulecite_frag.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '遗迹地面与洞穴裂缝（用懒人拾荒者掏）、尘蛾加工出的整理洞、巨石枝树掉落；也可把铥矿墙砸碎换回来',
    yield: ['6 个碎片合成 1 块铥矿', '修复破损的远古伪科学机器、修复受损的铥矿墙'],
    mine: '—（拾取或掉落）',
    regen: '尘蛾 + 琥珀糖的路线完全可再生；巨石枝树的掉落也属于再生来源',
    note: '注意：蜗龟和蜗牛会吃地上的铥矿碎片，蜗龟甚至会主动攻击拿着碎片的人——挖完立刻收进包里。把铥矿做成墙再砸碎，可以 1:1 换回碎片，只是费锤子耐久。',
    rel: [{ c: 'mineral', i: 'thulecite' }]
  },
  {
    id: 'gems', cn: '宝石（六色）', en: 'Gems', img: 'world_gems.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '红 / 蓝 / 绿 / 黄 / 橙 / 紫六种：石笋（小概率）、龙蝇掉落、克劳斯、远古守护者、帝王蟹等 Boss 都会给',
    yield: ['各类法杖与护符', '齿轮类与远古装备配方', '镶嵌在帝王蟹身上（可回收）'],
    mine: '—（开挖矿脉或击杀 Boss 获得）',
    regen: '远古织影者事件会重刷远古雕像，雕像里含有宝石，属于再生来源',
    note: '宝石是「一次性消耗品」的心理错觉来源——法杖和护符都要吃宝石，做之前先想清楚优先级。',
    rel: [{ c: 'mineral', i: 'stalagmite' }]
  },

  /* ============================================================
     四、岛屿
     ============================================================ */
  {
    id: 'lunar_island', cn: '月岛', en: 'Lunar Island', img: 'world_lunar_island.png',
    cat: 'island', sub: 'i_lunar',
    access: '远洋孤岛：只能乘船 / 木筏，或伍迪的「鹅形态」飞过去；极少数情况下传送法杖的随机传送也会把人丢上去',
    terrain: ['岩石海滩（无眼怪、破碎蜘蛛洞、芦苇）', '月群岛（多座小岛，海骨与漂浮木）', '月森林（月树为主）', '月浴场（沙拉曼达与石果灌木）', '月矿场（岩石、月玻璃、天体裂隙、邀请之岩）'],
    special: ['月玻璃 → 月亮碎片', '石果灌木（石果 ×3）', '月树（月树花，会招来月蛾）', '海带与漂浮木', '玻璃斧、月石相关配方材料', '沙拉曼达（可驯服）'],
    note: '一踏上月岛，理智条就会被替换成「启迪」——在岛上不再掉理智，而是累积启发值。岛上也常驻「格斯特」（月魂），冬天还会有敌对的永冻企鹅。开图技巧：大陆海岸线上如果几块地形围成一个「C」形大湾，月岛通常就在那个湾外面。',
    rel: [{ c: 'island', i: 'lunar_mine' }, { c: 'biome', i: 'rocky_beach' }, { c: 'mineral', i: 'moon_glass' }]
  },
  {
    id: 'lunar_mine', cn: '月矿场', en: 'Lunar Mine', img: 'world_lunar_mine.png',
    cat: 'island', sub: 'i_lunar',
    access: '月岛的一部分，靠船登岛后步行进入',
    terrain: ['月坑地面与岩石地面', '大片岩石（含含金与陨石变体）', '月玻璃与天体裂隙（Celestial Fissure）', '邀请之岩'],
    special: ['月亮碎片（月玻璃）', '石头 / 金块 / 月岩（陨石矿）', '天体祭坛碎片（邀请之岩）'],
    note: '月岛上资源最集中、也最危险的一块：天体裂隙会持续刷出月魂。天体祭坛碎片只在这里出，缺一片就没法搭祭坛打天体英雄。',
    rel: [{ c: 'island', i: 'lunar_island' }, { c: 'mineral', i: 'inviting_formation' }]
  },
  {
    id: 'lunar_grotto', cn: '月亮洞穴', en: 'Lunar Grotto', img: 'world_lunar_grotto.png',
    cat: 'island', sub: 'i_lunar',
    access: '在洞穴层，一定紧邻一片蓝蘑菇树林生成，并且总与「远古档案馆」相连',
    terrain: ['变异菌丝地面', '玻璃绿洲与小型玻璃绿洲', '光花与月蘑菇树', '远古档案馆入口'],
    special: ['月亮碎片（玻璃绿洲的月玻璃）', '月蘑菇（月蘑菇树）', '档案馆里的遗忘知识相关物品'],
    note: '洞穴里的「月岛」：同样会把理智替换成启发值。不用出海就能拿到月亮碎片，是懒人路线；但洞穴地形封闭，被月魂围住时不好跑。',
    rel: [{ c: 'island', i: 'lunar_island' }, { c: 'mineral', i: 'vitreoasis' }]
  },
  {
    id: 'moon_quay', cn: '月港（猴岛）', en: 'Moon Quay', img: 'world_moon_quay.png',
    cat: 'island', sub: 'i_far',
    access: '远洋孤岛，只能乘船抵达；靠近时海面上会出现涂着黄漆的特殊海蚀柱，海蚀柱越密说明岛越近',
    terrain: ['月港沙滩地面（主岛）', '人工码头（延伸出的码头平台）', '猴子小屋与炮台', '异常传送门'],
    special: ['棕榈松树（木头、棕榈松果鳞、棕榈松果芽）', '香蕉丛（香蕉）', '猴尾草（Monkeytails）', '火药猴与猴子女王', '海盗旗、破损机械（锤出齿轮）'],
    note: '岛上的火药猴会抢东西、还会开炮，是联机版著名的「翻车现场」。异常传送门会不定时吐出岛上的特产。女王处可以做「诅咒」相关的转换（把人变成猴子形态）。',
    rel: [{ c: 'plant', i: 'palmcone_tree' }]
  },
  {
    id: 'hermit_island', cn: '隐士岛', en: 'Hermit Island', img: 'world_hermit_island.png',
    cat: 'island', sub: 'i_far',
    access: '远洋孤岛，只能乘船、伍迪的鹅形态，或沃拓克斯灵魂跳跃抵达',
    terrain: ['月坑地面与贝壳沙滩地面', '月树、月树苗、月玻璃、漂浮木、搁浅的海带', '被堵住的裂隙（代替天体裂隙）'],
    special: ['隐士小屋（螃蟹隐士 NPC）', '隐士蜂箱', '6 个隐士晾肉架', '贝壳铃（地上可捡）', '贝壳簇 ×9（可打捞的水下物资）'],
    note: '岛上不会触发「启迪」，所以是最安全的一座远洋岛——可以做临时的海洋前哨站。螃蟹隐士是重要的 NPC 支线，帮她收集贝壳能换到珍珠项链等奖励。',
    rel: [{ c: 'island', i: 'lunar_island' }]
  },
  {
    id: 'brine_shoal', cn: '盐水浅滩', en: 'Brine Shoal', img: 'world_salt_pond.png',
    cat: 'island', sub: 'i_far',
    access: '不算真正的陆地，是海洋里成组生成的浅滩区域，乘船到访',
    terrain: ['浅水海域', '成组的盐岩层（4 个生长阶段）'],
    special: ['盐晶（盐箱的必需材料）'],
    note: '严格说是「海域」而不是岛屿，但它是出海必访的资源点之一。船撞盐岩会掉血，可以先用镐子敲小 / 中阶段的盐岩，把树桩留着让它慢慢长大。',
    rel: [{ c: 'mineral', i: 'salt_formation' }]
  },

  /* ---------------- 植物（补充） ---------------- */
  {
    id: 'petrified_tree', cn: '石化树', en: 'Petrified Tree', img: 'world_petrified_tree.png',
    cat: 'plant', sub: 'p_tree',
    where: '地表：有些世界开局就长着（顶替掉一部分岩石或常青树），其余由普通常青树随时间「石化」而来——联机版第一次石化发生在第 44-65 天，之后每 21-32 天再来一次',
    stages: '不分生长阶段，按树的体积分 4 档掉落；它只能用镐子「开采」，不能像普通树那样砍',
    produce: ['石头 ×1-2（期望值 1.0-2.35，越大的树给得越多）', '燧石（期望 0.25-0.75）', '硝石（期望 0.25-0.65）'],
    note: '这是石头 / 燧石 / 硝石的可再生来源之一，也是中期石料的重要补给点。因为它是「树变的石头」，所以别指望能砍出木头——带镐子来。'
  },
  {
    id: 'lune_tree', cn: '月树', en: 'Lune Tree', img: 'world_lune_tree.png',
    cat: 'plant', sub: 'p_tree',
    where: '月岛的月森林与月浴场；隐士岛上也有零星几棵',
    stages: '矮 → 中 → 高三个阶段',
    produce: ['矮树：木头 ×2（50% 额外 1 朵月树花）', '中树：木头 ×3 + 月树花 ×1（25% 额外 1 朵）+ 飞出 1 只月蛾', '高树：木头 ×4 + 月树花 ×2 + 1 只月蛾（50% 再飞 1 只）', '树桩用铲子挖：木头 ×1-2'],
    note: '砍中 / 高树会飞出一只月蛾（掉月蛾翅膀，保质期内可以下锅）。月树花是月岛系列配方的材料。'
  },
  {
    id: 'banana_bush', cn: '香蕉丛', en: 'Banana Bush', img: 'world_banana_bush.png',
    cat: 'plant', sub: 'p_shrub',
    where: '月港（猴岛）原生；「异常传送门」也会把它以物品形式吐出来',
    stages: '3 个生长阶段（每天推进 1 阶段，不受昼夜影响），之后结果，可采',
    produce: ['香蕉 ×1'],
    note: '铲子可以挖走移栽，但移栽后要先施肥才会结果；施肥一次能采 5-7 次。它不会在冬天停止生长，是月港最稳定的食物来源。'
  },
  {
    id: 'monkeytails', cn: '猴尾草', en: 'Monkeytails', img: 'world_monkeytails.png',
    cat: 'plant', sub: 'p_shrub',
    where: '月港（猴岛）原生；也有小概率从「异常传送门」掉出',
    stages: '可采 → 被割 → 3 天后重新长出',
    produce: ['芦苇 ×1'],
    note: '和普通芦苇最大的区别：猴尾草可以用铲子挖走移栽（移栽后要施肥，能采 5-7 次），芦苇则完全不能移栽。它也可以当燃料烧。'
  },
  {
    id: 'cave_banana_tree', cn: '洞穴香蕉树', en: 'Cave Banana Tree', img: 'world_cave_banana_tree.png',
    cat: 'plant', sub: 'p_tree',
    where: '洞穴与远古遗迹，村庄地形最常见，沉没森林偶尔也有',
    stages: '结果 / 被摘（4 天后重新结果）',
    produce: ['洞穴香蕉 ×1', '用斧头砍倒：树枝 ×2 + 木头 ×1', '树桩用铲子挖：木头 ×1', '烧过后再砍：木炭 ×1'],
    note: '砍掉就不会再长回来（不可再生），所以别拿它当柴火。弹跳猴看到香蕉会立刻抢走，想收就得赶在它们前面。'
  },
  {
    id: 'boulderbough', cn: '巨石枝树', en: 'Boulderbough', img: 'world_boulderbough.png',
    cat: 'plant', sub: 'p_tree',
    where: '洞穴的喷气孔地形',
    stages: '两种外形；树顶顶着一块巨石，砍树干 / 烧树干时巨石会砸下来',
    produce: ['巨石落下：对附近的人与怪造成伤害并击退', '掉落表很杂（据官方词条）：石头、燧石、硝石、金块、化石碎片、铥矿碎片、月岩、月亮碎片、发光浆果、蛛丝、地衣、灯泡等'],
    note: '砍之前先跑开躲落石——如果身上带着「硬质护甲」（铥矿王冠、恐惧石头盔、W.A.R.B.I.S. 头盔等），巨石会被弹开，给你更多躲避时间。它是洞穴里少数能刷到铥矿碎片的植物。'
  },
  {
    id: 'mushrooms', cn: '地面蘑菇（红 / 绿 / 蓝）', en: 'Mushrooms', img: 'world_mushrooms.png',
    cat: 'plant', sub: 'p_herb',
    where: '地表与洞穴的地面随机生成，三种颜色各自成片出现',
    stages: '可采 → 被摘 → 一段时间后重新长出（下雨会加快）',
    produce: ['红蘑菇 / 绿蘑菇 / 蓝蘑菇 ×1', '烤过之后三维效果会完全反转（红蘑菇生吃扣血、烤了回血；蓝蘑菇生吃回理智）'],
    note: '三种蘑菇下锅都算 0.5 蔬菜度。采集当口粮之前先想清楚要生吃还是烤——红蘑菇生吃是扣血的，绿蘑菇烤了才回理智。喂猪人吃蘑菇还能换便便。'
  },
  {
    id: 'glommer_flower', cn: '格罗姆之花', en: "Glommer's Flower", img: 'world_glommer_flower.png',
    cat: 'plant', sub: 'p_herb',
    where: '满月的夜里，在落叶林的「格罗姆雕像」上开花并发出光',
    stages: '平时是雕像上的花苞，满月夜开花；摘走后雕像下一个满月还会再开',
    produce: ['格罗姆之花 ×1', '摘下后附近的格罗姆会一直跟着你（类似切斯特）'],
    note: '它是「老钟」的材料，而且可再生（即使雕像被毁也能重新长出）。花会被怪物当成食物，疯猪尤其爱吃——不带着就放回箱子里，别丢地上。'
  },

  /* ---------------- 矿物（补充） ---------------- */
  {
    id: 'anenemy', cn: '无眼怪（海葵陷阱）', en: 'Anenemy', img: 'world_anenemy.png',
    cat: 'mineral', sub: 'm_vein', kind: 'vein',
    where: '月岛的岩石海滩与月群岛，埋在地面里',
    yield: ['被踩上去触发：对踩到它的人或怪造成 60 点伤害', '闭合状态下用铲子挖走 → 「无眼怪陷阱」（可以再种到别处）'],
    mine: '触发后自己闭合约 1 分钟；只有在闭合状态下才能用铲子挖起',
    regen: '耐久无限，但和尖牙陷阱不同——玩家不能手动重置它；挖走后可以重新种下',
    note: '埋在地上时几乎和普通地面看不出区别，在月岛岩石海滩走夜路要格外小心。挖走当陷阱用倒是很划算：60 点伤害、还不用维护。'
  },
  {
    id: 'driftwood', cn: '漂浮木', en: 'Driftwood', img: 'world_driftwood.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '月岛的岩石海滩；海里也有漂着的',
    yield: ['漂浮木块', '树枝', '高株砍倒后留树桩，用铲子再挖 1 块漂浮木块'],
    mine: '用斧头砍（和其他树一样）',
    regen: '不会再生（官方标注为非可再生资源）',
    note: '漂在海面上的可以用船撞开。月岛附近缺木头时，它是很好用的替代来源。'
  },
  {
    id: 'sea_bones', cn: '海骨', en: 'Sea Bones', img: 'world_sea_bones.png',
    cat: 'mineral', sub: 'm_item', kind: 'item',
    where: '只出现在月岛的岩石海滩',
    yield: ['碎骨 ×2', '碎骨 ×1（50% 概率额外一块）'],
    mine: '用锤子砸',
    regen: '不会再生（官方标注为非可再生资源）',
    note: '碎骨是骨头装甲、骨头头盔等配方的材料。路过顺手砸一砸就能攒一批。'
  },

  /* ============================================================
     五、群系（照官方「生物群系」词条；英文名取英文维基 Biomes/DST）
     ============================================================ */
  {
    id: 'spawn_biome', cn: '出生地群系', en: "Spawn Biome", img: 'world_spawn_biome.png',
    cat: 'biome', sub: 'b_biome_fixed',
    where: '地图正中偏上，绚丽之门（出生点）所在的那块森林地面',
    res: ['绚丽之门（出生点）', '兔子洞', '基础资源：草丛 / 树苗 / 浆果丛', '乌鸦与红鸟'],
    note: '所有人开局都在这里，所以它永远是森林地面、资源最温和的一块。往哪个方向走出去决定了你前 10 天的节奏。'
  },
  {
    id: 'mosaic_biome', cn: '混合地群系', en: "Mosaic", img: 'world_mosaic_biome.png',
    cat: 'biome', sub: 'b_biome_fixed',
    where: '每张地图固定一块，面积很大，通常横跨地图中部',
    res: ['森林 / 沼泽 / 岩石 / 萨瓦纳地面混杂，夹杂圆形的无地面区域', '若干圆形小湖泊', '兔王 / 猪王', '混合的植物与矿物'],
    note: '地形最杂、资源最全的一块，找矿物、找兔子洞、找特殊生物都可以从这里下手。'
  },
  {
    id: 'big_savanna_biome', cn: '大草原群系', en: "Savanna", img: 'world_big_savanna_biome.png',
    cat: 'biome', sub: 'b_biome_fixed',
    where: '金黄色草地面，地图上最大的一块草原',
    res: ['皮弗娄牛群', '兔子洞与兔子', '草丛 / 树枝', '猎犬袭击常走的开阔地'],
    note: '联机版把草原做成了「大草原 + 两块小草地」的结构。牛群基本都在这块，想刷牛毛、抓牛骑乘就来这儿。'
  },
  {
    id: 'big_marsh_biome', cn: '大沼泽群系', en: "Marsh", img: 'world_big_marsh_biome.png',
    cat: 'biome', sub: 'b_biome_fixed',
    where: '暗绿偏褐的沼泽地面，通常和草原、森林相接',
    res: ['触手（主动攻击）', '鱼人', '芦苇', '尖刺灌木', '青蛙', '蜘蛛巢'],
    note: '公认最危险的一块：触手不打招呼就抽人，鱼人成群。好处是蜘蛛、触手、鱼人天天互殴，地上经常能白捡一堆战利品。'
  },
  {
    id: 'queen_bee_plain_biome', cn: '蜂王平原群系', en: "Queen Bee Plain", img: 'world_queen_bee_plain_biome.png',
    cat: 'biome', sub: 'b_biome_fixed',
    where: '草原地面，中央立着一座巨大的蜂窝',
    res: ['巨型蜂窝（蜂王巢）', '杀人蜂', '蜂蜜与蜂窝', '蜜蜂'],
    note: '整块地就是为了蜂王（蜂后）准备的：巨型蜂窝打碎会放出蜂王。想挑战请先备好蜂蜜药膏、蜂帽和护甲。'
  },
  {
    id: 'pig_king_forest_biome', cn: '猪王树林群系', en: "Deciduous Forest", img: 'world_pig_king_forest_biome.png',
    cat: 'biome', sub: 'b_biome_fixed',
    where: '桦树（落叶树）为主的地面，猪王就在这块里',
    res: ['猪王（用金块 / 小玩意换金块与物品）', '格罗姆雕像（满月出格罗姆之花）', '桦栗果与桦树', '浣熊猫 / 猪人'],
    note: '找猪王换金块、换蓝图都靠它；格罗姆雕像也在这里，是老钟（快速旅行塔）的必经环节。'
  },
  {
    id: 'mactusk_forest_biome', cn: '海象森林群系', en: "MacTusk Forest", img: 'world_mactusk_forest_biome.png',
    cat: 'biome', sub: 'b_biome_fixed',
    where: '森林地面，但地上会有雪地，海象营地就搭在这里',
    res: ['海象营地（海象爸爸 + 小海象）', '海象牙 / 苏格兰帽', '雪地地面', '冰猎犬'],
    note: '冬天海象才会出来活动，海象牙和苏格兰帽是这里唯一稳定产出。开打前记得把追兵引开，海象爸爸会一直吹号角。'
  },
  {
    id: 'badland_biome', cn: '恶地群系', en: "Badland", img: 'world_badland_biome.png',
    cat: 'biome', sub: 'b_biome_fixed',
    where: '灰黑色岩石地面，几乎没有植被',
    res: ['大量岩石与燧石', '蜘蛛巢（较多）', '猎犬丘', '几乎没有食物来源'],
    note: '矿物多但极度贫瘠，白天也很容易被蜘蛛缠上。挖矿时注意别把蜘蛛巢一起带进战斗。'
  },
  {
    id: 'mandrake_forest_biome', cn: '曼德拉草森林群系', en: "Mandrake Forest", img: 'world_mandrake_forest_biome.png',
    cat: 'biome', sub: 'b_biome_fixed',
    where: '普通森林地面，但固定长着几株曼德拉草',
    res: ['曼德拉草（固定生成）', '蘑菇', '树木与草丛'],
    note: '全图曼德拉草基本都在这块，做「曼德拉草汤」和复活用的「肉块雕像」都要靠它。别随手拔——白天拔它会一直跟着你。'
  },
  {
    id: 'oasis_desert_biome', cn: '绿洲沙漠群系', en: "Oasis Desert", img: 'world_oasis_desert_biome.png',
    cat: 'biome', sub: 'b_biome_fixed',
    where: '沙漠地面，中间有一片湖水与棕榈类的绿洲',
    res: ['绿洲湖泊（钓鱼 / 夏季降温）', '仙人掌', '蚁狮（沙漠里）', '沙尘暴（夏季）'],
    note: '联机版的沙漠有两块：只有这块有绿洲。夏天沙尘暴里要靠「沙漠护目镜」才能看清路，绿洲是唯一能避沙尘暴的地方。'
  },
  {
    id: 'pig_village_forest_biome', cn: '猪村森林群系', en: "Pig Village Forest", img: 'world_pig_village_forest_biome.png',
    cat: 'biome', sub: 'b_biome_rand',
    where: '森林地面，成组的猪人屋聚成村落',
    res: ['猪人屋与猪人', '猪王（部分地图）', '猪皮 / 猪皮帽材料'],
    note: '有猪人当保镖，前期晚上很安全。喂猪人吃肉可以收买，月圆时猪人会变疯猪。'
  },
  {
    id: 'spider_rockyland_biome', cn: '蜘蛛矿区群系', en: "Spider Rockyland", img: 'world_spider_rockyland_biome.png',
    cat: 'biome', sub: 'b_biome_rand',
    where: '岩石地面 + 大量蜘蛛巢',
    res: ['蜘蛛巢（密集）', '石头 / 燧石 / 金块', '蜘蛛丝 / 怪物肉'],
    note: '刷蜘蛛丝的最好去处，但一级巢多，容易翻车。白天蜘蛛在巢外游荡，最好挑落单的下手。'
  },
  {
    id: 'killer_bee_plains_biome', cn: '杀人蜂平原群系', en: "Killer Bees Plains", img: 'world_killer_bee_plains_biome.png',
    cat: 'biome', sub: 'b_biome_rand',
    where: '草原地面，散落着杀人蜂蜂窝',
    res: ['杀人蜂蜂窝', '蜂蜜 / 蜂窝', '蜜蜂'],
    note: '杀人蜂会主动追人，但蜂窝是前期蜂蜜的稳定来源。用火把烧巢或者引到别的怪身上都行。'
  },
  {
    id: 'second_meteor_biome', cn: '繁花陨石区群系', en: "Second Meteor Fields", img: 'world_second_meteor_biome.png',
    cat: 'biome', sub: 'b_biome_rand',
    where: '森林与草地混杂，天上会掉陨石',
    res: ['陨石（砸出月岩 / 石头）', '大量花朵', '蜜蜂与蝴蝶'],
    note: '联机版会不定时往这里砸陨石，地上因此长出成片繁花。是刷蜂蜜、捉蝴蝶的好地方，但要小心被砸。'
  },
  {
    id: 'mactusk_plains_biome', cn: '海象平原群系', en: "MacTusk Plains", img: 'world_mactusk_plains_biome.png',
    cat: 'biome', sub: 'b_biome_rand',
    where: '草原地面版的「海象区」，同样有海象营地',
    res: ['海象营地', '草原资源（草丛 / 牛）'],
    note: '比海象森林更开阔，方便绕圈风筝海象。'
  },
  {
    id: 'frog_grassland_biome', cn: '森林池塘区群系', en: "Frog Grassland", img: 'world_frog_grassland_biome.png',
    cat: 'biome', sub: 'b_biome_rand',
    where: '绿色草地 + 若干池塘',
    res: ['池塘（青蛙 / 钓淡水鱼）', '青蛙腿', '草丛', '夏季会变成蚊子'],
    note: '青蛙雨和池塘都集中在这里。想吃青蛙腿三明治就靠它；下雨时池塘会狂出青蛙，小心被围。'
  },
  {
    id: 'bee_grassland_biome', cn: '蜜蜂池塘区群系', en: "Bee Grassland", img: 'world_bee_grassland_biome.png',
    cat: 'biome', sub: 'b_biome_rand',
    where: '绿色草地，蜜蜂与池塘都比较多',
    res: ['蜜蜂 / 蜂巢', '池塘', '花朵'],
    note: '和池塘区是「一对」：一个偏青蛙、一个偏蜜蜂。想安稳养蜂选这块。'
  },
  {
    id: 'second_deciduous_biome', cn: '鼹鼠桦树林群系', en: "Second Deciduous Forest", img: 'world_second_deciduous_biome.png',
    cat: 'biome', sub: 'b_biome_rand',
    where: '第二块桦树林，地上多鼹鼠丘',
    res: ['鼹鼠与鼹鼠丘（挖出石头 / 燧石 / 金块 / 小玩意）', '桦栗果'],
    note: '鼹鼠多的好处是满地矿物；坏处是踩到鼹鼠丘就会塌。想抓鼹鼠放进箱子当「活体矿工」就来这块。'
  },
  {
    id: 'pure_rockyland_biome', cn: '大矿区群系', en: "Pure Rockyland", img: 'world_pure_rockyland_biome.png',
    cat: 'biome', sub: 'b_biome_rand',
    where: '整块都是岩石地面，矿物极密集',
    res: ['岩石 / 燧石 / 金块 / 硝石', '大理石柱', '石笋'],
    note: '专门用来挖矿的一块地。带上镐子和防具，一次能拉一整车石头回去。'
  },
  {
    id: 'moose_goose_plains_biome', cn: '麋鹿鹅繁殖地群系', en: "Moose/Goose Breeding Plains", img: 'world_moose_goose_plains_biome.png',
    cat: 'biome', sub: 'b_biome_rand',
    where: '草原地面，散落着麋鹿鹅的巢',
    res: ['麋鹿鹅巢（春天孵出小鹅）', '麋鹿鹅粪便 / 羽毛', '草地资源'],
    note: '春天麋鹿鹅会在这里筑巢、下蛋，被激怒就召雷。打之前先把巢周围清空，不然会跟着小鹅一起追你。'
  },
  {
    id: 'lunar_archipelago_biome', cn: '月岛碎片群系', en: "Lunar Archipelago", img: 'world_lunar_archipelago_biome.png',
    cat: 'biome', sub: 'b_lunar_biome',
    where: '月岛外围散落的小块月岩平台（MoonIsland_IslandShards）',
    res: ['月岩 / 月亮碎片', '无眼怪陷阱', '少量月树'],
    note: '从海上靠近月岛时会先经过这些碎块，是登岛前的落脚点。这里也会刷无眼怪，走夜路注意脚下。'
  },
  {
    id: 'lunar_beach_biome', cn: '月岛海滩群系', en: "Rocky Beach", img: 'world_lunar_beach_biome.png',
    cat: 'biome', sub: 'b_lunar_biome',
    where: '月岛最外圈，铺满月岛海滩地面',
    res: ['漂浮木 / 海骨', '无眼怪陷阱', '海草'],
    note: '上岸第一块地，资源以漂浮木和海骨为主，也是最容易踩到无眼怪的地方。'
  },
  {
    id: 'lunar_forest_biome', cn: '月岛森林群系', en: "Lunar Forest", img: 'world_lunar_forest_biome.png',
    cat: 'biome', sub: 'b_lunar_biome',
    where: '月岛中部的月树（Lune Tree）林',
    res: ['月树（砍出月亮碎片）', '月光玻璃', '月亮孢子'],
    note: '月岛的「树场」，月树砍倒会给月亮碎片，是做天体相关装备的主要来源。'
  },
  {
    id: 'lunar_baths_biome', cn: '月岛浴场群系', en: "Lunar Baths", img: 'world_lunar_baths_biome.png',
    cat: 'biome', sub: 'b_lunar_biome',
    where: '月岛上的水池区（MoonIsland_Baths）',
    res: ['水池 / 温泉', '月石相关', '月亮孢子'],
    note: '地形偏盆地，中间有水。这里也是月岛少数能看清怪的位置。'
  },
  {
    id: 'lunar_mine_biome', cn: '月岛矿区群系', en: "Lunar Mine", img: 'world_lunar_mine_biome.png',
    cat: 'biome', sub: 'b_lunar_biome',
    where: '月岛的矿场地面，天体裂隙附近',
    res: ['月岩 / 月亮碎片 / 月光玻璃', '天体裂隙', '无眼怪'],
    note: '整块月岛采矿的核心区，天体裂隙也在这儿——它是解锁月亮主线的一环。'
  },
  {
    id: 'cave_entrance_biome', cn: '洞穴入口群系', en: "Slimy Biome", img: 'world_cave_entrance_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '每层洞穴的地面出口（落水洞）附近，地上覆着黏滑地面',
    res: ['洞穴落水洞（回到地表）', '地面的光源', '石笋', '蝙蝠'],
    note: '从地表下来的第一站，四面通常比较开阔、怪不多。先在这里把火把点亮、认清回地表的路。'
  },
  {
    id: 'fumarole_biome', cn: '喷气孔群系', en: "Fumarole Biome", img: 'world_fumarole_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '成片喷气孔汇聚的洞穴区域',
    res: ['喷气孔（持续发热）', '巨石枝树（Boulderbough）', '枯萎蕨类'],
    note: '洞穴里最容易「热到中暑」的地方，靠近喷气孔会持续升温，暗影裂隙开启后伤害更高。带保温石和降温物品再进去。'
  },
  {
    id: 'toadstool_biome', cn: '蟾蜍洞穴群系', en: "Toadstool Area", img: 'world_toadstool_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '洞穴中固定的一块蘑菇地，毒菌蟾蜍就在这里',
    res: ['毒菌蟾蜍（Boss 巢）', '蘑菇', '蘑菇灯材料'],
    note: '三块「蟾蜍洞穴」其实是同一个巢的三种状态，只有一块会刷毒菌蟾蜍。打之前先备好蘑菇帽（防孢子）。'
  },
  {
    id: 'toadstool_biome2', cn: '蟾蜍洞穴二群系', en: "Toadstool Area", img: 'world_toadstool_biome2.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '蟾蜍洞穴的第二块（地表蘑菇丛，没有 Boss）',
    res: ['蘑菇', '孢子'],
    note: '和第一块地形一样，只是没有毒菌蟾蜍。拿它当参照就能判断自己有没有走错洞。'
  },
  {
    id: 'toadstool_biome3', cn: '蟾蜍洞穴三群系', en: "Toadstool Area", img: 'world_toadstool_biome3.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '蟾蜍洞穴的第三块（同为蘑菇丛）',
    res: ['蘑菇', '孢子'],
    note: '同样只是蘑菇地。三块地形极像，认 boss 有没有出现最靠谱。'
  },
  {
    id: 'mud_world_biome', cn: '泥泞世界群系', en: "Mud World", img: 'world_mud_world_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '洞穴最外圈、贴着泥土地面的那片开阔区',
    res: ['泥土 / 泥泞地面', '洞穴蠕虫', '石笋'],
    note: '洞穴的外环带，蠕虫袭击最容易发生在这里。听到地鸣就立刻跑开原地。'
  },
  {
    id: 'mud_cave_biome', cn: '泥泞洞穴群系', en: "Mud Cave", img: 'world_mud_cave_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '泥泞世界内侧的洞穴夹层',
    res: ['泥土', '石笋', '蝙蝠'],
    note: '比泥泞世界更窄、更绕，属于连接地带。'
  },
  {
    id: 'mud_lights_biome', cn: '泥泞光照区群系', en: "Mud Lights", img: 'world_mud_lights_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '泥泞区里长着光花的一小块',
    res: ['光花（天然光源）', '荧光果'],
    note: '洞穴里少见的「自带照明」区域，扎营时优先挑这儿，可以省下大量燃料。'
  },
  {
    id: 'mud_pit_biome', cn: '泥坑区群系', en: "Mud Pit", img: 'world_mud_pit_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '泥泞世界里下陷成坑的一块',
    res: ['泥土', '石笋', '蝙蝠'],
    note: '地形是盆地，怪物容易从高处绕过来，视野差。'
  },
  {
    id: 'blue_fungus_biome', cn: '蓝蘑菇森林群系', en: "Blue Fungus Forest", img: 'world_blue_fungus_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '蓝色蘑菇树成林的洞穴区域',
    res: ['蓝蘑菇树（蓝蘑菇 / 蘑菇孢子）', '蓝蘑菇', '萤火虫'],
    note: '刷蓝蘑菇的主要地点。蓝蘑菇生吃回血、烤了回理智，是洞穴里最实用的口粮之一。'
  },
  {
    id: 'red_fungus_biome', cn: '红蘑菇森林群系', en: "Red Fungus Forest", img: 'world_red_fungus_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '红色蘑菇树成林的洞穴区域',
    res: ['红蘑菇树', '红蘑菇', '萤火虫'],
    note: '红蘑菇生吃会扣血、烤过才是好东西。别在洞里饿了直接生啃。'
  },
  {
    id: 'green_fungus_biome', cn: '绿蘑菇森林群系', en: "Green Fungus Forest", img: 'world_green_fungus_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '绿色蘑菇树成林的洞穴区域',
    res: ['绿蘑菇树', '绿蘑菇', '萤火虫'],
    note: '绿蘑菇生吃回理智、烤了扣理智。想长期待洞穴就靠它补理智。'
  },
  {
    id: 'rocky_plains_biome', cn: '石虾地群系', en: "Rocky Plains", img: 'world_rocky_plains_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '洞穴里的岩石地面平原（RockyLand）',
    res: ['石虾（Rock Lobster）', '石头 / 燧石 / 金块', '大理石柱'],
    note: '石虾平时伪装成石头，被踩到才会变成怪。想安全采矿就先远远地把它们引出来解决掉。'
  },
  {
    id: 'spilagmite_biome', cn: '蛛网岩洞穴群系', en: "Stalagmite Terrain", img: 'world_spilagmite_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '洞穴里的蛛网岩（Spilagmite）密集区',
    res: ['蛛网岩（洞穴蜘蛛巢）', '蜘蛛丝 / 怪物肉', '洞穴蜘蛛'],
    note: '洞穴的「蜘蛛矿区」。蛛网岩不会像地表巢那样升级，但数量多、刷得快。'
  },
  {
    id: 'big_bat_cave_biome', cn: '大蝙蝠洞群系', en: "Tall Stalagmite Terrain", img: 'world_big_bat_cave_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '高大石笋成片、蝙蝠群的洞穴区域',
    res: ['大石笋', '蝙蝠（成群）', '鸟粪', '石笋'],
    note: '石笋高得挡住视线，蝙蝠会突然从上面扑下来。带好护具再进，被打断动作很容易连吃几口。'
  },
  {
    id: 'lunar_grotto_biome', cn: '月亮洞窟群系', en: "Lunar Grotto", img: 'world_lunar_grotto_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '洞穴深处的月亮洞窟（月光玻璃 / 玻璃绿洲）',
    res: ['玻璃绿洲（月光玻璃）', '月亮蘑菇树', '球状光虫（荧光果）', '月亮孢子'],
    note: '洞穴里的「月亮区」，月光玻璃和月亮蘑菇都在这一带。球状光虫在这里自然生成，杀掉掉荧光果。'
  },
  {
    id: 'ancient_archive_biome', cn: '远古档案馆群系', en: "Ancient Archive", img: 'world_ancient_archive_biome.png',
    cat: 'biome', sub: 'b_cave_biome',
    where: '洞穴深处藏着的远古档案馆迷宫',
    res: ['档案馆开关与谜题', '知识饮水机', '灰尘蛾', '铥矿'],
    note: '进门要顺着开关走流程解谜。里面藏着大量铥矿和天体主线需要的道具，第一次来建议先探路再搬东西。'
  },
  {
    id: 'lichen_land_biome', cn: '苔藓地群系', en: "Lichen Land", img: 'world_lichen_land_biome.png',
    cat: 'biome', sub: 'b_ruins_biome',
    where: '遗迹最外圈，地面长满地衣',
    res: ['地衣（Cave Lichen）', '远古资源入口', '破损发条生物'],
    note: '遗迹的入口地带，地衣是「蘑菇灯」等配方的材料。往前走就进真正的遗迹迷宫。'
  },
  {
    id: 'labyrinth_biome', cn: '迷宫群系', en: "Labyrinth", img: 'world_labyrinth_biome.png',
    cat: 'biome', sub: 'b_ruins_biome',
    where: '遗迹里迷宫状的通道，尽头是华丽箱子',
    res: ['华丽箱子（铥矿 / 宝石）', '迷宫墙', '梦魇循环'],
    note: '走迷宫记住「一直贴同一侧墙」就不会绕晕。尽头的华丽箱子是铥矿和金子的主要来源。'
  },
  {
    id: 'residential_biome', cn: '住宅区群系', en: "Village 1 (Residential)", img: 'world_residential_biome.png',
    cat: 'biome', sub: 'b_ruins_biome',
    where: '遗迹里的「住宅区」，远古居民的建筑区',
    res: ['遗物 / 远古雕像', '铥矿 / 宝石', '梦魇灯'],
    note: '远古人的居民区，可敲开遗物拿铥矿与宝石。梦魇循环开启时这里会刷影怪。'
  },
  {
    id: 'sacred_biome', cn: '圣地群系', en: "Sacred", img: 'world_sacred_biome.png',
    cat: 'biome', sub: 'b_ruins_biome',
    where: '遗迹里的圣地（Sacred）区域',
    res: ['远古雕像 / 遗物', '铥矿', '梦魇灯'],
    note: '比住宅区更「正式」的一块，雕像和遗物密度更高。'
  },
  {
    id: 'sacred_altar_biome', cn: '圣地祭坛群系', en: "Altars Room", img: 'world_sacred_altar_biome.png',
    cat: 'biome', sub: 'b_ruins_biome',
    where: '圣地里的祭坛房（SacredAltar）',
    res: ['祭坛结构', '远古资源', '影怪'],
    note: '整块地就是一个房间，通常藏着成组的远古结构，适合一次性搬空。'
  },
  {
    id: 'military_biome', cn: '军事区群系', en: "Military", img: 'world_military_biome.png',
    cat: 'biome', sub: 'b_ruins_biome',
    where: '遗迹的军事区，成排的破损发条生物',
    res: ['破损发条骑士 / 主教 / 战车', '齿轮', '铥矿'],
    note: '齿轮的来源地。发条怪会成组出现，落单打容易被围攻，最好用墙或大炮分流。'
  },
  {
    id: 'atrium_biome', cn: '中庭群系', en: "Atrium", img: 'world_atrium_biome.png',
    cat: 'biome', sub: 'b_ruins_biome',
    where: '遗迹最深处的中庭，远古编织者就在这儿',
    res: ['远古大门 / 中庭远古雕像', '暗影心房（幽灵公主）', '远古编织者（Boss）'],
    note: '最终 Boss 的场地。进来前务必先备好「暗影心房」和完整的怪异骸骨，不然门召唤不出来。'
  },
  {
    id: 'pleasant_sinkhole_biome', cn: '舒适落水洞群系', en: "Pleasant Sinkhole", img: 'world_pleasant_sinkhole_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '洞穴里的一处落水洞，周围相对温和',
    res: ['落水洞', '石笋', '少量生物'],
    note: '洞穴入口附近的空间，怪少、地势平，适合当临时营地。'
  },
  {
    id: 'swampy_sinkhole_biome', cn: '沼泽化落水洞群系', en: "Swampy Sinkhole", img: 'world_swampy_sinkhole_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '落水洞周边变成沼泽地面的一块',
    res: ['触手', '鱼人', '芦苇'],
    note: '把地表的沼泽搬进了洞穴。触手照样不打招呼就抽人，别贴着水边走。'
  },
  {
    id: 'cave_swamp_biome', cn: '洞穴沼泽群系', en: "Cave Swamp", img: 'world_cave_swamp_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '洞穴里的沼泽地面区域',
    res: ['触手', '鱼人', '芦苇 / 尖刺灌木'],
    note: '洞穴版沼泽，物资不错但危险度也照搬。'
  },
  {
    id: 'underground_forest_biome', cn: '地下森林群系', en: "Underground Forest", img: 'world_underground_forest_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '洞穴里成片的树木与草地',
    res: ['树木（砍伐）', '草丛 / 树苗', '光花'],
    note: '洞穴里少见的「能砍树」的地方，木头告急时可以来这儿补。'
  },
  {
    id: 'fungal_noise_forest_biome', cn: '混合蘑菇森林群系', en: "Multicoloured Fungal Forest", img: 'world_fungal_noise_forest_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '红 / 绿 / 蓝蘑菇树混生的森林',
    res: ['三色蘑菇树', '三色蘑菇', '萤火虫'],
    note: '一次能采到三种蘑菇，比单一色的蘑菇林更划算。'
  },
  {
    id: 'fungal_noise_meadow_biome', cn: '混合蘑菇草地群系', en: "Multicoloured Fungal Meadow", img: 'world_fungal_noise_meadow_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '蘑菇与草地混合的开阔区域',
    res: ['三色蘑菇', '光花', '兔子（洞穴）'],
    note: '蘑菇 + 草地 + 少量光照，是洞穴里难得的「宜居」地形。'
  },
  {
    id: 'bat_cloister_biome', cn: '蝙蝠居处群系', en: "BatCloister", img: 'world_bat_cloister_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '洞穴里蝙蝠集中的一处回廊',
    res: ['蝙蝠（成群）', '鸟粪', '石笋'],
    note: '蝙蝠会成批扑脸，被打断动作就掉血。绕开或者干脆用火把硬清。'
  },
  {
    id: 'rabbit_town_biome', cn: '兔人镇群系', en: "RabbitTown", img: 'world_rabbit_town_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '洞穴里兔人（Bunnyman）聚居的小镇',
    res: ['兔人屋与兔人', '胡萝卜', '兔人毛 / 兔毛球'],
    note: '带肉进去会被兔人围攻，带素（胡萝卜、浆果）反而受欢迎。想安全通过就先把手上的肉放进箱子。'
  },
  {
    id: 'rabbit_city_biome', cn: '兔人城群系', en: "RabbitCity", img: 'world_rabbit_city_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '比兔人镇更大、更密集的兔人聚落',
    res: ['大量兔人屋', '胡萝卜', '兔毛球'],
    note: '成排的兔人屋，是刷兔毛、兔人肉的好地方，但也是全洞穴最不能带肉的地方。'
  },
  {
    id: 'spider_land_biome', cn: '蜘蛛地群系', en: "SpiderLand", img: 'world_spider_land_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '洞穴里蜘蛛巢 / 蛛网岩密集的一块',
    res: ['蜘蛛巢 / 蛛网岩', '蜘蛛丝 / 怪物肉', '洞穴蜘蛛'],
    note: '刷蜘蛛丝最稳的地方之一，注意别把整个巢区一起拉起来。'
  },
  {
    id: 'rabbit_spider_war_biome', cn: '蛛兔战场群系', en: "RabbitSpiderWar", img: 'world_rabbit_spider_war_biome.png',
    cat: 'biome', sub: 'b_cave_rand',
    where: '兔人和蜘蛛混居、会互相开打的区域',
    res: ['兔人 + 蜘蛛互殴', '地上长期散落战利品', '蜘蛛丝 / 怪物肉 / 胡萝卜'],
    note: '经典「鹬蚌相争」地形：两拨怪天天互砍，你只需要在旁边捡东西。是洞穴里最省力的刷材料点。'
  },
  {
    id: 'extra_altars_biome', cn: '额外祭坛区群系', en: "Extra Altars Room", img: 'world_extra_altars_biome.png',
    cat: 'biome', sub: 'b_ruins_rand',
    where: '遗迹里额外的祭坛房（MoreAltars）',
    res: ['祭坛结构', '远古资源', '影怪'],
    note: '和圣地祭坛房同款，属于「多刷一间就多拿一份」的类型。'
  },
  {
    id: 'cave_jungle_biome', cn: '洞穴丛林群系', en: "CaveJungle", img: 'world_cave_jungle_biome.png',
    cat: 'biome', sub: 'b_ruins_rand',
    where: '遗迹里长着洞穴香蕉树的丛林块',
    res: ['洞穴香蕉树（香蕉）', '猴子（Splumonkey）', '藤蔓'],
    note: '香蕉的稳定来源，也是猴群出没的地方。猴子会偷东西，背包别敞着。'
  },
  {
    id: 'dangerous_sacred_biome', cn: '高危圣地群系', en: "Dangerous Sacred", img: 'world_dangerous_sacred_biome.png',
    cat: 'biome', sub: 'b_ruins_rand',
    where: '圣地的一种凶险变体（SacredDanger）',
    res: ['远古雕像 / 遗物', '影怪（更密集）', '铥矿'],
    note: '和普通圣地比，怪更多、照明更差，属于「收益高但容易翻车」的一块。'
  },
  {
    id: 'muddy_sacred_biome', cn: '泥泞圣地群系', en: "Muddy Sacred", img: 'world_muddy_sacred_biome.png',
    cat: 'biome', sub: 'b_ruins_rand',
    where: '地面变成泥泞的圣地变体（MuddySacred）',
    res: ['远古雕像 / 遗物', '泥泞地面', '铥矿'],
    note: '地形湿滑、颜色偏暗，找路比普通圣地费劲。'
  },
  {
    id: 'military_pits_biome', cn: '军事小道群系', en: "MilitaryPits", img: 'world_military_pits_biome.png',
    cat: 'biome', sub: 'b_ruins_rand',
    where: '军事区的坑道部分（MilitaryPits）',
    res: ['破损发条生物', '齿轮', '铥矿'],
    note: '比主军事区更窄，发条怪容易堵在通道里。建议逐个引出来打。'
  },
  {
    id: 'residential2_biome', cn: '住宅区二群系', en: "Village 2", img: 'world_residential2_biome.png',
    cat: 'biome', sub: 'b_ruins_rand',
    where: '遗迹第二块住宅区（Residential2）',
    res: ['遗物 / 雕像', '铥矿 / 宝石'],
    note: '住宅区的补充块，通常和第一块离得不远。'
  },
  {
    id: 'residential3_biome', cn: '住宅区三群系', en: "Village 3", img: 'world_residential3_biome.png',
    cat: 'biome', sub: 'b_ruins_rand',
    where: '遗迹第三块住宅区（Residential3）',
    res: ['遗物 / 雕像', '铥矿 / 宝石'],
    note: '同上，三块住宅区加起来才是完整的远古城区。'
  },
  /* ============================================================
     六、建筑（世界结构 / 兴趣点；可制作的建筑见「制作」页）
     ============================================================ */
  {
    id: 'glommer_statue', cn: '格罗姆雕像', en: "Glommer's Statue", img: 'world_glommer_statue.png',
    cat: 'structure', sub: 's_land',
    where: '落叶林（猪王树林群系）里，地上插着一座断头雕像',
    res: ['满月夜里雕像顶端开出「格罗姆之花」', '摘下花后格罗姆会一直跟着你', '雕像被砸掉后花仍会长回来'],
    note: '做「老钟」（快速旅行塔）必须先拿到格罗姆之花。满月夜来一次就能带走，格罗姆会像切斯特一样跟着你。'
  },
  {
    id: 'touch_stone', cn: '试金石', en: "Touch Stone", img: 'world_touch_stone.png',
    cat: 'structure', sub: 's_land',
    where: '草原 / 森林地面，通常旁边还堆着一具骷髅',
    res: ['玩家死亡后可以在它旁边复活一次', '复活后石头变灰、只能再用一次（联机版每人一次）', '旁边会掉一些基础物资'],
    note: '全图只有两三座，是新手最靠谱的「保险」。激活前先把位置记在地图上。'
  },
  {
    id: 'maxwell_statue', cn: '麦斯威尔雕像', en: "Maxwell Statue", img: 'world_maxwell_statue.png',
    cat: 'structure', sub: 's_land',
    where: '棋盘地形（Chess Biome）里，偶尔也出现在别处',
    res: ['用锤子敲开得到大理石', '满月 / 新月夜会被暗影包围', '提供噩梦燃料'],
    note: '敲它会掉大理石，但满月夜敲会招来影怪。缺大理石做装备时可以敲，记得白天动手。'
  },
  {
    id: 'harp_statue', cn: '竖琴雕像', en: "Harp Statue", img: 'world_harp_statue.png',
    cat: 'structure', sub: 's_land',
    where: '远古遗迹里，成排立着',
    res: ['用锤子敲开掉铥矿', '安静时会发出琴声（附近有影怪）', '遗迹照明'],
    note: '铥矿的稳定来源之一。琴声其实是在提示附近有影怪活动。'
  },
  {
    id: 'compromising_statue', cn: '折中雕像', en: "Compromising Statue", img: 'world_compromising_statue.png',
    cat: 'structure', sub: 's_land',
    where: '远古遗迹的入口附近，形态是一只手捏着小人',
    res: ['进远古前需要与它互动（交出关键道具 / 开启遗迹流程）', '和远古大门流程相关'],
    note: '主线流程的一环：它和「远古钥匙」系列道具一起，决定你能不能推进到远古编织者。'
  },
  {
    id: 'marble_statues', cn: '大理石雕像', en: "Marble Statues", img: 'world_marble_statues.png',
    cat: 'structure', sub: 's_land',
    where: '地图各处散落（人物、动物等各种造型）',
    res: ['用锤子敲开得到大理石与大理石雕塑', '部分造型是「棋子雕像」', '拼图类可复原成完整雕像'],
    note: '整体是「雕像拼图」玩法：把散落的部件搬到基座上复原，复原后能挖出铥矿等稀有物。'
  },
  {
    id: 'chess_statues', cn: '棋子雕像', en: "Marble Sculptures", img: 'world_chess_statues.png',
    cat: 'structure', sub: 's_land',
    where: '棋盘地形及其周边',
    res: ['敲开得到大理石', '造型为国际象棋的棋子'],
    note: '感觉像装饰，其实是大理石的富矿。要大理石做大理石甲、大理石套装就靠它。'
  },
  {
    id: 'grave', cn: '墓碑', en: "Grave", img: 'world_grave.png',
    cat: 'structure', sub: 's_land',
    where: '墓地地形，成片排列',
    res: ['用铲子挖出小玩意（可换金块的玩具）', '低概率挖出齿轮 / 宝石', '摧毁后变成坟坑'],
    note: '小玩意是稳赚的：拿去给猪王换金块。挖之前先看有没有影怪在附近。'
  },
  {
    id: 'skeleton', cn: '骷髅', en: "Skeleton", img: 'world_skeleton.png',
    cat: 'structure', sub: 's_land',
    where: '地图各处随机出现，旁边通常散着物品',
    res: ['旁边的物品提示了「上一个玩家的死法」', '旁边常有大肉 / 金块 / 燧石', '摧毁后掉骨头碎片'],
    note: '看到它先别急着捡：旁边如果散着大量食物，说明附近可能有危险（比如沼泽、蜘蛛）。'
  },
  {
    id: 'bones', cn: '骨堆', en: "Bones", img: 'world_bones.png',
    cat: 'structure', sub: 's_land',
    where: '与骷髅类似，多处随机生成',
    res: ['砸碎后掉骨头碎片', '偶尔伴随宝箱或道具'],
    note: '骨头碎片是骨头套装、骨盔的材料，路过顺手砸掉就能攒。'
  },
  {
    id: 'florid_postern', cn: '绚丽之门', en: "Florid Postern", img: 'world_florid_postern.png',
    cat: 'structure', sub: 's_land',
    where: '出生地，一座发光的木门',
    res: ['玩家的出生点与重生点', '可以在这里复活队友', '通往洞穴 / 新世界的大门会从这里生成'],
    note: '地图的中心参照物。迷路时只要找到它，就能确定方向。'
  },
  {
    id: 'moon_stone', cn: '月石', en: "Moon Stone", img: 'world_moon_stone.png',
    cat: 'structure', sub: 's_land',
    where: '森林地面，一座缺了一块的圆形祭坛',
    res: ['放上「月亮碎片」后可以召唤出「月光」（月亮碎片会拼成月亮）', '满月时互动开启天体主线', '旁边常有月岩'],
    note: '天体（月亮）主线的起点：把碎月石拼完整，就能开启后续「天体祭坛」的流程。'
  },
  {
    id: 'star_sky', cn: '星空', en: 'Star-Sky', img: 'world_star_sky.png',
    cat: 'structure', sub: 's_cave',
    where: '洞穴里，每张地图只有一个；常见于「荒野」区的泥土地面上、紧挨岩石地面，旁边往往有蓝池塘、蛞蝓龟与光花',
    res: ['捡起后召唤「哈奇」（Hutch）跟随你', '哈奇像切斯特一样是「活的背包」，能帮你搬东西', '韦伯拿着它时蜘蛛不会攻击哈奇；沃特拿着它每分钟 +3.3 理智'],
    note: '名字容易被误解：它不是天上的星星，而是一个鱼缸（游戏内代码 hutch_fishbowl）。找到它 = 找到本图那只哈奇。'
  },
  {
    id: 'celestial_altar', cn: '天体祭坛', en: "Celestial Altar", img: 'world_celestial_altar.png',
    cat: 'structure', sub: 's_land',
    where: '月亮洞窟 / 月岛附近',
    res: ['需要「天体贡品」才能启动', '开启天体主线的后续步骤'],
    note: '天体主线的一环，和「天体圣殿」「天体裂隙」连着走。带上天体贡品再来。'
  },
  {
    id: 'celestial_sanctum', cn: '天体圣殿', en: "Celestial Sanctum", img: 'world_celestial_sanctum.png',
    cat: 'structure', sub: 's_land',
    where: '月岛 / 天体区域',
    res: ['天体主线的关键结构', '用于完成「未完成的实验」'],
    note: '天体流程里的「工作台」，把收集到的材料一步步装进去推进剧情。'
  },
  {
    id: 'celestial_fissure', cn: '天体裂隙', en: "Celestial Fissure", img: 'world_celestial_fissure.png',
    cat: 'structure', sub: 's_land',
    where: '月亮洞窟深处，一道发光的裂隙',
    res: ['产出月亮碎片 / 月光玻璃', '月光相关资源'],
    note: '洞穴里月亮资源的产出点之一。采完记得看有没有刷怪。'
  },
  {
    id: 'incomplete_experiment', cn: '未完成的实验', en: "Incomplete Experiment", img: 'world_incomplete_experiment.png',
    cat: 'structure', sub: 's_land',
    where: '月亮洞窟 / 天体区域',
    res: ['天体主线道具，需要按流程逐步完成', '完成后得到「即将完成的实验」'],
    note: '天体主线的「拼装」环节，做完整套实验才会有后续 Boss 流程。'
  },
  {
    id: 'moose_goose_egg', cn: '麋鹿鹅蛋', en: "Moose/Goose Egg", img: 'world_moose_goose_egg.png',
    cat: 'structure', sub: 's_land',
    where: '麋鹿鹅繁殖地群系的巢里，春天出现',
    res: ['砸开后变成「小麋鹿鹅」', '小鹅会跟着大鹅一起攻击你'],
    note: '想要麋鹿鹅羽毛就等春天来——蛋砸开会多一只小鹅，等于多一份羽毛。'
  },
  {
    id: 'ancient_gateway', cn: '远古大门', en: "Ancient Gateway", img: 'world_ancient_gateway.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古遗迹的中庭',
    res: ['插入「暗影心房」+ 完整「怪异骸骨」后召唤远古编织者', '中庭的最终 Boss 入口'],
    note: '最终 Boss 的门。缺一样材料都开不了，来之前把两样都带齐。'
  },
  {
    id: 'ancient_chest', cn: '远古宝箱', en: "Ancient Chest", img: 'world_ancient_chest.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古遗迹内部',
    res: ['开出铥矿 / 宝石 / 远古道具'],
    note: '遗迹里最值得搜的箱子，通常藏在迷宫或房间尽头。'
  },
  {
    id: 'ancient_mural', cn: '远古壁画', en: "Ancient Mural", img: 'world_ancient_mural.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古遗迹墙面',
    res: ['纯装饰（讲远古与暗影剧情）'],
    note: '对剧情党有用：壁画内容对应远古文明与暗影的往事。'
  },
  {
    id: 'ancient_obelisk', cn: '远古方尖碑', en: "Ancient Obelisk", img: 'world_ancient_obelisk.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古遗迹里成对立着',
    res: ['梦魇循环时升起 / 落下，挡路', '可以敲碎'],
    note: '梦魇循环开启时它会升起并挡住通道，是遗迹里最常见的「路障」。'
  },
  {
    id: 'ancient_guard_post', cn: '远古哨所', en: "Ancient Guard Post", img: 'world_ancient_guard_post.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古遗迹的入口哨位',
    res: ['远古守卫相关', '进入遗迹的必经之路'],
    note: '遗迹的「门岗」，从这里开始正式进入远古区。'
  },
  {
    id: 'ancient_lunarune_stone', cn: '远古月亮符文石', en: "Ancient Lunarune Stone", img: 'world_ancient_lunarune_stone.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古档案馆（Ancient Archive）',
    res: ['刻满远古文字的符文石（游戏内代码 archive_rune_statue）', '与档案馆的解谜 / 知识系统相关'],
    note: '名字里有「月亮符文」，实际是档案馆里的符文石碑，共三档造型。'
  },
  {
    id: 'ancient_moon_statue', cn: '远古月亮雕像', en: "Ancient Moon Statue", img: 'world_ancient_moon_statue.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古档案馆（Ancient Archive）',
    res: ['可用镐挖开，掉远古资源', '共四种造型'],
    note: '档案馆里的月亮雕像，属于可开采的远古物件。'
  },
  {
    id: 'ancient_beacon', cn: '远古灯柱', en: "Ancient Beacon", img: 'world_ancient_beacon.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古遗迹的中庭（Atrium）',
    res: ['中庭的灯柱', '需要供能才会亮起'],
    note: '游戏内代码 atrium_light，是中庭里少数自带照明的位置，也是很好的路标。'
  },
  {
    id: 'ancient_kiln', cn: '远古窑', en: "Ancient Kiln", img: 'world_ancient_kiln.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古档案馆（Ancient Archive）里',
    res: ['可以当「锅」用，能直接烹饪食物', '可用锤子敲开（会烧起来）'],
    note: '游戏内代码 archive_cookpot——本质就是远古版的烹饪锅，在档案馆里做饭不用自己背锅。'
  },
  {
    id: 'ancient_anchor', cn: '远古锚', en: 'Ancient Anchor', img: 'world_ancient_anchor.png',
    cat: 'structure', sub: 's_event',
    where: '「熔炉」（The Forge）活动地图上',
    res: ['一把巨大的锚形锁孔（需要钥匙）', '纯布景，不影响战斗'],
    note: '熔炉活动的场景道具（游戏内代码 lavaarena_keyhole）；活动结束就不会再出现。'
  },
  {
    id: 'ancient_orchestrina', cn: '远古小合奏机', en: "Ancient Orchestrina", img: 'world_ancient_orchestrina.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古档案馆内部',
    res: ['远古档案馆的谜题 / 音乐机关'],
    note: '档案馆解谜用的小机关，名字直译就是「小合奏机」。'
  },
  {
    id: 'ancient_statue', cn: '远古雕像', en: "Ancient Statue", img: 'world_ancient_statue.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古遗迹各处，有「有宝石 / 无宝石」和「法师 / 头」等造型',
    res: ['用镐挖出铥矿碎片 / 宝石（有宝石的掉宝石）', '梦魇循环时会睁眼'],
    note: '铥矿与宝石的主力来源。有宝石的雕像记得优先挖，能白赚一颗宝石。'
  },
  {
    id: 'ancient_pseudoscience', cn: '远古伪科学站', en: "Ancient Pseudoscience Station", img: 'world_ancient_pseudoscience.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古遗迹内部，发着紫光的古代机器',
    res: ['相当于远古的「制作站」，解锁铥矿装备', '可以修好（用铥矿碎片）'],
    note: '做铥矿套装、远古装备都得靠它。被打破后可以用材料修复，别一次性敲没了。'
  },
  {
    id: 'broken_pseudoscience', cn: '损坏的远古伪科学站', en: "Broken Ancient Pseudoscience Station", img: 'world_broken_pseudoscience.png',
    cat: 'structure', sub: 's_ruins',
    where: '遗迹里被打坏的远古伪科学站',
    res: ['用「铥矿碎片」修好后可正常使用', '废墟里常见'],
    note: '遇到损坏的先记位置，等凑够铥矿碎片再回来修，比重新找一座划算。'
  },
  {
    id: 'ornate_pedestal', cn: '华丽基座', en: "Ornate Pedestal", img: 'world_ornate_pedestal.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古遗迹的房间中央',
    res: ['放置关键道具的基座', '远古 / 天体流程相关'],
    note: '用来「交东西」的台座，和远古、天体两条主线都有关。'
  },
  {
    id: 'relic', cn: '遗物', en: "Relic", img: 'world_relic.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古遗迹的住宅区 / 圣地',
    res: ['敲开得到铥矿 / 宝石 / 大理石', '部分遗物可复原'],
    note: '遗迹里满地都是的可敲物件，是铥矿的重要补充来源。'
  },
  {
    id: 'nightmare_throne', cn: '梦魇王座', en: "Nightmare Throne", img: 'world_nightmare_throne.png',
    cat: 'structure', sub: 's_ruins',
    where: '遗迹深处的王座房',
    res: ['剧情相关结构', '被暗影缠绕'],
    note: '剧情核心地标，与麦斯威尔、暗影王座的往事直接相关。'
  },
  {
    id: 'nightmare_lock', cn: '梦魇锁', en: "Nightmare Lock", img: 'world_nightmare_lock.png',
    cat: 'structure', sub: 's_ruins',
    where: '遗迹 / 暗影区域',
    res: ['锁住特定通道', '需要满足条件才能打开'],
    note: '遗迹里的「上锁的门」，通常要用特定道具或条件才能通过。'
  },
  {
    id: 'nightmare_fissure', cn: '梦魇裂隙', en: "Nightmare Fissure", img: 'world_nightmare_fissure.png',
    cat: 'structure', sub: 's_ruins',
    where: '遗迹里布满暗影的裂缝',
    res: ['梦魇循环开启时变亮并刷影怪', '光暗转换'],
    note: '它是遗迹「梦魇循环」的指示灯：亮起=影怪要来，赶紧找地方躲。'
  },
  {
    id: 'archive_switch', cn: '档案馆开关', en: "Archive Switch", img: 'world_archive_switch.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古档案馆的谜题区',
    res: ['档案馆解谜开关', '开启通往深处的门'],
    note: '档案馆的机关开关，顺序搞错就得重来一遍。'
  },
  {
    id: 'fountain_of_knowledge', cn: '知识饮水机', en: "Fountain of Knowledge", img: 'world_fountain_of_knowledge.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古档案馆（Ancient Archive）与圣所（Sanctum）',
    res: ['饮用后得到「知识精华」（Distilled Knowledge）', '和「洞察」（技能点）系统相关'],
    note: '看到就喝一口：知识精华是解锁技能点的重要来源；共有五种颜色。'
  },
  {
    id: 'tidy_hidey_hole', cn: '整洁洞穴', en: "Tidy Hidey-Hole", img: 'world_tidy_hidey_hole.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古档案馆 / 洞穴深处的小洞',
    res: ['可存放物品', '灰尘蛾的住处'],
    note: '自带一个「储物小洞」的功能，里面常伴着一只灰尘蛾。'
  },
  {
    id: 'sealed_portal', cn: '封印的传送门', en: "Sealed Portal", img: 'world_sealed_portal.png',
    cat: 'structure', sub: 's_ruins',
    where: '远古档案馆内',
    res: ['完成档案馆谜题后开启', '可用于快速移动 / 传送'],
    note: '把档案馆的谜题解完它才会打开，是很好的「回家通道」。'
  },
  {
    id: 'ruins_pillars', cn: '遗迹柱子', en: "Pillars", img: 'world_ruins_pillars.png',
    cat: 'structure', sub: 's_ruins',
    where: '遗迹与洞穴各处，有普通 / 石矿 / 海藻 / 中庭 / 档案馆 / 猴子柱等变体',
    res: ['装饰与照明', '部分柱子可敲碎'],
    note: '造型不同、功能类似：远古建筑群的「柱子」。中庭与档案馆的柱子还能当标志物认路。'
  },
  {
    id: 'broken_clockworks', cn: '损坏的发条装置', en: "Broken Clockworks", img: 'world_broken_clockworks.png',
    cat: 'structure', sub: 's_ruins',
    where: '遗迹军事区，一堆散架的发条残骸',
    res: ['敲开得到齿轮 / 铥矿', '旁边常有活着的发条怪'],
    note: '看着是废铁，其实能敲出齿轮。敲之前先清掉旁边的发条怪。'
  },
  {
    id: 'spider_den', cn: '蜘蛛巢', en: "Spider Den", img: 'world_spider_den.png',
    cat: 'structure', sub: 's_field',
    where: '森林 / 沼泽 / 荒漠等各处，分一 ~ 三级',
    res: ['蜘蛛丝 / 怪物肉 / 蜘蛛腺体', '蜘蛛帽（打掉三级巢时女王掉）', '一级巢会长成二、三级'],
    note: '刷蜘蛛丝的老地方。想升级到三级巢就别急着拆，让它自己长；想拆就用火把或锤子。'
  },
  {
    id: 'shattered_spider_hole', cn: '破碎蜘蛛洞', en: "Shattered Spider Hole", img: 'world_shattered_spider_hole.png',
    cat: 'structure', sub: 's_field',
    where: '月岛及月亮污染区域',
    res: ['破碎蜘蛛（普通伤害无效，需位面伤害）', '月亮碎片相关'],
    note: '月亮版的蜘蛛洞，里面的蜘蛛对普通武器免疫，必须带位面伤害的装备（亮茄系）才能打。'
  },
  {
    id: 'rock_den', cn: '岩石巢穴', en: "Rock Den", img: 'world_rock_den.png',
    cat: 'structure', sub: 's_field',
    where: '洞穴里的岩石堆内部',
    res: ['蜗牛龟（Snurtle）', '蜗牛壳 / 甲壳头盔 / 蜗牛壳铠甲'],
    note: '岩石巢穴里住着蜗牛龟，它们会主动缩壳防御。想拿甲壳头盔就得多敲几个。'
  },
  {
    id: 'slurtle_mound', cn: '蛞蝓龟窝', en: "Slurtle Mound", img: 'world_slurtle_mound.png',
    cat: 'structure', sub: 's_field',
    where: '洞穴里的一堆黏液状土丘',
    res: ['蛞蝓龟', '蛞蝓龟黏液', '蜗牛壳'],
    note: '黏液可以当燃料 / 做「黏液炸弹」类道具。打之前先想好：蛞蝓龟缩壳后要打很久。'
  },
  {
    id: 'wobster_den', cn: '龙虾丘（龙虾窝）', en: 'Wobster Mound', img: 'world_wobster_den.png',
    cat: 'structure', sub: 's_field',
    where: '海洋里；联机版对应海难的「龙虾窝」',
    res: ['龙虾（Wobster）', '龙虾大餐的材料'],
    note: '联机版里官方叫 Wobster Mound（龙虾丘），海难版才叫龙虾窝。抓龙虾要趁它出洞，缩回洞里就抓不到了。'
  },
  {
    id: 'hound_mound', cn: '猎犬丘', en: "Hound Mound", img: 'world_hound_mound.png',
    cat: 'structure', sub: 's_field',
    where: '荒漠 / 岩石地带',
    res: ['猎犬（白天在丘外游荡）', '犬牙 / 怪物肉', '猎犬袭击的「源头」之一'],
    note: '猎犬的巢。想安稳刷犬牙就白天引出来单杀；夜里它还会继续出狗。'
  },
  {
    id: 'tallbird_nest', cn: '高脚鸟巢', en: "Tallbird Nest", img: 'world_tallbird_nest.png',
    cat: 'structure', sub: 's_field',
    where: '岩石地带 / 荒漠的石头地面',
    res: ['高脚鸟（Tallbird）与蛋', '高脚鸟蛋（可孵化）'],
    note: '蛋可以偷来孵化当宠物，也可以下锅。惹了大鸟就别想安稳路过。'
  },
  {
    id: 'killer_bee_hive', cn: '杀人蜂蜂窝', en: "Killer Bee Hive", img: 'world_killer_bee_hive.png',
    cat: 'structure', sub: 's_field',
    where: '杀人蜂平原群系与部分草原',
    res: ['杀人蜂', '蜂蜜 / 蜂窝'],
    note: '和温顺的蜂巢不同，这里出来的全是杀人蜂。烧巢取蜜是常规操作。'
  },
  {
    id: 'gigantic_beehive', cn: '巨型蜂窝', en: "Gigantic Beehive", img: 'world_gigantic_beehive.png',
    cat: 'structure', sub: 's_field',
    where: '蜂王平原群系中央',
    res: ['蜂王（打碎后出现）', '蜂蜜 / 蜂窝'],
    note: '打碎它就会放出蜂王（Boss）。没准备好蜂帽、蜂蜜药膏和护甲别乱碰。'
  },
  {
    id: 'worm_hole', cn: '虫洞', en: "Worm Hole", img: 'world_worm_hole.png',
    cat: 'structure', sub: 's_field',
    where: '地表与洞穴各成对出现',
    res: ['成对传送（跳进去从另一个虫洞出来）', '跳进去会掉理智'],
    note: '最省时间的跨图工具。第一次用之前先把两个洞口的位置都标出来。'
  },
  {
    id: 'pond', cn: '池塘', en: "Pond", img: 'world_pond.png',
    cat: 'structure', sub: 's_field',
    where: '草原 / 森林 / 沼泽的低洼处',
    res: ['青蛙 / 青蛙腿', '钓淡水鱼', '冬天会冻成冰，可以凿冰'],
    note: '青蛙雨之后池塘会疯狂出青蛙。想安静钓鱼就等冬天。'
  },
  {
    id: 'ice_fishing_hole', cn: '冰钓洞', en: "Ice Fishing Hole", img: 'world_ice_fishing_hole.png',
    cat: 'structure', sub: 's_field',
    where: '冬天的池塘 / 湖面',
    res: ['钓冰鱼（冬天限定）', '相关冬季料理材料'],
    note: '冬天池塘结冰后出现的钓鱼点，是冬天少见的新鲜食物来源。'
  },
  {
    id: 'meteor', cn: '陨石', en: "Meteor", img: 'world_meteor.png',
    cat: 'structure', sub: 's_field',
    where: '繁花陨石区群系，天上会不定时掉落',
    res: ['砸出月岩 / 石头 / 燧石', '落点会烧成焦地'],
    note: '联机版会往这块地持续砸陨石。想白捡月岩就在这里蹲，但记得躲开落点。'
  },
  {
    id: 'hollow_stump', cn: '空心树桩', en: "Hollow Stump", img: 'world_hollow_stump.png',
    cat: 'structure', sub: 's_field',
    where: '森林地面的一个大树桩',
    res: ['浣熊猫（Catcoon）的巢', '浣熊猫给的礼物（小玩意 / 材料）'],
    note: '浣熊猫会往这儿叼东西。喂它食物能换礼物，是早期拿小玩意的稳定来源。'
  },
  {
    id: 'sproutrock', cn: '萌芽石', en: "Sproutrock", img: 'world_sproutrock.png',
    cat: 'structure', sub: 's_field',
    where: '随版本「来自彼岸」生成的岩石结构',
    res: ['埋在地里，会长出「阴郁之棘」', '与「来自彼岸」内容相关'],
    note: '把它挖开 / 砸开后会长出阴郁之棘，是彼岸内容的起点之一。'
  },
  {
    id: 'gloomthorn', cn: '阴郁之棘', en: "Gloomthorn", img: 'world_gloomthorn.png',
    cat: 'structure', sub: 's_field',
    where: '由萌芽石长成，或自然生成于彼岸区域',
    res: ['采集得到夜莓 /「惊喜种子」类物品', '带尖刺会伤人'],
    note: '和彼岸（暗影裂隙）内容相关的新植物结构。采的时候注意它带刺。'
  },
  {
    id: 'suspicious_dirt_pile', cn: '可疑的土堆', en: "Suspicious Dirt Pile", img: 'world_suspicious_dirt_pile.png',
    cat: 'structure', sub: 's_field',
    where: '各种地面上的小土堆',
    res: ['用铲子挖开：多半是「深色花瓣」等杂物，偶有「象鼻」', '极小概率是「猪王」相关彩蛋'],
    note: '挖之前先看它动不动——会动的其实是鼹鼠丘。想找象鼻就多挖几个。'
  },
  {
    id: 'suspicious_moonrock', cn: '可疑的月岩', en: "Suspicious Moonrock", img: 'world_suspicious_moonrock.png',
    cat: 'structure', sub: 's_field',
    where: '月亮污染区域 / 月岩堆里',
    res: ['敲开后出现「月亮石」相关内容或怪', '月亮碎片'],
    note: '看着像普通月岩，敲开可能有惊喜（也可能是怪）。'
  },
  {
    id: 'moleworm_burrow', cn: '鼹鼠穴', en: "Burrow", img: 'world_moleworm_burrow.png',
    cat: 'structure', sub: 's_field',
    where: '鼹鼠桦树林群系等地表',
    res: ['鼹鼠（踩上去会塌）', '鼹鼠丘挖出石头 / 燧石 / 金块 / 小玩意'],
    note: '踩到就冒出一只鼹鼠。抓活的放进箱子可以当「自动挖矿机」。'
  },
  {
    id: 'pig_head', cn: '猪头', en: "Pig Head", img: 'world_pig_head.png',
    cat: 'structure', sub: 's_field',
    where: '沼泽里的木桩上插着猪头',
    res: ['地标：标志附近有猪人 / 鱼人村', '可以敲碎'],
    note: '看到猪头就说明附近是人形怪聚落，带肉过去要小心。'
  },
  {
    id: 'merm_head', cn: '鱼人头', en: "Merm Head", img: 'world_merm_head.png',
    cat: 'structure', sub: 's_field',
    where: '沼泽里的木桩上插着鱼头',
    res: ['地标：标志附近是鱼人聚落', '可以敲碎'],
    note: '沼泽里的「危险提示牌」：前面多半是鱼人 + 触手的组合。'
  },
  {
    id: 'pig_torch', cn: '猪火炬', en: "Pig Torch", img: 'world_pig_torch.png',
    cat: 'structure', sub: 's_field',
    where: '猪人村与沼泽附近，一根插着肉的火把',
    res: ['持续燃烧、提供照明', '夜间吸引猪人聚集', '肉被吃掉后会熄灭'],
    note: '猪人村的「路灯」。想夜里安全路过就贴着它走，但旁边的猪人月圆会变疯猪。'
  },
  {
    id: 'walrus_camp', cn: '海象营地', en: "Walrus Camp", img: 'world_walrus_camp.png',
    cat: 'structure', sub: 's_field',
    where: '海象森林群系 / 海象平原群系',
    res: ['海象爸爸与小海象（冬天地表出现）', '海象牙 / 苏格兰帽', '冰猎犬'],
    note: '只有冬天才会「开门」，其余季节是空帐篷。海象牙是「步行手杖」的关键材料。'
  },
  {
    id: 'basalt', cn: '玄武岩', en: "Basalt", img: 'world_basalt.png',
    cat: 'structure', sub: 's_field',
    where: '地图上成片的黑色岩石（某些地图生成的「屏障」）',
    res: ['挡路（不能用镐挖开）', '会用「火把」等特定方式处理'],
    note: '经常把一块区域整个围住，属于「看得见走不进」的地形。它是非可再生资源。'
  },
  {
    id: 'basalt_pillar', cn: '玄武岩柱', en: "Basalt Pillar", img: 'world_basalt_pillar.png',
    cat: 'structure', sub: 's_field',
    where: '玄武岩区域内的柱状岩',
    res: ['同样不可开采', '地形屏障的一部分'],
    note: '和玄武岩同属一组，用来形成封闭地形。'
  },
  {
    id: 'junk_pile', cn: '垃圾堆', en: "Junk Pile", img: 'world_junk_pile.png',
    cat: 'structure', sub: 's_field',
    where: '拾荒疯猪（Scrappy Werepig）的垃圾场',
    res: ['废料 / 电子零件', '翻找得到杂物'],
    note: '拾荒疯猪的地盘，满地的垃圾可以翻。翻的时候小心别惊动主人。'
  },
  {
    id: 'junky_fence', cn: '垃圾栅栏', en: "Junky Fence", img: 'world_junky_fence.png',
    cat: 'structure', sub: 's_field',
    where: '拾荒疯猪的垃圾场外圈',
    res: ['挡路的栅栏', '部分可拆'],
    note: '垃圾场的围墙，绕着走就能找到入口。'
  },
  {
    id: 'ryftstal', cn: '裂隙晶体', en: "Ryftstal", img: 'world_ryftstal.png',
    cat: 'structure', sub: 's_field',
    where: '暗影裂隙（Shadow Rift）开启后在地表 / 洞穴生成',
    res: ['敲开得到「恶液」等暗影材料', '裂隙内容的核心产出'],
    note: '暗影裂隙开启后才会出现。想拿恶液、推进暗影线就盯着它挖。'
  },
  {
    id: 'spilagmite', cn: '蛛网岩', en: "Spilagmite", img: 'world_spilagmite.png',
    cat: 'structure', sub: 's_cave',
    where: '洞穴地面，蜘蛛巢的洞穴版本',
    res: ['洞穴蜘蛛', '蜘蛛丝 / 怪物肉', '蛛网覆盖的岩石'],
    note: '洞穴刷蜘蛛丝的主力。数量和刷新都比地表巢快，但也更容易被围。'
  },
  {
    id: 'splumonkey_pod', cn: '穴居猴桶', en: "Splumonkey Pod", img: 'world_splumonkey_pod.png',
    cat: 'structure', sub: 's_cave',
    where: '洞穴遗迹里成排的猴桶',
    res: ['穴居猴（Splumonkey）', '香蕉', '猴子会偷东西'],
    note: '猴子的家。它们会翻你的背包偷东西，路过时最好把贵重物品放进箱子。'
  },
  {
    id: 'salt_pond', cn: '盐池', en: 'Salt Pond', img: 'world_salt_pond.png',
    cat: 'structure', sub: 's_event',
    where: '「饕餮」（The Gorge）活动地图上的盐池',
    res: ['用钓竿钓「三文鱼」', '在「盐架」上晒出盐晶'],
    note: '饕餮活动的专属水池（游戏内代码 quagmire_pond_salt），和联机版海洋里的「盐层」（盐晶）不是同一件东西。'
  },
  {
    id: 'floating_platform', cn: '漂浮平台（船只）', en: 'Floating Platform', img: 'world_floating_platform.png',
    cat: 'structure', sub: 's_ocean', alias: ['船', '船只', '浮空平台'],
    where: '海上航行的载具，玩家可以站在上面移动、放建筑和种植物。有普通船（200 耐久 / 4 格）、草筏（100 / 3 格）、龙蝇船（200 / 3 格）、远古船（400 / 4 格，带 16 格箱子）、盗版单桅帆船（200 / 4）、海獭巢（100 / 3.75）、冰船（30 / 1.6）等几种。',
    res: ['可以放置建筑与植物', '远古船自带 16 格容器'],
    note: '撞到海蚀柱、盐岩层、海岸或世界边界都会掉耐久；**速度超过 1 撞上去会直接撞毁对方**。耐久归零就沉船——船上的建筑和植物全毁，玩家会淹死（然后在你最近的海岸复活）。所以边缘一定要装防撞条：海带版 20 耐久、贝壳版 40、尖牙版 40、帝王蟹版 150 最结实。船长三角帽能把碰撞伤害和耐久损耗都减半。船体被打穿会漏水，漏水每秒掉 0.5-1 点耐久，临时办法是自己站上去堵（会变湿）或者丢个重物压住；切石比石头撑得久。'
  },
  {
    id: 'sea_stack', cn: '海蚀柱', en: "Sea Stack", img: 'world_sea_stack.png',
    cat: 'structure', sub: 's_ocean',
    where: '海里凸起的岩石柱',
    res: ['岩石 / 燧石', '海鸥停靠'],
    note: '航行的天然地标，也是撞船风险源。开船时绕开它。'
  },
  {
    id: 'sunken_chest', cn: '沉底宝箱', en: "Sunken Chest", img: 'world_sunken_chest.png',
    cat: 'structure', sub: 's_ocean',
    where: '海洋深处的沉船点',
    res: ['随机宝箱物资', '稀有掉落'],
    note: '需要下潜 / 用特定方式打开，属于海上的「惊喜」。'
  },
  {
    id: 'sea_strider_nest', cn: '海黾巢穴', en: "Sea Strider Nest", img: 'world_sea_strider_nest.png',
    cat: 'structure', sub: 's_ocean',
    where: '「水淹地」（Waterlogged）一带的海洋',
    res: ['海黾（Sea Strider，200 血）', '蜘蛛丝 / 树枝'],
    note: '海黾的卵囊，可以烧掉。巢里的海黾会跳上船，航行时值得绕一绕。'
  },
  {
    id: 'marotter_den', cn: '水獭掠夺者窝点', en: "Marotter Den", img: 'world_marotter_den.png',
    cat: 'structure', sub: 's_ocean',
    where: '月岛 / 海洋区域的礁石上',
    res: ['水獭掠夺者（Marotter）', '会抢走你的物品'],
    note: '水獭会偷东西并跳回窝里。想拿回失物就得追上去打。'
  },
  {
    id: 'hermit_home', cn: '隐士之家', en: "Hermit Home", img: 'world_hermit_home.png',
    cat: 'structure', sub: 's_ocean',
    where: '隐士岛（珍珠奶奶的小岛）',
    res: ['珍珠奶奶（Crabby Hermit）', '按阶段升级的房屋', '可以用物品换礼物'],
    note: '珍珠奶奶的家会随好感度升级四个阶段，是「瓶中信」任务的中心。'
  },
  {
    id: 'leaky_shack', cn: '漏雨的小屋', en: "Leaky Shack", img: 'world_leaky_shack.png',
    cat: 'structure', sub: 's_ocean',
    where: '隐士岛附近的破旧小屋',
    res: ['漏雨的破房子', '与珍珠奶奶任务相关'],
    note: '隐士岛一带的旧建筑，属于珍珠任务线的场景。'
  },
  {
    id: 'hot_spring', cn: '温泉', en: "Hot Spring", img: 'world_hot_spring.png',
    cat: 'structure', sub: 's_ocean',
    where: '隐士岛（珍珠奶奶的小岛）一带',
    res: ['泡温泉回温 / 回血', '用「浴球」（Bath Bomb）会把它变成玻璃，之后可用镐挖走'],
    note: '海上的免费恢复点，冬天泡一泡很舒服；挖走还能搬回基地当装饰。'
  },
  {
    id: 'vitreoasis_small', cn: '小玻璃绿洲', en: "Vitreoasis", img: 'world_vitreoasis_small.png',
    cat: 'structure', sub: 's_ocean',
    where: '洞穴月亮洞窟里的玻璃质绿洲',
    res: ['月光玻璃', '月亮碎片'],
    note: '长在洞穴里的玻璃状绿洲，敲碎能拿月光玻璃。'
  },
  {
    id: 'unnatural_portal', cn: '非自然传送门', en: "Unnatural Portal", img: 'world_unnatural_portal.png',
    cat: 'structure', sub: 's_ocean',
    where: '月港（Moon Quay）一带',
    res: ['传送相关功能', '月港内容'],
    note: '月港的传送装置，和海盗猴的剧情绑在一起。'
  },
  {
    id: 'cachebox', cn: '保险箱', en: "Cachebox", img: 'world_cachebox.png',
    cat: 'structure', sub: 's_field',
    where: '由薇诺娜的「检视眼镜」（Inspectacles）生成',
    res: ['废料 ×1-2 / 电子零件 ×1-2 / 小玩意 ×1-2', '校准感知器 ×1'],
    note: '属于「来自彼岸」内容：放下检视眼镜后它会产出这种箱子。破损状态的要先修好。'
  },
  {
    id: 'conspicuous_chest', cn: '显眼箱子', en: "Conspicuous Chest", img: 'world_conspicuous_chest.png',
    cat: 'structure', sub: 's_ocean',
    where: '地表 / 海上随机生成',
    res: ['随机物资', '可用锤子敲开'],
    note: '游戏内代码 terrariumchest——它是装「饲养箱」的箱子，专门用来引诱你去开。开之前先在周围转一圈。'
  },
  {
    id: 'winter_feast_tree', cn: '冬季盛宴树', en: "Winter's Feast Tree", img: 'world_winter_feast_tree.png',
    cat: 'structure', sub: 's_event',
    where: '冬季盛宴活动期间的基地附近（自己种）',
    res: ['挂上装饰品', '活动期间的节日加成'],
    note: '活动限定：把装饰挂上去，全队都能享受节日效果。'
  },
  {
    id: 'gingerbread_pig_house', cn: '姜饼猪屋', en: "Gingerbread Pig House", img: 'world_gingerbread_pig_house.png',
    cat: 'structure', sub: 's_event',
    where: '冬季盛宴活动的「姜饼」系列点',
    res: ['姜饼猪屋（会走出姜饼猪）', '顺着饼干碎屑能找到'],
    note: '跟着「饼干碎屑」一路走，80% 概率找到姜饼猪屋、20% 是姜饼座狼。'
  },
  {
    id: 'loot_stash', cn: '赃物袋', en: "Loot Stash", img: 'world_loot_stash.png',
    cat: 'structure', sub: 's_event',
    where: '冬天随机出现（克劳斯的地盘）',
    res: ['需要「麋鹿茸」打开', '开出大量物资 / 蓝图 / 手稿'],
    note: '本体不能直接开，先去找克劳斯（Klaus）拿麋鹿茸。开出来的东西通常是全队最肥的一波。'
  },
  {
    id: 'prize_booth', cn: '奖品摊位', en: "Prize Booth", img: 'world_prize_booth.png',
    cat: 'structure', sub: 's_event',
    where: '盛夏鸦年华活动场地',
    res: ['用奖券兑换奖励', '活动奖品'],
    note: '攒够奖券在这里换东西，是活动的最终出口。'
  },
  {
    id: 'cuckoo_spinwheel', cn: '布谷鸟转盘', en: "Cuckoo Spinwheel", img: 'world_cuckoo_spinwheel.png',
    cat: 'structure', sub: 's_event',
    where: '盛夏鸦年华的小游戏摊位',
    res: ['投入奖券玩转盘', '几乎不会亏的运气游戏'],
    note: '六个嘉年华小游戏之一，最省事的一个：转就完事。'
  },
  {
    id: 'birdhouse_ball_drop', cn: '鸟房落球', en: "Birdhouse Ball Drop", img: 'world_birdhouse_ball_drop.png',
    cat: 'structure', sub: 's_event',
    where: '盛夏鸦年华的小游戏摊位',
    res: ['投入奖券看小球下落', '无需操作'],
    note: '不用动手、看球滚到底就行，适合挂机刷奖券。'
  },
  {
    id: 'eggs_in_a_basket', cn: '篮中蛋', en: "Eggs in a Basket", img: 'world_eggs_in_a_basket.png',
    cat: 'structure', sub: 's_event',
    where: '盛夏鸦年华的小游戏摊位',
    res: ['记忆类小游戏', '按顺序记住星星标记的蛋'],
    note: '考记忆力的游戏，记好亮星蛋的顺序再动手。'
  },
  {
    id: 'nest_defender', cn: '保卫鸟巢', en: "Nest Defender", img: 'world_nest_defender.png',
    cat: 'structure', sub: 's_event',
    where: '盛夏鸦年华的小游戏摊位',
    res: ['射击类小游戏', '打虫子、别打到乌鸦'],
    note: '打错目标会扣分，瞄准虫子别手滑。'
  },
  {
    id: 'egg_scramble', cn: '追蛋', en: "Egg Scramble", img: 'world_egg_scramble.png',
    cat: 'structure', sub: 's_event',
    where: '盛夏鸦年华的小游戏摊位',
    res: ['把乱跑的蛋赶进中央圈', '限时类小游戏'],
    note: '蛋会到处乱窜，先把路堵住再赶会轻松很多。'
  },
  {
    id: 'hubbub_for_grub', cn: '鸟鸟吃虫虫', en: "Hubbub for Grub", img: 'world_hubbub_for_grub.png',
    cat: 'structure', sub: 's_event',
    where: '盛夏鸦年华的小游戏摊位',
    res: ['快速喂食小游戏', '用虫子喂不断出现的雏鸟'],
    note: '手速游戏：雏鸟一只接一只，虫子得提前准备好。'
  },
  {
    id: 'forge_portal', cn: '熔炉传送门', en: "Forge Portal", img: 'world_forge_portal.png',
    cat: 'structure', sub: 's_event',
    where: '「熔炉」（The Forge）活动期间的基地',
    res: ['组队进入熔炉玩法', '活动限时'],
    note: '熔炉活动的大门，全队一起进去打怪，限时开放。'
  },
  {
    id: 'altar_of_gnaw', cn: '饕餮祭坛', en: "The Altar of Gnaw", img: 'world_altar_of_gnaw.png',
    cat: 'structure', sub: 's_event',
    where: '「饕餮」（The Gorge）活动期间',
    res: ['提交食材完成料理订单', '活动玩法核心'],
    note: '饕餮活动的核心，按订单交菜，考验分工和配合。'
  },
];
