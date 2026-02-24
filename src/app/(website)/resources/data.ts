export const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2946&auto=format&fit=crop";

export type ResourceType = "Sheet" | "Slide" | "VDO" | "Other";

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  cover: string;
  link: string;
  date: string;
  author?: string;
}

export const resourceItems: ResourceItem[] = [
  {
    id: "res-001",
    title: "สรุปสูตรคณิตศาสตร์ ม.ปลาย",
    description: "รวมสูตรคณิตศาสตร์ที่สำคัญสำหรับเตรียมสอบ A-Level และ Netsat",
    type: "Sheet",
    cover: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2940&auto=format&fit=crop",
    link: "#",
    date: "2025-12-10",
    author: "Boss478",
  },
  {
    id: "res-002",
    title: "Slide การนำเสนอโครงงานวิทยาศาสตร์",
    description: "ไฟล์นำเสนอโครงงานเรื่องเครื่องกรองอากาศอัจฉริยะ (Canva Link)",
    type: "Slide",
    cover: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2874&auto=format&fit=crop",
    link: "#",
    date: "2025-11-25",
  },
  {
    id: "res-003",
    title: "วิดีโอสอนเขียน Python เบื้องต้น",
    description: "คลิปสอนเขียนโปรแกรมภาษา Python สำหรับผู้เริ่มต้น EP.1 - EP.5",
    type: "VDO",
    cover: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=2832&auto=format&fit=crop",
    link: "https://youtube.com",
    date: "2025-10-15",
  },
  {
    id: "res-004",
    title: "สรุปคำศัพท์ภาษาอังกฤษ 1000 คำ",
    description: "คำศัพท์ที่พบบ่อยในข้อสอบ GAT/ENG และ TOEIC",
    type: "Sheet",
    cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2873&auto=format&fit=crop",
    link: "#",
    date: "2025-09-30",
  },
  {
    id: "res-005",
    title: "Infographic ประวัติศาสตร์ไทย",
    description: "สรุปเหตุการณ์สำคัญในสมัยรัตนโกสินทร์ในรูปแบบ Infographic",
    type: "Other",
    cover: "https://images.unsplash.com/photo-1569949381149-d9d3c5ef43d6?q=80&w=2942&auto=format&fit=crop",
    link: "#",
    date: "2025-08-12",
  },
];

export const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
