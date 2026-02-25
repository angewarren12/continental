import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Product from './Product';
import User from './User';

export interface StockAttributes {
  id: number;
  productId: number;
  quantity: number;
  quantityPackets?: number;
  quantityUnits?: number;
  quantityPlates?: number;
  lastUpdated?: Date;
  updatedBy: number;
}

export interface StockCreationAttributes extends Optional<StockAttributes, 'id' | 'lastUpdated' | 'quantityPackets' | 'quantityUnits' | 'quantityPlates'> {}

class Stock extends Model<StockAttributes, StockCreationAttributes> implements StockAttributes {
  public id!: number;
  public productId!: number;
  public quantity!: number;
  public quantityPackets?: number;
  public quantityUnits?: number;
  public quantityPlates?: number;
  public lastUpdated!: Date;
  public updatedBy!: number;

  // Associations
  public product?: Product;
  public updater?: User;
}

Stock.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'product_id',
      references: {
        model: Product,
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    quantityPackets: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'quantity_packets',
    },
    quantityUnits: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'quantity_units',
    },
    quantityPlates: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'quantity_plates',
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_updated',
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'updated_by',
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'stock',
    timestamps: false, // Utilise last_updated personnalisé (pas created_at/updated_at)
    indexes: [
      {
        unique: true,
        fields: ['product_id'],
      },
    ],
  }
);

export default Stock;
