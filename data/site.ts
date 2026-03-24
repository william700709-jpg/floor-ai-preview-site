export const navItems = [
  { href: "/", label: "首頁" },
  { href: "/curtain-quote", label: "線上報價" },
  { href: "/floor-ai-preview", label: "AI 地板預覽" },
  { href: "/projects", label: "案例作品" },
  { href: "/about", label: "關於我們" },
  { href: "/contact", label: "聯絡我們" }
];

export const services = [
  {
    title: "地板規劃",
    description: "從空間尺寸、材質搭配到施工方式，提供實用又耐看的地板建議。"
  },
  {
    title: "窗簾搭配",
    description: "依照採光、隱私與風格需求，協助選出適合的窗簾系統與布料。"
  },
  {
    title: "整體報價",
    description: "先用線上試算快速掌握預算，再安排到府丈量與細部確認。"
  }
];

export const processSteps = [
  {
    title: "線上初估",
    description: "輸入尺寸與需求，快速取得風格方向與預算區間。"
  },
  {
    title: "專人聯繫",
    description: "由顧問確認材質、空間條件與施工細節。"
  },
  {
    title: "到府丈量",
    description: "現場丈量並提供配色與樣品建議，降低估價落差。"
  },
  {
    title: "正式報價與施工",
    description: "確認報價單後安排工期，提供安心透明的施作流程。"
  }
];

export const featuredProjects = [
  {
    title: "奶茶木質感客廳",
    category: "超耐磨木地板",
    description: "以淺木色地板搭配奶油白牆面，讓日常更明亮放鬆。",
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "柔光臥室窗景",
    category: "雙層窗簾",
    description: "紗簾引入自然光，遮光簾保留夜間隱私與安定感。",
    image:
      "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "靜謐書房配置",
    category: "SPC 石塑地板",
    description: "低飽和綠與暖灰交織，呈現沉穩不冰冷的閱讀氛圍。",
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"
  }
];

export const testimonials = [
  {
    name: "林小姐",
    quote: "顧問很有耐心，估價清楚，現場完工後跟想像中的質感一模一樣。"
  },
  {
    name: "陳先生",
    quote: "原本很擔心預算失控，先用網站試算後，後續討論變得很有效率。"
  },
  {
    name: "王太太",
    quote: "地板和窗簾一起處理真的省心很多，整體搭配也更有一致性。"
  }
];

export const floorOptions = {
  styles: [
    { label: "超耐磨木地板", value: "laminate", unitPrice: 2600, coverage: 1.8 },
    { label: "SPC 石塑地板", value: "spc", unitPrice: 3200, coverage: 1.6 },
    { label: "實木複合地板", value: "engineered", unitPrice: 4200, coverage: 1.4 }
  ],
  installMethods: [
    { label: "直鋪施工", value: "direct", multiplier: 1 },
    { label: "平鋪含墊材", value: "floating", multiplier: 1.08 },
    { label: "人字拼", value: "herringbone", multiplier: 1.18 }
  ]
};

export const curtainOptions = {
  types: [
    { label: "布簾", value: "fabric", basePrice: 1800 },
    { label: "捲簾", value: "roller", basePrice: 1500 },
    { label: "調光簾", value: "zebra", basePrice: 2100 }
  ],
  fabrics: [
    { label: "標準布料", value: "standard", multiplier: 1 },
    { label: "亞麻感布料", value: "linen", multiplier: 1.15 },
    { label: "進口訂製布料", value: "premium", multiplier: 1.35 }
  ],
  blackoutLevels: [
    { label: "一般遮光", value: "medium", multiplier: 1 },
    { label: "高遮光", value: "high", multiplier: 1.12 },
    { label: "全遮光", value: "full", multiplier: 1.2 }
  ]
};

export const contactDetails = [
  { label: "服務時間", value: "週一至週六 10:00 - 19:00" },
  { label: "服務區域", value: "雙北、桃園、新竹可安排丈量" },
  { label: "LINE 諮詢", value: "@089einyk" },
  { label: "聯絡電話", value: "0913554149" }
];

export const lineContact = {
  id: "@089einyk",
  href: "https://line.me/R/ti/p/@089einyk"
};
