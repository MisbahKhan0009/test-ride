import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, Clock, Users, Car } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { router } from 'expo-router';

interface Host {
  id: number;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
}

interface Member {
  id: number;
}

interface RideCardProps {
  id: number;
  host: Host;
  vehicle_type: string;
  pickup_name: string;
  destination_name: string;
  departure_time: string;
  total_fare: string;
  seats_available: number;
  members: Member[];
  currentUserId: number | null;
}

export default function RideCard({
  id,
  host,
  vehicle_type,
  pickup_name,
  destination_name,
  departure_time,
  total_fare,
  seats_available,
  members,
  currentUserId,
}: RideCardProps) {
  const departureDate = new Date(departure_time);
  const timeString = departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = departureDate.toLocaleDateString();

  const driverImage = host.profile_photo || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
  const driverName = `${host.first_name} ${host.last_name}`;

  const isHost = currentUserId === host.id;
  const isMember = members.some(member => member.id === currentUserId);
  const showViewButton = isHost || isMember;

  const handlePress = () => {
    if (showViewButton) {
      router.push(`/ride/${id}`);
    }
    // Add join ride logic here if needed
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.driverInfo}>
          <Image source={{ uri: driverImage }} style={styles.driverImage} />
          <View>
            <Text style={styles.driverName}>{driverName}</Text>
          </View>
        </View>
        <Text style={styles.priceText}>৳{total_fare}</Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoints}>
          <View style={styles.routePointDot} />
          <View style={styles.routeLine} />
          <View style={[styles.routePointDot, styles.routePointDotDestination]} />
        </View>
        <View style={styles.routeDetails}>
          <View style={styles.routePoint}>
            <Text style={styles.routePointText}>{pickup_name}</Text>
          </View>
          <View style={styles.routePoint}>
            <Text style={styles.routePointText}>{destination_name}</Text>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Clock size={16} color={Colors.light.subtext} />
          <Text style={styles.detailText}>{timeString}, {dateString}</Text>
        </View>
        <View style={styles.detailItem}>
          <Users size={16} color={Colors.light.subtext} />
          <Text style={styles.detailText}>{seats_available} seats available</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.vehicleInfo}>
          <Car size={16} color={Colors.light.subtext} />
          <Text style={styles.vehicleText}>{vehicle_type}</Text>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>
            {showViewButton ? 'View Ride' : 'Join Ride'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    fontFamily: 'Inter-Medium',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.primary,
    fontFamily: 'Inter-SemiBold',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  routePoints: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
  },
  routePointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  routePointDotDestination: {
    backgroundColor: Colors.light.error,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginVertical: 5,
  },
  routeDetails: {
    flex: 1,
  },
  routePoint: {
    height: 25,
    justifyContent: 'center',
    marginBottom: 5,
  },
  routePointText: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: 'Inter-Regular',
  },
  details: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginLeft: 5,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 15,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginLeft: 5,
    fontFamily: 'Inter-Regular',
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
});