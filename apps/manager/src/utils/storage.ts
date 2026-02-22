// Helpers pour le localStorage

const ONBOARDING_KEY = 'continental_onboarding_completed';
const THEME_KEY = 'continental_theme_preference';

export const storage = {
  // Onboarding
  setOnboardingCompleted: (completed: boolean) => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(completed));
  },

  getOnboardingCompleted: (): boolean => {
    const value = localStorage.getItem(ONBOARDING_KEY);
    return value ? JSON.parse(value) : false;
  },

  // Theme
  setThemePreference: (theme: 'light' | 'dark') => {
    localStorage.setItem(THEME_KEY, theme);
  },

  getThemePreference: (): 'light' | 'dark' => {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  },

  // Generic
  setItem: <T>(key: string, value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getItem: <T>(key: string, defaultValue: T): T => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  },

  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  },
};
