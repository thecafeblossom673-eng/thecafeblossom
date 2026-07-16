import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  price: { type: Number, required: true },
  is_veg: { type: Boolean, default: true },
  is_available: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
