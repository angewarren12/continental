import Category from '../models/Category';

// Catégories prédéfinies pour les boissons
const DEFAULT_CATEGORIES = [
  {
    name: 'Bières',
    mainCategory: 'drink',
    description: 'Bières locales et importées',
    icon: 'LocalBar',
    color: '#bd0f3b',
  },
  {
    name: 'Vins',
    mainCategory: 'drink',
    description: 'Vins rouges, blancs et rosés',
    icon: 'WineBar',
    color: '#8B0000',
  },
  {
    name: 'Soft drinks',
    mainCategory: 'drink',
    description: 'Boissons non alcoolisées',
    icon: 'LocalDrink',
    color: '#FF6B6B',
  },
  {
    name: 'Cocktails',
    mainCategory: 'drink',
    description: 'Cocktails et boissons mixtes',
    icon: 'SportsBar',
    color: '#bd0f3b',
  },
  {
    name: 'Eaux',
    mainCategory: 'drink',
    description: 'Eaux minérales et gazeuses',
    icon: 'WaterDrop',
    color: '#2196F3',
  },
] as const;

/**
 * Seed les catégories par défaut
 */
export const seedCategories = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding categories...');

    for (const categoryData of DEFAULT_CATEGORIES) {
      const [category, created] = await Category.findOrCreate({
        where: { name: categoryData.name },
        defaults: {
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon,
          color: categoryData.color,
          mainCategory: categoryData.mainCategory,
          isActive: true,
        },
      });

      if (created) {
        console.log(`✅ Catégorie créée: ${category.name}`);
      } else {
        console.log(`⏭️  Catégorie déjà existante: ${category.name}`);
      }
    }

    console.log('✅ Categories seeding completed');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};
