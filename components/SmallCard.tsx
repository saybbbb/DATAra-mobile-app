import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const SmallCard = ({ title, children }: any) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.smallCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.smallCardTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  smallCard: {
    borderRadius: 20,
    padding: 16,
    width: '48%', // Ensure 2 cards sit next to each other
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  smallCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
