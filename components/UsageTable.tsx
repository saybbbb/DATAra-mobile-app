import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface UsageRow {
  date: string;
  totalUsed: string;
  dailyAvg: string;
  duration: string;
  status: 'HEAVY' | 'MODERATE' | 'NORMAL';
}

interface UsageTableProps {
  data: UsageRow[];
  onUploadCSV?: () => void;
  onDownloadCSV?: () => void;
}

export function UsageTable({ data, onUploadCSV, onDownloadCSV }: UsageTableProps) {
  const [visibleCount, setVisibleCount] = useState(10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEAVY': return '#ef4444';
      case 'MODERATE': return '#f59e0b';
      case 'NORMAL': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  const visibleData = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;

  return (
    <View style={styles.container}>
      {/* Header with Upload/Download buttons */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>USAGE HISTORY</Text>
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.csvButton} onPress={onUploadCSV}>
            <MaterialIcons name="cloud-upload" size={14} color="white" />
            <Text style={styles.csvButtonText}>Upload CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.csvButton} onPress={onDownloadCSV}>
            <MaterialIcons name="cloud-download" size={14} color="white" />
            <Text style={styles.csvButtonText}>Download CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table Headers */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.dateCol]}>Date</Text>
        <Text style={[styles.tableHeaderCell, styles.dataCol]}>Total Used</Text>
        <Text style={[styles.tableHeaderCell, styles.avgCol]}>Daily Average</Text>
        <Text style={[styles.tableHeaderCell, styles.durCol]}>Duration</Text>
        <Text style={[styles.tableHeaderCell, styles.statusCol]}>Status</Text>
      </View>

      {/* Table Body */}
      <ScrollView nestedScrollEnabled={true} style={styles.tableBody}>
        {visibleData.map((row, index) => (
          <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
            <Text style={[styles.tableCell, styles.dateCol]}>{row.date}</Text>
            <Text style={[styles.tableCell, styles.dataCol]}>{row.totalUsed}</Text>
            <Text style={[styles.tableCell, styles.avgCol]}>{row.dailyAvg}</Text>
            <Text style={[styles.tableCell, styles.durCol]}>{row.duration}</Text>
            <Text style={[styles.statusBadge, styles.statusCol, { color: getStatusColor(row.status) }]}>
              {row.status}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* See More */}
      {hasMore && (
        <TouchableOpacity 
          style={styles.seeMoreBtn} 
          onPress={() => setVisibleCount(prev => prev + 10)}
        >
          <Text style={styles.seeMoreText}>See More</Text>
          <MaterialIcons name="keyboard-arrow-down" size={18} color="#3b82f6" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  csvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  csvButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateCol: { flex: 2.2, paddingRight: 4 },
  dataCol: { flex: 1.5 },
  avgCol: { flex: 1.5 },
  durCol: { flex: 1 },
  statusCol: { flex: 1.5, textAlign: 'right' },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 4,
  },
  seeMoreText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
});
