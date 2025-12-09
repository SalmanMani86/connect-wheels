export interface UserInfoDto {
  id: string;
  name: string;
  avatar: string;
}
export interface JWTPayloadDto {
  userId: string;
  email?: string;
  iat?: number; // issued at
  exp?: number; // expiry
}
