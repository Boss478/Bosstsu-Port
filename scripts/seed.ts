import mongoose from 'mongoose';

// Run: MONGODB_URI="mongodb://..." npx tsx scripts/seed.ts
// Or: npm run seed

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required');
  process.exit(1);
}

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

const gameData = [
  {
    slug: "spellchecker",
    title: "SpellChecker",
    description: "ฝึกทักษะการสะกดคำภาษาไทยและภาษาอังกฤษ ผ่านเกมสนุก ๆ",
    category: "ภาษาอังกฤษ",
    playUrl: "/games/spellchecker",
    thumbnail: PLACEHOLDER_COVER,
    instructions: "เลือกระดับความยาก แล้วพิมพ์คำให้ถูกต้องก่อนหมดเวลา",
    tags: ["ภาษาอังกฤษ", "สะกดคำ", "G.1"],
    published: true,
  },
  {
    slug: "number-game",
    title: "ผจญภัยโลกตัวเลข",
    description: "เรียนรู้ตัวเลขภาษาอังกฤษ 1-100 แสนสนุก พร้อมความท้าทายหลายระดับ",
    category: "คณิตศาสตร์",
    playUrl: "/games/number-game",
    thumbnail: PLACEHOLDER_COVER,
    instructions: "เลือกเลเวลแล้วคลิกเลขที่ถูกต้องตามคำถาม",
    tags: ["คณิตศาสตร์", "ตัวเลข", "G.1"],
    published: true,
  },
  {
    slug: "alphabet-adventure",
    title: "Alphabet Adventure",
    description: "ผจญภัยโลกตัวอักษร เรียนรู้ A-Z ผ่าน 4 เกมสนุก",
    category: "ภาษาอังกฤษ",
    playUrl: "/games/alphabet-adventure",
    thumbnail: PLACEHOLDER_COVER,
    instructions: "Letter Match, Missing Caps, Missing Lowercase, และ Typing Challenge",
    tags: ["ภาษาอังกฤษ", "ตัวอักษร", "G.1"],
    published: true,
  },
  {
    slug: "word-scramble",
    title: "Word Scramble",
    description: "เกมจัดเรียงตัวอักษรภาษาอังกฤษให้ถูกต้อง ฝึกคำศัพท์และความจำ",
    category: "ภาษาอังกฤษ",
    playUrl: "https://wordwall.net/play/word-scramble",
    thumbnail: PLACEHOLDER_COVER,
    instructions: "ลากสลับตัวอักษรให้เรียงกันเป็นคำที่ถูกต้อง",
    tags: ["ภาษาอังกฤษ", "คำศัพท์"],
    published: true,
  },
  {
    slug: "color-match",
    title: "Color Match",
    description: "เกมจับคู่สี ฝึกจำชื่อสีภาษาอังกฤษ สำหรับนักเรียนชั้น G.1",
    category: "ทั่วไป",
    playUrl: "https://wordwall.net/play/color-match",
    thumbnail: PLACEHOLDER_COVER,
    instructions: "จับคู่สีที่เหมือนกันก่อนหมดเวลา",
    tags: ["ทั่วไป", "สี", "G.1"],
    published: true,
  },
  {
    slug: "math-addition",
    title: "บวกเลขสนุก",
    description: "เกมฝึกบวกเลขหลักเดียวสำหรับนักเรียนชั้นป.1",
    category: "คณิตศาสตร์",
    playUrl: "https://wordwall.net/play/math-addition",
    thumbnail: PLACEHOLDER_COVER,
    instructions: "เลือกคำตอบที่ถูกต้องจากโจทย์บวกเลข",
    tags: ["คณิตศาสตร์", "บวกเลข", "G.1"],
    published: true,
  },
  {
    slug: "thai-tone-game",
    title: "เกมวรรณยุกต์ไทย",
    description: "ฝึกทักษะการอ่านวรรณยุกต์ไทยผ่านเกมinteractive",
    category: "ภาษาไทย",
    playUrl: "https://wordwall.net/play/thai-tone",
    thumbnail: PLACEHOLDER_COVER,
    instructions: "ฟังเสียงแล้วเลือกวรรณยุกต์ที่ถูกต้อง",
    tags: ["ภาษาไทย", "วรรณยุกต์"],
    published: true,
  },
  {
    slug: "memory-cards",
    title: "Memory Cards",
    description: "เกมจับคู่การ์ด ฝึกความจำและสมาธิ จับคู่คำศัพท์กับรูปภาพ",
    category: "ทั่วไป",
    playUrl: "https://wordwall.net/play/memory-cards",
    thumbnail: PLACEHOLDER_COVER,
    instructions: "พลิกการ์ดแล้วจับคู่คำศัพท์กับรูปภาพที่ตรงกัน",
    tags: ["ทั่วไป", "ความจำ", "คำศัพท์"],
    published: true,
  },
];

