import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

import DiscoverScreen from '~/src/screens/DiscoverScreen';
import FeedScreen from '~/src/screens/FeedScreen';
import ProfileScreen from '~/src/screens/UserProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#FF6B00' }}>
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
