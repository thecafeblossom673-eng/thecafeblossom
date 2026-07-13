-- Cafe Blossom Staff Billing System Schema
-- To be run in the Supabase SQL Editor

-- 1. Create tables table
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number INTEGER NOT NULL UNIQUE CHECK (table_number BETWEEN 1 AND 10),
    status TEXT NOT NULL CHECK (status IN ('free', 'occupied')) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on tables
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- 2. Create menu_categories table
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- 3. Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    is_veg BOOLEAN NOT NULL DEFAULT true,
    is_available BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(category_id, name)
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 4. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'billed', 'closed')) DEFAULT 'open',
    customer_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_order NUMERIC NOT NULL CHECK (price_at_order >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 6. Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC NOT NULL DEFAULT 0 CHECK (discount >= 0),
    tax NUMERIC NOT NULL DEFAULT 0 CHECK (tax >= 0),
    parcel_charge NUMERIC NOT NULL DEFAULT 0 CHECK (parcel_charge >= 0),
    extra_charge NUMERIC NOT NULL DEFAULT 0 CHECK (extra_charge >= 0),
    extra_charge_label TEXT,
    total NUMERIC NOT NULL CHECK (total >= 0),
    payment_method TEXT CHECK (payment_method IN ('cash', 'online', 'split')),
    cash_amount NUMERIC NOT NULL DEFAULT 0 CHECK (cash_amount >= 0),
    online_amount NUMERIC NOT NULL DEFAULT 0 CHECK (online_amount >= 0),
    whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create Policies for Authenticated Staff users
-- Since it's a staff-only system, we'll allow authenticated users to perform all operations.
-- For local/mock fallback support we can also allow anonymous read access or all operations.
-- Adjust as required for security.

-- For tables
CREATE POLICY "Allow all operations for authenticated users on tables"
    ON public.tables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to anon on tables"
    ON public.tables FOR SELECT TO anon USING (true);

-- For menu_categories
CREATE POLICY "Allow all operations for authenticated users on menu_categories"
    ON public.menu_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to anon on menu_categories"
    ON public.menu_categories FOR SELECT TO anon USING (true);

-- For menu_items
CREATE POLICY "Allow all operations for authenticated users on menu_items"
    ON public.menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to anon on menu_items"
    ON public.menu_items FOR SELECT TO anon USING (true);

-- For orders
CREATE POLICY "Allow all operations for authenticated users on orders"
    ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to anon on orders"
    ON public.orders FOR SELECT TO anon USING (true);

-- For order_items
CREATE POLICY "Allow all operations for authenticated users on order_items"
    ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to anon on order_items"
    ON public.order_items FOR SELECT TO anon USING (true);

-- For bills
CREATE POLICY "Allow all operations for authenticated users on bills"
    ON public.bills FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to anon on bills"
    ON public.bills FOR SELECT TO anon USING (true);

-- 7. Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('raw_material', 'electricity', 'other')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users on expenses"
    ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to anon on expenses"
    ON public.expenses FOR SELECT TO anon USING (true);

-- 8. Create day_closes table
CREATE TABLE IF NOT EXISTS public.day_closes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TEXT NOT NULL UNIQUE,
    revenue NUMERIC NOT NULL CHECK (revenue >= 0),
    expenses NUMERIC NOT NULL CHECK (expenses >= 0),
    profit NUMERIC NOT NULL,
    notes TEXT,
    cash_revenue NUMERIC NOT NULL DEFAULT 0 CHECK (cash_revenue >= 0),
    online_revenue NUMERIC NOT NULL DEFAULT 0 CHECK (online_revenue >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.day_closes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users on day_closes"
    ON public.day_closes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to anon on day_closes"
    ON public.day_closes FOR SELECT TO anon USING (true);

