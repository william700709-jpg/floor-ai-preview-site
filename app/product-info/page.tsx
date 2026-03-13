import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";

type ProductSection = {
  id: string;
  title: string;
  intro: string;
  cards?: Array<{
    title: string;
    subtitle: string;
    body: string;
  }>;
  table?: string[][];
  bullets?: string[];
};

const seriesHighlights = [
  {
    code: "FSPC4.2",
    title: "輕巧翻新款",
    image: "/images/product-info/fspc42-cover.jpg",
    spec: "182 x 1210 mm / 4.2 mm / 0.3 mm / 8片 0.53坪",
    summary:
      "適合臥室、出租屋與一般住宅翻新，預算控制更靈活，施工速度也很適合短工期案件。",
    samples: [
      { code: "SF60", image: "/images/product-info/fspc42-sf60.jpg" },
      { code: "SF64", image: "/images/product-info/fspc42-sf64.jpg" },
      { code: "SF68", image: "/images/product-info/fspc42-sf68.jpg" },
    ],
  },
  {
    code: "FSPC5.0",
    title: "厚實耐用款",
    image: "/images/product-info/fspc50-cover.jpg",
    spec: "198 x 1210 mm / 5.0 mm / 0.5 mm / 8片 0.58坪",
    summary:
      "更適合客廳主空間、接待區與高使用頻率場域，腳感更扎實，耐磨層也更高。",
    samples: [
      { code: "Y101", image: "/images/product-info/fspc50-y101.jpg" },
      { code: "Y105", image: "/images/product-info/fspc50-y105.jpg" },
      { code: "Y109", image: "/images/product-info/fspc50-y109.jpg" },
    ],
  },
];

const productSections: ProductSection[] = [
  {
    id: "overview",
    title: "FSPC 系列總覽",
    intro:
      "FSPC 系列主打穩定耐用、低膨脹率與居家常用空間的舒適腳感，目前以 FSPC4.2 與 FSPC5.0 兩個系列為主，分別對應一般住宅翻新與更重視厚實感、耐用度的空間需求。",
    cards: [
      {
        title: "FSPC4.2",
        subtitle: "4.2mm 厚度 + 0.3mm 耐磨層",
        body:
          "182 x 1210 mm，8 片 / 0.53 坪裝。整體厚度較輕巧，適合一般住家、出租屋翻新與預算型裝修，也方便快速更新空間風格。",
      },
      {
        title: "FSPC5.0",
        subtitle: "5.0mm 厚度 + 0.5mm 耐磨層",
        body:
          "198 x 1210 mm，8 片 / 0.58 坪裝。板材更厚、耐磨層更高，踩踏感更扎實，適合客廳、商空接待區與更重視使用年限的空間。",
      },
    ],
  },
  {
    id: "compare",
    title: "規格比較",
    intro:
      "以下為目前 FSPC 產品目錄中兩個主要系列的精華整理，方便屋主快速比對尺寸、厚度、耐磨層與每盒鋪設量。",
    table: [
      ["系列", "尺寸", "總厚度", "耐磨層", "每盒規格", "適合族群"],
      ["FSPC4.2", "182 x 1210 mm", "4.2 mm", "0.3 mm", "8 片 / 0.53 坪", "一般住宅、房間翻新、預算型裝修"],
      ["FSPC5.0", "198 x 1210 mm", "5.0 mm", "0.5 mm", "8 片 / 0.58 坪", "客廳主空間、商空接待區、重視耐磨者"],
    ],
  },
  {
    id: "features",
    title: "產品亮點",
    intro:
      "綜合 FSPC 產品目錄內容與市面上常見 SPC / FSPC 地板產品頁架構，以下是最適合放上網站的核心賣點。",
    bullets: [
      "石塑結構穩定性高，較不易因日常溫濕度變化而產生明顯變形，適合台灣常見住宅使用情境。",
      "表層具耐磨層設計，可應付日常走動、餐椅推拉與一般家庭活動，維持整體地板美觀度。",
      "卡扣式施工效率高，翻新時可有效縮短工期，對自住裝修與舊屋改造都相對友善。",
      "木紋花色選擇多，能對應奶茶木、灰木、淺橡木與自然木色等主流居家風格。",
    ],
  },
  {
    id: "spaces",
    title: "適用空間",
    intro:
      "網站產品資訊頁除了規格外，也很適合直接告訴客戶每個系列較適合的場景，降低選擇負擔。",
    bullets: [
      "客廳與開放式公領域：建議優先參考 FSPC5.0，腳感較厚實，日常使用更安心。",
      "臥室與小坪數空間：FSPC4.2 施工靈活、整體更新成本較好控制，適合溫馨居家配置。",
      "出租屋與快速翻新案件：施工效率高、花色完整，適合短工期與預算明確的需求。",
      "輕商業空間：如接待區、展示區與工作室，可依人流與耐磨需求優先考慮 FSPC5.0。",
    ],
  },
  {
    id: "install",
    title: "施工與安裝重點",
    intro:
      "產品資訊頁若能同時整理施工重點，會讓客戶更容易理解實際成品落差與現場條件的重要性。",
    bullets: [
      "施工前需先確認地坪平整度，若原始地面高低差過大，仍需先做基礎整平，成品才會穩定。",
      "牆邊、門口、櫃體收邊與轉接處理，會影響完成後的細節質感，建議交由熟悉卡扣地板的師傅施作。",
      "不同系列的厚度與耐磨層不同，實際選型時可依使用頻率、居住成員與預算一起評估。",
      "現場採光、牆色與家具材質會影響木紋視覺感受，建議搭配花色實拍與模擬圖一起確認。",
    ],
  },
  {
    id: "care",
    title: "清潔保養",
    intro:
      "清潔與保養也是網站上很常見的產品資訊主題，能幫助客戶更快建立使用信心。",
    bullets: [
      "日常可用吸塵器、靜電拖把或擰乾微濕拖布清潔，避免長時間積水停留在地面。",
      "建議桌椅腳加保護墊，減少頻繁拖拉對表層造成的摩擦痕跡。",
      "若有大量沙粒或灰塵，先吸除再擦拭，可降低表面細微刮痕風險。",
      "不建議使用強酸強鹼清潔劑或粗糙菜瓜布，以免影響表面質感。",
    ],
  },
  {
    id: "faq",
    title: "常見問題",
    intro:
      "以下是 FSPC / SPC 地板網站上最適合整理成 FAQ 的題目，也很適合後續再延伸成品牌內容。",
    bullets: [
      "FSPC4.2 和 FSPC5.0 該怎麼選？",
      "有小孩、長輩或寵物的家庭適合哪一個系列？",
      "地板是否可以直接鋪在舊磁磚上？",
      "如果現場地面不平，施工前需要先做哪些處理？",
      "木紋花色實品和螢幕照片會差很多嗎？",
      "地板可以搭配全室風格一起規劃嗎？",
    ],
  },
];

