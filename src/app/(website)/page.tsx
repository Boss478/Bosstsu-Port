import Hero from "@/components/Hero";
import Card from "@/components/Card";

const sections = [
  {
    title: "ผลงาน",
    description: "รวบรวมโปรเจกต์และผลงานต่างๆ",
    href: "/portfolio",
    icon: "fi fi-sr-palette",
    color: "bg-blue-500",
  },
  {
    title: "แกลเลอรี่",
    description: "คลังรูปภาพต่าง ๆ ของบอสสึ",
    href: "/gallery",
    icon: "fi fi-sr-picture",
    color: "bg-blue-500",
  },
  {
    title: "สื่อการเรียนรู้",
    description: "แผนการสอน สื่อ และใบงานต่าง ๆ",
    href: "/resources",
    icon: "fi fi-sr-book-open-cover",
    color: "bg-blue-500",
  },
  {
    title: "เกมการศึกษา",
    description: "เกมสำหรับการเรียนรู้ต่าง ๆ",
    href: "/games",
    icon: "fi fi-sr-gamepad",
    color: "bg-blue-500",
  },
];

export default function Home() {
  return (
    <div id="home-page" className="min-h-screen bg-blue-50 dark:bg-slate-950">
      <Hero />

      <section id="home-categories" className="py-20 px-4 bg-blue-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-start mb-6">
            <span className="text-blue-600 dark:text-blue-400">
              หมวดหมู่
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <Card key={section.href} {...section} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
