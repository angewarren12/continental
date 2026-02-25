import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Order from './Order';
import OrderItem from './OrderItem';
import Product from './Product';

export interface OrderSupplementAttributes {
  id: number;
  orderId: number;
  orderItemId: number;
  supplementId: number;
  supplementName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderSupplementCreationAttributes extends Optional<OrderSupplementAttributes, 'id'> {}

class OrderSupplement extends Model<OrderSupplementAttributes, OrderSupplementCreationAttributes> implements OrderSupplementAttributes {
  public id!: number;
  public orderId!: number;
  public orderItemId!: number;
  public supplementId!: number;
  public supplementName!: string;
  public quantity!: number;
  public unitPrice!: number;
  public totalPrice!: number;

  // Associations
  public order?: Order;
  public orderItem?: OrderItem;
  public supplement?: Product;
}

OrderSupplement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id',
      references: {
        model: Order,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    orderItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_item_id',
      references: {
        model: OrderItem,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    supplementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'supplement_id',
      references: {
        model: Product,
        key: 'id',
      },
    },
    supplementName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'supplement_name',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'unit_price',
    },
    totalPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_price',
    },
  },
  {
    sequelize,
    tableName: 'order_supplements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['order_id'],
      },
      {
        fields: ['order_item_id'],
      },
    ],
  }
);

export default OrderSupplement;
