export type TarotCard = {
  id: string
  name: string
  nameEn: string
  keywords: string[]
  meaning: string
  image: string
}

// 大阿卡纳 - 22张
export const majorArcana: TarotCard[] = [
  {
    id: "major_fool",
    name: "愚者",
    nameEn: "The Fool",
    keywords: ["新开始", "纯真", "冒险", "信任"],
    meaning: "带着赤子之心踏上旅程，相信生命会接住你。",
    image: "/tarot/major_arcana_fool.jpeg"
  },
  {
    id: "major_magician",
    name: "魔术师",
    nameEn: "The Magician",
    keywords: ["创造力", "专注", "意志力", "显化"],
    meaning: "你拥有所需的一切资源，将意念转化为现实。",
    image: "/tarot/major_arcana_magician.jpeg"
  },
  {
    id: "major_priestess",
    name: "女祭司",
    nameEn: "The High Priestess",
    keywords: ["直觉", "内在智慧", "神秘", "潜意识"],
    meaning: "向内倾听，答案就在你的内心深处。",
    image: "/tarot/major_arcana_priestess.jpeg"
  },
  {
    id: "major_empress",
    name: "皇后",
    nameEn: "The Empress",
    keywords: ["丰盛", "滋养", "创造", "母性"],
    meaning: "允许自己被滋养，也去滋养他人。",
    image: "/tarot/major_arcana_empress.jpeg"
  },
  {
    id: "major_emperor",
    name: "皇帝",
    nameEn: "The Emperor",
    keywords: ["稳定", "权威", "结构", "保护"],
    meaning: "建立稳固的基础，为自己的生命负责。",
    image: "/tarot/major_arcana_emperor.jpeg"
  },
  {
    id: "major_hierophant",
    name: "教皇",
    nameEn: "The Hierophant",
    keywords: ["传承", "信仰", "指引", "智慧"],
    meaning: "向内在的导师寻求指引，也成为他人的灯塔。",
    image: "/tarot/major_arcana_hierophant.jpeg"
  },
  {
    id: "major_lovers",
    name: "恋人",
    nameEn: "The Lovers",
    keywords: ["爱", "选择", "和谐", "连接"],
    meaning: "真正的爱始于与自己的和解。",
    image: "/tarot/major_arcana_lovers.jpeg"
  },
  {
    id: "major_chariot",
    name: "战车",
    nameEn: "The Chariot",
    keywords: ["前进", "意志力", "胜利", "自律"],
    meaning: "驾驭内心的力量，坚定地向目标前进。",
    image: "/tarot/major_arcana_chariot.jpeg"
  },
  {
    id: "major_strength",
    name: "力量",
    nameEn: "Strength",
    keywords: ["内在力量", "勇气", "耐心", "慈悲"],
    meaning: "真正的力量是温柔地拥抱自己的阴影。",
    image: "/tarot/major_arcana_strength.jpeg"
  },
  {
    id: "major_hermit",
    name: "隐士",
    nameEn: "The Hermit",
    keywords: ["独处", "内省", "寻找", "智慧"],
    meaning: "在静默中找到属于你的光。",
    image: "/tarot/major_arcana_hermit.jpeg"
  },
  {
    id: "major_fortune",
    name: "命运之轮",
    nameEn: "Wheel of Fortune",
    keywords: ["转变", "周期", "命运", "机遇"],
    meaning: "唯一不变的是变化本身，拥抱生命的流动。",
    image: "/tarot/major_arcana_fortune.jpeg"
  },
  {
    id: "major_justice",
    name: "正义",
    nameEn: "Justice",
    keywords: ["公正", "真相", "因果", "平衡"],
    meaning: "诚实面对自己，因果自有其法则。",
    image: "/tarot/major_arcana_justice.jpeg"
  },
  {
    id: "major_hanged",
    name: "倒吊人",
    nameEn: "The Hanged Man",
    keywords: ["放下", "新视角", "臣服", "等待"],
    meaning: "换个角度看世界，在静止中找到新的可能。",
    image: "/tarot/major_arcana_hanged.jpeg"
  },
  {
    id: "major_death",
    name: "死神",
    nameEn: "Death",
    keywords: ["结束", "转化", "重生", "放手"],
    meaning: "结束是新生的开始，允许旧的离去。",
    image: "/tarot/major_arcana_death.jpeg"
  },
  {
    id: "major_temperance",
    name: "节制",
    nameEn: "Temperance",
    keywords: ["平衡", "调和", "耐心", "中庸"],
    meaning: "在对立中找到平衡，在融合中找到和谐。",
    image: "/tarot/major_arcana_temperance.jpeg"
  },
  {
    id: "major_devil",
    name: "恶魔",
    nameEn: "The Devil",
    keywords: ["执念", "束缚", "阴影", "欲望"],
    meaning: "看见束缚你的是什么，你随时可以选择自由。",
    image: "/tarot/major_arcana_devil.jpeg"
  },
  {
    id: "major_tower",
    name: "塔",
    nameEn: "The Tower",
    keywords: ["崩塌", "觉醒", "真相", "释放"],
    meaning: "旧结构的崩塌是为了让真正的你显现。",
    image: "/tarot/major_arcana_tower.jpeg"
  },
  {
    id: "major_star",
    name: "星星",
    nameEn: "The Star",
    keywords: ["希望", "疗愈", "启示", "宁静"],
    meaning: "在黑暗之后，希望之光永远存在。",
    image: "/tarot/major_arcana_star.jpeg"
  },
  {
    id: "major_moon",
    name: "月亮",
    nameEn: "The Moon",
    keywords: ["幻象", "直觉", "潜意识", "梦境"],
    meaning: "穿越恐惧与幻象，跟随内心的指引。",
    image: "/tarot/major_arcana_moon.jpeg"
  },
  {
    id: "major_sun",
    name: "太阳",
    nameEn: "The Sun",
    keywords: ["喜悦", "成功", "活力", "光明"],
    meaning: "你值得拥有纯粹的快乐和光明。",
    image: "/tarot/major_arcana_sun.jpeg"
  },
  {
    id: "major_judgement",
    name: "审判",
    nameEn: "Judgement",
    keywords: ["觉醒", "重生", "召唤", "更新"],
    meaning: "聆听内心的召唤，回应真正的自己。",
    image: "/tarot/major_arcana_judgement.jpeg"
  },
  {
    id: "major_world",
    name: "世界",
    nameEn: "The World",
    keywords: ["完成", "整合", "圆满", "成就"],
    meaning: "你已经完整，每个旅程都有圆满的一刻。",
    image: "/tarot/major_arcana_world.jpeg"
  }
]

