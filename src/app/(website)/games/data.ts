export const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2942&auto=format&fit=crop";

export interface GameItem {
  id: string;
  title: string;
  description: string;
  genre: string;
  cover: string;
  link: string;
  date: string;
  players: string; // e.g., "1 Player", "2 Players"
}

export const gameItems: GameItem[] = [
  {
    id: "game-001",
    title: "Math Adventure",
    description: "เกมผจญภัยในโลกคณิตศาสตร์ ช่วยน้อง ๆ ฝึกคิดเลขผ่านด่านต่าง ๆ",
    genre: "Educational / RPG",
    cover: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?q=80&w=2940&auto=format&fit=crop",
    link: "#",
    date: "2025-10-05",
    players: "1 Player",
  },
  {
    id: "game-002",
    title: "English Word Puzzle",
    description: "เกมต่อคำศัพท์ภาษาอังกฤษ ประลองปัญญาและความจำ",
    genre: "Puzzle",
    cover: "https://images.unsplash.com/photo-1629814249584-bd4d53cf0e7d?q=80&w=2836&auto=format&fit=crop",
    link: "#",
    date: "2025-09-12",
    players: "1-2 Players",
  },
  {
    id: "game-003",
    title: "History Quiz Challenge",
    description: "เกมตอบคำถามประวัติศาสตร์ไทย ท้าทายความรู้รอบตัว",
    genre: "Quiz",
    cover: "https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?q=80&w=2835&auto=format&fit=crop",
    link: "#",
    date: "2025-08-20",
    players: "Multiplayer",
  },
  {
    id: "game-004",
    title: "Science Lab Escape",
    description: "เกมหาทางออกจากห้องทดลองวิทยาศาสตร์โดยใช้ความรู้ฟิสิกส์และเคมี",
    genre: "Puzzle / Adventure",
    cover: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2940&auto=format&fit=crop",
    link: "#",
    date: "2025-07-15",
    players: "1 Player",
  },
];

export const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
