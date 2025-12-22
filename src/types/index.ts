export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  geometry?: any[]; // GeoJSON coordinates or Polyline points [[lat,lon],...]
}

export interface FavoriteLocation {
  id: string;
  label: string;
  icon: string; // 'home', 'work', 'heart', etc.
  coords: LocationCoords;
  address: string;
}

export interface ReminderSettings {
  destination: LocationCoords | null;
  destinationName: string;
  distanceThreshold: number; // in meters
  timeThreshold: number; // in minutes
  isActive: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  history?: SearchResult[];
  favorites?: FavoriteLocation[];
  customSoundUri?: string | null;
}
