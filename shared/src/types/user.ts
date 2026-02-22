export type UserRole = 'manager' | 'client';

export interface User {
  id: number;
  phoneNumber: string;
  email?: string;
  name: string;
  role: UserRole;
  createdAt: Date | string;
  updatedAt?: Date | string;
  totalSpent: number;
}

export interface UserCreateInput {
  phoneNumber: string;
  email?: string;
  name: string;
  role: UserRole;
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
}
