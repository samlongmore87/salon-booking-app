import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../constants/theme";

type Props = {
  title: string;
  note?: string;
  links?: { label: string; href: Href; replace?: boolean }[];
  actions?: { label: string; onPress: () => void }[];
};

export function Placeholder({ title, note = "Screen coming soon", links = [], actions = [] }: Props) {
  // Links and actions both become buttons; links just navigate when pressed
  const buttons = [
    ...links.map((l) => ({
      label: l.label,
      onPress: () => (l.replace ? router.replace(l.href) : router.push(l.href)),
    })),
    ...actions,
  ];

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>{note}</Text>
      <View style={styles.buttons}>
        {buttons.map((b) => (
          <Pressable
            key={b.label}
            onPress={b.onPress}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{b.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white, paddingTop: 80, paddingHorizontal: 24 },
  title: { fontFamily: fonts.bold, fontSize: 32, letterSpacing: -0.8, color: colors.black },
  note: { fontFamily: fonts.regular, fontSize: 16, color: colors.grey600, marginTop: 8 },
  buttons: { marginTop: 32, gap: 12 },
  button: {
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  buttonText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.white },
});