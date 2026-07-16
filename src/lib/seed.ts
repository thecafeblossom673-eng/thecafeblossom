import dbConnect from './mongodb';
import Table from '../models/Table';
import MenuCategory from '../models/MenuCategory';
import MenuItem from '../models/MenuItem';
import Offer from '../models/Offer';

export async function seedDatabase() {
  try {
    await dbConnect();

    // 1. Seed Tables
    const tablesCount = await Table.countDocuments();
    if (tablesCount === 0) {
      console.log('Seeding tables...');
      const tables = Array.from({ length: 10 }, (_, i) => ({
        table_number: i + 1,
        status: 'free'
      }));
      await Table.insertMany(tables);
      console.log('Successfully seeded 10 tables.');
    }

    // 2. Seed Categories and Menu Items
    const categoriesCount = await MenuCategory.countDocuments();
    if (categoriesCount === 0) {
      console.log('Seeding categories and menu items...');
      
      const categories = [
        { name: 'French Fries', sort_order: 1 },
        { name: 'Burgers', sort_order: 2 },
        { name: 'Grilled Sandwiches', sort_order: 3 },
        { name: 'Pasta', sort_order: 4 },
        { name: 'Cold Coffee', sort_order: 5 },
        { name: 'Hot Coffee', sort_order: 6 },
        { name: 'Milk Shake', sort_order: 7 },
        { name: 'Mocktail', sort_order: 8 },
      ];

      const insertedCats = await MenuCategory.insertMany(categories);
      
      // Helper to find category by name
      const getCatId = (name: string) => insertedCats.find(c => c.name === name)?._id;

      const menuItems = [
        // Fries
        { category_id: getCatId('French Fries'), name: 'Plain Salted Fries', description: 'Classic salted potato fries', price: 80, is_veg: true, is_available: true, sort_order: 1 },
        { category_id: getCatId('French Fries'), name: 'Peri Peri Masala Fries', description: 'Spicy peri-peri seasoned fries', price: 90, is_veg: true, is_available: true, sort_order: 2 },
        { category_id: getCatId('French Fries'), name: 'Cheese Fries (peri peri)', description: 'Fries loaded with cheese and peri peri seasoning', price: 100, is_veg: true, is_available: true, sort_order: 3 },
        // Burgers
        { category_id: getCatId('Burgers'), name: 'Classic Veg Burger', description: 'Standard veg patty burger', price: 80, is_veg: true, is_available: true, sort_order: 1 },
        { category_id: getCatId('Burgers'), name: 'Veg Cheese Burger', description: 'Veg patty burger with cheese slice', price: 90, is_veg: true, is_available: true, sort_order: 2 },
        { category_id: getCatId('Burgers'), name: 'Corn Cheese Burger', description: 'Burger with sweet corn and melting cheese', price: 110, is_veg: true, is_available: true, sort_order: 3 },
        { category_id: getCatId('Burgers'), name: 'Paneer Cheese Burger', description: 'Burger with paneer patty and cheese slice', price: 120, is_veg: true, is_available: true, sort_order: 4 },
        { category_id: getCatId('Burgers'), name: 'Classic Chicken Burger', description: 'Standard chicken patty burger', price: 120, is_veg: false, is_available: true, sort_order: 5 },
        { category_id: getCatId('Burgers'), name: 'Chicken Cheese Burger', description: 'Chicken burger with cheese slice', price: 130, is_veg: false, is_available: true, sort_order: 6 },
        { category_id: getCatId('Burgers'), name: 'Tandoori Veg Cheese Burger', description: 'Veg burger with tandoori sauce and cheese', price: 120, is_veg: true, is_available: true, sort_order: 7 },
        { category_id: getCatId('Burgers'), name: 'Tandoori Chicken Cheese Burger', description: 'Chicken burger with tandoori sauce and cheese', price: 140, is_veg: false, is_available: true, sort_order: 8 },
        // Sandwiches
        { category_id: getCatId('Grilled Sandwiches'), name: 'Veg Sandwich', description: 'Classic vegetable grilled sandwich', price: 80, is_veg: true, is_available: true, sort_order: 1 },
        { category_id: getCatId('Grilled Sandwiches'), name: 'Veg Cheese Sandwich', description: 'Veg grilled sandwich with cheese', price: 100, is_veg: true, is_available: true, sort_order: 2 },
        { category_id: getCatId('Grilled Sandwiches'), name: 'Corn Cheese Sandwich', description: 'Grilled sandwich with corn and cheese', price: 110, is_veg: true, is_available: true, sort_order: 3 },
        { category_id: getCatId('Grilled Sandwiches'), name: 'Bombay Cheese Sandwich', description: 'Traditional Bombay style grilled potato and veg sandwich with cheese', price: 130, is_veg: true, is_available: true, sort_order: 4 },
        { category_id: getCatId('Grilled Sandwiches'), name: 'Paneer Cheese Sandwich', description: 'Grilled sandwich with paneer filling and cheese', price: 130, is_veg: true, is_available: true, sort_order: 5 },
        { category_id: getCatId('Grilled Sandwiches'), name: 'Tandoori Chicken Sandwich', description: 'Tandoori chicken filling in grilled sandwich', price: 150, is_veg: false, is_available: true, sort_order: 6 },
        // Pasta
        { category_id: getCatId('Pasta'), name: 'Alfredo Pasta (white sauce)', description: 'White Sauce, Mix Veggies, Macaroni, Cheese', price: 160, is_veg: true, is_available: true, sort_order: 1 },
        { category_id: getCatId('Pasta'), name: 'Arrebitta Pasta (Red sauce)', description: 'Red Sauce, Mix Veggies, Macaroni, Cheese', price: 170, is_veg: true, is_available: true, sort_order: 2 },
        { category_id: getCatId('Pasta'), name: 'Spicy Alfredo Pasta', description: 'White Sauce, Mix Veggies, Pesto Sauce, Cheese', price: 180, is_veg: true, is_available: true, sort_order: 3 },
        { category_id: getCatId('Pasta'), name: 'Alfredo Chicken Pasta', description: 'Chicken, White Sauce, Mix Veggies, Macaroni, Cheese', price: 170, is_veg: false, is_available: true, sort_order: 4 },
        { category_id: getCatId('Pasta'), name: 'Arrebitta Chicken Pasta (Red sauce)', description: 'Chicken, Red Sauce, Mix Veggies, Macaroni, Cheese', price: 180, is_veg: false, is_available: true, sort_order: 5 },
        { category_id: getCatId('Pasta'), name: 'Spicy Alfredo Chicken Pasta', description: 'Chicken, Garlic, Pasta, Mix Veggies', price: 200, is_veg: false, is_available: true, sort_order: 6 },
        // Cold Coffee
        { category_id: getCatId('Cold Coffee'), name: 'Thick Cold Coffee', description: 'Thick creamy blended cold coffee', price: 70, is_veg: true, is_available: true, sort_order: 1 },
        { category_id: getCatId('Cold Coffee'), name: 'Cold Coffee & Choco Crush', description: 'Blended cold coffee topped with chocolate crush', price: 80, is_veg: true, is_available: true, sort_order: 2 },
        { category_id: getCatId('Cold Coffee'), name: 'Cold Coffee & Icecream', description: 'Cold coffee served with vanilla/chocolate ice cream scoop', price: 90, is_veg: true, is_available: true, sort_order: 3 },
        // Hot Coffee
        { category_id: getCatId('Hot Coffee'), name: 'Hot Coffee', description: 'Classic hot brewed coffee', price: 30, is_veg: true, is_available: true, sort_order: 1 },
        { category_id: getCatId('Hot Coffee'), name: 'Hot Chocolate', description: 'Rich warm liquid chocolate drink', price: 40, is_veg: true, is_available: true, sort_order: 2 },
        // Shakes
        { category_id: getCatId('Milk Shake'), name: 'Mango Milk Shake', description: 'Rich mango milkshake', price: 90, is_veg: true, is_available: true, sort_order: 1 },
        { category_id: getCatId('Milk Shake'), name: 'Kitkat Milk Shake', description: 'Milkshake blended with Kitkat chocolate bar', price: 90, is_veg: true, is_available: true, sort_order: 2 },
        { category_id: getCatId('Milk Shake'), name: 'Strawberry Milk Shake', description: 'Sweet strawberry flavored milkshake', price: 90, is_veg: true, is_available: true, sort_order: 3 },
        { category_id: getCatId('Milk Shake'), name: 'Oreo Milk Shake', description: 'Milkshake blended with Oreo cookies', price: 90, is_veg: true, is_available: true, sort_order: 4 },
        { category_id: getCatId('Milk Shake'), name: 'Butterscotch Milk Shake', description: 'Butterscotch milkshake topped with syrup', price: 90, is_veg: true, is_available: true, sort_order: 5 },
        // Mocktails
        { category_id: getCatId('Mocktail'), name: 'Ice Tea', description: 'Classic lemon/peach iced tea', price: 100, is_veg: true, is_available: true, sort_order: 1 },
        { category_id: getCatId('Mocktail'), name: 'Ocean water (Blue lagoon)', description: 'Refreshing blue curacao flavored mocktail', price: 100, is_veg: true, is_available: true, sort_order: 2 },
        { category_id: getCatId('Mocktail'), name: 'Sparkling Mint (Mojito)', description: 'Mint and lime sparkling mojito', price: 100, is_veg: true, is_available: true, sort_order: 3 },
        { category_id: getCatId('Mocktail'), name: 'Watermelon Fizz', description: 'Fizzy watermelon sweet mocktail', price: 100, is_veg: true, is_available: true, sort_order: 4 },
        { category_id: getCatId('Mocktail'), name: 'Green Apple Mojito', description: 'Green apple flavored sparkling mojito', price: 100, is_veg: true, is_available: true, sort_order: 5 },
        { category_id: getCatId('Mocktail'), name: 'Guava Colada', description: 'Coconut and guava flavored tropical mocktail', price: 100, is_veg: true, is_available: true, sort_order: 6 },
      ];

      await MenuItem.insertMany(menuItems);
      console.log('Successfully seeded categories and menu items.');
    }

    // 3. Seed Offer if none exists
    const offersCount = await Offer.countDocuments();
    if (offersCount === 0) {
      console.log('Seeding default offer...');
      await Offer.create({
        title: 'Combo Offer',
        description: 'Burger + Fries + Cold Coffee',
        badge: 'Popular',
        price: 199,
        image_url: 'https://images.unsplash.com/photo-1594212585093-6113b2c15982'
      });
    }

  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}
