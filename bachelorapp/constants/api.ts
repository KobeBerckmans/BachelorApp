import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getApiBaseUrl() {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3001';
    }
    // Try to get LAN IP from Expo manifest (works in Expo Go)
    const manifest = Constants.manifest2 || Constants.manifest;
    let lanIp = null;
    if (manifest?.debuggerHost) {
        lanIp = manifest.debuggerHost.split(':')[0];
    } else if (manifest?.hostUri) {
        lanIp = manifest.hostUri.split(':')[0];
    }
    if (lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1') {
        return `http://${lanIp}:3001`;
    }
    // Fallback
    return 'http://localhost:3001';
}

export const API_BASE_URL = getApiBaseUrl(); 