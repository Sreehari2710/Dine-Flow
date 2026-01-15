import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './supabase';
import { Seat, Category, MenuItem, Order, Profile } from './src/types';
import { TAX_RATE } from './src/constants';
import Header from './src/components/Header';
import SeatMap from './src/components/SeatMap';
import MenuView from './src/components/MenuView';
import AdminDashboard from './src/components/AdminDashboard';
import AddItemModal from './src/components/AddItemModal';
import AddCategoryModal from './src/components/AddCategoryModal';
import AddWaiterModal from './src/components/AddWaiterModal';
import Reports from './src/components/Reports';
import AuthScreen from './src/components/AuthScreen';
import KitchenView from './src/components/KitchenView';
import ParcelSelectionModal from './src/components/ParcelSelectionModal';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentView, setCurrentView] = useState<'auth' | 'waiter_seats' | 'waiter_menu' | 'admin_dashboard' | 'admin_menu' | 'admin_reports' | 'kitchen_view'>('waiter_seats');
  const [currentSeat, setCurrentSeat] = useState<Seat | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddItemModalVisible, setAddItemModalVisible] = useState(false);
  const [isAddCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [isAddWaiterModalVisible, setAddWaiterModalVisible] = useState(false);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [itemNotes, setItemNotes] = useState<{ [key: string]: string }>({});
  const [currentOrder, setCurrentOrder] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [waiters, setWaiters] = useState<Profile[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [isParcelModalVisible, setParcelModalVisible] = useState(false);
  const [parcelSelectionParcels, setParcelSelectionParcels] = useState<Order[]>([]);
  const [parcelSelectionSeat, setParcelSelectionSeat] = useState<Seat | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setAuthLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setIsShopOpen(true);
        setCurrentView('auth');
        setAuthLoading(false);
      }
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, hotel:hotels(slug, is_open)')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Handle the case where hotel might be an array or object
      const hotelData = Array.isArray(data.hotel) ? data.hotel[0] : data.hotel;

      setProfile({ ...data, hotel_slug: hotelData?.slug });
      setIsShopOpen(hotelData?.is_open ?? true);

      // Set initial view based on role
      if (data.role === 'admin') setCurrentView('admin_dashboard');
      else if (data.role === 'kitchen') setCurrentView('kitchen_view');
      else setCurrentView('waiter_seats');

    } catch (err) {
      console.error('Profile fetch error:', err);
      // Fallback or error handling
    } finally {
      setAuthLoading(false);
    }
  };

  // Only fetch data if we have a session AND profile (tenant context)
  useEffect(() => {
    if (session && profile) {
      fetchData();
      const subscription = setupRealtimeSubscription();
      return () => {
        if (subscription.seatSubscription) supabase.removeChannel(subscription.seatSubscription);
        if (subscription.orderSubscription) supabase.removeChannel(subscription.orderSubscription);
        if (subscription.hotelSubscription) supabase.removeChannel(subscription.hotelSubscription);
      };
    }
  }, [session, profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSeats(),
        fetchMenuData(),
        fetchSeats(),
        fetchMenuData(),
        fetchOrders(),
        fetchWaiters()
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const seatSubscription = supabase
      .channel('public:seats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seats' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setSeats((prev) => [...prev, payload.new].sort((a, b) => a.id - b.id));
        } else if (payload.eventType === 'UPDATE') {
          setSeats((prev) => prev.map((s) => s.id === payload.new.id ? payload.new : s));
        } else if (payload.eventType === 'DELETE') {
          setSeats((prev) => prev.filter((s) => s.id !== payload.old.id));
        }
      })
      .subscribe();

    const orderSubscription = supabase
      .channel('public:orders_and_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Order Change received!', payload);
        fetchOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, (payload) => {
        console.log('Order Item Change received!', payload);
        fetchOrders();
      })
      .subscribe();

    const hotelSubscription = supabase
      .channel('public:hotels')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hotels' }, (payload: any) => {
        if (payload.new.id === profile?.hotel_id) {
          setIsShopOpen(payload.new.is_open);
        }
      })
      .subscribe();

    return { seatSubscription, orderSubscription, hotelSubscription };
  };

  async function fetchOrders() {
    try {
      // Fetch pending orders with items and menu details
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, menu_item:menu_items(*))')
        .in('status', ['pending', 'preparing', 'served', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveOrders(data || []);
    } catch (err) {
      console.error("Order fetch error:", err);
    }
  }

  async function fetchSeats() {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('seats')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;
        setSeats(data || []);
      }
    } catch (err) {
      console.error(err);
      setError("Database connection error. Check your Supabase keys.");
    } finally {
      setLoading(false);
    }
  }



  async function fetchMenuData() {
    try {
      if (supabase) {
        // Fetch Categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('id', { ascending: true });

        if (catError) throw catError;
        setCategories(catData || []);
        if (catData && catData.length > 0) {
          setSelectedCategory(catData[0].id);
        }

        // Fetch Menu Items
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .order('name', { ascending: true });

        if (menuError) throw menuError;
        setMenuItems(menuData || []);
      }
    } catch (err) {
      console.error("Menu fetch error:", err);
    }
  }

  async function fetchWaiters() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('hotel_id', profile?.hotel_id)
        .in('role', ['waiter', 'kitchen'])
        .order('full_name', { ascending: true });

      if (error) throw error;
      setWaiters(data || []);
    } catch (err) {
      console.error("Waiters fetch error:", err);
    }
  }

  const handleDeleteWaiter = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this waiter?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .rpc('delete_waiter_account', { p_waiter_id: id });

              if (error) throw error;
              setWaiters(prev => prev.filter(w => w.id !== id));
              Alert.alert('Success', 'Waiter removed successfully');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete waiter: ' + err.message);
            }
          }
        }
      ]
    );
  };

  const handleToggleShopStatus = async (newStatus: boolean) => {
    if (!profile?.hotel_id) return;
    try {
      console.log('Attempting shop toggle:', newStatus, 'for hotel:', profile.hotel_id);
      const updateData: any = { is_open: newStatus };
      if (newStatus) {
        updateData.last_opened_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('hotels')
        .update(updateData)
        .eq('id', profile.hotel_id);

      if (error) {
        console.error('Toggle error:', error);
        throw error;
      }

      setIsShopOpen(newStatus);
      Alert.alert('Success', `Shop is now ${newStatus ? 'Open' : 'Closed'}`);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update shop: ' + err.message);
    }
  };

  const handleSeatSelect = (seat: Seat) => {
    if (!isShopOpen) {
      Alert.alert('Shop Closed', 'Orders cannot be placed while the shop is closed.');
      return;
    }
    if (seat.id === 0) {
      // Parcel handling: Check for active parcels (waiter-specific or all depending on role)
      const myActiveParcels = activeOrders.filter(o =>
        o.seat_id === 0 &&
        (o.status === 'pending' || o.status === 'preparing' || o.status === 'served') &&
        (profile?.role === 'admin' || o.waiter_id === profile?.id)
      );

      if (myActiveParcels.length > 0) {
        setParcelSelectionParcels(myActiveParcels);
        setParcelSelectionSeat(seat);
        setParcelModalVisible(true);
        return;
      }
      enterMenuMode(seat);
      return;
    }

    if (seat.status === 'occupied') {
      Alert.alert(
        'Seat Occupied',
        'Seat ' + seat.id + ' is currently occupied. View active order?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Order', onPress: () => {
              const existingOrder = activeOrders.find(o => o.seat_id === seat.id && (o.status === 'pending' || o.status === 'preparing' || o.status === 'served'));
              enterMenuMode(seat, existingOrder);
            }
          }
        ]
      );
    } else {
      enterMenuMode(seat);
    }
  };



  const enterMenuMode = async (seat: Seat, existingOrder?: Order | null) => {
    setCurrentSeat(seat);
    setCurrentView('waiter_menu');

    if (existingOrder) {
      setCurrentOrder(existingOrder);
      setCart({});
    } else {
      setCurrentOrder(null);
      setCart({});
    }

    // If it's a physical table and is occupied (but no existingOrder passed from selection),
    // then auto-fetch the active order for that seat.
    // For Parcels (id = 0), we NEVER auto-fetch; we only use existingOrder if explicitly selected.
    if (seat.id > 0 && seat.status === 'occupied' && !existingOrder) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('seat_id', seat.id)
          .in('status', ['pending', 'preparing', 'served'])
          .single();

        if (data) {
          setCurrentOrder(data);
          // Optional: You could load existing items into cart here if you wanted them editable,
          // but for now we treat cart as "new items to add"
        }
      } catch (err) {
        console.error("Error fetching active order for seat:", err);
      }
    }
  };

  // --- Admin Actions ---
  const handleAddCategory = async (name: string) => {
    if (!profile?.hotel_id || !profile?.hotel_slug) return;
    try {
      const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${profile.hotel_slug}`;
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          hotel_id: profile.hotel_id,
          name: name,
          slug: slug
        }])
        .select()
        .single();

      if (error) throw error;
      setCategories(prev => [...prev, data]);
      Alert.alert('Success', 'Category added');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleAddItem = async (name: string, price: string, categoryId: number, isVeg: boolean, variants?: { name: string, price: number }[], trackInventory?: boolean, stockCount?: number) => {
    try {
      // Validate variants if present
      let finalPrice = parseFloat(price);
      if (variants && variants.length > 0) {
        finalPrice = variants[0].price; // Default to first variant price
      }

      const { data, error } = await supabase
        .from('menu_items')
        .insert([
          {
            hotel_id: profile?.hotel_id,
            name: name,
            price: finalPrice,
            category_id: categoryId,
            is_veg: isVeg,
            available: trackInventory ? (stockCount! > 0) : true,
            variants: (variants && variants.length > 0) ? variants : null,
            track_inventory: trackInventory,
            stock_count: stockCount
          }
        ])
        .select();

      if (error) throw error;
      if (data) {
        setMenuItems(prev => [...prev, data[0]]);
        setAddItemModalVisible(false);
        Alert.alert('Success', 'Item added successfully');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add item');
      console.error(err);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setAddItemModalVisible(true);
  };

  const handleUpdateItem = async (id: number, name: string, price: string, categoryId: number, isVeg: boolean, variants?: { name: string, price: number }[], trackInventory?: boolean, stockCount?: number) => {
    try {
      let finalPrice = parseFloat(price);
      if (variants && variants.length > 0) {
        finalPrice = variants[0].price;
      }

      const { data, error } = await supabase
        .from('menu_items')
        .update({
          name: name,
          price: finalPrice,
          category_id: categoryId,
          is_veg: isVeg,
          variants: (variants && variants.length > 0) ? variants : null,
          track_inventory: trackInventory,
          stock_count: stockCount,
          available: trackInventory ? (stockCount! > 0) : true
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      if (data) {
        setMenuItems(prev => prev.map(item => item.id === id ? data[0] : item));
        setAddItemModalVisible(false);
        setEditingItem(null);
        Alert.alert('Success', 'Item updated successfully');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update item');
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('menu_items')
                .delete()
                .eq('id', id);

              if (error) throw error;
              setMenuItems(prev => prev.filter(item => item.id !== id));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  /* --- Cart & Order Logic --- */
  // Helper to get stock weight for a variant
  const getVariantWeight = (variantName: string | null) => {
    if (!variantName) return 1.0;
    const name = variantName.toLowerCase();
    if (name.includes('half')) return 0.5;
    if (name.includes('quarter')) return 0.25;
    if (name.includes('full')) return 1.0;
    return 1.0; // Default weight
  };

  const handleUpdateCart = (itemId: number, delta: number, variant?: string) => {
    const key = variant ? `${itemId}-${variant}` : `${itemId}`;

    // Inventory Check
    const item = menuItems.find(i => i.id === itemId);
    if (delta > 0 && item?.track_inventory) {
      const currentTotalWeightInCart = Object.entries(cart).reduce((sum, [k, v]) => {
        if (k.startsWith(`${itemId}-`) || k === `${itemId}`) {
          const kParts = k.split('-');
          const kVariant = kParts.length > 1 ? kParts.slice(1).join('-') : null;
          return sum + (v * getVariantWeight(kVariant));
        }
        return sum;
      }, 0);

      const newWeight = getVariantWeight(variant || null) * delta;

      if (currentTotalWeightInCart + newWeight > (item.stock_count || 0)) {
        Alert.alert('Out of Stock', `Not enough stock available for ${item.name}`);
        return;
      }
    }

    setCart((prev) => {
      const currentQty = prev[key] || 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: newQty };
    });
  };

  const handlePlaceOrder = async () => {
    if (!isShopOpen) {
      Alert.alert('Shop Closed', 'Orders cannot be placed while the shop is closed.');
      return;
    }
    if (!currentSeat || Object.keys(cart).length === 0) return;

    // Calculate total
    const subtotal = Object.entries(cart).reduce((sum, [key, qty]) => {
      const parts = key.split('-');
      const itemId = parseInt(parts[0]);
      const variantName = parts.length > 1 ? parts.slice(1).join('-') : null;
      const item = menuItems.find(i => i.id === itemId);

      let price = item?.price || 0;
      if (variantName && item?.variants) {
        const v = item.variants.find(v => v.name === variantName);
        if (v) price = v.price;
      }
      return sum + (price * qty);
    }, 0);

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    let message = `Items:\n`;
    Object.entries(cart).forEach(([key, qty]) => {
      const parts = key.split('-');
      const itemId = parseInt(parts[0]);
      const variantName = parts.length > 1 ? parts.slice(1).join('-') : null;
      const item = menuItems.find(i => i.id === itemId);
      message += `${qty}x ${item?.name} ${variantName ? `(${variantName})` : ''}\n`;
    });
    message += `\nSubtotal: ₹${subtotal.toFixed(2)}`;
    message += `\nTax (5%): ₹${tax.toFixed(2)}`;
    message += `\nTotal: ₹${total.toFixed(2)}`;

    Alert.alert(
      'Confirm Order',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: async () => {
            try {
              const orderItems = Object.entries(cart).map(([key, qty]) => {
                const parts = key.split('-');
                const itemId = parseInt(parts[0]);
                const variantName = parts.length > 1 ? parts.slice(1).join('-') : null;

                const item = menuItems.find(i => i.id === itemId);
                if (!item) throw new Error(`Item ${itemId} not found`);

                let finalPrice = item.price;
                if (variantName && item.variants) {
                  const v = item.variants.find(v => v.name === variantName);
                  if (v) finalPrice = v.price;
                }

                return {
                  menu_item_id: itemId,
                  quantity: qty,
                  price: finalPrice,
                  variant_name: variantName,
                  notes: itemNotes[key] || null
                };
              });

              // Check for existing active order for this seat
              // For tables (id > 0), we find the single active order.
              // For Parcels (id = 0), we use currentOrder if it was selected, otherwise it's a NEW parcel.
              let existingOrder = currentOrder;
              if (currentSeat.id > 0 && !existingOrder) {
                existingOrder = activeOrders.find(o => o.seat_id === currentSeat.id && (o.status === 'pending' || o.status === 'preparing' || o.status === 'served'));
              }

              let orderId = existingOrder ? existingOrder.id : null;

              if (existingOrder) {
                // Update existing order
                const newTotal = existingOrder.total_amount + subtotal;
                const { error: updateError } = await supabase
                  .from('orders')
                  .update({ total_amount: newTotal })
                  .eq('id', existingOrder.id);

                if (updateError) throw updateError;
              } else {
                // Create new order
                let parcelNumber = null;
                if (currentSeat.id === 0) {
                  // Fetch last_opened_at for the hotel
                  const { data: hotelData } = await supabase
                    .from('hotels')
                    .select('last_opened_at')
                    .eq('id', profile?.hotel_id)
                    .single();

                  const lastOpened = hotelData?.last_opened_at || new Date(0).toISOString();

                  // Count parcels since last opened
                  const { count } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('hotel_id', profile?.hotel_id)
                    .eq('seat_id', 0)
                    .gte('created_at', lastOpened);

                  parcelNumber = (count || 0) + 1;
                }

                const { data: orderData, error: orderError } = await supabase
                  .from('orders')
                  .insert([{
                    hotel_id: profile?.hotel_id,
                    seat_id: currentSeat.id,
                    status: 'pending',
                    total_amount: subtotal,
                    waiter_id: profile?.id,
                    waiter_name: profile?.full_name || profile?.username,
                    parcel_number: parcelNumber
                  }])
                  .select()
                  .single();

                if (orderError) throw orderError;
                orderId = orderData.id;
              }

              if (!orderId) throw new Error("Failed to resolve order ID");

              const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems.map(i => ({
                  order_id: orderId,
                  menu_item_id: i.menu_item_id,
                  quantity: i.quantity,
                  price: i.price,
                  variant_name: i.variant_name,
                  notes: i.notes
                })));

              if (itemsError) throw itemsError;

              // Decrement Stock
              for (const item of orderItems) {
                const weight = getVariantWeight(item.variant_name);
                const { error: stockError } = await supabase.rpc('decrement_menu_item_stock', {
                  p_menu_item_id: item.menu_item_id,
                  p_quantity_float: item.quantity * weight
                });
                if (stockError) console.error("Stock update error:", stockError);
              }

              // Ensure seat is marked as occupied
              const { error: seatError } = await supabase
                .from('seats')
                .update({ status: 'occupied' })
                .eq('id', currentSeat.id);

              if (seatError) console.error("Seat update error:", seatError);

              setCart({});
              setAddItemModalVisible(false);
              setCurrentView('waiter_seats');
              fetchOrders();
              fetchSeats();
              fetchMenuData();
              Alert.alert('Success', 'Order placed successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message);
              console.error(err);
            }
          }
        }
      ]
    );
  };



  const handleCloseOrder = async (orderId: number) => {
    // 1. Find the order with items
    const orderToClose = activeOrders.find(o => o.id === orderId);
    if (!orderToClose) {
      Alert.alert("Error", "Order not found in active list.");
      return;
    }

    // 2. Strict Service Check
    const items = orderToClose.items || [];
    if (items.length === 0) {
      Alert.alert("Cannot Close", "This order has no items. Please cancel the order instead if it was a mistake.");
      return;
    }

    const unservedItems = items.filter(item => (item.status || 'pending') !== 'served');
    if (unservedItems.length > 0) {
      Alert.alert(
        'Cannot Close Order',
        `There are ${unservedItems.length} items still pending. All items must be served or removed before closing the bill.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Close Order',
      'Are you sure you want to close this order? The table will be freed for new customers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Order',
          onPress: async () => {
            try {
              // 3. Update Order Status in DB
              const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'completed' })
                .eq('id', orderId);

              if (orderError) throw orderError;

              // 4. Update Seat Status in DB
              const { error: seatError } = await supabase
                .from('seats')
                .update({ status: 'available' })
                .eq('id', orderToClose.seat_id);

              if (seatError) throw seatError;

              // 5. Update Local State (Don't filter out, just update status)
              setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
              setSeats(prev => prev.map(s => s.id === orderToClose.seat_id ? { ...s, status: 'available' } : s));

              Alert.alert('Success', 'Order moved to Billing section and table is now available.');
            } catch (err) {
              console.error("Close order error:", err);
              Alert.alert('Error', 'Failed to close order. Check your connection.');
            }
          }
        }
      ]
    );
  };

  const handleMarkPaid = async (orderId: number) => {
    Alert.alert(
      'Confirm Payment',
      'Mark this order as Paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('orders')
                .update({ status: 'paid' })
                .eq('id', orderId);

              if (error) throw error;

              // Optimistic update - remove from list as it's archived
              setActiveOrders(prev => prev.filter(o => o.id !== orderId));
              Alert.alert('Success', 'Order marked as Paid');
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to update order');
            }
          }
        }
      ]
    );
  };

  const handleMarkItemAsServed = async (orderId: number, orderItemId: number) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ status: 'served' })
        .eq('id', orderItemId);

      if (error) throw error;

      // Check if all items are served to auto-promote order status
      const order = activeOrders.find(o => o.id === orderId);
      if (order && order.items) {
        const updatedItems = order.items.map(item =>
          item.id === orderItemId ? { ...item, status: 'served' } : item
        );
        const allServed = updatedItems.every(i => i.status === 'served');

        if (allServed && order.status !== 'served') {
          await supabase.from('orders').update({ status: 'served' }).eq('id', orderId);
        }
      }

      fetchOrders();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update item status');
    }
  };

  const handleMarkAsServed = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'served' })
        .eq('id', orderId);

      if (error) throw error;

      // Also mark all items as served for consistency
      await supabase
        .from('order_items')
        .update({ status: 'served' })
        .eq('order_id', orderId);

      fetchOrders();
      Alert.alert('Success', 'Order marked as Served');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This will free the table.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const orderToCancel = activeOrders.find(o => o.id === orderId);
              if (!orderToCancel) return;

              // Check if any items are unserved (treat missing status as pending)
              const hasUnservedItems = orderToCancel.items?.some(item => (item.status || 'pending') !== 'served');
              if (hasUnservedItems) {
                Alert.alert(
                  'Cannot Cancel Order',
                  'This order has pending items. Please remove the unserved items manually first if the customer changed their mind.',
                  [{ text: 'OK' }]
                );
                return;
              }

              const itemsCount = orderToCancel.items?.length || 0;
              if (orderToCancel.status === 'served' && itemsCount > 0) {
                Alert.alert('Cannot Cancel', 'This order has already been served and contains active items. Please remove the items first if you wish to clear this table.');
                return;
              }

              const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', orderId);

              if (orderError) throw orderError;

              const { error: seatError } = await supabase
                .from('seats')
                .update({ status: 'available' })
                .eq('id', orderToCancel.seat_id);

              if (seatError) throw seatError;

              // Restock items
              if (orderToCancel.items) {
                for (const item of orderToCancel.items) {
                  const weight = getVariantWeight(item.variant_name || null);
                  await supabase.rpc('increment_menu_item_stock', {
                    p_menu_item_id: item.menu_item_id,
                    p_quantity_float: item.quantity * weight
                  });
                }
                fetchMenuData(); // Refresh stock display
              }

              setActiveOrders(prev => prev.filter(o => o.id !== orderId));
              setSeats(prev => prev.map(s => s.id === orderToCancel.seat_id ? { ...s, status: 'available' } : s));

              Alert.alert('Success', 'Order cancelled successfully');
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to cancel order');
            }
          }
        }
      ]
    );
  };

  const handleCancelItem = async (orderId: number, orderItemId: number, itemPrice: number) => {
    try {
      // 1. Delete the item
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('id', orderItemId);

      if (deleteError) throw deleteError;

      // 2. Update order or auto-cancel if last item
      const order = activeOrders.find(o => o.id === orderId);
      if (order) {
        const remainingItems = order.items?.filter(i => i.id !== orderItemId) || [];
        const cancelledItem = order.items?.find(i => i.id === orderItemId);
        if (cancelledItem) {
          const weight = getVariantWeight(cancelledItem.variant_name || null);
          await supabase.rpc('increment_menu_item_stock', {
            p_menu_item_id: cancelledItem.menu_item_id,
            p_quantity_float: cancelledItem.quantity * weight
          });
          fetchMenuData();
        }

        if (remainingItems.length === 0) {
          // Last item removed - Auto cancel the order
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
          await supabase.from('seats').update({ status: 'available' }).eq('id', order.seat_id);

          fetchOrders();
          fetchSeats();
          Alert.alert('Order Removed', 'This was the last item. The order has been cancelled and the table is now available.');
          return;
        }

        const newTotal = Math.max(0, order.total_amount - itemPrice);
        const { error: updateError } = await supabase
          .from('orders')
          .update({ total_amount: newTotal })
          .eq('id', orderId);

        if (updateError) throw updateError;
      }

      // 3. Refresh state
      fetchOrders();
      Alert.alert('Success', 'Item removed from order');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const renderMenuView = (isAdmin: boolean) => (
    <MenuView
      currentSeat={currentSeat}
      categories={categories}
      menuItems={menuItems}
      selectedCategory={selectedCategory}
      onCategorySelect={setSelectedCategory}
      isAdmin={isAdmin}
      onBack={() => {
        setCurrentView(isAdmin ? 'admin_dashboard' : 'waiter_seats');
        setCurrentSeat(null);
        setCurrentOrder(null);
        setCart({});
        setItemNotes({});
      }}
      onAddItem={() => {
        setEditingItem(null);
        setAddItemModalVisible(true);
      }}
      onDeleteItem={handleDeleteItem}
      onEditItem={(item) => {
        setEditingItem(item);
        setAddItemModalVisible(true);
      }}
      activeOrders={activeOrders}
      onMarkAsServed={handleMarkAsServed}
      onMarkItemServed={handleMarkItemAsServed}
      onMarkPaid={handleMarkPaid}
      onCloseOrder={handleCloseOrder}
      onCancelOrder={handleCancelOrder}
      onCancelItem={handleCancelItem}
      onAddCategory={() => setAddCategoryModalVisible(true)}
      cart={cart}
      onUpdateCart={handleUpdateCart}
      itemNotes={itemNotes}
      onUpdateNote={(key, note) => setItemNotes(prev => ({ ...prev, [key]: note }))}
      onPlaceOrder={handlePlaceOrder}
    />
  );

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!session || !profile) {
    return <AuthScreen onLoginSuccess={() => { }} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />

        {/* Header - Show User Info? */}
        {!currentView.includes('menu') && (
          <Header
            currentView={currentView}
            userRole={profile.role}
            userName={profile.full_name || profile.username}
            onLogout={() => {
              Alert.alert('Logout', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => supabase.auth.signOut() }
              ]);
            }}
            onAddWaiter={() => setAddWaiterModalVisible(true)}
            currentTableCount={seats.filter(s => s.id > 0).length}
            onSetTableCount={async (count) => {
              try {
                const { error } = await supabase.rpc('set_hotel_tables', { p_table_count: count });
                if (error) throw error;
                await fetchSeats(); // Refresh seats immediately
                Alert.alert('Success', `Tables updated to ${count}`);
              } catch (err: any) {
                Alert.alert('Error', err.message);
              }
            }}
            onViewChange={(view) => {
              // Prevent Waiters from accessing Admin Dashboard
              if (view === 'admin_dashboard' && profile.role !== 'admin') {
                Alert.alert('Access Denied', 'Waiters cannot access Admin Dashboard');
                return;
              }
              setCurrentView(view as any);
            }}
          />
        )}


        <SafeAreaView style={styles.main} edges={['bottom']}>
          {(currentView === 'waiter_seats') && (
            <SeatMap
              seats={seats}
              onSeatSelect={handleSeatSelect}
              loading={loading}
              error={error}
              activeOrders={activeOrders}
              currentUserId={profile?.id}
            />
          )}

          {currentView === 'waiter_menu' && renderMenuView(false)}

          {(currentView === 'kitchen_view') && (
            <KitchenView
              activeOrders={activeOrders}
              waiters={waiters}
              onMarkAsServed={handleMarkAsServed}
              onMarkItemServed={handleMarkItemAsServed}
            />
          )}

          {currentView === 'admin_dashboard' && (
            // Security check for rendering
            profile.role === 'admin' ? (
              <>
                <AdminDashboard
                  hotelName={(profile.hotel_slug || '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                  seats={seats}
                  activeOrders={activeOrders}
                  onManageMenu={() => setCurrentView('admin_menu')}
                  onCloseOrder={handleCloseOrder}
                  onMarkPaid={handleMarkPaid}
                  onAddWaiter={() => setAddWaiterModalVisible(true)}
                  onSwitchToWaiterView={() => setCurrentView('waiter_seats')}
                  waiters={waiters}
                  onDeleteWaiter={handleDeleteWaiter}
                  onViewReports={() => setCurrentView('admin_reports')}
                  isOpen={isShopOpen}
                  onToggleShop={handleToggleShopStatus}
                  onMarkAsServed={handleMarkAsServed}
                  onCancelOrder={handleCancelOrder}
                  onCancelItem={handleCancelItem}
                  onMarkItemServed={handleMarkItemAsServed}
                />
                {/* Modals */}
                <AddWaiterModal
                  visible={isAddWaiterModalVisible}
                  onClose={() => setAddWaiterModalVisible(false)}
                  hotelSlug={profile?.hotel_slug || ''}
                  hotelName={(profile?.hotel_slug || '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')} // No spaces for username generation
                  hotelId={profile?.hotel_id || ''}
                  onSuccess={fetchWaiters}
                />
              </>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Access Restricted</Text>
              </View>
            )
          )}

          {currentView === 'admin_menu' && profile.role === 'admin' && renderMenuView(true)}

          {currentView === 'admin_reports' && profile.role === 'admin' && (
            <Reports
              hotelId={profile.hotel_id}
              onBack={() => setCurrentView('admin_dashboard')}
            />
          )}
        </SafeAreaView>

        {/* Only Admins can see the modal potentially? Or re-use for something else? */}
        <AddItemModal
          visible={isAddItemModalVisible}
          onClose={() => {
            setAddItemModalVisible(false);
            setEditingItem(null);
          }}
          categories={categories}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onOpenAddCategory={() => setAddCategoryModalVisible(true)}
          itemToEdit={editingItem}
        />

        <AddCategoryModal
          visible={isAddCategoryModalVisible}
          onClose={() => setAddCategoryModalVisible(false)}
          onAddCategory={handleAddCategory}
        />

        <ParcelSelectionModal
          visible={isParcelModalVisible}
          onClose={() => setParcelModalVisible(false)}
          activeParcels={parcelSelectionParcels}
          onSelectParcel={(p) => enterMenuMode(parcelSelectionSeat!, p)}
          onStartNew={() => enterMenuMode(parcelSelectionSeat!)}
        />
      </SafeAreaView>
    </SafeAreaProvider >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  main: {
    flex: 1,
  },
});