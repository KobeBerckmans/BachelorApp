import React, { useRef, useEffect } from 'react';
import { ImageBackground, Image, StyleSheet, View, TouchableOpacity, Text, Platform, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function LandingScreen() {
    const router = useRouter();
    const bounceAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 1.15,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [bounceAnim]);
    return (
        <ImageBackground
            source={require('../assets/images/administratie.jpeg')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <Image
                    source={require('../assets/images/logo-zwart.png')}
                    style={{ width: '90%', height: 140, marginBottom: 20, marginTop: 40 }}
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
                <Animated.Text
                    style={[
                        styles.slogan,
                        {
                            transform: [
                                { scale: bounceAnim },
                            ],
                        },
                    ]}
                >
                    Samen maken we het verschil!
                </Animated.Text>
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
    slogan: {
        marginTop: 36,
        fontFamily: 'CocogooseProTrial',
        fontSize: 22,
        color: '#E2725B',
        textAlign: 'center',
        letterSpacing: 1,
    },
}); 