import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const StatItem = ({ icon, iconColor, iconBgColor, label, value, subValue }: any) => {
  const { colors } = useTheme();
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIconContainer, { backgroundColor: iconBgColor }]}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statSubValue, { color: colors.textMuted }]}>{subValue}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  statSubValue: {
    fontSize: 8,
    fontWeight: '600',
  },
});
