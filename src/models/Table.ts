import mongoose from 'mongoose';

const TableSchema = new mongoose.Schema({
  table_number: { type: Number, required: true, unique: true },
  status: { type: String, enum: ['free', 'occupied'], default: 'free' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Table || mongoose.model('Table', TableSchema);
