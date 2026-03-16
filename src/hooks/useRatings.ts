import { useInfiniteQuery } from '@tanstack/react-query';
import { query, where, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { ratingsCollection } from '../services/collections';
import { Rating } from '../types/schema';

type FetchRatingsParams = {
  businessId: string;
  pageSize?: number;
};

type FetchResult = {
  data: Rating[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
};

const fetchRatings = async (
  params: FetchRatingsParams,
  pageParam: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<FetchResult> => {
  let q = query(
    ratingsCollection,
    where('businessId', '==', params.businessId),
    orderBy('createdAt', 'desc')
  );

  if (pageParam) {
    q = query(q, startAfter(pageParam));
  }

  const FETCH_LIMIT = params.pageSize || 10;
  q = query(q, limit(FETCH_LIMIT));

  const snapshot = await getDocs(q);
  
  const results = snapshot.docs.map(doc => doc.data() as Rating);
  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return {
    data: results,
    lastVisible
  };
};

export const useRatings = (params: FetchRatingsParams) => {
  return useInfiniteQuery({
    queryKey: ['ratings', params.businessId],
    queryFn: ({ pageParam = null }) => fetchRatings(params, pageParam),
    initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
    getNextPageParam: (lastPage) => lastPage.lastVisible,
  });
};
