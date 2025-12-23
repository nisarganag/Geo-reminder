import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView, Platform } from 'react-native';
import { FavoriteLocation, LocationCoords } from '../types';
import { LightColors, DarkColors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface FavoritesManagerProps {
    isVisible: boolean;
    onClose: () => void;
    favorites: FavoriteLocation[];
    onSelect: (fav: FavoriteLocation) => void;
    onDelete: (id: string) => void;
    isDark: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
    'Home': '🏠',
    'Work': '💼',
    'Family': '👨‍👩‍👧',
    'Friend': '👤',
    'Partner': '❤️',
    'Other': '📍'
};

export const FavoritesManager = ({ isVisible, onClose, favorites, onSelect, onDelete, isDark }: FavoritesManagerProps) => {
    const colors = isDark ? DarkColors : LightColors;

    // Group by Category
    const grouped = favorites.reduce((acc, fav) => {
        const cat = fav.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(fav);
        return acc;
    }, {} as Record<string, FavoriteLocation[]>);

    const orderedCategories = ['Home', 'Work', 'Partner', 'Family', 'Friend', 'Other'].filter(c => grouped[c]);

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: isDark ? '#1C1C1E' : 'white' }]}>
                    <Text style={[styles.title, { color: colors.text }]}>My Places</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '600' }}>Done</Text>
                    </TouchableOpacity>
                </View>

                {favorites.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 48, marginBottom: 16 }}>🌍</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>No saved places yet.</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                            Search for a place and tap the ❤️ icon to save it here.
                        </Text>
                    </View>
                )}

                <ScrollView style={styles.content}>
                    {orderedCategories.map(cat => (
                        <View key={cat} style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                {CATEGORY_ICONS[cat]}  {cat.toUpperCase()}
                            </Text>
                            <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : 'white' }]}>
                                {grouped[cat].map((fav, index, arr) => (
                                    <View key={fav.id}>
                                        <TouchableOpacity
                                            style={[styles.row]}
                                            onPress={() => {
                                                onSelect(fav);
                                                onClose();
                                            }}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.rowLabel, { color: colors.text }]}>{fav.label}</Text>
                                                <Text style={[styles.rowAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                                                    {fav.address}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    Alert.alert(
                                                        "Delete Location",
                                                        `Remove "${fav.label}"?`,
                                                        [
                                                            { text: "Cancel", style: "cancel" },
                                                            { text: "Delete", style: "destructive", onPress: () => onDelete(fav.id) }
                                                        ]
                                                    );
                                                }}
                                                style={{ padding: 8 }}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                        {index < arr.length - 1 && <View style={[styles.divider, { backgroundColor: isDark ? '#38383A' : '#E5E5EA' }]} />}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>

            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 16,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ccc',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 16,
    },
    card: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    rowLabel: {
        fontSize: 17,
        fontWeight: '500',
        marginBottom: 4,
    },
    rowAddress: {
        fontSize: 14,
    },
    divider: {
        height: 0.5,
        marginLeft: 16,
    }
});
