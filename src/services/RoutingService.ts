import { LocationCoords, RouteInfo, SearchResult } from "../types";

export const RoutingService = {
  searchLocation: async (
    query: string,
    userCoords?: LocationCoords
  ): Promise<SearchResult[]> => {
    try {
      // Use Photon API for context-aware search
      let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        query
      )}&limit=5`;

      // If we have user location, bias the search
      if (userCoords) {
        url += `&lat=${userCoords.latitude}&lon=${userCoords.longitude}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      // Transform Photon GeoJSON to match our SearchResult interface
      if (data.features) {
        return data.features.map((f: any) => ({
          display_name:
            f.properties.name +
            ", " +
            [f.properties.city, f.properties.state, f.properties.country]
              .filter(Boolean)
              .join(", "),
          lat: f.geometry.coordinates[1].toString(),
          lon: f.geometry.coordinates[0].toString(),
          importance: f.properties.osm_type === "node" ? 0.8 : 0.5, // Rough estimation
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
      // OSRM Public Demo Server (Driving)
      // Note: This often fails for very long distances (e.g. inter-continental or >1000km)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=false`
      );
      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        return {
          distance: data.routes[0].distance, // meters
          duration: data.routes[0].duration, // seconds
        };
      }
      return null;
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
