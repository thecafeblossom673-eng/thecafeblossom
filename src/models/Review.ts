import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  table_number: { type: Number, default: null },
  created_at: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
