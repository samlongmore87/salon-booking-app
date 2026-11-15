import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  collection, doc, getDocFromServer, getDocsFromServer, query, where,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../../../components/ui";
import { colors, fonts } from "../../../constants/theme";
import { db } from "../../../lib/firebase";
import { availableStarts, bookableDays, dateKey, formatTime } from "../../../lib/schedule";

type Service = { name: string; durationMin: number; price: number };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DateTime() {
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const days = useMemo(() => bookableDays(), []);

  const [service, setService] = useState<Service | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [taken, setTaken] = useState<Set<number> | null>(null); // null = still loading
  const [time, setTime] = useState<number | null>(null);
  const [error, setError] = useState(!serviceId);
  const [attempt, setAttempt] = useState(0); // bumped by "Try again" to reload

  const day = days[dayIndex];

  // Coming back to this screen (e.g. after "Pick another time") → reload the free times
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false; // the first load is already handled by the effects below
        return;
      }
      setTaken(null);
      setTime(null);
      setAttempt((n) => n + 1);
    }, [])
  );

  // Load the chosen service (we need its length to know which times fit)
  useEffect(() => {
    if (!serviceId) return;
    getDocFromServer(doc(db, "services", serviceId))
      .then((snap) => {
        if (snap.exists()) setService(snap.data() as Service);
        else setError(true);
      })
      .catch((e) => {
        console.warn("Failed to load service", e);
        setError(true);
      });
  }, [serviceId, attempt]);

  // Load which 30-minute slots are already booked on the selected day
  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    getDocsFromServer(query(collection(db, "slots"), where("date", "==", dateKey(day))))
      .then((snap) => {
        if (!cancelled) setTaken(new Set(snap.docs.map((d) => d.data().startMin as number)));
      })
      .catch((e) => {
        console.warn("Failed to load booked slots", e);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true; // ignore a slow answer for a day the customer already moved away from
    };
  }, [day, attempt]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/book/service"));

  const pickDay = (i: number) => {
    if (i === dayIndex) return;
    setDayIndex(i);
    setTaken(null);
    setTime(null);
  };

  const retry = () => {
    if (!serviceId) {
      router.replace("/book/service"); // nothing to retry without a service, so start again
      return;
    }
    setError(false);
    setTaken(null);
    setAttempt((n) => n + 1);
  };

  const onContinue = () => {
    if (!serviceId || time === null || !day) return;
    router.push({
      pathname: "/book/confirm",
      params: { serviceId, date: dateKey(day), start: String(time) },
    });
  };

  if (error) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Couldn&apos;t load times</Text>
        <Text style={styles.message}>Check your connection and try again.</Text>
        <View style={styles.gap} />
        <PrimaryButton title="Try again" onPress={retry} />
      </View>
    );
  }

  const starts = service && taken && day ? availableStarts(day, service.durationMin, taken) : null;

  return (
    <View style={styles.screen}>
      <Pressable onPress={goBack} accessibilityLabel="Back" hitSlop={8} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={colors.black} />
      </Pressable>

      <Text style={styles.step}>Step 2 of 3</Text>
      <Text style={styles.title}>Pick a date & time</Text>
      {service ? (
        <Text style={styles.message}>
          {service.name} · {service.durationMin} min · R{service.price}
        </Text>
      ) : null}

      {/* Day strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayStrip}
        contentContainerStyle={styles.dayStripContent}
      >
        {days.map((d, i) => {
          const selected = i === dayIndex;
          return (
            <Pressable
              key={dateKey(d)}
              onPress={() => pickDay(i)}
              style={[styles.day, selected && styles.selected]}
            >
              <Text style={[styles.dayName, selected && styles.selectedText]}>
                {WEEKDAYS[d.getDay()]}
              </Text>
              <Text style={[styles.dayNumber, selected && styles.selectedText]}>{d.getDate()}</Text>
              <Text style={[styles.dayName, selected && styles.selectedText]}>
                {MONTHS[d.getMonth()]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Times */}
      <ScrollView style={styles.flex} contentContainerStyle={styles.times}>
        {starts === null ? (
          <ActivityIndicator style={styles.loader} color={colors.black} />
        ) : starts.length === 0 ? (
          <Text style={styles.message}>Fully booked on this day. Try another date.</Text>
        ) : (
          starts.map((m) => {
            const selected = m === time;
            return (
              <Pressable
                key={m}
                onPress={() => setTime(m)}
                style={[styles.time, selected && styles.selected]}
              >
                <Text style={[styles.timeText, selected && styles.selectedText]}>
                  {formatTime(m)}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton title="Continue" onPress={onContinue} disabled={time === null} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.white, paddingTop: 60, paddingHorizontal: 24 },
  back: { width: 44, height: 44, justifyContent: "center", marginLeft: -4 },
  step: { marginTop: 4, fontFamily: fonts.medium, fontSize: 14, color: colors.grey600 },
  title: { fontFamily: fonts.bold, fontSize: 32, letterSpacing: -0.8, marginTop: 8, marginBottom: 8 },
  message: { fontFamily: fonts.regular, fontSize: 16, color: colors.grey600 },
  gap: { height: 24 },
  dayStrip: { flexGrow: 0, marginTop: 24, marginHorizontal: -24 },
  dayStripContent: { paddingHorizontal: 24, gap: 8 },
  day: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.grey100,
    alignItems: "center",
    gap: 2,
  },
  dayName: { fontFamily: fonts.medium, fontSize: 13, color: colors.grey600 },
  dayNumber: { fontFamily: fonts.bold, fontSize: 20, color: colors.black },
  selected: { backgroundColor: colors.black },
  selectedText: { color: colors.white },
  times: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 24, paddingBottom: 24 },
  loader: { marginTop: 24, flex: 1 },
  time: {
    width: "31%",
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.grey100,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  bottom: { paddingTop: 12, paddingBottom: 40 },
});