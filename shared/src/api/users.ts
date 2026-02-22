import { apiClient } from './client';
import { User, UserUpdateInput, UserCreateInput } from '../types/user';

export const getUser = async (userId: number): Promise<User> => {
  const response = await apiClient.get<{ user: User }>(`/users/${userId}`);
  return response.user;
};

export const getUserByPhone = async (phoneNumber: string): Promise<User | null> => {
  try {
    const response = await apiClient.get<{ user: User }>(`/users/search/phone/${phoneNumber}`);
    return response.user;
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('non trouvé')) {
      return null;
    }
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<{ users: User[] }>('/users');
  return response.users;
};

export const updateUser = async (userId: number, userData: UserUpdateInput): Promise<User> => {
  const response = await apiClient.put<{ user: User }>(`/users/${userId}`, userData);
  return response.user;
};

export const createClient = async (clientData: {
  name: string;
  phoneNumber: string;
  password: string;
  email?: string;
}): Promise<User> => {
  const response = await apiClient.post<{ user: User }>('/users', {
    ...clientData,
    role: 'client',
  });
  return response.user;
};

export const updateUserTotalSpent = async (userId: number, amount: number): Promise<void> => {
  // Cette fonction sera gérée automatiquement par le backend lors de la création de commandes
  // Pas besoin d'appel API séparé
};

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await apiClient.put<{ message: string }>(`/users/${userId}/password`, {
    currentPassword,
    newPassword,
  });
};