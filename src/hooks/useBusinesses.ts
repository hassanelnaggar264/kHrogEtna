import { useInfiniteQuery } from '@tanstack/react-query';
import { query, where, orderBy, limit, getDocs, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { businessesCollection } from '../services/collections';
import { Business } from '../types/schema';

type FetchBusinessesParams = {
  mood?: string;
  priceRange?: string;
  minRating?: number;
  category?: string;
  pageSize?: number;
};

type FetchResult = {
  data: Business[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
};

// Core Firebase Data Fetching Logic for Businesses
const fetchBusinesses = async (
  params: FetchBusinessesParams,
  pageParam: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<FetchResult> => {
  let q = query(businessesCollection);

  // Apply filters natively where Firestore indexes allow
  if (params.mood) {
    q = query(q, where('moods', 'array-contains', params.mood));
  }
  
  if (params.priceRange) {
    q = query(q, where('priceRange', '==', params.priceRange));
  }

  // To support filtering and sorting together, we order by rating
  q = query(q, orderBy('ratingAvg', 'desc'));

  // Pagination cursor
  if (pageParam) {
    q = query(q, startAfter(pageParam));
  }

  // Enforce Limit
  const FETCH_LIMIT = params.pageSize || 20;
  q = query(q, limit(FETCH_LIMIT));

  const snapshot = await getDocs(q);
  
  let results = snapshot.docs.map(doc => ({
    ...doc.data(),
    // Convert GeoPoint and Timestamps to serializable formats if necessary for UI,
    // though passing them raw to components is often fine. Retaining raw for now.
  })) as Business[];

  // Client-side filtering for limitations of Firestore (e.g. minRating since we already have an inequality on array-contains potentially)
  if (params.minRating) {
    results = results.filter(b => b.ratingAvg >= params.minRating!);
  }

  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return {
    data: results,
    lastVisible
  };
};

export const useBusinesses = (params: FetchBusinessesParams) => {
  return useInfiniteQuery({
    queryKey: ['businesses', params],
    queryFn: ({ pageParam = null }) => fetchBusinesses(params, pageParam),
    initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
    getNextPageParam: (lastPage) => lastPage.lastVisible,
  });
};
