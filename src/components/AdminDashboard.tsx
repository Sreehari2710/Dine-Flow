import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { Clock, CheckCircle2, LayoutDashboard, UtensilsCrossed, ChevronRight, LogOut, Eye, Settings, Trash2, User, BarChart3 } from 'lucide-react-native';
import { Seat, Order, Profile } from '../types';
import { TAX_RATE } from '../constants';
import { supabase } from '../../supabase';

interface AdminDashboardProps {
    hotelName?: string;
    seats: Seat[];
    activeOrders: Order[];
    onManageMenu: () => void;
    onCloseOrder: (orderId: number) => void;
    onMarkPaid: (orderId: number) => void;
    onAddWaiter: () => void;
    onSwitchToWaiterView: () => void;
    waiters?: Profile[];
    onDeleteWaiter?: (id: string) => void;
    onViewReports: () => void;
    isOpen: boolean;
    onToggleShop: (status: boolean) => void;
    onMarkAsServed: (orderId: number) => void;
    onCancelOrder: (orderId: number) => void;
    onCancelItem: (orderId: number, orderItemId: number, itemPrice: number) => void;
    onMarkItemServed: (orderId: number, orderItemId: number) => void;
}

export default function AdminDashboard({ hotelName, seats, activeOrders = [], onManageMenu, onCloseOrder, onMarkPaid, onAddWaiter, onSwitchToWaiterView, waiters = [], onDeleteWaiter, onViewReports, isOpen, onToggleShop, onMarkAsServed, onCancelOrder, onCancelItem, onMarkItemServed }: AdminDashboardProps) {
    const occupiedSeats = seats.filter(s => s.status === 'occupied').length;




    return (
        <ScrollView contentContainerStyle={styles.mainContent}>
            <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                        <Text style={styles.sectionTitle}>{hotelName ? `${hotelName} Admin` : 'Admin Dashboard'}</Text>
                        <Text style={styles.sectionSubtitle}>Real-time floor monitoring.</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.shopToggle, isOpen ? styles.shopToggleOpen : styles.shopToggleClosed]}
                        onPress={() => {
                            Alert.alert(
                                isOpen ? 'Close Shop?' : 'Open Shop?',
                                isOpen ? 'Waiters will be locked out from taking new orders.' : 'Waiters will be able to start new orders.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: isOpen ? 'Close Now' : 'Open Now',
                                        style: isOpen ? 'destructive' : 'default',
                                        onPress: () => onToggleShop(!isOpen)
                                    }
                                ]
                            );
                        }}
                    >
                        <View style={[styles.statusDot, { backgroundColor: isOpen ? '#22c55e' : '#ef4444' }]} />
                        <Text style={[styles.shopToggleText, { color: isOpen ? '#16a34a' : '#dc2626' }]}>
                            {isOpen ? 'SHOP OPEN' : 'SHOP CLOSED'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Active Stats Cards */}
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
                <View style={[styles.statCard, styles.statCardBlue]}>
                    <View style={styles.statHeader}>
                        <Clock size={24} color="rgba(255,255,255,0.8)" />
                    </View>
                    <Text style={styles.statValue}>{activeOrders.length}</Text>
                    <Text style={styles.statLabel}>Active Orders</Text>
                    <View style={styles.statDecoration} />
                </View>

                <View style={[styles.statCard, styles.statCardEmerald]}>
                    <View style={styles.statHeader}>
                        <CheckCircle2 size={24} color="rgba(255,255,255,0.8)" />
                    </View>
                    <Text style={styles.statValue}>{seats.filter(s => s.status === 'occupied').length}</Text>
                    <Text style={styles.statLabel}>Occupied Tables</Text>
                    <View style={styles.statDecoration} />
                </View>
            </View>

            {/* Active Orders List */}
            <View style={{ marginBottom: 24 }}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Incoming Orders</Text>
                </View>
                {activeOrders.filter(o => o.status !== 'completed').length === 0 ? (
                    <View style={styles.emptyState}>
                        <CheckCircle2 size={48} color="#cbd5e1" />
                        <Text style={styles.emptyStateText}>No active kitchen orders</Text>
                    </View>
                ) : (
                    activeOrders.filter(o => o.status !== 'completed').map(order => (
                        <View key={order.id} style={styles.orderCard}>
                            <View style={styles.orderCardHeader}>
                                <View>
                                    <Text style={styles.orderCardTitle}>
                                        {order.seat_id === 0 ? `Parcel #${order.parcel_number || '?'}` : `Table ${order.seat_id}`}
                                    </Text>
                                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                        <Text style={styles.orderCardTime}>{new Date(order.created_at).toLocaleTimeString()}</Text>
                                        <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <Text style={{ fontSize: 10, color: '#64748b' }}>
                                                {waiters.find(w => w.id === order.waiter_id)?.role === 'kitchen' ? 'Chef' : 'Wait'}: {order.waiter_name || 'Staff'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    order.status === 'served' ? { backgroundColor: '#dcfce7' } : { backgroundColor: '#fef3c7' }
                                ]}>
                                    <Text style={[
                                        styles.statusBadgeText,
                                        order.status === 'served' ? { color: '#16a34a' } : { color: '#d97706' }
                                    ]}>
                                        {order.status === 'served' ? 'Served' : order.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.orderItemsList}>
                                {order.items?.map((item, idx) => (
                                    <View key={idx} style={[styles.orderItemRow, { justifyContent: 'space-between' }]}>
                                        <View style={{ flex: 1, paddingRight: 8 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                                                <Text style={styles.orderItemName}>{item.menu_item?.name || 'Item'}</Text>
                                            </View>
                                            {item.notes && (
                                                <View style={{ backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4, marginLeft: 24, alignSelf: 'flex-start' }}>
                                                    <Text style={{ fontSize: 11, color: '#ea580c', fontStyle: 'italic', fontWeight: '600' }}>
                                                        "{item.notes}"
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            {item.status === 'served' ? (
                                                <Text style={{ color: '#16a34a', fontSize: 10, fontWeight: 'bold' }}>✓ Served</Text>
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => onMarkItemServed(order.id, item.id)}
                                                    style={{ backgroundColor: '#fff7ed', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#ffedd5' }}
                                                >
                                                    <Text style={{ color: '#f97316', fontSize: 10, fontWeight: 'bold' }}>Serve</Text>
                                                </TouchableOpacity>
                                            )}
                                            <Text style={styles.orderItemPrice}>₹{item.price * item.quantity}</Text>
                                            {item.status === 'pending' && (
                                                <TouchableOpacity onPress={() => onCancelItem(order.id, item.id, item.price * item.quantity)}>
                                                    <Trash2 size={14} color="#ef4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.orderCardFooter}>
                                <View style={{ flex: 1 }}>
                                    <View>
                                        <Text style={styles.totalText}>Subtotal: ₹{order.total_amount}</Text>
                                        <Text style={styles.totalText}>Tax (5%): ₹{(order.total_amount * TAX_RATE).toFixed(2)}</Text>
                                    </View>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <View style={{ marginBottom: 12, alignItems: 'flex-end' }}>
                                        <Text style={[styles.totalText, { fontSize: 10 }]}>Grand Total</Text>
                                        <Text style={styles.totalAmount}>
                                            ₹{(order.total_amount * (1 + TAX_RATE)).toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        {order.status !== 'served' && (
                                            <TouchableOpacity
                                                style={[styles.closeButton, { backgroundColor: '#f97316', paddingHorizontal: 12 }]}
                                                onPress={() => onMarkAsServed(order.id)}
                                            >
                                                <Text style={[styles.closeButtonText, { fontSize: 12 }]}>Serve</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={[styles.closeButton, { paddingHorizontal: 12 }]}
                                            onPress={() => onCloseOrder(order.id)}
                                        >
                                            <Text style={[styles.closeButtonText, { fontSize: 12 }]}>Close</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.closeButton, { backgroundColor: '#ef4444', paddingHorizontal: 10 }]}
                                            onPress={() => onCancelOrder(order.id)}
                                        >
                                            <Trash2 size={14} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Billing Section (Completed Orders) */}
            <View style={{ marginBottom: 24 }}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Ready for Bill</Text>
                    <Text style={styles.sectionSubtitle}>Closed orders awaiting payment</Text>
                </View>
                {activeOrders.filter(o => o.status === 'completed').length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No unpaid bills</Text>
                    </View>
                ) : (
                    activeOrders.filter(o => o.status === 'completed').map(order => (
                        <View key={order.id} style={[styles.orderCard, { borderColor: '#22c55e', borderWidth: 2 }]}>
                            <View style={styles.orderCardHeader}>
                                <View>
                                    <Text style={styles.orderCardTitle}>
                                        {order.seat_id === 0 ? `Parcel #${order.parcel_number || '?'}` : `Table ${order.seat_id}`}
                                    </Text>
                                    <Text style={[styles.orderCardTime, { color: '#22c55e' }]}>Order Closed</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                                    <Text style={[styles.statusBadgeText, { color: '#16a34a' }]}>Bill Ready</Text>
                                </View>
                            </View>

                            <View style={styles.orderItemsList}>
                                {order.items?.map((item, idx) => (
                                    <View key={idx} style={[styles.orderItemRow, { justifyContent: 'space-between' }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                                            <Text style={styles.orderItemName}>{item.menu_item?.name || 'Item'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            {item.status === 'served' && (
                                                <Text style={{ color: '#16a34a', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                                            )}
                                            <Text style={styles.orderItemPrice}>₹{item.price * item.quantity}</Text>
                                            {item.status === 'pending' && (
                                                <TouchableOpacity onPress={() => onCancelItem(order.id, item.id, item.price * item.quantity)}>
                                                    <Trash2 size={14} color="#ef4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.orderCardFooter}>
                                <View style={{ flex: 1 }}>
                                    <View>
                                        <Text style={styles.totalText}>Subtotal: ₹{order.total_amount}</Text>
                                        <Text style={styles.totalText}>Tax (5%): ₹{(order.total_amount * TAX_RATE).toFixed(2)}</Text>
                                    </View>
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <View style={{ marginBottom: 12, alignItems: 'flex-end' }}>
                                        <Text style={[styles.totalText, { fontSize: 10 }]}>Grand Total</Text>
                                        <Text style={styles.totalAmount}>
                                            ₹{(order.total_amount * (1 + TAX_RATE)).toFixed(2)}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.closeButton, { backgroundColor: '#16a34a', paddingHorizontal: 16 }]}
                                        onPress={() => onMarkPaid(order.id)}
                                    >
                                        <Text style={[styles.closeButtonText, { fontSize: 13 }]}>Mark Paid</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Staff Management Section */}
            <View style={{ marginBottom: 24 }}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Staff Management</Text>
                    <TouchableOpacity onPress={onAddWaiter} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: '#f97316', fontWeight: '600' }}>+ Add Waiter</Text>
                    </TouchableOpacity>
                </View>

                {waiters.length === 0 ? (
                    <View style={styles.emptyState}>
                        <User size={48} color="#cbd5e1" />
                        <Text style={styles.emptyStateText}>No staff members found</Text>
                    </View>
                ) : (
                    <View style={{ gap: 12 }}>
                        {waiters.map(waiter => (
                            <View key={waiter.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                    <User size={20} color="#d97706" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>{waiter.full_name}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={{ fontSize: 13, color: '#64748b' }}>@{waiter.username}</Text>
                                        <View style={[
                                            styles.roleBadge,
                                            waiter.role === 'kitchen' ? styles.roleBadgeKitchen : styles.roleBadgeWaiter
                                        ]}>
                                            <Text style={styles.roleBadgeText}>{waiter.role}</Text>
                                        </View>
                                    </View>
                                </View>
                                {onDeleteWaiter && (
                                    <TouchableOpacity
                                        style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 }}
                                        onPress={() => onDeleteWaiter(waiter.id)}
                                    >
                                        <Trash2 size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Admin Actions */}
            <View style={{ marginBottom: 24, gap: 12 }}>
                <TouchableOpacity
                    style={styles.adminActionButton}
                    onPress={onViewReports}
                >
                    <View style={[styles.adminActionIcon, { backgroundColor: '#f97316' }]}>
                        <BarChart3 size={24} color="#ffffff" />
                    </View>
                    <View>
                        <Text style={styles.adminActionTitle}>View Reports</Text>
                        <Text style={styles.adminActionSubtitle}>Sales & Performance Analytics</Text>
                    </View>
                    <ChevronRight size={20} color="#cbd5e1" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.adminActionButton}
                    onPress={onManageMenu}
                >
                    <View style={styles.adminActionIcon}>
                        <UtensilsCrossed size={24} color="#ffffff" />
                    </View>
                    <View>
                        <Text style={styles.adminActionTitle}>Manage Menu</Text>
                        <Text style={styles.adminActionSubtitle}>Add, remove, or edit items</Text>
                    </View>
                    <ChevronRight size={20} color="#cbd5e1" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            </View>

            <View style={styles.liveStatusCard}>
                <View style={styles.liveStatusHeader}>
                    <LayoutDashboard size={14} color="#94a3b8" />
                    <Text style={styles.liveStatusTitle}>Live Floor Status</Text>
                </View>
                <View style={styles.liveStatusList}>
                    {seats.map(s => (
                        <View key={s.id} style={styles.liveStatusItem}>
                            <View style={styles.liveStatusRow}>
                                <View style={[
                                    styles.statusDot,
                                    s.status === 'available' ? styles.statusDotGreen : styles.statusDotRed
                                ]} />
                                <Text style={styles.liveStatusTableText}>Table {s.id}</Text>
                            </View>
                            <View style={[
                                styles.liveStatusBadge,
                                s.status === 'available' ? styles.liveStatusBadgeAvailable : styles.liveStatusBadgeOccupied
                            ]}>
                                <Text style={[
                                    styles.liveStatusBadgeText,
                                    s.status === 'available' ? styles.liveStatusBadgeTextAvailable : styles.liveStatusBadgeTextOccupied
                                ]}>
                                    {s.status}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    mainContent: {
        padding: 24,
    },
    sectionHeader: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
    },
    sectionSubtitle: {
        color: '#64748b',
        fontSize: 14,
    },
    shopToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    shopToggleOpen: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
    },
    shopToggleClosed: {
        backgroundColor: '#fef2f2',
        borderColor: '#fee2e2',
    },
    shopToggleText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statCardBlue: {
        backgroundColor: '#2563eb',
    },
    statCardEmerald: {
        backgroundColor: '#059669',
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    statValue: {
        fontSize: 36,
        fontWeight: '900',
        color: '#ffffff',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: 'rgba(255,255,255,0.8)',
    },
    statDecoration: {
        position: 'absolute',
        right: -16,
        bottom: -16,
        width: 96,
        height: 96,
        borderRadius: 9999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    adminActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    adminActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    adminActionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 2,
    },
    adminActionSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    liveStatusCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        padding: 24,
    },
    liveStatusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    liveStatusTitle: {
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        fontSize: 10,
        letterSpacing: 2,
    },
    liveStatusList: {
        gap: 16,
    },
    liveStatusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 16,
    },
    liveStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 9999,
    },
    statusDotGreen: {
        backgroundColor: '#22c55e',
    },
    statusDotRed: {
        backgroundColor: '#ef4444',
    },
    liveStatusTableText: {
        fontWeight: '700',
        color: '#334155',
    },
    liveStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    liveStatusBadgeAvailable: {
        backgroundColor: '#f0fdf4',
    },
    liveStatusBadgeOccupied: {
        backgroundColor: '#fef2f2',
    },
    liveStatusBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    liveStatusBadgeTextAvailable: {
        color: '#16a34a',
    },
    liveStatusBadgeTextOccupied: {
        color: '#dc2626',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    emptyStateText: {
        marginTop: 12,
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    orderCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 16,
    },
    orderCardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    orderCardTime: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    orderItemsList: {
        gap: 12,
        marginBottom: 16,
    },
    orderItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderItemQty: {
        width: 30,
        fontWeight: '700',
        color: '#f97316',
    },
    orderItemName: {
        flex: 1,
        color: '#334155',
        fontWeight: '500',
    },
    orderItemPrice: {
        fontWeight: '600',
        color: '#64748b',
    },
    orderCardFooter: {
        backgroundColor: '#f8fafc',
        marginHorizontal: -20,
        marginBottom: -20,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    totalText: {
        color: '#64748b',
        fontWeight: '600',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#16a34a',
    },
    closeButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    roleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    roleBadgeWaiter: {
        backgroundColor: '#e0f2fe',
    },
    roleBadgeKitchen: {
        backgroundColor: '#fef3c7',
    },
    roleBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#64748b',
    },
});
