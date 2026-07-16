import dbConnect from '../lib/mongodb';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Table from '../models/Table';
import MenuItem from '../models/MenuItem';
import Offer from '../models/Offer';

export const orderService = {
  async getActiveOrder(tableId: string): Promise<any | null> {
    await dbConnect();
    const order = await Order.findOne({ table_id: tableId, status: { $ne: 'closed' } }).lean();
    if (!order) return null;

    const items = await OrderItem.find({ order_id: order._id }).lean();
    const itemIds = items.map(i => i.menu_item_id).filter(id => id !== 'running-offer');
    const menuItems = await MenuItem.find({ _id: { $in: itemIds } }).lean();

    const hasOffer = items.some(i => i.menu_item_id === 'running-offer');
    const offer = hasOffer ? await Offer.findOne({}).lean() : null;

    const formattedItems = items.map(oi => {
      if (oi.menu_item_id === 'running-offer' && offer) {
        return {
          id: oi._id.toString(),
          order_id: oi.order_id.toString(),
          menu_item_id: 'running-offer',
          quantity: oi.quantity,
          price_at_order: oi.price_at_order,
          notes: oi.notes,
          menu_items: {
            id: 'running-offer',
            category_id: 'cat-offers',
            name: offer.title,
            description: offer.description,
            price: offer.price,
            is_veg: true,
            is_available: offer.is_active,
            sort_order: 0
          }
        };
      }

      const mi = menuItems.find(m => m._id.toString() === oi.menu_item_id.toString());
      return {
        id: oi._id.toString(),
        order_id: oi.order_id.toString(),
        menu_item_id: oi.menu_item_id.toString(),
        quantity: oi.quantity,
        price_at_order: oi.price_at_order,
        notes: oi.notes,
        menu_items: mi ? {
          id: mi._id.toString(),
          category_id: mi.category_id.toString(),
          name: mi.name,
          description: mi.description,
          price: mi.price,
          is_veg: mi.is_veg,
          is_available: mi.is_available,
          sort_order: mi.sort_order
        } : undefined
      };
    });

    return {
      id: order._id.toString(),
      table_id: order.table_id.toString(),
      status: order.status,
      customer_phone: order.customer_phone,
      created_at: order.created_at,
      items: formattedItems
    };
  },

  async createOrder(tableId: string): Promise<any> {
    await dbConnect();
    
    // Check if table exists
    const table = await Table.findById(tableId);
    if (!table) throw new Error('Table not found');

    const newOrder = await Order.create({ table_id: tableId, status: 'open' });
    
    // Update table status
    await Table.updateOne({ _id: tableId }, { status: 'occupied' });

    return {
      id: newOrder._id.toString(),
      table_id: newOrder.table_id.toString(),
      status: newOrder.status,
      customer_phone: newOrder.customer_phone,
      created_at: newOrder.created_at
    };
  },

  async addOrderItem(orderId: string, menuItemId: string, quantity: number, notes: string | null, priceAtOrder: number): Promise<void> {
    await dbConnect();
    
    const existing = await OrderItem.findOne({ order_id: orderId, menu_item_id: menuItemId });
    if (existing) {
      existing.quantity += quantity;
      if (notes) existing.notes = notes;
      await existing.save();
    } else {
      await OrderItem.create({
        order_id: orderId,
        menu_item_id: menuItemId,
        quantity,
        price_at_order: priceAtOrder,
        notes
      });
    }
  },

  async updateOrderItem(itemId: string, quantity: number, notes: string | null): Promise<void> {
    await dbConnect();
    if (quantity <= 0) {
      await OrderItem.deleteOne({ _id: itemId });
    } else {
      await OrderItem.updateOne({ _id: itemId }, { quantity, notes });
    }
  },

  async deleteOrderItem(itemId: string): Promise<void> {
    await dbConnect();
    await OrderItem.deleteOne({ _id: itemId });
  },

  async unlockOrder(orderId: string): Promise<void> {
    await dbConnect();
    await Order.updateOne({ _id: orderId }, { status: 'open' });
  },

  async cancelOrder(orderId: string): Promise<void> {
    await dbConnect();
    const order = await Order.findById(orderId);
    if (!order) return;
    
    await OrderItem.deleteMany({ order_id: orderId });
    await Table.updateOne({ _id: order.table_id }, { status: 'free' });
    await Order.deleteOne({ _id: orderId });
  }
};
