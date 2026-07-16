import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  category: { type: String, enum: ['raw_material', 'electricity', 'other'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  created_at: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
