export interface GalleryAlbum {
  id: string;
  title: string;
  description?: string;
  cover: string;
  tags: string[];
  date: string;
  photos: string[];
  relatedPortfolioId?: string;
}
