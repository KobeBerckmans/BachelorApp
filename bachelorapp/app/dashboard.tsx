import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View, TouchableOpacity, Text, TextInput, FlatList, Alert, Platform } from 'react-native';
import { API_BASE_URL } from '../constants/api';

export default function DashboardScreen() {
    const [pending, setPending] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchPending = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/pending-volunteers`);
            const data = await res.json();
            setPending(data);
        } catch (err) {
            Alert.alert('Error', 'Could not fetch pending volunteers');
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const acceptVolunteer = async (userId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/accept-volunteer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (res.ok) {
                Alert.alert('Success', 'Volunteer accepted');
                fetchPending();
            } else {
                const data = await res.json();
                Alert.alert('Error', data.error || 'Could not accept volunteer');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not connect to server');
        }
    };

    const addCoordinator = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Email and password required');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/add-coordinator`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
                Alert.alert('Success', 'Coordinator added');
                setEmail('');
                setPassword('');
            } else {
                const data = await res.json();
                Alert.alert('Error', data.error || 'Could not add coordinator');
            }
        } catch (err) {
            Alert.alert('Error', 'Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../assets/images/administratie.jpeg')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <Text style={styles.title}>Coordinator Dashboard</Text>
                <Text style={styles.sectionTitle}>Pending Volunteers</Text>
                <FlatList
                    data={pending}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.volunteerLabel}>Email:</Text>
                            <Text style={styles.volunteerEmail}>{item.email}</Text>
                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={() => acceptVolunteer(item._id)}
                            >
                                <Text style={styles.acceptButtonText}>Accepteer</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No pending volunteers</Text>}
                    contentContainerStyle={styles.listContent}
                />
                <View style={styles.addCoordinatorContainer}>
                    <Text style={styles.sectionTitle}>Add Coordinator</Text>
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
                        style={styles.addButton}
                        onPress={addCoordinator}
                        disabled={loading}
                    >
                        <Text style={styles.addButtonText}>{loading ? 'Adding...' : 'Add Coordinator'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        fontFamily: 'CocogooseProTrial',
        color: '#222',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        color: '#222',
    },
    listContent: {
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        width: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'flex-start',
    },
    volunteerLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 2,
    },
    volunteerEmail: {
        fontSize: 18,
        fontWeight: '600',
        color: '#222',
        marginBottom: 12,
    },
    acceptButton: {
        alignSelf: 'flex-end',
        backgroundColor: '#CEF5CD',
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 2,
    },
    acceptButtonText: {
        color: '#222',
        fontSize: 16,
        fontFamily: 'CocogooseProTrial',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    addCoordinatorContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginTop: 32,
        width: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'center',
    },
    input: {
        width: '100%',
        height: 48,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    addButton: {
        width: '100%',
        paddingVertical: 14,
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
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'CocogooseProTrial',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#888',
        fontStyle: 'italic',
        marginBottom: 12,
        alignSelf: 'center',
    },
}); 