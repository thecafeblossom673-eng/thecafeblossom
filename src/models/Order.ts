import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  status: { type: String, enum: ['open', 'billed', 'closed'], default: 'open', index: true },
  customer_phone: { type: String, default: null },
  customer_name: { type: String, default: null },
  created_at: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false, // We use created_at manually to match old schema
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
