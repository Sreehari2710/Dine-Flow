import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { Package, Plus, X } from 'lucide-react-native';
import { Order, Seat } from '../types';

interface ParcelSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    activeParcels: Order[];
    onSelectParcel: (parcel: Order) => void;
    onStartNew: () => void;
}

export default function ParcelSelectionModal({
    visible,
    onClose,
    activeParcels,
    onSelectParcel,
    onStartNew
}: ParcelSelectionModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.headerTitle}>
                            <Package size={20} color="#f97316" />
                            <Text style={styles.title}>Parcel Management</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        You have {activeParcels.length} active parcel(s). Choose an action:
                    </Text>

                    <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                        <TouchableOpacity
                            style={styles.newBtn}
                            onPress={() => {
                                onStartNew();
                                onClose();
                            }}
                        >
                            <Plus size={20} color="#fff" />
                            <Text style={styles.newBtnText}>Start New Parcel</Text>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <Text style={styles.dividerText}>OR EDIT EXISTING</Text>
                        </View>

                        {activeParcels.map((parcel) => (
                            <TouchableOpacity
                                key={parcel.id}
                                style={styles.parcelItem}
                                onPress={() => {
                                    onSelectParcel(parcel);
                                    onClose();
                                }}
                            >
                                <View style={styles.parcelIcon}>
                                    <Package size={16} color="#64748b" />
                                </View>
                                <View style={styles.parcelInfo}>
                                    <Text style={styles.parcelName}>Parcel #{parcel.parcel_number || '?'}</Text>
                                    <Text style={styles.parcelMeta}>
                                        ₹{parcel.total_amount.toFixed(2)} • {parcel.items?.length || 0} items
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    closeBtn: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 20,
    },
    list: {
        marginBottom: 16,
    },
    newBtn: {
        flexDirection: 'row',
        backgroundColor: '#f97316',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    newBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dividerText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    parcelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    parcelIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    parcelInfo: {
        flex: 1,
    },
    parcelName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    parcelMeta: {
        fontSize: 12,
        color: '#64748b',
    },
    cancelBtn: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
});
