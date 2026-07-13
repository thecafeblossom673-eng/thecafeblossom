import { supabase, isMockMode, Table, MenuCategory, MenuItem, Order, OrderItem, Bill, Expense, DayClose } from './supabase';

// Mock DB LocalStorage Helpers (defined inside to access dynamically on client side)
const MOCK_STORAGE_KEY = 'cafe_blossom_mock_db';

// Default seed data - must match supabase.ts
const buildDefaultMockDB = () => ({
  tables: Array.from({ length: 10 }, (_, i) => ({
    id: `table-${i + 1}`,
    table_number: i + 1,
    status: 'free' as const,
  })),
  categories: [
    { id: 'cat-1', name: 'French Fries', sort_order: 1 },
    { id: 'cat-2', name: 'Burgers', sort_order: 2 },
    { id: 'cat-3', name: 'Grilled Sandwiches', sort_order: 3 },
    { id: 'cat-4', name: 'Pasta', sort_order: 4 },
    { id: 'cat-5', name: 'Cold Coffee', sort_order: 5 },
    { id: 'cat-6', name: 'Hot Coffee', sort_order: 6 },
    { id: 'cat-7', name: 'Milk Shake', sort_order: 7 },
    { id: 'cat-8', name: 'Mocktail', sort_order: 8 },
  ],
  menuItems: [
    { id: 'item-1', category_id: 'cat-1', name: 'Plain Salted Fries', description: 'Classic salted potato fries', price: 80, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-2', category_id: 'cat-1', name: 'Peri Peri Masala Fries', description: 'Spicy peri-peri seasoned fries', price: 90, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-3', category_id: 'cat-1', name: 'Cheese Fries (peri peri)', description: 'Fries loaded with cheese and peri peri seasoning', price: 100, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-4', category_id: 'cat-2', name: 'Classic Veg Burger', description: 'Standard veg patty burger', price: 80, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-5', category_id: 'cat-2', name: 'Veg Cheese Burger', description: 'Veg patty burger with cheese slice', price: 90, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-6', category_id: 'cat-2', name: 'Corn Cheese Burger', description: 'Burger with sweet corn and melting cheese', price: 110, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-7', category_id: 'cat-2', name: 'Paneer Cheese Burger', description: 'Burger with paneer patty and cheese slice', price: 120, is_veg: true, is_available: true, sort_order: 4 },
    { id: 'item-8', category_id: 'cat-2', name: 'Classic Chicken Burger', description: 'Standard chicken patty burger', price: 120, is_veg: false, is_available: true, sort_order: 5 },
    { id: 'item-9', category_id: 'cat-2', name: 'Chicken Cheese Burger', description: 'Chicken burger with cheese slice', price: 130, is_veg: false, is_available: true, sort_order: 6 },
    { id: 'item-10', category_id: 'cat-2', name: 'Tandoori Veg Cheese Burger', description: 'Veg burger with tandoori sauce and cheese', price: 120, is_veg: true, is_available: true, sort_order: 7 },
    { id: 'item-11', category_id: 'cat-2', name: 'Tandoori Chicken Cheese Burger', description: 'Chicken burger with tandoori sauce and cheese', price: 140, is_veg: false, is_available: true, sort_order: 8 },
    { id: 'item-12', category_id: 'cat-3', name: 'Veg Sandwich', description: 'Classic vegetable grilled sandwich', price: 80, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-13', category_id: 'cat-3', name: 'Veg Cheese Sandwich', description: 'Veg grilled sandwich with cheese', price: 100, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-14', category_id: 'cat-3', name: 'Corn Cheese Sandwich', description: 'Grilled sandwich with corn and cheese', price: 110, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-15', category_id: 'cat-3', name: 'Bombay Cheese Sandwich', description: 'Bombay style grilled sandwich with cheese', price: 130, is_veg: true, is_available: true, sort_order: 4 },
    { id: 'item-16', category_id: 'cat-3', name: 'Paneer Cheese Sandwich', description: 'Grilled sandwich with paneer filling and cheese', price: 130, is_veg: true, is_available: true, sort_order: 5 },
    { id: 'item-17', category_id: 'cat-3', name: 'Tandoori Chicken Sandwich', description: 'Tandoori chicken filling in grilled sandwich', price: 150, is_veg: false, is_available: true, sort_order: 6 },
    { id: 'item-18', category_id: 'cat-4', name: 'Alfredo Pasta (white sauce)', description: 'White Sauce, Mix Veggies, Macaroni, Cheese', price: 160, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-19', category_id: 'cat-4', name: 'Arrebitta Pasta (Red sauce)', description: 'Red Sauce, Mix Veggies, Macaroni, Cheese', price: 170, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-20', category_id: 'cat-4', name: 'Spicy Alfredo Pasta', description: 'White Sauce, Mix Veggies, Pesto Sauce, Cheese', price: 180, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-21', category_id: 'cat-4', name: 'Alfredo Chicken Pasta', description: 'Chicken, White Sauce, Mix Veggies, Macaroni, Cheese', price: 170, is_veg: false, is_available: true, sort_order: 4 },
    { id: 'item-22', category_id: 'cat-4', name: 'Arrebitta Chicken Pasta (Red sauce)', description: 'Chicken, Red Sauce, Mix Veggies, Macaroni, Cheese', price: 180, is_veg: false, is_available: true, sort_order: 5 },
    { id: 'item-23', category_id: 'cat-4', name: 'Spicy Alfredo Chicken Pasta', description: 'Chicken, Garlic, Pasta, Mix Veggies', price: 200, is_veg: false, is_available: true, sort_order: 6 },
    { id: 'item-24', category_id: 'cat-5', name: 'Thick Cold Coffee', description: 'Thick creamy blended cold coffee', price: 70, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-25', category_id: 'cat-5', name: 'Cold Coffee & Choco Crush', description: 'Blended cold coffee topped with chocolate crush', price: 80, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-26', category_id: 'cat-5', name: 'Cold Coffee & Icecream', description: 'Cold coffee served with ice cream scoop', price: 90, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-27', category_id: 'cat-6', name: 'Hot Coffee', description: 'Classic hot brewed coffee', price: 30, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-28', category_id: 'cat-6', name: 'Hot Chocolate', description: 'Rich warm liquid chocolate drink', price: 40, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-29', category_id: 'cat-7', name: 'Mango Milk Shake', description: 'Rich mango milkshake', price: 90, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-30', category_id: 'cat-7', name: 'Kitkat Milk Shake', description: 'Milkshake blended with Kitkat chocolate bar', price: 90, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-31', category_id: 'cat-7', name: 'Strawberry Milk Shake', description: 'Sweet strawberry flavored milkshake', price: 90, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-32', category_id: 'cat-7', name: 'Oreo Milk Shake', description: 'Milkshake blended with Oreo cookies', price: 90, is_veg: true, is_available: true, sort_order: 4 },
    { id: 'item-33', category_id: 'cat-7', name: 'Butterscotch Milk Shake', description: 'Butterscotch milkshake topped with syrup', price: 90, is_veg: true, is_available: true, sort_order: 5 },
    { id: 'item-34', category_id: 'cat-8', name: 'Ice Tea', description: 'Classic lemon/peach iced tea', price: 100, is_veg: true, is_available: true, sort_order: 1 },
    { id: 'item-35', category_id: 'cat-8', name: 'Ocean water (Blue lagoon)', description: 'Refreshing blue curacao flavored mocktail', price: 100, is_veg: true, is_available: true, sort_order: 2 },
    { id: 'item-36', category_id: 'cat-8', name: 'Sparkling Mint (Mojito)', description: 'Mint and lime sparkling mojito', price: 100, is_veg: true, is_available: true, sort_order: 3 },
    { id: 'item-37', category_id: 'cat-8', name: 'Watermelon Fizz', description: 'Fizzy watermelon sweet mocktail', price: 100, is_veg: true, is_available: true, sort_order: 4 },
    { id: 'item-38', category_id: 'cat-8', name: 'Green Apple Mojito', description: 'Green apple flavored sparkling mojito', price: 100, is_veg: true, is_available: true, sort_order: 5 },
    { id: 'item-39', category_id: 'cat-8', name: 'Guava Colada', description: 'Coconut and guava flavored tropical mocktail', price: 100, is_veg: true, is_available: true, sort_order: 6 },
  ],
  orders: [] as Order[],
  orderItems: [] as OrderItem[],
  bills: [] as Bill[],
  expenses: [] as Expense[],
  dayCloses: [] as DayClose[],
  currentUser: null as { email: string } | null,
});

const getMockData = (): any => {
  if (typeof window === 'undefined') return buildDefaultMockDB();
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!data) {
    const fresh = buildDefaultMockDB();
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  const parsed = JSON.parse(data);
  let updated = false;
  if (!parsed.tables || parsed.tables.length < 10) {
    parsed.tables = buildDefaultMockDB().tables;
    updated = true;
  }
  if (!parsed.expenses) {
    parsed.expenses = [];
    updated = true;
  }
  if (!parsed.dayCloses) {
    parsed.dayCloses = [];
    updated = true;
  }
  if (updated) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(parsed));
  }
  return parsed;
};

