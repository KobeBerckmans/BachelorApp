import React, { useEffect, useState } from 'react';
import { ImageBackground, Image, StyleSheet, View, TouchableOpacity, Text, Platform, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setRole(user.role);
      } else {
        setRole(null);
      }
    })();
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/help-requests`)
      .then(res => res.json())
      .then(data => setHelpRequests(data))
      .catch(() => setHelpRequests([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/images/administratie.jpeg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Image
          source={require('../../assets/images/BVB-Transparant copy.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={helpRequests}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={styles.helpCard}>
                <Text style={styles.helpName}>{item.naam}</Text>
                <Text>Soort: {item.soort}</Text>
                <Text>Bericht: {item.bericht}</Text>
                <Text>Datum: {item.datum}</Text>
                <Text>Adres: {item.adres}</Text>
                <Text>Uur: {item.uur}</Text>
              </View>
            )}
            style={{ width: '100%' }}
          />
        )}
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
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 24,
  },
  logo: {
    width: 220,
    height: 120,
    marginBottom: 40,
    ...Platform.select({
      android: { marginTop: 40 },
      ios: { marginTop: 40 },
    }),
  },
  button: {
    width: 220,
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Cocogoose',
    letterSpacing: 1,
  },
  helpTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 16,
  },
  helpCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  helpName: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
});
