import Hero from "@/components/Hero";
import Card from "@/components/Card";

const sections = [
  {
    title: "ผลงาน",
    description: "รวบรวมโปรเจกต์และผลงานต่างๆ",
    href: "/portfolio",
    icon: "fi fi-rr-palette",
    color: "bg-gray-200/80",
  },
  {
    title: "แกลเลอรี่",
    description: "คลังรูปภาพต่าง ๆ ของบอสสึ",
    href: "/gallery",
    icon: "fi fi-rr-picture",
    color: "bg-gray-200/80",
  },
  {
    title: "สื่อการเรียนรู้",
    description: "แผนการสอน สื่อ และใบงานต่าง ๆ",
    href: "/learning",
    icon: "fi fi-rr-book-open-cover",
    color: "bg-gray-200/80",
  },
  {
    title: "เกมการศึกษา",
    description: "เกมสำหรับการเรียนรู้ต่าง ๆ",
    href: "/games",
    icon: "fi fi-rr-gamepad",
    color: "bg-gray-200/80",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-sky-50 dark:bg-zinc-950">
      <Hero />

      {/* Sections Grid */}
      <section className="py-20 px-4 bg-sky-50 dark:bg-blue-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-start mb-6">
            <span className="text-sky-600 dark:text-sky-400">
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
