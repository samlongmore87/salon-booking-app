import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../constants/theme";

type Props = {
  title: string;
  note?: string;
  links?: { label: string; href: Href; replace?: boolean }[];
};

export function Placeholder({ title, note = "Screen coming soon", links = [] }: Props) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>{note}</Text>
      <View style={styles.links}>
        {links.map((l) => (
          <Link key={l.label} href={l.href} replace={l.replace} asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>{l.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white, paddingTop: 80, paddingHorizontal: 24 },
  title: { fontFamily: fonts.bold, fontSize: 32, letterSpacing: -0.8, color: colors.black },
  note: { fontFamily: fonts.regular, fontSize: 16, color: colors.grey600, marginTop: 8 },
  links: { marginTop: 32, gap: 12 },
  button: {
    height: 56, borderRadius: 8, backgroundColor: colors.black,
    alignItems: "center", justifyContent: "center",
  },
  buttonText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.white },
});