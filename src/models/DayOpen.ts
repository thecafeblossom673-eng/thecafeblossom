import mongoose from 'mongoose';

const dayOpenSchema = new mongoose.Schema({
  date: { type: String, required: true },
  opening_cash: { type: Number, required: true, default: 0 },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.DayOpen || mongoose.model('DayOpen', dayOpenSchema);
