import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { COLORS } from '../theme';

interface MapViewerProps {
    destination?: { latitude: number; longitude: number; } | null;
    currentLocation?: { latitude: number; longitude: number; } | null;
    style?: any;
    isTracking?: boolean;
}

export default function MapViewer({ destination, currentLocation, style, isTracking }: MapViewerProps) {
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        if (destination && currentLocation && mapRef.current) {
            const coords = [
                currentLocation,
                destination
            ];
            mapRef.current.fitToCoordinates(coords, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [destination, currentLocation]);

    const region = destination ? {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    } : undefined;

    return (
        <MapView
            ref={mapRef}
            style={[styles.map, style]}
            region={!isTracking ? region : undefined}
            scrollEnabled={isTracking}
            zoomEnabled={isTracking}
        >
            <UrlTile
                urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
            />
            {currentLocation && (
                <Marker coordinate={currentLocation} title="You" pinColor="blue" />
            )}
            {destination && (
                <Marker coordinate={destination} title="Destination" />
            )}
            {currentLocation && destination && (
                <Polyline
                    coordinates={[currentLocation, destination]}
                    strokeColor={COLORS.primary}
                    strokeWidth={3}
                />
            )}
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    }
});
