import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../supabase';
import { Profile } from '../types';

interface AddWaiterModalProps {
    visible: boolean;
    onClose: () => void;
    hotelSlug: string;
    hotelId: string;
    hotelName: string;
    onSuccess?: () => void;
}

export default function AddWaiterModal({ visible, onClose, hotelSlug, hotelId, hotelName, onSuccess }: AddWaiterModalProps) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'waiter' | 'kitchen'>('waiter');
    const [loading, setLoading] = useState(false);

    const handleAddUser = async () => {
        if (!name || !password) return Alert.alert('Error', 'Name and Password required');

        const username = `${name.toLowerCase().replace(/\s+/g, '')}@${hotelName.toLowerCase()}`;
        const emailForAuth = `${username}.com`;

        setLoading(true);
        try {
            const supabaseUrl = (supabase as any).supabaseUrl;
            const supabaseKey = (supabase as any).supabaseKey;

            const tempClient = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });

            const { data, error } = await tempClient.auth.signUp({
                email: emailForAuth,
                password: password,
            });

            // If user already exists in Auth, we proceed to 'Repair' the profile
            if (error && error.message.toLowerCase().includes('already registered')) {
                const { error: repairError } = await supabase
                    .rpc('repair_waiter_profile', {
                        p_email: emailForAuth,
                        p_hotel_id: hotelId,
                        p_full_name: name,
                        p_username: username,
                        p_role: role
                    });

                if (repairError) throw new Error('User exists in Auth but Profile repair failed: ' + repairError.message);

                const roleLabel = role === 'kitchen' ? 'Chef' : 'Waiter';
                Alert.alert('Success (Profile Repaired)', `${roleLabel} Added!\nUsername: ${username}\nPassword: ${password}`);
                setName('');
                setPassword('');
                if (onSuccess) onSuccess();
                onClose();
                return;
            }

            if (error) throw error;

            if (data.user) {
                // Use RPC to bypass RLS for profile creation
                const { error: profileError } = await supabase
                    .rpc('create_waiter_profile', {
                        p_id: data.user.id,
                        p_hotel_id: hotelId,
                        p_full_name: name,
                        p_username: username,
                        p_role: role
                    });

                if (profileError) {
                    Alert.alert('Error', 'Account created but profile failed: ' + profileError.message);
                } else {
                    const roleLabel = role === 'kitchen' ? 'Chef' : 'Waiter';
                    Alert.alert('Success', `${roleLabel} Added!\nUsername: ${username}\nPassword: ${password}`);
                    setName('');
                    setPassword('');
                    if (onSuccess) onSuccess();
                    onClose();
                }
            }

        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to create waiter');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>Add New {role === 'kitchen' ? 'Chef' : 'Waiter'}</Text>

                    <TextInput
                        placeholder={role === 'kitchen' ? "Chef Name" : "Waiter Name"}
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput
                        placeholder="Password"
                        style={styles.input}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleOption, role === 'waiter' && styles.roleOptionActive]}
                            onPress={() => setRole('waiter')}
                        >
                            <Text style={[styles.roleOptionText, role === 'waiter' && styles.roleOptionTextActive]}>Waiter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleOption, role === 'kitchen' && styles.roleOptionActive]}
                            onPress={() => setRole('kitchen')}
                        >
                            <Text style={[styles.roleOptionText, role === 'kitchen' && styles.roleOptionTextActive]}>Kitchen</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.hint}>Username will be: {name.toLowerCase().replace(/\s+/g, '')}@{hotelName.toLowerCase()}</Text>

                    <View style={styles.buttons}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                            <Text>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleAddUser} style={styles.confirmBtn} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white' }}>Create</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    card: { backgroundColor: 'white', padding: 24, borderRadius: 16 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    input: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 12 },
    hint: { fontSize: 12, color: '#64748b', marginBottom: 16 },
    buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    cancelBtn: { padding: 12 },
    confirmBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8 },
    roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    roleOption: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
    roleOptionActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    roleOptionText: { fontWeight: '600', color: '#64748b' },
    roleOptionTextActive: { color: 'white' },
});
