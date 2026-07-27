import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import dbConnect from '../lib/mongodb';
import DayClose from '../models/DayClose';
import DayOpen from '../models/DayOpen';
import Offer from '../models/Offer';
import Review from '../models/Review';
import LoginLog from '../models/LoginLog';

const fetchOfferFromDb = async (): Promise<any | null> => {
  await dbConnect();
  const offer = await Offer.findOne({}).sort({ updatedAt: -1 }).lean();
  if (!offer) return null;
  return { ...offer, id: offer._id.toString() };
};

const getCachedOffer = unstable_cache(
  fetchOfferFromDb,
  ['running-offer'],
  { revalidate: 3600, tags: ['offers'] }
);

export const adminService = {
  async getDayCloses(): Promise<any[]> {
    await dbConnect();
    const dcs = await DayClose.find({}).sort({ created_at: -1 }).lean();
    return dcs.map(dc => ({
      ...dc,
      id: dc._id.toString()
    }));
  },

  async closeDay(
    date: string,
    revenue: number,
    expenses: number,
    profit: number,
    notes: string,
    cashRevenue: number = 0,
    onlineRevenue: number = 0
  ): Promise<any> {
    await dbConnect();
    
    const exists = await DayClose.findOne({ date });
    if (exists) {
      throw new Error(`Day ${date} is already closed.`);
    }

    const dc = await DayClose.create({
      date,
      revenue,
      expenses,
      profit,
      notes,
      cash_revenue: cashRevenue,
      online_revenue: onlineRevenue
    });
    
    return { ...dc.toObject(), id: dc._id.toString() };
  },

  async isDayClosed(date: string): Promise<boolean> {
    await dbConnect();
    const dc = await DayClose.findOne({ date }).lean();
    return !!dc;
  },

  async getDayOpens(): Promise<any[]> {
    await dbConnect();
    const dos = await DayOpen.find({}).sort({ created_at: -1 }).lean();
    return dos.map(d => ({
      ...d,
      id: d._id.toString()
    }));
  },

  async openDay(date: string, openingCash: number = 0): Promise<any> {
    await dbConnect();
    const exists = await DayOpen.findOne({ date });
    if (exists) {
      throw new Error(`Day ${date} is already open.`);
    }
    const d = await DayOpen.create({ date, opening_cash: openingCash });
    return { ...d.toObject(), id: d._id.toString() };
  },

  async isDayOpen(date: string): Promise<boolean> {
    await dbConnect();
    const d = await DayOpen.findOne({ date }).lean();
    return !!d;
  },

  async reopenDay(date: string): Promise<void> {
    await dbConnect();
    await DayClose.deleteOne({ date });
  },

  async getSystemStatus(date: string): Promise<{ isOpen: boolean; isClosed: boolean; isLocked: boolean }> {
    await dbConnect();
    const [openDoc, closeDoc] = await Promise.all([
      DayOpen.findOne({ date }).lean(),
      DayClose.findOne({ date }).lean()
    ]);
    const isOpen = !!openDoc;
    const isClosed = !!closeDoc;
    // Locked if not opened yet, OR if already closed.
    const isLocked = !isOpen || isClosed;
    return { isOpen, isClosed, isLocked };
  },

  async getOffers(): Promise<any[]> {
    await dbConnect();
    const offers = await Offer.find({}).sort({ updatedAt: -1 }).lean();
    return offers.map(o => ({
      ...o,
      id: o._id.toString()
    }));
  },

  async getOffer(id?: string): Promise<any | null> {
    if (!id) return await getCachedOffer();
    await dbConnect();
    const offer = await Offer.findById(id).lean();
    if (!offer) return null;
    return { ...offer, id: (offer as any)._id.toString() };
  },

  async createOffer(offerData: any): Promise<any> {
    await dbConnect();
    const offer = await Offer.create(offerData);
    try {
      (revalidateTag as any)('offers');
      (revalidateTag as any)('menu');
      revalidatePath('/', 'layout');
    } catch (e) {
      console.error('Cache revalidation error:', e);
    }
    return { ...offer.toObject(), id: offer._id.toString() };
  },

  async updateOffer(id: string, offerData: any): Promise<any> {
    await dbConnect();
    const updated = await Offer.findByIdAndUpdate(id, offerData, { new: true }).lean();
    try {
      (revalidateTag as any)('offers');
      (revalidateTag as any)('menu');
      revalidatePath('/', 'layout');
    } catch (e) {
      console.error('Cache revalidation error:', e);
    }
    if (!updated) return null;
    return { ...updated, id: (updated as any)._id.toString() };
  },

  async deleteOffer(id: string): Promise<void> {
    await dbConnect();
    await Offer.findByIdAndDelete(id);
    try {
      (revalidateTag as any)('offers');
      (revalidateTag as any)('menu');
      revalidatePath('/', 'layout');
    } catch (e) {
      console.error('Cache revalidation error:', e);
    }
  },

  async saveOffer(offerData: any): Promise<void> {
    await dbConnect();
    if (offerData.id || offerData._id) {
      const offerId = offerData.id || offerData._id;
      await Offer.findByIdAndUpdate(offerId, offerData);
    } else {
      await Offer.create(offerData);
    }
    try {
      (revalidateTag as any)('offers');
      (revalidateTag as any)('menu');
      revalidatePath('/', 'layout');
    } catch (e) {
      console.error('Cache revalidation error:', e);
    }
  },

  async getReviews(): Promise<any[]> {
    await dbConnect();
    const reviews = await Review.find({}).sort({ created_at: -1 }).lean();
    return reviews.map(r => ({
      ...r,
      id: r._id.toString()
    }));
  },

  async addReview(reviewData: { rating: number; comment: string; table_number: number | null }): Promise<void> {
    await dbConnect();
    await Review.create(reviewData);
  },

  async recordLoginSession(deviceInfo: string, ipAddress: string): Promise<string> {
    await dbConnect();
    const session = await LoginLog.create({
      user_role: 'Staff Portal',
      device_info: deviceInfo || 'Unknown Device',
      ip_address: ipAddress || 'Local Network',
      login_at: new Date(),
      last_seen_at: new Date(),
      status: 'active'
    });
    return session._id.toString();
  },

  async sendSessionHeartbeat(sessionId: string): Promise<{ valid: boolean; forceLogout: boolean }> {
    if (!sessionId) return { valid: false, forceLogout: false };
    await dbConnect();
    const session = await LoginLog.findById(sessionId);
    if (!session) return { valid: false, forceLogout: false };

    if (session.status === 'force_logged_out') {
      return { valid: false, forceLogout: true };
    }

    if (session.status === 'logged_out') {
      return { valid: false, forceLogout: false };
    }

    // Keep session active and refresh timestamp
    session.status = 'active';
    session.last_seen_at = new Date();
    await session.save();
    return { valid: true, forceLogout: false };
  },

  async recordLogoutSession(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await dbConnect();
    await LoginLog.findByIdAndUpdate(sessionId, {
      status: 'logged_out',
      logout_at: new Date()
    });
  },

  async forceLogoutSession(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await dbConnect();
    await LoginLog.findByIdAndUpdate(sessionId, {
      status: 'force_logged_out',
      logout_at: new Date()
    });
  },

  async getLoginSessions(): Promise<any[]> {
    await dbConnect();
    const now = Date.now();
    const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000);

    // Auto-expire active sessions that missed heartbeats for over 15 minutes
    await LoginLog.updateMany(
      { status: 'active', last_seen_at: { $lt: fifteenMinutesAgo } },
      { $set: { status: 'expired' } }
    );

    const logs = await LoginLog.find({}).sort({ login_at: -1 }).limit(100).lean();
    return logs.map(l => ({
      ...l,
      id: l._id.toString()
    }));
  },

  async clearLoginHistory(currentSessionId?: string): Promise<void> {
    await dbConnect();
    const filter: any = { status: { $ne: 'active' } };
    if (currentSessionId) {
      filter._id = { $ne: currentSessionId };
    }
    await LoginLog.deleteMany(filter);
  },

  async deleteLoginLog(sessionId: string): Promise<void> {
    await dbConnect();
    await LoginLog.findByIdAndDelete(sessionId);
  }
};
