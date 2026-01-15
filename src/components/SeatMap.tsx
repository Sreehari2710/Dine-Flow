import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Users, ChevronRight, AlertCircle, LayoutGrid, User, Package } from 'lucide-react-native';
import { Seat, Order } from '../types';

interface SeatMapProps {
    seats: Seat[];
    onSeatSelect: (seat: Seat) => void;
    loading: boolean;
    error: string | null;
    activeOrders: Order[];
    currentUserId?: string;
}

export default function SeatMap({ seats, onSeatSelect, loading, error, activeOrders, currentUserId }: SeatMapProps) {
    const [filter, setFilter] = useState<'all' | 'mine'>('all');

    const myActiveSeatIds = activeOrders
        .filter(o => o.waiter_id === currentUserId && (o.status === 'pending' || o.status === 'preparing' || o.status === 'served'))
        .map(o => o.seat_id);

    const filteredSeats = filter === 'all'
        ? seats
        : seats.filter(s => myActiveSeatIds.includes(s.id));

    // Ensure Parcel (Seat ID 0) is always shown as the first card in 'All Tables' mode
    // or if the user has a parcel order in 'My Orders' mode.
    const hasParcelOrderInMine = myActiveSeatIds.includes(0);
    const showParcelPermanent = filter === 'all' || hasParcelOrderInMine;

    // Check actual status from DB seats if available, otherwise check activeOrders
    const parcelSeatFromDB = seats.find(s => s.id === 0);
    const isParcelOccupied = parcelSeatFromDB
        ? parcelSeatFromDB.status === 'occupied'
        : activeOrders.some(o => o.seat_id === 0 && (o.status === 'pending' || o.status === 'preparing' || o.status === 'served'));

    const parcelSeat: Seat = parcelSeatFromDB || {
        id: 0,
        hotel_id: seats[0]?.hotel_id || '',
        status: isParcelOccupied ? 'occupied' : 'available'
    };

    // Filter out the actual ID 0 from filteredSeats to prevent duplicates when we prepend
    const otherSeats = filteredSeats.filter(s => s.id !== 0);

    return (
        <ScrollView contentContainerStyle={styles.mainContent}>
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>Floor Map</Text>
                    <Text style={styles.sectionSubtitle}>Select a table to manage orders.</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, filter === 'all' && styles.activeTab]}
                    onPress={() => setFilter('all')}
                >
                    <LayoutGrid size={18} color={filter === 'all' ? 'white' : '#64748b'} />
                    <Text style={[styles.tabText, filter === 'all' && styles.activeTabText]}>All Tables</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, filter === 'mine' && styles.activeTab]}
                    onPress={() => setFilter('mine')}
                >
                    <User size={18} color={filter === 'mine' ? 'white' : '#64748b'} />
                    <Text style={[styles.tabText, filter === 'mine' && styles.activeTabText]}>My Orders</Text>
                    {myActiveSeatIds.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{myActiveSeatIds.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text style={styles.loadingText}>Connecting to floor map...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <AlertCircle size={20} color="#dc2626" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <View style={styles.gridContainer}>
                    {showParcelPermanent && (
                        <TouchableOpacity
                            onPress={() => onSeatSelect(parcelSeat)}
                            style={[
                                styles.seatCard,
                                parcelSeat.status === 'available' ? styles.seatCardAvailable : styles.seatCardOccupied
                            ]}
                        >
                            <View style={[
                                styles.iconContainer,
                                parcelSeat.status === 'available' ? styles.iconContainerAvailable : styles.iconContainerOccupied
                            ]}>
                                <Package size={28} color={parcelSeat.status === 'available' ? '#f97316' : '#dc2626'} />
                            </View>
                            <View style={styles.seatInfo}>
                                <Text style={styles.seatId}>Parcel</Text>
                                <View style={[
                                    styles.statusBadge,
                                    parcelSeat.status === 'available' ? styles.statusBadgeAvailable : styles.statusBadgeOccupied
                                ]}>
                                    <Text style={styles.statusText}>
                                        {activeOrders.filter(o => o.seat_id === 0 && (o.status === 'pending' || o.status === 'preparing' || o.status === 'served')).length > 0
                                            ? `${activeOrders.filter(o => o.seat_id === 0 && (o.status === 'pending' || o.status === 'preparing' || o.status === 'served')).length} Active`
                                            : parcelSeat.status}
                                    </Text>
                                </View>
                            </View>
                            {parcelSeat.status === 'available' && (
                                <View style={styles.chevron}>
                                    <ChevronRight size={20} color="#cbd5e1" />
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {otherSeats.length > 0 ? (
                        otherSeats.map((seat) => (
                            <TouchableOpacity
                                key={seat.id}
                                onPress={() => onSeatSelect(seat)}
                                style={[
                                    styles.seatCard,
                                    seat.status === 'available' ? styles.seatCardAvailable : styles.seatCardOccupied
                                ]}
                            >
                                <View style={[
                                    styles.iconContainer,
                                    seat.status === 'available' ? styles.iconContainerAvailable : styles.iconContainerOccupied
                                ]}>
                                    <Users size={28} color={seat.status === 'available' ? '#16a34a' : '#dc2626'} />
                                </View>
                                <View style={styles.seatInfo}>
                                    <Text style={styles.seatId}>Table {seat.id}</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        seat.status === 'available' ? styles.statusBadgeAvailable : styles.statusBadgeOccupied
                                    ]}>
                                        <Text style={styles.statusText}>{seat.status}</Text>
                                    </View>
                                </View>
                                {seat.status === 'available' && (
                                    <View style={styles.chevron}>
                                        <ChevronRight size={20} color="#cbd5e1" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))
                    ) : (
                        !showParcelPermanent && (
                            <View style={styles.emptyContainer}>
                                <Users size={48} color="#e2e8f0" />
                                <Text style={styles.emptyText}>No tables found for this filter.</Text>
                            </View>
                        )
                    )}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    mainContent: {
        padding: 24,
        paddingBottom: 100,
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 4,
        borderRadius: 12,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    activeTab: {
        backgroundColor: '#f97316',
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    activeTabText: {
        color: 'white',
    },
    badge: {
        backgroundColor: 'white',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#f97316',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        borderColor: '#fee2e2',
        borderWidth: 1,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#dc2626',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
        width: '100%',
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
    },
    seatCard: {
        width: '47%',
        padding: 32,
        borderRadius: 24,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#ffffff',
    },
    seatCardAvailable: {
        borderColor: '#f1f5f9',
    },
    seatCardOccupied: {
        backgroundColor: '#f1f5f9',
        borderColor: '#e2e8f0',
        opacity: 0.8,
    },
    iconContainer: {
        padding: 16,
        borderRadius: 16,
    },
    iconContainerAvailable: {
        backgroundColor: '#dcfce7',
    },
    iconContainerOccupied: {
        backgroundColor: '#fee2e2',
    },
    seatInfo: {
        alignItems: 'center',
    },
    seatId: {
        fontSize: 18,
        fontWeight: '900',
        color: '#334155',
    },
    statusBadge: {
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 9999,
    },
    statusBadgeAvailable: {
        backgroundColor: '#22c55e',
    },
    statusBadgeOccupied: {
        backgroundColor: '#ef4444',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: '#ffffff',
    },
    chevron: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -10,
    },
});
