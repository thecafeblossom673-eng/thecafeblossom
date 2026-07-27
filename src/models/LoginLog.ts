import mongoose from 'mongoose';

const LoginLogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  user_role: { type: String, default: 'Staff Portal' },
  device_info: { type: String, default: 'Unknown Device' },
  ip_address: { type: String, default: '127.0.0.1' },
  login_at: { type: Date, default: Date.now },
  last_seen_at: { type: Date, default: Date.now },
  logout_at: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['active', 'logged_out', 'expired', 'force_logged_out'], 
    default: 'active' 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.LoginLog || mongoose.model('LoginLog', LoginLogSchema);
