import { useQuery } from '@tanstack/react-query';
import { query, where, getDocs } from 'firebase/firestore';
import { usersCollection } from '../services/collections';

// Fetches a flattened Set of all business IDs that have been picked by any Founder
export const useFounderPicks = () => {
  return useQuery({
    queryKey: ['founderPicks'],
    queryFn: async () => {
      const q = query(usersCollection, where('isFounder', '==', true));
      const snap = await getDocs(q);
      
      const picks = new Set<string>();
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.founderPicks && Array.isArray(data.founderPicks)) {
          data.founderPicks.forEach((id: string) => picks.add(id));
        }
      });
      
      return picks;
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache since founder picks rarely change
  });
};
