import { LocationCoords, RouteInfo, SearchResult } from "../types";

export const RoutingService = {
  searchLocation: async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`
      );
      return await response.json();
    } catch (error) {
      console.error("Error searching location:", error);
      return [];
    }
  },

  getRouteDetails: async (
    start: LocationCoords,
    end: LocationCoords
  ): Promise<RouteInfo | null> => {
    try {
      const response = await fetch(
        `http://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=false`
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
      return null;
    }
  },

  reverseGeocode: async (coords: LocationCoords): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
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
