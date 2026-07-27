import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';
import dbConnect from '@/lib/mongodb';
import MenuCategory from '@/models/MenuCategory';
import MenuItem from '@/models/MenuItem';
import Table from '@/models/Table';
import { revalidatePath } from 'next/cache';


export async function GET() {
  try {
    await seedDatabase();

    // Force invalidate Next.js cache so fresh data is served immediately
    try {
      revalidatePath('/', 'layout');
    } catch (e) {
      // ignore cache errors
    }

    // Return counts so we can verify data was inserted
    await dbConnect();
    const [tables, categories, items] = await Promise.all([
      Table.countDocuments(),
      MenuCategory.countDocuments(),
      MenuItem.countDocuments(),
    ]);

    return NextResponse.json({
      message: 'Database seeded successfully.',
      counts: { tables, categories, menuItems: items },
      cacheInvalidated: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
