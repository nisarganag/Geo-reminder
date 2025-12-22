import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticService } from '../services/HapticService';

interface ArrivalOverlayProps {
    isVisible: boolean;
    onStop: () => void;
    onSnooze: (minutes: number) => void;
    destinationName: string;
}

const { width } = Dimensions.get('window');

export const ArrivalOverlay: React.FC<ArrivalOverlayProps> = ({ isVisible, onStop, onSnooze, destinationName }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isVisible) {
            // Start pulsing animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Trigger strong haptic feedback
            HapticService.alarm();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <Ionicons name="location" size={80} color="#FF3B30" />
                </Animated.View>

                <Text style={styles.title}>YOU HAVE ARRIVED</Text>

                <Text style={styles.destination} numberOfLines={2}>
                    {destinationName}
                </Text>

                <Text style={styles.subtext}>
                    You are within range of your destination.
                </Text>

                <TouchableOpacity
                    style={styles.stopButton}
                    onPress={() => {
                        HapticService.medium();
                        onStop();
                    }}
                >
                    <Text style={styles.stopButtonText}>STOP ALARM</Text>
                </TouchableOpacity>

                <Text style={styles.snoozeLabel}>SNOOZE FOR...</Text>
                <View style={styles.snoozeRow}>
                    {[3, 5, 10].map(m => (
                        <TouchableOpacity
                            key={m}
                            onPress={() => {
                                HapticService.light();
                                onSnooze(m);
                            }}
                            style={styles.snoozeButton}
                        >
                            <Text style={styles.snoozeText}>{m}m</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20000,
    },
    content: {
        width: width * 0.85,
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconContainer: {
        marginBottom: 20,
        shadowColor: "#FF3B30",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: 1,
    },
    destination: {
        fontSize: 20,
        color: '#FF3B30',
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: '600',
    },
    subtext: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 40,
    },
    stopButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
    },
    stopButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    snoozeLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '700',
        marginBottom: 16,
        marginTop: 30,
        fontSize: 14,
        letterSpacing: 1,
    },
    snoozeRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        justifyContent: 'center',
    },
    snoozeButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    snoozeText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
    }
});
