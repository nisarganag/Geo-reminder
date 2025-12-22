import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Platform, ScrollView, TouchableOpacity, SafeAreaView, StatusBar as RNStatusBar, ActivityIndicator, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import MapViewer from '../components/MapViewer';
import Sidebar from '../components/Sidebar';

import { LocationService } from '../services/LocationService';
import { RoutingService } from '../services/RoutingService';
import { NotificationService } from '../services/NotificationService';
import { LocationCoords, SearchResult, RouteInfo, ReminderSettings } from '../types';
import { LocationObject } from 'expo-location';
import { LightColors, DarkColors, getGlobalStyles, SHADOWS } from '../theme';
import { AlarmService } from '../services/AlarmService';

const STORAGE_KEY = 'GEO_REMINDER_SETTINGS';

// ------------------- UI Components -------------------

const SimpleProgressBar = ({ progress, color }: { progress: number, color: string }) => (
    <View style={localStyles.progressContainer}>
        <View style={[localStyles.progressBar, { backgroundColor: color, width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
    </View>
);

// ------------------- Main Component -------------------

export default function HomeScreen() {
    // Theme & Sidebar State
    const [isDark, setIsDark] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    // Derived Colors & Styles
    const colors = isDark ? DarkColors : LightColors;
    const globalStyles = getGlobalStyles(colors, isDark);
    const styles = getLocalStyles(colors);

    // Removed manual spin animation in favor of ActivityIndicator

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [destination, setDestination] = useState<LocationCoords | null>(null);
    const [destinationName, setDestinationName] = useState('');

    const [timeThreshold, setTimeThreshold] = useState('30');
    const [distanceThreshold, setDistanceThreshold] = useState('10');

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    // New Mode State
    const [travelMode, setTravelMode] = useState<'driving' | 'aerial'>('driving');

    const [isTracking, setIsTracking] = useState(false);
    const [isStartingTracking, setIsStartingTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<LocationObject | null>(null);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [statusMessage, setStatusMessage] = useState('Ready to start');
    const [initialDistance, setInitialDistance] = useState<number | null>(null);
    const [isAlarmActive, setIsAlarmActive] = useState(false);
    const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
    const [snoozeUntil, setSnoozeUntil] = useState<number>(0);

    const locationSubscription = useRef<any>(null);
    const lastNotificationTime = useRef<number>(0);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // API Throttling Refs
    const lastApiCallTime = useRef<number>(0);
    const distanceCorrectionRatio = useRef<number>(1.2); // Road distance is usually ~1.2x aerial
    const averageSpeed = useRef<number>(10); // m/s (default ~36km/h)

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
                const results = await RoutingService.searchLocation(query, currentLocation?.coords);
                setSearchResults(results);
            } catch (error) {
                console.log('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [query]);

    const refreshLocation = async () => {
        // Animation handled by UI state (currentAddress === 'Updating...')
        setCurrentAddress('Updating...');
        const loc = await LocationService.getCurrentLocation();
        if (loc) {
            setCurrentLocation(loc);
            let addr = await LocationService.reverseGeocode(loc.coords);
            if (!addr) {
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
                const settings: ReminderSettings & { isDark?: boolean, history?: SearchResult[] } = JSON.parse(saved);

                if (settings.isDark !== undefined) setIsDark(settings.isDark);
                // HISTORY: Load search history
                if (settings.history) setSearchHistory(settings.history);

                // FIXED: Do NOT restore 'isActive' automatically if it was an alarm state.
                // We only restore destination settings. User must explicitly 'Start' again.
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
            const settings = {
                destination,
                destinationName,
                distanceThreshold: parseFloat(distanceThreshold) * 1000,
                timeThreshold: parseFloat(timeThreshold),
                // isActive: isTracking, // DON'T SAVE TRACKING STATE. User wants fresh start on reload.
                soundEnabled,
                vibrationEnabled,
                isDark,
                history: searchHistory, // Save History
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.log('Failed to save settings', e);
        }
    };

    // Auto save theme when changed
    useEffect(() => { saveSettings(); }, [isDark, soundEnabled, vibrationEnabled]);

    const selectDestination = (item: SearchResult) => {
        setDestination({
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon)
        });
        setDestinationName(item.display_name);

        // Add to History (Deduped, Max 5)
        const newHistory = [item, ...searchHistory.filter(h => h.display_name !== item.display_name)].slice(0, 5);
        setSearchHistory(newHistory);

        setSearchResults([]);
        setQuery('');
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

        setIsStartingTracking(true);

        try {
            const startLoc = await LocationService.getCurrentLocation();
            if (!startLoc) {
                Alert.alert('Error', 'Could not get current location. Ensure GPS is on.');
                setIsStartingTracking(false);
                return;
            }

            const info = await RoutingService.getRouteDetails(startLoc.coords, destination, travelMode);
            if (info) {
                const distKm = info.distance / 1000;
                const timeMin = info.duration / 60;
                const threshDist = parseFloat(distanceThreshold);
                const threshTime = parseFloat(timeThreshold);

                if (distKm < threshDist) {
                    const msg = `You are ${distKm.toFixed(2)}km away, closer than your ${threshDist}km threshold.`;
                    proceedWithConfirmation(msg, startLoc, info);
                    return;
                } else if (timeMin < threshTime) {
                    const msg = `You are ${timeMin.toFixed(0)} mins away, less than your ${threshTime} min threshold.`;
                    proceedWithConfirmation(msg, startLoc, info);
                    return;
                }
                proceedToTrack(startLoc, info);
            } else {
                proceedToTrack(startLoc, null);
            }
        } catch (e) {
            console.log(e);
            setIsStartingTracking(false);
        }
    };

    const proceedWithConfirmation = (msg: string, startLoc: LocationObject, info: RouteInfo) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`${msg} Start anyway?`)) proceedToTrack(startLoc, info);
            else setIsStartingTracking(false);
        } else {
            Alert.alert('Already Within Range', msg, [
                { text: 'Cancel', style: 'cancel', onPress: () => setIsStartingTracking(false) },
                { text: 'Start Anyway', onPress: () => proceedToTrack(startLoc, info) }
            ]);
        }
    }

    const proceedToTrack = async (startLoc: LocationObject, initialInfo: RouteInfo | null) => {
        setIsStartingTracking(false);
        setIsTracking(true);
        setStatusMessage('Tracking active...');
        saveSettings();

        if (initialInfo) {
            setInitialDistance(initialInfo.distance);
            setRouteInfo(initialInfo);

            // Initialize Optimization Refs
            lastApiCallTime.current = Date.now();
            if (destination) {
                const aerial = RoutingService.calculateHaversine(startLoc.coords, destination);
                if (aerial.distance > 0) {
                    distanceCorrectionRatio.current = initialInfo.distance / aerial.distance;
                }
                if (initialInfo.duration > 0) {
                    averageSpeed.current = initialInfo.distance / initialInfo.duration;
                }
            }
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
        await AlarmService.stopAlarm();
        setIsAlarmActive(false);
        setIsTracking(false);
        setStatusMessage('Tracking stopped');
    };

    const stopAlarm = async () => {
        await AlarmService.stopAlarm();
        setIsAlarmActive(false);
        setIsTracking(false);
        setStatusMessage('Arrived');
        clearSelection(); // REQUESTED: Clear destination on stop
    };

    const snoozeAlarm = async (minutes: number) => {
        await AlarmService.stopAlarm();
        setIsAlarmActive(false);
        // Snooze logic: Don't check proximity until Now + Min
        setSnoozeUntil(Date.now() + (minutes * 60 * 1000));
        // Keep tracking active!
        setStatusMessage(`Snoozed for ${minutes} min`);
    };

    const checkProximity = async (userCoords: LocationCoords) => {
        if (!destination) return;
        if (Date.now() < snoozeUntil) return; // Respect Snooze

        let info: RouteInfo | null = null;
        const now = Date.now();
        const timeSinceLastCall = now - lastApiCallTime.current;
        const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 Minutes

        // OPTIMIZATION: Only call Google API if > 5 mins have passed OR we are in 'aerial' mode (which is free/local)
        // Otherwise, use local estimation to save $$$
        if (travelMode === 'driving' && timeSinceLastCall < REFRESH_INTERVAL && initialDistance !== null && routeInfo) {
            // --- LOCAL ESTIMATION ---
            const aerial = RoutingService.calculateHaversine(userCoords, destination);
            const estRoadDist = aerial.distance * distanceCorrectionRatio.current;
            const estDuration = estRoadDist / averageSpeed.current;

            // Preserve existing geometry so the line doesn't disappear
            info = {
                distance: estRoadDist,
                duration: estDuration,
                geometry: routeInfo.geometry
            };
        } else {
            // --- GOOGLE API REFRESH ---
            info = await RoutingService.getRouteDetails(userCoords, destination, travelMode);

            if (info && travelMode === 'driving') {
                lastApiCallTime.current = now;
                // Update ratios for better future estimation
                const aerial = RoutingService.calculateHaversine(userCoords, destination);
                if (aerial.distance > 100) { // Only update ratio if we aren't super close (avoid div/0 or weirdness)
                    distanceCorrectionRatio.current = info.distance / aerial.distance;
                }
                if (info.duration > 0) {
                    averageSpeed.current = info.distance / info.duration;
                }
            }
        }

        if (info) {
            setRouteInfo(info);
            // If initial was never set (e.g. route failed at start but works now), set it
            if (initialDistance === null) setInitialDistance(info.distance);

            const remainingKm = info.distance / 1000;
            const remainingMins = info.duration / 60;
            const targetKm = parseFloat(distanceThreshold);
            const targetMins = parseFloat(timeThreshold);

            // setStatusMessage(`${remainingKm.toFixed(1)} km  •  ${remainingMins.toFixed(0)} min`);

            const distTrigger = remainingKm <= targetKm;
            const timeTrigger = remainingMins <= targetMins;

            if (distTrigger || timeTrigger) {
                const timeDiff = now - lastNotificationTime.current;

                // If extremely close (e.g. < 500m or < 1 min), TRIGGER ALARM
                const isFinalApproach = remainingKm < 0.5 || remainingMins < 1;

                if (isFinalApproach) {
                    if (!isAlarmActive) {
                        setIsAlarmActive(true);
                        AlarmService.startAlarm(); // Loops sound/vibration
                    }
                } else {
                    // Standard Notification (Pre-alert)
                    // Don't spam notifications (limit to once every 5 mins)
                    if (timeDiff > 5 * 60 * 1000) {
                        const triggerType = distTrigger ? 'Distance' : 'Time';
                        const msg = `You are ${remainingKm.toFixed(1)}km and ${remainingMins.toFixed(0)}min away from ${destinationName}`;

                        await NotificationService.scheduleNotification(`Arriving Soon! (${triggerType})`, msg, soundEnabled);
                        lastNotificationTime.current = now;
                    }
                }
            }
        }
    };

    const getProgress = () => {
        if (!initialDistance || !routeInfo) return 0;
        if (initialDistance === 0) return 1;
        const p = (initialDistance - routeInfo.distance) / initialDistance;
        return Math.min(1, Math.max(0, p));
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            {/* ALARM OVERLAY */}
            {isAlarmActive && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FF3B30', zIndex: 10000, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                    <View style={{ marginBottom: 40, alignItems: 'center' }}>
                        <Ionicons name="notifications-circle" size={120} color="#FFF" />
                        <Text style={{ fontSize: 42, fontWeight: '900', color: '#FFF', textAlign: 'center', marginTop: 20 }}>ARRIVED!</Text>
                        <Text style={{ fontSize: 24, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 10 }}>{destinationName}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={stopAlarm}
                        style={{ backgroundColor: '#FFF', paddingVertical: 24, paddingHorizontal: 48, borderRadius: 40, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, marginBottom: 30 }}>
                        <Text style={{ fontSize: 24, fontWeight: '900', color: '#FF3B30', letterSpacing: 1 }}>STOP ALARM</Text>
                    </TouchableOpacity>

                    {/* SNOOZE BUTTONS */}
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '700', marginBottom: 16 }}>SNOOZE FOR...</Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        {[3, 5, 10].map(m => (
                            <TouchableOpacity
                                key={m}
                                onPress={() => snoozeAlarm(m)}
                                style={{ backgroundColor: 'rgba(255,255,255,0.3)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20 }}>
                                <Text style={{ color: '#FFF', fontWeight: '800' }}>{m}m</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <View>
                        <Text style={styles.headerTitle}>GEO REMINDER</Text>
                        <Text style={styles.headerSubtitle}>Smart Location Alerts</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsSidebarVisible(true)} style={styles.menuButton}>
                        <Text style={{ fontSize: 24, color: colors.text }}>☰</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Sidebar
                isVisible={isSidebarVisible}
                onClose={() => setIsSidebarVisible(false)}
                isDark={isDark}
                toggleTheme={() => setIsDark(!isDark)}
                soundEnabled={soundEnabled}
                toggleSound={() => setSoundEnabled(!soundEnabled)}
                vibrationEnabled={vibrationEnabled}
                toggleVibration={() => setVibrationEnabled(!vibrationEnabled)}
            />

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {!isTracking ? (
                    <View style={{ gap: 24 }}>
                        {/* Your Location Card */}
                        <View style={[globalStyles.card, styles.locationCard]}>
                            {/* Sheet Handle - Styled correctly for theme */}
                            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA' }} />
                            </View>

                            <View style={styles.locationHeader}>
                                <Text style={styles.cardTitle}>MY LOCATION</Text>
                                <TouchableOpacity onPress={refreshLocation} style={styles.refreshButton}>
                                    {currentAddress === 'Updating...' ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Ionicons name="refresh" size={24} color={colors.text} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            <View style={styles.locationRow}>
                                <View style={styles.iconContainer}>
                                    <Text>🏠</Text>
                                </View>
                                <Text style={styles.locationText} numberOfLines={2}>
                                    {currentAddress}
                                </Text>
                            </View>
                        </View>

                        {/* Destination Card */}
                        <View style={[globalStyles.card, { zIndex: 1000 }]}>
                            <Text style={styles.cardTitle}>Where to?</Text>
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search destination..."
                                    value={query}
                                    onChangeText={setQuery}
                                    placeholderTextColor={colors.textSecondary}
                                />
                                {isSearching ? (
                                    <ActivityIndicator size="small" color={colors.primary} style={styles.searchIcon} />
                                ) : query.length > 0 ? (
                                    <TouchableOpacity onPress={() => setQuery('')} style={styles.searchIcon}>
                                        <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            {/* Dropdown Suggestions */}
                            {searchResults.length > 0 && (
                                <View style={styles.dropdown}>
                                    <ScrollView
                                        style={styles.dropdownScroll}
                                        keyboardShouldPersistTaps="handled"
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {searchResults.map((item: SearchResult, index: number) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => selectDestination(item)}
                                                style={styles.dropdownItem}
                                            >
                                                <View style={styles.iconContainer}>
                                                    <Text>📍</Text>
                                                </View>
                                                <Text style={styles.resultText} numberOfLines={2}>
                                                    {item.display_name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* HISTORY DROPDOWN (When focused but no query) */}
                            {!query && searchHistory.length > 0 && !destination && (
                                <View style={{ marginTop: 16 }}>
                                    <Text style={styles.cardTitle}>RECENT</Text>
                                    <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                                        {searchHistory.map((item, index) => (
                                            <TouchableOpacity
                                                key={`hist-${index}`}
                                                onPress={() => selectDestination(item)}
                                                style={[styles.dropdownItem, { paddingLeft: 0, borderBottomWidth: 0.5 }]}
                                            >
                                                <View style={[styles.iconContainer, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                                                    <Text>🕒</Text>
                                                </View>
                                                <Text style={styles.resultText} numberOfLines={1}>{item.display_name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {destination && !query && (
                                <View style={styles.selectedContainer}>
                                    <View>
                                        <Text style={styles.selectedLabel}>SELECTED DESTINATION</Text>
                                        <Text style={styles.selectedText} numberOfLines={1}>{destinationName}</Text>
                                    </View>
                                    <TouchableOpacity onPress={clearSelection}>
                                        <Text style={{ color: colors.accent, fontWeight: '700' }}>CHANGE</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Map Preview */}
                        {destination && (
                            <View style={[globalStyles.card, styles.mapCard]}>
                                <MapViewer
                                    destination={destination}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        )}

                        {/* Settings Card */}
                        <View style={globalStyles.card}>
                            <Text style={styles.cardTitle}>Alert Me When...</Text>
                            <View style={styles.settingRow}>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>Distance (km)</Text>
                                    <TextInput
                                        style={styles.settingInput}
                                        value={distanceThreshold}
                                        onChangeText={setDistanceThreshold}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.settingItem}>
                                    <Text style={styles.settingLabel}>Time (min)</Text>
                                    <TextInput
                                        style={styles.settingInput}
                                        value={timeThreshold}
                                        onChangeText={setTimeThreshold}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <Text style={[styles.cardTitle, { fontSize: 16 }]}>Travel Mode</Text>
                            <View style={styles.toggleRow}>
                                <TouchableOpacity
                                    style={[styles.toggleBtn, travelMode === 'driving' && styles.toggleBtnActive]}
                                    onPress={() => setTravelMode('driving')}
                                >
                                    <Text style={[styles.toggleText, travelMode === 'driving' && styles.toggleTextActive]}>
                                        🚗 Car/Train (Road)
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.toggleBtn, travelMode === 'aerial' && styles.toggleBtnActive]}
                                    onPress={() => setTravelMode('aerial')}
                                >
                                    <Text style={[styles.toggleText, travelMode === 'aerial' && styles.toggleTextActive]}>
                                        ✈️ Flight
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* START Button */}
                        <TouchableOpacity
                            style={[globalStyles.button, (!destination && { opacity: 0.5 })]}
                            onPress={startTracking}
                            disabled={!destination || isStartingTracking}
                            activeOpacity={0.8}
                        >
                            {isStartingTracking ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={globalStyles.buttonText}>START TRACKING</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ gap: 24 }}>
                        <View style={globalStyles.card}>
                            <View style={styles.trackingHeader}>
                                <View style={[styles.pulse, { marginRight: 10 }]} />
                                <Text style={styles.trackingTitle}>LIVE TRACKING</Text>
                            </View>

                            <View style={{ alignItems: 'center', marginVertical: 10 }}>
                                {isTracking && routeInfo ? (
                                    <>
                                        <Text style={[styles.statusValue, { marginBottom: 0, lineHeight: 42 }]}>
                                            {(routeInfo.distance / 1000).toFixed(1)} <Text style={{ fontSize: 24, fontWeight: '600', color: colors.textSecondary }}>km</Text>
                                        </Text>
                                        <Text style={[styles.statusValue, { marginTop: 0, lineHeight: 42 }]}>
                                            {(routeInfo.duration / 60).toFixed(0)} <Text style={{ fontSize: 24, fontWeight: '600', color: colors.textSecondary }}>min</Text>
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={styles.statusValue}>{statusMessage}</Text>
                                )}
                            </View>
                            <Text style={styles.statusLabel}>REMAINING</Text>

                            <SimpleProgressBar progress={getProgress()} color={colors.primary} />

                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>To: {destinationName}</Text>
                                <Text style={styles.metaText}>{Math.round(getProgress() * 100)}% Trip Complete</Text>
                            </View>

                            <TouchableOpacity
                                style={[globalStyles.button, { backgroundColor: colors.accent, marginTop: 24 }]}
                                onPress={stopTracking}
                            >
                                <Text style={globalStyles.buttonText}>STOP TRACKING</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Live Map View */}
                        {destination && currentLocation && (
                            <View style={[globalStyles.card, styles.mapCard, { height: 400 }]}>
                                <MapViewer
                                    destination={destination}
                                    currentLocation={currentLocation.coords}
                                    isTracking={true}
                                    routeGeometry={routeInfo?.geometry}
                                />
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView >
    );
}

// ------------------- Helper Styles -------------------
const localStyles = StyleSheet.create({ // Needed for static items
    progressContainer: {
        height: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressBar: {
        height: '100%',
        borderRadius: 6,
    },
});

const getLocalStyles = (colors: typeof LightColors) => StyleSheet.create({
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight! + 10 : 20,
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    menuButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.inputBg,
        borderRadius: 22,
    },
    content: {
        padding: 20,
        paddingBottom: 60,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    locationCard: {
        marginBottom: 0,
    },
    locationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    refreshButton: {
        padding: 8,
        backgroundColor: colors.inputBg,
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderRadius: 16,
        padding: 12,
    },
    locationText: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '600',
        flex: 1,
    },
    searchContainer: {
        position: 'relative',
        marginBottom: 8,
        zIndex: 2000,
    },
    searchInput: {
        backgroundColor: colors.inputBg,
        borderRadius: 24,
        padding: 14,
        paddingHorizontal: 20,
        fontSize: 17,
        color: colors.text,
        borderWidth: 0,
        ...SHADOWS,
    },
    searchIcon: {
        position: 'absolute',
        right: 16,
        top: 16,
        zIndex: 2010,
    },
    dropdown: {
        position: 'absolute',
        top: 115, // Increased to clear input
        left: 0,
        right: 0,
        backgroundColor: colors.card,
        borderRadius: 16,
        zIndex: 9999,
        maxHeight: 250,
        borderWidth: 1,
        borderColor: colors.border,
        ...SHADOWS,
        elevation: 100,
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
        borderBottomColor: colors.border,
    },
    iconContainer: {
        width: 36,
        height: 36,
        backgroundColor: colors.inputBg,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    resultText: {
        fontSize: 14,
        color: colors.text,
        flex: 1,
        fontWeight: '500',
    },
    selectedContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        padding: 16,
        backgroundColor: colors.inputBg,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    selectedLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    selectedText: {
        fontSize: 16,
        color: colors.text,
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
        color: colors.textSecondary,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    settingInput: {
        backgroundColor: colors.inputBg,
        borderRadius: 16,
        padding: 16,
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
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
        color: colors.success,
        letterSpacing: 1,
    },
    pulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
    },
    statusValue: {
        fontSize: 36,
        fontWeight: '900',
        color: colors.text,
        textAlign: 'center',
        marginVertical: 4,
        letterSpacing: -1,
    },
    statusLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
        letterSpacing: 1,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginTop: 8,
        alignItems: 'flex-start',
    },
    metaText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
        flex: 1,
        flexWrap: 'wrap',
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 16,
    },
    toggleRow: {
        flexDirection: 'row',
        marginTop: 12,
        backgroundColor: colors.inputBg,
        padding: 4,
        borderRadius: 12,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleBtnActive: {
        backgroundColor: colors.card,
        ...SHADOWS,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    toggleTextActive: {
        color: colors.text,
        fontWeight: '700',
    },
});
