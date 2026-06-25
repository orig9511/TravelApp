export type UserRole = "admin" | "advertiser" | "customer";

export interface AppUserProfile {
  id?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: UserRole;
  dateOfBirth?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