const learningData = [
  {
    title: "แผนการสอนคณิตศาสตร์ เรื่อง การบวกลบ",
    description: "แผนการสอนรายสัปดาห์สำหรับวิชาคณิตศาสตร์ ชั้น ป.1 เรื่องการบวกและการลบ numbers 1-20",
    subject: "คณิตศาสตร์",
    type: "แผนการสอน",
    tags: ["คณิตศาสตร์", "ป.1", "แผนการสอน"],
    published: true,
    content: `<h3>วัตถุประสงค์</h3>
      <ul>
        <li>นักเรียนสามารถบวกและลบ numbers 1-20 ได้ถูกต้อง</li>
        <li>นักเรียนสามารถนำความรู้ไปใช้ในชีวิตประจำวันได้</li>
      </ul>
      <h3>กิจกรรม</h3>
      <ol>
        <li>กิจกรรมเริ่มบทเรียน: นับ number together</li>
        <li>กิจกรรมกลางบทเรียน: ฝึกทำโจทย์บวกลบ</li>
        <li>กิจกรรมส่งท้าย: เล่นเกมคณิตศาสตร์</li>
      </ol>`,
  },
  {
    title: "สื่อการสอนภาษาไทย วรรณยุกต์ 5 เสียง",
    description: "สื่อการสอนภาษาไทย เรื่องวรรณยุกต์ 5 เสียง พร้อมแบบฝึกหัด",
    subject: "ภาษาไทย",
    type: "สื่อการสอน",
    tags: ["ภาษาไทย", "วรรณยุกต์", "สื่อการสอน"],
    published: true,
    content: `<h3>วรรณยุกต์ 5 เสียง</h3>
      <ul>
        <li><strong>สามัญ:</strong> มา กา ซา รา วา</li>
        <li><strong>เอก:</strong> มา กา ซา รา วา</li>
        <li><strong>โท:</strong> มา กา ซา รา วา</li>
        <li><strong>ตรี:</strong> มา กา ซา รา วา</li>
        <li><strong>จัตวา:</strong> มา กา ซา รา วา</li>
      </ul>`,
  },
  {
    title: "แบบฝึกหัดคำศัพท์ภาษาอังกฤษ หน่วยที่ 1-3",
    description: "รวมแบบฝึกหัดคำศัพท์ภาษาอังกฤษ สำหรับนักเรียนชั้น ป.1",
    subject: "ภาษาอังกฤษ",
    type: "ใบงาน",
    tags: ["ภาษาอังกฤษ", "คำศัพท์", "ใบงาน"],
    published: true,
    content: `<h3>Vocabulary Worksheet</h3>
      <p>จับคู่รูปกับคำศัพท์ที่ถูกต้อง</p>
      <ul>
        <li>Apple - 🍎</li>
        <li>Banana - 🍌</li>
        <li>Cat - 🐱</li>
        <li>Dog - 🐶</li>
      </ul>`,
  },
  {
    title: "Video สอนเขียนตัวอักษร A-Z",
    description: "วิดีโอสอนเขียนตัวอักษรภาษาอังกฤษ A-Z สำหรับนักเรียนชั้น G.1",
    subject: "ภาษาอังกฤษ",
    type: "วิดีโอ",
    tags: ["ภาษาอังกฤษ", "ตัวอักษร", "วิดีโอ"],
    published: true,
    youtubeId: "dQw4w9WgXcQ",
    link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    title: "Canva: บัตรคำศัพท์ภาษาอังกฤษ",
    description: "Flashcards ภาษาอังกฤษ-ไทย จำนวน 50 คำ สำหรับพิมพ์เป็นบัตรคำใช้ในห้องเรียน",
    subject: "ภาษาอังกฤษ",
    type: "สื่อการสอน",
    tags: ["ภาษาอังกฤษ", "Flashcards", "Canva"],
    published: true,
    canvaEmbed: "https://www.canva.com/design/example",
  },
  {
    title: "ใบงานวิทยาศาสตร์ เรื่อง วงจรชีวิต",
    description: "ใบงานวิทยาศาสตร์สำหรับนักเรียน ป.1 เรื่องวงจรชีวิตของผีเสื้อ",
    subject: "วิทยาศาสตร์",
    type: "ใบงาน",
    tags: ["วิทยาศาสตร์", "วงจรชีวิต", "ใบงาน"],
    published: true,
    content: `<h3>วงจรชีวิตของผีเสื้อ</h3>
      <ol>
        <li><strong>ไข่ (Egg):</strong> ตัวเมียวางไข่บนใบไม้</li>
        <li><strong>หนอน (Larva):</strong> ไข่ฟักเป็นหนอน กินใบไม้เป็นอาหาร</li>
        <li><strong>ดักแด้ (Pupa):</strong> หนอนสร้างรังหุ้มตัว</li>
        <li><strong>ผีเสื้อ (Adult):</strong> ผีเสื้อออกจากดักแด้</li>
      </ol>`,
  },
  {
    title: "แผนการสอนสังคมศึกษา เรื่อง ชุมชนของเรา",
    description: "แผนการสอนสังคมศึกษาสำหรับนักเรียน ป.1 เรื่องหน้าที่พลเมืองและชุมชน",
    subject: "สังคมศึกษา",
    type: "แผนการสอน",
    tags: ["สังคมศึกษา", "ป.1", "แผนการสอน"],
    published: true,
    content: `<h3>ชุมชนของเรา</h3>
      <p>เรียนรู้เกี่ยวกับบุคคลในชุมชน อาชีพ และสถานที่สำคัญ</p>
      <h3>กิจกรรม</h3>
      <ul>
        <li>ระบายสีแผนที่ชุมชน</li>
        <li>สัมภาษณ์ผู้ใหญ่บ้าน</li>
        <li>ทำบอร์ดแสดงอาชีพในชุมชน</li>
      </ul>`,
  },
  {
    title: "แบบฝึกหัดคณิตศาสตร์ การวัด",
    description: "ใบงานฝึกอ่านเข็มนาฬิกาและวัดอุณหภูมิ สำหรับนักเรียน ป.1",
    subject: "คณิตศาสตร์",
    type: "ใบงาน",
    tags: ["คณิตศาสตร์", "การวัด", "ใบงาน"],
    published: true,
    content: `<h3>ฝึกอ่านนาฬิกา</h3>
      <p>บอกเวลาระบุชั่วโมงและนาทีจากภาพนาฬิกา</p>
      <h3>ฝึกวัดอุณหภูมิ</h3>
      <p>อ่านค่าจากเทอร์โมมิเตอร์</p>`,
  },
];

