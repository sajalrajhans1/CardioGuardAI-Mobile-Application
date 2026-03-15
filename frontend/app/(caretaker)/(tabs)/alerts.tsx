import React, { useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useCaretakerWs, AlertEntry } from "../../../caretaker/CaretakerWsContext";
import { GradientHeader }             from "../../../caretaker/components/GradientHeader";
import { Colors, Shadow, Radius, STATUS_CONFIG } from "../../../caretaker/theme";

// ─── Alert row ────────────────────────────────────────────────────────────────

const AlertRow: React.FC<{ item: AlertEntry; onRead: (id: string) => void }> = ({ item, onRead }) => {
  const cfg = STATUS_CONFIG[item.type];

  return (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.rowUnread, { borderLeftColor: cfg.color }]}
      activeOpacity={0.75}
      onPress={() => onRead(item.id)}
    >
      <View style={[styles.rowIcon, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.icon as any} size={18} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={styles.rowMessage}>{item.message}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.rowTime}>
          {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {" · "}
          {item.timestamp.toLocaleDateString([], { month: "short", day: "numeric" })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const { vitals, markAlertRead, clearAlerts } = useCaretakerWs();

  const unreadCount = vitals.alerts.filter((a) => !a.read).length;

  const handleClear = useCallback(() => {
    Alert.alert("Clear All Alerts", "Remove all alert history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear",  style: "destructive", onPress: clearAlerts },
    ]);
  }, [clearAlerts]);

  return (
    <View style={styles.root}>
      <GradientHeader
        title="Alerts"
        subtitle={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All caught up"}
        rightSlot={
          vitals.alerts.length > 0 ? (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Clear all</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {vitals.alerts.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="bell-off" size={32} color={Colors.gray300} />
          </View>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptySub}>
            Alerts will appear here when the patient's heart rate becomes abnormal.
          </Text>
        </View>
      ) : (
        <FlatList
          data={vitals.alerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertRow item={item} onRead={markAlertRead} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.gray100 },
  list: { padding: 16, paddingBottom: 100 },

  row: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             12,
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gray200,
    ...Shadow.soft,
  },
  rowUnread: {
    backgroundColor: Colors.blue50,
  },
  rowIcon: {
    width:         40,
    height:        40,
    borderRadius:  20,
    alignItems:    "center",
    justifyContent: "center",
  },
  rowTop: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    gap:            8,
  },
  rowMessage: {
    flex:       1,
    fontSize:   14,
    fontWeight: "600",
    color:      Colors.gray900,
    lineHeight: 20,
  },
  rowTime: {
    fontSize:  11,
    color:     Colors.gray400,
    marginTop: 3,
  },
  unreadDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Colors.blue600,
  },

  clearBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      Radius.full,
  },
  clearBtnText: {
    fontSize:   12,
    fontWeight: "600",
    color:      Colors.white,
  },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon:  {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.gray100,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.gray700, marginBottom: 8 },
  emptySub:   { fontSize: 14, color: Colors.gray400, textAlign: "center", lineHeight: 20 },
});