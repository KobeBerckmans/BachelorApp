import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CoordinatorLoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/coordinator-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok && data.role === 'coordinator') {
                await AsyncStorage.setItem('user', JSON.stringify(data));
                router.replace('/(tabs)');
            } else {
                Alert.alert('Error', data.error || 'Invalid credentials');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Coordinator Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#F4FBF5',
    },
    title: {
        fontSize: 24,
        marginBottom: 32,
        fontWeight: 'bold',
    },
    input: {
        width: 260,
        height: 48,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    button: {
        width: 220,
        paddingVertical: 16,
        borderRadius: 32,
        alignItems: 'center',
        backgroundColor: '#E2725B',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontFamily: 'CocogooseProTrial',
        letterSpacing: 1,
    },
}); 