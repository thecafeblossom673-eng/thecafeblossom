import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  menu_item_id: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price_at_order: { type: Number, required: true },
  notes: { type: String, default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.OrderItem || mongoose.model('OrderItem', OrderItemSchema);
