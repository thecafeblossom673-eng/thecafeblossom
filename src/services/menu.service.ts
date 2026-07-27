import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import dbConnect from '../lib/mongodb';
import MenuCategory from '../models/MenuCategory';
import MenuItem from '../models/MenuItem';
import { MenuCategory as MenuCategoryType, MenuItem as MenuItemType } from '../types';

const fetchCategoriesFromDb = async (): Promise<MenuCategoryType[]> => {
  await dbConnect();
  const categories = await MenuCategory.find({}).sort({ sort_order: 1 }).lean();
  return categories.map(c => ({
    id: c._id.toString(),
    name: c.name,
    sort_order: c.sort_order
  }));
};

const fetchMenuItemsFromDb = async (): Promise<MenuItemType[]> => {
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
};

const getCachedCategories = unstable_cache(
  fetchCategoriesFromDb,
  ['categories-list'],
  { revalidate: 60, tags: ['menu', 'categories'] }
);

const getCachedMenuItems = unstable_cache(
  fetchMenuItemsFromDb,
  ['menu-items-list'],
  { revalidate: 60, tags: ['menu', 'items'] }
);

export const menuService = {
  async getCategories(): Promise<MenuCategoryType[]> {
    return await getCachedCategories();
  },

  async getMenuItems(): Promise<MenuItemType[]> {
    return await getCachedMenuItems();
  },

  async invalidateMenuCache(): Promise<void> {
    try {
      (revalidateTag as any)('menu');
      revalidatePath('/', 'layout');
    } catch (e) {
      console.error('Cache invalidation error:', e);
    }
  }
};
