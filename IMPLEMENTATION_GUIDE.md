# kHrogEtna Social Follow System - Implementation Guide

## 🚀 Quick Start

This guide will help you integrate the production-ready social follow system into your kHrogEtna app.

---

## 📋 Prerequisites

Ensure you have the following packages installed:

```bash
# Core dependencies
npm install firebase
npm install expo-blur expo-linear-gradient
npm install @expo/vector-icons
npm install lodash

# Navigation (if not already installed)
npm install @react-navigation/native @react-navigation/native-stack
```

---

## 📁 File Structure

Place the files in your project as follows:

```
src/
├── services/
│   └── SocialService.js          # Core social follow logic
├── contexts/
│   └── SocialContext.jsx         # React Context for social state
├── components/
│   ├── FollowButton.jsx          # Follow/Unfollow button component
│   └── UserListItem.jsx          # User list item with founder styling
├── screens/
│   ├── SearchScreen.jsx          # User search screen
│   ├── UserProfileScreen.jsx    # User profile with follow functionality
│   └── SelectContactScreen.jsx  # Contact selection from following list
└── config/
    └── firebaseConfig.js         # Your Firebase configuration

firestore.rules                    # Firestore security rules (deploy to Firebase)
```

---

## 🔧 Step-by-Step Integration

### 1. Firebase Configuration

First, ensure your `firebaseConfig.js` exports the Firestore instance:

```javascript
// src/config/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 2. Deploy Firestore Security Rules

```bash
# Deploy the security rules to Firebase
firebase deploy --only firestore:rules
```

### 3. Initialize User Documents

When a new user signs up, create their user document with the proper structure:

```javascript
// During user registration
import { doc, setDoc } from 'firebase/firestore';
import { db } from './config/firebaseConfig';

const createUserProfile = async (uid, username) => {
  const userRef = doc(db, 'users', uid);
  
  await setDoc(userRef, {
    username: username.toLowerCase(), // Store lowercase for search
    isFounder: username === 'Hassan Elnaggar', // Set true for Hassan Elnaggar
    followersCount: 0,
    followingCount: 0,
    profilePic: null, // Optional
    createdAt: new Date(),
  });
};
```

### 4. Wrap Your App with SocialProvider

```javascript
// App.js or your root component
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SocialProvider } from './contexts/SocialContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <SocialProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SocialProvider>
  );
}
```

### 5. Add Screens to Navigation

```javascript
// navigation/AppNavigator.jsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from '../screens/SearchScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SelectContactScreen from '../screens/SelectContactScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      {/* Your existing screens */}
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="SelectContact" component={SelectContactScreen} />
    </Stack.Navigator>
  );
}
```

### 6. Using the FollowButton Component

```javascript
// In any screen where you want to show a follow button
import FollowButton from '../components/FollowButton';
import { useSocial } from '../contexts/SocialContext';

function MyScreen() {
  const { currentUser } = useSocial();
  const targetUserId = 'some-user-id';
  
  return (
    <FollowButton
      currentUserId={currentUser?.uid}
      targetUserId={targetUserId}
      targetUsername="johndoe"
      isFollowing={false}
      isFollowedBy={false}
      onFollowChange={(data) => {
        console.log('Follow status changed:', data);
      }}
      size="medium"
    />
  );
}
```

### 7. Using SocialService Directly

```javascript
// Example: Get user's following list
import SocialService from '../services/SocialService';

