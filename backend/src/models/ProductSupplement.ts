import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Product from './Product';

export interface ProductSupplementAttributes {
  id: number;
  productId: number;
  supplementId?: number | null;
  supplement_name?: string | null;
  supplement_price?: number | null;
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductSupplementCreationAttributes extends Optional<ProductSupplementAttributes, 'id' | 'isAvailable' | 'createdAt' | 'updatedAt' | 'supplementId' | 'supplement_name' | 'supplement_price'> { }

class ProductSupplement extends Model<ProductSupplementAttributes, ProductSupplementCreationAttributes> implements ProductSupplementAttributes {
  public id!: number;
  public productId!: number;
  public supplementId?: number | null;
  public supplement_name?: string | null;
  public supplement_price?: number | null;
  public isAvailable!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public product?: Product;
  public supplement?: Product;
}

ProductSupplement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
      references: {
        model: Product,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    supplementId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'supplement_product_id',
      references: {
        model: Product,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    supplement_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    supplement_price: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_available',
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
    tableName: 'product_supplements',
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'supplement_product_id'],
      },
      {
        fields: ['product_id'],
      },
      {
        fields: ['supplement_product_id'],
      },
    ],
  }
);

export default ProductSupplement;
