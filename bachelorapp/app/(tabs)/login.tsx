import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '../../constants/api';

export default function LoginScreen() {
    const params = useLocalSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Show message if redirected after registration
    if (params.registered === 'true') {
        return (
            <View style={styles.container}>
                <Text style={styles.infoText}>
                    Your registration has been received. You cannot log in until a coordinator approves your account.
                </Text>
            </View>
        );
    }

    const handleLogin = async () => {
        setLoading(true);
        // TODO: Implement login logic
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Login', 'Login logic not implemented yet.');
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login as Volunteer</Text>
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
        backgroundColor: '#fff',
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
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontFamily: 'Cocogoose',
        letterSpacing: 1,
    },
    infoText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        padding: 24,
    },
}); 