import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ProductType = 'food' | 'dish' | 'drink' | 'cigarette' | 'egg' | 'supplement' | 'service';
export type StockUnit = 'packet' | 'unit' | 'plate';
export type SaleUnit = 'packet' | 'unit' | 'plate';

export interface ProductAttributes {
  id: number;
  name: string;
  categoryId: number;
  productType: ProductType;
  stockUnit?: StockUnit | null;
  saleUnit?: SaleUnit | null;
  conversionFactor?: number | null;
  imageUrl?: string | null;
  description?: string | null;
  price: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt' | 'stockUnit' | 'saleUnit' | 'conversionFactor'> { }

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public categoryId!: number;
  public productType!: ProductType;
  public stockUnit?: StockUnit;
  public saleUnit?: SaleUnit;
  public conversionFactor?: number;
  public imageUrl?: string;
  public description?: string;
  public price!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual property
  public get hasStock(): boolean {
    return !!(this as any).stock;
  }
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
    },
    productType: {
      type: DataTypes.ENUM('dish', 'drink', 'cigarette', 'egg', 'supplement', 'service'),
      allowNull: false,
      field: 'product_type',
    },
    stockUnit: {
      type: DataTypes.ENUM('packet', 'unit', 'plate'),
      allowNull: true,
      field: 'stock_unit',
    },
    saleUnit: {
      type: DataTypes.ENUM('packet', 'unit', 'plate'),
      allowNull: true,
      defaultValue: 'unit',
      field: 'sale_unit',
    },
    conversionFactor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'conversion_factor',
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_url',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
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
    tableName: 'products',
    indexes: [
      {
        fields: ['category_id'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Product;
