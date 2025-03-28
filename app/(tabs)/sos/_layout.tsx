import { router, Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Bell, User, AlertTriangle } from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "../../../components/ToastProvider";
import * as Location from "expo-location";
import { initializeNotificationListeners } from '../../../services/notificationService';
import { useFocusEffect } from "@react-navigation/native";
import { useMemo } from 'react';
import { FlatList } from 'react-native';

// Placeholder for registerForPushNotificationsAsync (assumed to be defined elsewhere)
const registerForPushNotificationsAsync = async () => {
  // This should return the push token after requesting permissions
  return "dummy-push-token"; // Replace with actual implementation
};

// Interfaces
interface EmergencyContact {
  id: number;
  contactId: number;
  name: string;
  phone: string;
}

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface Contact {
  id: number;
  contact: {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
  };
}

const BASE_URL = "https://ride.emplique.com";

export default function SOSLayout() {
  // State
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const { showToast } = useToast();

  // Animation values
  const scale = useSharedValue(1);
  const borderWidth = useSharedValue(2);

  // Move animated style outside of render
  const sosButtonAnimatedStyle = useMemo(() => 
    useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      borderWidth: borderWidth.value,
    })), [scale, borderWidth]
  );

  // Initialize notification listeners
  useEffect(() => {
    const cleanup = initializeNotificationListeners();
    return () => cleanup();
  }, []);

  // Fetch initial data and animate button
  useEffect(() => {
    fetchEmergencyContacts();
    requestLocationPermission();

    // Animation only when not in emergency mode
    if (!isEmergencyActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      borderWidth.value = withRepeat(
        withSequence(
          withTiming(6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      // Faster pulse during countdown
      scale.value = withRepeat(
        withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      borderWidth.value = 6; // Static bold border
    }
  }, [isEmergencyActive]);

  // Countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isEmergencyActive && countdown > 0) {
      interval = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (isEmergencyActive && countdown === 0) {
      triggerEmergencyAlert();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEmergencyActive, countdown]);

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          showToast("Location permission denied. SOS will use last known location if available.", "warning");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(loc);
      } else {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const webLocation = {
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                },
              };
              setLocation(webLocation);
            },
            (error) => {
              showToast("Location permission denied on web. Using last known location if available.", "warning");
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        } else {
          showToast("Geolocation not supported by this browser", "error");
        }
      }
    } catch (error) {
      showToast("Error getting location", "error");
      console.error("Location error:", error);
    }
  };

  // Fetch emergency contacts
  const fetchEmergencyContacts = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        showToast("Please log in to fetch emergency contacts", "error");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/sos/emergency-contacts/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        const formattedContacts = data.map((contact: Contact) => ({
          id: contact.id,
          contactId: contact.contact.id,
          name: `${contact.contact.first_name} ${contact.contact.last_name}`,
          phone: contact.contact.phone_number || "N/A",
        }));
        setEmergencyContacts(formattedContacts);
        if (formattedContacts.length === 0) {
          showToast("No emergency contacts found. Add some in Settings.", "info");
        }
      } else {
        showToast(`Failed to fetch contacts: ${data.detail || "Unknown error"}`, "error");
      }
    } catch (error) {
      showToast("Network error fetching emergency contacts", "error");
      console.error("Error:", error);
    }
  };

  // Refresh contacts when Settings tab is focused
  useFocusEffect(
    useCallback(() => {
      if (router.pathname === "/setting") {
        fetchEmergencyContacts();
      }
    }, [])
  );

  // Trigger emergency alert
  const triggerEmergencyAlert = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        showToast("Please log in to send SOS", "error");
        router.replace("/auth/login");
        return;
      }

      if (emergencyContacts.length === 0) {
        showToast("No emergency contacts available", "error");
        setIsEmergencyActive(false);
        setCountdown(5);
        return;
      }

      // Get fresh location
      let currentLocation: LocationData | null = null;
      try {
        if (Platform.OS === "web") {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          currentLocation = {
            coords: { latitude: position.coords.latitude, longitude: position.coords.longitude },
          };
        } else {
          currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
        }
      } catch (error) {
        if (location) {
          currentLocation = location;
          showToast("Using last known location due to error", "warning");
        } else {
          showToast("No location available. Enable location services.", "error");
          setIsEmergencyActive(false);
          setCountdown(5);
          return;
        }
      }

      // Create SOS record
      const createResponse = await fetch(`${BASE_URL}/api/sos/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          is_community_alert: false,
          emergency_contacts: emergencyContacts.map((contact) => contact.contactId),
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        showToast(errorData.error || "Failed to create SOS record", "error");
        return;
      }

      // Send notifications
      const notifyResponse = await fetch(`${BASE_URL}/api/sos/notify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          message: "Emergency! I need immediate assistance!",
          contacts: emergencyContacts.map((contact) => contact.contactId),
          push_token: await registerForPushNotificationsAsync(),
        }),
      });

      if (notifyResponse.ok) {
        showToast("SOS sent successfully to emergency contacts", "success");
      } else {
        const errorData = await notifyResponse.json();
        showToast(errorData.error || "SOS created but notifications may be delayed", "warning");
      }
    } catch (error) {
      showToast("Network error sending SOS", "error");
      console.error("Error in triggerEmergencyAlert:", error);
    } finally {
      setIsEmergencyActive(false);
      setCountdown(5);
    }
  };

  // Handle SOS button press
  const handleSOSPress = () => {
    if (!isEmergencyActive) {
      if (emergencyContacts.length === 0) {
        showToast("Please add emergency contacts in Settings", "error");
        return;
      }
      setIsEmergencyActive(true);
      showToast(
        `SOS will be sent to ${emergencyContacts.length} contact${
          emergencyContacts.length !== 1 ? "s" : ""
        } in ${countdown} seconds`,
        "info"
      );
      // Placeholder for haptic feedback (implement with a library like expo-haptics)
      // triggerHapticFeedback();
    } else {
      setIsEmergencyActive(false);
      setCountdown(5);
      showToast("Emergency alert cancelled", "info");
    }
  };

  // Handle profile navigation
  const handleProfilePress = () => {
    router.push("/profile");
  };

  // Update Tabs component to use FlatList instead of ScrollView
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SOS</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Bell size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <User size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SOS Button */}
      <View style={styles.sosButtonContainer}>
        <Animated.View
          style={[
            styles.sosButtonOuter,
            sosButtonAnimatedStyle,
            isEmergencyActive && styles.sosButtonOuterActive,
          ]}
        >
          <TouchableOpacity
            style={[styles.sosButton, isEmergencyActive && styles.sosButtonActive]}
            onPress={handleSOSPress}
            activeOpacity={0.8}
            accessibilityLabel={isEmergencyActive ? "Cancel SOS" : "Trigger SOS"}
          >
            {isEmergencyActive ? (
              <Text style={styles.countdownText}>{countdown}</Text>
            ) : (
              <>
                <AlertTriangle size={40} color="#FFFFFF" />
                <Text style={styles.sosButtonText}>SOS</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.sosInstructions}>
          {isEmergencyActive ? "Tap again to cancel" : "Tap to trigger SOS to emergency contacts"}
        </Text>
      </View>

      {/* Tabs */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
            elevation: 0,
            shadowOpacity: 0,
            height: 50,
            paddingTop: 5,
            paddingBottom: 5,
          },
          tabBarActiveTintColor: "#3B82F6",
          tabBarInactiveTintColor: "#6B7280",
          tabBarLabelStyle: {
            fontSize: 14,
            fontFamily: "Inter-Medium",
            paddingBottom: 8,
          },
          tabBarPosition: "top",
        }}
        tabBar={({ state, descriptors, navigation }) => (
          <FlatList
            data={state.routes}
            horizontal
            style={styles.tabsContainer}
            renderItem={({ item: route, index }) => {
              const { options } = descriptors[route.key];
              const label = options.tabBarLabel || options.title || route.name;
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  style={[styles.tabButton, isFocused && styles.activeTabButton]}
                  onPress={onPress}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isFocused }}
                >
                  <Text style={[styles.tabText, isFocused && styles.activeTabText]}>
                    {typeof label === "string" ? label : null}
                  </Text>
                  {isFocused && <View style={styles.activeTabIndicator} />}
                </TouchableOpacity>
              );
            }}
          />
        )}
      >
        <Tabs.Screen name="index" options={{ title: "SOS", tabBarLabel: "SOS" }} />
        <Tabs.Screen name="quick-search" options={{ title: "Quick Search", tabBarLabel: "Quick Search" }} />
        <Tabs.Screen name="setting" options={{ title: "SOS Settings", tabBarLabel: "Settings" }} />
      </Tabs>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "Inter-SemiBold",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: 16,
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    position: "relative",
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
  },
  tabText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter-Medium",
  },
  activeTabText: {
    color: "#3B82F6",
    fontFamily: "Inter-SemiBold",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 3,
    backgroundColor: "#3B82F6",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  sosButtonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  sosButtonOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  sosButton: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  sosButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  sosButtonOuterActive: {
    borderColor: "#EF4444",
  },
  sosButtonActive: {
    backgroundColor: "#FF0000",
  },
  countdownText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  sosInstructions: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Inter-Regular",
    marginTop: 16,
  },
});