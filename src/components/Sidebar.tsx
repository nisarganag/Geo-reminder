import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal, SafeAreaView, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { LightColors, DarkColors } from '../theme';
import { UpdateService } from '../services/UpdateService';

interface SidebarProps {
    isVisible: boolean;
    onClose: () => void;
    isDark: boolean;
    toggleTheme: () => void;
    soundEnabled: boolean;
    toggleSound: () => void;
    vibrationEnabled: boolean;
    toggleVibration: () => void;
    customSoundName?: string | null;
    onPickSound?: () => void;
}

export default function Sidebar({
    isVisible, onClose, isDark, toggleTheme,
    soundEnabled, toggleSound, vibrationEnabled, toggleVibration,
    customSoundName, onPickSound
}: SidebarProps) {
    const colors = isDark ? DarkColors : LightColors;
    const [isChecking, setIsChecking] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleCheckUpdate = async () => {
        setIsChecking(true);
        const { hasUpdate, downloadUrl, latestVersion } = await UpdateService.checkForUpdate();
        setIsChecking(false);

        if (hasUpdate && downloadUrl) {
            Alert.alert(
                'Update Available',
                `A new version (${latestVersion}) is available. Download and install?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Download',
                        onPress: async () => {
                            try {
                                setIsDownloading(true);
                                await UpdateService.downloadAndInstall(downloadUrl);
                            } finally {
                                setIsDownloading(false);
                            }
                        }
                    }
                ]
            );
        } else {
            Alert.alert('Up to Date', 'You are on the latest version.');
        }
    };

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

                    {/* DOWNLOADING OVERLAY */}
                    {isDownloading && (
                        <View style={{ padding: 20, alignItems: 'center', backgroundColor: colors.inputBg, margin: 20, borderRadius: 16 }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={{ marginTop: 12, fontWeight: '700', color: colors.text }}>Downloading Update...</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Please wait, this may take a moment.</Text>
                        </View>
                    )}

                    <ScrollView style={[styles.content, isDownloading && { opacity: 0.5 }]} pointerEvents={isDownloading ? 'none' : 'auto'}>
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

                        {/* CUSTOM SOUND */}
                        <TouchableOpacity
                            style={[styles.row, { borderBottomWidth: 0, marginTop: 8 }]}
                            onPress={onPickSound}
                        >
                            <View>
                                <Text style={[styles.label, { color: colors.text }]}>Alarm Sound</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                    {customSoundName || 'Default Siren'}
                                </Text>
                            </View>
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>EDIT</Text>
                        </TouchableOpacity>

                        {/* ABOUT */}
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>ABOUT</Text>
                        <View style={styles.aboutContainer}>
                            <Text style={[styles.aboutText, { color: colors.text }]}>Geo Reminder</Text>
                            <Text style={[styles.aboutSub, { color: colors.textSecondary }]}>Version 1.0.2</Text>

                            <TouchableOpacity
                                style={[styles.updateBtn, { backgroundColor: colors.inputBg }]}
                                onPress={handleCheckUpdate}
                                disabled={isChecking}
                            >
                                {isChecking ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <Text style={{ color: colors.primary, fontWeight: '600' }}>Check for Updates</Text>
                                )}
                            </TouchableOpacity>

                            <Text style={[styles.aboutSub, { color: colors.textSecondary, marginTop: 16 }]}>
                                Made with ❤️ by Nisarga.
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
    },
    updateBtn: {
        marginTop: 12,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        alignSelf: 'flex-start'
    }
});