// 圣杯牌组 - 情感与关系
const cups: TarotCard[] = [
  { id: "cups_ace", name: "圣杯王牌", nameEn: "Ace of Cups", keywords: ["新的情感", "爱", "直觉", "灵性"], meaning: "敞开心扉，接受爱的流动。", image: "/tarot/minor_arcana_cups_ace.jpeg" },
  { id: "cups_2", name: "圣杯二", nameEn: "Two of Cups", keywords: ["连接", "伙伴", "和谐", "互惠"], meaning: "真诚的连接始于相互尊重。", image: "/tarot/minor_arcana_cups_2.jpeg" },
  { id: "cups_3", name: "圣杯三", nameEn: "Three of Cups", keywords: ["庆祝", "友谊", "社群", "喜悦"], meaning: "与他人分享喜悦会让喜悦加倍。", image: "/tarot/minor_arcana_cups_3.jpeg" },
  { id: "cups_4", name: "圣杯四", nameEn: "Four of Cups", keywords: ["沉思", "冷漠", "重新评估", "机会"], meaning: "有时需要退后一步，才能看到眼前的礼物。", image: "/tarot/minor_arcana_cups_4.jpeg" },
  { id: "cups_5", name: "圣杯五", nameEn: "Five of Cups", keywords: ["失落", "悲伤", "接受", "转化"], meaning: "允许悲伤流过，也看见仍然存在的。", image: "/tarot/minor_arcana_cups_5.jpeg" },
  { id: "cups_6", name: "圣杯六", nameEn: "Six of Cups", keywords: ["回忆", "纯真", "童年", "礼物"], meaning: "童年的纯真仍在你心中。", image: "/tarot/minor_arcana_cups_6.jpeg" },
  { id: "cups_7", name: "圣杯七", nameEn: "Seven of Cups", keywords: ["幻想", "选择", "梦想", "诱惑"], meaning: "分辨真实的渴望与短暂的幻想。", image: "/tarot/minor_arcana_cups_7.jpeg" },
  { id: "cups_8", name: "圣杯八", nameEn: "Eight of Cups", keywords: ["离开", "寻找", "放下", "更高目标"], meaning: "有勇气离开不再滋养你的。", image: "/tarot/minor_arcana_cups_8.jpeg" },
  { id: "cups_9", name: "圣杯九", nameEn: "Nine of Cups", keywords: ["满足", "愿望成真", "幸福", "感恩"], meaning: "你的愿望正在实现，享受这份丰盛。", image: "/tarot/minor_arcana_cups_9.jpeg" },
  { id: "cups_10", name: "圣杯十", nameEn: "Ten of Cups", keywords: ["幸福", "和谐", "家庭", "圆满"], meaning: "情感的圆满来自内心的平和。", image: "/tarot/minor_arcana_cups_10.jpeg" },
  { id: "cups_page", name: "圣杯侍从", nameEn: "Page of Cups", keywords: ["创意", "直觉", "情感萌芽", "好奇"], meaning: "保持对情感世界的好奇与开放。", image: "/tarot/minor_arcana_cups_page.jpeg" },
  { id: "cups_knight", name: "圣杯骑士", nameEn: "Knight of Cups", keywords: ["浪漫", "魅力", "追求", "艺术"], meaning: "跟随心的方向，追寻美与爱。", image: "/tarot/minor_arcana_cups_knight.jpeg" },
  { id: "cups_queen", name: "圣杯皇后", nameEn: "Queen of Cups", keywords: ["同理心", "直觉", "滋养", "情感智慧"], meaning: "用你深厚的同理心照顾自己与他人。", image: "/tarot/minor_arcana_cups_queen.jpeg" },
  { id: "cups_king", name: "圣杯国王", nameEn: "King of Cups", keywords: ["情感成熟", "平衡", "智慧", "慈悲"], meaning: "在情感与理智之间找到平衡。", image: "/tarot/minor_arcana_cups_king.jpeg" }
]

