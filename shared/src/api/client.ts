/**
 * Client API REST pour communiquer avec le backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Récupérer le token depuis localStorage au démarrage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    // Toujours récupérer depuis localStorage pour être sûr d'avoir le token à jour
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      this.token = token;
      return token;
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Récupérer le token à chaque requête pour s'assurer qu'il est à jour
    const currentToken = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : this.token;
    
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `Erreur HTTP: ${response.status}`,
        }));
        // Si c'est une erreur de validation, inclure les détails
        if (errorData.details && Array.isArray(errorData.details)) {
          const detailsMessages = errorData.details.map((d: any) => 
            `${d.path.join('.')}: ${d.message}`
          ).join(', ');
          throw new Error(`${errorData.error || 'Erreur de validation'}: ${detailsMessages}`);
        }
        throw new Error(errorData.error || 'Erreur de requête');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur réseau');
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
