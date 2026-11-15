import { router } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../../constants/theme";
import { db } from "../../../lib/firebase";

type Service = { id: string; name: string; durationMin: number; price: number; active: boolean };

export default function ChooseService() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // useCallback lets us reuse the same function for the first load AND the retry button
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const snap = await getDocs(query(collection(db, "services"), orderBy("order")));
      setServices(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Service, "id">) }))
          .filter((s) => s.active)
      );
    } catch (e) {
      console.warn("Failed to load services", e); // technical detail for us, not the customer
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.black} />;

  if (error) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Couldn&apos;t load services</Text>
        <Text style={styles.message}>Check your connection and try again.</Text>
        <Pressable style={styles.button} onPress={load}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.step}>Step 1 of 3</Text>
      <Text style={styles.title}>Choose a service</Text>
      <FlatList
        data={services}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: "/book/date-time", params: { serviceId: item.id } })}
          >
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.durationMin} min</Text>
            </View>
            <Text style={styles.price}>R{item.price}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white, paddingTop: 72, paddingHorizontal: 24 },
  step: { fontFamily: fonts.medium, fontSize: 14, color: colors.grey600 },
  title: { fontFamily: fonts.bold, fontSize: 32, letterSpacing: -0.8, marginTop: 8, marginBottom: 12 },
  message: { fontFamily: fonts.regular, fontSize: 16, color: colors.grey600 },
  button: {
    marginTop: 24, height: 56, borderRadius: 8, backgroundColor: colors.black,
    alignItems: "center", justifyContent: "center",
  },
  buttonText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.white },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.grey200,
  },
  name: { fontFamily: fonts.semibold, fontSize: 17 },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.grey600, marginTop: 4 },
  price: { fontFamily: fonts.semibold, fontSize: 17 },
});