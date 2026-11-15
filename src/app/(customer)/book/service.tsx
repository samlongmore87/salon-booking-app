import { router } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../../constants/theme";
import { db } from "../../../lib/firebase";

type Service = { id: string; name: string; durationMin: number; price: number; active: boolean };

export default function ChooseService() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "services"), orderBy("order")));
        setServices(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Service, "id">) }))
            .filter((s) => s.active)
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.black} />;
  if (error) return <Text style={styles.error}>Error: {error}</Text>;

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
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.grey200,
  },
  name: { fontFamily: fonts.semibold, fontSize: 17 },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.grey600, marginTop: 4 },
  price: { fontFamily: fonts.semibold, fontSize: 17 },
  error: { fontFamily: fonts.regular, padding: 24, paddingTop: 80 },
});