const loadFollowing = async (userId) => {
  try {
    const result = await SocialService.getFollowing(userId, 50);
    console.log('Following users:', result.users);
    console.log('Has more:', result.hasMore);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Example: Check if user is following another user
const checkFollowStatus = async (currentUserId, targetUserId) => {
  const isFollowing = await SocialService.isFollowing(currentUserId, targetUserId);
  console.log('Is following:', isFollowing);
};

// Example: Get relationship status
const getStatus = async (currentUserId, targetUserId) => {
  const status = await SocialService.getRelationshipStatus(currentUserId, targetUserId);
  console.log('Relationship:', status);
  // Returns: { isSelf, isFollowing, isFollowedBy, isMutual }
};
```

---

## 🎨 Customizing Styles

### Changing Brand Color

Update the `#FF6B35` (Sunset Orange) color in the following files:

- `FollowButton.jsx` - Search for `buttonFollow` style
- `UserListItem.jsx` - Search for `avatarPlaceholder` style
- All screens - Search for `ActivityIndicator` color prop

### Adjusting Glassmorphism

Modify blur intensity in each screen:

```javascript
<BlurView intensity={80} style={styles.blurContainer}>
// Change intensity from 0-100
```

### Founder Styling

To customize the founder appearance, edit:

- `UserListItem.jsx` - Golden crown and glow effects
- `UserProfileScreen.jsx` - Profile header styling

---

## 🔍 Search Optimization

For production-scale search, consider integrating:

### Option 1: Algolia Search

```bash
npm install algoliasearch react-instantsearch-native
```

### Option 2: Firebase Extensions

```bash
firebase ext:install algolia/firestore-algolia-search
```

### Option 3: Cloud Functions for Custom Search

```javascript
// functions/index.js
exports.searchUsers = functions.https.onCall(async (data, context) => {
  const { query } = data;
  // Implement custom search logic
});
```

---

## 📊 Firestore Indexes

Create composite indexes for better query performance:

```bash
# Run this command or create via Firebase Console
firebase firestore:indexes
```

Add these indexes in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "social_graph",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "followerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "social_graph",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "followingId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "username", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 🧪 Testing

### Manual Testing

Follow the comprehensive test checklist in `TEST_CHECKLIST.md`.

### Automated Testing (Optional)

```javascript
// __tests__/SocialService.test.js
import SocialService from '../services/SocialService';

describe('SocialService', () => {
  it('should follow user successfully', async () => {
    const result = await SocialService.followUser('user1', 'user2');
    expect(result.success).toBe(true);
  });
  
  it('should prevent negative counters', async () => {
    // Test negative guard logic
  });
  
  it('should be idempotent', async () => {
    // Test duplicate follow prevention
  });
});
```

---

## 🚨 Important Security Notes

1. **Never Disable Security Rules**: The rules prevent malicious counter manipulation
2. **Validate User Existence**: Always check if users exist before operations
3. **Rate Limiting**: Consider implementing rate limits for follow/unfollow actions
4. **Monitor Firestore Usage**: Set up billing alerts to prevent unexpected costs

---

## 📈 Monitoring & Analytics

### Add Firebase Analytics Events

```javascript
import { logEvent } from 'firebase/analytics';
import { analytics } from './firebaseConfig';

// Track follow events
const trackFollow = (targetUserId) => {
  logEvent(analytics, 'follow_user', {
    target_user_id: targetUserId,
    timestamp: new Date().toISOString(),
  });
};

// Track unfollow events
const trackUnfollow = (targetUserId) => {
  logEvent(analytics, 'unfollow_user', {
    target_user_id: targetUserId,
    timestamp: new Date().toISOString(),
  });
};
```

---

## 🐛 Troubleshooting

### Issue: Follow button not updating

**Solution**: Ensure `onFollowChange` callback is properly wired

### Issue: Counters going negative

**Solution**: Verify security rules are deployed correctly

### Issue: Slow search performance

**Solution**: Implement Algolia or add Firestore indexes

### Issue: Offline mode not working

**Solution**: Enable Firestore persistence:

```javascript
import { enableIndexedDbPersistence } from 'firebase/firestore';
enableIndexedDbPersistence(db);
```

---

## 🎯 Production Checklist

- [ ] Deploy Firestore security rules
- [ ] Create Firestore indexes
- [ ] Test offline behavior
- [ ] Test rapid tapping scenarios
- [ ] Verify founder styling for Hassan Elnaggar
- [ ] Set up monitoring and alerts
- [ ] Load test with 1000+ users
- [ ] Implement rate limiting
- [ ] Add analytics tracking
- [ ] Update privacy policy for social features

---

## 📞 Support

For issues or questions:

1. Check the test checklist
2. Review Firestore security rules
3. Examine console logs for errors
4. Test with Firestore emulator locally

---

## 🎉 You're Ready

Your social follow system is now production-ready. Follow the test checklist to ensure everything works correctly before launching to users.

**Happy Coding! 🚀**
