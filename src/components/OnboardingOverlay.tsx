import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HapticService } from '../services/HapticService';

interface OnboardingOverlayProps {
    onComplete: () => void;
}

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        icon: 'map',
        title: 'Welcome to Geo Reminder',
        desc: 'Never miss a stop again. Get woken up exactly when you arrive.',
        color: '#007AFF'
    },
    {
        icon: 'location',
        title: 'Location Access',
        desc: 'We need "Always Allow" location access to wake you up even when the app is in the background or your phone is locked.',
        color: '#34C759'
    },
    {
        icon: 'notifications',
        title: 'Notifications',
        desc: 'Enable notifications to hear the alarm and see alerts on your lock screen.',
        color: '#FF9500'
    }
];

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onComplete }) => {
    const [visible, setVisible] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        checkFirstLaunch();
    }, []);

    const checkFirstLaunch = async () => {
        try {
            const hasSeen = await AsyncStorage.getItem('@has_seen_onboarding_v2.1');
            if (hasSeen !== 'true') {
                setVisible(true);
            }
        } catch (e) {
            console.warn('Failed to check onboarding status');
        }
    };

    const handleNext = async () => {
        HapticService.light();
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            // Complete
            try {
                await AsyncStorage.setItem('@has_seen_onboarding_v2.1', 'true');
                setVisible(false);
                HapticService.success();
                onComplete();
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (!visible) return null;

    const slide = SLIDES[currentSlide];

    return (
        <Modal animationType="fade" transparent visible={visible}>
            <View style={styles.container}>
                <View style={styles.card}>
                    {/* Progress Dots */}
                    <View style={styles.pagination}>
                        {SLIDES.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    { backgroundColor: i === currentSlide ? slide.color : '#333' }
                                ]}
                            />
                        ))}
                    </View>

                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }]}>
                        <Ionicons name={slide.icon as any} size={64} color={slide.color} />
                    </View>

                    {/* Text */}
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.desc}>{slide.desc}</Text>

                    {/* Button */}
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: slide.color }]}
                        onPress={handleNext}
                    >
                        <Text style={styles.buttonText}>
                            {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: width * 0.85,
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    pagination: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 32,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    desc: {
        fontSize: 16,
        color: '#AAA',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    }
});