const toolSessionData = [
  {
    sessionCode: "POLL2025",
    type: "poll",
    title: "โพลความคิดเห็น สัปดาห์ที่ 1",
    config: {
      prompt: "วิชาที่ชอบมากที่สุดคือวิชาอะไร?",
      allowAnonymous: true,
      maxSubmissions: 1,
      pollMode: "mcq",
      allowCustomChoices: false,
      questions: [{
        question: "วิชาที่ชอบมากที่สุด?",
        options: ["คณิตศาสตร์", "ภาษาไทย", "ภาษาอังกฤษ", "วิทยาศาสตร์", "ศิลปะ"],
      }],
    },
    requireStudentName: false,
    isActive: false,
    startedAt: new Date("2025-06-01"),
    endedAt: new Date("2025-06-01"),
    participantCount: 25,
    responseCount: 25,
    currentStep: -1,
    lastActiveStep: -1,
    allowStudentNavigation: false,
  },
  {
    sessionCode: "QA001",
    type: "qa_board",
    title: "กระดานถาม-ตอบ วิชาวิทยาศาสตร์",
    config: {
      prompt: "มีคำถามเกี่ยวกับบทเรียนวงจรชีวิต ถามมาได้เลย!",
      allowAnonymous: true,
      maxSubmissions: 5,
    },
    requireStudentName: false,
    isActive: false,
    startedAt: new Date("2025-05-20"),
    endedAt: new Date("2025-05-20"),
    participantCount: 18,
    responseCount: 42,
    currentStep: -1,
    lastActiveStep: -1,
    allowStudentNavigation: false,
  },
  {
    sessionCode: "ASSIGN01",
    type: "assignment",
    title: "ใบงาน ป.1 บทที่ 3 - ส่งรูปภาพ",
    config: {
      prompt: "ถ่ายรูปสัตว์ที่พบในชุมชนของคุณ 1 รูป พร้อมบอกชื่อสัตว์",
      allowAnonymous: false,
      maxSubmissions: 1,
      allowFileUpload: true,
      maxFileSize: 5242880,
    },
    requireStudentName: true,
    isActive: false,
    startedAt: new Date("2025-04-15"),
    endedAt: new Date("2025-04-20"),
    participantCount: 30,
    responseCount: 28,
    currentStep: -1,
    lastActiveStep: -1,
    allowStudentNavigation: false,
  },
  {
    sessionCode: "EXITWK5",
    type: "exit_ticket",
    title: "Exit Ticket สัปดาห์ที่ 5",
    config: {
      prompt: "วันนี้เรียนอะไรไปบ้าง? สิ่งที่ชอบที่สุดคืออะไร?",
      allowAnonymous: false,
      maxSubmissions: 1,
    },
    requireStudentName: true,
    isActive: false,
    startedAt: new Date("2025-06-05"),
    endedAt: new Date("2025-06-05"),
    participantCount: 28,
    responseCount: 26,
    currentStep: -1,
    lastActiveStep: -1,
    allowStudentNavigation: false,
  },
  {
    sessionCode: "QUIZ01",
    type: "quiz",
    title: "แบบทดสอบบทที่ 2 - คณิตศาสตร์",
    config: {
      prompt: "ทำแบบทดสอบคณิตศาสตร์ 10 ข้อ",
      allowAnonymous: false,
      maxSubmissions: 1,
      questions: [
        { question: "2 + 3 = ?", options: ["4", "5", "6", "7"], correctAnswer: 1 },
        { question: "10 - 4 = ?", options: ["5", "6", "7", "8"], correctAnswer: 1 },
        { question: "3 + 7 = ?", options: ["8", "9", "10", "11"], correctAnswer: 2 },
        { question: "15 - 8 = ?", options: ["5", "6", "7", "8"], correctAnswer: 2 },
        { question: "6 + 6 = ?", options: ["10", "11", "12", "13"], correctAnswer: 2 },
      ],
    },
    requireStudentName: true,
    isActive: false,
    startedAt: new Date("2025-06-10"),
    endedAt: new Date("2025-06-10"),
    participantCount: 30,
    responseCount: 29,
    currentStep: -1,
    lastActiveStep: -1,
    allowStudentNavigation: false,
  },
  {
    sessionCode: "PADLET1",
    type: "padlet",
    title: "Padlet - ภาพบรรยากาศวันเด็ก",
    config: {
      prompt: "แชร์ภาพบรรยากาศวันเด็กแห่งชาติที่.school",
      allowAnonymous: false,
      maxSubmissions: 3,
      allowFileUpload: true,
      maxFileSize: 10485760,
    },
    requireStudentName: true,
    isActive: false,
    startedAt: new Date("2025-01-10"),
    endedAt: new Date("2025-01-12"),
    participantCount: 20,
    responseCount: 35,
    currentStep: -1,
    lastActiveStep: -1,
    allowStudentNavigation: false,
  },
  {
    sessionCode: "POLLWK8",
    type: "poll",
    title: "โพลท้ายคาบ - สิ่งที่อยากเรียนเพิ่ม",
    config: {
      prompt: "อยากเรียนรู้เพิ่มเติมเรื่องอะไร?",
      allowAnonymous: true,
      maxSubmissions: 1,
      pollMode: "wordcloud",
    },
    requireStudentName: false,
    isActive: true,
    startedAt: new Date("2025-06-20"),
    participantCount: 0,
    responseCount: 0,
    currentStep: -1,
    lastActiveStep: -1,
    allowStudentNavigation: false,
  },
];

