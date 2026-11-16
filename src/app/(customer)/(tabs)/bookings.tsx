import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { FirebaseError } from "firebase/app";
import {
  collection, doc, getDocsFromServer, query, runTransaction, Timestamp, where,
} from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Loading, PrimaryButton } from "../../../components/ui";
import { colors, fonts } from "../../../constants/theme";
import { useAuth } from "../../../lib/auth-context";
import { db } from "../../../lib/firebase";
import { formatShortDate, formatTime, SLOT_MIN, slotId, slotsNeeded } from "../../../lib/schedule";

type Booking = {
  id: string;
  serviceId: string;
  serviceName: string;
  durationMin: number;
  price: number;
  stylistId: string;
  date: string;
  startMin: number;
  startTime: Timestamp;
  status: string;
};

// Free cancellation up to 2 hours before (the security rules enforce this too)
const CANCEL_CUTOFF_MS = 2 * 60 * 60 * 1000;
const NOT_UPCOMING = "not-upcoming";
// Show the refresh spinner for at least this long, so it doesn't just flicker
const MIN_REFRESH_MS = 600;
// setTimeout can't wait longer than about 24 days
const MAX_TIMEOUT_MS = 2_147_483_647;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Bookings() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets(); // space taken by the notch / status bar
  const [bookings, setBookings] = useState<Booking[] | null>(null); // null = still loading
  const [now, setNow] = useState(() => Date.now()); // the time the screen is drawn for
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(false);
    try {
      // Only this customer's bookings. We sort them on the phone, so Firestore needs no extra index.
      const snap = await getDocsFromServer(
        query(collection(db, "bookings"), where("customerId", "==", user.uid))
      );
      setBookings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) })));
      setNow(Date.now());
    } catch (e) {
      console.warn("Failed to load bookings", e);
      setError(true);
    }
  }, [user]);

  // Reload every time this tab is opened (e.g. straight after making a booking)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // While the tab is open, redraw at the exact moment the next booking passes its
  // 2-hour cancel cutoff or its start time. The timer stops when you leave the tab.
  useFocusEffect(
    useCallback(() => {
      if (!bookings) return;
      const next = bookings
        .filter((b) => b.status === "upcoming")
        .flatMap((b) => [b.startTime.toMillis() - CANCEL_CUTOFF_MS, b.startTime.toMillis()])
        .filter((t) => t > now)
        .reduce((soonest, t) => Math.min(soonest, t), Infinity);
      if (next === Infinity) return;

      const delay = Math.min(next - Date.now() + 500, MAX_TIMEOUT_MS); // +0.5s so we land just after it
      const timer = setTimeout(() => setNow(Date.now()), Math.max(delay, 0));
      return () => clearTimeout(timer);
    }, [bookings, now])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), wait(MIN_REFRESH_MS)]); // the list stays pulled down until both finish
    setRefreshing(false);
  };

  const retry = () => {
    setBookings(null);
    load();
  };

  const cancel = async (b: Booking) => {
    setCancellingId(b.id);
    try {
      // All or nothing: mark the booking cancelled AND free up its slots together
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", b.id);
        const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().status !== "upcoming") throw new Error(NOT_UPCOMING);

        tx.update(ref, { status: "cancelled_by_customer" });
        for (let i = 0; i < slotsNeeded(b.durationMin); i++) {
          tx.delete(doc(db, "slots", slotId(b.date, b.startMin + i * SLOT_MIN, b.stylistId)));
        }
      });
    } catch (e) {
      if (e instanceof Error && e.message === NOT_UPCOMING) {
        Alert.alert("Booking already changed", "This booking has already been cancelled or updated.");
      } else if (e instanceof FirebaseError && e.code === "permission-denied") {
        Alert.alert(
          "Too late to cancel",
          "Bookings can only be cancelled up to 2 hours before. Please contact the salon."
        );
      } else {
        console.warn("Failed to cancel booking", e);
        Alert.alert("Couldn't cancel", "Check your connection and try again.");
      }
    } finally {
      setCancellingId(null);
      load(); // always show the latest state
    }
  };

  const confirmCancel = (b: Booking) => {
    Alert.alert(
      "Cancel this booking?",
      `${b.serviceName} on ${formatShortDate(b.date)} at ${formatTime(b.startMin)}`,
      [
        { text: "Keep booking", style: "cancel" },
        { text: "Cancel booking", style: "destructive", onPress: () => cancel(b) },
      ]
    );
  };

  const bookAgain = (b: Booking) =>
    router.push({ pathname: "/book/date-time", params: { serviceId: b.serviceId } });

  if (error) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.title}>Couldn&apos;t load bookings</Text>
        <Text style={styles.message}>Check your connection and try again.</Text>
        <View style={styles.gap} />
        <PrimaryButton title="Try again" onPress={retry} />
      </View>
    );
  }

  if (!bookings) return <Loading />;

  const upcoming = bookings
    .filter((b) => b.status === "upcoming" && b.startTime.toMillis() > now)
    .sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis()); // soonest first
  const past = bookings
    .filter((b) => !upcoming.includes(b))
    .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis()); // most recent first

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Fixed title: the list scrolls (and refreshes) underneath it */}
      <View style={[styles.header, { paddingTop: Math.max(60 - insets.top, 16) }]}>
        <Text style={styles.title}>Bookings</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.screen}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.black} />
        }
      >
        <Text style={[styles.section, styles.firstSection]}>Upcoming</Text>
        {upcoming.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.message}>
              {bookings.length === 0 ? "You don't have any bookings yet." : "Nothing booked right now."}
            </Text>
            <PrimaryButton title="Book an appointment" onPress={() => router.push("/book/service")} />
          </View>
        ) : (
          <>
            {upcoming.map((b) => {
              const canCancel = b.startTime.toMillis() - now > CANCEL_CUTOFF_MS;
              const isCancelling = cancellingId === b.id;
              return (
                <View key={b.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.text}>
                      <Text style={styles.cardTitle}>{b.serviceName}</Text>
                      <Text style={styles.cardMeta}>
                        {formatShortDate(b.date)} · {formatTime(b.startMin)} · {b.durationMin} min
                      </Text>
                    </View>
                    <Text style={styles.cardTitle}>R{b.price}</Text>
                  </View>

                  {canCancel ? (
                    <Pressable
                      onPress={() => confirmCancel(b)}
                      disabled={cancellingId !== null}
                      style={({ pressed }) => [styles.cancel, (pressed || isCancelling) && styles.dim]}
                    >
                      {isCancelling ? (
                        <ActivityIndicator color={colors.black} />
                      ) : (
                        <Text style={styles.cancelText}>Cancel booking</Text>
                      )}
                    </Pressable>
                  ) : (
                    <Text style={styles.small}>
                      It&apos;s less than 2 hours away, so this can no longer be cancelled in the app.
                    </Text>
                  )}
                </View>
              );
            })}
            <Text style={styles.small}>Free cancellation up to 2 hours before.</Text>
          </>
        )}

        {past.length > 0 ? (
          <>
            <Text style={styles.section}>Past</Text>
            {past.map((b, i) => (
              <View key={b.id} style={[styles.pastRow, i < past.length - 1 && styles.divider]}>
                <View style={styles.text}>
                  <Text style={styles.pastTitle}>{b.serviceName}</Text>
                  <Text style={styles.pastMeta}>
                    {formatShortDate(b.date, false)} · {pastLabel(b)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => bookAgain(b)}
                  style={({ pressed }) => [styles.again, pressed && styles.dim]}
                >
                  <Ionicons name="refresh" size={16} color={colors.white} />
                  <Text style={styles.againText}>Book again</Text>
                </Pressable>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

// What to show next to the date for a past booking
function pastLabel(b: Booking) {
  if (b.status.startsWith("cancelled")) return "Cancelled";
  if (b.status === "no_show") return "Missed";
  return `R${b.price}`;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: 24, paddingBottom: 8, backgroundColor: colors.white },
  screen: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  errorScreen: { flex: 1, backgroundColor: colors.white, paddingTop: 60, paddingHorizontal: 24 },
  title: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: colors.black },
  message: { fontFamily: fonts.regular, fontSize: 16, color: colors.grey600 },
  gap: { height: 24 },
  section: {
    marginTop: 28, marginBottom: 12, fontFamily: fonts.bold, fontSize: 20, letterSpacing: -0.4, color: colors.black,
  },
  firstSection: { marginTop: 20 }, // + the header's 8px = the same 28px gap as the design
  empty: { gap: 16 },
  card: {
    marginBottom: 12, padding: 16, gap: 14, borderWidth: 1, borderColor: colors.grey300, borderRadius: 12,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  text: { flex: 1, gap: 4 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.black },
  cardMeta: { fontFamily: fonts.regular, fontSize: 15, color: colors.grey600 },
  cancel: {
    height: 44, borderRadius: 22, backgroundColor: colors.grey100, alignItems: "center", justifyContent: "center",
  },
  cancelText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.black },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.grey600 },
  pastRow: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.grey200 },
  pastTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  pastMeta: { fontFamily: fonts.regular, fontSize: 14, color: colors.grey600 },
  again: {
    height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.black,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  againText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },
  dim: { opacity: 0.7 },
});