// 权杖牌组 - 行动与创意
const wands: TarotCard[] = [
  { id: "wands_ace", name: "权杖王牌", nameEn: "Ace of Wands", keywords: ["灵感", "新开始", "潜力", "创意"], meaning: "创意的火花已经点燃，行动起来。", image: "/tarot/minor_arcana_wands_ace.jpeg" },
  { id: "wands_2", name: "权杖二", nameEn: "Two of Wands", keywords: ["计划", "决定", "远见", "探索"], meaning: "世界在你面前展开，做出你的选择。", image: "/tarot/minor_arcana_wands_2.jpeg" },
  { id: "wands_3", name: "权杖三", nameEn: "Three of Wands", keywords: ["扩展", "远见", "机会", "等待"], meaning: "你播下的种子正在生长，继续相信。", image: "/tarot/minor_arcana_wands_3.jpeg" },
  { id: "wands_4", name: "权杖四", nameEn: "Four of Wands", keywords: ["庆祝", "稳定", "里程碑", "归属"], meaning: "为已经达成的庆祝，稳固你的根基。", image: "/tarot/minor_arcana_wands_4.jpeg" },
  { id: "wands_5", name: "权杖五", nameEn: "Five of Wands", keywords: ["竞争", "冲突", "挑战", "成长"], meaning: "在挑战中磨练自己，但不要迷失方向。", image: "/tarot/minor_arcana_wands_5.jpeg" },
  { id: "wands_6", name: "权杖六", nameEn: "Six of Wands", keywords: ["胜利", "认可", "自信", "成就"], meaning: "你的努力得到认可，享受这份成就。", image: "/tarot/minor_arcana_wands_6.jpeg" },
  { id: "wands_7", name: "权杖七", nameEn: "Seven of Wands", keywords: ["坚持", "防守", "勇气", "信念"], meaning: "坚持你的立场，你比你想象的更强大。", image: "/tarot/minor_arcana_wands_7.jpeg" },
  { id: "wands_8", name: "权杖八", nameEn: "Eight of Wands", keywords: ["迅速", "行动", "进展", "沟通"], meaning: "事情正在加速，保持专注和灵活。", image: "/tarot/minor_arcana_wands_8.jpeg" },
  { id: "wands_9", name: "权杖九", nameEn: "Nine of Wands", keywords: ["坚韧", "毅力", "边界", "最后一步"], meaning: "你已经走过这么远，再坚持一下。", image: "/tarot/minor_arcana_wands_9.jpeg" },
  { id: "wands_10", name: "权杖十", nameEn: "Ten of Wands", keywords: ["负担", "责任", "压力", "委托"], meaning: "学会放下不属于你的重担。", image: "/tarot/minor_arcana_wands_10.jpeg" },
  { id: "wands_page", name: "权杖侍从", nameEn: "Page of Wands", keywords: ["热情", "探索", "自由", "新想法"], meaning: "带着热情去探索新的可能性。", image: "/tarot/minor_arcana_wands_page.jpeg" },
  { id: "wands_knight", name: "权杖骑士", nameEn: "Knight of Wands", keywords: ["冒险", "能量", "冲动", "热忱"], meaning: "让热情带领你，但也记得看路。", image: "/tarot/minor_arcana_wands_knight.jpeg" },
  { id: "wands_queen", name: "权杖皇后", nameEn: "Queen of Wands", keywords: ["自信", "热情", "独立", "魅力"], meaning: "拥抱你内在的火焰，照亮自己的道路。", image: "/tarot/minor_arcana_wands_queen.jpeg" },
  { id: "wands_king", name: "权杖国王", nameEn: "King of Wands", keywords: ["领导力", "远见", "创业", "魄力"], meaning: "用智慧和热情引领你的王国。", image: "/tarot/minor_arcana_wands_king.jpeg" }
]

