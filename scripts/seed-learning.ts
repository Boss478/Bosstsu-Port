import mongoose from 'mongoose';
import Learning from '../src/models/Learning';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/boss478?authSource=admin';

const learningData = [
  {
    title: "Python Compiler",
    description: "โปรแกรมแก้ไขและรันโค้ด Python ออนไลน์ เรียนรู้การเขียนโปรแกรมผ่านเว็บเบราว์เซอร์ รองรับ 3 โหมดการเรียนรู้",
    subject: "Technology",
    type: "Interactive",
    link: "/resources/python-compiler",
    thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2069&auto=format&fit=crop",
    tags: ["Native", "Programming", "Python"],
    published: true,
  }
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  console.log('Clearing existing learning resources...');
  await Learning.deleteMany({});

  console.log('Seeding native resources...');
  const inserted = await Learning.insertMany(learningData);
  console.log(`  ✓ Inserted ${inserted.length} resources`);

  console.log('\n✅ Seed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});