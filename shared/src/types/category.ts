export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryCreationAttributes {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CategoryUpdateAttributes {
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string;
  isActive?: boolean;
}

// Catégories prédéfinies pour les boissons
export const DEFAULT_CATEGORIES = [
  {
    name: 'Bières',
    description: 'Bières locales et importées',
    icon: 'LocalBar',
    color: '#bd0f3b',
  },
  {
    name: 'Vins',
    description: 'Vins rouges, blancs et rosés',
    icon: 'WineBar',
    color: '#8B0000',
  },
  {
    name: 'Soft drinks',
    description: 'Boissons non alcoolisées',
    icon: 'LocalDrink',
    color: '#FF6B6B',
  },
  {
    name: 'Cocktails',
    description: 'Cocktails et boissons mixtes',
    icon: 'SportsBar',
    color: '#bd0f3b',
  },
  {
    name: 'Eaux',
    description: 'Eaux minérales et gazeuses',
    icon: 'WaterDrop',
    color: '#2196F3',
  },
] as const;
