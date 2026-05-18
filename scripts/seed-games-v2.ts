import mongoose from 'mongoose';
import Game from '../src/models/Game';

// Run: MONGODB_URI="mongodb://..." npx tsx scripts/seed-games-v2.ts

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required');
  process.exit(1);
}

const gamesData = [
  {
    slug: "alphabet-adventure",
    title: "Alphabet Adventure",
    description: "ผจญภัยโลกตัวอักษร A-Z เรียนรู้การออกเสียงและการเขียนเบื้องต้น",
    category: "English",
    playUrl: "/games/alphabet-adventure",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
    instructions: "คลิกเลือกตัวอักษรที่ถูกต้องเพื่อสะสมคะแนน ผ่านด่านไปให้ถึงระดับท้าทาย!",
    tags: ["Native", "Letters", "G.1"],
    published: true,
  },
  {
    slug: "number-game",
    title: "Number Game",
    description: "ผจญภัยโลกตัวเลข 1-100 ฝึกนับจำนวนและบวกเลขพื้นฐาน",
    category: "English",
    playUrl: "/games/number-game",
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd482195e?q=80&w=2070&auto=format&fit=crop",
    instructions: "เลือกช่วงตัวเลขที่ต้องการฝึกฝน ตอบคำถามให้ถูกต้องเพื่อเลื่อนระดับสู่โหมดท้าทาย",
    tags: ["Native", "Numbers", "G.1"],
    published: true,
  },
  {
    slug: "spellchecker",
    title: "SpellChecker",
    description: "ฝึกสะกดคำภาษาอังกฤษและภาษาไทย ทดสอบทักษะการสะกดคำของคุณ",
    category: "English",
    playUrl: "/games/spellchecker",
    thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2026&auto=format&fit=crop",
    instructions: "เลือกภาษา จากนั้นเลือกโหมดเล่น ตอบว่าคำที่เห็นสะกดถูกหรือผิด",
    tags: ["Native", "Spelling", "Vocabulary"],
    published: true,
  }
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected!');

  console.log('Cleaning up existing English games...');
  await Game.deleteMany({ category: "English" });

  console.log('Seeding G.1 Games...');
  const inserted = await Game.insertMany(gamesData);
  console.log(`  ✓ Inserted ${inserted.length} games`);

  console.log('\n✅ Seed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
