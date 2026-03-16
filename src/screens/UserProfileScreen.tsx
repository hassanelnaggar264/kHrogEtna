import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { executeFollow, executeUnfollow } from '../services/socialService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { User } from '../types/schema';
import { logoutUser } from '../services/authService';

export default function UserProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [loadingAction, setLoadingAction] = useState(false);

  // Setup real-time listener for the user's document to keep counters synced
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.userId), (doc) => {
      if (doc.exists()) {
        setUser(doc.data() as User);
      }
    });
    return () => unsub();
  }, [user?.userId]);

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
       <View style={styles.header}>
         <View style={styles.avatarPlaceholder}>
           <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
         </View>
         <View style={styles.infoBox}>
           <Text style={styles.name}>
             {user.name} 
             {user.isFounder && <Text> 👑</Text>}
           </Text>
           <Text style={styles.username}>@{user.username}</Text>
           <View style={styles.badgesWrapper}>
             <Text style={styles.accountTypeBadge}>{user.accountType.toUpperCase()}</Text>
             {user.isFounder && <Text style={[styles.accountTypeBadge, {backgroundColor: '#FFD700', color: '#000'}]}>FOUNDER</Text>}
           </View>
         </View>
       </View>

       <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statBox}>
            <Text style={styles.statNumber}>{user.followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox}>
            <Text style={styles.statNumber}>{user.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
       </View>

       {/* Actions */}
       <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={logoutUser}>
             <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
       </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', padding: 20, alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 32, color: '#888', fontWeight: 'bold' },
  infoBox: { flex: 1 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  username: { fontSize: 16, color: '#666', marginBottom: 6 },
  badgesWrapper: { flexDirection: 'row', gap: 6 },
  accountTypeBadge: { backgroundColor: '#FF6B00', color: '#FFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statsContainer: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  statLabel: { fontSize: 14, color: '#666' },
  actionsContainer: { padding: 20 },
  logoutButton: { padding: 15, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30' },
  logoutText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 }
});
