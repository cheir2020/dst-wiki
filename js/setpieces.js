/* 地图彩蛋（布景 / Set Piece）
   世界生成时随机刷出的「成组景观」——不是自然地形，而是刻意摆好的一小片场景。
   官方维基说明：大部分布景的名字是社区起的昵称，并非官方定名；
   真正权威的是游戏内的 d_spawnlayout("<名字>") 调试 ID，本文件放在 spawn 字段里。

   字段说明：
     id / cn / en   站内标识与中英文名
     spawn          游戏内调试 ID（d_spawnlayout 的参数），无则留空
     where          出现位置（地表 / 洞穴 / 遗迹 / 海洋 + 具体群系）
     dst            'only' = 联机版独有；'both' = 单机版也有；'event' = 活动限定
     contains       场景里有什么
     loot           能捞到什么好处
     danger         危险程度：'low' | 'mid' | 'high'
     tip            实用建议
     note           补充说明
*/
const SETPIECE_DANGER = {
  low:  { cn: '安全', en: 'Safe',     color: '#7fb069' },
  mid:  { cn: '有风险', en: 'Risky',   color: '#e8a33d' },
  high: { cn: '危险', en: 'Dangerous', color: '#e06a5a' }
};

const SETPIECE_WHERE = {
  surface: { cn: '地表', en: 'Surface' },
  cave:    { cn: '洞穴', en: 'Caves' },
  ruins:   { cn: '遗迹', en: 'Ruins' },
  ocean:   { cn: '海洋', en: 'Ocean' }
};

const SETPIECE_SCOPE = {
  only:  { cn: '联机版独有', en: 'DST Only' },
  both:  { cn: '单机版也有', en: 'Both Versions' },
  event: { cn: '活动限定',   en: 'Event' }
};

