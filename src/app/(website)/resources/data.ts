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
