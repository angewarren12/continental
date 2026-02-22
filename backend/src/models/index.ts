import User from './User';
import Product from './Product';
import Order from './Order';
import OrderItem from './OrderItem';
import Stock from './Stock';
import StockMovement from './StockMovement';
import Category from './Category';
import Payment from './Payment';

// Définir les associations
Order.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
Order.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });

OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

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

export {
  User,
  Product,
  Order,
  OrderItem,
  Stock,
  StockMovement,
  Category,
  Payment,
};
