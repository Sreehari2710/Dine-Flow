export interface Hotel {
    id: string;
    name: string;
    slug: string;
}

export interface Profile {
    id: string;
    hotel_id: string;
    role: 'admin' | 'waiter' | 'kitchen';
    full_name: string;
    username: string;
    hotel_slug?: string;
}

export interface Seat {
    id: number;
    hotel_id: string;
    status: 'available' | 'occupied';
}

export interface Category {
    id: number;
    hotel_id: string;
    name: string;
    slug: string;
    icon?: string;
}

export interface MenuItem {
    id: number;
    hotel_id: string;
    name: string;
    price: number;
    category_id: number;
    is_veg: boolean;
    image_url?: string;
    available: boolean;
    variants?: { name: string; price: number }[];
    stock_count?: number;
    track_inventory?: boolean;
}

export interface OrderItem {
    id: number;
    order_id: number;
    menu_item_id: number;
    quantity: number;
    price: number;
    status: 'pending' | 'served';
    notes?: string;
    variant_name?: string | null;
    menu_item?: MenuItem; // Joined data
}

export interface Order {
    id: number;
    hotel_id: string;
    seat_id: number;
    status: 'pending' | 'preparing' | 'served' | 'cancelled' | 'completed' | 'paid';
    created_at: string;
    items?: OrderItem[]; // Joined data
    total_amount: number;
    waiter_id?: string;
    waiter_name?: string;
    parcel_number?: number;
}
