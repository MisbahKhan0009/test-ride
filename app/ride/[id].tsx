import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useLocalSearchParams } from 'expo-router';

export default function ViewRide() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
            Ride Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            Ride Details
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {activeTab === 'chat' ? (
          <View style={styles.tabContent}>
            <Text style={styles.placeholderText}>
              Chat functionality to be implemented for Ride ID: {id}
            </Text>
          </View>
        ) : (
          <View style={styles.tabContent}>
            <Text style={styles.placeholderText}>
              Ride details to be implemented for Ride ID: {id}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.light.subtext,
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: Colors.light.primary,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 20,
  },
});