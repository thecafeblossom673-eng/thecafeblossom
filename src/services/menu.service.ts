import dbConnect from '../lib/mongodb';
import MenuCategory from '../models/MenuCategory';
import MenuItem from '../models/MenuItem';
import { MenuCategory as MenuCategoryType, MenuItem as MenuItemType } from '../types';

export const menuService = {
  async getCategories(): Promise<MenuCategoryType[]> {
    await dbConnect();
    const categories = await MenuCategory.find({}).sort({ sort_order: 1 }).lean();
    return categories.map(c => ({
      id: c._id.toString(),
      name: c.name,
      sort_order: c.sort_order
    }));
  },

  async getMenuItems(): Promise<MenuItemType[]> {
    await dbConnect();
    const items = await MenuItem.find({}).sort({ sort_order: 1 }).lean();
    return items.map(i => ({
      id: i._id.toString(),
      category_id: i.category_id.toString(),
      name: i.name,
      description: i.description,
      price: i.price,
      is_veg: i.is_veg,
      is_available: i.is_available,
      sort_order: i.sort_order
    }));
  }
};
