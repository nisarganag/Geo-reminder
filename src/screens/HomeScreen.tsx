import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity, SafeAreaView, StatusBar as RNStatusBar, Dimensions, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapViewer from '../components/MapViewer';

import { LocationService } from '../services/LocationService';
import { RoutingService } from '../services/RoutingService';
import { NotificationService } from '../services/NotificationService';
import { LocationCoords, SearchResult, RouteInfo, ReminderSettings } from '../types';
import { LocationObject } from 'expo-location';
import { COLORS, GLOBAL_STYLES, SHADOWS } from '../theme';

const STORAGE_KEY = 'GEO_REMINDER_SETTINGS';

// ------------------- UI Components -------------------

const SimpleProgressBar = ({ progress }: { progress: number }) => (
    <View style={localStyles.progressContainer}>
        <View style={[localStyles.progressBar, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
    </View>
);

// ------------------- Main Component -------------------

export default function HomeScreen() {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [destination, setDestination] = useState<LocationCoords | null>(null);
    const [destinationName, setDestinationName] = useState('');

    const [timeThreshold, setTimeThreshold] = useState('30');
    const [distanceThreshold, setDistanceThreshold] = useState('10');

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<LocationObject | null>(null);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [statusMessage, setStatusMessage] = useState('Ready to start');
    const [initialDistance, setInitialDistance] = useState<number | null>(null);

    const locationSubscription = useRef<any>(null);
    const lastNotificationTime = useRef<number>(0);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // New State for Address
    const [currentAddress, setCurrentAddress] = useState('Locating...');

    useEffect(() => {
        loadSettings();
        checkPermissions().then(() => {
            refreshLocation();
        });
        return () => {
            stopTracking();
        }
    }, []);

    // Debounced Search Effect
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!query || query.length < 3) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const results = await RoutingService.searchLocation(query);
                setSearchResults(results);
            } catch (error) {
                console.log('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 400); // reduced to 400ms for "instant" feel

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [query]);

    const refreshLocation = async () => {
        setCurrentAddress('Updating...');
        const loc = await LocationService.getCurrentLocation();
        if (loc) {
            setCurrentLocation(loc);
            // Try native geocoding first (Device/Google)
            let addr = await LocationService.reverseGeocode(loc.coords);

            // Fallback to OSM/Nominatim (Web/No API Key)
            if (!addr) {
                console.log('Native geocoding failed, trying OSM...');
                addr = await RoutingService.reverseGeocode(loc.coords);
            }

            setCurrentAddress(addr || 'Unknown Location');
        } else {
            setCurrentAddress('Location unavailable');
        }
    };

    const checkPermissions = async () => {
        const hasLocPerm = await LocationService.requestPermissions();
        const hasNotifPerm = await NotificationService.requestPermissions();
        if (!hasLocPerm || !hasNotifPerm) {
            Alert.alert('Permissions needed', 'Please grant location and notification permissions');
        }
    };

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                const settings: ReminderSettings = JSON.parse(saved);
                if (settings.destination) {
                    setDestination(settings.destination);
                    setDestinationName(settings.destinationName);
                    setDistanceThreshold((settings.distanceThreshold / 1000).toString());
                    setTimeThreshold(settings.timeThreshold.toString());
                    setSoundEnabled(settings.soundEnabled ?? true);
                    setVibrationEnabled(settings.vibrationEnabled ?? true);
                }
            }
        } catch (e) {
            console.log('Failed to load settings', e);
        }
    };

    const saveSettings = async () => {
        try {
            const settings: ReminderSettings = {
                destination,
                destinationName,
                distanceThreshold: parseFloat(distanceThreshold) * 1000,
                timeThreshold: parseFloat(timeThreshold),
                isActive: isTracking,
                soundEnabled,
                vibrationEnabled
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.log('Failed to save settings', e);
        }
    };

    const selectDestination = (item: SearchResult) => {
        setDestination({
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon)
        });
        setDestinationName(item.display_name);
        setSearchResults([]);
        setQuery(''); // Clear query logic
    };

    const clearSelection = () => {
        setDestination(null);
        setDestinationName('');
        setSearchResults([]);
        setQuery('');
    };

    const startTracking = async () => {
        if (!destination) {
            Alert.alert('Error', 'Please select a destination');
            return;
        }

        const startLoc = await LocationService.getCurrentLocation();
        if (!startLoc) {
            Alert.alert('Error', 'Could not get current location');
            return;
        }

        const info = await RoutingService.getRouteDetails(startLoc.coords, destination);
        if (info) {
            const distKm = info.distance / 1000;
            const timeMin = info.duration / 60;
            const threshDist = parseFloat(distanceThreshold);
            const threshTime = parseFloat(timeThreshold);

            // Validation Checks
            if (distKm < threshDist) {
                const msg = `You are ${distKm.toFixed(2)}km away, closer than your ${threshDist}km threshold.`;
                if (Platform.OS === 'web') {
                    if (window.confirm(`${msg} Start anyway?`)) proceedToTrack(startLoc, info);
                } else {
                    Alert.alert('Already Within Range', msg, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Start Anyway', onPress: () => proceedToTrack(startLoc, info) }
                    ]);
                }
                return;
            } else if (timeMin < threshTime) {
                const msg = `You are ${timeMin.toFixed(0)} mins away, less than your ${threshTime} min threshold.`;
                if (Platform.OS === 'web') {
                    if (window.confirm(`${msg} Start anyway?`)) proceedToTrack(startLoc, info);
                } else {
                    Alert.alert('Already Within Range', msg, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Start Anyway', onPress: () => proceedToTrack(startLoc, info) }
                    ]);
                }
                return;
            }
            proceedToTrack(startLoc, info);
        } else {
            proceedToTrack(startLoc, null);
        }
    };

    const proceedToTrack = async (startLoc: LocationObject, initialInfo: RouteInfo | null) => {
        setIsTracking(true);
        setStatusMessage('Tracking active...');
        saveSettings();

        if (initialInfo) {
            setInitialDistance(initialInfo.distance);
            setRouteInfo(initialInfo);
        } else {
            setInitialDistance(null);
        }

        setCurrentLocation(startLoc);
        checkProximity(startLoc.coords);

        locationSubscription.current = await LocationService.watchLocation(async (loc) => {
            setCurrentLocation(loc);
            await checkProximity(loc.coords);
        });
    };

    const stopTracking = async () => {
        if (locationSubscription.current) {
            await locationSubscription.current.remove();
            locationSubscription.current = null;
        }
        setIsTracking(false);
        setStatusMessage('Tracking stopped');
    };

    const checkProximity = async (userCoords: LocationCoords) => {
        if (!destination) return;

        const info = await RoutingService.getRouteDetails(userCoords, destination);
        if (info) {
            setRouteInfo(info);
            // If initial was never set (e.g. route failed at start but works now), set it
            if (initialDistance === null) setInitialDistance(info.distance);

            const remainingKm = info.distance / 1000;
            const remainingMins = info.duration / 60;
            const targetKm = parseFloat(distanceThreshold);
            const targetMins = parseFloat(timeThreshold);

            setStatusMessage(`${remainingKm.toFixed(1)} km  •  ${remainingMins.toFixed(0)} min`);

            const distTrigger = remainingKm <= targetKm;
            const timeTrigger = remainingMins <= targetMins;

            if (distTrigger || timeTrigger) {
                const now = Date.now();
                if (now - lastNotificationTime.current > 5 * 60 * 1000) {
                    const triggerType = distTrigger ? 'Distance' : 'Time';
                    const msg = `You are ${remainingKm.toFixed(1)}km and ${remainingMins.toFixed(0)}min away from ${destinationName}`;

                    await NotificationService.scheduleNotification(`Arriving Soon! (${triggerType})`, msg, soundEnabled);
                    if (Platform.OS === 'web') {
                        window.alert(`REMINDER: ${msg}`);
                    }
                    lastNotificationTime.current = now;
                }
            }
        }
    };

    const getProgress = () => {
        if (!initialDistance || !routeInfo) return 0;
        // Avoid division by zero
        if (initialDistance === 0) return 1;

        const p = (initialDistance - routeInfo.distance) / initialDistance;
        return Math.min(1, Math.max(0, p));
    };

    return (
        <SafeAreaView style={GLOBAL_STYLES.container}>
            {/* Ambient Background Gradient (Web) */}
            {Platform.OS === 'web' && (
                <View style={localStyles.gradientBg as any} />
            )}

            <View style={localStyles.header}>
                <Text style={localStyles.headerTitle}>GEO REMINDER</Text>
                <Text style={localStyles.headerSubtitle}>Smart Location Alerts</Text>
            </View>

            <ScrollView contentContainerStyle={localStyles.content} keyboardShouldPersistTaps="handled">

                {!isTracking ? (
                    <View style={{ gap: 24 }}>
                        {/* Your Location Card */}
                        <View style={[GLOBAL_STYLES.card, localStyles.locationCard]}>
                            <View style={localStyles.locationHeader}>
                                <Text style={localStyles.cardTitle}>Your Location</Text>
                                <TouchableOpacity onPress={refreshLocation} style={localStyles.refreshButton}>
                                    <Text style={{ fontSize: 18 }}>🔄</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={localStyles.locationRow}>
                                <View style={localStyles.iconContainer}>
                                    <Text>🏠</Text>
                                </View>
                                <Text style={localStyles.locationText} numberOfLines={2}>
                                    {currentAddress}
                                </Text>
                            </View>
                        </View>

                        {/* Destination Card */}
                        <View style={[GLOBAL_STYLES.card, { zIndex: 1000, elevation: 20 }]}>
                            <Text style={localStyles.cardTitle}>Where to?</Text>

                            <View style={localStyles.searchContainer}>
                                <TextInput
                                    style={localStyles.searchInput}
                                    placeholder="Search destination (e.g. Eiffel Tower)"
                                    value={query}
                                    onChangeText={setQuery}
                                    placeholderTextColor={COLORS.textSecondary}
                                />
                                {isSearching ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} style={localStyles.searchIcon} />
                                ) : query.length > 0 ? (
                                    <TouchableOpacity onPress={() => setQuery('')} style={localStyles.searchIcon}>
                                        <Text style={{ fontSize: 18, color: COLORS.textSecondary }}>✕</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            {/* Dropdown Suggestions */}
                            {searchResults.length > 0 && (
                                <View style={localStyles.dropdown}>
                                    <ScrollView
                                        style={localStyles.dropdownScroll}
                                        keyboardShouldPersistTaps="handled"
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {searchResults.map((item: SearchResult, index: number) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => selectDestination(item)}
                                                style={localStyles.dropdownItem}
                                            >
                                                <View style={localStyles.iconContainer}>
                                                    <Text>📍</Text>
                                                </View>
                                                <Text style={localStyles.resultText} numberOfLines={2}>
                                                    {item.display_name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {destination && !query && (
                                <View style={localStyles.selectedContainer}>
                                    <View>
                                        <Text style={localStyles.selectedLabel}>SELECTED DESTINATION</Text>
                                        <Text style={localStyles.selectedText} numberOfLines={1}>{destinationName}</Text>
                                    </View>
                                    <TouchableOpacity onPress={clearSelection}>
                                        <Text style={{ color: COLORS.accent, fontWeight: '700' }}>CHANGE</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Map Preview */}
                        {destination && (
                            <View style={[GLOBAL_STYLES.card, localStyles.mapCard]}>
                                <MapViewer
                                    destination={destination}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        )}

                        {/* Settings Card */}
                        <View style={GLOBAL_STYLES.card}>
                            <Text style={localStyles.cardTitle}>Alert Me When...</Text>
                            <View style={localStyles.settingRow}>
                                <View style={localStyles.settingItem}>
                                    <Text style={localStyles.settingLabel}>Distance (km)</Text>
                                    <TextInput
                                        style={localStyles.settingInput}
                                        value={distanceThreshold}
                                        onChangeText={setDistanceThreshold}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={localStyles.settingItem}>
                                    <Text style={localStyles.settingLabel}>Time (min)</Text>
                                    <TextInput
                                        style={localStyles.settingInput}
                                        value={timeThreshold}
                                        onChangeText={setTimeThreshold}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={localStyles.divider} />

                            <Text style={[localStyles.cardTitle, { fontSize: 16, marginTop: 8 }]}>Alarm Mode</Text>
                            <View style={localStyles.toggleRow}>
                                <TouchableOpacity
                                    style={[localStyles.toggleBtn, soundEnabled && localStyles.toggleBtnActive]}
                                    onPress={() => setSoundEnabled(!soundEnabled)}
                                >
                                    <Text style={[localStyles.toggleText, soundEnabled && localStyles.toggleTextActive]}>
                                        {soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[localStyles.toggleBtn, vibrationEnabled && localStyles.toggleBtnActive]}
                                    onPress={() => setVibrationEnabled(!vibrationEnabled)}
                                >
                                    <Text style={[localStyles.toggleText, vibrationEnabled && localStyles.toggleTextActive]}>
                                        {vibrationEnabled ? '📳 Vibe: ON' : '📳 Vibe: OFF'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[GLOBAL_STYLES.button, (!destination && { opacity: 0.5 })]}
                            onPress={startTracking}
                            disabled={!destination}
                        >
                            <Text style={GLOBAL_STYLES.buttonText}>START TRACKING</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ gap: 24 }}>
                        <View style={GLOBAL_STYLES.card}>
                            <View style={localStyles.trackingHeader}>
                                <View style={[localStyles.pulse, { marginRight: 10 }]} />
                                <Text style={localStyles.trackingTitle}>LIVE TRACKING</Text>
                            </View>

                            <Text style={localStyles.statusValue}>{statusMessage}</Text>
                            <Text style={localStyles.statusLabel}>REMAINING</Text>

                            <SimpleProgressBar progress={getProgress()} />

                            <View style={localStyles.metaRow}>
                                <Text style={localStyles.metaText}>To: {destinationName}</Text>
                                <Text style={localStyles.metaText}>{Math.round(getProgress() * 100)}% Trip Complete</Text>
                            </View>

                            <TouchableOpacity
                                style={[GLOBAL_STYLES.button, { backgroundColor: COLORS.accent, marginTop: 24 }]}
                                onPress={stopTracking}
                            >
                                <Text style={GLOBAL_STYLES.buttonText}>STOP TRACKING</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Live Map View */}
                        {destination && currentLocation && (
                            <View style={[GLOBAL_STYLES.card, localStyles.mapCard, { height: 400 }]}>
                                <MapViewer
                                    destination={destination}
                                    currentLocation={currentLocation.coords}
                                    isTracking={true}
                                />
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        zIndex: -1,
        // Web-only gradient
        ...Platform.select({
            web: {
                backgroundImage: 'linear-gradient(135deg, #6C5CE7 0%, #00CEC9 100%)',
            }
        })
    },
    header: {
        padding: 24,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight! + 24 : 32,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff', // White text on gradient
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        marginTop: 4,
    },
    content: {
        padding: 20,
        paddingBottom: 60,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 16,
    },
    // --- New Styles for Location Card ---
    locationCard: {
        marginBottom: 0, // Tighten spacing
    },
    locationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    refreshButton: {
        padding: 8,
        backgroundColor: COLORS.inputBg,
        borderRadius: 20,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 16,
        padding: 12,
    },
    locationText: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '600',
        flex: 1,
    },
    // ------------------------------------
    searchContainer: {
        position: 'relative',
        marginBottom: 8,
        zIndex: 2000,
    },
    searchInput: {
        backgroundColor: '#FFFFFF', // Solid white for visibility
        borderRadius: 16,
        padding: 16,
        paddingRight: 40,
        fontSize: 16,
        color: '#2D3436', // Dark text
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        ...SHADOWS,
        elevation: 5, // Higher elevation
    },
    searchIcon: {
        position: 'absolute',
        right: 16,
        top: 16,
        zIndex: 2010,
    },
    dropdown: {
        position: 'absolute',
        top: 68,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF', // Solid background for readability
        borderRadius: 16,
        zIndex: 9999, // Max z-index
        maxHeight: 250,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        ...SHADOWS,
        elevation: 100, // Elevation MUST be higher than the cards below it (which are 12)
        overflow: 'hidden',
    },
    dropdownScroll: {
        maxHeight: 250,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    iconContainer: {
        width: 36,
        height: 36,
        backgroundColor: '#F8F9FA',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        flexShrink: 0, // Prevent icon shrinking
    },
    resultText: {
        fontSize: 14, // Slightly smaller
        color: '#2D3436',
        flex: 1, // Take remaining space
        fontWeight: '500',
    },
    selectedContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        padding: 16,
        backgroundColor: COLORS.inputBg,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    selectedLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    selectedText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '700',
        maxWidth: 180,
    },
    settingRow: {
        flexDirection: 'row',
        gap: 16,
    },
    settingItem: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    settingInput: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 16,
        padding: 16,
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },
    mapCard: {
        height: 250,
        padding: 0,
        overflow: 'hidden',
        borderRadius: 24,
    },
    trackingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    trackingTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.success,
        letterSpacing: 1,
    },
    pulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.success,
    },
    statusValue: {
        fontSize: 36,
        fontWeight: '900',
        color: COLORS.text,
        textAlign: 'center',
        marginVertical: 4,
        letterSpacing: -1,
    },
    statusLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
        letterSpacing: 1,
    },
    progressContainer: {
        height: 12,
        backgroundColor: COLORS.inputBg,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 6,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    metaText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    // Toggle Styles
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    toggleBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: COLORS.inputBg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    toggleBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    toggleTextActive: {
        color: '#fff',
    },
});
