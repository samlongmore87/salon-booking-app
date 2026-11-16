import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDocFromServer } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { PrimaryButton, SecondaryButton } from "../../../components/ui";
import { colors, fonts } from "../../../constants/theme";
import { db } from "../../../lib/firebase";
import { formatLongDate, formatTime } from "../../../lib/schedule";

type Booking = {
  serviceName: string;
  durationMin: number;
  price: number;
  date: string;
  startMin: number;
};

export default function Confirmed() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [failed, setFailed] = useState(!bookingId);

  // Read the saved booking back from the server, so this screen only shows a booking that really exists
  useEffect(() => {
    if (!bookingId) return;
    getDocFromServer(doc(db, "bookings", bookingId))
      .then((snap) => {
        if (snap.exists()) setBooking(snap.data() as Booking);
        else setFailed(true);
      })
      .catch((e) => {
        console.warn("Failed to load booking", e);
        setFailed(true);
      });
  }, [bookingId]);

  const viewBookings = () => router.dismissTo("/bookings");
  const done = () => router.dismissTo("/home");

  if (failed) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>Check Bookings to see if your appointment was saved.</Text>
        <View style={styles.flex} />
        <PrimaryButton title="View my bookings" onPress={viewBookings} />
      </View>
    );
  }

  if (!booking) {
    return <ActivityIndicator style={styles.loader} color={colors.black} />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.tick}>
        <Ionicons name="checkmark" size={36} color={colors.white} />
      </View>

      <Text style={styles.title}>You&apos;re booked.</Text>
      <Text style={styles.subtitle}>
        {formatLongDate(booking.date)} at {formatTime(booking.startMin)}
      </Text>

      <View style={styles.list}>
        <Row label="Service" value={booking.serviceName} />
        <Row label="Duration" value={`${booking.durationMin} min`} />
        <Row label="Pay at salon" value={`R${booking.price}`} />
      </View>

      <View style={styles.flex} />

      <View style={styles.buttons}>
        <PrimaryButton title="View my bookings" onPress={viewBookings} />
        <SecondaryButton title="Done" onPress={done} />
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { flex: 1, backgroundColor: colors.white },
  screen: { flex: 1, backgroundColor: colors.white, paddingTop: 120, paddingHorizontal: 24, paddingBottom: 40 },
  tick: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { marginTop: 32, fontFamily: fonts.bold, fontSize: 36, letterSpacing: -1, color: colors.black },
  subtitle: { marginTop: 10, fontFamily: fonts.regular, fontSize: 18, lineHeight: 25, color: colors.grey600 },
  list: { marginTop: 32, borderTopWidth: 1, borderTopColor: colors.grey200 },
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200,
  },
  rowLabel: { fontFamily: fonts.regular, fontSize: 16, color: colors.grey600 },
  rowValue: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  buttons: { gap: 12 },
});