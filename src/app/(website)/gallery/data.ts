export interface GalleryAlbum {
  id: string;
  title: string;
  description: string;
  cover: string;
  tags: string[];
  date: string;
  photos: string[];
  relatedPortfolioId?: string;
}

export const galleryAlbums: GalleryAlbum[] = [
  {
    id: "school-trip-2025",
    title: "ทริปทัศนศึกษา 2568",
    description: "บันทึกความทรงจำจากทริปทัศนศึกษาประจำปี ไปเที่ยวชมธรรมชาติและเรียนรู้นอกห้องเรียน",
    cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2940&auto=format&fit=crop",
    tags: ["กิจกรรม", "ท่องเที่ยว"],
    date: "2025-11-15",
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
    id: "sport-day-2025",
    title: "กีฬาสี 2568",
    description: "กิจกรรมกีฬาสีประจำปี รวมภาพบรรยากาศการแข่งขันและเชียร์ลีดเดอร์",
    cover: "https://images.unsplash.com/photo-1461896836934-bd45ba7b5e12?q=80&w=2940&auto=format&fit=crop",
    tags: ["กิจกรรม", "กีฬา"],
    date: "2025-08-20",
    photos: [
      "https://images.unsplash.com/photo-1461896836934-bd45ba7b5e12?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1474224017046-182ece80b263?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=2940&auto=format&fit=crop",
    ],
  },
  {
    id: "street-photography",
    title: "Street Photography",
    description: "ภาพถ่ายสตรีทที่ถ่ายเก็บไว้ระหว่างเดินเล่นในเมือง",
    cover: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2940&auto=format&fit=crop",
    tags: ["ถ่ายภาพ", "ศิลปะ"],
    date: "2025-06-10",
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
    id: "volunteer-camp-photos",
    title: "ค่ายอาสา 2568",
    description: "ภาพบรรยากาศค่ายอาสาพัฒนาโรงเรียน ทาสีอาคารเรียนและสอนน้อง ๆ",
    cover: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2940&auto=format&fit=crop",
    tags: ["กิจกรรม", "อาสา"],
    date: "2025-05-14",
    photos: [
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2940&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2940&auto=format&fit=crop",
    ],
    relatedPortfolioId: "volunteer-camp",
  },
];

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