const toolStepTemplateData = [
  {
    type: "poll",
    title: "โพลเลือกตอบ",
    config: {
      prompt: "คำถามของคุณ?",
      allowAnonymous: true,
      maxSubmissions: 1,
      pollMode: "mcq",
      allowCustomChoices: false,
      questions: [{
        question: "",
        options: ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
      }],
    },
  },
  {
    type: "qa_board",
    title: "กระดานถาม-ตอบ",
    config: {
      prompt: "พิมพ์คำถามของคุณที่นี่",
      allowAnonymous: true,
      maxSubmissions: 5,
    },
  },
  {
    type: "assignment",
    title: "ใบงาน ส่งรูปภาพ",
    config: {
      prompt: "ถ่ายรูปสิ่งที่พบ แล้วอัปโหลด",
      allowAnonymous: false,
      maxSubmissions: 1,
      allowFileUpload: true,
      maxFileSize: 5242880,
    },
  },
  {
    type: "quiz",
    title: "แบบทดสอบ เลือกตอบ",
    config: {
      prompt: "ทำแบบทดสอบ",
      allowAnonymous: false,
      maxSubmissions: 1,
      questions: [],
    },
  },
  {
    type: "exit_ticket",
    title: "Exit Ticket ท้ายคาบ",
    config: {
      prompt: "วันนี้เรียนรู้อะไรบ้าง?",
      allowAnonymous: false,
      maxSubmissions: 1,
    },
  },
];

