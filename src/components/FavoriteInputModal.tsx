import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { FavoriteLocation } from '../types';
import { LightColors, DarkColors } from '../theme';

interface FavoriteInputModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSave: (label: string, category: any) => void;
    defaultName: string;
    isDark: boolean;
}

const CATEGORIES = [
    { label: 'Home', icon: '🏠', value: 'Home' },
    { label: 'Work', icon: '💼', value: 'Work' },
    { label: 'Family', icon: '👨‍👩‍👧', value: 'Family' },
    { label: 'Friend', icon: '👤', value: 'Friend' },
    { label: 'Partner', icon: '❤️', value: 'Partner' }, // Users asked for multiple homes/friends, giving more options
    { label: 'Other', icon: '📍', value: 'Other' },
];

export const FavoriteInputModal = ({ isVisible, onClose, onSave, defaultName, isDark }: FavoriteInputModalProps) => {
    const [name, setName] = useState(defaultName);
    const [category, setCategory] = useState('Other');
    const colors = isDark ? DarkColors : LightColors;

    useEffect(() => {
        if (isVisible) {
            setName(defaultName || '');
            setCategory('Other');
        }
    }, [isVisible, defaultName]);

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : 'white' }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Save Location</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ fontSize: 24, color: colors.textSecondary }}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                            color: colors.text
                        }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="My Place"
                        placeholderTextColor={colors.textSecondary}
                        autoFocus
                    />

                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>Category</Text>
                    <View style={styles.categoryGrid}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.value}
                                style={[
                                    styles.categoryItem,
                                    { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                                    category === cat.value && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 }
                                ]}
                                onPress={() => setCategory(cat.value)}
                            >
                                <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                                <Text style={[
                                    styles.categoryText,
                                    { color: colors.text },
                                    category === cat.value && { color: colors.primary, fontWeight: '700' }
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.primary }]}
                        onPress={() => {
                            if (name.trim()) onSave(name, category);
                        }}
                    >
                        <Text style={styles.saveButtonText}>SAVE LOCATION</Text>
                    </TouchableOpacity>

                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryItem: {
        width: '30%',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        marginTop: 4,
    },
    saveButton: {
        marginTop: 32,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    }
});
