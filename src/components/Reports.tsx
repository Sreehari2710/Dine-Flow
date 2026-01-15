import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Platform, Modal, Alert } from 'react-native';
import { ChevronLeft, BarChart3, TrendingUp, Users, Table as TableIcon, Calendar as CalendarIcon, X } from 'lucide-react-native';
// If the line below causes bundling errors, you can comment it out and use the "Custom Selector" implemented below.
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../supabase';
import { Order } from '../types';
import { TAX_RATE } from '../constants';

interface ReportsProps {
    hotelId: string;
    onBack: () => void;
}

export default function Reports({ hotelId, onBack }: ReportsProps) {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCustomPicker, setShowCustomPicker] = useState(false);

    const fetchReports = async (date: Date) => {
        setLoading(true);
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('hotel_id', hotelId)
                .eq('status', 'paid')
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString());

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(selectedDate);
    }, [selectedDate]);

    const onDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isYesterday = (date: Date) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();
    };

    const setQuickDate = (daysAgo: number) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        setSelectedDate(date);
    };

    // Aggregations
    const totalSales = orders.reduce((sum, o) => sum + (o.total_amount * (1 + TAX_RATE)), 0);
    const totalOrders = orders.length;
    const avgBill = totalOrders > 0 ? totalSales / totalOrders : 0;

    const waiterPerformance = orders.reduce((acc: any, o) => {
        const name = o.waiter_name || 'Unknown';
        if (!acc[name]) acc[name] = { name, count: 0, revenue: 0 };
        acc[name].count += 1;
        acc[name].revenue += (o.total_amount * (1 + TAX_RATE));
        return acc;
    }, {});

    const tablePerformance = orders.reduce((acc: any, o) => {
        const id = o.seat_id;
        if (!acc[id]) acc[id] = { id, count: 0, revenue: 0 };
        acc[id].count += 1;
        acc[id].revenue += (o.total_amount * (1 + TAX_RATE));
        return acc;
    }, {});

    const sortedWaiters = Object.values(waiterPerformance).sort((a: any, b: any) => b.revenue - a.revenue);
    const sortedTables = Object.values(tablePerformance).sort((a: any, b: any) => b.revenue - a.revenue);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Business Reports</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Date Selection */}
                <View style={styles.dateSelector}>
                    <TouchableOpacity
                        style={[styles.dateTab, isToday(selectedDate) && styles.activeDateTab]}
                        onPress={() => setQuickDate(0)}
                    >
                        <Text style={[styles.dateTabText, isToday(selectedDate) && styles.activeDateTabText]}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.dateTab, isYesterday(selectedDate) && styles.activeDateTab]}
                        onPress={() => setQuickDate(1)}
                    >
                        <Text style={[styles.dateTabText, isYesterday(selectedDate) && styles.activeDateTabText]}>Yesterday</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.calendarButton, !isToday(selectedDate) && !isYesterday(selectedDate) && styles.activeCalendarButton]}
                        onPress={() => {
                            // FALLBACK: If native picker causes issues, use custom picker
                            setShowCustomPicker(true);
                            // setShowDatePicker(true); // Original line
                        }}
                    >
                        <CalendarIcon size={20} color={!isToday(selectedDate) && !isYesterday(selectedDate) ? "white" : "#64748b"} />
                        <Text style={[styles.dateText, !isToday(selectedDate) && !isYesterday(selectedDate) && { color: 'white' }]}>
                            {selectedDate.toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Native Picker (Potential cause of bundling errors) */}
                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        maximumDate={new Date()}
                    />
                )}

                {/* Custom Picker Fallback (Pure JS, no bundling issues) */}
                <Modal visible={showCustomPicker} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.customPickerContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Date</Text>
                                <TouchableOpacity onPress={() => setShowCustomPicker(false)}>
                                    <X size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.modalSubtitle}>Quickly jump to a day from the last 2 weeks:</Text>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {[...Array(14)].map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - i);
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={styles.dateOption}
                                            onPress={() => {
                                                setSelectedDate(d);
                                                setShowCustomPicker(false);
                                            }}
                                        >
                                            <CalendarIcon size={16} color="#94a3b8" />
                                            <Text style={styles.dateOptionText}>{d.toDateString()}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                            <TouchableOpacity
                                style={styles.useNativeBtn}
                                onPress={() => {
                                    setShowCustomPicker(false);
                                    setShowDatePicker(true);
                                }}
                            >
                                <Text style={styles.useNativeBtnText}>Use Full Calendar View</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {loading ? (
                    <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {/* Summary Cards */}
                        <View style={styles.summaryGrid}>
                            <View style={[styles.summaryCard, { borderLeftColor: '#f97316' }]}>
                                <Text style={styles.summaryLabel}>Total Sales</Text>
                                <Text style={styles.summaryValue}>₹{totalSales.toFixed(0)}</Text>
                                <TrendingUp size={16} color="#f97316" style={styles.summaryIcon} />
                            </View>
                            <View style={[styles.summaryCard, { borderLeftColor: '#3b82f6' }]}>
                                <Text style={styles.summaryLabel}>Total Orders</Text>
                                <Text style={styles.summaryValue}>{totalOrders}</Text>
                                <BarChart3 size={16} color="#3b82f6" style={styles.summaryIcon} />
                            </View>
                            <View style={[styles.summaryCard, { borderLeftColor: '#10b981' }]}>
                                <Text style={styles.summaryLabel}>Avg Ticket</Text>
                                <Text style={styles.summaryValue}>₹{avgBill.toFixed(0)}</Text>
                                <BarChart3 size={16} color="#10b981" style={styles.summaryIcon} />
                            </View>
                        </View>

                        {/* Waiter Performance */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Users size={20} color="#0f172a" />
                                <Text style={styles.sectionTitle}>By Waiter</Text>
                            </View>
                            {sortedWaiters.length === 0 ? <Text style={styles.emptyText}>No data available</Text> :
                                sortedWaiters.map((w: any) => (
                                    <View key={w.name} style={styles.perfRow}>
                                        <View style={styles.perfRank}>
                                            <Text style={styles.rankText}>{sortedWaiters.indexOf(w) + 1}</Text>
                                        </View>
                                        <Text style={styles.perfName}>{w.name}</Text>
                                        <View style={styles.perfStats}>
                                            <Text style={styles.perfCount}>{w.count} orders</Text>
                                            <Text style={styles.perfRevenue}>₹{w.revenue.toFixed(0)}</Text>
                                        </View>
                                    </View>
                                ))
                            }
                        </View>

                        {/* Table Performance */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <TableIcon size={20} color="#0f172a" />
                                <Text style={styles.sectionTitle}>By Table</Text>
                            </View>
                            {sortedTables.length === 0 ? <Text style={styles.emptyText}>No data available</Text> :
                                sortedTables.map((t: any) => (
                                    <View key={t.id} style={styles.perfRow}>
                                        <View style={[styles.perfRank, { backgroundColor: '#f1f5f9' }]}>
                                            <Text style={[styles.rankText, { color: '#64748b' }]}>{sortedTables.indexOf(t) + 1}</Text>
                                        </View>
                                        <Text style={styles.perfName}>{t.id === 0 ? 'Parcel' : `Table ${t.id}`}</Text>
                                        <View style={styles.perfStats}>
                                            <Text style={styles.perfCount}>{t.count} orders</Text>
                                            <Text style={styles.perfRevenue}>₹{t.revenue.toFixed(0)}</Text>
                                        </View>
                                    </View>
                                ))
                            }
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    dateSelector: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 },
    dateTab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' },
    activeDateTab: { backgroundColor: '#f97316', borderColor: '#f97316' },
    dateTabText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
    activeDateTabText: { color: 'white' },
    calendarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginLeft: 'auto'
    },
    activeCalendarButton: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    dateText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    summaryCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    summaryLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
    summaryIcon: { position: 'absolute', top: 12, right: 12, opacity: 0.5 },
    section: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
    perfRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    perfRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rankText: { fontSize: 12, fontWeight: 'bold', color: '#f97316' },
    perfName: { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '500' },
    perfStats: { alignItems: 'flex-end' },
    perfCount: { fontSize: 12, color: '#64748b' },
    perfRevenue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
    emptyText: { textAlign: 'center', color: '#94a3b8', marginVertical: 20 },

    // Custom Picker Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    customPickerContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 20,
    },
    dateOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dateOptionText: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
    },
    useNativeBtn: {
        marginTop: 20,
        backgroundColor: '#f1f5f9',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    useNativeBtnText: {
        color: '#3b82f6',
        fontWeight: 'bold',
    },
});
