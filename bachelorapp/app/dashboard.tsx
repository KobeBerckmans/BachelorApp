// Dashboard screen for coordinators and volunteers.
// Shows tabs for requests, contacts, volunteers, and coordinator management.
// Handles all main admin actions in the app.

import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View, TouchableOpacity, Text, TextInput, FlatList, Alert, Platform, Linking } from 'react-native';
import { API_BASE_URL } from '../constants/api';

const TABS = [
    { key: 'requests', label: 'Aanvragen' },
    { key: 'contacts', label: 'Contact' },
    { key: 'volunteers', label: 'Vrijwilligers' },
    { key: 'addcoordinator', label: 'Coordinator toevoegen' },
];

type PendingVolunteer = { _id: string; email: string };
type Contact = { _id: string; email: string; subject: string; message: string };
type Volunteer = { _id: string; naam: string; voornaam: string; adres: string; tel: string; mail: string; motivatie: string };

/**
 * DashboardScreen
 * Main dashboard for coordinators and volunteers.
 * Manages tab state, data fetching, and all admin actions.
 */
export default function DashboardScreen() {
    const [activeTab, setActiveTab] = useState('requests');
    const [pending, setPending] = useState<PendingVolunteer[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const user = {
        email: 'admin@bachelorapp.com',
        role: 'coordinator', // of 'volunteer'
    };
    const isCoordinator = user?.role === 'coordinator';

    /**
     * Fetches all pending volunteers from the backend.
     * Sets the 'pending' state.
     */
    const fetchPending = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/pending-volunteers`);
            const data = await res.json();
            setPending(data);
        } catch (err) {
            Alert.alert('Error', 'Could not fetch pending volunteers');
        }
    };

    /**
     * Fetches all contact messages from the backend.
     * Sets the 'contacts' state.
     */
    const fetchContacts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/contacts`);
            const data = await res.json();
            setContacts(data);
        } catch (err) {
            Alert.alert('Error', 'Could not fetch contacts');
        }
    };

    /**
     * Fetches all accepted volunteers from the backend.
     * Sets the 'volunteers' state.
     */
    const fetchVolunteers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/volunteers`);
            const data = await res.json();
            setVolunteers(data);
        } catch (err) {
            Alert.alert('Error', 'Could not fetch volunteers');
        }
    };

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchPending();
        }
        if (activeTab === 'contacts') fetchContacts();
        if (activeTab === 'volunteers') fetchVolunteers();
    }, [activeTab]);

    /**
     * Accepts a pending volunteer by userId.
     * @param userId - The MongoDB _id of the volunteer to accept.
     */
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

    /**
     * Promotes a volunteer to coordinator by email.
     * Only available to coordinators.
     */
    const addCoordinator = async () => {
        if (!email) {
            Alert.alert('Error', 'Email required');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/add-coordinator`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                Alert.alert('Success', 'Coordinator added');
                setEmail('');
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

    /**
     * Opens the SMS app to reply to a volunteer.
     * @param tel - Phone number
     * @param naam - Name
     */
    const handleVolunteerReply = (tel: string, naam: string) => {
        const message = `Beste ${naam},\n\n`;
        const url = Platform.OS === 'ios'
            ? `sms:${tel}&body=${encodeURIComponent(message)}`
            : `sms:${tel}?body=${encodeURIComponent(message)}`;
        Linking.openURL(url);
    };

    /**
     * Opens the mail app to reply to a contact message.
     * @param email - Email address
     * @param subject - Subject of the message
     */
    const handleContactReply = (email: string, subject: string) => {
        const mailto = `mailto:${email}?subject=Re: ${encodeURIComponent(subject)}&body=${encodeURIComponent('Beste,\n\n')}`;
        Linking.openURL(mailto);
    };

    /**
     * Opens the mail app to reply to a volunteer by email.
     * @param mail - Email address
     * @param naam - Name
     */
    const handleVolunteerMail = (mail: string, naam: string) => {
        const mailto = `mailto:${mail}?subject=Re: Vrijwilligersaanvraag&body=${encodeURIComponent('Beste ' + naam + ',\n\n')}`;
        Linking.openURL(mailto);
    };

    /**
     * Deletes an item (pending volunteer, contact, volunteer, or help request).
     * @param type - The type of item
     * @param id - The MongoDB _id
     */
    const handleDelete = async (type: 'pending' | 'contact' | 'volunteer' | 'helprequest', id: string) => {
        let url = '';
        if (type === 'pending') url = `${API_BASE_URL}/api/pending-volunteers/${id}`;
        if (type === 'contact') url = `${API_BASE_URL}/api/contacts/${id}`;
        if (type === 'volunteer') url = `${API_BASE_URL}/api/volunteers/${id}`;
        if (type === 'helprequest') url = `${API_BASE_URL}/api/help-requests/${id}`;
        try {
            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                if (type === 'pending') fetchPending();
                if (type === 'contact') fetchContacts();
                if (type === 'volunteer') fetchVolunteers();
            } else {
                Alert.alert('Error', 'Kon niet verwijderen');
            }
        } catch {
            Alert.alert('Error', 'Kon niet verbinden met server');
        }
    };

    /**
     * Shows a confirmation dialog before deleting an item.
     * @param type - The type of item
     * @param id - The MongoDB _id
     */
    const confirmDelete = (type: 'pending' | 'contact' | 'volunteer' | 'helprequest', id: string) => {
        Alert.alert('Verwijderen', 'Weet je zeker dat je dit item wilt verwijderen?', [
            { text: 'Annuleer', style: 'cancel' },
            { text: 'Verwijder', style: 'destructive', onPress: () => handleDelete(type, id) },
        ]);
    };

    return (
        <View style={styles.background}>
            <View style={styles.overlay}>
                <Text style={styles.title}>Coordinator Dashboard</Text>
                <View style={styles.tabGrid}>
                    {[0, 1].map(row => (
                        <View key={row} style={styles.tabRowGrid}>
                            {TABS.slice(row * 2, row * 2 + 2).map(tab => (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[styles.tabButtonGrid, activeTab === tab.key && styles.tabButtonActiveGrid]}
                                    onPress={() => setActiveTab(tab.key)}
                                >
                                    <Text style={[styles.tabButtonTextGrid, activeTab === tab.key && styles.tabButtonTextActiveGrid]}>{tab.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>
                {activeTab === 'requests' && (
                    <>
                        <Text style={styles.sectionTitle}>Pending Volunteers</Text>
                        <FlatList
                            data={pending}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <View style={styles.cardRequest}>
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete('pending', item._id)}>
                                        <Text style={styles.deleteButtonText}>×</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.volunteerLabelSmall}>Email:</Text>
                                    <Text style={styles.volunteerEmailSmall}>{item.email}</Text>
                                    <TouchableOpacity
                                        style={styles.acceptButtonSmall}
                                        onPress={() => acceptVolunteer(item._id)}
                                    >
                                        <Text style={styles.acceptButtonTextSmall}>Accepteer</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyTextSmall}>No pending volunteers</Text>}
                            contentContainerStyle={styles.listContent}
                        />
                    </>
                )}
                {activeTab === 'contacts' && (
                    <>
                        <Text style={styles.sectionTitle}>Contact Vragen</Text>
                        <FlatList
                            data={contacts}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <View style={styles.cardContact}>
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete('contact', item._id)}>
                                        <Text style={styles.deleteButtonText}>×</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.volunteerLabelSmall}>Email:</Text>
                                    <Text style={styles.volunteerEmailSmall}>{item.email}</Text>
                                    <Text style={styles.volunteerLabelSmall}>Onderwerp:</Text>
                                    <Text style={styles.volunteerEmailSmall}>{item.subject}</Text>
                                    <Text style={styles.volunteerLabelSmall}>Bericht:</Text>
                                    <Text style={styles.volunteerEmailSmall}>{item.message}</Text>
                                    <TouchableOpacity
                                        style={styles.replyButton}
                                        onPress={() => handleContactReply(item.email, item.subject)}
                                    >
                                        <Text style={styles.replyButtonText}>Mail</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyTextSmall}>Geen contactvragen</Text>}
                            contentContainerStyle={styles.listContent}
                        />
                    </>
                )}
                {activeTab === 'volunteers' && (
                    <>
                        <Text style={styles.sectionTitle}>Nieuwe Vrijwilligers</Text>
                        <FlatList
                            data={volunteers}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <View style={styles.cardVolunteer}>
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete('volunteer', item._id)}>
                                        <Text style={styles.deleteButtonText}>×</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.volunteerLabelSmall}>Naam:</Text>
                                    <Text style={styles.volunteerEmailSmall}>{item.voornaam} {item.naam}</Text>
                                    <Text style={styles.volunteerLabelSmall}>Adres:</Text>
                                    <Text style={styles.volunteerEmailSmall}>{item.adres}</Text>
                                    <Text style={styles.volunteerLabelSmall}>Telefoon:</Text>
                                    <Text style={styles.volunteerEmailSmall}>{item.tel}</Text>
                                    <Text style={styles.volunteerLabelSmall}>Email:</Text>
                                    <Text style={styles.volunteerEmailSmall}>{item.mail}</Text>
                                    <Text style={styles.volunteerLabelSmall}>Motivatie:</Text>
                                    <Text style={styles.volunteerEmailSmall}>{item.motivatie}</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
                                        <TouchableOpacity
                                            style={styles.replyButton}
                                            onPress={() => handleVolunteerReply(item.tel, item.voornaam)}
                                        >
                                            <Text style={styles.replyButtonText}>Bericht</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.replyButton, { marginLeft: 8 }]}
                                            onPress={() => handleVolunteerMail(item.mail, item.voornaam)}
                                        >
                                            <Text style={styles.replyButtonText}>Mail</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyTextSmall}>Geen nieuwe vrijwilligers</Text>}
                            contentContainerStyle={styles.listContent}
                        />
                    </>
                )}
                {activeTab === 'addcoordinator' && (
                    <View style={styles.addCoordinatorContainerSmall}>
                        <Text style={styles.sectionTitleSmall}>Add Coordinator</Text>
                        <TextInput
                            style={styles.inputSmall}
                            placeholder="Email"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <TouchableOpacity
                            style={styles.addButtonSmall}
                            onPress={addCoordinator}
                            disabled={loading}
                        >
                            <Text style={styles.addButtonTextSmall}>{loading ? 'Adding...' : 'Add Coordinator'}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#E6F9EA',
    },
    overlay: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'rgba(244,251,245,0.85)',
        paddingHorizontal: 12,
        paddingTop: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        fontFamily: 'CocogooseProTrial',
        color: '#222',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 4,
        color: '#222',
    },
    sectionTitleSmall: {
        fontSize: 13,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
        color: '#222',
    },
    listContent: {
        paddingBottom: 12,
    },
    cardRequest: {
        backgroundColor: '#FFF9E6',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        width: 260,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        elevation: 3,
        alignItems: 'flex-start',
    },
    cardContact: {
        backgroundColor: '#E6F0FF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        width: 260,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        elevation: 3,
        alignItems: 'flex-start',
    },
    cardVolunteer: {
        backgroundColor: '#E6FFF2',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        width: 260,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        elevation: 3,
        alignItems: 'flex-start',
    },
    cardCoordinator: {
        backgroundColor: '#F3E6FF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        width: 260,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        elevation: 3,
        alignItems: 'flex-start',
    },
    volunteerLabelSmall: {
        fontSize: 11,
        color: '#888',
        marginBottom: 1,
    },
    volunteerEmailSmall: {
        fontSize: 13,
        fontWeight: '600',
        color: '#222',
        marginBottom: 6,
    },
    acceptButtonSmall: {
        alignSelf: 'flex-end',
        backgroundColor: '#CEF5CD',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 3,
        elevation: 2,
    },
    acceptButtonTextSmall: {
        color: '#222',
        fontSize: 12,
        fontFamily: 'CocogooseProTrial',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    addCoordinatorContainerSmall: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        marginTop: 16,
        width: 240,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
    },
    inputSmall: {
        width: '100%',
        height: 36,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        marginBottom: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: 13,
        backgroundColor: '#f9f9f9',
    },
    addButtonSmall: {
        width: '100%',
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: '#E2725B',
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 3,
        elevation: 2,
    },
    addButtonTextSmall: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'CocogooseProTrial',
        letterSpacing: 0.5,
        fontWeight: 'bold',
    },
    emptyTextSmall: {
        color: '#888',
        fontStyle: 'italic',
        marginBottom: 6,
        alignSelf: 'center',
        fontSize: 12,
    },
    tabGrid: {
        width: '100%',
        marginBottom: 20,
    },
    tabRowGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    tabButtonGrid: {
        flex: 1,
        marginHorizontal: 6,
        paddingVertical: 16,
        borderRadius: 18,
        backgroundColor: '#F6F6F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E6F9EA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 2,
        elevation: 1,
        minWidth: 0,
        minHeight: 60,
    },
    tabButtonActiveGrid: {
        backgroundColor: '#CEF5CD',
        borderColor: '#E2725B',
    },
    tabButtonTextGrid: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#888',
        textAlign: 'center',
        textAlignVertical: 'center',
        width: '100%',
    },
    tabButtonTextActiveGrid: {
        color: '#E2725B',
    },
    replyButton: {
        marginTop: 8,
        alignSelf: 'flex-end',
        backgroundColor: '#E2725B',
        paddingVertical: 6,
        paddingHorizontal: 18,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 3,
        elevation: 2,
    },
    replyButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    deleteButton: {
        position: 'absolute',
        top: 6,
        right: 8,
        zIndex: 10,
        backgroundColor: '#F8D7DA',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 2,
        elevation: 2,
    },
    deleteButtonText: {
        color: '#B71C1C',
        fontSize: 18,
        fontWeight: 'bold',
        lineHeight: 22,
    },
}); 