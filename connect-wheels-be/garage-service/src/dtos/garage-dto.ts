export interface GarageDTO {
  name: string;
  ownerId: number;
  description?: string;
  pictureUrl?: string;
  coverImageUrl?: string;
  location?: string;
}

export interface GarageUpdateDTO {
  name?: string;
  description?: string;
  pictureUrl?: string;
  coverImageUrl?: string;
  location?: string;
}
