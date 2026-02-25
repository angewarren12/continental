import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import OrderItem from './OrderItem';

export interface OrderAttributes {
  id: number;
  clientId: number;
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  method?: 'cash' | 'wave';
  tableNumber?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'paymentStatus' | 'createdAt' | 'completedAt'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public clientId!: number;
  public totalAmount!: number;
  public status!: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  public paymentStatus!: 'pending' | 'paid' | 'failed';
  public method?: 'cash' | 'wave';
  public tableNumber?: string;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public completedAt?: Date;

  // Associations
  public client?: User;
  public creator?: User;
  public items?: OrderItem[];
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'client_id',
      references: {
        model: User,
        key: 'id',
      },
    },
    totalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_amount',
    },
    status: {
      type: DataTypes.ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'payment_status',
    },
    method: {
      type: DataTypes.ENUM('cash', 'wave'),
      allowNull: true,
      field: 'payment_method',
    },
    tableNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'table_number',
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
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
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
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['client_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['payment_status'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default Order;
