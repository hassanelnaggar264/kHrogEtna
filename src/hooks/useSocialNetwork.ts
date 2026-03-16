import { useQuery } from '@tanstack/react-query';
import { query, where, getDocs } from 'firebase/firestore';
import { followsCollection, usersCollection } from '../services/collections';
import { User, Follow } from '../types/schema';

type NetworkType = 'followers' | 'following';

export const useSocialNetwork = (userId: string, type: NetworkType) => {
  return useQuery({
    queryKey: ['socialNetwork', userId, type],
    queryFn: async () => {
      // 1. Fetch the relationship pointers
      const qField = type === 'followers' ? 'followingId' : 'followerId';
      const q = query(followsCollection, where(qField, '==', userId));
      
      const followSnap = await getDocs(q);
      const followDocs = followSnap.docs.map(d => d.data() as Follow);

      if (followDocs.length === 0) return [];

      // 2. Resolve the pointers to actual User profiles
      const targetIds = followDocs.map(f => type === 'followers' ? f.followerId : f.followingId);
      
      // Firestore 'in' queries are limited to 10 items.
      // For MVP, chunking or multiple requests:
      const chunks = [];
      for (let i = 0; i < targetIds.length; i += 10) {
        chunks.push(targetIds.slice(i, i + 10));
      }

      let users: User[] = [];
      
      for (const chunk of chunks) {
        const userQ = query(usersCollection, where('userId', 'in', chunk));
        const uSnap = await getDocs(userQ);
        users = [...users, ...uSnap.docs.map(d => d.data() as User)];
      }

      return users;
    },
    enabled: !!userId
  });
};
