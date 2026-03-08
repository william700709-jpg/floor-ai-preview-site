import Image from "next/image";
import { PageHero } from "@/components/layout/page-hero";
import { featuredProjects } from "@/data/site";

const extraProjects = [
  {
    title: "日系奶油宅",
    style: "超耐磨地板 + 紗簾",
    description: "客餐廳採同色系延伸，讓採光感與開闊感同時放大。",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "沉穩灰綠臥室",
    style: "遮光布簾 + 木質地坪",
    description: "以低飽和綠和柔灰為主調，保留睡眠空間需要的靜謐。",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "柔光親子房",
    style: "調光簾 + SPC 地板",
    description: "兼顧好整理與安全性，保留明亮又不刺眼的白天光線。",
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80"
  }
];

const projectList = [...featuredProjects, ...extraProjects];

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Projects"
        title="案例作品"
        description="先以展示版內容呈現不同風格方向，未來可替換成實際完工照片與專案介紹。"
      />

      <section className="pb-20">
        <div className="container-shell grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projectList.map((project) => (
            <article key={project.title} className="card-surface overflow-hidden">
              <Image
                src={project.image}
                alt={project.title}
                width={900}
                height={720}
                className="h-72 w-full object-cover"
              />
              <div className="p-6">
                <p className="text-sm uppercase tracking-[0.22em] text-clay">
                  {"style" in project ? project.style : project.category}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-stone">{project.title}</h2>
                <p className="mt-3 text-sm leading-7 text-stone/75">{project.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
