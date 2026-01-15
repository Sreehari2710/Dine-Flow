import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../supabase';
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react-native';

interface AuthScreenProps {
    onLoginSuccess: () => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
    const [mode, setMode] = useState<'login' | 'register_hotel'>('login');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form Stats
    const [hotelName, setHotelName] = useState('');
    const [email, setEmail] = useState(''); // Used as 'username' for waiters
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Error', 'Please enter all fields');
        setLoading(true);

        // Waiter Login Logic: name@hotelname -> convert to fake email if needed
        // For now, let's assume the user types the full email valid for Supabase
        // OR we parse it. Requirement: name@hotelname.
        let loginEmail = email;
        if (!email.includes('@')) {
            // Basic Check for waiter username if we implement it later
        } else if (email.indexOf('@') === email.lastIndexOf('@') && !email.includes('.')) {
            // Let's TRY appending .com to make valid email for Supabase Auth
            loginEmail = `${email}.com`;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: password,
        });

        setLoading(false);
        if (error) {
            Alert.alert('Login Failed', error.message);
        } else {
            // App.tsx session listener will catch this
        }
    };

    const handleRegisterHotel = async () => {
        if (!hotelName || !email || !password || !fullName) return Alert.alert('Error', 'All fields required');
        setLoading(true);

        // 1. Sign Up User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError || !authData.user) {
            setLoading(false);
            return Alert.alert('Registration Failed', authError?.message);
        }

        try {
            // 2. Register Hotel & Profile via RPC (Secure)
            const slug = hotelName.toLowerCase().replace(/\s+/g, '-');
            const username = email.split('@')[0];

            const { error: rpcError } = await supabase.rpc('register_hotel_and_admin', {
                name_input: hotelName,
                slug_input: slug,
                full_name_input: fullName,
                username_input: username,
                user_id_input: authData.user.id
            });

            if (rpcError) throw rpcError;

        } catch (err: any) {
            Alert.alert('Setup Failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <UtensilsCrossed size={32} color="white" />
                    </View>
                    <Text style={styles.title}>DineFlow</Text>
                    <Text style={styles.subtitle}>
                        {mode === 'login' ? 'Enter Credentials' : 'Register New Hotel'}
                    </Text>
                </View>

                {mode === 'register_hotel' && (
                    <>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Hotel Name</Text>
                            <TextInput
                                style={styles.input}
                                value={hotelName}
                                onChangeText={setHotelName}
                                placeholder="e.g. Grand Plaza"
                                placeholderTextColor="#64748b"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Admin Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="John Doe"
                                placeholderTextColor="#64748b"
                            />
                        </View>
                    </>
                )}

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>{mode === 'login' ? 'Email / Username' : 'Admin Email'}</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="admin@hotel.com"
                        autoCapitalize="none"
                        placeholderTextColor="#64748b"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry={!showPassword}
                            placeholderTextColor="#64748b"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                            {showPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={mode === 'login' ? handleLogin : handleRegisterHotel}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setMode(mode === 'login' ? 'register_hotel' : 'login')}
                >
                    <Text style={styles.switchButtonText}>
                        {mode === 'login' ? 'New Hotel? Register Here' : 'Already have an account? Sign In'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 64,
        height: 64,
        backgroundColor: '#f97316',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#0f172a',
    },
    eyeButton: {
        padding: 16,
    },
    button: {
        backgroundColor: '#f97316',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    switchButton: {
        alignItems: 'center',
    },
    switchButtonText: {
        color: '#f97316',
        fontSize: 14,
        fontWeight: '600',
    }
});
