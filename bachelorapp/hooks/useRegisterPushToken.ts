import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

async function registerForPushNotificationsAsync() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
}

export default function useRegisterPushToken() {
    useEffect(() => {
        async function updatePushToken() {
            try {
                const userStr = await AsyncStorage.getItem('user');
                if (!userStr) return;
                const user = JSON.parse(userStr);
                if (!user._id || user.role !== 'volunteer') return;
                const token = await registerForPushNotificationsAsync();
                if (!token) return;
                await fetch(`${API_BASE_URL}/api/volunteers/updatePushToken`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user._id, expoPushToken: token }),
                });
            } catch (e) {
                // fail silently
            }
        }
        updatePushToken();
    }, []);
} 