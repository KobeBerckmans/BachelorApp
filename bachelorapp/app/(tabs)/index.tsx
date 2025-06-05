import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, FlatList, ActivityIndicator, Platform, ScrollView, Modal, Pressable, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useRegisterPushToken from '../../hooks/useRegisterPushToken';

const SOORTEN = ['boodschappen', 'vervoer', 'gezelschap', 'klusjes', 'anders'];

function uniqueValues<T>(arr: T[], key: keyof T): string[] {
  return Array.from(new Set(arr.map(item => String(item[key])).filter(Boolean)));
}

export default function HomeScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [selectedSoort, setSelectedSoort] = useState<string | null>(null);
  const [selectedDatum, setSelectedDatum] = useState<string | null>(null);
  const [selectedUur, setSelectedUur] = useState<string | null>(null);
  const [selectedContrei, setSelectedContrei] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterModal, setFilterModal] = useState<null | 'soort' | 'datum' | 'uur' | 'contrei'>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevRequestCount = useRef(0);
  const [showBanner, setShowBanner] = useState(false);
  const bannerAnim = useRef(new Animated.Value(-80)).current;

  useRegisterPushToken();

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setRole(user.role);
        setUserEmail(user.email);
      } else {
        setRole(null);
        setUserEmail(null);
      }
    })();
  }, []);

  const fetchHelpRequestsWithBanner = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/help-requests`)
      .then(res => res.json())
      .then(data => {
        if (prevRequestCount.current && data.length > prevRequestCount.current) {
          setShowBanner(true);
          Animated.timing(bannerAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }).start();
          setTimeout(() => {
            Animated.timing(bannerAnim, {
              toValue: -80,
              duration: 350,
              useNativeDriver: true,
            }).start(() => setShowBanner(false));
          }, 3500);
        }
        prevRequestCount.current = data.length;
        setHelpRequests(data);
      })
      .catch(() => setHelpRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHelpRequestsWithBanner();
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchHelpRequestsWithBanner();
    }, 10000); // elke 10 seconden
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleAccept = async (id: string) => {
    if (!userEmail) return;
    setAcceptingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/help-requests/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      if (res.ok) {
        fetchHelpRequestsWithBanner();
      } else {
        const data = await res.json();
        alert(data.error || 'Kon niet accepteren');
      }
    } catch (err) {
      alert('Kon niet verbinden met server');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!userEmail) return;
    setAcceptingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/help-requests/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      if (res.ok) {
        fetchHelpRequestsWithBanner();
      } else {
        const data = await res.json();
        alert(data.error || 'Kon niet annuleren');
      }
    } catch (err) {
      alert('Kon niet verbinden met server');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeleteHelpRequest = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/help-requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHelpRequestsWithBanner();
      } else {
        Alert.alert('Error', 'Kon niet verwijderen');
      }
    } catch {
      Alert.alert('Error', 'Kon niet verbinden met server');
    }
  };

  const confirmDeleteHelpRequest = (id: string) => {
    Alert.alert('Verwijderen', 'Weet je zeker dat je deze hulpaanvraag wilt verwijderen?', [
      { text: 'Annuleer', style: 'cancel' },
      { text: 'Verwijder', style: 'destructive', onPress: () => handleDeleteHelpRequest(id) },
    ]);
  };

  const filteredHelpRequests = helpRequests.filter(item => {
    // Alleen niet-geaccepteerde aanvragen tonen
    return !item.accepted && !item.acceptedBy;
  }).filter(item => {
    if (selectedSoort && item.soort !== selectedSoort) return false;
    if (selectedDatum && item.datum !== selectedDatum) return false;
    if (selectedUur && item.uur !== selectedUur) return false;
    if (selectedContrei && item.contrei !== selectedContrei) return false;
    return true;
  });

  // Unieke waardes voor filters
  const datumOpties = uniqueValues(helpRequests, 'datum');
  const uurOpties = uniqueValues(helpRequests, 'uur');
  const contreiOpties = uniqueValues(helpRequests, 'contrei');

  return (
    <View style={styles.container}>
      {/* In-app banner voor nieuwe hulpaanvraag */}
      {showBanner && (
        <Animated.View style={[styles.banner, { transform: [{ translateY: bannerAnim }] }]}>
          <Text style={styles.bannerText}>Nieuwe hulpaanvraag!</Text>
        </Animated.View>
      )}
      {role === 'coordinator' && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#E2725B', marginBottom: 18 }]}
          onPress={() => router.push('/dashboard')}
        >
          <Text style={styles.buttonText}>Dashboard</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.helpTitle}>Hulpaanvragen</Text>
      {/* Nieuwe filterbalk */}
      <View style={styles.filterBarModern}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 0 }} style={{ flex: 1 }}>
          <TouchableOpacity style={[styles.filterBtnModern, selectedSoort && styles.filterBtnActive]} onPress={() => setFilterModal('soort')}>
            <Text style={[styles.filterBtnTextModern, selectedSoort && styles.filterBtnTextActive]}>{selectedSoort ? selectedSoort : 'Soort'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtnModern, selectedDatum && styles.filterBtnActive]} onPress={() => setFilterModal('datum')}>
            <Text style={[styles.filterBtnTextModern, selectedDatum && styles.filterBtnTextActive]}>{selectedDatum ? selectedDatum : 'Datum'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtnModern, selectedUur && styles.filterBtnActive]} onPress={() => setFilterModal('uur')}>
            <Text style={[styles.filterBtnTextModern, selectedUur && styles.filterBtnTextActive]}>{selectedUur ? selectedUur : 'Uur'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtnModern, selectedContrei && styles.filterBtnActive]} onPress={() => setFilterModal('contrei')}>
            <Text style={[styles.filterBtnTextModern, selectedContrei && styles.filterBtnTextActive]}>{selectedContrei ? selectedContrei : 'Contrei'}</Text>
          </TouchableOpacity>
        </ScrollView>
        <TouchableOpacity style={styles.resetBtnModern} onPress={() => { setSelectedSoort(null); setSelectedDatum(null); setSelectedUur(null); setSelectedContrei(null); }}>
          <Text style={styles.resetBtnTextModern}>Reset</Text>
        </TouchableOpacity>
      </View>
      {/* Modal voor filteropties */}
      <Modal visible={!!filterModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModal(null)} />
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Kies {filterModal}</Text>
          {filterModal === 'soort' && SOORTEN.map(soort => (
            <TouchableOpacity key={soort} style={styles.modalOption} onPress={() => { setSelectedSoort(soort); setFilterModal(null); }}>
              <Text style={styles.modalOptionText}>{soort.charAt(0).toUpperCase() + soort.slice(1)}</Text>
            </TouchableOpacity>
          ))}
          {filterModal === 'datum' && datumOpties.map(datum => (
            <TouchableOpacity key={String(datum)} style={styles.modalOption} onPress={() => { setSelectedDatum(String(datum)); setFilterModal(null); }}>
              <Text style={styles.modalOptionText}>{String(datum)}</Text>
            </TouchableOpacity>
          ))}
          {filterModal === 'uur' && uurOpties.map(uur => (
            <TouchableOpacity key={String(uur)} style={styles.modalOption} onPress={() => { setSelectedUur(String(uur)); setFilterModal(null); }}>
              <Text style={styles.modalOptionText}>{String(uur)}</Text>
            </TouchableOpacity>
          ))}
          {filterModal === 'contrei' && contreiOpties.map(contrei => (
            <TouchableOpacity key={String(contrei)} style={styles.modalOption} onPress={() => { setSelectedContrei(String(contrei)); setFilterModal(null); }}>
              <Text style={styles.modalOptionText}>{String(contrei)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalOption} onPress={() => {
            if (filterModal === 'soort') setSelectedSoort(null);
            if (filterModal === 'datum') setSelectedDatum(null);
            if (filterModal === 'uur') setSelectedUur(null);
            if (filterModal === 'contrei') setSelectedContrei(null);
            setFilterModal(null);
          }}>
            <Text style={[styles.modalOptionText, { color: '#E2725B' }]}>Wis selectie</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {loading ? (
        <ActivityIndicator size="large" color="#E2725B" />
      ) : (
        <FlatList
          data={filteredHelpRequests}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={styles.helpCardModern}>
              <View style={styles.helpCardRowModern}>
                <Text style={styles.helpNameModern}>{item.naam}</Text>
                {role === 'coordinator' && (
                  <TouchableOpacity style={styles.deleteButtonModern} onPress={() => confirmDeleteHelpRequest(item._id)}>
                    <Text style={styles.deleteButtonTextModern}>×</Text>
                  </TouchableOpacity>
                )}
                {role === 'volunteer' && !item.acceptedBy && (
                  !item.acceptedBy ? (
                    <TouchableOpacity
                      style={styles.acceptButtonModern}
                      onPress={() => handleAccept(item._id)}
                      disabled={!!acceptingId}
                    >
                      <Text style={styles.acceptButtonTextModern}>{acceptingId === item._id ? '...' : 'Accepteer'}</Text>
                    </TouchableOpacity>
                  ) : item.acceptedBy === userEmail ? (
                    <TouchableOpacity
                      style={[styles.acceptButtonModern, { backgroundColor: '#E2725B' }]}
                      onPress={() => handleCancel(item._id)}
                      disabled={!!acceptingId}
                    >
                      <Text style={[styles.acceptButtonTextModern, { color: '#fff' }]}>{acceptingId === item._id ? '...' : 'Cancel'}</Text>
                    </TouchableOpacity>
                  ) : null
                )}
              </View>
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.helpLabelModern}>Soort:</Text>
                <Text style={styles.helpValueModern}>{item.soort}</Text>
                <Text style={styles.helpLabelModern}>Datum:</Text>
                <Text style={styles.helpValueModern}>{item.datum}</Text>
                <Text style={styles.helpLabelModern}>Uur:</Text>
                <Text style={styles.helpValueModern}>{item.uur}</Text>
                {item.adres && <>
                  <Text style={styles.helpLabelModern}>Adres:</Text>
                  <Text style={styles.helpValueModern}>{item.adres}</Text>
                </>}
                {(!item.adres && (item.straat || item.nummer || item.gemeente)) && <>
                  <Text style={styles.helpLabelModern}>Adres:</Text>
                  <Text style={styles.helpValueModern}>{[item.straat, item.nummer, item.gemeente].filter(Boolean).join(' ')}</Text>
                </>}
                {item.bericht && <>
                  <Text style={styles.helpLabelModern}>Bericht:</Text>
                  <Text style={styles.helpValueModern}>{item.bericht}</Text>
                </>}
                {item.contrei && <>
                  <Text style={styles.helpLabelModern}>Contrei:</Text>
                  <Text style={styles.helpValueModern}>{item.contrei}</Text>
                </>}
              </View>
              {role === 'coordinator' && item.acceptedBy && (
                <View style={styles.acceptedByBoxModern}>
                  <Text style={styles.acceptedByTextModern}>
                    Geaccepteerd door: {item.acceptedBy}
                  </Text>
                </View>
              )}
            </View>
          )}
          style={{ width: '100%', marginTop: 16 }}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 0 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F4FBF5',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  logoText: {
    fontFamily: 'CocogooseProTrial',
    fontSize: 38,
    color: '#E2725B',
    marginBottom: 16,
    letterSpacing: 2,
  },
  button: {
    width: 220,
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'CocogooseProTrial',
    letterSpacing: 1,
  },
  helpTitle: {
    fontSize: 26,
    fontFamily: 'CocogooseProTrial',
    color: '#222',
    marginBottom: 18,
    marginTop: 8,
    letterSpacing: 1,
  },
  filterBarModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterBtnModern: {
    backgroundColor: '#F4FBF5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#E6F9EA',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  filterBtnActive: {
    backgroundColor: '#CEF5CD',
    borderColor: '#E2725B',
  },
  filterBtnTextModern: {
    color: '#222',
    fontFamily: 'Montserrat',
    fontSize: 15,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#E2725B',
  },
  resetBtnModern: {
    marginLeft: 12,
    backgroundColor: '#E2725B',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnTextModern: {
    color: '#fff',
    fontFamily: 'Montserrat',
    fontSize: 15,
    fontWeight: 'bold',
  },
  helpCardModern: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 6,
    borderLeftColor: '#CEF5CD',
    borderWidth: 1,
    borderColor: '#CEF5CD22',
  },
  helpCardRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  helpNameModern: {
    fontFamily: 'CocogooseProTrial',
    fontSize: 18,
    color: '#E2725B',
    marginBottom: 0,
    fontWeight: 'bold',
  },
  helpRowCompactModern: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  helpLabelModern: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 0,
  },
  helpValueModern: {
    fontFamily: 'Montserrat',
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    marginBottom: 1,
  },
  acceptButtonModern: {
    backgroundColor: '#CEF5CD',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 3,
  },
  acceptButtonTextModern: {
    color: '#222',
    fontFamily: 'CocogooseProTrial',
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  deleteButtonModern: {
    marginLeft: 8,
    backgroundColor: '#F8D7DA',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButtonTextModern: {
    color: '#B71C1C',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  acceptedByBoxModern: {
    marginTop: 8,
    backgroundColor: '#E2725B22',
    borderRadius: 8,
    padding: 6,
    alignSelf: 'flex-start',
  },
  acceptedByTextModern: {
    color: '#E2725B',
    fontFamily: 'Montserrat',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  modalBox: {
    position: 'absolute',
    top: 120,
    left: 30,
    right: 30,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontFamily: 'CocogooseProTrial',
    fontSize: 18,
    color: '#E2725B',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontFamily: 'Montserrat',
    fontSize: 15,
    color: '#222',
    textAlign: 'center',
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E2725B',
    paddingVertical: 16,
    alignItems: 'center',
    zIndex: 100,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'CocogooseProTrial',
    letterSpacing: 1,
  },
});
