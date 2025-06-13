import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert, Linking } from 'react-native';
import { getApiBaseUrl } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BevestigdScreen() {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [helpRequests, setHelpRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchHelpRequests = async () => {
        setLoading(true);
        const API_BASE_URL = getApiBaseUrl();
        const userStr = await AsyncStorage.getItem('user');
        let email = null;
        let userRole = null;
        if (userStr) {
            const user = JSON.parse(userStr);
            email = user.email;
            userRole = user.role;
            setUserEmail(email);
            setRole(userRole);
        }
        fetch(`${API_BASE_URL}/api/help-requests`, {
            headers: {
                ...(email && { 'x-user-email': email }),
                ...(userRole && { 'x-user-role': userRole })
            }
        })
            .then(res => res.json())
            .then(data => {
                if (userRole === 'coordinator') {
                    setHelpRequests(data.filter((req: any) => req.accepted === true));
                } else if (email) {
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
        intervalRef.current = setInterval(() => {
            fetchHelpRequests();
        }, 10000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const handleCancel = async (id: string) => {
        if (!userEmail || !role) return;
        setCancellingId(id);
        try {
            const API_BASE_URL = getApiBaseUrl();
            const res = await fetch(`${API_BASE_URL}/api/help-requests/${id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': role
                },
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
                            <View style={{ marginBottom: 4 }}>
                                <Text style={styles.helpLabel}>Naam:</Text>
                                <Text style={styles.helpValue}>{item.naam}</Text>
                                <Text style={styles.helpLabel}>Soort:</Text>
                                <Text style={styles.helpValue}>{item.soort}</Text>
                                <Text style={styles.helpLabel}>Bericht:</Text>
                                <Text style={styles.helpValue}>{item.bericht}</Text>
                                <Text style={styles.helpLabel}>Datum:</Text>
                                <Text style={styles.helpValue}>{item.datum}</Text>
                                <Text style={styles.helpLabel}>Uur:</Text>
                                <Text style={styles.helpValue}>{item.uur}</Text>
                                <Text style={styles.helpLabel}>Contrei:</Text>
                                <Text style={styles.helpValue}>{item.contrei}</Text>
                                {typeof item.straat === 'string' && item.straat.trim() !== '' && (
                                    <>
                                        <Text style={styles.helpLabel}>Straat:</Text>
                                        <Text style={styles.helpValue}>{item.straat}</Text>
                                    </>
                                )}
                                {typeof item.nummer === 'string' && item.nummer.trim() !== '' && (
                                    <>
                                        <Text style={styles.helpLabel}>Nummer:</Text>
                                        <Text style={styles.helpValue}>{item.nummer}</Text>
                                    </>
                                )}
                                {typeof item.telefoon === 'string' && item.telefoon.trim() !== '' && (
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8, marginBottom: 2 }}>
                                        <Text style={[styles.helpLabel, { fontSize: 15, lineHeight: 22 }]}>Telefoon:</Text>
                                        <Text style={[styles.helpValue, { marginLeft: 4, fontSize: 15, lineHeight: 22 }]} numberOfLines={1} ellipsizeMode="tail">{item.telefoon}</Text>
                                        <View style={{ flex: 1 }} />
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#E2725B',
                                                paddingVertical: 4,
                                                paddingHorizontal: 12,
                                                borderRadius: 16,
                                                minWidth: 70,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            onPress={() => Linking.openURL(`sms:${item.telefoon}`)}
                                        >
                                            <Text style={{ color: '#fff', fontFamily: 'CocogooseProTrial', fontSize: 13, letterSpacing: 1 }}>Bericht</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                            {item.acceptedBy && (
                                <View style={{ marginTop: 8, backgroundColor: '#E2725B22', borderRadius: 8, padding: 6, alignSelf: 'flex-start' }}>
                                    <Text style={{ color: '#E2725B', fontFamily: 'Montserrat', fontSize: 13, fontWeight: 'bold' }}>
                                        Geaccepteerd door: {item.acceptedBy}
                                    </Text>
                                </View>
                            )}
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
        fontSize: 24,
        color: '#222',
        marginBottom: 18,
        marginTop: 8,
        letterSpacing: 1,
        textAlign: 'center',
        flexWrap: 'nowrap',
    },
    helpCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
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
