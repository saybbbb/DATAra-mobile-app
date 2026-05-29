import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface DataInsightCardProps {
  prediction: {
    hours_remaining: number;
    depletion_time: string;
    runs_out_before_expiry: boolean;
    usage_pace: string;
    hours_to_expiry: number;
  };
  percentUsed: number;
  dailyAvgMb: number;
}

export function DataInsightCard({ prediction, percentUsed, dailyAvgMb }: DataInsightCardProps) {
  const { colors, isDarkMode } = useTheme();
  // Generate dynamic insight text based on ML prediction data
  const getInsightText = (): string => {
    const pace = prediction.usage_pace || 'normal';
    const hoursLeft = prediction.hours_remaining;
    const runsOut = prediction.runs_out_before_expiry;

    if (runsOut && hoursLeft < 24) {
      return `⚠️ Your current streaming pattern suggests you'll hit your daily cap by an hour, use only one app at a time to extend data!`;
    }

    if (runsOut && hoursLeft < 48) {
      return `Your data is depleting faster than expected. At the current rate of ${Math.round(dailyAvgMb)} MB/day, you'll run out in about ${Math.round(hoursLeft)} hours. Consider reducing video streaming quality.`;
    }

    if (pace === 'extreme') {
      return `🔴 Extreme usage detected! You've used ${percentUsed}% of your data. Your current pattern will exhaust your data well before the billing cycle ends. Reduce background app refreshing immediately.`;
    }

    if (pace === 'warning') {
      return `🟠 Your usage is above average. You've consumed ${percentUsed}% of your allocation. Consider switching to Wi-Fi for large downloads to preserve your mobile data.`;
    }

    if (percentUsed > 50) {
      return `You're halfway through your data plan at ${percentUsed}% usage. Your current pace of ${Math.round(dailyAvgMb)} MB/day is sustainable. Keep monitoring for any spikes.`;
    }

    return `🟢 Your data usage is normal and on track. Keep up the good work of monitoring your daily consumption!`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.15)' : 'rgba(0, 0, 0, 0.05)' }]}>
          <MaterialIcons name="info-outline" size={22} color={colors.textMuted} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Data Insight</Text>
      </View>
      <Text style={[styles.insightText, { color: colors.text }]}>{getInsightText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1f2e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  insightText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
  },
});
