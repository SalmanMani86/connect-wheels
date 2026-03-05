export interface PostDTO {
  garageId: number;
  title?: string;
  caption?: string;
  content?: string;
  mediaUrls?: string[];
  isPublished?: boolean;
}

export interface PostUpdateDTO {
  title?: string;
  caption?: string;
  content?: string;
  isPublished?: boolean;
}