const saveMockData = (db: any) => {
  if (typeof window === 'undefined') return;
  db.lastUpdated = Date.now();
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
  
  // Async push to server
  fetch('/api/mock-db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(db),
  }).catch((err) => console.warn('Mock DB sync push failed:', err));
};

export const db = {
  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  async getCurrentUser() {
    if (isMockMode) {
      if (typeof window === 'undefined') return null;
      const data = getMockData();
      return data?.currentUser || null;
    }
    const { data: { user } } = await supabase!.auth.getUser();
    return user ? { email: user.email } : null;
  },

  async signIn(email: string, password: string) {
    if (isMockMode) {
      const data = getMockData();
      // For mock mode, accept any password longer than 3 characters, or admin@blossom.com / password
      if (password.length >= 4) {
        data.currentUser = { email };
        saveMockData(data);
        return { data: { user: { email } }, error: null };
      }
      return { data: null, error: new Error('Invalid email or password (mock requires password >= 4 chars)') };
    }
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  async signOut() {
    if (isMockMode) {
      const data = getMockData();
      data.currentUser = null;
      saveMockData(data);
      return { error: null };
    }
    const { error } = await supabase!.auth.signOut();
    return { error };
  },

  // -------------------------------------------------------------
  // TABLES
  // -------------------------------------------------------------
  async getTables() {
    if (isMockMode) {
      const data = getMockData();
      const tables = data.tables as Table[];
      const orders = data.orders as Order[];
      const orderItems = data.orderItems as OrderItem[];

      return tables.map(table => {
        const activeOrder = orders.find(o => o.table_id === table.id && o.status !== 'closed');
        let itemsCount = 0;
        let totalAmount = 0;

        if (activeOrder) {
          const items = orderItems.filter(oi => oi.order_id === activeOrder.id);
          itemsCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
          totalAmount = items.reduce((acc, curr) => acc + curr.quantity * curr.price_at_order, 0);
        }

        return {
          ...table,
          activeOrder: activeOrder ? {
            ...activeOrder,
            itemsCount,
            totalAmount
          } : null
        };
      });
    }

    // Real Supabase queries
    const { data: tables, error: tablesError } = await supabase!
      .from('tables')
      .select('*')
      .order('table_number');

    if (tablesError) throw tablesError;

    // Fetch active orders and order items to compute summary
    const { data: activeOrders, error: ordersError } = await supabase!
      .from('orders')
      .select('*, order_items(*, menu_items(*))')
      .neq('status', 'closed');

    if (ordersError) throw ordersError;

    return tables.map((table: Table) => {
      const activeOrder = activeOrders.find((o: any) => o.table_id === table.id);
      let itemsCount = 0;
      let totalAmount = 0;

      if (activeOrder) {
        itemsCount = activeOrder.order_items.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
        totalAmount = activeOrder.order_items.reduce((acc: number, curr: any) => acc + curr.quantity * curr.price_at_order, 0);
      }

      return {
        ...table,
        activeOrder: activeOrder ? {
          id: activeOrder.id,
          table_id: activeOrder.table_id,
          status: activeOrder.status,
          customer_phone: activeOrder.customer_phone,
          created_at: activeOrder.created_at,
          itemsCount,
          totalAmount
        } : null
      };
    });
  },

  async getTable(tableId: string) {
    if (isMockMode) {
      const data = getMockData();
      return (data.tables as Table[]).find(t => t.id === tableId) || null;
    }
    const { data, error } = await supabase!
      .from('tables')
      .select('*')
      .eq('id', tableId)
      .single();
    if (error) throw error;
    return data as Table;
  },

  // -------------------------------------------------------------
  // MENU
  // -------------------------------------------------------------
  async getCategories() {
    if (isMockMode) {
      const data = getMockData();
      return (data.categories as MenuCategory[]).sort((a, b) => a.sort_order - b.sort_order);
    }
    const { data, error } = await supabase!
      .from('menu_categories')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return data as MenuCategory[];
  },

  async getMenuItems() {
    if (isMockMode) {
      const data = getMockData();
      return (data.menuItems as MenuItem[]).sort((a, b) => a.sort_order - b.sort_order);
    }
    const { data, error } = await supabase!
      .from('menu_items')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return data as MenuItem[];
  },

  // -------------------------------------------------------------
  // ORDERS
  // -------------------------------------------------------------
  async getActiveOrder(tableId: string) {
    if (isMockMode) {
      const data = getMockData();
      const order = (data.orders as Order[]).find(o => o.table_id === tableId && o.status !== 'closed');
      if (!order) return null;

      const items = (data.orderItems as OrderItem[])
        .filter(oi => oi.order_id === order.id)
        .map(oi => {
          const menuItem = (data.menuItems as MenuItem[]).find(mi => mi.id === oi.menu_item_id);
          return {
            ...oi,
            menu_items: menuItem
          };
        });

      return {
        ...order,
        items
      };
    }

    const { data: order, error } = await supabase!
      .from('orders')
      .select('*, order_items(*, menu_items(*))')
      .eq('table_id', tableId)
      .neq('status', 'closed')
      .maybeSingle();

    if (error) throw error;
    if (!order) return null;

    return {
      ...order,
      items: order.order_items || []
    };
  },

  async createOrder(tableId: string) {
    if (isMockMode) {
      const data = getMockData();
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        table_id: tableId,
        status: 'open',
        customer_phone: null,
        created_at: new Date().toISOString()
      };
      data.orders.push(newOrder);

      // update table status
      const table = data.tables.find((t: any) => t.id === tableId);
      if (table) table.status = 'occupied';

      saveMockData(data);
      return newOrder;
    }

    // Start a transaction-like flow in Supabase
    const { data: order, error: orderError } = await supabase!
      .from('orders')
      .insert({ table_id: tableId, status: 'open' })
      .select()
      .single();

    if (orderError) throw orderError;

    // update table status
    const { error: tableError } = await supabase!
      .from('tables')
      .update({ status: 'occupied' })
      .eq('id', tableId);

    if (tableError) throw tableError;

    return order as Order;
  },

  async addOrderItem(orderId: string, menuItemId: string, quantity: number, notes: string | null, priceAtOrder: number) {
    if (isMockMode) {
      const data = getMockData();
      const existing = (data.orderItems as OrderItem[]).find(oi => oi.order_id === orderId && oi.menu_item_id === menuItemId);

      if (existing) {
        existing.quantity += quantity;
        existing.notes = notes || existing.notes;
      } else {
        const newItem: OrderItem = {
          id: `oi-${Date.now()}`,
          order_id: orderId,
          menu_item_id: menuItemId,
          quantity,
          price_at_order: priceAtOrder,
          notes
        };
        data.orderItems.push(newItem);
      }

      saveMockData(data);
      return;
    }

    // Check if item already exists in the order
    const { data: existing, error: fetchError } = await supabase!
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .eq('menu_item_id', menuItemId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      const { error: updateError } = await supabase!
        .from('order_items')
        .update({ quantity: existing.quantity + quantity, notes: notes || existing.notes })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase!
        .from('order_items')
        .insert({
          order_id: orderId,
          menu_item_id: menuItemId,
          quantity,
          price_at_order: priceAtOrder,
          notes
        });
      if (insertError) throw insertError;
    }
  },

  async updateOrderItem(itemId: string, quantity: number, notes: string | null) {
    if (isMockMode) {
      const data = getMockData();
      if (quantity <= 0) {
        data.orderItems = (data.orderItems as OrderItem[]).filter(oi => oi.id !== itemId);
      } else {
        const item = (data.orderItems as OrderItem[]).find(oi => oi.id === itemId);
        if (item) {
          item.quantity = quantity;
          item.notes = notes;
        }
      }
      saveMockData(data);
      return;
    }

    if (quantity <= 0) {
      const { error } = await supabase!
        .from('order_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    } else {
      const { error } = await supabase!
        .from('order_items')
        .update({ quantity, notes })
        .eq('id', itemId);
      if (error) throw error;
    }
  },

  async deleteOrderItem(itemId: string) {
    if (isMockMode) {
      const data = getMockData();
      data.orderItems = (data.orderItems as OrderItem[]).filter(oi => oi.id !== itemId);
      saveMockData(data);
      return;
    }
    const { error } = await supabase!
      .from('order_items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  },

  // -------------------------------------------------------------
  // BILL GENERATION & ACTIONS
  // -------------------------------------------------------------
  async generateBill(
    orderId: string,
    customerPhone: string | null,
    discount: number = 0,
    parcelCharge: number = 0,
    extraCharge: number = 0,
    extraChargeLabel: string | null = null
  ) {
    if (isMockMode) {
      const data = getMockData();
      
      // Update order status and phone
      const order = (data.orders as Order[]).find(o => o.id === orderId);
      if (order) {
        order.status = 'billed';
        order.customer_phone = customerPhone;
      }

      // Calculate totals
      const items = (data.orderItems as OrderItem[]).filter(oi => oi.order_id === orderId);
      const subtotal = items.reduce((acc, curr) => acc + curr.quantity * curr.price_at_order, 0);
      const tax = 0; // 0% default
      const total = subtotal - discount + parcelCharge + extraCharge + tax;

      // Create bill if not exists
      let bill = (data.bills as Bill[]).find(b => b.order_id === orderId);
      if (!bill) {
        bill = {
          id: `bill-${Date.now()}`,
          order_id: orderId,
          subtotal,
          discount,
          tax,
          total,
          parcel_charge: parcelCharge,
          extra_charge: extraCharge,
          extra_charge_label: extraChargeLabel,
          whatsapp_sent_at: null,
          created_at: new Date().toISOString()
        };
        data.bills.push(bill);
      } else {
        bill.subtotal = subtotal;
        bill.discount = discount;
        bill.parcel_charge = parcelCharge;
        bill.extra_charge = extraCharge;
        bill.extra_charge_label = extraChargeLabel;
        bill.total = total;
      }

      saveMockData(data);

      // fetch table for formatting output
      const table = data.tables.find((t: any) => t.id === order?.table_id);
      return {
        bill,
        order: {
          ...order,
          tables: table
        },
        items: items.map(oi => ({
          ...oi,
          menu_items: data.menuItems.find((mi: any) => mi.id === oi.menu_item_id)
        }))
      };
    }

    // 1. Update order
    const { error: orderError } = await supabase!
      .from('orders')
      .update({ status: 'billed', customer_phone: customerPhone })
      .eq('id', orderId);

    if (orderError) throw orderError;

    // 2. Fetch order items to compute totals
    const { data: items, error: itemsError } = await supabase!
      .from('order_items')
      .select('*, menu_items(*)')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    const subtotal = items.reduce((acc: number, curr: any) => acc + curr.quantity * curr.price_at_order, 0);
    const tax = 0;
    const total = subtotal - discount + parcelCharge + extraCharge + tax;

    // 3. Create or update bill in database
    // check if it exists first
    const { data: existingBill } = await supabase!
      .from('bills')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    let billData;
    if (existingBill) {
      const { data: updatedBill, error: billError } = await supabase!
        .from('bills')
        .update({ 
          subtotal, 
          discount, 
          tax, 
          total,
          parcel_charge: parcelCharge,
          extra_charge: extraCharge,
          extra_charge_label: extraChargeLabel
        })
        .eq('id', existingBill.id)
        .select()
        .single();
      if (billError) throw billError;
      billData = updatedBill;
    } else {
      const { data: insertedBill, error: billError } = await supabase!
        .from('bills')
        .insert({ 
          order_id: orderId, 
          subtotal, 
          discount, 
          tax, 
          total,
          parcel_charge: parcelCharge,
          extra_charge: extraCharge,
          extra_charge_label: extraChargeLabel
        })
        .select()
        .single();
      if (billError) throw billError;
      billData = insertedBill;
    }

    // Fetch complete active order details to return
    const { data: orderDetails, error: detailsError } = await supabase!
      .from('orders')
      .select('*, tables(*)')
      .eq('id', orderId)
      .single();

    if (detailsError) throw detailsError;

    return {
      bill: billData as Bill,
      order: orderDetails,
      items
    };
  },

  async getBillByOrderId(orderId: string) {
    if (isMockMode) {
      const data = getMockData();
      return (data.bills as Bill[]).find(b => b.order_id === orderId) || null;
    }
    const { data, error } = await supabase!
      .from('bills')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();
    if (error) throw error;
    return data as Bill | null;
  },

  async closeTable(
    orderId: string,
    paymentMethod: 'cash' | 'online' | 'split' = 'cash',
    cashAmount: number = 0,
    onlineAmount: number = 0,
    whatsappSent: boolean = false
  ) {
    if (isMockMode) {
      const data = getMockData();
      const order = (data.orders as Order[]).find(o => o.id === orderId);
      if (order) {
        order.status = 'closed';
        
        // update table status
        const table = data.tables.find((t: any) => t.id === order.table_id);
        if (table) table.status = 'free';

        // update bill details
        const bill = (data.bills as Bill[]).find(b => b.order_id === orderId);
        if (bill) {
          if (whatsappSent) {
            bill.whatsapp_sent_at = new Date().toISOString();
          }
          bill.payment_method = paymentMethod;
          bill.cash_amount = cashAmount;
          bill.online_amount = onlineAmount;
        }
      }
      saveMockData(data);
      return;
    }

    // 1. Fetch order to get table_id
    const { data: order, error: orderFetchError } = await supabase!
      .from('orders')
      .select('table_id')
      .eq('id', orderId)
      .single();

    if (orderFetchError) throw orderFetchError;

    // 2. Mark order as closed
    const { error: orderError } = await supabase!
      .from('orders')
      .update({ status: 'closed' })
      .eq('id', orderId);

    if (orderError) throw orderError;

    // 3. Mark table as free
    const { error: tableError } = await supabase!
      .from('tables')
      .update({ status: 'free' })
      .eq('id', order!.table_id);

    if (tableError) throw tableError;

    // 4. Update bill details
    const updateData: any = {
      payment_method: paymentMethod,
      cash_amount: cashAmount,
      online_amount: onlineAmount
    };
    if (whatsappSent) {
      updateData.whatsapp_sent_at = new Date().toISOString();
    }

    const { error: billError } = await supabase!
      .from('bills')
      .update(updateData)
      .eq('order_id', orderId);

    if (billError) throw billError;
  },

  // -------------------------------------------------------------
  // BILL HISTORY
  // -------------------------------------------------------------
  async getBillHistory() {
    if (isMockMode) {
      const data = getMockData();
      return (data.bills as Bill[])
        .map(bill => {
          const order = (data.orders as Order[]).find(o => o.id === bill.order_id);
          const table = order ? (data.tables as Table[]).find(t => t.id === order.table_id) : null;
          return {
            ...bill,
            orders: order ? {
              id: order.id,
              table_id: order.table_id,
              customer_phone: order.customer_phone,
              tables: table || undefined
            } : undefined
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const { data, error } = await supabase!
      .from('bills')
      .select('*, orders(*, tables(*))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Bill[];
  },

  // -------------------------------------------------------------
  // DELETE BILL
  // -------------------------------------------------------------
  async deleteBill(billId: string, orderId: string) {
    if (isMockMode) {
      const data = getMockData();
      data.bills = (data.bills as Bill[]).filter(b => b.id !== billId);
      data.orderItems = (data.orderItems as OrderItem[]).filter(oi => oi.order_id !== orderId);
      const order = (data.orders as Order[]).find(o => o.id === orderId);
      if (order) {
        const table = data.tables.find((t: any) => t.id === order.table_id);
        if (table) table.status = 'free';
      }
      data.orders = (data.orders as Order[]).filter(o => o.id !== orderId);
      saveMockData(data);
      return;
    }

    const { error: billError } = await supabase!
      .from('bills')
      .delete()
      .eq('id', billId);
    if (billError) throw billError;

    const { data: order } = await supabase!
      .from('orders')
      .select('table_id')
      .eq('id', orderId)
      .single();

    const { error: itemsError } = await supabase!
      .from('order_items')
      .delete()
      .eq('order_id', orderId);
    if (itemsError) throw itemsError;

    const { error: orderError } = await supabase!
      .from('orders')
      .delete()
      .eq('id', orderId);
    if (orderError) throw orderError;

    if (order) {
      await supabase!
        .from('tables')
        .update({ status: 'free' })
        .eq('id', order.table_id);
    }
  },

  // -------------------------------------------------------------
  // EXPENSES
  // -------------------------------------------------------------
  async getExpenses() {
    if (isMockMode) {
      const data = getMockData();
      return (data.expenses || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const { data, error } = await supabase!
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("Supabase expenses query failed, maybe table is missing? Falling back to empty array.", error);
      return [];
    }
    return data as Expense[];
  },

  async addExpense(category: 'raw_material' | 'electricity' | 'other', amount: number, description: string) {
    if (isMockMode) {
      const data = getMockData();
      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        category,
        amount,
        description,
        created_at: new Date().toISOString(),
      };
      data.expenses.push(newExpense);
      saveMockData(data);
      return newExpense;
    }

    const { data, error } = await supabase!
      .from('expenses')
      .insert({ category, amount, description })
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  },

  async deleteExpense(expenseId: string) {
    if (isMockMode) {
      const data = getMockData();
      data.expenses = (data.expenses || []).filter((e: any) => e.id !== expenseId);
      saveMockData(data);
      return;
    }

    const { error } = await supabase!
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
  },

  // -------------------------------------------------------------
  // DAY CLOSE SYSTEM
  // -------------------------------------------------------------
  async getDayCloses() {
    if (isMockMode) {
      const data = getMockData();
      return (data.dayCloses || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const { data, error } = await supabase!
      .from('day_closes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("Supabase day_closes query failed, maybe table is missing? Falling back to empty array.", error);
      return [];
    }
    return data as DayClose[];
  },

  async closeDay(
    date: string,
    revenue: number,
    expenses: number,
    profit: number,
    notes: string,
    cashRevenue: number = 0,
    onlineRevenue: number = 0
  ) {
    if (isMockMode) {
      const data = getMockData();
      
      // Check if already closed
      const exists = (data.dayCloses || []).some((dc: any) => dc.date === date);
      if (exists) {
        throw new Error(`Day ${date} is already closed.`);
      }

      const newDayClose: DayClose = {
        id: `dc-${Date.now()}`,
        date,
        revenue,
        expenses,
        profit,
        notes,
        cash_revenue: cashRevenue,
        online_revenue: onlineRevenue,
        created_at: new Date().toISOString()
      };
      
      data.dayCloses.push(newDayClose);
      saveMockData(data);
      return newDayClose;
    }

    const { data, error } = await supabase!
      .from('day_closes')
      .insert({ date, revenue, expenses, profit, notes, cash_revenue: cashRevenue, online_revenue: onlineRevenue })
      .select()
      .single();

    if (error) throw error;
    return data as DayClose;
  },

  async isDayClosed(date: string) {
    if (isMockMode) {
      const data = getMockData();
      return (data.dayCloses || []).some((dc: any) => dc.date === date);
    }

    const { data, error } = await supabase!
      .from('day_closes')
      .select('id')
      .eq('date', date)
      .maybeSingle();

    if (error) return false;
    return !!data;
  },

  // -------------------------------------------------------------
  // OFFERS
  // -------------------------------------------------------------
  async getOffer(): Promise<{ is_active: boolean; title: string; description: string; badge: string; price: number; image_url: string } | null> {
    if (isMockMode) {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem('cafe_blossom_offer');
      if (!raw) {
        // Return default seed
        const defaultOffer = {
          is_active: true,
          title: "Burger, Cold Coffee & Fries Combo",
          description: "Get a Veg/Chicken Cheese Burger, French Fries, and a Thick Cold Coffee at a special discounted price!",
          badge: "COMBO OFFER",
          price: 149,
          image_url: "/offer_combo.jpg"
        };
        localStorage.setItem('cafe_blossom_offer', JSON.stringify(defaultOffer));
        return defaultOffer;
      }
      return JSON.parse(raw);
    }

    const { data, error } = await supabase!
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as { is_active: boolean; title: string; description: string; badge: string; price: number; image_url: string };
  },

  async saveOffer(offer: { is_active: boolean; title: string; description: string; badge: string; price: number; image_url: string }) {
    if (isMockMode) {
      if (typeof window === 'undefined') return;
      localStorage.setItem('cafe_blossom_offer', JSON.stringify(offer));
      return;
    }

    // Upsert: delete all then insert fresh (single-row offer design)
    await supabase!.from('offers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase!.from('offers').insert(offer);
  },

  // -------------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------------
  async getReviews(): Promise<{ id: string; rating: number; comment: string; table_number: number | null; created_at: string }[]> {
    if (isMockMode) {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem('cafe_blossom_reviews');
      if (!raw) return [];
      return JSON.parse(raw);
    }

    const { data, error } = await supabase!
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async addReview(review: { rating: number; comment: string; table_number: number | null }) {
    const newReview = {
      id: `review-${Date.now()}`,
      ...review,
      created_at: new Date().toISOString(),
    };

    if (isMockMode) {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('cafe_blossom_reviews');
      const existing = raw ? JSON.parse(raw) : [];
      existing.unshift(newReview);
      localStorage.setItem('cafe_blossom_reviews', JSON.stringify(existing));
      return;
    }

    await supabase!.from('reviews').insert({
      rating: review.rating,
      comment: review.comment,
      table_number: review.table_number,
    });
  },

  async sync() {
    if (!isMockMode || typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/mock-db');
      if (res.ok) {
        const serverDb = await res.json();
        const localDb = getMockData();
        if (serverDb && serverDb.lastUpdated > (localDb.lastUpdated || 0)) {
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(serverDb));
          // Trigger storage event to notify other open tabs
          window.dispatchEvent(new StorageEvent('storage', {
            key: MOCK_STORAGE_KEY,
            newValue: JSON.stringify(serverDb)
          }));
        }
      }
    } catch (err) {
      console.warn('Mock DB sync pull failed:', err);
    }
  },
};