const SETPIECES = [

  /* ==================== 地表 · 联机版独有 ==================== */
  { id: 'marble_sculptures', cn: '大理石雕塑群', en: 'Marble Sculptures Set Piece',
img: 'sp_marble_sculpture.png',     spawn: 'MarbleSculptures', where: 'surface', dst: 'only', danger: 'low',
    contains: ['一整套大理石雕塑 + 大理石雕像', '一具骷髅', '2 块大理石', '一把鹤嘴锄'],
    loot: ['开采雕像能得到「手稿」（解锁雕塑配方）', '大理石'],
    tip: '每个世界**必定**有一个完整版，另有最多 4 个残缺版。这是「新王朝」加入的内容——雕像是用「可疑的大理石」修复成暗影棋子（新月）或发条生物（满月）的。想刷发条生物就留着它。',
    note: '别和「棋盘布景」搞混：那个是地表棋盘的天然场景，这个是联机版专门加的雕塑组合。' },

  { id: 'moon_stone', cn: '月亮石', en: 'Moon Stone',
img: 'sp_moon_stone.png',     spawn: 'MoonStone', where: 'surface', dst: 'only', danger: 'high',
    contains: ['月亮石', '周围一圈「可疑的月亮石」与月亮碎石', '萤火虫'],
    loot: ['免费的月亮石', '满月时能把唤星法杖变成唤月法杖'],
    tip: '用月亮石修复月亮石后，**满月**时会把它转成「唤月法杖」。但转化过程会刷出**猎犬和疯猪**来打石头——没准备好别乱修。遗留下来的怪会石化成可疑的月亮石。',
    note: '这是个很好的夏季基地点位：转化后月亮石会变成常亮的「极光」，不用生火。' },

  { id: 'moon_tree_axe', cn: '月树藏斧', en: 'Moon Tree Hidden Axe',
img: 'sp_moon_glass_axe.png',     spawn: 'MoonTreeHiddenAxe', where: 'surface', dst: 'only', danger: 'low',
    contains: ['一圈月树', '正中间一把月亮玻璃斧'],
    loot: ['白送一把月亮玻璃斧'],
    tip: '斧头**几乎看不见**，要走到正中间按空格键才能捡。可能在一个世界里刷出多次。' },

  { id: 'bath_bombed_hot_spring', cn: '泡澡温泉', en: 'Bath Bombed Hot Spring',
img: 'sp_bath_bomb.png',     spawn: 'BathbombedHotspring', where: 'surface', dst: 'only', danger: 'low',
    contains: ['已经扔了泡澡球的温泉', '地上一个备用泡澡球', '一具骷髅', '两棵月树'],
    loot: ['免费的泡澡球'],
    tip: '月亮浴场里必定出现。如果是在**满月之后**找到，温泉会变成玻璃化的（就不能泡了）。' },

  { id: 'stage', cn: '舞台', en: 'Stage Set Piece',
img: 'sp_stage.png',     spawn: 'Stage', where: 'surface', dst: 'only', danger: 'mid',
    contains: ['茂盛地毯与马赛克地板', '一个舞台与讲台', '两个「带刺舞台助手」', '一个拿着娃娃服装的人体模型'],
    loot: ['茂盛地毯、马赛克地板的来源', '剧情线索（查理的剧本）'],
    tip: '投入「节目单」可以演戏。**演砸了**（配错角色、被打断、剧本不对）会刷出 3-6 只棘刺狼，舞台还会关闭 3-6 天。',
    note: '这是少数有官方中文名的布景（舞台），也是剧情党必去的地方。' },

  { id: 'jimbo', cn: 'JIMBO 扑克机', en: 'JIMBO Set Piece',
img: 'sp_jimbo.png',     spawn: 'Balatro', where: 'surface', dst: 'only', danger: 'mid',
    contains: ['JIMBO 扑克机', '4 丛浆果', '一些花', '2-4 张扑克牌'],
    loot: ['分数越高奖励越好：120 分起步给树枝/草，1400 分以上给 12 金块 + 各色宝石 + 7 张扑克牌 + 一张唱片'],
    tip: '这是和《小丑牌》联动的彩蛋机。**分数太低或者中途退出会刷怪**——提前退出是 2 只杀人蜂 + 1 猎犬 + 1 蜘蛛；拿到 0-119 分则是 4 只杀人蜂 + 2 猎犬 + 3 蜘蛛。' },

  { id: 'magma_arena', cn: '岩浆池（龙蝇巢穴）', en: 'Magma / Dragonfly Arena',
img: 'sp_magma.png',     spawn: 'Magma', where: 'surface', dst: 'only', danger: 'high',
    contains: ['会发光的岩浆池', '烧焦的尖刺树与尖刺灌木', '焦黑的骷髅（挖不出东西）'],
    loot: ['免费的岩浆热源', '龙蝇的固定刷新点'],
    tip: '站在旁边会**点燃你和你的物品**，冬天都能让你过热。想吃烤肉又不想烧起来，得穿鳞甲或者用薇洛。' },

  { id: 'oasis', cn: '绿洲', en: 'Oasis',
img: 'sp_oasis.png',     spawn: 'Oasis', where: 'surface', dst: 'only', danger: 'low',
    contains: ['一大片草地地皮与一个湖', '12 棵桦栗树', '一具拿着鱼竿的骷髅、草席和草帽'],
    loot: ['夏季限定：湖边会长出 18 株多肉植物', '夏季钓鱼能钓到「皱巴巴的包裹」（撑阳伞头盔的来源）'],
    tip: '**夏天站在湖边可以完全免疫沙尘暴**（只有轻微视线干扰，没有减速）。沙漠里最好的夏季基地点位。',
    note: '官方维基的布景列表里没收录它，是从「绿洲」和「多肉植物」页面交叉验证出来的。' },

  { id: 'halloween_pumpkin', cn: '万圣节南瓜', en: 'Halloween Pumpkin Carving',
img: 'sp_pumpkin.png',     spawn: 'HalloweenPumpkinCarving', where: 'surface', dst: 'event', danger: 'low',
    contains: ['停止生长的南瓜植株', '蜂蜡', '一桶便便', '一具骷髅', '超大南瓜雕刻工具'],
    loot: ['捡起工具后南瓜会长成巨型南瓜，并掉下一群乌鸦'],
    tip: '只有在**万圣夜活动期间创建新世界**才会生成。南瓜即使不浇水也不会腐烂，但用薇克巴顿的书也催不熟。' },

  /* ==================== 地表 · 两版都有 ==================== */
  { id: 'killer_bee_hayfield', cn: '杀人蜂草地', en: 'Killer Bee Hayfield',
img: 'sp_killer_bee_hive.png',     spawn: 'wasphive_grass_easy', where: 'surface', dst: 'both', danger: 'high',
    contains: ['一大片割下的草', '草里藏着 3 个杀人蜂巢', '联机版额外有守卫猪的变种'],
    loot: ['蜂蜜、蜂巢', '大量割下的草'],
    tip: '这就是最出名的「杀人蜂陷阱」。破解办法：在旁边种一株食人花把蜜蜂引过去，清完蜜蜂再打蜂巢和食人花。温蒂配阿比盖尔也很好使。',
    note: '如果世界设置里把「杀人蜂巢」调成「无」，它就退化成一片无害的草地。' },

  { id: 'reed_trap', cn: '芦苇陷阱', en: 'Reed Trap',
img: 'sp_reeds.png',     spawn: 'tenticle_reeds', where: 'surface', dst: 'both', danger: 'high',
    contains: ['一大片芦苇', '芦苇丛里和周围藏着大量触手'],
    loot: ['大量触手尖刺与怪物肉', '稳定的芦苇来源（做吹箭）'],
    tip: '沼泽里最凶的陷阱。联机版技巧：温蒂的三级阿比盖尔能扛住触手（触手会锁定目标），沃特能看见触手还能派鱼人守卫清场。',
    note: '游戏内的调试 ID 把 tentacle 拼成了 "tenticle"，是官方保留的拼写错误。' },

  { id: 'spoil_food_trap', cn: '腐坏食物陷阱', en: 'Spoil Food Trap',
img: 'sp_rot.png',     spawn: 'Rotted Base', where: 'surface', dst: 'both', danger: 'mid',
    contains: ['散落的腐烂物', '一具骷髅', '猪头', '一个箱子'],
    loot: ['箱子里的多张蓝图'],
    tip: '**开箱子会把你整个背包里的食物全部腐坏**。开之前先把易腐食物扔到远处。',
    note: '损失的是食物不是血量，但新手常常在这里亏掉一整箱储备。' },

  { id: 'beefalo_pen_trap', cn: '废弃牛栏陷阱', en: 'Disused Beefalo Pen Trap',
img: 'sp_wood_wall.png',     spawn: 'Beefalo Farm', where: 'surface', dst: 'both', danger: 'high',
    contains: ['一圈木墙围成的方形空地', '里面的骨头与牛毛', '入口处的箱子'],
    loot: ['理论上箱子里有 1 把火杖、4 个火药、4 根木头'],
    tip: '**开箱子（或用锤子砸）会点燃箱子 → 火药爆炸 → 整圈木墙烧起来**，箱子里的东西全毁。有 34% 概率是哑弹。正确做法是先用锤子把木墙拆掉，或者开箱后立刻拿走东西跑。' },

  { id: 'fire_staff_trap', cn: '火杖陷阱', en: 'Fire Staff Trap',
img: 'sp_fire_staff.png',     spawn: 'Fire Hounds', where: 'surface', dst: 'both', danger: 'high',
    contains: ['一把火杖', '周围一圈睡着的红猎犬'],
    loot: ['火杖', '猎犬牙'],
    tip: '拿火杖会**惊醒所有猎犬**，同时掉大量理智并开始下雨。先把猎犬一只只引开杀掉再拿。',
    note: '联机版里这是**洞穴中合法出现猎犬的唯一途径**。高手玩法：戴蜂王冠把睡着的猎犬聚在一起，能被动回约 200 理智/分。' },

  { id: 'ice_staff_trap', cn: '冰杖陷阱', en: 'Ice Staff Trap',
img: 'sp_ice_staff.png',     spawn: 'Ice Hounds', where: 'surface', dst: 'both', danger: 'high',
    contains: ['一把冰杖', '周围 5 只睡着的蓝猎犬'],
    loot: ['冰杖', '猎犬牙'],
    tip: '和火杖陷阱机制相同：拿杖会惊醒猎犬、掉理智、开始下雨。',
    note: '拿冰杖固定掉 33 点理智。同样能靠蜂王冠 + 聚集猎犬来刷理智。' },

  { id: 'icebox_trap_winter', cn: '冰箱陷阱（冬季）', en: 'Icebox Trap (Winter)',
img: 'sp_ice_box.png',     spawn: '', where: 'surface', dst: 'both', danger: 'mid',
    contains: ['一个箱子、一个温度计、一个冰箱', '箱子里是冬季装备（冰杖、冬帽、微风背心）'],
    loot: ['整套冬季装备'],
    tip: '**开箱子或砸箱子有 66% 概率让冬天立刻开始**，并伴随独眼巨鹿的吼声（但巨鹿不会真的出现）。开冰箱是安全的。',
    note: '如果你在冬天第一天开它，等于白赚一次（本来就是冬天）。但世界设置选「只有夏天」的话，触发的冬天会**永久持续**。' },

  { id: 'icebox_trap_summer', cn: '冰箱陷阱（夏季）', en: 'Summer Icebox Trap',
img: 'sp_ice_box_summer.png',     spawn: '', where: 'surface', dst: 'both', danger: 'high',
    contains: ['同样的三件套', '箱子里是夏季装备'],
    loot: ['夏季装备'],
    tip: '只在**沙漠**生成，触发时是最热的夏天，伴随龙蝇的吼声（可能真的刷出龙蝇）。比冬季版更狠的一点：**开冰箱同样会触发**，不只是开箱子。' },

  { id: 'tallfort', cn: '高脚鸟要塞', en: 'Tallfort',
img: 'sp_tallbird_nest.png',     spawn: 'tallbird_rocks', where: 'surface', dst: 'both', danger: 'high',
    contains: ['一片岩石地皮', '大量巨石', '许多高脚鸟巢与高脚鸟'],
    loot: ['成堆的石头、金块、硝石', '大量肉与高脚鸟蛋'],
    tip: '这里的高脚鸟**不会互相帮忙**，而且晚上会睡觉——趁夜里动手最省事。',
    note: '单机版可以用「远古铃铛」一脚踩平，联机版没有铃铛，只能硬打或绕开。' },

  { id: 'hound_fortress', cn: '猎犬要塞', en: 'Hound Fortress',
img: 'sp_hound_mound.png',     spawn: 'hound_rocks', where: 'surface', dst: 'both', danger: 'high',
    contains: ['岩石地皮上密集的巨石', '巨石周围一圈猎犬丘'],
    loot: ['猎犬牙、怪物肉', '大量石头'],
    tip: '布局和高脚鸟要塞一模一样，只是把鸟换成了猎犬。猎犬丘会持续刷狗，别在附近建家。' },

  { id: 'queens_gathering', cn: '蜘蛛女王集会', en: "Queens' Gathering",
img: 'sp_spider_den.png',     spawn: 'spider_forest', where: 'surface', dst: 'both', danger: 'high',
    contains: ['一圈三级蜘蛛巢，中间还有一个', '很高概率刷出蜘蛛女王'],
    loot: ['蛛丝、蜘蛛腺体', '怪物肉'],
    tip: '别硬闯。用猪人或者兔人来清，或者干脆绕路——这里很容易变成滚雪球式的团灭点。' },

  { id: 'spider_trap', cn: '沉睡蜘蛛陷阱', en: 'Spider Trap',
img: 'sp_carpeted_flooring.png',     spawn: 'Sleeping Spider', where: 'surface', dst: 'both', danger: 'high',
    contains: ['地毯地板上睡着一只蜘蛛战士', '旁边一小片草和树枝', '周围的骨头与猪头'],
    loot: ['地毯地板', '早期基地的好点位'],
    tip: '攻击它会**在你周围刷出 3 只蜘蛛战士**。破解办法：在它旁边放一个陷阱，把它叫醒但**不打它**，引它踩陷阱——陷阱击杀不算「击杀」，不会触发增援。' },

  { id: 'hollow_pig', cn: '猪人监牢', en: 'Imprisoned Pig',
img: 'sp_pig_house.png',     spawn: 'InsanePighouse', where: 'surface', dst: 'both', danger: 'low',
    contains: ['三面玄武岩、一面方尖碑', '中间一个猪屋'],
    loot: ['免费的猪屋'],
    tip: '联机版里**必须处于低理智状态才能穿过方尖碑**（戴骨盔、梦魇护符，或者吃绿蘑菇）。反过来也能把它改造成关怪的监狱。' },

  { id: 'warzone', cn: '无家可归的猪人与鱼人', en: 'Homeless Pig/Merm (Warzone)',
img: 'sp_merm.png',     spawn: 'Warzone_1', where: 'surface', dst: 'both', danger: 'mid',
    contains: ['2-4 只没有家的猪人或鱼人', '有时猪人和鱼人同时出现，你一进去它们就打起来'],
    loot: ['它们互相打完后的掉落物'],
    tip: '白捡的肉和猪皮/鱼。注意满月时游荡的猪人会变成疯猪。' },

  { id: 'miners_camp', cn: '矿工营地', en: "Miner's Camp",
img: 'sp_shadow_manipulator.png',     spawn: 'skeleton_researchlab3', where: 'surface', dst: 'both', danger: 'low',
    contains: ['一具戴矿工帽、拿华丽鹤嘴锄的骷髅', '一个暗影操纵器', '一个帐篷', '附近可能有浆果、蜂箱、石墙、木地板与烹饪锅'],
    loot: ['**免费的暗影操纵器**', '矿工帽', '华丽鹤嘴锄'],
    tip: '开局遇到就是天胡——暗影操纵器能直接解锁一整套魔法科技。' },

  { id: 'abandoned_base', cn: '废弃基地', en: 'Abandoned Base',
img: 'sp_alchemy_engine.png',     spawn: 'skeleton_researchlab2', where: 'surface', dst: 'both', danger: 'low',
    contains: ['炼金引擎、火坑、温度计、帐篷', '周围一圈木墙', '猪头、牛帽、斧头与一具骷髅'],
    loot: ['炼金引擎（省下造它的材料）', '牛帽、斧头'],
    tip: '新手开局最舒服的落脚点之一：科技直接跳一级。' },

  { id: 'crop_circles', cn: '麦田圈', en: 'Crop Circles',
img: 'sp_grass_turf.png',     spawn: 'grass_spots', where: 'surface', dst: 'both', danger: 'low',
    contains: ['草地地皮里混着萨凡纳地皮的斑点图案'],
    loot: ['什么都没有'],
    tip: '极稀有，但**真的什么都没有**——游戏代码里给它的注释是「无趣的地点」。纯属彩蛋，遇到可以截图留念。' },

  { id: 'moose_nest', cn: '麋鹿鹅巢', en: 'Moose/Goose Nest',
img: 'sp_moose_nest.png',     spawn: 'MooseNest', where: 'surface', dst: 'both', danger: 'mid',
    contains: ['浆果丛、胡萝卜、桦栗树与一个池塘', '地上用树枝摆成一圈'],
    loot: ['春季的麋鹿鹅与它的蛋'],
    tip: '春天麋鹿鹅会在树枝圈里筑巢下蛋。**别在这附近建家**，不然每年春天都要打一次。' },

  { id: 'dev_graveyard', cn: '开发者墓地', en: "Maxwell's Cemetery (Dev Graveyard)",
img: 'sp_grave.png',     spawn: 'Dev Graveyard', where: 'surface', dst: 'both', danger: 'mid',
    contains: ['成片坟墓', '大理石柱、邪恶之花、地毯地板', '两尊麦斯威尔雕像', '一把铲子'],
    loot: ['**每个坟平均 50% 出小饰品**', '蓝/红宝石各 15.35%', '齿轮、重生护符、噩梦燃料各 3.07%'],
    tip: '墓碑上刻的是 Klei 开发者的名字，所以叫「开发者墓地」。**每挖一个坟都可能刷幽灵，挖到最后一个必定刷一群**。联机版每逢满月还会额外刷一批幽灵。挖一次固定掉 10 理智。' },

  { id: 'imprisoned_pig', cn: '猪人村的陷阱组合', en: 'Pigguard Berry Fields',
img: 'sp_pig_torch.png',     spawn: 'pigguard_berries', where: 'surface', dst: 'both', danger: 'mid',
    contains: ['大片浆果丛', '8 个猪火把与 20 丛浆果（大片版）', '或 1 个猪火把 + 22 丛浆果（小片版）'],
    loot: ['浆果', '猪皮与肉'],
    tip: '守卫猪会攻击你。联机版还有「多汁浆果丛」的变种——**这是联机版独有的**，多汁浆果更耐放、更好吃。' },

  { id: 'rabbit_settlement', cn: '兔人聚落', en: 'Rabbit Hutch Set Piece',
img: 'sp_rabbit_hutch.png',     spawn: 'RabbitHermit', where: 'surface', dst: 'both', danger: 'low',
    contains: ['若干兔屋', '胡萝卜、草丛与一把干草叉'],
    loot: ['兔屋、胡萝卜', '干草叉'],
    tip: '白送一片兔屋。注意**戴着肉制品靠近会被兔人打**。' },

  { id: 'living_forest', cn: '活森林', en: 'Living Forest',
img: 'sp_treeguard.png',     spawn: 'leif_forest', where: 'surface', dst: 'both', danger: 'mid',
    contains: ['密集的常青树', '一群树精（常常 5 只以上）'],
    loot: ['活木', '大量木头（但要先解决树精）'],
    tip: '只要你不砍树、不主动打它们，树精一般不会动手。要木头就去别的地方砍。' },

  { id: 'chess_setpiece', cn: '棋盘布景', en: 'Chess Set Piece',
img: 'sp_marble_pillar.png',     spawn: 'Chess', where: 'surface', dst: 'both', danger: 'mid',
    contains: ['邪恶之花、大理石树、大理石柱', '麦斯威尔雕像与竖琴雕像', '齿轮', '发条生物'],
    loot: ['齿轮', '大理石', '偶尔一把长矛'],
    tip: '这是地表获得齿轮和大理石最稳定的地方。发条生物好打但伤害不低，前期注意走位。',
    note: '别和联机版的「大理石雕塑群」搞混——那是另一个东西。' },

  /* ==================== 洞穴 / 遗迹 ==================== */
  { id: 'depths_worm_trap', cn: '洞穴蠕虫伪装陷阱', en: 'Depths Worms Trap',
img: 'sp_glow_berry.png',     spawn: 'lures_and_worms', where: 'cave', dst: 'only', danger: 'high',
    contains: ['10 颗小型发光浆果', '其中 3 颗其实是伪装的洞穴蠕虫'],
    loot: ['发光浆果'],
    tip: '**辨别方法**：世界是干的时候，如果那颗浆果是湿的，就是蠕虫；或者拿火把悬停上去——洞穴蠕虫不可燃。',
    note: '击杀远古织影者后这些蠕虫会重新刷出来。' },

  { id: 'merm_pig_skeletons', cn: '鱼人与猪人骷髅', en: 'Merm and Pigman Skeletons',
img: 'sp_skeleton.png',     spawn: 'skeleton_notplayer', where: 'cave', dst: 'only', danger: 'low',
    contains: ['成对的猪人和鱼人骷髅', '总是一束光打在上面', '若干蜘蛛丝'],
    loot: ['蜘蛛丝'],
    tip: '剧情彩蛋，对应短片《Tales From the Constant: Falling》。没有危险，看到可以顺手拿蜘蛛丝。' },

  { id: 'tentacle_pillar_atrium', cn: '通往中庭的触手柱', en: 'Tentacle Pillar To Atrium',
img: 'sp_big_tentacle.png',     spawn: 'TentaclePillarToAtrium', where: 'cave', dst: 'only', danger: 'high',
    contains: ['正中央一根大触手', '2 个受损的发条主教守着'],
    loot: ['通往中庭（远古织影者）的必经之路'],
    tip: '把**远古钥匙**插进远古传送门，会点亮远古信标，并让遗迹地皮和远古栅栏发光（梦魇阶段除外）。**这是打远古织影者的唯一通路**，务必记好位置。' },

  { id: 'maxwell_cemetery_cave', cn: '洞穴里的开发者墓地', en: "Maxwell's Cemetery (Cave)",
img: 'sp_grave_cave.png',     spawn: 'Dev Graveyard', where: 'cave', dst: 'both', danger: 'mid',
    contains: ['坟墓群、大理石柱、邪恶之花', '麦斯威尔雕像'],
    loot: ['同上：小饰品、宝石、齿轮'],
    tip: '联机版洞穴里**没有月相**，所以在这里挖坟不会遇到满月刷幽灵——但仍然是洞穴中少数能刷出幽灵的方式。' },

  { id: 'cave_camp', cn: '洞穴营地', en: 'Cave Camp',
img: 'sp_science_machine.png',     spawn: 'CaveCamp', where: 'cave', dst: 'both', danger: 'low',
    contains: ['科学机器、箱子、冰箱、帐篷', '两个改良农场、一把干草叉、一顶草帽', '旁边一个池塘与常青树'],
    loot: ['科学机器', '箱子里的金块与蜗牛黏液（可能有宝石）'],
    tip: '洞穴开局的好点位。冰箱里的东西**通常已经腐烂**了。旁边那具骷髅大概是被池塘的青蛙咬死的。' },

  { id: 'lightened_cave_camp', cn: '明亮洞穴营地', en: 'Lightened Cave Camp',
img: 'sp_lantern.png',     spawn: 'CaveCamp2', where: 'cave', dst: 'both', danger: 'low',
    contains: ['科学机器、冰盒、箱子、灯笼、毛皮睡袋与鹤嘴锄'],
    loot: ['灯笼', '毛皮睡袋', '箱子里的蜘蛛丝、燧石、治疗药膏等'],
    tip: '和普通洞穴营地相比少了池塘与农场，但**多了一个灯笼和毛皮睡袋**，实用性更高。' },

  { id: 'ruins_camp_trap', cn: '遗迹营地陷阱', en: 'Ruins Camp Trap',
img: 'sp_ruins.png',     spawn: 'RuinsCamp', where: 'ruins', dst: 'both', danger: 'high',
    contains: ['箱子、烹饪锅、冰盒、帐篷、科学机器、魔法制作台', '一具骷髅', '地面铺满蛛网'],
    loot: ['科技站与物资（但要先清理）'],
    tip: '地上的蛛网会不断引来**悬挂的洞穴蜘蛛**，根本没法安心用。要么清干净，要么放弃。' },

  /* ==================== 海洋 ==================== */
  { id: 'boat_trap', cn: '弃船（海上陷阱）', en: 'Boat Traps',
img: 'sp_boat.png',     spawn: 'AbandonedBoat1', where: 'ocean', dst: 'only', danger: 'high',
    contains: ['一艘 61 耐久的废弃船只', '周围 4 根海蚀柱', '一具骷髅、海钓竿、钓具箱与一个箱子'],
    loot: ['**箱子里有 66% 概率出唤星法杖**', '雨衣 33%、船补丁、瓶中信、船长三角帽、海盗头巾等'],
    tip: '每个世界最多 2 处。**开箱子有 90% 概率触发三种效果之一**（各 1/3）：幽灵袭击并掉 50 理智、船直接沉没、或者触发海盗袭击。想拿东西就做好跑路的准备。',
    note: '这是最容易拿到唤星法杖的地方，值得冒险。' },

  { id: 'ocean_monument', cn: '海洋宝藏纪念碑', en: 'Ocean Treasure Monument',
img: 'sp_sunken_chest.png',     spawn: 'OceanMonument', where: 'ocean', dst: 'only', danger: 'low',
    contains: ['8 根海蚀柱围成一圈', '圈中间是沉底宝箱（要用绞盘打捞）'],
    loot: ['**5-8 个铥矿（100%）**', '懒惰的觅食者/磷光体/建造护符之一（85%）', '懒惰的探险家/唤星法杖/解构法杖之一（85%）', '铥矿皇冠/护甲/棍棒之一（85%）', '宝石若干'],
    tip: '每世界最多 2 处。宝藏池比「瓶中信」的沉底宝箱**高级得多**——这是遗迹之外最好的铥矿与遗迹装备来源。几乎没危险，看到就捞。',
    note: '如果刷出两处，其中一处的箱子只有**一个格子**（也就是只出一件东西）。' },
];
