import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize: Sequelize;

// Vérifier si DATABASE_URL est fournie (pour Render/Production)
if (process.env.DATABASE_URL) {
  // Configuration pour Render/Production avec DATABASE_URL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  });
} else {
  // Configuration locale pour développement
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'continentalBd',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql' as const,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  };

  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: dbConfig.pool,
      define: dbConfig.define,
    }
  );
}

export { sequelize };

// Test de connexion
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    const dialect = sequelize.getDialect();
    console.log(`✅ Connexion ${dialect === 'postgres' ? 'PostgreSQL' : 'MySQL'} établie avec succès`);
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    throw error;
  }
};

export default sequelize;
