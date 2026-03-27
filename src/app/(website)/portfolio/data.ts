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
