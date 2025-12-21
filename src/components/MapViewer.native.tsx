import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapViewerProps {
    destination?: { latitude: number; longitude: number; } | null;
    currentLocation?: { latitude: number; longitude: number; } | null;
    style?: any;
    isTracking?: boolean;
}

export default function MapViewer({ destination, currentLocation, style, isTracking }: MapViewerProps) {
    const webviewRef = useRef<WebView>(null);

    const destLat = destination?.latitude || 0;
    const destLon = destination?.longitude || 0;
    const currLat = currentLocation?.latitude || 0;
    const currLon = currentLocation?.longitude || 0;

    const hasDest = !!destination;
    const hasCurr = !!currentLocation;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { height: 100vh; width: 100%; }
                /* Custom Pin Style */
                .custom-div-icon {
                    background: transparent;
                    border: none;
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map', {
                    zoomControl: false, 
                    attributionControl: false
                });
                
                // Init view
                if (!${hasDest} && !${hasCurr}) {
                    map.setView([0, 0], 2);
                }

                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                }).addTo(map);

                var bounds = [];
                
                ${hasCurr ? `
                    var currIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: '<div style="background-color: blue; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                        iconSize: [20, 20]
                    });
                    L.marker([${currLat}, ${currLon}], {icon: currIcon}).addTo(map);
                    bounds.push([${currLat}, ${currLon}]);
                ` : ''}

                ${hasDest ? `
                    // Default marker for destination
                    L.marker([${destLat}, ${destLon}]).addTo(map);
                    bounds.push([${destLat}, ${destLon}]);
                ` : ''}

                ${hasCurr && hasDest ? `
                    var latlngs = [
                        [${currLat}, ${currLon}],
                        [${destLat}, ${destLon}]
                    ];
                    var polyline = L.polyline(latlngs, {color: '#6C5CE7', weight: 4, opacity: 0.8}).addTo(map);
                ` : ''}

                if (bounds.length > 0) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                    if (bounds.length === 1) {
                        map.setZoom(14);
                    }
                }
            </script>
        </body>
        </html>
    `;

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{ flex: 1 }}
                startInLoadingState={true}
                renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} />}
                pointerEvents={isTracking ? 'none' : 'auto'} // Disable interaction if just tracking
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        borderRadius: 24, // Match card radius
    }
});
