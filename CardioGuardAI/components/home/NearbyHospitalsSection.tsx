import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { Feather } from "@expo/vector-icons";
import { GOOGLE_MAPS_API_KEY } from "../../constants/maps";
import { colors, spacing, radius, shadows } from "../../constants/theme";

export default function NearbyHospitalsSection() {
  const [location, setLocation]       = useState<any>(null);
  const [hospitals, setHospitals]     = useState<any[]>([]);
  const [modalVisible, setModal]      = useState(false);
  const [loading, setLoading]         = useState(false);

  useEffect(() => { getLocation(); }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { Alert.alert("Location permission required"); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
  };

  const fetchHospitals = async () => {
    if (!location) return;
    try {
      setLoading(true);
      const url = `http://172.16.2.50:5000/api/patient/nearby-hospitals?lat=${location.latitude}&lng=${location.longitude}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data)) { Alert.alert("Unable to fetch hospitals"); setLoading(false); return; }
      setHospitals(data.map((item: any) => ({
        id: item.id, name: item.name, lat: item.lat, lng: item.lng, address: item.address,
      })));
      setModal(true);
      setLoading(false);
    } catch {
      Alert.alert("Network error");
      setLoading(false);
    }
  };

  const fetchPhone = async (placeId: string) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number&key=${GOOGLE_MAPS_API_KEY}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.result?.formatted_phone_number) {
        Linking.openURL(`tel:${data.result.formatted_phone_number}`);
      } else {
        Alert.alert("Phone number not available");
      }
    } catch { Alert.alert("Error fetching phone number"); }
  };

  const openMaps = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
  };

  if (!location) return null;

  return (
    <View style={styles.wrapper}>
      {/* Map preview card */}
      <View style={styles.mapCard}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={location} title="You" />
        </MapView>

        {/* Overlay gradient at bottom of map */}
        <View style={styles.mapOverlay}>
          <Feather name="map-pin" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.mapOverlayText}>Current Location</Text>
        </View>
      </View>

      {/* CTA button */}
      <TouchableOpacity
        style={styles.btn}
        onPress={fetchHospitals}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Feather name="search" size={16} color="#fff" />
            <Text style={styles.btnText}>Find Nearby Hospitals</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Hospital list modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.dragHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Nearby Hospitals</Text>
              <Text style={styles.modalSub}>{hospitals.length} facilities found</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModal(false)}>
              <Feather name="x" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md }}>
            {hospitals.map((h) => (
              <View key={h.id} style={styles.hospitalCard}>
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <View style={styles.hIconWrap}>
                    <Feather name="plus-circle" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hName}>{h.name}</Text>
                    <Text style={styles.hAddress}>{h.address}</Text>
                    <View style={styles.btnRow}>
                      <TouchableOpacity style={styles.callBtn} onPress={() => fetchPhone(h.id)}>
                        <Feather name="phone" size={12} color={colors.danger} />
                        <Text style={styles.callText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.dirBtn} onPress={() => openMaps(h.lat, h.lng)}>
                        <Feather name="navigation" size={12} color={colors.primary} />
                        <Text style={styles.dirText}>Directions</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },

  mapCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.sm,
    ...shadows.card,
    shadowOffset: { width: 0, height: 5 },
  },
  map: { height: 200 },
  mapOverlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,20,50,0.45)",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  mapOverlayText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "500" },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: radius.md,
    ...shadows.card,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background },
  dragHandle: {
    width: 44, height: 5,
    backgroundColor: colors.border,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 },
  modalSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 34, height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },

  hospitalCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: "hidden",
    ...shadows.card,
    shadowOffset: { width: 0, height: 4 },
  },
  cardAccent: { width: 4, backgroundColor: colors.primary },
  cardBody: { flex: 1, padding: spacing.md, flexDirection: "row", gap: 12 },
  hIconWrap: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  hName: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 3 },
  hAddress: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.sm },
  btnRow: { flexDirection: "row", gap: 8 },
  callBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  callText: { color: colors.danger, fontSize: 12, fontWeight: "600" },
  dirBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  dirText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
});