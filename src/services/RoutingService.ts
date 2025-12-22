import { LocationCoords, RouteInfo, SearchResult } from "../types";
// Polyline decoder is implemented locally

// Simple Polyline Decoder (Google Encoded String -> [[lat, lon], ...])
const decodePolyline = (t: string) => {
  let points = [];
  let index = 0,
    len = t.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
};

const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_API_KEY ||
  "AIzaSyCslEV-aPV62y_yUxccMH9TTnlnJM9_7LM"; // Fallback only for safety, try to use env.

export const RoutingService = {
  searchLocation: async (
    query: string,
    userCoords?: LocationCoords
  ): Promise<SearchResult[]> => {
    try {
      // GOOGLE GEOCODING API
      let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${GOOGLE_API_KEY}`;

      // BIASING: Construct a Bounding Box (~50km radius) around the user if location is known
      // This solves the "Salt Lake" vs "Salt Lake City" issue by prioritizing local results.
      if (userCoords) {
        const delta = 0.5; // Roughly 55km latitude
        const south = userCoords.latitude - delta;
        const north = userCoords.latitude + delta;
        const west = userCoords.longitude - delta;
        const east = userCoords.longitude + delta;

        url += `&bounds=${south},${west}|${north},${east}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results) {
        return data.results.map((r: any) => ({
          display_name: r.formatted_address,
          lat: r.geometry.location.lat.toString(),
          lon: r.geometry.location.lng.toString(),
          importance: 1.0, // Google results are high confidence
        }));
      }
      return [];
    } catch (error) {
      console.error("Error searching location:", error);
      return [];
    }
  },

  getRouteDetails: async (
    start: LocationCoords,
    end: LocationCoords,
    mode: "driving" | "aerial" = "driving"
  ): Promise<RouteInfo | null> => {
    if (mode === "aerial") {
      return RoutingService.calculateHaversine(start, end);
    }

    try {
      // GOOGLE DIRECTIONS API
      // Using 'departure_time=now' forces the API to use real-time traffic conditions
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&mode=driving&departure_time=now&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.routes.length > 0) {
        const leg = data.routes[0].legs[0];
        const points = decodePolyline(data.routes[0].overview_polyline.points);

        // prefer duration_in_traffic if available, else duration
        const durationSeconds = leg.duration_in_traffic
          ? leg.duration_in_traffic.value
          : leg.duration.value;

        return {
          distance: leg.distance.value, // meters
          duration: durationSeconds, // seconds
          geometry: points, // Array of [lat, lon]
        };
      } else {
        console.error("Google API Error:", data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error("Error getting route details:", error);
      return null;
    }
  },

  calculateHaversine: (
    start: LocationCoords,
    end: LocationCoords
  ): RouteInfo => {
    const R = 6371e3; // metres
    const toRad = (val: number) => (val * Math.PI) / 180;

    const φ1 = toRad(start.latitude);
    const φ2 = toRad(end.latitude);
    const Δφ = toRad(end.latitude - start.latitude);
    const Δλ = toRad(end.longitude - start.longitude);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // in meters
    const duration = distance / 222; // ~800km/h

    return { distance, duration };
  },

  reverseGeocode: async (coords: LocationCoords): Promise<string | null> => {
    try {
      // GOOGLE REVERSE GEOCODING
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        // Return the first (most specific) result
        return data.results[0].formatted_address;
      }
      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  },
};
