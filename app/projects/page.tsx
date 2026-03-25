import Image from "next/image";
import { PageHero } from "@/components/layout/page-hero";
import { featuredProjects } from "@/data/site";

const extraProjects = [
  {
    title: "日系奶油宅",
    style: "SPC 地板 + 紗簾",
    description: "以淺色地坪與透光紗簾帶出奶油系空間感，整體看起來更輕盈。",
    image: "/images/projects/project-4-cream-home.png"
  },
  {
    title: "沉穩灰綠臥室",
    style: "遮光布簾 + 木質地坪",
    description: "灰綠主牆搭配遮光布簾與木紋地板，讓臥室更有包覆感與休息氛圍。",
    image: "/images/projects/project-5-gray-bedroom.png"
  },
  {
    title: "柔光親子房",
    style: "調光簾 + SPC 地板",
    description: "調光簾方便依時段調整採光，搭配 SPC 地板也更適合日常清潔整理。",
    image: "/images/projects/project-6-kids-room.png"
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
                width={874}
                height={520}
                className="aspect-[874/520] w-full object-cover"
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
