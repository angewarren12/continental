import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'continentalBd',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dialect: 'mysql' as const,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10, // Maximum de connexions dans le pool
    min: 0,
    acquire: 30000, // Temps max pour acquérir une connexion
    idle: 10000, // Temps max avant de libérer une connexion inactive
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
};

export const sequelize = new Sequelize(
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

// Test de connexion
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion MySQL établie avec succès');
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:', error);
    throw error;
  }
};

export default sequelize;
