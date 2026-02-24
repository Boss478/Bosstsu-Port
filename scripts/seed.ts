import mongoose from 'mongoose';

// Run: npx tsx scripts/seed.ts

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/boss478?authSource=admin';

const PLACEHOLDER_COVER =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDPxqVzul5btXF69mZfyylKkinDyfGlx4haA&s";

const portfolioData = [
  {
    slug: "web-portfolio",
    title: "เว็บไซต์ Portfolio",
    description: "เว็บไซต์ส่วนตัวสำหรับเก็บผลงานและความทรงจำ สร้างด้วย Next.js + TailwindCSS",
    content: `<p>ยินดีต้อนรับสู่เว็บไซต์ Portfolio ของผม! โปรเจกต์นี้เริ่มต้นจากความตั้งใจที่อยากจะมีพื้นที่ส่วนตัวสำหรับรวบรวมผลงาน กิจกรรม และความทรงจำต่าง ๆ ตลอดช่วงเวลาการเรียนครับ</p>
      <p>ผมเลือกใช้ <strong>Next.js 14 (App Router)</strong> ร่วมกับ <strong>TailwindCSS</strong> ในการพัฒนา เพราะต้องการเรียนรู้เทคโนโลยีใหม่ ๆ และชอบความยืดหยุ่นในการปรับแต่งดีไซน์ครับ</p>
      <h3>ฟีเจอร์หลัก</h3>
      <ul>
        <li><strong>Responsive Design:</strong> รองรับการแสดงผลบนทุกอุปกรณ์</li>
        <li><strong>Dark Mode Support:</strong> สลับโหมดมืด-สว่างได้</li>
        <li><strong>Interactive UI:</strong> Hover effects และ Transitions</li>
      </ul>
      <p>หวังว่าทุกคนจะชอบเว็บไซต์นี้นะครับ ^^</p>`,
    tools: ["Next.js", "React", "TailwindCSS", "Framer Motion"],
    gallery: [
      PLACEHOLDER_COVER,
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2940&auto=format&fit=crop",
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["Web", "ผลงาน"],
    date: new Date("2025-12-15"),
  },
  {
    slug: "classroom-app",
    title: "ระบบจัดการห้องเรียน",
    description: "แอปพลิเคชันจัดการห้องเรียนออนไลน์สำหรับครูและนักเรียน",
    content: `<p>ระบบจัดการห้องเรียน (Classroom Management System) ถูกพัฒนาขึ้นเพื่อช่วยคุณครูในการจัดการข้อมูลนักเรียน</p>
      <p>ตัวระบบมี Dashboard สรุปภาพรวมรายวัน รายสัปดาห์ และสามารถ Export ข้อมูลออกมาเป็นไฟล์ Excel ได้</p>`,
    tools: ["Vue.js", "Firebase", "TailwindCSS"],
    gallery: [
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2604&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2946&auto=format&fit=crop",
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["App", "กิจกรรม"],
    date: new Date("2025-11-20"),
  },
  {
    slug: "math-game",
    title: "เกมคณิตศาสตร์",
    description: "เกมฝึกทักษะการคิดเลขสนุก ๆ สำหรับนักเรียนประถม",
    content: `<p>เกมคณิตศาสตร์ "Math Adventure" สร้างขึ้นเพื่อให้เด็ก ๆ สนุกกับการคิดเลข</p>
      <p>ตัวเกมพัฒนาด้วย HTML5 Canvas และ JavaScript เพียว ๆ</p>`,
    tools: ["HTML5 Canvas", "JavaScript", "Pixel Art"],
    gallery: [
      "https://images.unsplash.com/photo-1611996908543-130c1e948526?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1628254747634-c503953ef1f2?q=80&w=2940&auto=format&fit=crop",
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["Game", "ผลงาน"],
    date: new Date("2025-10-05"),
  },
  {
    slug: "art-exhibition",
    title: "นิทรรศการศิลปะ",
    description: "จัดแสดงผลงานศิลปะจากกิจกรรมในโรงเรียน",
    content: `<p>ภาพบรรยากาศงานนิทรรศการศิลปะประจำปีของโรงเรียน ธีม "Color of Life"</p>
      <p>ผมได้รับมอบหมายให้ดูแลส่วนของ Art Gallery Online</p>`,
    tools: ["Photography", "Lightroom"],
    cover: PLACEHOLDER_COVER,
    tags: ["กิจกรรม", "ศิลปะ"],
    date: new Date("2025-09-18"),
  },
  {
    slug: "quiz-system",
    title: "ระบบทำแบบทดสอบ",
    description: "ระบบทำแบบทดสอบออนไลน์พร้อมตรวจคะแนนอัตโนมัติ",
    content: `<p>เว็บแอปพลิเคชันสำหรับทำแบบทดสอบออนไลน์ รองรับโจทย์หลากหลายรูปแบบ</p>
      <p>มีระบบจับเวลา และวิเคราะห์คะแนนหลังทำเสร็จทันที</p>`,
    tools: ["React", "Node.js", "MongoDB", "Express"],
    gallery: [
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2940&auto=format&fit=crop",
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["Web", "ผลงาน"],
    date: new Date("2025-08-22"),
  },
  {
    slug: "science-fair",
    title: "งานวิทยาศาสตร์",
    description: "โครงงานวิทยาศาสตร์ที่เข้าร่วมในงานมหกรรมวิทยาศาสตร์",
    content: `<p>โครงงานเรื่อง "เครื่องกรองอากาศอัจฉริยะ" ใช้เซนเซอร์ตรวจจับฝุ่น PM2.5</p>
      <p>ได้รับรางวัลเหรียญทองระดับภาค</p>`,
    tools: ["IoT", "Arduino", "C++", "3D Printing"],
    gallery: [
      "https://images.unsplash.com/photo-1581092921461-eab62e97a782?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2940&auto=format&fit=crop",
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["กิจกรรม", "วิทยาศาสตร์"],
    date: new Date("2025-07-10"),
  },
  {
    slug: "photo-project",
    title: "โปรเจกต์ถ่ายภาพ",
    description: "ผลงานถ่ายภาพจากกิจกรรมต่าง ๆ และสถานที่ท่องเที่ยว",
    content: `<p>รวมภาพถ่าย Street Photography ที่ผมชอบ</p>
      <p>ใช้กล้อง Sony A6400 กับเลนส์ 35mm f1.8</p>`,
    tools: ["Photography", "Sony A6400", "Lightroom"],
    gallery: [
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2600&auto=format&fit=crop",
    ],
    cover: PLACEHOLDER_COVER,
    tags: ["ผลงาน", "ศิลปะ"],
    date: new Date("2025-06-01"),
  },
  {
    slug: "volunteer-camp",
    title: "ค่ายอาสา",
    description: "กิจกรรมค่ายอาสาพัฒนาชุมชนและสอนน้อง ๆ ในพื้นที่ห่างไกล",
    content: `<p>บันทึกความประทับใจจากค่ายอาสาพัฒนาโรงเรียน ทาสีอาคารเรียนและสอนหนังสือ</p>
      <p>ถึงจะเหนื่อยแต่ก็มีความสุขมาก ^^</p>`,
    tools: ["Volunteering", "Teaching"],
    cover: PLACEHOLDER_COVER,
    tags: ["กิจกรรม"],
    date: new Date("2025-05-14"),
    relatedGalleryId: "volunteer-camp-photos",
  },
];

const galleryData = [
  {
    slug: "school-trip-2025",
    title: "ทริปทัศนศึกษา 2568",
    description: "บันทึกความทรงจำจากทริปทัศนศึกษาประจำปี",
    cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2940&auto=format&fit=crop",
    tags: ["กิจกรรม", "ท่องเที่ยว"],
    date: new Date("2025-11-15"),
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2940&auto=format&fit=crop",
    ],
  },
  {
    slug: "sport-day-2025",
    title: "กีฬาสี 2568",
    description: "กิจกรรมกีฬาสีประจำปี รวมภาพบรรยากาศการแข่งขันและเชียร์ลีดเดอร์",
    cover: "https://images.unsplash.com/photo-1461896836934-bd45ba7b5e12?q=80&w=2940&auto=format&fit=crop",
    tags: ["กิจกรรม", "กีฬา"],
    date: new Date("2025-08-20"),
    photos: [
      "https://images.unsplash.com/photo-1461896836934-bd45ba7b5e12?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1474224017046-182ece80b263?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=2940&auto=format&fit=crop",
    ],
  },
  {
    slug: "street-photography",
    title: "Street Photography",
    description: "ภาพถ่ายสตรีทที่ถ่ายเก็บไว้ระหว่างเดินเล่นในเมือง",
    cover: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2940&auto=format&fit=crop",
    tags: ["ถ่ายภาพ", "ศิลปะ"],
    date: new Date("2025-06-10"),
    photos: [
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1444723121867-7a241cacace9?q=80&w=2940&auto=format&fit=crop",
    ],
  },
  {
    slug: "volunteer-camp-photos",
    title: "ค่ายอาสา 2568",
    description: "ภาพบรรยากาศค่ายอาสาพัฒนาโรงเรียน ทาสีอาคารเรียนและสอนน้อง ๆ",
    cover: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2940&auto=format&fit=crop",
    tags: ["กิจกรรม", "อาสา"],
    date: new Date("2025-05-14"),
    photos: [
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2940&auto=format&fit=crop",
    ],
    relatedPortfolioId: "volunteer-camp",
  },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  // Define schemas inline (to avoid import path issues in scripts)
  const PortfolioSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String },
    gallery: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    cover: { type: String, required: true },
    tags: { type: [String], default: [] },
    date: { type: Date, required: true },
    relatedGalleryId: { type: String },
  }, { timestamps: true });

  const GallerySchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    cover: { type: String, required: true },
    tags: { type: [String], default: [] },
    date: { type: Date, default: Date.now },
    photos: { type: [String], default: [] },
    relatedPortfolioId: { type: String },
  }, { timestamps: true });

  const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema);
  const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', GallerySchema);

  // Clear existing data
  console.log('Clearing existing data...');
  await Portfolio.deleteMany({});
  await Gallery.deleteMany({});

  // Insert portfolio items
  console.log('Seeding portfolio items...');
  const insertedPortfolio = await Portfolio.insertMany(portfolioData);
  console.log(`  ✓ Inserted ${insertedPortfolio.length} portfolio items`);

  // Insert gallery albums
  console.log('Seeding gallery albums...');
  const insertedGallery = await Gallery.insertMany(galleryData);
  console.log(`  ✓ Inserted ${insertedGallery.length} gallery albums`);

  console.log('\n✅ Seed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
