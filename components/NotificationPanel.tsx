import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/Config';

// ──────────────────────────────────────────────
// Types – backend-ready notification shape
// ──────────────────────────────────────────────
export interface Notification {
  id: number;
  title: string;
  message: string;
  /** ISO-8601 timestamp from the backend, or a human label for local stubs */
  created_at: string;
  /** Notification category – extend as needed */
  type: 'extreme' | 'warning' | 'info' | 'promo';
  /** Whether the user has seen this notification */
  is_read: boolean;
}

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
  /** Local / client-generated notifications (usage alerts, etc.) */
  localNotifications: Notification[];
  /** IDs the user has already marked as read (from UserContext) */
  readNotifIds: number[];
  /** Callback to persist read-state (into UserContext / AsyncStorage) */
  onMarkAllRead: (ids: number[]) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export default function NotificationPanel({
  visible,
  onClose,
  localNotifications,
  readNotifIds,
  onMarkAllRead,
}: NotificationPanelProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // ── Backend-ready state ──
  const [backendNotifs, setBackendNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch from backend (wired up, will 404 until endpoint exists) ──
  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/notifications/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (res.ok) {
        const data: Notification[] = await res.json();
        setBackendNotifs(data);
      }
      // If 404 or other error – silently fall back to local notifications
    } catch (_err) {
      // Backend not available yet – ignore silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Mark single notification as read (backend-ready) ──
  const markAsRead = useCallback(async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        fetch(`${API_BASE_URL}/api/notifications/${id}/read/`, {
          method: 'PATCH',
          headers: { Authorization: `Token ${token}` },
        }).catch(() => {});
      }
    } catch (_) {}

    if (!readNotifIds.includes(id)) {
      onMarkAllRead([...readNotifIds, id]);
    }
  }, [readNotifIds, onMarkAllRead]);

  // ── Merge backend + local, dedupe by id ──
  const allNotifications: Notification[] = [
    ...backendNotifs,
    ...localNotifications.filter(
      (ln) => !backendNotifs.some((bn) => bn.id === ln.id),
    ),
  ];

  const unreadCount = allNotifications.filter(
    (n) => !n.is_read && !readNotifIds.includes(n.id),
  ).length;

  const [shouldRender, setShouldRender] = useState(visible);

  // ── Slide animation ──
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      fetchNotifications();
      requestAnimationFrame(() => {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible]);

  // ── Hardware Back Button Support ──
  useEffect(() => {
    const onBackPress = () => {
      if (visible) {
        onClose();
        return true; // Prevent default behavior (exiting app/navigating back)
      }
      return false; // Default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  // ── Helpers ──
  const getNotifIcon = (type: string): keyof typeof MaterialIcons.glyphMap => {
    switch (type) {
      case 'extreme': return 'error';
      case 'warning': return 'warning';
      case 'promo': return 'local-offer';
      default: return 'info';
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'extreme': return '#dc2626';
      case 'warning': return '#ea580c';
      case 'promo': return '#8b5cf6';
      default: return '#3b82f6';
    }
  };

  const handleMarkAllRead = () => {
    onMarkAllRead(allNotifications.map((n) => n.id));
    AsyncStorage.getItem('userToken').then((token) => {
      if (token) {
        fetch(`${API_BASE_URL}/api/notifications/mark-all-read/`, {
          method: 'POST',
          headers: { Authorization: `Token ${token}` },
        }).catch(() => {});
      }
    });
  };

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[
        styles.fullScreenContainer,
        { transform: [{ translateX: slideAnim }] },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#101622" />

        {/* ── Dark Header (matches dashboard/history header) ── */}
        <View style={styles.headerBackground}>
          <View style={styles.topNav}>
            <TouchableOpacity onPress={onClose} style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Notifications</Text>
            </TouchableOpacity>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Notification List (on light background, white cards) ── */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              tintColor="#64748b"
              colors={['#3b82f6']}
            />
          }
        >
          {loading && allNotifications.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading…</Text>
            </View>
          )}

          {!loading && allNotifications.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="notifications-off" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )}

          {allNotifications.map((n) => {
            const isRead = n.is_read || readNotifIds.includes(n.id);
            return (
              <TouchableOpacity
                key={n.id}
                activeOpacity={0.85}
                onPress={() => markAsRead(n.id)}
                style={[styles.notifCard, isRead && styles.notifCardRead]}
              >
                <View style={styles.notifCardInner}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${getNotifColor(n.type)}18` },
                    ]}
                  >
                    <MaterialIcons
                      name={getNotifIcon(n.type)}
                      size={22}
                      color={getNotifColor(n.type)}
                    />
                  </View>
                  <View style={styles.notifTextContainer}>
                    <Text
                      style={[styles.notifTitle, isRead && styles.notifTitleRead]}
                      numberOfLines={1}
                    >
                      {n.title}
                    </Text>
                    <Text style={styles.notifMessage} numberOfLines={2}>
                      {n.message}
                    </Text>
                  </View>
                  {!isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifTime}>{n.created_at}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

// ──────────────────────────────────────────────
// Styles – matching app-wide theme
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e2e8f0', // Same as dashboard/history/settings background
    zIndex: 100,
    elevation: 100,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },

  // ── Dark Header (same style as dashboard & history) ──
  headerBackground: {
    backgroundColor: '#101622',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  markAllText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── List ──
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },

  // ── White Card (matches dashboard mainCard / settings settingsCard) ──
  notifCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  notifCardRead: {
    opacity: 0.5,
  },
  notifCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notifTextContainer: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3,
  },
  notifTitleRead: {
    fontWeight: '500',
    color: '#64748b',
  },
  notifMessage: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'right',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
});
