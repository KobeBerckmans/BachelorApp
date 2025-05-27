import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BevestigdScreen() {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [helpRequests, setHelpRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const fetchHelpRequests = async () => {
        setLoading(true);
        const userStr = await AsyncStorage.getItem('user');
        let email = null;
        if (userStr) {
            const user = JSON.parse(userStr);
            email = user.email;
            setUserEmail(email);
        }
        fetch(`${API_BASE_URL}/api/help-requests`)
            .then(res => res.json())
            .then(data => {
                if (email) {
                    setHelpRequests(data.filter((req: any) => req.acceptedBy === email));
                } else {
                    setHelpRequests([]);
                }
            })
            .catch(() => setHelpRequests([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchHelpRequests();
    }, []);

    const handleCancel = async (id: string) => {
        if (!userEmail) return;
        setCancellingId(id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/help-requests/${id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }),
            });
            if (res.ok) {
                fetchHelpRequests();
            } else {
                const data = await res.json();
                Alert.alert('Error', data.error || 'Kon niet annuleren');
            }
        } catch (err) {
            Alert.alert('Error', 'Kon niet verbinden met server');
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bevestigde aanvragen</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#E2725B" />
            ) : (
                <FlatList
                    data={helpRequests}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.helpCard}>
                            <View style={styles.helpCardRow}>
                                <Text style={styles.helpName}>{item.naam}</Text>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => handleCancel(item._id)}
                                    disabled={!!cancellingId}
                                >
                                    <Text style={styles.cancelButtonText}>{cancellingId === item._id ? '...' : 'Cancel'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.helpRowCompact}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.helpLabel}>Soort:</Text>
                                    <Text style={styles.helpValue}>{item.soort}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.helpLabel}>Datum:</Text>
                                    <Text style={styles.helpValue}>{item.datum}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.helpLabel}>Uur:</Text>
                                    <Text style={styles.helpValue}>{item.uur}</Text>
                                </View>
                            </View>
                            <Text style={styles.helpLabel}>Adres:</Text>
                            <Text style={styles.helpValue}>{item.adres}</Text>
                            <Text style={styles.helpLabel}>Bericht:</Text>
                            <Text style={styles.helpValue}>{item.bericht}</Text>
                        </View>
                    )}
                    style={{ width: '100%' }}
                    contentContainerStyle={{ paddingBottom: 32 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 48 : 64,
    },
    title: {
        fontFamily: 'CocogooseProTrial',
        fontSize: 26,
        color: '#222',
        marginBottom: 18,
        marginTop: 8,
        letterSpacing: 1,
    },
    helpCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        borderLeftWidth: 6,
        borderLeftColor: '#CEF5CD',
    },
    helpCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    helpRowCompact: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 2,
    },
    helpName: {
        fontFamily: 'CocogooseProTrial',
        fontSize: 20,
        color: '#E2725B',
        marginBottom: 6,
    },
    helpLabel: {
        fontFamily: 'Montserrat',
        fontSize: 13,
        color: '#888',
        marginTop: 6,
        marginBottom: 0,
    },
    helpValue: {
        fontFamily: 'Montserrat',
        fontSize: 15,
        color: '#222',
        marginBottom: 2,
    },
    cancelButton: {
        backgroundColor: '#E2725B',
        paddingVertical: 6,
        paddingHorizontal: 18,
        borderRadius: 18,
        marginLeft: 8,
    },
    cancelButtonText: {
        color: '#fff',
        fontFamily: 'CocogooseProTrial',
        fontSize: 15,
        letterSpacing: 1,
    },
}); 