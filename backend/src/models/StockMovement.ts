import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Product from './Product';
import Order from './Order';
import User from './User';

export interface StockMovementAttributes {
  id: number;
  productId: number;
  type: 'sale' | 'restock' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  orderId?: number;
  createdBy: number;
  createdAt?: Date;
}

export interface StockMovementCreationAttributes extends Optional<StockMovementAttributes, 'id' | 'orderId' | 'createdAt'> {}

class StockMovement extends Model<StockMovementAttributes, StockMovementCreationAttributes> implements StockMovementAttributes {
  public id!: number;
  public productId!: number;
  public type!: 'sale' | 'restock' | 'adjustment';
  public quantity!: number;
  public previousStock!: number;
  public newStock!: number;
  public orderId?: number;
  public createdBy!: number;
  public readonly createdAt!: Date;

  // Associations
  public product?: Product;
  public order?: Order;
  public creator?: User;
}

StockMovement.init(
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
    },
    type: {
      type: DataTypes.ENUM('sale', 'restock', 'adjustment'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previousStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'previous_stock',
    },
    newStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'new_stock',
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'order_id',
      references: {
        model: Order,
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by',
      references: {
        model: User,
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'stock_movements',
    timestamps: false, // Utilise created_at personnalisé (pas updated_at)
    indexes: [
      {
        fields: ['product_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default StockMovement;
