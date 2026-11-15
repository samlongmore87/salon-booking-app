import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  collection, doc, getDocFromServer, runTransaction, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View,
} from "react-native";
import { ErrorText, PrimaryButton, SecondaryButton } from "../../../components/ui";
import { colors, fonts } from "../../../constants/theme";
import { useAuth } from "../../../lib/auth-context";
import { db } from "../../../lib/firebase";
import {
  formatLongDate, formatTime, parseDateKey, SLOT_MIN, slotId, slotsNeeded, STYLIST_ID,
} from "../../../lib/schedule";

type Service = { name: string; durationMin: number; price: number };

const SLOT_TAKEN = "slot-taken";

export default function Confirm() {
  const { serviceId, date, start } = useLocalSearchParams<{
    serviceId?: string;
    date?: string;
    start?: string;
  }>();
  const { user, profile } = useAuth();
  const startMin = Number(start);
  const paramsValid = !!serviceId && !!date && Number.isFinite(startMin);

  const [service, setService] = useState<Service | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotTaken, setSlotTaken] = useState(false);

  // Load the service fresh from the server, so the price we save matches the real price
  useEffect(() => {
    if (!serviceId) return;
    setLoadError(false);
    getDocFromServer(doc(db, "services", serviceId))
      .then((snap) => {
        if (snap.exists()) setService(snap.data() as Service);
        else setLoadError(true);
      })
      .catch((e) => {
        console.warn("Failed to load service", e);
        setLoadError(true);
      });
  }, [serviceId, attempt]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/book/service"));

  const onConfirm = async () => {
    if (!paramsValid || !service || !user || !profile || !serviceId || !date) return;
    setError(null);
    setSlotTaken(false);
    setSaving(true);

    const startDate = parseDateKey(date);
    startDate.setMinutes(startMin); // e.g. 600 minutes → 10:00
    const endDate = new Date(startDate.getTime() + service.durationMin * 60_000);

    const bookingRef = doc(collection(db, "bookings")); // new booking with an auto ID
    const slotRefs = Array.from({ length: slotsNeeded(service.durationMin) }, (_, i) =>
      doc(db, "slots", slotId(date, startMin + i * SLOT_MIN))
    );

    try {
      // A transaction = all or nothing. Either the booking AND all its slots save, or none do.
      await runTransaction(db, async (tx) => {
        // 1. Check every slot is still free (someone may have booked it in the last few seconds)
        for (const ref of slotRefs) {
          const snap = await tx.get(ref);
          if (snap.exists()) throw new Error(SLOT_TAKEN);
        }

        // 2. Save the booking
        tx.set(bookingRef, {
          customerId: user.uid,
          customerName: profile.name,
          customerPhone: profile.phone,
          serviceId,
          serviceName: service.name,
          durationMin: service.durationMin,
          price: service.price,
          stylistId: STYLIST_ID,
          date,
          startMin,
          startTime: Timestamp.fromDate(startDate),
          endTime: Timestamp.fromDate(endDate),
          status: "upcoming",
          note: note.trim(),
          createdBy: "customer",
          createdAt: serverTimestamp(),
        });

        // 3. Reserve every 30-minute slot it covers
        slotRefs.forEach((ref, i) => {
          tx.set(ref, {
            stylistId: STYLIST_ID,
            date,
            startMin: startMin + i * SLOT_MIN,
            bookingId: bookingRef.id,
            customerId: user.uid,
          });
        });
      });

      router.replace({ pathname: "/book/confirmed", params: { bookingId: bookingRef.id } });
    } catch (e) {
      if (e instanceof Error && e.message === SLOT_TAKEN) {
        setSlotTaken(true);
      } else {
        console.warn("Failed to create booking", e);
        setError("We couldn't confirm your booking. Check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!paramsValid) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>Please start your booking again.</Text>
        <View style={styles.gap} />
        <PrimaryButton title="Start again" onPress={() => router.replace("/book/service")} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Couldn&apos;t load your booking</Text>
        <Text style={styles.message}>Check your connection and try again.</Text>
        <View style={styles.gap} />
        <PrimaryButton title="Try again" onPress={() => setAttempt((n) => n + 1)} />
      </View>
    );
  }

  if (!service) {
    return <ActivityIndicator style={styles.loader} color={colors.black} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Pressable onPress={goBack} accessibilityLabel="Back" hitSlop={8} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </Pressable>

        <Text style={styles.step}>Step 3 of 3</Text>
        <Text style={styles.title}>Confirm your booking</Text>

        <View style={styles.card}>
          <Row label="Service" value={service.name} />
          <Row label="Date" value={formatLongDate(date!)} />
          <Row
            label="Time"
            value={`${formatTime(startMin)} – ${formatTime(startMin + service.durationMin)}`}
          />
          <Row label="Total" value={`R${service.price}`} strong last />
        </View>
        <Text style={styles.small}>Pay at the salon after your appointment.</Text>

        <View style={styles.noteBlock}>
          <Text style={styles.label}>
            Anything we should know? <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. I have very long hair"
            placeholderTextColor={colors.grey600}
            multiline
            maxLength={200}
            style={styles.note}
          />
        </View>

        <View style={styles.flex} />

        <View style={styles.bottom}>
          {slotTaken ? (
            <View style={styles.takenBox}>
              <Text style={styles.takenText}>
                Sorry, that time was just booked by someone else.
              </Text>
              <SecondaryButton title="Pick another time" onPress={goBack} />
            </View>
          ) : null}
          <ErrorText message={error} />
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={18} color={colors.grey600} />
            <Text style={styles.infoText}>Free cancellation up to 2 hours before.</Text>
          </View>
          <PrimaryButton
            title="Confirm booking"
            onPress={onConfirm}
            loading={saving}
            disabled={slotTaken}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({
  label, value, strong, last,
}: { label: string; value: string; strong?: boolean; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={[styles.rowLabel, strong && styles.rowStrong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  loader: { flex: 1, backgroundColor: colors.white },
  screen: {
    flexGrow: 1, backgroundColor: colors.white, paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40,
  },
  back: { width: 44, height: 44, justifyContent: "center", marginLeft: -4 },
  step: { marginTop: 4, fontFamily: fonts.medium, fontSize: 14, color: colors.grey600 },
  title: { fontFamily: fonts.bold, fontSize: 32, letterSpacing: -0.8, marginTop: 8, marginBottom: 8 },
  message: { fontFamily: fonts.regular, fontSize: 16, color: colors.grey600 },
  gap: { height: 24 },
  card: { marginTop: 16, borderRadius: 12, backgroundColor: colors.grey100, paddingHorizontal: 16 },
  row: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.grey300 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 16, color: colors.grey600 },
  rowValue: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  rowStrong: { fontFamily: fonts.bold, fontSize: 18, color: colors.black },
  small: { marginTop: 8, fontFamily: fonts.regular, fontSize: 13, color: colors.grey600 },
  noteBlock: { marginTop: 24, gap: 8 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  optional: { fontFamily: fonts.regular, color: colors.grey600 },
  note: {
    minHeight: 88,
    borderRadius: 8,
    backgroundColor: colors.grey100,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.black,
    textAlignVertical: "top",
  },
  bottom: { marginTop: 24, gap: 12 },
  takenBox: { gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.grey300 },
  takenText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.black },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});