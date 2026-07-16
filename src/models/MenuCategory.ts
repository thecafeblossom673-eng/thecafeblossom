import mongoose from 'mongoose';

const MenuCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  sort_order: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.MenuCategory || mongoose.model('MenuCategory', MenuCategorySchema);
