import dbConnect from '../lib/mongodb';
import Table from '../models/Table';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import { Table as TableType } from '../types';

export const tableService = {
  async getTables(): Promise<any[]> {
    await dbConnect();
    
    // Fetch tables
    const tables = await Table.find({}).sort({ table_number: 1 }).lean();
    
    // Fetch active orders for these tables
    const activeOrders = await Order.find({ status: { $ne: 'closed' } }).lean();
    const activeOrderIds = activeOrders.map(o => o._id);
    
    // Fetch items for active orders
    const orderItems = await OrderItem.find({ order_id: { $in: activeOrderIds } }).lean();
    
    return tables.map(table => {
      const t = {
        id: table._id.toString(),
        table_number: table.table_number,
        status: table.status
      };
      
      const activeOrder = activeOrders.find(o => o.table_id.toString() === t.id);
      let itemsCount = 0;
      let totalAmount = 0;
      
      if (activeOrder) {
        const items = orderItems.filter(oi => oi.order_id.toString() === activeOrder._id.toString());
        itemsCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
        totalAmount = items.reduce((acc, curr) => acc + curr.quantity * curr.price_at_order, 0);
      }
      
      return {
        ...t,
        activeOrder: activeOrder ? {
          id: activeOrder._id.toString(),
          table_id: activeOrder.table_id.toString(),
          status: activeOrder.status,
          customer_phone: activeOrder.customer_phone,
          created_at: activeOrder.created_at,
          itemsCount,
          totalAmount
        } : null
      };
    });
  },

  async getTable(tableId: string): Promise<TableType | null> {
    await dbConnect();
    const table = await Table.findById(tableId).lean();
    if (!table) return null;
    return {
      id: table._id.toString(),
      table_number: table.table_number,
      status: table.status as any
    };
  }
};
