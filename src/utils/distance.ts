import { GeoPoint } from "firebase/firestore";

// Helper type for coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Converts a Firestore GeoPoint to standard coordinates
export const geoPointToCoords = (geoPoint: GeoPoint): Coordinates => ({
  latitude: geoPoint.latitude,
  longitude: geoPoint.longitude,
});

/**
 * Calculates the distance between two geographic coordinates in kilometers
 * using the Haversine formula.
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const toRadian = (angle: number) => (Math.PI / 180) * angle;

  const R = 6371; // Earth's radius in km

  const dLat = toRadian(coord2.latitude - coord1.latitude);
  const dLon = toRadian(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadian(coord1.latitude)) *
      Math.cos(toRadian(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance; 
};
