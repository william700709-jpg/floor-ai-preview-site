export type FloorPreviewStyle = {
  id: number;
  key: string;
  name: string;
  description: string;
  tone: string;
  badge: string;
  colors: [string, string, string];
};

export const mockFloorPreviewStyles: FloorPreviewStyle[] = [
  {
    id: 1,
    key: "honey-oak",
    name: "暮光橡木",
    description: "柔和蜂蜜色，適合奶茶與米白系客廳。",
    tone: "暖木調",
    badge: "人氣選色",
    colors: ["#ceb08b", "#b98f66", "#8f6749"]
  },
  {
    id: 2,
    key: "mist-walnut",
    name: "霧感胡桃",
    description: "帶灰度的中木色，沉穩又不壓空間。",
    tone: "柔灰木調",
    badge: "臥室推薦",
    colors: ["#b49e88", "#8e735d", "#685243"]
  },
  {
    id: 3,
    key: "linen-beige",
    name: "亞麻淺木",
    description: "明亮淺木色，能放大採光與空間感。",
    tone: "自然淺木",
    badge: "小宅友善",
    colors: ["#dbc8af", "#c9ae89", "#9e8060"]
  },
  {
    id: 4,
    key: "forest-oak",
    name: "森霧橡木",
    description: "帶一點綠灰底蘊，適合低飽和自然風。",
    tone: "綠灰木調",
    badge: "設計感",
    colors: ["#b7b39e", "#8c8469", "#6a624f"]
  }
];