const tagData = [
  { name: "Web", category: "portfolio" },
  { name: "ผลงาน", category: "portfolio" },
  { name: "App", category: "portfolio" },
  { name: "Game", category: "portfolio" },
  { name: "กิจกรรม", category: "learning" },
];

const stockHoldingData = [
  { symbol: 'TSM',   shares: 0.0240648, avgCost: 327.4490 },
  { symbol: 'GOOGL', shares: 0.0231279, avgCost: 338.5523 },
  { symbol: 'NVDA',  shares: 0.0300421, avgCost: 203.0486 },
  { symbol: 'AAPL',  shares: 0.0112620, avgCost: 271.7091 },
  { symbol: 'MSFT',  shares: 0.0060125, avgCost: 508.94 },
  { symbol: 'META',  shares: 0.0025555, avgCost: 618.28 },
  { symbol: 'AMD',   shares: 0.0030919, avgCost: 419.60 },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected!\n');

  // Define schemas inline (to avoid import path issues in scripts)
  const PortfolioSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String },
    gallery: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    cover: { type: String },
    tags: { type: [String], default: [] },
    date: { type: Date, required: true },
    published: { type: Boolean, default: true },
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

  const GameSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    playUrl: { type: String, required: true },
    thumbnail: { type: String },
    instructions: { type: String },
    htmlContent: { type: String },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true },
  }, { timestamps: true });

  const LearningSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    subject: { type: String, required: true },
    type: { type: String, required: true },
    link: { type: String },
    thumbnail: { type: String },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true },
    content: { type: String },
    embedCode: { type: String },
    fileUrl: { type: String },
    youtubeId: { type: String },
    canvaEmbed: { type: String },
  }, { timestamps: true });

  const ToolSessionSchema = new mongoose.Schema({
    sessionCode: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['padlet', 'poll', 'assignment', 'qa_board', 'quiz', 'exit_ticket'] },
    title: { type: String, required: true },
    config: {
      prompt: { type: String },
      allowAnonymous: { type: Boolean, default: false },
      maxSubmissions: { type: Number, default: 1 },
      allowFileUpload: { type: Boolean, default: false },
      maxFileSize: { type: Number, default: 10 * 1024 * 1024 },
      pollMode: { type: String, enum: ['mcq', 'wordcloud'], default: 'mcq' },
      allowCustomChoices: { type: Boolean, default: false },
      questions: [{
        question: { type: String },
        options: [String],
        correctAnswer: { type: Number },
      }],
    },
    requireStudentName: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    participantCount: { type: Number, default: 0 },
    responseCount: { type: Number, default: 0 },
    steps: [{
      type: { type: String, required: true },
      title: { type: String, required: true },
      config: { type: mongoose.Schema.Types.Mixed },
    }],
    currentStep: { type: Number, default: -1 },
    lastActiveStep: { type: Number, default: -1 },
    allowStudentNavigation: { type: Boolean, default: false },
  }, { timestamps: true });

  const ToolStepTemplateSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['padlet', 'poll', 'assignment', 'qa_board', 'quiz', 'exit_ticket'] },
    title: { type: String, required: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
  }, { timestamps: true });

  const TagSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
  }, { timestamps: true });

  const StockHoldingSchema = new mongoose.Schema({
    symbol: { type: String, required: true, unique: true, uppercase: true },
    shares: { type: Number, required: true },
    avgCost: { type: Number, required: true },
    manualPrice: { type: Number },
  }, { timestamps: true });

  // Use existing models or create new ones
  const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema);
  const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', GallerySchema);
  const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);
  const Learning = mongoose.models.Learning || mongoose.model('Learning', LearningSchema);
  const ToolSession = mongoose.models.ToolSession || mongoose.model('ToolSession', ToolSessionSchema);
  const ToolStepTemplate = mongoose.models.ToolStepTemplate || mongoose.model('ToolStepTemplate', ToolStepTemplateSchema);
  const Tag = mongoose.models.Tag || mongoose.model('Tag', TagSchema);
  const StockHolding = mongoose.models.StockHolding || mongoose.model('StockHolding', StockHoldingSchema);

  // Clear existing data
  console.log('Clearing existing data...');
  await Portfolio.deleteMany({});
  await Gallery.deleteMany({});
  await Game.deleteMany({});
  await Learning.deleteMany({});
  await ToolSession.deleteMany({});
  await ToolStepTemplate.deleteMany({});
  await Tag.deleteMany({});
  await StockHolding.deleteMany({});

  // Seed portfolio items
  console.log('Seeding portfolio items...');
  const insertedPortfolio = await Portfolio.insertMany(portfolioData);
  console.log(`  ✓ Inserted ${insertedPortfolio.length} portfolio items`);

  // Seed gallery albums
  console.log('Seeding gallery albums...');
  const insertedGallery = await Gallery.insertMany(galleryData);
  console.log(`  ✓ Inserted ${insertedGallery.length} gallery albums`);

  // Seed games
  console.log('Seeding games...');
  const insertedGames = await Game.insertMany(gameData);
  console.log(`  ✓ Inserted ${insertedGames.length} games`);

  // Seed learning resources
  console.log('Seeding learning resources...');
  const insertedLearning = await Learning.insertMany(learningData);
  console.log(`  ✓ Inserted ${insertedLearning.length} learning resources`);

  // Seed tool sessions
  console.log('Seeding tool sessions...');
  const insertedSessions = await ToolSession.insertMany(toolSessionData);
  console.log(`  ✓ Inserted ${insertedSessions.length} tool sessions`);

  // Seed tool step templates
  console.log('Seeding tool step templates...');
  const insertedTemplates = await ToolStepTemplate.insertMany(toolStepTemplateData);
  console.log(`  ✓ Inserted ${insertedTemplates.length} tool step templates`);

  // Seed tags
  console.log('Seeding tags...');
  const insertedTags = await Tag.insertMany(tagData);
  console.log(`  ✓ Inserted ${insertedTags.length} tags`);

  // Seed stock holdings
  console.log('Seeding stock holdings...');
  await StockHolding.insertMany(stockHoldingData);
  console.log(`  ✓ Inserted ${stockHoldingData.length} stock holdings`);

  console.log('\n✅ Seed complete!');
  console.log(`   Portfolios: ${insertedPortfolio.length}`);
  console.log(`   Galleries: ${insertedGallery.length}`);
  console.log(`   Games: ${insertedGames.length}`);
  console.log(`   Learning: ${insertedLearning.length}`);
  console.log(`   Tool Sessions: ${insertedSessions.length}`);
  console.log(`   Tool Step Templates: ${insertedTemplates.length}`);
  console.log(`   Tags: ${insertedTags.length}`);
  console.log(`   Stock Holdings: ${stockHoldingData.length}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