// 宝剑牌组 - 思维与挑战
const swords: TarotCard[] = [
  { id: "swords_ace", name: "宝剑王牌", nameEn: "Ace of Swords", keywords: ["清明", "真相", "突破", "新想法"], meaning: "真相的利剑帮你穿透迷雾。", image: "/tarot/minor_arcana_swords_ace.jpeg" },
  { id: "swords_2", name: "宝剑二", nameEn: "Two of Swords", keywords: ["抉择", "僵局", "逃避", "平衡"], meaning: "打开眼睛，面对需要做出的选择。", image: "/tarot/minor_arcana_swords_2.jpeg" },
  { id: "swords_3", name: "宝剑三", nameEn: "Three of Swords", keywords: ["心痛", "悲伤", "释放", "疗愈"], meaning: "允许痛苦流过，它是疗愈的开始。", image: "/tarot/minor_arcana_swords_3.jpeg" },
  { id: "swords_4", name: "宝剑四", nameEn: "Four of Swords", keywords: ["休息", "恢复", "冥想", "准备"], meaning: "给自己休息的时间，为下一程蓄力。", image: "/tarot/minor_arcana_swords_4.jpeg" },
  { id: "swords_5", name: "宝剑五", nameEn: "Five of Swords", keywords: ["冲突", "输赢", "自私", "反思"], meaning: "赢得战斗可能失去更重要的东西。", image: "/tarot/minor_arcana_swords_5.jpeg" },
  { id: "swords_6", name: "宝剑六", nameEn: "Six of Swords", keywords: ["过渡", "离开", "疗愈", "新方向"], meaning: "离开风暴，驶向平静的水域。", image: "/tarot/minor_arcana_swords_6.jpeg" },
  { id: "swords_7", name: "宝剑七", nameEn: "Seven of Swords", keywords: ["策略", "欺骗", "独行", "机智"], meaning: "检视你的动机，是智慧还是逃避？", image: "/tarot/minor_arcana_swords_7.jpeg" },
  { id: "swords_8", name: "宝剑八", nameEn: "Eight of Swords", keywords: ["困境", "受限", "恐惧", "自我设限"], meaning: "束缚你的可能只是你的信念。", image: "/tarot/minor_arcana_swords_8.jpeg" },
  { id: "swords_9", name: "宝剑九", nameEn: "Nine of Swords", keywords: ["焦虑", "噩梦", "担忧", "自我折磨"], meaning: "在黑暗中，恐惧被放大。天亮时一切会好起来。", image: "/tarot/minor_arcana_swords_9.jpeg" },
  { id: "swords_10", name: "宝剑十", nameEn: "Ten of Swords", keywords: ["结束", "触底", "重生", "新开始"], meaning: "最黑暗的时刻过后，曙光即将到来。", image: "/tarot/minor_arcana_swords_10.jpeg" },
  { id: "swords_page", name: "宝剑侍从", nameEn: "Page of Swords", keywords: ["好奇", "警觉", "新想法", "沟通"], meaning: "保持敏锐的观察力，但也要学会聆听。", image: "/tarot/minor_arcana_swords_page.jpeg" },
  { id: "swords_knight", name: "宝剑骑士", nameEn: "Knight of Swords", keywords: ["迅速", "直接", "野心", "冲动"], meaning: "追求真相的路上，也请照顾好人心。", image: "/tarot/minor_arcana_swords_knight.jpeg" },
  { id: "swords_queen", name: "宝剑皇后", nameEn: "Queen of Swords", keywords: ["清明", "独立", "直接", "智慧"], meaning: "用清明的头脑做出公正的判断。", image: "/tarot/minor_arcana_swords_queen.jpeg" },
  { id: "swords_king", name: "宝剑国王", nameEn: "King of Swords", keywords: ["权威", "真相", "公正", "逻辑"], meaning: "用智慧与公正引领你的决定。", image: "/tarot/minor_arcana_swords_king.jpeg" }
]

