import * as Location from "expo-location";
import * as Battery from "expo-battery";

export const LocationService = {
  requestPermissions: async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  },

  getCurrentLocation: async (): Promise<Location.LocationObject | null> => {
    try {
      // Try to get the last known position first (faster)
      let location = await Location.getLastKnownPositionAsync({});
      if (!location) {
        // If not available, request current position with balanced accuracy (faster than high)
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }
      return location;
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  },

  // ... (existing code)

  watchLocation: async (
    callback: (location: Location.LocationObject) => void
  ) => {
    let accuracy = Location.Accuracy.High;
    let timeInterval = 5000;
    let distanceInterval = 10;

    try {
      const level = await Battery.getBatteryLevelAsync();
      if (level > 0 && level < 0.2) {
        console.log("Low Battery Mode Active: Reducing GPS Polling");
        accuracy = Location.Accuracy.Balanced;
        timeInterval = 30000; // 30s
        distanceInterval = 50; // 50m
      }
    } catch (e) {
      // Ignore battery check errors
    }

    return await Location.watchPositionAsync(
      {
        accuracy,
        timeInterval,
        distanceInterval,
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