const rightNav = [
  { id: "series", label: "系列精選" },
  ...productSections.map((section) => ({
    id: section.id,
    label: section.title,
  })),
];

export default function ProductInfoPage() {
  return (
    <>
      <PageHero
        eyebrow="Product Guide"
        title="產品資訊"
        description="整理 FSPC 產品目錄中的核心規格、適用空間、施工重點與常見問題，讓客戶在估價前先快速理解系列差異與選購方向。"
      >
        <div className="flex flex-wrap gap-3">
          <Link
            href="/floor-ai-preview"
            className="rounded-full bg-stone px-5 py-3 text-sm font-medium text-white hover:bg-[#5b574f]"
          >
            立即 AI 預覽
          </Link>
          <Link
            href="/curtain-quote"
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-stone ring-1 ring-stone/10 hover:bg-sand"
          >
            前往線上報價
          </Link>
        </div>
      </PageHero>

      <section className="pb-20">
        <div className="container-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            <article id="series" className="card-surface p-7 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">Series</p>
              <h2 className="mt-3 text-3xl font-semibold text-stone">系列精選</h2>
              <p className="mt-4 text-sm leading-8 text-stone/75">
                先從品項理解差異，再往下看規格、施工與保養資訊，會更容易判斷哪個系列適合你的空間。
              </p>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                {seriesHighlights.map((series) => (
                  <div
                    key={series.code}
                    className="overflow-hidden rounded-[28px] border border-stone/10 bg-white/70"
                  >
                    <div className="grid gap-5 p-5">
                      <div className="overflow-hidden rounded-[24px] bg-sand/60">
                        <Image
                          src={series.image}
                          alt={`${series.code} 系列封面`}
                          width={1200}
                          height={720}
                          className="h-52 w-full object-cover"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-2xl font-semibold text-stone">{series.code}</p>
                            <p className="text-sm font-medium text-clay">{series.title}</p>
                          </div>
                          <span className="rounded-full bg-sage/20 px-3 py-1 text-xs font-semibold text-stone">
                            DM 精選
                          </span>
                        </div>

                        <p className="rounded-[18px] bg-sand/60 px-4 py-3 text-sm leading-7 text-stone/80">
                          {series.spec}
                        </p>
                        <p className="text-sm leading-7 text-stone/75">{series.summary}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {series.samples.map((sample) => (
                          <div key={sample.code} className="space-y-2">
                            <div className="overflow-hidden rounded-[18px] border border-stone/10 bg-sand/45">
                              <Image
                                src={sample.image}
                                alt={`${series.code} ${sample.code} 花色`}
                                width={520}
                                height={520}
                                className="aspect-square w-full object-cover"
                              />
                            </div>
                            <p className="text-center text-xs font-semibold tracking-[0.14em] text-stone/70">
                              {sample.code}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {productSections.map((section) => (
              <article key={section.id} id={section.id} className="card-surface p-7 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">
                  Product Info
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-stone">{section.title}</h2>
                <p className="mt-4 text-sm leading-8 text-stone/75">{section.intro}</p>

                {section.cards ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {section.cards.map((card) => (
                      <div key={card.title} className="rounded-[24px] bg-sand/55 p-5">
                        <p className="text-xl font-semibold text-stone">{card.title}</p>
                        <p className="mt-1 text-sm font-medium text-clay">{card.subtitle}</p>
                        <p className="mt-4 text-sm leading-7 text-stone/75">{card.body}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.table ? (
                  <div className="mt-6 overflow-hidden rounded-[24px] border border-stone/10">
                    <table className="min-w-full divide-y divide-stone/10 text-left text-sm">
                      <thead className="bg-sand/65 text-stone">
                        <tr>
                          {section.table[0].map((heading) => (
                            <th key={heading} className="px-4 py-4 font-semibold">
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone/10 bg-white/70 text-stone/80">
                        {section.table.slice(1).map((row) => (
                          <tr key={row[0]}>
                            {row.map((cell) => (
                              <td key={cell} className="px-4 py-4 align-top leading-7">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {section.bullets ? (
                  <div className="mt-6 grid gap-3">
                    {section.bullets.map((item) => (
                      <div
                        key={item}
                        className="rounded-[20px] border border-stone/10 bg-white/65 px-4 py-4 text-sm leading-7 text-stone/80"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card-surface p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">快速導覽</p>
              <div className="mt-4 grid gap-2">
                {rightNav.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="rounded-full bg-white px-4 py-3 text-sm font-medium text-stone ring-1 ring-stone/10 hover:bg-sand"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
