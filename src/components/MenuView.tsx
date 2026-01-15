import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, TextInput } from 'react-native';
import { ChevronLeft, Plus, Trash2, UtensilsCrossed, ChevronRight } from 'lucide-react-native';
import { Category, MenuItem, Seat, Order } from '../types';

interface MenuViewProps {
    currentSeat: Seat | null;
    categories: Category[];
    menuItems: MenuItem[];
    selectedCategory: number | null;
    onCategorySelect: (id: number) => void;
    isAdmin?: boolean;
    onBack: () => void;
    onAddItem?: () => void;
    onAddCategory?: () => void;
    onDeleteItem?: (id: number) => void;
    cart?: Record<string, number>;
    onUpdateCart?: (itemId: number, delta: number, variant?: string) => void;
    onPlaceOrder?: () => void;
    onEditItem?: (item: MenuItem) => void;
    activeOrders?: Order[];
    onMarkAsServed?: (orderId: number) => void;
    onMarkPaid?: (orderId: number) => void;
    onCloseOrder?: (orderId: number) => void;
    onCancelOrder?: (orderId: number) => void;
    onCancelItem?: (orderId: number, orderItemId: number, itemPrice: number) => void;
    onMarkItemServed?: (orderId: number, orderItemId: number) => void;
    itemNotes?: Record<string, string>;
    onUpdateNote?: (key: string, note: string) => void;
}

