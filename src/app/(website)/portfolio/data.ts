export const PLACEHOLDER_COVER =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDPxqVzul5btXF69mZfyylKkinDyfGlx4haA&s";

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  content: string;
  gallery?: string[];
  tools?: string[];
  cover: string;
  tags: string[];
  date: string;
  relatedGalleryId?: string;
}

export const portfolioItems: PortfolioItem[] = [

  {
    id: "web-portfolio",
    title: "เว็บไซต์ Portfolio",
    description:
      "เว็บไซต์ส่วนตัวสำหรับเก็บผลงานและความทรงจำ สร้างด้วย Next.js + TailwindCSS",
    content: `
      <p>ยินดีต้อนรับสู่เว็บไซต์ Portfolio ของผม! โปรเจกต์นี้เริ่มต้นจากความตั้งใจที่อยากจะมีพื้นที่ส่วนตัวสำหรับรวบรวมผลงาน กิจกรรม และความทรงจำต่าง ๆ ตลอดช่วงเวลาการเรียนครับ</p>
      <p>ผมเลือกใช้ <strong>Next.js 14 (App Router)</strong> ร่วมกับ <strong>TailwindCSS</strong> ในการพัฒนา เพราะต้องการเรียนรู้เทคโนโลยีใหม่ ๆ และชอบความยืดหยุ่นในการปรับแต่งดีไซน์ครับ ธีมหลักของเว็บเน้นความสบายตา (Sky Blue) และรองรับ Dark Mode เพื่อการใช้งานที่ตอบโจทย์ทุกคน</p>
      <h3>ฟีเจอร์หลัก</h3>
      <ul>
        <li><strong>Responsive Design:</strong> รองรับการแสดงผลบนทุกอุปกรณ์ ตั้งแต่มือถือไปจนถึงเดสก์ท็อป</li>
        <li><strong>Dark Mode Support:</strong> สลับโหมดมืด-สว่างได้ตามต้องการ</li>
        <li><strong>Interactive UI:</strong> มีลูกเล่นเล็ก ๆ น้อย ๆ เช่น Hover effects และ Transitions เพื่อให้เว็บดูมีชีวิตชีวา</li>
      </ul>
      <p>หวังว่าทุกคนจะชอบเว็บไซต์นี้นะครับ ถ้ามีข้อเสนอแนะอะไรสามารถบอกได้เลยครับ ^^</p>
    `,
    tools: ["Next.js", "React", "TailwindCSS", "Framer Motion"],
    gallery: [
      PLACEHOLDER_COVER,
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2940&auto=format&fit=crop"
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["Web", "ผลงาน"],
    date: "2025-12-15",
  },
  {
    id: "classroom-app",
    title: "ระบบจัดการห้องเรียน",
    description: "แอปพลิเคชันจัดการห้องเรียนออนไลน์สำหรับครูและนักเรียน",
    content: `
      <p>ระบบจัดการห้องเรียน (Classroom Management System) ถูกพัฒนาขึ้นเพื่อช่วยคุณครูในการจัดการข้อมูลนักเรียน การเช็กชื่อ และการเก็บคะแนนได้สะดวกยิ่งขึ้นครับ</p>
      <p>ตัวระบบมี Dashboard สรุปภาพรวมรายวัน รายสัปดาห์ และสามารถ Export ข้อมูลออกมาเป็นไฟล์ Excel ได้ด้วยครับ</p>
    `,
    tools: ["Vue.js", "Firebase", "TailwindCSS"],
    gallery: [
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2604&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2946&auto=format&fit=crop"
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["App", "กิจกรรม"],
    date: "2025-11-20",
  },
  {
    id: "math-game",
    title: "เกมคณิตศาสตร์",
    description: "เกมฝึกทักษะการคิดเลขสนุก ๆ สำหรับนักเรียนประถม",
    content: `
      <p>เกมคณิตศาสตร์ "Math Adventure" สร้างขึ้นเพื่อให้เด็ก ๆ สนุกกับการคิดเลขผ่านการผจญภัยในด่านต่าง ๆ ครับ</p>
      <p>ตัวเกมพัฒนาด้วย HTML5 Canvas และ JavaScript เพียว ๆ ไม่ได้ใช้ Game Engine เพื่อเป็นการฝึกพื้นฐานการเขียนโปรแกรมครับ</p>
    `,
    tools: ["HTML5 Canvas", "JavaScript", "Pixel Art"],
    gallery: [
         "https://images.unsplash.com/photo-1611996908543-130c1e948526?q=80&w=2940&auto=format&fit=crop",
         "https://images.unsplash.com/photo-1628254747634-c503953ef1f2?q=80&w=2940&auto=format&fit=crop"
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["Game", "ผลงาน"],
    date: "2025-10-05",
  },
  {
    id: "art-exhibition",
    title: "นิทรรศการศิลปะ",
    description: "จัดแสดงผลงานศิลปะจากกิจกรรมในโรงเรียน",
    content: `
      <p>ภาพบรรยากาศงานนิทรรศการศิลปะประจำปีของโรงเรียนครับ ปีนี้มาในธีม "Color of Life" ที่ให้นักเรียนได้แสดงออกถึงสีสันในชีวิตผ่านงานศิลปะหลากหลายรูปแบบ</p>
      <p>ผมได้รับมอบหมายให้ดูแลส่วนของ Art Gallery Online ที่รวบรวมภาพผลงานมาแสดงบนเว็บไซต์ด้วยครับ</p>
    `,
    tools: ["Photography", "Lightroom"],
    cover: PLACEHOLDER_COVER,
    tags: ["กิจกรรม", "ศิลปะ"],
    date: "2025-09-18",
  },
  {
    id: "quiz-system",
    title: "ระบบทำแบบทดสอบ",
    description: "ระบบทำแบบทดสอบออนไลน์พร้อมตรวจคะแนนอัตโนมัติ",
    content: `
      <p>เว็บแอปพลิเคชันสำหรับทำแบบทดสอบออนไลน์ รองรับโจทย์หลากหลายรูปแบบ ทั้งปรนัย อัตนัย และจับคู่</p>
      <p>มีระบบจับเวลา และวิเคราะห์คะแนนหลังทำเสร็จทันที ช่วยให้ผู้สอบรู้จุดแข็งจุดอ่อนของตัวเองครับ</p>
    `,
    tools: ["React", "Node.js", "MongoDB", "Express"],
    gallery: [
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2940&auto=format&fit=crop"
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["Web", "ผลงาน"],
    date: "2025-08-22",
  },
  {
    id: "science-fair",
    title: "งานวิทยาศาสตร์",
    description: "โครงงานวิทยาศาสตร์ที่เข้าร่วมในงานมหกรรมวิทยาศาสตร์",
    content: `
      <p>โครงงานเรื่อง "เครื่องกรองอากาศอัจฉริยะ" ที่ผมและเพื่อน ๆ ช่วยกันประดิษฐ์ขึ้นครับ ใช้เซนเซอร์ตรวจจับฝุ่น PM2.5 และสั่งงงานผ่านแอปพลิเคชันได้</p>
      <p>ได้รับรางวัลเหรียญทองระดับภาคครับ ดีใจมาก ๆ ที่ความทุ่มเทของเราเห็นผล</p>
    `,
    tools: ["IoT", "Arduino", "C++", "3D Printing"],
    gallery: [
      "https://images.unsplash.com/photo-1581092921461-eab62e97a782?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2940&auto=format&fit=crop"
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["กิจกรรม", "วิทยาศาสตร์"],
    date: "2025-07-10",
  },
  {
    id: "photo-project",
    title: "โปรเจกต์ถ่ายภาพ",
    description: "ผลงานถ่ายภาพจากกิจกรรมต่าง ๆ และสถานที่ท่องเที่ยว",
    content: `
      <p>รวมภาพถ่าย Street Photography ที่ผมชอบครับ เน้นการจับจังหวะและอารมณ์ของผู้คนในเมือง</p>
      <p>ใช้กล้อง Sony A6400 กับเลนส์ 35mm f1.8 ครับ ชอบระยะนี้มากเพราะมันใกล้เคียงกับสายตาคนเราดี</p>
    `,
    tools: ["Photography", "Sony A6400", "Lightroom"],
    gallery: [
         "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2940&auto=format&fit=crop",
         "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2600&auto=format&fit=crop"
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["ผลงาน", "ศิลปะ"],
    date: "2025-06-01",
  },
  {
    id: "volunteer-camp",
    title: "ค่ายอาสา",
    description: "กิจกรรมค่ายอาสาพัฒนาชุมชนและสอนน้อง ๆ ในพื้นที่ห่างไกล",
    content: `
      <p>บันทึกความประทับใจจค่ายอาสาพัฒนาโรงเรียนครับ พวกเราไปช่วยกันทาสีอาคารเรียนและสอนหนังสือให้น้อง ๆ</p>
      <p>ถึงจะเหนื่อยแต่ก็มีความสุขมากครับ ได้เห็นรอยยิ้มของน้อง ๆ แล้วหายเหนื่อยเลย ^^</p>
    `,
    tools: ["Volunteering", "Teaching"],
    cover: PLACEHOLDER_COVER,
    tags: ["กิจกรรม"],
    date: "2025-05-14",
    relatedGalleryId: "volunteer-camp-photos",
  },
];

export const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];


export function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const portfolioItemsSortedByDateDesc = [...portfolioItems].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

export function getRecentPortfolioItems(excludeId: string, limit = 5) {
  return portfolioItemsSortedByDateDesc
    .filter((p) => p.id !== excludeId)
    .slice(0, limit);
}

export function getRelatedByTags(currentItem: PortfolioItem, limit = 3) {
  return portfolioItemsSortedByDateDesc
    .filter((p) => p.id !== currentItem.id)
    .map((p) => ({
      ...p,
      score: p.tags.filter((t) => currentItem.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getOlderAndNewerItem(currentId: string) {
  const idx = portfolioItemsSortedByDateDesc.findIndex((p) => p.id === currentId);
  return {
    newerItem: portfolioItemsSortedByDateDesc[idx - 1] ?? null,
    olderItem: portfolioItemsSortedByDateDesc[idx + 1] ?? null,
  };
}
