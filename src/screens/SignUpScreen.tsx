import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { registerUser } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import { AccountType } from '../types/schema';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any, 'SignUp'>;
};

export default function SignUpScreen({ navigation }: Props) {
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const handleSignUp = async () => {
    if (!name || !username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const userDoc = await registerUser(email, password, name, username, accountType);
      setUser(userDoc);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Join 2Where? ✨</Text>
        <Text style={styles.subtitle}>Discover places based on your mood</Text>

        {/* Account Type Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, accountType === 'personal' && styles.activeTab]} 
            onPress={() => setAccountType('personal')}>
            <Text style={[styles.tabText, accountType === 'personal' && styles.activeTabText]}>Personal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, accountType === 'business' && styles.activeTab]} 
            onPress={() => setAccountType('business')}>
            <Text style={[styles.tabText, accountType === 'business' && styles.activeTabText]}>Business</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder={accountType === 'business' ? "Owner's Full Name" : "Full Name"}
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password (Min 6 characters)"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create {accountType === 'business' ? 'Business' : 'Personal'} Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchButton}>
          <Text style={styles.switchText}>Already have an account? <Text style={styles.switchTextBold}>Log in</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  formContainer: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  tabContainer: { flexDirection: 'row', marginBottom: 24, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: 'bold', color: '#888' },
  activeTabText: { color: '#000' },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  button: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 24, alignItems: 'center' },
  switchText: { color: '#666', fontSize: 14 },
  switchTextBold: { color: '#FF6B00', fontWeight: 'bold' }
});
