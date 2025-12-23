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
      // GOOGLE PLACES AUTOCOMPLETE API
      // Use 'input' for partial matching and 'types' to allow establishments (businesses) + geocode (addresses)
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${GOOGLE_API_KEY}`;

      // BIASING: Focus results around the user's location
      if (userCoords) {
        // location=lat,lng&radius=50000 (50km)
        url += `&location=${userCoords.latitude},${userCoords.longitude}&radius=50000`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.predictions) {
        return data.predictions.map((p: any) => ({
          display_name: p.description,
          lat: "0", // Placeholder, fetched on selection via getPlaceDetails
          lon: "0",
          place_id: p.place_id,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error searching location:", error);
      return [];
    }
  },

  getPlaceDetails: async (placeId: string): Promise<LocationCoords | null> => {
    try {
      // GOOGLE PLACES DETAILS API
      // Only fetch geometry to save data/cost
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.result && data.result.geometry) {
        return {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting place details:", error);
      return null;
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
