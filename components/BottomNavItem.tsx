import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const BottomNavItem = ({ iconName, label, isActive, onPress }: any) => {
  const { colors } = useTheme();
  const activeColor = '#3b82f6';
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <MaterialIcons name={iconName} size={26} color={isActive ? activeColor : colors.textMuted} />
      <Text style={[styles.navLabel, { color: isActive ? activeColor : colors.textMuted }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '25%', // Exactly 4 buttons to fill the row
  },
  navLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
