import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '~/src/store/useAuthStore';
import { auth } from '~/src/services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchUserDocument } from '~/src/services/authService';

import LoginScreen from '~/src/screens/LoginScreen';
import SignUpScreen from '~/src/screens/SignUpScreen';

import MainTabs from '~/src/navigation/MainTabs';
import PlaceDetailsScreen from '~/src/screens/PlaceDetailsScreen';
import MenuEditorScreen from '~/src/screens/MenuEditorScreen';
import { linking } from '~/src/navigation/linking';

const Stack = createNativeStackNavigator();

export default function RootNavigation() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Fetch full custom user profile from Firestore
        const userDoc = await fetchUserDocument(firebaseUser.uid);
        setUser(userDoc);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
        <Stack.Screen name="MenuEditor" component={MenuEditorScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
