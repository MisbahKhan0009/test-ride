import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const BASE_URL = "https://ride.emplique.com";

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    throw new Error('Must use physical device for push notifications');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    throw new Error('Failed to get push token for push notification!');
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    throw new Error('Project ID not found');
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function sendSOSAlert(location: Location, contacts: number[], message = '') {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      console.log('User not authenticated');
      return false;
    }

    const pushToken = await registerForPushNotificationsAsync();
    
    // Create SOS record first
    const createResponse = await fetch(`${BASE_URL}/api/sos/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        is_community_alert: false,
        emergency_contacts: contacts
      }),
    });

    if (!createResponse.ok) {
      console.error('Failed to create SOS record');
      return false;
    }

    // Then send notifications
    const notifyResponse = await fetch(`${BASE_URL}/api/sos/notify/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        message: message || "Emergency! I need immediate assistance!",
        contacts: contacts,
        push_token: pushToken
      }),
    });

    return notifyResponse.ok;
  } catch (error) {
    console.error('Error sending SOS alert:', error);
    return false;
  }
}

export async function sendEmergencySOSNotification(location: LocationData, message = '') {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      console.log('User not authenticated');
      return false;
    }

    // Ensure location data is valid
    if (!location?.coords?.latitude || !location?.coords?.longitude) {
      console.error('Invalid location data');
      return false;
    }

    const payload = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      message: message || 'I need help! This is an emergency.',
      platform: Platform.OS,
      timestamp: new Date().toISOString()
    };

    console.log('Sending SOS notification with payload:', payload);

    const response = await fetch(`${BASE_URL}/api/sos/notify/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    
    try {
      const responseData = JSON.parse(responseText);
      console.log('SOS notification response:', responseData);
      
      if (responseData.success) {
        return true;
      }
      
      console.error('Server returned error:', responseData.error || 'Unknown error');
      return false;
    } catch (parseError) {
      console.error('Failed to parse server response:', responseText);
      return false;
    }
  } catch (error) {
    console.error('Error sending SOS notification:', error);
    return false;
  }
}

// Add this export function
export function initializeNotificationListeners() {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}