import dbConnect from '../lib/mongodb';
import DayClose from '../models/DayClose';
import DayOpen from '../models/DayOpen';
import Offer from '../models/Offer';
import Review from '../models/Review';

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

  async getOffer(): Promise<any | null> {
    await dbConnect();
    const offer = await Offer.findOne({}).sort({ updatedAt: -1 }).lean();
    if (!offer) return null;
    return { ...offer, id: offer._id.toString() };
  },

  async saveOffer(offerData: any): Promise<void> {
    await dbConnect();
    // Delete existing offers to maintain single active offer
    await Offer.deleteMany({});
    await Offer.create(offerData);
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
  }
};
