import * as Location from "expo-location";

export const LocationService = {
  requestPermissions: async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  },

  getCurrentLocation: async (): Promise<Location.LocationObject | null> => {
    try {
      return await Location.getCurrentPositionAsync({});
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  },

  watchLocation: async (
    callback: (location: Location.LocationObject) => void
  ) => {
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      callback
    );
  },

  reverseGeocode: async (coords: {
    latitude: number;
    longitude: number;
  }): Promise<string | null> => {
    try {
      const [address] = await Location.reverseGeocodeAsync(coords);
      if (address) {
        // Construct a readable string
        return [address.city, address.region, address.country]
          .filter(Boolean)
          .join(", ");
      }
      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  },
};
