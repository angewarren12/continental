import User from './User';
import Product from './Product';
import Order from './Order';
import OrderItem from './OrderItem';
import OrderSupplement from './OrderSupplement';
import Stock from './Stock';
import StockMovement from './StockMovement';
import Category from './Category';
import Payment from './Payment';
import ProductSupplement from './ProductSupplement';
import DishSupplement from './DishSupplement';

// Définir les associations
Order.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
Order.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });

OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
OrderItem.hasMany(OrderSupplement, { foreignKey: 'orderItemId', as: 'orderSupplements' });

OrderSupplement.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderSupplement.belongsTo(OrderItem, { foreignKey: 'orderItemId', as: 'orderItem' });
OrderSupplement.belongsTo(Product, { foreignKey: 'supplementId', as: 'supplement' });

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoryDetail' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

Stock.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasOne(Stock, { foreignKey: 'productId', as: 'stock' });
Stock.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
StockMovement.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
StockMovement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Payment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

ProductSupplement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
ProductSupplement.belongsTo(Product, { foreignKey: 'supplementId', as: 'supplement' });
Product.hasMany(ProductSupplement, { foreignKey: 'productId', as: 'supplements' });
Product.hasMany(ProductSupplement, { foreignKey: 'supplementId', as: 'usedAsSupplementFor' });

// Associations pour DishSupplement
DishSupplement.belongsTo(Product, { foreignKey: 'dishId', as: 'dish' });
Product.hasMany(DishSupplement, { foreignKey: 'dishId', as: 'legacySupplements' });

export {
  User,
  Product,
  Order,
  OrderItem,
  OrderSupplement,
  Stock,
  StockMovement,
  Category,
  Payment,
  ProductSupplement,
  DishSupplement,
};
