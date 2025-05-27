import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, FlatList, ActivityIndicator, Platform, ScrollView, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterModal, setFilterModal] = useState<null | 'soort' | 'datum' | 'uur'>(null);

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

  const fetchHelpRequests = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/help-requests`)
      .then(res => res.json())
      .then(data => setHelpRequests(data))
      .catch(() => setHelpRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHelpRequests();
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
        fetchHelpRequests();
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

  const filteredHelpRequests = helpRequests.filter(item => {
    if (role === 'coordinator') return true;
    if (role === 'volunteer') return !item.acceptedBy;
    return true;
  }).filter(item => {
    if (selectedSoort && item.soort !== selectedSoort) return false;
    if (selectedDatum && item.datum !== selectedDatum) return false;
    if (selectedUur && item.uur !== selectedUur) return false;
    return true;
  });

  // Unieke waardes voor filters
  const datumOpties = uniqueValues(helpRequests, 'datum');
  const uurOpties = uniqueValues(helpRequests, 'uur');

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>BVB</Text>
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
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModal('soort')}>
            <Text style={styles.filterBtnText}>{selectedSoort ? selectedSoort : 'Soort'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModal('datum')}>
            <Text style={styles.filterBtnText}>{selectedDatum ? selectedDatum : 'Datum'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModal('uur')}>
            <Text style={styles.filterBtnText}>{selectedUur ? selectedUur : 'Uur'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearFilters} onPress={() => { setSelectedSoort(null); setSelectedDatum(null); setSelectedUur(null); }}>
            <Text style={styles.clearFiltersText}>Reset</Text>
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
            <TouchableOpacity style={styles.modalOption} onPress={() => {
              if (filterModal === 'soort') setSelectedSoort(null);
              if (filterModal === 'datum') setSelectedDatum(null);
              if (filterModal === 'uur') setSelectedUur(null);
              setFilterModal(null);
            }}>
              <Text style={[styles.modalOptionText, { color: '#E2725B' }]}>Wis selectie</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#E2725B" />
      ) : (
        <FlatList
          data={filteredHelpRequests}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={styles.helpCard}>
              <View style={styles.helpCardRow}>
                <Text style={styles.helpName}>{item.naam}</Text>
                {role === 'volunteer' && !item.acceptedBy && (
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(item._id)}
                    disabled={!!acceptingId}
                  >
                    <Text style={styles.acceptButtonText}>{acceptingId === item._id ? '...' : 'Accepteer'}</Text>
                  </TouchableOpacity>
                )}
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
              {role === 'coordinator' && item.acceptedBy && (
                <View style={styles.acceptedByBox}>
                  <Text style={styles.acceptedByText}>
                    Geaccepteerd door: {item.acceptedBy}
                  </Text>
                </View>
              )}
            </View>
          )}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingBottom: 24 }}
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
    width: '100%',
    marginBottom: 10,
    marginTop: 2,
    gap: 8,
  },
  pill: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E2725B22',
    marginRight: 2,
  },
  pillActive: {
    backgroundColor: '#E2725B',
    borderColor: '#E2725B',
  },
  pillText: {
    color: '#E2725B',
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  clearFilters: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E2725B22',
  },
  clearFiltersText: {
    color: '#E2725B',
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '600',
  },
  helpCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 8,
    marginBottom: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#CEF5CD',
  },
  helpCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  helpRowCompact: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 0,
  },
  helpName: {
    fontFamily: 'CocogooseProTrial',
    fontSize: 15,
    color: '#E2725B',
    marginBottom: 2,
  },
  helpLabel: {
    fontFamily: 'Montserrat',
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    marginBottom: 0,
  },
  helpValue: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    color: '#222',
    marginBottom: 1,
  },
  acceptButton: {
    backgroundColor: '#CEF5CD',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginLeft: 6,
  },
  acceptButtonText: {
    color: '#222',
    fontFamily: 'CocogooseProTrial',
    fontSize: 12,
    letterSpacing: 1,
  },
  acceptedByBox: {
    marginTop: 4,
    backgroundColor: '#E2725B22',
    borderRadius: 6,
    padding: 4,
    alignSelf: 'flex-start',
  },
  acceptedByText: {
    color: '#E2725B',
    fontFamily: 'Montserrat',
    fontSize: 11,
  },
  filterBtn: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E2725B22',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  filterBtnText: {
    color: '#E2725B',
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: '600',
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
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
});
