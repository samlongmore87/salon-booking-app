import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { callSalon, SALON } from "../../../constants/salon";
import { colors, fonts } from "../../../constants/theme";
import { useAuth } from "../../../lib/auth-context";
import { type Booking, fetchMyBookings, isUpcoming } from "../../../lib/bookings";
import { initials } from "../../../lib/format";
import { formatTime, openingHoursSummary, parseDateKey, SHORT_DAYS } from "../../../lib/schedule";

// setTimeout can't wait longer than about 24 days
const MAX_TIMEOUT_MS = 2_147_483_647;

export default function Home() {
  const { user, profile } = useAuth();
  const [upcoming, setUpcoming] = useState<Booking[] | null>(null); // soonest first; null = loading
  const [now, setNow] = useState(() => Date.now()); // the time the screen is drawn for
  const [error, setError] = useState(false);

  // Only the newest load may update the screen (stops a slow, older load overwriting a newer one)
  const latestRequest = useRef(0);

  const loadNext = useCallback(async () => {
    if (!user) return;
    const requestId = ++latestRequest.current;
    setError(false);
    try {
      const all = await fetchMyBookings(user.uid);
      if (requestId !== latestRequest.current) return; // a newer load has started; ignore this one
      const fetchedAt = Date.now(); // read the time AFTER the fetch, so a slow load can't show a started booking
      setUpcoming(
        all
          .filter((b) => isUpcoming(b, fetchedAt))
          .sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis())
      );
      setNow(fetchedAt);
    } catch (e) {
      if (requestId !== latestRequest.current) return;
      console.warn("Failed to load next appointment", e);
      setError(true);
    }
  }, [user]);

  // Reload every time Home is opened (e.g. after booking or cancelling)
  useFocusEffect(
    useCallback(() => {
      loadNext();
    }, [loadNext])
  );

  // undefined = still loading, null = nothing booked
  const next =
    upcoming === null ? undefined : (upcoming.find((b) => b.startTime.toMillis() > now) ?? null);

  // While Home is open, move on to the following appointment the moment this one starts.
  // The timer stops when you leave the tab.
  useFocusEffect(
    useCallback(() => {
      if (!next) return;
      const delay = Math.min(next.startTime.toMillis() - Date.now() + 500, MAX_TIMEOUT_MS); // +0.5s: land just after
      const timer = setTimeout(() => setNow(Date.now()), Math.max(delay, 0));
      return () => clearTimeout(timer);
    }, [next])
  );

  const name = profile?.name ?? "";
  const firstName = name.split(" ")[0] || "there";

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>{SALON.name}</Text>
        <Pressable
          onPress={() => router.navigate("/account")}
          accessibilityRole="button"
          accessibilityLabel="Your account"
          style={({ pressed }) => [styles.avatar, pressed && styles.dim]}
        >
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Hi {firstName}</Text>

      <Pressable
        onPress={() => router.push("/book/service")}
        accessibilityRole="button"
        style={({ pressed }) => [styles.bookCard, pressed && styles.dim]}
      >
        <Text style={styles.bookTitle}>Ready for your next visit?</Text>
        <Text style={styles.bookText}>Pick a service and a time in under a minute.</Text>
        <View style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book now</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.black} />
        </View>
      </Pressable>

      <Text style={styles.section}>Your next appointment</Text>
      {error ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Couldn&apos;t load your next appointment.</Text>
          <Pressable onPress={loadNext} hitSlop={8} accessibilityRole="button">
            <Text style={styles.link}>Try again</Text>
          </Pressable>
        </View>
      ) : next === undefined ? (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator color={colors.black} />
        </View>
      ) : next === null ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Nothing booked yet. Your next appointment will show here.</Text>
        </View>
      ) : (
        <NextAppointment booking={next} />
      )}

      <Text style={[styles.section, styles.sectionTight]}>The salon</Text>
      <View style={[styles.salonRow, styles.divider]}>
        <Ionicons name="location-outline" size={22} color={colors.black} />
        <Text style={styles.salonText}>{SALON.address}</Text>
      </View>
      <View style={[styles.salonRow, styles.divider]}>
        <Ionicons name="time-outline" size={22} color={colors.black} />
        <Text style={styles.salonText}>{openingHoursSummary()}</Text>
      </View>
      <Pressable
        onPress={callSalon}
        accessibilityRole="button"
        style={({ pressed }) => [styles.salonRow, pressed && styles.dim]}
      >
        <Ionicons name="call-outline" size={22} color={colors.black} />
        <Text style={[styles.salonText, styles.medium]}>Call the salon</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.black} />
      </Pressable>
    </ScrollView>
  );
}

function NextAppointment({ booking }: { booking: Booking }) {
  const day = parseDateKey(booking.date);
  return (
    <Pressable
      onPress={() => router.navigate("/bookings")}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, styles.nextCard, pressed && styles.dim]}
    >
      <View style={styles.dateTile}>
        <Text style={styles.tileDay}>{SHORT_DAYS[day.getDay()].toUpperCase()}</Text>
        <Text style={styles.tileDate}>{day.getDate()}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.cardTitle}>{booking.serviceName}</Text>
        <Text style={styles.cardMeta}>
          {formatTime(booking.startMin)} · {booking.durationMin} min · R{booking.price}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.black} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  screen: { flexGrow: 1, paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.4, color: colors.black },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.grey100,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black },
  title: {
    marginTop: 20, fontFamily: fonts.bold, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: colors.black,
  },
  bookCard: { marginTop: 20, borderRadius: 16, backgroundColor: colors.black, padding: 20, gap: 6 },
  bookTitle: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 29, letterSpacing: -0.5, color: colors.white },
  bookText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.grey400 },
  bookButton: {
    marginTop: 10, alignSelf: "flex-start", height: 48, paddingHorizontal: 20, borderRadius: 24,
    backgroundColor: colors.white, flexDirection: "row", alignItems: "center", gap: 8,
  },
  bookButtonText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  section: {
    marginTop: 28, marginBottom: 12, fontFamily: fonts.bold, fontSize: 20, letterSpacing: -0.4, color: colors.black,
  },
  sectionTight: { marginBottom: 4 },
  card: { borderWidth: 1, borderColor: colors.grey300, borderRadius: 12, padding: 16, gap: 8 },
  loadingCard: { minHeight: 90, alignItems: "center", justifyContent: "center" },
  nextCard: { padding: 14, flexDirection: "row", alignItems: "center", gap: 14 },
  dateTile: {
    width: 56, height: 60, borderRadius: 10, backgroundColor: colors.grey100,
    alignItems: "center", justifyContent: "center", gap: 2,
  },
  tileDay: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.7, color: colors.grey600 },
  tileDate: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 24, color: colors.black },
  text: { flex: 1, gap: 4 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.black },
  cardMeta: { fontFamily: fonts.regular, fontSize: 14, color: colors.grey600 },
  muted: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.grey600 },
  link: { fontFamily: fonts.semibold, fontSize: 15, color: colors.black, textDecorationLine: "underline" },
  salonRow: { minHeight: 52, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.grey200 },
  salonText: { flex: 1, fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: colors.black },
  medium: { fontFamily: fonts.medium },
  dim: { opacity: 0.7 },
});