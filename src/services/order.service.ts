import mongoose from 'mongoose';
import dbConnect from '../lib/mongodb';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Table from '../models/Table';
import MenuItem from '../models/MenuItem';
import Offer from '../models/Offer';

// Helper to safely resolve a table document whether passed a valid ObjectId string, "t-2", or table_number string ("2")
async function resolveTable(tableIdOrNumber: string): Promise<any | null> {
  await dbConnect();
  if (mongoose.Types.ObjectId.isValid(tableIdOrNumber)) {
    const byId = await Table.findById(tableIdOrNumber);
    if (byId) return byId;
  }
  const num = parseInt(tableIdOrNumber.replace(/\D/g, ''), 10);
  if (!isNaN(num)) {
    return await Table.findOne({ table_number: num });
  }
  return null;
}

export const orderService = {
  async getActiveOrder(tableId: string): Promise<any | null> {
    await dbConnect();
    const tableDoc = await resolveTable(tableId);
    const resolvedTableId = tableDoc ? tableDoc._id.toString() : tableId;

    const order = await Order.findOne({ table_id: resolvedTableId, status: { $ne: 'closed' } }).lean();
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
    
    const table = await resolveTable(tableId);
    if (!table) throw new Error('Table not found');

    const realTableId = table._id.toString();

    // Return existing active order if table is already open
    const existingOrder = await Order.findOne({ table_id: realTableId, status: { $ne: 'closed' } });
    if (existingOrder) {
      return {
        id: existingOrder._id.toString(),
        table_id: existingOrder.table_id.toString(),
        status: existingOrder.status,
        customer_phone: existingOrder.customer_phone,
        created_at: existingOrder.created_at
      };
    }

    const newOrder = await Order.create({ table_id: realTableId, status: 'open' });
    
    // Update table status
    await Table.updateOne({ _id: realTableId }, { status: 'occupied' });

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

    const targetOrderId = mongoose.Types.ObjectId.isValid(orderId) 
      ? new mongoose.Types.ObjectId(orderId) 
      : orderId;

    const existing = await OrderItem.findOne({ order_id: targetOrderId, menu_item_id: menuItemId });
    if (existing) {
      existing.quantity += quantity;
      if (notes !== null) existing.notes = notes;
      await existing.save();
    } else {
      await OrderItem.create({
        order_id: targetOrderId,
        menu_item_id: menuItemId,
        quantity,
        price_at_order: priceAtOrder,
        notes: notes || ''
      });
    }
  },

  async updateOrderItemQuantity(itemId: string, quantity: number): Promise<void> {
    await dbConnect();
    if (quantity <= 0) {
      await OrderItem.deleteOne({ _id: itemId });
    } else {
      await OrderItem.updateOne({ _id: itemId }, { quantity });
    }
  },

  async updateOrderItemNotes(itemId: string, notes: string): Promise<void> {
    await dbConnect();
    await OrderItem.updateOne({ _id: itemId }, { notes });
  },

  async setCustomerPhone(orderId: string, phone: string): Promise<void> {
    await dbConnect();
    await Order.updateOne({ _id: orderId }, { customer_phone: phone });
  },

  async cancelOrder(orderId: string): Promise<void> {
    await dbConnect();
    const order = await Order.findById(orderId);
    if (!order) return;

    await OrderItem.deleteMany({ order_id: orderId });
    await Order.deleteOne({ _id: orderId });
    
    // Check if table has any other active orders
    const remaining = await Order.findOne({ table_id: order.table_id, status: { $ne: 'closed' } });
    if (!remaining) {
      await Table.updateOne({ _id: order.table_id }, { status: 'free' });
    }
  },

  async updateOrderItem(itemId: string, quantity: number, notes: string | null): Promise<void> {
    await dbConnect();
    const query = mongoose.Types.ObjectId.isValid(itemId) 
      ? { _id: itemId } 
      : { menu_item_id: itemId };

    if (quantity <= 0) {
      await OrderItem.deleteOne(query);
    } else {
      const updateData: any = { quantity };
      if (notes !== null) updateData.notes = notes;
      await OrderItem.updateOne(query, updateData);
    }
  },

  async deleteOrderItem(itemId: string): Promise<void> {
    await dbConnect();
    const query = mongoose.Types.ObjectId.isValid(itemId) 
      ? { _id: itemId } 
      : { menu_item_id: itemId };
    await OrderItem.deleteOne(query);
  },

  async unlockOrder(orderId: string): Promise<void> {
    await dbConnect();
    await Order.updateOne({ _id: orderId }, { status: 'open' });
  }
};
