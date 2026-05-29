import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ProfileCardProps {
    label: string;
    value: string;
    onPress?: () => void;
}

export const ProfileCard = ({ label, value, onPress }: ProfileCardProps) => {
    const isEditable = !!onPress;
    const CardContainer = isEditable ? TouchableOpacity : View;
    const { colors } = useTheme();

    return (
        <CardContainer 
            style={[styles.card, { backgroundColor: colors.card }]} 
            onPress={onPress} 
            activeOpacity={isEditable ? 0.6 : 1}
        >
            <View style={styles.cardTextContainer}>
                <Text style={[styles.cardLabel, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.cardValue, { color: colors.textMuted }]}>{value}</Text>
            </View>
            {isEditable && (
                <MaterialIcons name="keyboard-arrow-right" size={32} color={colors.textMuted} />
            )}
        </CardContainer>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 20,
        marginBottom: 16,
        borderRadius: 0,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 14,
    },
});
