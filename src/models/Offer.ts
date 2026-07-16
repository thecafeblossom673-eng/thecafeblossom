import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema({
  is_active: { type: Boolean, default: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  badge: { type: String, required: true },
  price: { type: Number, required: true },
  original_price: { type: Number, required: false },
  image_url: { type: String, required: true },
  included_items: [{
    menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    original_price: { type: Number, required: true }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Offer || mongoose.model('Offer', OfferSchema);
