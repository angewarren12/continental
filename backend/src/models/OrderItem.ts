import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Order from './Order';
import Product from './Product';

export interface OrderItemAttributes {
  id: number;
  orderId: number;
  productId: number;
  parentItemId?: number;
  isSupplement: boolean;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'parentItemId' | 'isSupplement'> {}

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public parentItemId?: number;
  public isSupplement!: boolean;
  public productName!: string;
  public quantity!: number;
  public unitPrice!: number;
  public totalPrice!: number;

  // Associations
  public order?: Order;
  public product?: Product;
  public parentItem?: OrderItem;
}

OrderItem.init(
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
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
      references: {
        model: Product,
        key: 'id',
      },
    },
    parentItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_item_id',
      references: {
        model: 'order_items',
        key: 'id',
      },
    },
    isSupplement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_supplement',
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'product_name',
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
    tableName: 'order_items',
    timestamps: false, // Les order_items n'ont pas besoin de timestamps
    indexes: [
      {
        fields: ['order_id'],
      },
      {
        fields: ['parent_item_id'],
      },
    ],
  }
);

export default OrderItem;
