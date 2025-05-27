import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, FlatList, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>BVB</Text>
      {role === 'coordinator' && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#E2725B', marginBottom: 24 }]}
          onPress={() => router.push('/dashboard')}
        >
          <Text style={styles.buttonText}>Dashboard</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.helpTitle}>Hulpaanvragen</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#E2725B" />
      ) : (
        <FlatList
          data={helpRequests.filter(item => {
            if (role === 'coordinator') return true;
            if (role === 'volunteer') return !item.acceptedBy;
            return true;
          })}
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
  acceptButton: {
    backgroundColor: '#CEF5CD',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginLeft: 8,
  },
  acceptButtonText: {
    color: '#222',
    fontFamily: 'CocogooseProTrial',
    fontSize: 15,
    letterSpacing: 1,
  },
  acceptedByBox: {
    marginTop: 8,
    backgroundColor: '#E2725B22',
    borderRadius: 8,
    padding: 6,
    alignSelf: 'flex-start',
  },
  acceptedByText: {
    color: '#E2725B',
    fontFamily: 'Montserrat',
    fontSize: 13,
  },
});
