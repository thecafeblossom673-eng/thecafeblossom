import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  parcel_charge: { type: Number, default: 0 },
  extra_charge: { type: Number, default: 0 },
  extra_charge_label: { type: String, default: null },
  payment_method: { type: String, enum: ['cash', 'online', 'split'], default: 'cash' },
  cash_amount: { type: Number, default: 0 },
  online_amount: { type: Number, default: 0 },
  whatsapp_sent_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Bill || mongoose.model('Bill', BillSchema);
