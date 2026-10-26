/* data/ships.js — كتالوج السفن (v9.0) */
'use strict';

(function () {

  var SHIP_IMGS = {
    'ship-lvl-1':'assets/ships/level_01/ship-lvl-1.png','ship-lvl-2':'assets/ships/level_02/ship-lvl-2.png',
    'ship-lvl-3':'assets/ships/level_03/ship-lvl-3.png','ship-lvl-4':'assets/ships/level_04/ship-lvl-4.png',
    'ship-lvl-5':'assets/ships/level_05/ship-lvl-5.png','ship-lvl-6':'assets/ships/level_06/ship-lvl-6.png',
    'ship-lvl-7':'assets/ships/level_07/ship-lvl-7.png','ship-lvl-8':'assets/ships/level_08/ship-lvl-8.png',
    'ship-lvl-9':'assets/ships/level_09/ship-lvl-9.png','ship-lvl-10':'assets/ships/level_10/ship-lvl-10.png',
    'ship-lvl-11':'assets/ships/level_11/ship-lvl-11.png','ship-lvl-12':'assets/ships/level_12/ship-lvl-12.png',
    'ship-lvl-13':'assets/ships/level_13/ship-lvl-13.png','ship-lvl-14':'assets/ships/level_14/ship-lvl-14.png',
    'ship-lvl-15':'assets/ships/level_15/ship-lvl-15.png','ship-lvl-16':'assets/ships/level_16/ship-lvl-16.webp',
    'ship-lvl-17':'assets/ships/level_17/ship-lvl-17.png','ship-lvl-18':'assets/ships/level_18/ship-lvl-18.png',
    'ship-lvl-19':'assets/ships/level_19/ship-lvl-19.png','ship-lvl-20':'assets/ships/level_20/ship-lvl-20.png',
    'ship-lvl-21':'assets/ships/level_21/ship-lvl-21.png','ship-lvl-22':'assets/ships/level_22/ship-lvl-22.png',
    'ship-lvl-23':'assets/ships/level_23/ship-lvl-23.png','ship-lvl-24':'assets/ships/level_24/ship-lvl-24.png',
    'ship-lvl-25':'assets/ships/level_25/ship-lvl-25.png','ship-lvl-26':'assets/ships/level_26/ship-lvl-26.png',
    'ship-lvl-27':'assets/ships/level_27/ship-lvl-27.png','ship-lvl-28':'assets/ships/level_28/ship-lvl-28.png',
    'ship-lvl-29':'assets/ships/level_29/ship-lvl-29.png','ship-lvl-30':'assets/ships/level_30/ship-lvl-30.png',
    'phoenix':'assets/ships/ship-phoenix-C3TXdfiW.webp','submarine':'assets/ships/ship-vip-submarine.png',
    'upgrade-sub':'assets/ships/sub-star-1.png','royal-whale':'assets/ships/whale-star-1.png',
    'kraken-ship':'assets/ships/kraken/kraken-star-1.png',
    'dragon-t1':'assets/ships/ship-dragon-red-d-5lmhdh.webp','dragon-t2':'assets/ships/ship-dragon-silver-qnrqb-29.webp',
    'dragon-t3':'assets/ships/ship-dragon-gold-bnkhn9-i.webp',
    'tribe-lightning':'','tribe-tornado':'','tribe-fire':''
  };

  function imgFor(code) { return SHIP_IMGS[code] || 'assets/ships/level_01/ship-lvl-1.png'; }
  function legacyId(code) { var m = /^ship-lvl-(\d+)$/.exec(code); return m ? 'ship_' + m[1] : code; }

  var SUB_STARS = [
    { star:1, img:'assets/ships/sub-star-1.png',   storage:350000,  hp:350000,  attack:10, trip:2700 },
    { star:2, img:'assets/ships/sub-star-2.png',   storage:500000,  hp:500000,  attack:12, trip:2600 },
    { star:3, img:'assets/ships/sub-star-3.png',   storage:700000,  hp:700000,  attack:14, trip:2500 },
    { star:4, img:'assets/ships/sub-star-4.png',   storage:850000,  hp:850000,  attack:16, trip:2400 },
    { star:5, img:'assets/ships/sub-star-red.png', storage:1000000, hp:1000000, attack:20, trip:2300 }
  ];

  var WHALE_STARS = [
    { star:1, img:'assets/ships/whale-star-1.png', storage:400000,  hp:400000,  attack:145, trip:3000 },
    { star:2, img:'assets/ships/whale-star-2.png', storage:900000,  hp:900000,  attack:155, trip:2900 },
    { star:3, img:'assets/ships/whale-star-3.png', storage:1500000, hp:1500000, attack:165, trip:2800 },
    { star:4, img:'assets/ships/whale-star-4.png', storage:2200000, hp:2200000, attack:180, trip:2700 },
    { star:5, img:'assets/ships/whale-star-5.png', storage:3000000, hp:3000000, attack:200, trip:2600 }
  ];

  var KRAKEN_STARS = [
    { star:1, img:'assets/ships/kraken/kraken-star-1.png', storage:800000,  hp:800000,  attack:180, trip:2800 },
    { star:2, img:'assets/ships/kraken/kraken-star-2.png', storage:1100000, hp:1100000, attack:200, trip:2700 },
    { star:3, img:'assets/ships/kraken/kraken-star-3.png', storage:1500000, hp:1500000, attack:220, trip:2600 },
    { star:4, img:'assets/ships/kraken/kraken-star-4.png', storage:2000000, hp:2000000, attack:250, trip:2500 },
    { star:5, img:'assets/ships/kraken/kraken-star-5.png', storage:3000000, hp:3000000, attack:300, trip:2400 }
  ];

  var RAW = [
    { code:'ship-lvl-1',  name:'قارب صغير',           level:1,  rarity:'common',    hp:80,     armor:4,   speed:9,   storage:80,      attack:10,    fishPool:['sardine','anchovy'],              price:400,           repairSec:240,   tripSec:60,   emoji:'🛶', desc:'قارب خشبي بسيط — يبدأ رحلتك من ميناء صغير.' },
    { code:'ship-lvl-2',  name:'قارب كبير',           level:2,  rarity:'common',    hp:180,    armor:8,   speed:10,  storage:180,     attack:15,    fishPool:['sardine','herring','smelt'],      price:2500,          repairSec:288,   tripSec:90,   emoji:'⛵', desc:'قارب أكبر بمجاديف أطول وشراع متهالك، يتجرأ على المياه الأبعد قليلاً.' },
    { code:'ship-lvl-3',  name:'سفينة شراعية',        level:3,  rarity:'common',    hp:600,    armor:11,  speed:12,  storage:600,     attack:20,    fishPool:['minnow','mullet','anchovy'],      price:7500,          repairSec:346,   tripSec:150,  emoji:'⛵', desc:'سفينة شراعية رشيقة تتمايل مع أمواج الساحل.' },
    { code:'ship-lvl-4',  name:'سفينة مجداف',         level:4,  rarity:'common',    hp:900,    armor:15,  speed:13,  storage:900,     attack:25,    fishPool:['shrimp','crab_small','sardine'],  price:11000,         repairSec:415,   tripSec:210,  emoji:'🛶', desc:'سفينة بمجاديف قوية — أولى خطواتك الحقيقية نحو الأعماق.' },
    { code:'ship-lvl-5',  name:'يخت أبيض',            level:5,  rarity:'common',    hp:1200,   armor:18,  speed:15,  storage:1200,    attack:30,    fishPool:['mullet','shrimp','herring'],      price:20000,         repairSec:498,   tripSec:240,  emoji:'🛥️', desc:'يخت أبيض أنيق بمحرك هادئ — رمز الطبقة الوسطى.' },
    { code:'ship-lvl-6',  name:'قارب حرب',            level:6,  rarity:'common',    hp:1800,   armor:22,  speed:16,  storage:1800,    attack:35,    fishPool:['mackerel','bass','shrimp'],       price:50000,         repairSec:597,   tripSec:300,  emoji:'🚤', desc:'قارب حربي مدرّع — لمواجهة القراصنة في المياه الخطرة.' },
    { code:'ship-lvl-7',  name:'كمين',                level:7,  rarity:'common',    hp:2500,   armor:25,  speed:17,  storage:2500,    attack:40,    fishPool:['cod','snapper','mackerel'],       price:90000,         repairSec:717,   tripSec:330,  emoji:'🚤', desc:'سفينة كمين شبحية تنقضّ على فرائسها من حيث لا تراها.' },
    { code:'ship-lvl-8',  name:'حفارة',               level:8,  rarity:'common',    hp:3500,   armor:29,  speed:19,  storage:3500,    attack:45,    fishPool:['trout','salmon','bass'],          price:150000,        repairSec:860,   tripSec:390,  emoji:'🚢', desc:'حفّارة بحرية ثقيلة تجرف أمواج البحر بلا رحمة.' },
    { code:'ship-lvl-9',  name:'باخرة',               level:9,  rarity:'common',    hp:5000,   armor:32,  speed:20,  storage:5000,    attack:50,    fishPool:['squid','snapper','cod'],          price:300000,        repairSec:1032,  tripSec:480,  emoji:'🚢', desc:'باخرة ضخمة بمداخن بخار ومستودعات واسعة — تنقل صيداً وفيراً.' },
    { code:'ship-lvl-10', name:'سفينة أبحاث',         level:10, rarity:'common',    hp:7500,   armor:36,  speed:22,  storage:7500,    attack:55,    fishPool:['salmon','squid','trout'],         price:700000,        repairSec:1238,  tripSec:600,  emoji:'🚢', desc:'سفينة أبحاث علمية بأجهزة سونار متقدمة — تصطاد ما لا يراه الآخرون.' },
    { code:'ship-lvl-11', name:'سفينة الفانوس',       level:11, rarity:'common',    hp:9000,   armor:39,  speed:23,  storage:9000,    attack:60,    fishPool:['tuna','grouper','salmon'],        price:2200000,       repairSec:1486,  tripSec:660,  emoji:'🚢', desc:'سفينة بفوانيس متوهجة تجذب كائنات الأعماق إليها.' },
    { code:'ship-lvl-12', name:'سفينة الميلاد',       level:12, rarity:'common',    hp:13000,  armor:43,  speed:24,  storage:13000,   attack:65,    fishPool:['octopus','lobster','squid'],      price:5000000,       repairSec:1783,  tripSec:780,  emoji:'🚢', desc:'سفينة احتفالية مزخرفة بأضواء وأشرعة فاخرة.' },
    { code:'ship-lvl-13', name:'سفينة الصقر',         level:13, rarity:'common',    hp:16000,  armor:46,  speed:26,  storage:16000,   attack:70,    fishPool:['eel','flounder','grouper'],       price:8000000,       repairSec:2140,  tripSec:840,  emoji:'🚢', desc:'سفينة سريعة كالصقر — تنقضّ على الفرائس قبل أن تهرب.' },
    { code:'ship-lvl-14', name:'سفينة الأعماق',       level:14, rarity:'common',    hp:20000,  armor:50,  speed:27,  storage:20000,   attack:75,    fishPool:['carp','tuna','eel'],              price:12000000,      repairSec:2568,  tripSec:960,  emoji:'🚢', desc:'سفينة أعماق متخصصة بالنزول لقاع المحيط — حيث لا يصل أحد.' },
    { code:'ship-lvl-15', name:'سفينة العاصفة',       level:15, rarity:'common',    hp:25000,  armor:53,  speed:29,  storage:25000,   attack:80,    fishPool:['flounder','carp','octopus'],      price:18000000,      repairSec:3081,  tripSec:1080, emoji:'🚢', desc:'سفينة تشق العواصف بلا خوف — ملكة الأمواج الهائجة.' },
    { code:'ship-lvl-16', name:'سفينة الكابوس',       level:16, rarity:'common',    hp:30000,  armor:57,  speed:30,  storage:30000,   attack:85,    fishPool:['marlin','swordfish','lobster'],   price:25000000,      repairSec:3698,  tripSec:1140, emoji:'🚢', desc:'سفينة شبحية سوداء تثير الرعب في قلوب الأعداء.' },
    { code:'ship-lvl-17', name:'سفينة المحيط الأزرق', level:17, rarity:'common',    hp:36000,  armor:60,  speed:31,  storage:36000,   attack:90,    fishPool:['sailfish','barracuda','marlin'],  price:34000000,      repairSec:4437,  tripSec:1260, emoji:'🚢', desc:'سفينة محيطية تجوب المياه الزرقاء الواسعة.' },
    { code:'ship-lvl-18', name:'سفينة الإعصار',       level:18, rarity:'common',    hp:42000,  armor:64,  speed:33,  storage:42000,   attack:95,    fishPool:['stingray','shark','swordfish'],   price:45000000,      repairSec:5325,  tripSec:1380, emoji:'🚢', desc:'سفينة لا توقفها الأعاصير ولا الأمواج العاتية.' },
    { code:'ship-lvl-19', name:'سفينة الجبروت',       level:19, rarity:'common',    hp:50000,  armor:67,  speed:34,  storage:50000,   attack:100,   fishPool:['tang_blue','koi','sailfish'],     price:60000000,      repairSec:6390,  tripSec:1500, emoji:'🚢', desc:'سفينة جبّارة بهيكل فولاذي ضخم — قلعة عائمة.' },
    { code:'ship-lvl-20', name:'سفينة الموجة السوداء',level:20, rarity:'common',    hp:60000,  armor:71,  speed:36,  storage:60000,   attack:105,   fishPool:['shark','stingray','barracuda'],   price:80000000,      repairSec:7668,  tripSec:1620, emoji:'🚢', desc:'سفينة مظلمة كموجة الليل — تظهر وتختفي في لمح البصر.' },
    { code:'ship-lvl-21', name:'سفينة الفاتح البحري', level:21, rarity:'common',    hp:72000,  armor:74,  speed:37,  storage:72000,   attack:110,   fishPool:['manta','hammerhead','shark'],     price:110000000,     repairSec:9201,  tripSec:1800, emoji:'🚢', desc:'سفينة فاتحة للأقاليم البحرية النائية.' },
    { code:'ship-lvl-22', name:'سفينة نجم البحر',     level:22, rarity:'common',    hp:85000,  armor:78,  speed:38,  storage:85000,   attack:115,   fishPool:['whale','orca','manta'],           price:150000000,     repairSec:11041, tripSec:1980, emoji:'🚢', desc:'سفينة تتلألأ كنجم يهتدي به البحّارة في الظلام.' },
    { code:'ship-lvl-23', name:'سفينة أسطورة الأعماق',level:23, rarity:'common',    hp:100000, armor:81,  speed:40,  storage:100000,  attack:120,   fishPool:['arowana','goldfish','hammerhead'],price:200000000,     repairSec:13249, tripSec:2100, emoji:'🚢', desc:'سفينة الأسطورة التي تجوب أعمق الأعماق المظلمة.' },
    { code:'ship-lvl-24', name:'سفينة نهاية المحيط',  level:24, rarity:'common',    hp:120000, armor:85,  speed:41,  storage:120000,  attack:125,   fishPool:['pearl','koi','tang_blue'],        price:300000000,     repairSec:15899, tripSec:2340, emoji:'🚢', desc:'سفينة نهائية تصل لحدود المحيط البعيد.' },
    { code:'ship-lvl-25', name:'سفينة العرش البحري',  level:25, rarity:'common',    hp:140000, armor:88,  speed:43,  storage:140000,  attack:130,   fishPool:['orca','whale','arowana'],         price:650000000,     repairSec:19079, tripSec:2520, emoji:'🚢', desc:'عرش بحري ملكي للقباطنة الأسطوريين.' },
    { code:'ship-lvl-26', name:'سفينة أسد الأعماق',   level:26, rarity:'common',    hp:165000, armor:92,  speed:44,  storage:165000,  attack:135,   fishPool:['kraken','leviathan','goldfish'],  price:800000000,     repairSec:22895, tripSec:2700, emoji:'🚢', desc:'سفينة الأسد المرعبة بقوة لا تُقهر.' },
    { code:'ship-lvl-27', name:'سفينة التيتانيوم',    level:27, rarity:'common',    hp:190000, armor:95,  speed:45,  storage:190000,  attack:140,   fishPool:['megalodon','sea_dragon','pearl'], price:1000000000,    repairSec:27474, tripSec:2940, emoji:'🚢', desc:'سفينة تيتانيوم لا يخترقها شيء.' },
    { code:'ship-lvl-28', name:'سفينة ملك المحيط',    level:28, rarity:'common',    hp:220000, armor:99,  speed:47,  storage:220000,  attack:145,   fishPool:['poseidon','kraken','leviathan'],  price:3640000000,    repairSec:32969, tripSec:3120, emoji:'🚢', desc:'سفينة ملك المحيط بلا منازع.' },
    { code:'ship-lvl-29', name:'سفينة التنين البحري', level:29, rarity:'common',    hp:260000, armor:102, speed:48,  storage:260000,  attack:150,   fishPool:['black_pearl','megalodon','sea_dragon'], price:9100000000, repairSec:39563, tripSec:3420, emoji:'🚢', desc:'تنين بحري ينفث الرعب في الأمواج العاتية.' },
    { code:'ship-lvl-30', name:'سفينة نهاية الأعماق', level:30, rarity:'common',    hp:300000, armor:106, speed:50,  storage:300000,  attack:155,   fishPool:['golden_koi','poseidon','black_pearl'], price:16380000000, repairSec:47475, tripSec:3600, emoji:'🚢', desc:'السفينة النهائية: نهاية كل الأعماق.' },
    { code:'submarine', name:'الغواصة الملكية VIP', level:32, rarity:'legendary', hp:350000, armor:0, speed:10, storage:350000, attack:10, fishPool:['abyss_titan'], price:19500000000, repairSec:300, tripSec:2700, emoji:'🛸', upgradable:true, maxStars:5, starData:SUB_STARS, desc:'غواصة VIP ملكية تصيد تيتان الأعماق 🔱 فقط، وسعتها حسب مستوى VIP عند الاستلام.' },
    { code:'royal-whale', name:'الحوت الأرجواني', level:33, rarity:'mythic', hp:400000, armor:145, speed:88, storage:400000, attack:145, fishPool:['imperial_moonfish','diamond_manta','royal_amethyst'], price:20000000000000, repairSec:14400, tripSec:3000, emoji:'🐋', upgradable:true, maxStars:5, starData:WHALE_STARS, desc:'غواصة-حوت أرجوانية ملكية قابلة للترقية بنظام النجوم. تبدأ بسعة 400 ألف وتصل إلى 3 مليون عند النجمة الحمراء. تصيد ثلاثة أنواع فاخرة حصرية: قمرية الإمبراطور 👑، مانتا الألماس 💎، الجمشت الملكي 🔮.' },
    { code:'phoenix',   name:'سفينة العنقاء التنينية',  level:14, rarity:'legendary', hp:13000, armor:80, speed:60, storage:13000, attack:80, fishPool:['phoenix'], price:0, repairSec:36000, tripSec:1200, emoji:'🦅', desc:'سفينة العنقاء الحمراء — حصرية للمتجر. تصيد عنقاء النار 🔥 فقط.' },
    { code:'dragon-t1', name:'سفينة التنين الدموي', level:34, rarity:'legendary', hp:20000, armor:120, speed:100, storage:20000, attack:15000, fishPool:['black_dragon'], price:0, repairSec:14400, tripSec:1200, emoji:'🐉', desc:'سفينة تنين حمراء أسطورية — دم 20,000 وسعة 20,000 وصيد كل 20 دقيقة. تصيد التنين الأسود الأسطوري 🐉.' },
    { code:'dragon-t2', name:'سفينة التنين الفضي',  level:35, rarity:'legendary', hp:40000, armor:160, speed:110, storage:40000, attack:25000, fishPool:['black_dragon'], price:0, repairSec:14400, tripSec:1800, emoji:'🐲', desc:'سفينة تنين فضية أسطورية — دم 40,000 وسعة 40,000 وصيد كل 30 دقيقة. تصيد التنين الأسود الأسطوري 🐉.' },
    { code:'dragon-t3', name:'سفينة التنين الذهبي', level:36, rarity:'mythic',    hp:60000, armor:220, speed:120, storage:60000, attack:40000, fishPool:['black_dragon'], price:0, repairSec:14400, tripSec:2400, emoji:'👑', desc:'سفينة تنين ذهبية أسطورية ملكية — دم 60,000 وسعة 60,000 وصيد كل 40 دقيقة. تصيد التنين الأسود الأسطوري 🐉.' },
    { code:'upgrade-sub', name:'الغواصة القابلة للترقية', level:31, rarity:'legendary', hp:350000, armor:0, speed:10, storage:350000, attack:10, fishPool:['silver_arowana','coral_phantom'], price:19500000000, repairSec:300, tripSec:3000, emoji:'🛸', upgradable:true, maxStars:5, starData:SUB_STARS, desc:'غواصة قابلة للترقية بنظام نجوم. تبدأ بسعة 350 ألف وتصل إلى 1 مليون. تصيد الأروانا الفضية وشبح المرجان.' },
    { code:'kraken-ship', name:'🦑 سفينة الكراكن', level:32, rarity:'legendary', hp:800000, armor:140, speed:65, storage:800000, attack:180, fishPool:['kraken_spawn','ink_wraith','abyss_watcher','void_serpent'], price:200000000000, repairSec:300, tripSec:2800, emoji:'🦑', upgradable:true, maxStars:5, starData:KRAKEN_STARS, desc:'🦑 سفينة ملحمية مكسوة بالكراكن من المقدمة. تبدأ بسعة 800 ألف وتصل إلى 3 مليون عند النجمة الحمراء. تصيد الكراكن واللوياثان وبوسايدون والميغالودون — أربعة من أقوى كائنات الأعماق.' },
    { code:'tribe-lightning', name:'⚡ سفينة البرق',   level:24, rarity:'epic',      hp:20000, armor:80,  speed:100, storage:20000, attack:180, fishPool:['manta','hammerhead','orca','arowana'], price:0, priceTribeGems:60,  repairSec:240, tripSec:18, emoji:'⚡', tribeOnly:true, desc:'⚡ سفينة القبيلة — سرعة خارقة وصيد سريع.' },
    { code:'tribe-tornado',   name:'🌀 سفينة الإعصار', level:24, rarity:'epic',      hp:20000, armor:200, speed:70,  storage:20000, attack:200, fishPool:['whale','manta','goldfish','pearl'],    price:0, priceTribeGems:90,  repairSec:240, tripSec:22, emoji:'🌀', tribeOnly:true, desc:'🌀 سفينة القبيلة — سعة هائلة ودروع متينة.' },
    { code:'tribe-fire',      name:'🔥 سفينة النار',   level:24, rarity:'legendary', hp:20000, armor:150, speed:85,  storage:20000, attack:320, fishPool:['whale','orca','hammerhead','pearl'],    price:0, priceTribeGems:150, repairSec:300, tripSec:20, emoji:'🔥', tribeOnly:true, desc:'🔥 سفينة القبيلة — قوة هجوم لا تُقهر.' }
  ];

  var CATALOG = RAW.map(function (s) {
    var legacy = legacyId(s.code);
    return {
      id: legacy, code: s.code, cat: 'ships',
      name: s.name, img: imgFor(s.code), icon: s.emoji || '⛵',
      desc: s.desc || '',
      rarity: s.rarity, level: s.level, req_level: s.level,
      price: s.price || 0, price_coins: s.price || 0,
      priceGems: s.priceGems || 0, priceTribeGems: s.priceTribeGems || 0,
      hp: s.hp, maxHp: s.hp, armor: s.armor, speed: s.speed,
      storage: s.storage, attack: s.attack,
      repairSec: s.repairSec || 60, repairSeconds: s.repairSec || 60,
      tripSec: s.tripSec || 60, fishing_seconds: s.tripSec || 60,
      fishPool: s.fishPool || [], fish: s.fishPool || [],
      tribeOnly: !!s.tribeOnly,
      upgradable: !!s.upgradable, maxStars: s.maxStars || 1,
      starData: s.starData || null
    };
  });

  var BY_ID = {}, BY_CODE = {};
  CATALOG.forEach(function (c) { BY_ID[c.id] = c; BY_CODE[c.code] = c; });

  var DEFS = {};
  CATALOG.forEach(function (c) {
    DEFS[c.id] = { name: c.name, level: c.level, capacity: c.storage, w: Math.round(60 + c.storage / 2000), color: '#8a5a2b', icon: c.icon, price: c.price, fishTypes: c.fishPool, img: c.img, desc: c.desc };
  });

  var RARITY = {
    common:    { name:'عادي', color:'#e7e5e4', ring:'rgba(168,162,158,.6)', bg:'linear-gradient(180deg,rgba(80,75,70,.5),rgba(30,28,26,.6))' },
    rare:      { name:'نادر', color:'#bae6fd', ring:'rgba(56,189,248,.7)',  bg:'linear-gradient(180deg,rgba(3,105,161,.35),rgba(7,20,40,.6))' },
    epic:      { name:'ملحمي', color:'#e9d5ff', ring:'rgba(168,85,247,.8)',  bg:'linear-gradient(180deg,rgba(107,33,168,.35),rgba(30,10,50,.6))' },
    legendary: { name:'أسطوري', color:'#fef3c7', ring:'rgba(251,191,36,.9)',  bg:'linear-gradient(180deg,rgba(180,83,9,.4),rgba(50,20,10,.65))' },
    mythic:    { name:'خرافي', color:'#fecdd3', ring:'rgba(244,63,94,1)',    bg:'linear-gradient(180deg,rgba(159,18,57,.45),rgba(40,5,20,.7))' },
    uncommon:  { name:'غير شائع', color:'#a7f3d0', ring:'rgba(16,185,129,.7)', bg:'linear-gradient(180deg,rgba(6,95,70,.35),rgba(4,40,30,.6))' }
  };

  function fmtTime(sec) { if (!sec || sec <= 0) return '00:00'; var h = Math.floor(sec / 3600); var m = Math.floor((sec % 3600) / 60); if (h > 0) return h + 'h ' + m + 'm'; return (m < 10 ? '0' : '') + m + ':' + ((sec % 60) < 10 ? '0' : '') + (sec % 60); }
  function fmtCountdown(sec) { if (!sec || sec <= 0) return 'الآن'; var h = Math.floor(sec / 3600); var m = Math.floor((sec % 3600) / 60); return h > 0 ? h + 'س ' + m + 'د' : m + 'د'; }
  function shipImg(ship) { if (!ship) return ''; if (ship.starData && ship.stars) { var sd = ship.starData[Math.min(ship.stars - 1, ship.starData.length - 1)]; if (sd && sd.img) return sd.img; } var def = BY_CODE[ship.code]; return def ? def.img : ''; }
  function shipStats(ship) { var def = BY_CODE[ship.code]; if (!def) return null; if (def.starData && ship.stars && def.starData[ship.stars - 1]) { var sd = def.starData[ship.stars - 1]; return { storage: sd.storage, hp: sd.hp, attack: sd.attack, trip: sd.trip, img: sd.img }; } return { storage: def.storage, hp: def.hp, attack: def.attack, trip: def.tripSec, img: def.img }; }

  window.SHIPS = CATALOG;
  window.SHIP_BY_ID = BY_ID;
  window.SHIP_CATALOG = CATALOG;
  window.SHIP_BY_CODE = BY_CODE;
  window.SHIP_DEFS = DEFS;
  window.SHIP_RARITY = RARITY;
  window.SHIP_IMGS = SHIP_IMGS;
  window.shipRarity = function (r) { return RARITY[r] || RARITY.common; };
  window.shipFmtTime = fmtTime;
  window.shipFmtCountdown = fmtCountdown;
  window.shipImg = shipImg;
  window.shipStats = shipStats;
  window.__shipsReady = true;
  try { console.log('[Data/Ships] ' + CATALOG.length + ' سفينة v9.0'); } catch (e) {}

})();
