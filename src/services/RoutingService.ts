import { LocationCoords, RouteInfo, SearchResult } from "../types";

export const RoutingService = {
  searchLocation: async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            "User-Agent": "GeoReminderApp/1.0",
            "Accept-Language": "en-US,en;q=0.9",
          },
        }
      );
      return await response.json();
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
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=false`
      );
      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        return {
          distance: data.routes[0].distance,
          duration: data.routes[0].duration,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting route details:", error);
      // Fallback to aerial if network fails? No, better to return null or let user define.
      // But for robust app, maybe fallback is good? User said "if car is selected use on road".
      // So stick to null on failure to indicate "Rotuing Failed".
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
    // Assume average flight speed ~800 km/h = ~222 m/s for estimation
    const duration = distance / 222;

    return { distance, duration };
  },

  reverseGeocode: async (coords: LocationCoords): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
        {
          headers: {
            "User-Agent": "GeoReminderApp/1.0",
          },
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  },
};
