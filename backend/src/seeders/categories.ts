import Category from '../models/Category';
import { DEFAULT_CATEGORIES } from '@shared/types/category';

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
