import { apiClient } from './client';
import { User, UserRole } from '../types/user';
import { formatPhoneNumber } from '../utils/phone';

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Inscription avec téléphone et mot de passe
 */
export const signUpWithPhoneAndPassword = async (
  phoneNumber: string,
  password: string,
  name: string,
  role: UserRole,
  email?: string
): Promise<AuthResponse> => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  const response = await apiClient.post<AuthResponse>('/auth/signup', {
    phoneNumber: formattedPhone,
    password,
    name,
    email,
    role,
  });

  // Sauvegarder le token
  apiClient.setToken(response.token);

  return response;
};

/**
 * Connexion avec téléphone et mot de passe
 */
export const signInWithPhoneAndPassword = async (
  phoneNumber: string,
  password: string
): Promise<AuthResponse> => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  const response = await apiClient.post<AuthResponse>('/auth/login', {
    phoneNumber: formattedPhone,
    password,
  });

  // Sauvegarder le token
  apiClient.setToken(response.token);

  return response;
};

/**
 * Obtenir l'utilisateur actuel
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<{ user: User }>('/auth/me');
  return response.user;
};

/**
 * Déconnexion
 */
export const signOut = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    // Ignorer les erreurs de déconnexion
    console.error('Logout error:', error);
  } finally {
    // Supprimer le token de toute façon
    apiClient.setToken(null);
  }
};

/**
 * Vérifier si l'utilisateur est authentifié
 */
export const isAuthenticated = (): boolean => {
  return apiClient.getToken() !== null;
};
