/**
 * Utilitaire pour réessayer les appels API en cas d'échec
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryCondition?: (error: any) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 seconde
  retryCondition: (error: any) => {
    // Réessayer seulement pour les erreurs réseau ou serveur (5xx)
    const status = error?.response?.status || error?.status;
    return !status || status >= 500 || error?.message?.includes('network') || error?.message?.includes('timeout');
  },
};

export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;

      // Ne pas réessayer si ce n'est pas la dernière tentative et que la condition de retry n'est pas remplie
      if (attempt < opts.maxRetries && opts.retryCondition(error)) {
        // Attendre avant de réessayer (backoff exponentiel)
        const delay = opts.retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Si on ne doit pas réessayer ou si c'est la dernière tentative, lancer l'erreur
      throw error;
    }
  }

  throw lastError;
};

/**
 * Wrapper pour les appels API avec retry automatique
 */
export const withRetry = <T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  options?: RetryOptions
): T => {
  return ((...args: Parameters<T>) => {
    return retryApiCall(() => apiFunction(...args), options);
  }) as T;
};
