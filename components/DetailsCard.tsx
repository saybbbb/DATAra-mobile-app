import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

// --- Types ---
// BarEntry is the shape of each data point.
// When your database is ready, replace the static array with fetched data
// matching this shape: { label: string; height: number; value: string }
export type BarEntry = {
    label: string;   // x-axis label, e.g. '0:00-1:00'
    height: number;  // bar height in pixels (scale to your max value)
    value: string;   // tooltip / accessibility value, e.g. '400mb'
};

export type TimeFilter = 'HOURS' | 'DAYS' | 'WEEKS';

type Props = {
    barData: BarEntry[];
    timeFilter: TimeFilter;
    onTimeFilterChange: (filter: TimeFilter) => void;
    yAxisLabels?: string[]; // optional — defaults to 800mb → 100mb
};

const DEFAULT_Y_LABELS = ['800mb', '700mb', '600mb', '500mb', '400mb', '300mb', '200mb', '100mb'];

export const DetailsCard = ({
    barData,
    timeFilter,
    onTimeFilterChange,
    yAxisLabels = DEFAULT_Y_LABELS,
}: Props) => {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>DETAILS:</Text>

            {/* Time filter tabs */}
            <View style={styles.tabSelector}>
                {(['HOURS', 'DAYS', 'WEEKS'] as TimeFilter[]).map((filter, i, arr) => (
                    <React.Fragment key={filter}>
                        <TouchableOpacity
                            style={[styles.tabButton, timeFilter === filter && styles.tabButtonActive]}
                            onPress={() => onTimeFilterChange(filter)}
                        >
                            <Text style={[styles.tabText, timeFilter === filter && styles.tabTextActive]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                        {i < arr.length - 1 && <Text style={styles.tabDivider}>|</Text>}
                    </React.Fragment>
                ))}
            </View>

            {/* Bar Chart */}
            <View style={styles.barChartContainer}>
                {/* Y Axis */}
                <View style={styles.yAxis}>
                    {yAxisLabels.map((label) => (
                        <Text key={label} style={styles.axisText}>{label}</Text>
                    ))}
                </View>

                {/* Bars */}
                <View style={styles.chartArea}>
                    {barData.map((item, index) => (
                        <View key={index} style={styles.barColumn}>
                            <View style={[styles.bar, { height: item.height }]} />
                            <Text style={styles.barLabel}>{item.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Scroll indicator */}
            <View style={styles.scrollbarTrack}>
                <View style={styles.scrollbarThumb} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 16,
    },
    tabSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    tabText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    tabButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    tabButtonActive: {
        borderColor: '#3b00ff',
        backgroundColor: '#eef2ff',
    },
    tabTextActive: {
        color: '#3b00ff',
    },
    tabDivider: {
        marginHorizontal: 10,
        color: '#cbd5e1',
    },
    barChartContainer: {
        flexDirection: 'row',
        height: 140,
        width: '100%',
        marginTop: 10,
    },
    yAxis: {
        justifyContent: 'space-between',
        paddingRight: 8,
        height: 120,
    },
    axisText: {
        fontSize: 8,
        color: '#94a3b8',
    },
    chartArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 120,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    barColumn: {
        alignItems: 'center',
        width: (width - 120) / 7,
    },
    bar: {
        width: '100%',
        backgroundColor: '#1e1b4b',
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
    },
    barLabel: {
        fontSize: 6,
        color: '#94a3b8',
        marginTop: 4,
    },
    scrollbarTrack: {
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        marginTop: 16,
        width: '80%',
        alignSelf: 'center',
    },
    scrollbarThumb: {
        width: '30%',
        height: '100%',
        backgroundColor: '#3ea8ff',
        borderRadius: 2,
        marginLeft: '0%',
    },
});
