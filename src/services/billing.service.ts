import mongoose from 'mongoose';
import dbConnect from '../lib/mongodb';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Bill from '../models/Bill';
import Table from '../models/Table';
import MenuItem from '../models/MenuItem';

export const billingService = {
  async generateBill(
    orderId: string,
    customerPhone: string | null,
    customerName: string | null = null,
    discount: number = 0,
    parcelCharge: number = 0,
    extraCharge: number = 0,
    extraChargeLabel: string | null = null
  ): Promise<any> {
    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Update order status
      await Order.updateOne({ _id: orderId }, { status: 'billed', customer_phone: customerPhone, customer_name: customerName }, { session });

      // 2. Fetch order items to compute subtotal
      const items = await OrderItem.find({ order_id: orderId }).session(session).lean();
      const subtotal = items.reduce((acc, curr) => acc + curr.quantity * curr.price_at_order, 0);
      const tax = 0;
      const total = subtotal - discount + parcelCharge + extraCharge + tax;

      // 3. Create or update bill
      let bill = await Bill.findOne({ order_id: orderId }).session(session);
      if (bill) {
        bill.subtotal = subtotal;
        bill.discount = discount;
        bill.tax = tax;
        bill.total = total;
        bill.parcel_charge = parcelCharge;
        bill.extra_charge = extraCharge;
        bill.extra_charge_label = extraChargeLabel;
        await bill.save({ session });
      } else {
        bill = await Bill.create([{
          order_id: orderId,
          subtotal,
          discount,
          tax,
          total,
          parcel_charge: parcelCharge,
          extra_charge: extraCharge,
          extra_charge_label: extraChargeLabel
        }], { session }).then(res => res[0]);
      }

      await session.commitTransaction();
      
      const order = await Order.findById(orderId).lean();
      const table = await Table.findById(order?.table_id).lean();
      
      return {
        bill: { ...bill.toObject(), id: bill._id.toString() },
        order: { ...order, id: order?._id.toString(), tables: table },
        items
      };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  },

  async getBillByOrderId(orderId: string): Promise<any | null> {
    await dbConnect();
    const bill = await Bill.findOne({ order_id: orderId }).lean();
    if (!bill) return null;
    return { ...bill, id: bill._id.toString() };
  },

  async closeTable(
    orderId: string,
    paymentMethod: 'cash' | 'online' | 'split' = 'cash',
    cashAmount: number = 0,
    onlineAmount: number = 0,
    whatsappSent: boolean = false,
    customerPhone: string | null = null,
    customerName: string | null = null
  ): Promise<void> {
    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new Error('Order not found');

      order.status = 'closed';
      if (customerPhone !== null) order.customer_phone = customerPhone;
      if (customerName !== null) order.customer_name = customerName;
      await order.save({ session });

      await Table.updateOne({ _id: order.table_id }, { status: 'free' }, { session });

      const updateData: any = { payment_method: paymentMethod, cash_amount: cashAmount, online_amount: onlineAmount };
      if (whatsappSent) {
        updateData.whatsapp_sent_at = new Date();
      }

      await Bill.updateOne({ order_id: orderId }, updateData, { session });

      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  },

  async getBillHistory(): Promise<any[]> {
    await dbConnect();
    const bills = await Bill.find({}).sort({ created_at: -1 }).lean();
    const orderIds = bills.map(b => b.order_id);
    const orders = await Order.find({ _id: { $in: orderIds } }).lean();
    const tableIds = orders.map(o => o.table_id);
    const tables = await Table.find({ _id: { $in: tableIds } }).lean();

    return bills.map(b => {
      const order = orders.find(o => o._id.toString() === b.order_id.toString());
      const table = order ? tables.find(t => t._id.toString() === order.table_id.toString()) : null;

      return {
        ...b,
        id: b._id.toString(),
        order_id: b.order_id.toString(),
        orders: order ? {
          id: order._id.toString(),
          table_id: order.table_id.toString(),
          customer_phone: order.customer_phone,
          tables: table ? {
            id: table._id.toString(),
            table_number: table.table_number,
            status: table.status
          } : undefined
        } : undefined
      };
    });
  },

  async deleteBill(billId: string, orderId: string): Promise<void> {
    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await Bill.deleteOne({ _id: billId }).session(session);
      const order = await Order.findById(orderId).session(session);
      
      await OrderItem.deleteMany({ order_id: orderId }).session(session);
      await Order.deleteOne({ _id: orderId }).session(session);

      if (order) {
        await Table.updateOne({ _id: order.table_id }, { status: 'free' }).session(session);
      }

      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  },

  async getBillWhatsAppLink(billId: string, customPhone?: string): Promise<string> {
    await dbConnect();
    const bill = await Bill.findById(billId);
    if (!bill) throw new Error('Bill not found');
    const order = await Order.findById(bill.order_id);
    const table = await Table.findById(order.table_id);
    const items = await OrderItem.find({ order_id: order._id }).lean();
    
    // Filter out 'running-offer' or invalid ObjectIds to prevent CastError
    const validItemIds = items
      .map(i => i.menu_item_id)
      .filter(id => id && mongoose.Types.ObjectId.isValid(id));
      
    const menuItems = await MenuItem.find({ _id: { $in: validItemIds } }).lean();

    const date = new Date(bill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = new Date(bill.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const W = 34;
    const line = '\u2501'.repeat(W);
    const dashes = '\u2504'.repeat(W);

    let text = '';
    text += `${line}\n    🌸  *CAFE BLOSSOM*\n         Ishvarpur\n${line}\n📅 ${date}  ⏰ ${time}\n`;
    
    const tNum = table.table_number;
    const isParcel = bill.parcel_charge > 0;
    const displayTable = tNum === 9 ? 'Zomato' : tNum === 10 ? 'Parcel' : `${tNum}`;
    text += `🌿 Table: ${displayTable}${isParcel && tNum !== 10 ? '  📦 PARCEL' : ''}\n${dashes}\n*ITEM${' '.repeat(W - 14)}QTY    AMT*\n${dashes}\n`;

    items.forEach(item => {
      let name = 'Item';
      if (item.menu_item_id === 'running-offer') {
        name = 'Combo Offer';
      } else {
        const mi = menuItems.find(m => m._id.toString() === item.menu_item_id.toString());
        if (mi) name = mi.name;
      }
      const qty = `${item.quantity}`;
      const amt = `₹${item.quantity * item.price_at_order}`;
      const nameW = W - qty.length - amt.length - 4;
      const truncName = name.length > nameW ? name.slice(0, nameW - 1) + '…' : name;
      const pad = Math.max(1, W - truncName.length - qty.length - amt.length - 2);
      text += `${truncName}${' '.repeat(Math.max(1, pad - qty.length))}${qty}  ${amt}\n`;
    });

    text += `${dashes}\nSubtotal${' '.repeat(Math.max(1, W - 8 - String(bill.subtotal).length - 1))}₹${bill.subtotal}\n`;
    if (bill.discount > 0) text += `Discount${' '.repeat(Math.max(1, W - 8 - String(bill.discount).length - 2))}-₹${bill.discount}\n`;
    if (bill.parcel_charge > 0) text += `Parcel Charge${' '.repeat(Math.max(1, W - 13 - String(bill.parcel_charge).length - 1))}₹${bill.parcel_charge}\n`;
    if (bill.extra_charge > 0) {
      const extraLabel = bill.extra_charge_label || 'Extra Charge';
      text += `${extraLabel}${' '.repeat(Math.max(1, W - extraLabel.length - String(bill.extra_charge).length - 1))}₹${bill.extra_charge}\n`;
    }
    
    text += `${line}\n*TOTAL${' '.repeat(Math.max(1, W - 6 - String(bill.total).length - 1))}₹${bill.total}*\n${line}\n`;
    
    let payText = '';
    if (bill.payment_method === 'cash') payText = 'Paid via: CASH';
    else if (bill.payment_method === 'online') payText = 'Paid via: ONLINE';
    else payText = `SPLIT: Cash ₹${bill.cash_amount} / Online ₹${bill.online_amount}`;
    
    text += `${payText}\n${line}\n\n✨ Thank you for dining with us!\n🌿 We hope to see you again soon.\n\n_Cafe Blossom — Where Every Sip Blooms_ 🌸`;

    await Bill.updateOne({ _id: billId }, { whatsapp_sent_at: new Date() });

    const phone = customPhone || order.customer_phone;
    if (!phone) throw new Error('No phone number available');
    
    const digits = phone.replace(/\D/g, '');
    const full = digits.length === 10 ? '91' + digits : digits;
    return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
  }
};