// 五芒星牌组 - 物质与实际
const pentacles: TarotCard[] = [
  { id: "pentacles_ace", name: "五芒星王牌", nameEn: "Ace of Pentacles", keywords: ["新机会", "繁荣", "稳定", "物质"], meaning: "播下种子，丰收将会到来。", image: "/tarot/minor_arcana_pentacles_ace.jpeg" },
  { id: "pentacles_2", name: "五芒星二", nameEn: "Two of Pentacles", keywords: ["平衡", "适应", "灵活", "优先"], meaning: "在变化中保持平衡，学会取舍。", image: "/tarot/minor_arcana_pentacles_2.jpeg" },
  { id: "pentacles_3", name: "五芒星三", nameEn: "Three of Pentacles", keywords: ["团队", "学习", "技能", "合作"], meaning: "与他人合作，共同创造价值。", image: "/tarot/minor_arcana_pentacles_3.jpeg" },
  { id: "pentacles_4", name: "五芒星四", nameEn: "Four of Pentacles", keywords: ["安全", "控制", "执着", "储蓄"], meaning: "安全感来自内心，而非紧握不放。", image: "/tarot/minor_arcana_pentacles_4.jpeg" },
  { id: "pentacles_5", name: "五芒星五", nameEn: "Five of Pentacles", keywords: ["困难", "贫困", "孤立", "信念"], meaning: "在困境中，帮助往往就在身边。", image: "/tarot/minor_arcana_pentacles_5.jpeg" },
  { id: "pentacles_6", name: "五芒星六", nameEn: "Six of Pentacles", keywords: ["慷慨", "给予", "接受", "平衡"], meaning: "给予与接受同样重要。", image: "/tarot/minor_arcana_pentacles_6.jpeg" },
  { id: "pentacles_7", name: "五芒星七", nameEn: "Seven of Pentacles", keywords: ["耐心", "评估", "等待", "收获"], meaning: "你已经播种，现在需要耐心等待。", image: "/tarot/minor_arcana_pentacles_7.jpeg" },
  { id: "pentacles_8", name: "五芒星八", nameEn: "Eight of Pentacles", keywords: ["技艺", "勤奋", "专注", "掌握"], meaning: "持续精进，在做中学。", image: "/tarot/minor_arcana_pentacles_8.jpeg" },
  { id: "pentacles_9", name: "五芒星九", nameEn: "Nine of Pentacles", keywords: ["独立", "丰盛", "自给自足", "优雅"], meaning: "你已经创造了属于自己的丰盛。", image: "/tarot/minor_arcana_pentacles_9.jpeg" },
  { id: "pentacles_10", name: "五芒星十", nameEn: "Ten of Pentacles", keywords: ["传承", "财富", "家族", "长久"], meaning: "真正的财富是能够传承的智慧与爱。", image: "/tarot/minor_arcana_pentacles_10.jpeg" },
  { id: "pentacles_page", name: "五芒星侍从", nameEn: "Page of Pentacles", keywords: ["学习", "机会", "实际", "计划"], meaning: "脚踏实地，一步步实现你的目标。", image: "/tarot/minor_arcana_pentacles_page.jpeg" },
  { id: "pentacles_knight", name: "五芒星骑士", nameEn: "Knight of Pentacles", keywords: ["可靠", "勤劳", "稳定", "坚持"], meaning: "稳扎稳打，你会到达目的地。", image: "/tarot/minor_arcana_pentacles_knight.jpeg" },
  { id: "pentacles_queen", name: "五芒星皇后", nameEn: "Queen of Pentacles", keywords: ["滋养", "实际", "安全", "慷慨"], meaning: "在照顾他人的同时，也照顾好自己。", image: "/tarot/minor_arcana_pentacles_queen.jpeg" },
  { id: "pentacles_king", name: "五芒星国王", nameEn: "King of Pentacles", keywords: ["富足", "成就", "可靠", "领导"], meaning: "用你的资源创造更大的价值。", image: "/tarot/minor_arcana_pentacles_king.jpeg" }
]

// 完整牌组
export const allCards: TarotCard[] = [
  ...majorArcana,
  ...cups,
  ...wands,
  ...swords,
  ...pentacles
]

// 随机抽牌
export function drawCards(count: number = 3): TarotCard[] {
  const shuffled = [...allCards].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
