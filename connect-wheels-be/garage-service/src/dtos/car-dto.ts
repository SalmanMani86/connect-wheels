export interface CarDTO {
  garageId: number;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  mileage?: number;
  engineType?: string;
  transmission?: string;
  pictureUrl?: string;
  mediaUrls?: string[];
  description?: string;
}

export interface CarUpdateDTO {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  vin?: string;
  mileage?: number;
  engineType?: string;
  transmission?: string;
  pictureUrl?: string;
  mediaUrls?: string[];
  description?: string;
}
