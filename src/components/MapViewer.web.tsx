import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface MapViewerProps {
    destination?: { latitude: number; longitude: number; } | null;
    currentLocation?: { latitude: number; longitude: number; } | null;
    style?: any;
    isTracking?: boolean;
}

export default function MapViewer({ destination, currentLocation, style, isTracking }: MapViewerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Construct the HTML content for the iframe
    const getHtmlContent = () => {
        const destLat = destination?.latitude || 0;
        const destLon = destination?.longitude || 0;
        const currLat = currentLocation?.latitude || 0;
        const currLon = currentLocation?.longitude || 0;

        const hasDest = !!destination;
        const hasCurr = !!currentLocation;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
                <style>
                    body { margin: 0; padding: 0; }
                    #map { height: 100vh; width: 100%; }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    var map = L.map('map');
                    
                    // Default view if nothing set
                    if (!${hasDest} && !${hasCurr}) {
                        map.setView([0, 0], 2);
                    }

                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    }).addTo(map);

                    var bounds = [];
                    
                    ${hasCurr ? `
                        var currMarker = L.marker([${currLat}, ${currLon}]).addTo(map)
                            .bindPopup('You').openPopup();
                        bounds.push([${currLat}, ${currLon}]);
                    ` : ''}

                    ${hasDest ? `
                        var destMarker = L.marker([${destLat}, ${destLon}]).addTo(map)
                            .bindPopup('Destination');
                        bounds.push([${destLat}, ${destLon}]);
                    ` : ''}

                    ${hasCurr && hasDest ? `
                        var latlngs = [
                            [${currLat}, ${currLon}],
                            [${destLat}, ${destLon}]
                        ];
                        var polyline = L.polyline(latlngs, {color: 'blue'}).addTo(map);
                    ` : ''}

                    if (bounds.length > 0) {
                        map.fitBounds(bounds, { padding: [50, 50] });
                        if (bounds.length === 1) {
                            map.setZoom(13);
                        }
                    }
                </script>
            </body>
            </html>
        `;
    };

    // Use srcDoc to render the map
    // Note: React Native Web renders <View> as <div>, so we can put an <iframe> inside
    return (
        <View style={[styles.container, style]}>
            <iframe
                ref={iframeRef}
                srcDoc={getHtmlContent()}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    }
});
