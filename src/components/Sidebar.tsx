import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal, SafeAreaView, ScrollView, Platform } from 'react-native';
import { LightColors, DarkColors } from '../theme';

interface SidebarProps {
    isVisible: boolean;
    onClose: () => void;
    isDark: boolean;
    toggleTheme: () => void;
    soundEnabled: boolean;
    toggleSound: () => void;
    vibrationEnabled: boolean;
    toggleVibration: () => void;
}

export default function Sidebar({
    isVisible, onClose, isDark, toggleTheme,
    soundEnabled, toggleSound, vibrationEnabled, toggleVibration
}: SidebarProps) {
    const colors = isDark ? DarkColors : LightColors;

    return (
        <Modal visible={isVisible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <SafeAreaView style={[styles.sidebar, { backgroundColor: colors.card }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={{ fontSize: 20, color: colors.textSecondary }}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* APPEARANCE */}
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
                        <View style={[styles.row, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: '#767577', true: colors.primary }}
                            />
                        </View>

                        {/* ALERTS */}
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>ALERTS</Text>
                        <View style={[styles.row, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Sound</Text>
                            <Switch
                                value={soundEnabled}
                                onValueChange={toggleSound}
                                trackColor={{ false: '#767577', true: colors.primary }}
                            />
                        </View>
                        <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Vibration</Text>
                            <Switch
                                value={vibrationEnabled}
                                onValueChange={toggleVibration}
                                trackColor={{ false: '#767577', true: colors.primary }}
                            />
                        </View>

                        {/* ABOUT */}
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>ABOUT</Text>
                        <View style={styles.aboutContainer}>
                            <Text style={[styles.aboutText, { color: colors.text }]}>Geo Reminder</Text>
                            <Text style={[styles.aboutSub, { color: colors.textSecondary }]}>Version 1.0.2</Text>
                            <Text style={[styles.aboutSub, { color: colors.textSecondary, marginTop: 8 }]}>
                                Made with ❤️ for perfect arrivals.
                            </Text>
                        </View>

                    </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
    },
    backdrop: {
        flex: 1,
    },
    sidebar: {
        width: '80%',
        maxWidth: 320,
        height: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    closeBtn: {
        padding: 8,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
    },
    aboutContainer: {
        marginTop: 8,
    },
    aboutText: {
        fontSize: 16,
        fontWeight: '700',
    },
    aboutSub: {
        fontSize: 14,
    }
});
