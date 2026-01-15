import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, TouchableWithoutFeedback } from 'react-native';
import { UtensilsCrossed, LogOut, Menu, UserPlus, Grid } from 'lucide-react-native';

interface HeaderProps {
    currentView: 'auth' | 'waiter_seats' | 'waiter_menu' | 'admin_dashboard' | 'admin_menu' | 'admin_reports' | 'kitchen_view';
    onViewChange: (view: 'auth' | 'waiter_seats' | 'waiter_menu' | 'admin_dashboard' | 'admin_menu' | 'admin_reports' | 'kitchen_view') => void;
    userRole?: string;
    userName?: string;
    onLogout: () => void;
    onAddWaiter?: () => void;
    onSetTableCount?: (count: number) => void;
    currentTableCount?: number;
}

export default function Header({ currentView, onViewChange, userRole, userName, onLogout, onAddWaiter, onSetTableCount, currentTableCount = 0 }: HeaderProps) {
    const [menuVisible, setMenuVisible] = useState(false);
    const [tableInput, setTableInput] = useState(currentTableCount.toString());

    const handleSetTables = () => {
        const count = parseInt(tableInput);
        if (isNaN(count) || count < 1) {
            Alert.alert('Invalid', 'Please enter a valid number');
            return;
        }
        onSetTableCount?.(count);
        setMenuVisible(false);
    };

    return (
        <View style={styles.header}>
            <View>
                <View style={styles.logoContainer}>
                    <UtensilsCrossed size={24} color="#f97316" />
                    <Text style={styles.logoText}>DineFlow</Text>
                </View>
                <Text style={styles.subText}>Restaurant Management</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Waiter: Show Name */}
                {(userRole === 'waiter' || userRole === 'kitchen') && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                            <Text style={{ fontWeight: '600', color: '#334155' }}>
                                {userName} ({userRole.charAt(0).toUpperCase() + userRole.slice(1)})
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onLogout} style={{ backgroundColor: '#fee2e2', padding: 8, borderRadius: 8 }}>
                            <LogOut size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Admin: Show Menu Toggle */}
                {userRole === 'admin' && (
                    <>
                        <View style={styles.roleSwitcher}>
                            <TouchableOpacity
                                onPress={() => onViewChange('waiter_seats')}
                                style={[styles.roleButton, currentView.startsWith('waiter') && styles.roleButtonActive]}
                            >
                                <Text style={[styles.roleButtonText, currentView.startsWith('waiter') ? styles.roleButtonTextActive : styles.roleButtonTextInactive]}>
                                    Waiter
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => onViewChange('admin_dashboard')}
                                style={[styles.roleButton, currentView.startsWith('admin') && styles.roleButtonActive]}
                            >
                                <Text style={[styles.roleButtonText, currentView.startsWith('admin') ? styles.roleButtonTextActiveBlue : styles.roleButtonTextInactive]}>
                                    Admin
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => onViewChange('kitchen_view')}
                                style={[styles.roleButton, currentView === 'kitchen_view' && styles.roleButtonActive]}
                            >
                                <Text style={[styles.roleButtonText, currentView === 'kitchen_view' ? styles.roleButtonTextActiveOrange : styles.roleButtonTextInactive]}>
                                    Kitchen
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => setMenuVisible(true)}
                            style={{ padding: 8, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }}
                        >
                            <Menu size={20} color="#334155" />
                        </TouchableOpacity>

                        <Modal
                            visible={menuVisible}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setMenuVisible(false)}
                        >
                            <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                    <TouchableWithoutFeedback>
                                        <View style={styles.dropdownMenu}>
                                            <Text style={styles.menuHeader}>Admin Controls</Text>

                                            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onAddWaiter?.(); }}>
                                                <UserPlus size={18} color="#3b82f6" />
                                                <Text style={styles.menuText}>Add Staff</Text>
                                            </TouchableOpacity>

                                            <View style={styles.menuDivider} />

                                            <View style={styles.menuItem}>
                                                <Grid size={18} color="#64748b" />
                                                <Text style={styles.menuText}>Tables:</Text>
                                                <TextInput
                                                    value={tableInput}
                                                    onChangeText={setTableInput}
                                                    keyboardType="numeric"
                                                    style={styles.tableInput}
                                                />
                                                <TouchableOpacity onPress={handleSetTables} style={styles.setBtn}>
                                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Set</Text>
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.menuDivider} />

                                            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onLogout(); }}>
                                                <LogOut size={18} color="#ef4444" />
                                                <Text style={[styles.menuText, { color: '#ef4444' }]}>Logout</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </View>
                            </TouchableWithoutFeedback>
                        </Modal>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
    },
    subText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    roleSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    roleButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleButtonActive: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    roleButtonText: {
        fontSize: 12,
        fontWeight: '700',
    },
    roleButtonTextActive: {
        color: '#ea580c',
    },
    roleButtonTextActiveBlue: {
        color: '#2563eb',
    },
    roleButtonTextActiveOrange: {
        color: '#f97316',
    },
    roleButtonTextInactive: {
        color: '#64748b',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 70,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        minWidth: 220,
    },
    menuHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 12,
    },
    menuText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 4,
    },
    tableInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        padding: 4,
        width: 50,
        textAlign: 'center',
        fontSize: 14,
    },
    setBtn: {
        backgroundColor: '#0f172a',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 'auto',
    },
});
