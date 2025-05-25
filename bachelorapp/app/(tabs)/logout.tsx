import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function LogoutScreen() {
    const router = useRouter();

    useEffect(() => {
        // Hier kun je eventueel async storage/token wissen
        // AsyncStorage.removeItem('token');
        router.replace('/coordinator-login'); // Of '/(tabs)/login' voor vrijwilligers
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
        </View>
    );
} 