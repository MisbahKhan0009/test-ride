import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { Clock, Users, Star } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '../../constants/Colors';
import AnimatedPressable from '../../components/AnimatedPressable';

const myRides = [
  // Same sample data as in original file
  {
    id: '1',
    type: 'driver',
    from: 'Home',
    to: 'Office',
    time: '8:30 AM',
    date: 'Tomorrow',
    price: '$18.00',
    seats: {
      total: 4,
      available: 3
    },
    passengers: [
      {
        name: 'John Smith',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80'
      }
    ],
    status: 'upcoming'
  },
  // ... rest of the myRides data remains identical
];

export default function MyRides() {
  const renderMyRideItem = ({ item }) => (
    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <AnimatedPressable style={styles.rideCard}>
        <View style={styles.rideCardHeader}>
          <View style={styles.rideTypeContainer}>
            <Text style={styles.rideTypeText}>
              {item.type === 'driver' ? 'You\'re driving' : 'You\'re riding'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: '#E1F5E1' }]}>
              <Text style={[styles.statusText, { color: Colors.light.success }]}>
                Upcoming
              </Text>
            </View>
          </View>
          <Text style={styles.priceText}>{item.price}</Text>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routePoints}>
            <View style={styles.routePointDot} />
            <View style={styles.routeLine} />
            <View style={[styles.routePointDot, styles.routePointDotDestination]} />
          </View>
          <View style={styles.routeDetails}>
            <View style={styles.routePoint}>
              <Text style={styles.routePointText}>{item.from}</Text>
            </View>
            <View style={styles.routePoint}>
              <Text style={styles.routePointText}>{item.to}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.rideDetailItem}>
            <Clock size={16} color={Colors.light.subtext} />
            <Text style={styles.rideDetailText}>{item.time}, {item.date}</Text>
          </View>
        </View>

        {item.type === 'driver' ? (
          <View style={styles.passengersContainer}>
            <Text style={styles.passengersTitle}>
              Passengers ({item.passengers.length}/{item.seats.total})
            </Text>
            <View style={styles.passengersList}>
              {item.passengers.map((passenger, index) => (
                <Image 
                  key={index}
                  source={{ uri: passenger.image }} 
                  style={[
                    styles.passengerImage,
                    { marginLeft: index > 0 ? -10 : 0 }
                  ]} 
                />
              ))}
              {item.seats.available > 0 && (
                <View style={styles.availableSeatsContainer}>
                  <Text style={styles.availableSeatsText}>+{item.seats.available}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.driverInfoLarge}>
            <Image source={{ uri: item.driver.image }} style={styles.driverImageLarge} />
            <View>
              <Text style={styles.driverNameLarge}>{item.driver.name}</Text>
              <View style={styles.ratingContainer}>
                <Star size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{item.driver.rating}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.rideCardFooter}>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
          {item.type === 'driver' && (
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );

  return (
    <FlatList
      data={myRides}
      renderItem={renderMyRideItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={() => (
        <View style={styles.listHeader}>
          <View style={styles.myRidesFilterContainer}>
            <TouchableOpacity style={[styles.myRidesFilterButton, styles.myRidesFilterButtonActive]}>
              <Text style={styles.myRidesFilterButtonTextActive}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.myRidesFilterButton}>
              <Text style={styles.myRidesFilterButtonText}>Past</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.myRidesFilterButton}>
              <Text style={styles.myRidesFilterButtonText}>Cancelled</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListFooterComponent={() => <View style={styles.bottomPadding} />}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
  myRidesFilterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  myRidesFilterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  myRidesFilterButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  myRidesFilterButtonText: {
    color: Colors.light.text,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  myRidesFilterButtonTextActive: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  rideCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  rideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rideTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    fontFamily: 'Inter-Medium',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
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
    marginBottom: 16,
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
  rideDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rideDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  rideDetailText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginLeft: 5,
    fontFamily: 'Inter-Regular',
  },
  passengersContainer: {
    marginBottom: 16,
  },
  passengersTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  passengersList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.card,
  },
  availableSeatsContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  availableSeatsText: {
    fontSize: 12,
    color: Colors.light.subtext,
    fontFamily: 'Inter-Medium',
  },
  driverInfoLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  driverImageLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  driverNameLarge: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    fontFamily: 'Inter-Medium',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  rideCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 16,
  },
  detailsButton: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  detailsButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  cancelButton: {
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  cancelButtonText: {
    color: Colors.light.error,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  bottomPadding: {
    height: 80,
  },
});