export default function MenuView({
    currentSeat,
    categories,
    menuItems,
    selectedCategory,
    onCategorySelect,
    isAdmin = false,
    onBack,
    onAddItem,
    onAddCategory,
    onDeleteItem,
    cart = {},
    onUpdateCart,
    onPlaceOrder,
    onEditItem,
    activeOrders = [],
    onMarkAsServed,
    onMarkPaid,
    onCloseOrder,
    onCancelOrder,
    onCancelItem,
    onMarkItemServed,
    itemNotes = {},
    onUpdateNote
}: MenuViewProps) {
    const [selectedVariantItem, setSelectedVariantItem] = React.useState<MenuItem | null>(null);
    const [noteModalVisible, setNoteModalVisible] = React.useState(false);
    const [currentNoteKey, setCurrentNoteKey] = React.useState<string | null>(null);
    const [tempNote, setTempNote] = React.useState('');

    const activeOrder = activeOrders.find(o => o.seat_id === currentSeat?.id && (o.status === 'pending' || o.status === 'preparing' || o.status === 'served'));

    const filteredItems = selectedCategory
        ? menuItems.filter(item => item.category_id === selectedCategory)
        : menuItems;

    const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    const totalPrice = Object.entries(cart).reduce((sum, [key, qty]) => {
        // key is itemId-variantName or just itemId
        const parts = key.split('-');
        const itemId = parseInt(parts[0]);
        const variantName = parts.length > 1 ? parts.slice(1).join('-') : null;

        const item = menuItems.find(i => i.id === itemId);
        if (!item) return sum;

        let price = item.price;
        if (variantName && item.variants) {
            const v = item.variants.find(v => v.name === variantName);
            if (v) price = v.price;
        }

        return sum + (price * qty);
    }, 0);

    const getCartQty = (item: MenuItem) => {
        return Object.entries(cart)
            .filter(([key]) => key.startsWith(`${item.id}`))
            .reduce((sum, [, qty]) => sum + qty, 0);
    };

    return (
        <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ChevronLeft size={24} color="#334155" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.menuHeaderTitle}>
                        {isAdmin ? 'Manage Menu' : currentSeat?.id === 0 ? (activeOrder?.parcel_number ? `Parcel #${activeOrder.parcel_number}` : 'Parcel') : `Table ${currentSeat?.id}`}
                    </Text>
                    <Text style={styles.menuHeaderSubtitle}>{isAdmin ? 'Add or Remove Items' : 'Manage Orders'}</Text>
                </View>
                {isAdmin ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {onAddItem && (
                            <TouchableOpacity onPress={onAddItem} style={[styles.addButton, { backgroundColor: '#f97316' }]}>
                                <UtensilsCrossed size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : <View style={{ width: 40 }} />}
            </View>

            {/* Active Order Status (Checkpoint 25) */}
            {!isAdmin && activeOrder && (
                <View style={[styles.activeOrderBar, activeOrder.status === 'served' ? styles.activeOrderBarServed : styles.activeOrderBarPreparing]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.activeOrderLabel}>Current Order Status</Text>
                        <Text style={styles.activeOrderStatusText}>
                            {activeOrder.status === 'served' ? 'Delivered to Table' : 'In Preparation...'}
                        </Text>
                    </View>
                    {activeOrder.status !== 'served' && onMarkAsServed && (
                        <TouchableOpacity
                            style={styles.markServedBtn}
                            onPress={() => onMarkAsServed(activeOrder.id)}
                        >
                            <Text style={styles.markServedBtnText}>Mark as Served</Text>
                        </TouchableOpacity>
                    )}
                    {activeOrder.status === 'served' && (
                        <View style={styles.servedBadge}>
                            <Text style={styles.servedBadgeText}>SERVED</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={[styles.markServedBtn, { backgroundColor: '#fee2e2', marginLeft: 8 }]}
                        onPress={() => onCancelOrder && onCancelOrder(activeOrder.id)}
                    >
                        <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Active Items Management (Waiters) */}
            {!isAdmin && activeOrder && activeOrder.items && activeOrder.items.length > 0 && (
                <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 }}>Order Details</Text>

                    {/* Pending Items */}
                    {activeOrder.items.filter(i => i.status === 'pending').length > 0 && (
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#f97316', marginBottom: 4 }}>Pending Delivery</Text>
                            <View style={{ backgroundColor: '#fffbeb', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#fef3c7' }}>
                                {activeOrder.items.filter(i => i.status === 'pending').map((item, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                            <Text style={{ fontWeight: 'bold', color: '#f97316' }}>{item.quantity}x</Text>
                                            <Text style={{ color: '#1e293b', fontWeight: '500' }}>{item.menu_item?.name}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <TouchableOpacity
                                                onPress={() => onMarkItemServed?.(activeOrder.id, item.id)}
                                                style={{ backgroundColor: '#f97316', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                                            >
                                                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>Serve</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => onCancelItem && onCancelItem(activeOrder.id, item.id, item.price * item.quantity)}>
                                                <Trash2 size={16} color="#94a3b8" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Served Items */}
                    {activeOrder.items.filter(i => i.status === 'served').length > 0 && (
                        <View>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#16a34a', marginBottom: 4 }}>Served Items</Text>
                            <View style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#dcfce7' }}>
                                {activeOrder.items.filter(i => i.status === 'served').map((item, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                            <Text style={{ fontWeight: 'bold', color: '#16a34a' }}>{item.quantity}x</Text>
                                            <Text style={{ color: '#1e293b', opacity: 0.6 }}>{item.menu_item?.name}</Text>
                                        </View>
                                        <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <Text style={{ color: '#16a34a', fontSize: 10, fontWeight: 'bold' }}>SERVED</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.categoryListContainer}>
                <FlatList
                    horizontal
                    data={categories}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryList}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => onCategorySelect(item.id)}
                            style={[
                                styles.categoryChip,
                                selectedCategory === item.id && styles.categoryChipActive
                            ]}
                        >
                            <Text style={[
                                styles.categoryChipText,
                                selectedCategory === item.id && styles.categoryChipTextActive
                            ]}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            <FlatList
                data={filteredItems}
                numColumns={2}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={[styles.menuGrid, totalItems > 0 && !isAdmin && { paddingBottom: 100 }]}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                renderItem={({ item }) => {
                    const qty = getCartQty(item);
                    const hasVariants = item.variants && item.variants.length > 0;

                    const isSoldOut = !item.available;

                    return (
                        <View style={[
                            styles.menuItemCard,
                            qty > 0 && !isAdmin && styles.menuItemCardActive,
                            isSoldOut && !isAdmin && styles.menuItemCardSoldOut
                        ]}>
                            <TouchableOpacity
                                style={{ flex: 1, gap: 8 }}
                                activeOpacity={(!isAdmin && !hasVariants && qty > 0) ? 1 : 0.7}
                                disabled={isSoldOut && !isAdmin}
                                onPress={() => {
                                    if (isAdmin) {
                                        onEditItem && onEditItem(item);
                                        return;
                                    }
                                    if (hasVariants) {
                                        setSelectedVariantItem(item);
                                    } else {
                                        if (qty === 0) onUpdateCart && onUpdateCart(item.id, 1);
                                    }
                                }}
                            >
                                <View style={styles.menuItemImagePlaceholder}>
                                    <UtensilsCrossed size={32} color={isSoldOut ? "#e2e8f0" : (qty > 0 ? "#fbbf24" : "#cbd5e1")} />
                                    {isSoldOut && !isAdmin && (
                                        <View style={styles.soldOutBadge}>
                                            <Text style={styles.soldOutText}>SOLD OUT</Text>
                                        </View>
                                    )}
                                    {qty > 0 && !isAdmin && !isSoldOut && (
                                        <View style={styles.qtyBadge}>
                                            <Text style={styles.qtyBadgeText}>{qty}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.menuItemContent}>
                                    <View style={styles.menuItemHeader}>
                                        <View style={[
                                            styles.vegBadge,
                                            item.is_veg ? styles.vegBadgeGreen : styles.vegBadgeRed
                                        ]}>
                                            <View style={[
                                                styles.vegBadgeDot,
                                                item.is_veg ? styles.vegBadgeDotGreen : styles.vegBadgeDotRed
                                            ]} />
                                        </View>
                                        <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                                    </View>
                                    <Text style={styles.menuItemName}>{item.name}</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                        {hasVariants ? (
                                            <Text style={{ fontSize: 10, color: '#f97316' }}>Customizable</Text>
                                        ) : <View />}
                                        {item.track_inventory && !isSoldOut && (
                                            <Text style={{ fontSize: 10, color: item.stock_count! < 10 ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
                                                {item.stock_count} Left
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {!isAdmin && !hasVariants && qty > 0 && (
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={styles.qtyControls}>
                                        <TouchableOpacity
                                            style={styles.qtyButton}
                                            onPress={() => onUpdateCart && onUpdateCart(item.id, -1)}
                                        >
                                            <Text style={styles.qtyButtonText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>{qty}</Text>
                                        <TouchableOpacity
                                            style={styles.qtyButton}
                                            onPress={() => onUpdateCart && onUpdateCart(item.id, 1)}
                                        >
                                            <Text style={styles.qtyButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.addNoteBtn}
                                        onPress={() => {
                                            setCurrentNoteKey(item.id.toString());
                                            setTempNote(itemNotes[item.id.toString()] || '');
                                            setNoteModalVisible(true);
                                        }}
                                    >
                                        <Plus size={10} color="#f97316" />
                                        <Text style={styles.addNoteText}>
                                            {itemNotes[item.id.toString()] ? 'Edit Note' : 'Add Note'}
                                        </Text>
                                    </TouchableOpacity>
                                    {itemNotes[item.id.toString()] && (
                                        <Text style={styles.cartItemNote} numberOfLines={1}>
                                            "{itemNotes[item.id.toString()]}"
                                        </Text>
                                    )}
                                </View>
                            )}

                            {isAdmin && onDeleteItem && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => onDeleteItem(item.id)}
                                >
                                    <Trash2 size={16} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No items found in this category.</Text>
                    </View>
                }
            />

            {/* Variant Selector Modal */}
            {
                selectedVariantItem && (
                    <View style={StyleSheet.absoluteFillObject}>
                        <TouchableOpacity
                            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
                            onPress={() => setSelectedVariantItem(null)}
                        />
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{selectedVariantItem.name}</Text>
                            <Text style={{ color: '#64748b', marginBottom: 20 }}>Select Portion Size</Text>

                            {selectedVariantItem.variants?.map((v, idx) => {
                                // Correctly check if THIS variant is in cart
                                const key = `${selectedVariantItem.id}-${v.name}`;
                                const vQty = cart[key] || 0;

                                return (
                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 }}>
                                        <View>
                                            <Text style={{ fontSize: 16, fontWeight: '600' }}>{v.name}</Text>
                                            <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>₹{v.price}</Text>
                                        </View>

                                        {vQty > 0 ? (
                                            <View style={{ alignItems: 'flex-end', width: 100 }}>
                                                <View style={[styles.qtyControls, { marginTop: 0, width: '100%' }]}>
                                                    <TouchableOpacity style={styles.qtyButton} onPress={() => onUpdateCart?.(selectedVariantItem.id, -1, v.name)}>
                                                        <Text style={styles.qtyButtonText}>-</Text>
                                                    </TouchableOpacity>
                                                    <Text style={styles.qtyText}>{vQty}</Text>
                                                    <TouchableOpacity style={styles.qtyButton} onPress={() => onUpdateCart?.(selectedVariantItem.id, 1, v.name)}>
                                                        <Text style={styles.qtyButtonText}>+</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.addNoteBtn}
                                                    onPress={() => {
                                                        const key = `${selectedVariantItem.id}-${v.name}`;
                                                        setCurrentNoteKey(key);
                                                        setTempNote(itemNotes[key] || '');
                                                        setNoteModalVisible(true);
                                                    }}
                                                >
                                                    <Text style={styles.addNoteText}>
                                                        {itemNotes[`${selectedVariantItem.id}-${v.name}`] ? 'Edit Note' : 'Add Note'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={{ backgroundColor: '#fff7ed', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#fdba74' }}
                                                onPress={() => onUpdateCart?.(selectedVariantItem.id, 1, v.name)}
                                            >
                                                <Text style={{ color: '#ea580c', fontWeight: 'bold' }}>ADD</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}

                            <TouchableOpacity
                                style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 }}
                                onPress={() => setSelectedVariantItem(null)}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            }



            {/* Floating Order Summary */}
            {
                !isAdmin && totalItems > 0 && (
                    <View style={styles.summaryBar}>
                        <View>
                            <Text style={styles.summaryText}>{totalItems} items selected</Text>
                            <Text style={styles.summaryTotal}>₹{totalPrice}</Text>
                        </View>
                        <TouchableOpacity style={styles.viewOrderButton} onPress={onPlaceOrder}>
                            <Text style={styles.viewOrderButtonText}>Place Order</Text>
                            <ChevronRight size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )
            }

            <Modal
                visible={noteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setNoteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.noteCard}>
                        <Text style={styles.noteTitle}>Item Note</Text>
                        <Text style={styles.noteSubtitle}>Add special instructions (e.g. No onions, Extra spicy)</Text>
                        <TextInput
                            style={styles.noteInput}
                            multiline
                            placeholder="Type instructions here..."
                            value={tempNote}
                            onChangeText={setTempNote}
                            autoFocus
                        />
                        <View style={styles.noteButtons}>
                            <TouchableOpacity
                                onPress={() => setNoteModalVisible(false)}
                                style={styles.noteCancel}
                            >
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (currentNoteKey && onUpdateNote) {
                                        onUpdateNote(currentNoteKey, tempNote);
                                    }
                                    setNoteModalVisible(false);
                                }}
                                style={styles.noteSave}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Note</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    menuContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    menuHeader: {
        backgroundColor: '#ffffff',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    menuHeaderTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
    },
    menuHeaderSubtitle: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
    categoryListContainer: {
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    categoryList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    categoryChipActive: {
        backgroundColor: '#fff7ed',
        borderColor: '#fdba74',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    categoryChipTextActive: {
        color: '#ea580c',
    },
    menuGrid: {
        padding: 16,
        gap: 16,
    },
    menuItemCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        gap: 12,
        marginBottom: 16,
    },
    menuItemImagePlaceholder: {
        width: '100%',
        height: 100,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemContent: {
        gap: 8,
    },
    menuItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vegBadge: {
        padding: 4,
        borderWidth: 1,
        borderRadius: 4,
    },
    vegBadgeGreen: {
        borderColor: '#16a34a',
    },
    vegBadgeRed: {
        borderColor: '#dc2626',
    },
    vegBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    vegBadgeDotGreen: {
        backgroundColor: '#16a34a',
    },
    vegBadgeDotRed: {
        backgroundColor: '#dc2626',
    },
    menuItemPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    menuItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        lineHeight: 20,
    },
    unitPriceText: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: -4,
        marginBottom: 4,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyStateText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    addButton: {
        backgroundColor: '#0f172a',
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fee2e2',
        padding: 8,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    menuItemCardActive: {
        borderColor: '#fdba74',
        borderWidth: 1,
        backgroundColor: '#fff7ed',
    },
    qtyBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#f97316',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    qtyBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    menuItemCardSoldOut: {
        opacity: 0.6,
        backgroundColor: '#f1f5f9',
    },
    soldOutBadge: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    soldOutText: {
        backgroundColor: '#ef4444',
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 8,
        padding: 2,
    },
    qtyButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    qtyButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#f97316',
    },
    qtyText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },
    addButtonMock: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingVertical: 6,
        alignItems: 'center',
    },
    addButtonMockText: {
        color: '#f97316',
        fontWeight: '700',
        fontSize: 12,
    },
    summaryBar: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    summaryText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
    },
    summaryTotal: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '800',
    },
    viewOrderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ea580c',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    viewOrderButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14,
    },
    activeOrderBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        marginTop: 0,
        borderRadius: 16,
        borderWidth: 1,
    },
    activeOrderBarPreparing: {
        backgroundColor: '#fffbeb',
        borderColor: '#fef3c7',
    },
    activeOrderBarServed: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
    },
    activeOrderLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#92400e',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    activeOrderStatusText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    markServedBtn: {
        backgroundColor: '#f97316',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    markServedBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    servedBadge: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    servedBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    noteCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    noteSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 16,
    },
    noteInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 16,
        marginBottom: 20,
    },
    noteButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    noteCancel: {
        padding: 12,
    },
    noteSave: {
        backgroundColor: '#f97316',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    cartItemNote: {
        fontSize: 12,
        color: '#f97316',
        fontStyle: 'italic',
        marginTop: 2,
    },
    addNoteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    addNoteText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
    },
    noteBadge: {
        backgroundColor: '#fff7ed',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ffedd5',
    },
    noteBadgeText: {
        fontSize: 10,
        color: '#f97316',
        fontWeight: '700',
    },
});
