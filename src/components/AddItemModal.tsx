import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Alert } from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { Category, MenuItem } from '../types';

interface AddItemModalProps {
    visible: boolean;
    onClose: () => void;
    categories: Category[];
    onAddItem: (name: string, price: string, categoryId: number, isVeg: boolean, variants?: { name: string, price: number }[], trackInventory?: boolean, stockCount?: number) => void;
    onUpdateItem?: (id: number, name: string, price: string, categoryId: number, isVeg: boolean, variants?: { name: string, price: number }[], trackInventory?: boolean, stockCount?: number) => void;
    onOpenAddCategory?: () => void;
    itemToEdit?: MenuItem | null;
}

export default function AddItemModal({ visible, onClose, categories, onAddItem, onUpdateItem, onOpenAddCategory, itemToEdit }: AddItemModalProps) {
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemCategory, setNewItemCategory] = useState<number | null>(null);
    const [newItemIsVeg, setNewItemIsVeg] = useState(true);
    const [trackInventory, setTrackInventory] = useState(false);
    const [stockCount, setStockCount] = useState('');

    // Variant State
    const [hasVariants, setHasVariants] = useState(false);
    const [variants, setVariants] = useState<{ name: string; price: string }[]>([
        { name: 'Full', price: '' },
        { name: 'Half', price: '' },
        { name: 'Quarter', price: '' }
    ]);

    useEffect(() => {
        if (visible) {
            if (itemToEdit) {
                // Populate for Editing
                setNewItemName(itemToEdit.name);
                setNewItemPrice(itemToEdit.price.toString());
                setNewItemCategory(itemToEdit.category_id);
                setNewItemIsVeg(itemToEdit.is_veg);
                setTrackInventory(itemToEdit.track_inventory || false);
                setStockCount(itemToEdit.stock_count?.toString() || '0');

                if (itemToEdit.variants && itemToEdit.variants.length > 0) {
                    setHasVariants(true);
                    setVariants(itemToEdit.variants.map(v => ({ name: v.name, price: v.price.toString() })));
                } else {
                    setHasVariants(false);
                    setVariants([
                        { name: 'Full', price: '' },
                        { name: 'Half', price: '' },
                        { name: 'Quarter', price: '' }
                    ]);
                }
            } else {
                // Reset for Adding
                setNewItemName('');
                setNewItemPrice('');
                if (categories.length > 0) {
                    setNewItemCategory(categories[0].id);
                }
                setNewItemIsVeg(true);
                setHasVariants(false);
                setTrackInventory(false);
                setStockCount('0');
                setVariants([
                    { name: 'Full', price: '' },
                    { name: 'Half', price: '' },
                    { name: 'Quarter', price: '' }
                ]);
            }
        }
    }, [visible, itemToEdit, categories]);

    const handleAddVariant = () => {
        setVariants([...variants, { name: '', price: '' }]);
    };

    const handleRemoveVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, field: 'name' | 'price', value: string) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const handleSubmit = () => {
        if (!newItemName.trim()) {
            Alert.alert('Error', 'Item name is required');
            return;
        }

        if (newItemCategory === null) {
            Alert.alert('Error', 'Please select a category');
            return;
        }

        let finalVariants: { name: string, price: number }[] | undefined = undefined;
        let finalPrice = newItemPrice;

        if (hasVariants) {
            const validVariants = variants.filter(v => v.name.trim() !== '' && v.price.trim() !== '');
            if (validVariants.length === 0) {
                Alert.alert('Error', 'Please add at least one valid variant');
                return;
            }
            finalVariants = validVariants.map(v => ({ name: v.name, price: parseFloat(v.price) }));
            finalPrice = finalVariants[0].price.toString();
        } else {
            if (!newItemPrice.trim()) {
                Alert.alert('Error', 'Price is required');
                return;
            }
        }

        if (itemToEdit && onUpdateItem) {
            onUpdateItem(itemToEdit.id, newItemName, finalPrice, newItemCategory, newItemIsVeg, finalVariants, trackInventory, parseInt(stockCount || '0'));
        } else {
            onAddItem(newItemName, finalPrice, newItemCategory, newItemIsVeg, finalVariants, trackInventory, parseInt(stockCount || '0'));
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{itemToEdit ? 'Edit Item' : 'Add New Item'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 500 }}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Item Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Butter Chicken"
                                value={newItemName}
                                onChangeText={setNewItemName}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={styles.label}>Has Variants?</Text>
                                <Switch value={hasVariants} onValueChange={setHasVariants} />
                            </View>
                        </View>

                        {!hasVariants ? (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Price (₹)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 250"
                                    keyboardType="numeric"
                                    value={newItemPrice}
                                    onChangeText={setNewItemPrice}
                                />
                            </View>
                        ) : (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Variants</Text>
                                {variants.map((variant, index) => (
                                    <View key={index} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                                        <TextInput
                                            style={[styles.input, { flex: 2 }]}
                                            placeholder="Name (e.g. Full)"
                                            value={variant.name}
                                            onChangeText={(text) => updateVariant(index, 'name', text)}
                                        />
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            placeholder="Price"
                                            keyboardType="numeric"
                                            value={variant.price}
                                            onChangeText={(text) => updateVariant(index, 'price', text)}
                                        />
                                        <TouchableOpacity onPress={() => handleRemoveVariant(index)} style={{ justifyContent: 'center' }}>
                                            <Trash2 size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity onPress={handleAddVariant} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <Plus size={16} color="#3b82f6" />
                                    <Text style={{ color: '#3b82f6', marginLeft: 4, fontWeight: '600' }}>Add Variant</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => setNewItemCategory(cat.id)}
                                        style={[
                                            styles.categoryChip,
                                            { marginRight: 8 },
                                            newItemCategory === cat.id && styles.categoryChipActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            newItemCategory === cat.id && styles.categoryChipTextActive
                                        ]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                                {onOpenAddCategory && (
                                    <TouchableOpacity
                                        onPress={onOpenAddCategory}
                                        style={[styles.categoryChip, { backgroundColor: '#eff6ff', borderColor: '#3b82f6', borderStyle: 'dashed' }]}
                                    >
                                        <Plus size={16} color="#3b82f6" />
                                        <Text style={{ marginLeft: 4, color: '#3b82f6', fontWeight: '600' }}>Add</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Type</Text>
                            <View style={styles.toggleContainer}>
                                <TouchableOpacity
                                    style={[styles.toggleButton, newItemIsVeg && styles.toggleButtonActive]}
                                    onPress={() => setNewItemIsVeg(true)}
                                >
                                    <Text style={[styles.toggleText, newItemIsVeg && styles.toggleTextActive]}>Veg</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.toggleButton, !newItemIsVeg && styles.toggleButtonActive]}
                                    onPress={() => setNewItemIsVeg(false)}
                                >
                                    <Text style={[styles.toggleText, !newItemIsVeg && styles.toggleTextActive]}>Non-Veg</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={styles.label}>Track Inventory?</Text>
                                <Switch value={trackInventory} onValueChange={setTrackInventory} />
                            </View>
                            {trackInventory && (
                                <View style={{ marginTop: 8 }}>
                                    <Text style={styles.label}>Opening Stock Count</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 50"
                                        keyboardType="numeric"
                                        value={stockCount}
                                        onChangeText={setStockCount}
                                    />
                                    <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                        Item will automatically mark as "Sold Out" at 0.
                                    </Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>{itemToEdit ? 'Update Item' : 'Add Item'}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0f172a',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#0f172a',
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: '#fff7ed',
        borderColor: '#f97316',
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    categoryChipTextActive: {
        color: '#f97316',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 4,
        borderRadius: 12,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleButtonActive: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    toggleTextActive: {
        color: '#0f172a',
    },
    submitButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
    },
});
