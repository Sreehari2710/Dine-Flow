import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Clock, CheckCircle2, Package, UtensilsCrossed } from 'lucide-react-native';
import { Order, OrderItem, Profile } from '../types';

interface KitchenViewProps {
    activeOrders: Order[];
    waiters: Profile[];
    onMarkItemServed: (orderId: number, orderItemId: number) => void;
    onMarkAsServed: (orderId: number) => void;
}

export default function KitchenView({ activeOrders, waiters, onMarkItemServed, onMarkAsServed }: KitchenViewProps) {
    // KDS should only show orders that are pending, preparing, or served (if some items are still pending)
    // We sort by created_at (time-in)
    const kdsOrders = activeOrders
        .filter(o => o.status === 'pending' || o.status === 'preparing' || (o.status === 'served' && o.items?.some(i => i.status === 'pending')))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Kitchen Display System</Text>
                    <Text style={styles.subtitle}>{kdsOrders.length} active orders</Text>
                </View>
                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            {kdsOrders.length === 0 ? (
                <View style={styles.emptyState}>
                    <UtensilsCrossed size={64} color="#e2e8f0" />
                    <Text style={styles.emptyText}>All orders served! Take a rest.</Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {kdsOrders.map((order) => {
                        const timeIn = new Date(order.created_at);
                        const waitTime = Math.floor((new Date().getTime() - timeIn.getTime()) / 60000);

                        return (
                            <View key={order.id} style={[
                                styles.orderCard,
                                waitTime > 15 && styles.orderCardDelayed
                            ]}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.orderLabel}>
                                            {order.seat_id === 0 ? `Parcel #${order.parcel_number || '?'}` : `Table ${order.seat_id}`}
                                        </Text>
                                        <View style={styles.timeContainer}>
                                            <Clock size={12} color="#64748b" />
                                            <Text style={styles.timeText}>{waitTime}m ago</Text>
                                            <Text style={styles.waiterText}>
                                                • {waiters.find(w => w.id === order.waiter_id)?.role === 'kitchen' ? 'Chef' : 'Wait'}: {order.waiter_name || 'Staff'}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.completeBtn}
                                        onPress={() => onMarkAsServed(order.id)}
                                    >
                                        <CheckCircle2 size={24} color="#16a34a" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.itemsList}>
                                    {order.items?.map((item, idx) => {
                                        const isServed = item.status === 'served';
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={[styles.itemRow, isServed && styles.itemRowServed]}
                                                onPress={() => !isServed && onMarkItemServed(order.id, item.id)}
                                            >
                                                <View style={styles.itemMain}>
                                                    <Text style={[styles.itemQty, isServed && styles.textServed]}>{item.quantity}x</Text>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.itemName, isServed && styles.textServed]}>
                                                            {item.menu_item?.name || 'Item'}
                                                        </Text>
                                                        {item.menu_item?.variants && (
                                                            <Text style={[styles.variantText, isServed && styles.textServed]}>
                                                                {item.menu_item.variants[0]?.name}
                                                            </Text>
                                                        )}
                                                        {item.notes && (
                                                            <View style={styles.noteContainer}>
                                                                <Text style={styles.itemNoteText}>"{item.notes}"</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                {!isServed && (
                                                    <View style={styles.serveAction}>
                                                        <Text style={styles.serveActionText}>SERVE</Text>
                                                    </View>
                                                )}
                                                {isServed && (
                                                    <CheckCircle2 size={16} color="#16a34a" />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    liveText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ef4444',
    },
    grid: {
        padding: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    orderCard: {
        width: '100%', // Use full width to prevent text squeeze on mobile
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    orderCardDelayed: {
        borderColor: '#fee2e2',
        backgroundColor: '#fffafb',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    orderLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    timeText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    waiterText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
        marginLeft: 4,
    },
    completeBtn: {
        padding: 4,
    },
    itemsList: {
        gap: 10,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    itemRowServed: {
        opacity: 0.6,
        backgroundColor: '#f1f5f9',
    },
    itemMain: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        flex: 1,
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '800',
        color: '#f97316',
        backgroundColor: '#fff7ed',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 35,
        textAlign: 'center',
    },
    itemName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#334155',
    },
    variantText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
    },
    textServed: {
        textDecorationLine: 'line-through',
        color: '#94a3b8',
    },
    noteContainer: {
        marginTop: 4,
        backgroundColor: '#fff7ed',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    itemNoteText: {
        fontSize: 12,
        color: '#ea580c',
        fontWeight: '600',
        fontStyle: 'italic',
    },
    serveAction: {
        backgroundColor: '#0f172a',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    serveActionText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
    },
    emptyState: {
        paddingVertical: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 18,
        color: '#94a3b8',
        fontWeight: '600',
    },
});
