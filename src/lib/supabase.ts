import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if credentials are placeholders
export const isMockMode =
  !supabaseUrl ||
  supabaseUrl.includes('your-project-id') ||
  !supabaseAnonKey ||
  supabaseAnonKey.includes('your-anon-public-key');

// Initialize the real supabase client
export const supabase = !isMockMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Interfaces mapping the database tables
export interface Table {
  id: string;
  table_number: number;
  status: 'free' | 'occupied';
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  sort_order: number;
}

export interface Order {
  id: string;
  table_id: string;
  status: 'open' | 'billed' | 'closed';
  customer_phone: string | null;
  created_at: string;
  tables?: Table; // joined
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_at_order: number;
  notes: string | null;
  menu_items?: MenuItem; // joined
}

export interface Bill {
  id: string;
  order_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  parcel_charge?: number;
  extra_charge?: number;
  extra_charge_label?: string | null;
  payment_method?: 'cash' | 'online' | 'split';
  cash_amount?: number;
  online_amount?: number;
  whatsapp_sent_at: string | null;
  created_at: string;
  orders?: {
    id: string;
    table_id: string;
    customer_phone: string | null;
    tables?: Table;
  };
}

export interface Expense {
  id: string;
  category: 'raw_material' | 'electricity' | 'other';
  amount: number;
  description: string;
  created_at: string;
}

export interface DayClose {
  id: string;
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  notes: string;
  cash_revenue?: number;
  online_revenue?: number;
  created_at: string;
}

// -------------------------------------------------------------
// LOCALSTORAGE MOCK DATABASE ENGINE
// -------------------------------------------------------------
const MOCK_STORAGE_KEY = 'cafe_blossom_mock_db';

