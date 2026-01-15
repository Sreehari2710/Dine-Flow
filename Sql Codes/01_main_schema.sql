-- 1. TABLES SETUP
CREATE TABLE IF NOT EXISTS public.hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    last_opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    hotel_id UUID REFERENCES public.hotels(id),
    role TEXT CHECK (role IN ('admin', 'waiter', 'kitchen')),
    full_name TEXT,
    username TEXT UNIQUE,
    hotel_slug TEXT
);

CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    hotel_id UUID REFERENCES public.hotels(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id SERIAL PRIMARY KEY,
    hotel_id UUID REFERENCES public.hotels(id),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category_id INT REFERENCES public.categories(id),
    is_veg BOOLEAN DEFAULT TRUE,
    available BOOLEAN DEFAULT TRUE,
    variants JSONB,
    track_inventory BOOLEAN DEFAULT FALSE,
    stock_count NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.seats (
    id SERIAL PRIMARY KEY,
    hotel_id UUID REFERENCES public.hotels(id),
    status TEXT CHECK (status IN ('available', 'occupied')) DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    hotel_id UUID REFERENCES public.hotels(id),
    seat_id INT REFERENCES public.seats(id),
    status TEXT CHECK (status IN ('pending', 'preparing', 'served', 'cancelled', 'completed', 'paid')),
    total_amount NUMERIC DEFAULT 0,
    waiter_id UUID REFERENCES public.profiles(id),
    waiter_name TEXT,
    parcel_number INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id INT REFERENCES public.menu_items(id),
    quantity INT NOT NULL,
    price NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'served')) DEFAULT 'pending',
    variant_name TEXT,
    notes TEXT
);

-- 2. RLS POLICIES (Simplified)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Enable RLS for other tables as needed for your specific multi-tenant requirements.
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotels are viewable by everyone" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Menu items are viewable by everyone" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Seats are viewable by everyone" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Orders are viewable by everyone" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Order items are viewable by everyone" ON public.order_items FOR SELECT USING (true);
