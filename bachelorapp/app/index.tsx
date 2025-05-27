import React from 'react';
import { ImageBackground, Image, StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function LandingScreen() {
    const router = useRouter();
    return (
        <ImageBackground
            source={require('../assets/images/administratie.jpeg')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <Image
                    source={require('../assets/images/BVB-Transparant copy.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#E2725B' }]}
                        onPress={() => router.push('/screens/login')}
                    >
                        <Text style={styles.buttonText}>Vrijwilliger</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#CEF5CD' }]}
                        onPress={() => router.push('/coordinator-login')}
                    >
                        <Text style={[styles.buttonText, { color: '#222' }]}>Coordinator</Text>
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
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 24,
    },
    logo: {
        width: 220,
        height: 120,
        marginBottom: 60,
        ...Platform.select({
            android: { marginTop: 40 },
            ios: { marginTop: 40 },
        }),
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 24,
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
        fontFamily: 'CocogooseProTrial',
        letterSpacing: 1,
    },
}); 