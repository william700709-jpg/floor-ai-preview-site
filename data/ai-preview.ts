export type FloorPreviewStyle = {
  id: number;
  key: string;
  code: string;
  name: string;
  description: string;
  tone: string;
  badge: string;
  groupCode: string;
  groupName: string;
  imageUrl?: string;
  colors: [string, string, string];
};

export type FloorPreviewGroup = {
  code: string;
  name: string;
  description: string;
  coverUrl?: string;
  spec: {
    dimension: string;
    thicknessMm: number;
    wearLayerMm: number;
    packaging: string;
  };
  styles: FloorPreviewStyle[];
};

export const mockFloorPreviewGroups: FloorPreviewGroup[] = [
  {
    code: "FSPC4.2",
    name: "FSPC 4.2mm+0.2mm 高彈性鎖扣式地板",
    description: "居家生活木紋系列",
    spec: {
      dimension: "7.2x48 in (182mm x 1210mm)",
      thicknessMm: 4.2,
      wearLayerMm: 0.3,
      packaging: "8片 / 0.53坪裝"
    },
    styles: [
      {
        id: 1,
        key: "fspc4.2-sf60",
        code: "SF60",
        name: "SF60",
        description: "居家生活木紋系列，適合客廳、臥室與日常空間。",
        tone: "FSPC4.2",
        badge: "SF60",
        groupCode: "FSPC4.2",
        groupName: "FSPC 4.2mm+0.2mm 高彈性鎖扣式地板",
        colors: ["#ece5db", "#d9c8b7", "#b89f83"]
      },
      {
        id: 2,
        key: "fspc4.2-sf61",
        code: "SF61",
        name: "SF61",
        description: "居家生活木紋系列，適合客廳、臥室與日常空間。",
        tone: "FSPC4.2",
        badge: "SF61",
        groupCode: "FSPC4.2",
        groupName: "FSPC 4.2mm+0.2mm 高彈性鎖扣式地板",
        colors: ["#efe7dc", "#d4c0aa", "#b58c67"]
      }
    ]
  },
  {
    code: "FSPC5.0",
    name: "FSPC 5.0mm+0.2mm 高彈性鎖扣式地板",
    description: "居家生活木紋系列",
    spec: {
      dimension: "7.8x48 in (198mm x 1210mm)",
      thicknessMm: 5,
      wearLayerMm: 0.5,
      packaging: "8片 / 0.58坪裝"
    },
    styles: [
      {
        id: 101,
        key: "fspc5.0-y101",
        code: "Y101",
        name: "Y101",
        description: "居家生活木紋系列，色調柔和，適合餐廳與住家空間。",
        tone: "FSPC5.0",
        badge: "Y101",
        groupCode: "FSPC5.0",
        groupName: "FSPC 5.0mm+0.2mm 高彈性鎖扣式地板",
        colors: ["#ece4cb", "#d8c79d", "#b59f67"]
      },
      {
        id: 102,
        key: "fspc5.0-y102",
        code: "Y102",
        name: "Y102",
        description: "居家生活木紋系列，色調柔和，適合餐廳與住家空間。",
        tone: "FSPC5.0",
        badge: "Y102",
        groupCode: "FSPC5.0",
        groupName: "FSPC 5.0mm+0.2mm 高彈性鎖扣式地板",
        colors: ["#eadcc2", "#d1bc8b", "#a9834f"]
      }
    ]
  }
];

export const mockFloorPreviewStyles = mockFloorPreviewGroups.flatMap((group) => group.styles);
