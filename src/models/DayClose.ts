import mongoose from 'mongoose';

const DayCloseSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format YYYY-MM-DD
  revenue: { type: Number, required: true },
  expenses: { type: Number, required: true },
  profit: { type: Number, required: true },
  notes: { type: String, default: '' },
  cash_revenue: { type: Number, default: 0 },
  online_revenue: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.DayClose || mongoose.model('DayClose', DayCloseSchema);
