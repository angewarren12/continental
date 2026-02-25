import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Product from './Product';

export interface DishSupplementAttributes {
  id: number;
  dishId: number;
  name: string;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DishSupplementCreationAttributes extends Optional<DishSupplementAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class DishSupplement extends Model<DishSupplementAttributes, DishSupplementCreationAttributes> implements DishSupplementAttributes {
  public id!: number;
  public dishId!: number;
  public name!: string;
  public price!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public dish?: Product;
}

DishSupplement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dishId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'dish_id',
      references: {
        model: Product,
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'dish_supplements',
    indexes: [
      {
        fields: ['dish_id'],
      },
    ],
  }
);

export default DishSupplement;
