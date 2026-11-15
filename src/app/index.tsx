import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { db } from "../lib/firebase"; // if this file is inside (tabs), use "../../lib/firebase"

type Service = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

export default function Index() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "services"), orderBy("order"));
        const snap = await getDocs(q);
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Service, "id">) }))
          .filter((s) => s.active);
        setServices(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#000" />;
  if (error) return <Text style={styles.error}>Error: {error}</Text>;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Choose a service</Text>
      <FlatList
        data={services}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.durationMin} min</Text>
            </View>
            <Text style={styles.price}>R{item.price}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", paddingTop: 80, paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: "700", letterSpacing: -0.8, marginBottom: 16 },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#EEEEEE",
  },
  name: { fontSize: 17, fontWeight: "600" },
  meta: { fontSize: 14, color: "#5E5E5E", marginTop: 4 },
  price: { fontSize: 17, fontWeight: "600" },
  error: { padding: 24, paddingTop: 80, color: "#000" },
});