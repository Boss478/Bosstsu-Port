export type ResourceType = "Sheet" | "Slide" | "VDO" | "Other";

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: string;
  cover: string;
  link: string;
  date: string;
  author?: string;
}

export interface PaginatedResources {
  items: ResourceItem[];
  uniqueTypes: string[];
  currentPage: number;
  totalPages: number;
  activeType: string;
  sort: "Newest" | "Oldest";
  totalItems: number;
}
