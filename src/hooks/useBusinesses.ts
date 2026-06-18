import { useInfiniteQuery } from '@tanstack/react-query';
import { query, where, orderBy, limit, getDocs, startAfter, DocumentData, QueryDocumentSnapshot, GeoPoint } from 'firebase/firestore';
import { businessesCollection } from '../services/collections';
import { Business } from '../types/schema';
import { MOCK_PLACES } from '../data/mockPlaces';

type FetchBusinessesParams = {
  mood?: string;
  priceRange?: string;
  minRating?: number;
  category?: string;
  searchQuery?: string;
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
  try {
    let q = query(businessesCollection);

    // Apply filters natively where Firestore indexes allow
    if (params.mood && params.mood !== 'Popular') {
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
    })) as Business[];

    // Client-side filtering for limitations of Firestore
    if (params.minRating) {
      results = results.filter(b => b.ratingAvg >= params.minRating!);
    }

    if (params.category && params.category !== 'All') {
      results = results.filter(b => b.category.toLowerCase().includes(params.category!.toLowerCase()));
    }

    if (params.searchQuery) {
      const qLower = params.searchQuery.toLowerCase();
      results = results.filter(b => 
        b.name.toLowerCase().includes(qLower) || 
        b.description.toLowerCase().includes(qLower)
      );
    }

    if (results.length > 0) {
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      return {
        data: results,
        lastVisible
      };
    }
  } catch (error) {
    console.log("Firestore fetch failed or empty, falling back to local MOCK_PLACES:", error);
  }

  // Fallback to mock places
  let mockResults = MOCK_PLACES.map(p => ({
    ...p,
    location: new GeoPoint(p.location.latitude, p.location.longitude),
    createdAt: {} as any,
    menu: p.menu.map(m => m.name) // compatibility with raw schema
  })) as any[] as Business[];

  if (params.mood && params.mood !== 'Popular') {
    mockResults = mockResults.filter(p => p.moods.includes(params.mood!));
  }

  if (params.priceRange) {
    mockResults = mockResults.filter(p => p.priceRange === params.priceRange);
  }

  if (params.category && params.category !== 'All') {
    mockResults = mockResults.filter(p => p.category.toLowerCase().includes(params.category!.toLowerCase()));
  }

  if (params.minRating) {
    mockResults = mockResults.filter(p => p.ratingAvg >= params.minRating!);
  }

  if (params.searchQuery) {
    const qLower = params.searchQuery.toLowerCase();
    mockResults = mockResults.filter(p => 
      p.name.toLowerCase().includes(qLower) || 
      p.description.toLowerCase().includes(qLower)
    );
  }

  return {
    data: mockResults,
    lastVisible: null
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
