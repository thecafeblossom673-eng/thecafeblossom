-- Seed file for Cafe Blossom
-- Seeding Tables (1-9), Categories, and Menu Items

-- 1. Seed tables
INSERT INTO public.tables (table_number, status) VALUES
(1, 'free'),
(2, 'free'),
(3, 'free'),
(4, 'free'),
(5, 'free'),
(6, 'free'),
(7, 'free'),
(8, 'free'),
(9, 'free'),
(10, 'free')
ON CONFLICT (table_number) DO NOTHING;

-- 2. Seed menu categories and items using a transaction or WITH clauses to map IDs
DO $$
DECLARE
    cat_fries UUID;
    cat_burgers UUID;
    cat_sandwiches UUID;
    cat_pasta UUID;
    cat_cold_coffee UUID;
    cat_hot_coffee UUID;
    cat_shakes UUID;
    cat_mocktails UUID;
BEGIN
    -- Insert menu categories
    INSERT INTO public.menu_categories (name, sort_order) VALUES
    ('French Fries', 1),
    ('Burgers', 2),
    ('Grilled Sandwiches', 3),
    ('Pasta', 4),
    ('Cold Coffee', 5),
    ('Hot Coffee', 6),
    ('Milk Shake', 7),
    ('Mocktail', 8)
    ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order
    RETURNING id INTO cat_fries;

    -- Re-fetch category IDs to make sure variables are assigned correctly (whether inserted or updated)
    SELECT id INTO cat_fries FROM public.menu_categories WHERE name = 'French Fries';
    SELECT id INTO cat_burgers FROM public.menu_categories WHERE name = 'Burgers';
    SELECT id INTO cat_sandwiches FROM public.menu_categories WHERE name = 'Grilled Sandwiches';
    SELECT id INTO cat_pasta FROM public.menu_categories WHERE name = 'Pasta';
    SELECT id INTO cat_cold_coffee FROM public.menu_categories WHERE name = 'Cold Coffee';
    SELECT id INTO cat_hot_coffee FROM public.menu_categories WHERE name = 'Hot Coffee';
    SELECT id INTO cat_shakes FROM public.menu_categories WHERE name = 'Milk Shake';
    SELECT id INTO cat_mocktails FROM public.menu_categories WHERE name = 'Mocktail';

    -- 3. Seed Menu Items
    
    -- Category: French Fries
    INSERT INTO public.menu_items (category_id, name, description, price, is_veg, sort_order) VALUES
    (cat_fries, 'Plain Salted Fries', 'Classic salted potato fries', 80, true, 1),
    (cat_fries, 'Peri Peri Masala Fries', 'Spicy peri-peri seasoned fries', 90, true, 2),
    (cat_fries, 'Cheese Fries (peri peri)', 'Fries loaded with cheese and peri peri seasoning', 100, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Category: Burgers
    INSERT INTO public.menu_items (category_id, name, description, price, is_veg, sort_order) VALUES
    (cat_burgers, 'Classic Veg Burger', 'Standard veg patty burger', 80, true, 1),
    (cat_burgers, 'Veg Cheese Burger', 'Veg patty burger with cheese slice', 90, true, 2),
    (cat_burgers, 'Corn Cheese Burger', 'Burger with sweet corn and melting cheese', 110, true, 3),
    (cat_burgers, 'Paneer Cheese Burger', 'Burger with paneer patty and cheese slice', 120, true, 4),
    (cat_burgers, 'Classic Chicken Burger', 'Standard chicken patty burger', 120, false, 5),
    (cat_burgers, 'Chicken Cheese Burger', 'Chicken burger with cheese slice', 130, false, 6),
    (cat_burgers, 'Tandoori Veg Cheese Burger', 'Veg burger with tandoori sauce and cheese', 120, true, 7),
    (cat_burgers, 'Tandoori Chicken Cheese Burger', 'Chicken burger with tandoori sauce and cheese', 140, false, 8)
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Category: Grilled Sandwiches
    INSERT INTO public.menu_items (category_id, name, description, price, is_veg, sort_order) VALUES
    (cat_sandwiches, 'Veg Sandwich', 'Classic vegetable grilled sandwich', 80, true, 1),
    (cat_sandwiches, 'Veg Cheese Sandwich', 'Veg grilled sandwich with cheese', 100, true, 2),
    (cat_sandwiches, 'Corn Cheese Sandwich', 'Grilled sandwich with corn and cheese', 110, true, 3),
    (cat_sandwiches, 'Bombay Cheese Sandwich', 'Traditional Bombay style grilled potato and veg sandwich with cheese', 130, true, 4),
    (cat_sandwiches, 'Paneer Cheese Sandwich', 'Grilled sandwich with paneer filling and cheese', 130, true, 5),
    (cat_sandwiches, 'Tandoori Chicken Sandwich', 'Tandoori chicken filling in grilled sandwich', 150, false, 6)
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Category: Pasta
    INSERT INTO public.menu_items (category_id, name, description, price, is_veg, sort_order) VALUES
    (cat_pasta, 'Alfredo Pasta (white sauce)', 'White Sauce, Mix Veggies, Macaroni, Cheese', 160, true, 1),
    (cat_pasta, 'Arrebitta Pasta (Red sauce)', 'Red Sauce, Mix Veggies, Macaroni, Cheese', 170, true, 2),
    (cat_pasta, 'Spicy Alfredo Pasta', 'White Sauce, Mix Veggies, Pesto Sauce, Cheese', 180, true, 3),
    (cat_pasta, 'Alfredo Chicken Pasta', 'Chicken, White Sauce, Mix Veggies, Macaroni, Cheese', 170, false, 4),
    (cat_pasta, 'Arrebitta Chicken Pasta (Red sauce)', 'Chicken, Red Sauce, Mix Veggies, Macaroni, Cheese', 180, false, 5),
    (cat_pasta, 'Spicy Alfredo Chicken Pasta', 'Chicken, Garlic, Pasta, Mix Veggies', 200, false, 6)
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Category: Cold Coffee
    INSERT INTO public.menu_items (category_id, name, description, price, is_veg, sort_order) VALUES
    (cat_cold_coffee, 'Thick Cold Coffee', 'Thick creamy blended cold coffee', 70, true, 1),
    (cat_cold_coffee, 'Cold Coffee & Choco Crush', 'Blended cold coffee topped with chocolate crush', 80, true, 2),
    (cat_cold_coffee, 'Cold Coffee & Icecream', 'Cold coffee served with vanilla/chocolate ice cream scoop', 90, true, 3)
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Category: Hot Coffee
    INSERT INTO public.menu_items (category_id, name, description, price, is_veg, sort_order) VALUES
    (cat_hot_coffee, 'Hot Coffee', 'Classic hot brewed coffee', 30, true, 1),
    (cat_hot_coffee, 'Hot Chocolate', 'Rich warm liquid chocolate drink', 40, true, 2)
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Category: Milk Shake
    INSERT INTO public.menu_items (category_id, name, description, price, is_veg, sort_order) VALUES
    (cat_shakes, 'Mango Milk Shake', 'Rich mango milkshake', 90, true, 1),
    (cat_shakes, 'Kitkat Milk Shake', 'Milkshake blended with Kitkat chocolate bar', 90, true, 2),
    (cat_shakes, 'Strawberry Milk Shake', 'Sweet strawberry flavored milkshake', 90, true, 3),
    (cat_shakes, 'Oreo Milk Shake', 'Milkshake blended with Oreo cookies', 90, true, 4),
    (cat_shakes, 'Butterscotch Milk Shake', 'Butterscotch milkshake topped with syrup', 90, true, 5)
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Category: Mocktail
    INSERT INTO public.menu_items (category_id, name, description, price, is_veg, sort_order) VALUES
    (cat_mocktails, 'Ice Tea', 'Classic lemon/peach iced tea', 100, true, 1),
    (cat_mocktails, 'Ocean water (Blue lagoon)', 'Refreshing blue curacao flavored mocktail', 100, true, 2),
    (cat_mocktails, 'Sparkling Mint (Mojito)', 'Mint and lime sparkling mojito', 100, true, 3),
    (cat_mocktails, 'Watermelon Fizz', 'Fizzy watermelon sweet mocktail', 100, true, 4),
    (cat_mocktails, 'Green Apple Mojito', 'Green apple flavored sparkling mojito', 100, true, 5),
    (cat_mocktails, 'Guava Colada', 'Coconut and guava flavored tropical mocktail', 100, true, 6)
    ON CONFLICT (category_id, name) DO NOTHING;

END $$;
