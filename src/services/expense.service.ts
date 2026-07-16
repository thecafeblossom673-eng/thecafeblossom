import dbConnect from '../lib/mongodb';
import Expense from '../models/Expense';

export const expenseService = {
  async getExpenses(): Promise<any[]> {
    await dbConnect();
    const expenses = await Expense.find({}).sort({ created_at: -1 }).lean();
    return expenses.map(e => ({
      ...e,
      id: e._id.toString()
    }));
  },

  async addExpense(category: 'raw_material' | 'electricity' | 'other', amount: number, description: string): Promise<any> {
    await dbConnect();
    const exp = await Expense.create({ category, amount, description });
    return { ...exp.toObject(), id: exp._id.toString() };
  },

  async deleteExpense(expenseId: string): Promise<void> {
    await dbConnect();
    await Expense.deleteOne({ _id: expenseId });
  }
};