interface MockDB {
  tables: Table[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  orderItems: OrderItem[];
  bills: Bill[];
  expenses: Expense[];
  dayCloses: DayClose[];
  currentUser: { email: string } | null;
}

// Default Seed Data matching photos
const defaultMockDB = (): MockDB => {
  const categories: MenuCategory[] = [
    { id: 'cat-1', name: 'French Fries', sort_order: 1 },
    { id: 'cat-2', name: 'Burgers', sort_order: 2 },
    { id: 'cat-3', name: 'Grilled Sandwiches', sort_order: 3 },
    { id: 'cat-4', name: 'Pasta', sort_order: 4 },
    { id: 'cat-5', name: 'Cold Coffee', sort_order: 5 },
    { id: 'cat-6', name: 'Hot Coffee', sort_order: 6 },
    { id: 'cat-7', name: 'Milk Shake', sort_order: 7 },
    { id: 'cat-8', name: 'Mocktail', sort_order: 8 },
  ];

  const menuItems: MenuItem[] = [
    // Fries
    { id: 'item-1', category_id: 'cat-1', name: 'Plain Salted Fries', description: 'Classic salted potato fries', price: 80, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-2', category_id: 'cat-1', name: 'Peri Peri Masala Fries', description: 'Spicy peri-peri seasoned fries', price: 90, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-3', category_id: 'cat-1', name: 'Cheese Fries (peri peri)', description: 'Fries loaded with cheese and peri peri seasoning', price: 100, is_veg: true, is_available: true, sort_order: 3 },
    // Burgers
    { id: 'item-4', category_id: 'cat-2', name: 'Classic Veg Burger', description: 'Standard veg patty burger', price: 80, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-5', category_id: 'cat-2', name: 'Veg Cheese Burger', description: 'Veg patty burger with cheese slice', price: 90, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-6', category_id: 'cat-2', name: 'Corn Cheese Burger', description: 'Burger with sweet corn and melting cheese', price: 110, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-7', category_id: 'cat-2', name: 'Paneer Cheese Burger', description: 'Burger with paneer patty and cheese slice', price: 120, is_veg: true, is_available: true, sort_order: 4 },
    { id: 'item-8', category_id: 'cat-2', name: 'Classic Chicken Burger', description: 'Standard chicken patty burger', price: 120, is_veg: false, is_available: true, sort_order: 5 },
    { id: 'item-9', category_id: 'cat-2', name: 'Chicken Cheese Burger', description: 'Chicken burger with cheese slice', price: 130, is_veg: false, is_available: true, sort_order: 6 },
    { id: 'item-10', category_id: 'cat-2', name: 'Tandoori Veg Cheese Burger', description: 'Veg burger with tandoori sauce and cheese', price: 120, is_veg: true, is_available: true, sort_order: 7 },
    { id: 'item-11', category_id: 'cat-2', name: 'Tandoori Chicken Cheese Burger', description: 'Chicken burger with tandoori sauce and cheese', price: 140, is_veg: false, is_available: true, sort_order: 8 },
    // Sandwiches
    { id: 'item-12', category_id: 'cat-3', name: 'Veg Sandwich', description: 'Classic vegetable grilled sandwich', price: 80, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-13', category_id: 'cat-3', name: 'Veg Cheese Sandwich', description: 'Veg grilled sandwich with cheese', price: 100, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-14', category_id: 'cat-3', name: 'Corn Cheese Sandwich', description: 'Grilled sandwich with corn and cheese', price: 110, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-15', category_id: 'cat-3', name: 'Bombay Cheese Sandwich', description: 'Traditional Bombay style grilled potato and veg sandwich with cheese', price: 130, is_veg: true, is_available: true, sort_order: 4 },
    { id: 'item-16', category_id: 'cat-3', name: 'Paneer Cheese Sandwich', description: 'Grilled sandwich with paneer filling and cheese', price: 130, is_veg: true, is_available: true, sort_order: 5 },
    { id: 'item-17', category_id: 'cat-3', name: 'Tandoori Chicken Sandwich', description: 'Tandoori chicken filling in grilled sandwich', price: 150, is_veg: false, is_available: true, sort_order: 6 },
    // Pasta
    { id: 'item-18', category_id: 'cat-4', name: 'Alfredo Pasta (white sauce)', description: 'White Sauce, Mix Veggies, Macaroni, Cheese', price: 160, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-19', category_id: 'cat-4', name: 'Arrebitta Pasta (Red sauce)', description: 'Red Sauce, Mix Veggies, Macaroni, Cheese', price: 170, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-20', category_id: 'cat-4', name: 'Spicy Alfredo Pasta', description: 'White Sauce, Mix Veggies, Pesto Sauce, Cheese', price: 180, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-21', category_id: 'cat-4', name: 'Alfredo Chicken Pasta', description: 'Chicken, White Sauce, Mix Veggies, Macaroni, Cheese', price: 170, is_veg: false, is_available: true, sort_order: 4 },
    { id: 'item-22', category_id: 'cat-4', name: 'Arrebitta Chicken Pasta (Red sauce)', description: 'Chicken, Red Sauce, Mix Veggies, Macaroni, Cheese', price: 180, is_veg: false, is_available: true, sort_order: 5 },
    { id: 'item-23', category_id: 'cat-4', name: 'Spicy Alfredo Chicken Pasta', description: 'Chicken, Garlic, Pasta, Mix Veggies', price: 200, is_veg: false, is_available: true, sort_order: 6 },
    // Cold Coffee
    { id: 'item-24', category_id: 'cat-5', name: 'Thick Cold Coffee', description: 'Thick creamy blended cold coffee', price: 70, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-25', category_id: 'cat-5', name: 'Cold Coffee & Choco Crush', description: 'Blended cold coffee topped with chocolate crush', price: 80, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-26', category_id: 'cat-5', name: 'Cold Coffee & Icecream', description: 'Cold coffee served with vanilla/chocolate ice cream scoop', price: 90, is_veg: true, is_available: true, sort_order: 3 },
    // Hot Coffee
    { id: 'item-27', category_id: 'cat-6', name: 'Hot Coffee', description: 'Classic hot brewed coffee', price: 30, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-28', category_id: 'cat-6', name: 'Hot Chocolate', description: 'Rich warm liquid chocolate drink', price: 40, is_veg: true, is_available: true, sort_order: 2 },
    // Shakes
    { id: 'item-29', category_id: 'cat-7', name: 'Mango Milk Shake', description: 'Rich mango milkshake', price: 90, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-30', category_id: 'cat-7', name: 'Kitkat Milk Shake', description: 'Milkshake blended with Kitkat chocolate bar', price: 90, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-31', category_id: 'cat-7', name: 'Strawberry Milk Shake', description: 'Sweet strawberry flavored milkshake', price: 90, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-32', category_id: 'cat-7', name: 'Oreo Milk Shake', description: 'Milkshake blended with Oreo cookies', price: 90, is_veg: true, is_available: true, sort_order: 4 },
    { id: 'item-33', category_id: 'cat-7', name: 'Butterscotch Milk Shake', description: 'Butterscotch milkshake topped with syrup', price: 90, is_veg: true, is_available: true, sort_order: 5 },
    // Mocktails
    { id: 'item-34', category_id: 'cat-8', name: 'Ice Tea', description: 'Classic lemon/peach iced tea', price: 100, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-35', category_id: 'cat-8', name: 'Ocean water (Blue lagoon)', description: 'Refreshing blue curacao flavored mocktail', price: 100, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-36', category_id: 'cat-8', name: 'Sparkling Mint (Mojito)', description: 'Mint and lime sparkling mojito', price: 100, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-37', category_id: 'cat-8', name: 'Watermelon Fizz', description: 'Fizzy watermelon sweet mocktail', price: 100, is_veg: true, is_available: true, sort_order: 4 },
    { id: 'item-38', category_id: 'cat-8', name: 'Green Apple Mojito', description: 'Green apple flavored sparkling mojito', price: 100, is_veg: true, is_available: true, sort_order: 5 },
    { id: 'item-39', category_id: 'cat-8', name: 'Guava Colada', description: 'Coconut and guava flavored tropical mocktail', price: 100, is_veg: true, is_available: true, sort_order: 6 },
  ];

  const tables: Table[] = Array.from({ length: 10 }, (_, i) => ({
    id: `table-${i + 1}`,
    table_number: i + 1,
    status: 'free',
  }));

  return {
    tables,
    categories,
    menuItems,
    orders: [],
    orderItems: [],
    bills: [],
    expenses: [],
    dayCloses: [],
    currentUser: null,
  };
};

// Helper to get mock DB
const getMockData = (): MockDB => {
  if (typeof window === 'undefined') return defaultMockDB();
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!data) {
    const fresh = defaultMockDB();
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  return JSON.parse(data);
};

// Helper to save mock DB
const saveMockData = (db: MockDB) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
};
