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

export interface Offer {
  id?: string;
  is_active: boolean;
  title: string;
  description: string;
  badge: string;
  price: number;
  image_url: string;
}

export interface Review {
  id?: string;
  rating: number;
  comment: string;
  table_number: number | null;
  created_at: string;
}
