import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../constants/theme";
import { logOut, useAuth } from "../lib/auth-context";
import { PrimaryButton } from "./ui";

// Shown when someone is logged in but we couldn't load their profile (usually no connection)
export function ProfileError() {
  const { refreshProfile } = useAuth();
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    await refreshProfile();
    setRetrying(false);
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Couldn&apos;t load your account</Text>
      <Text style={styles.message}>Check your connection and try again.</Text>
      <View style={styles.actions}>
        <PrimaryButton title="Try again" onPress={retry} loading={retrying} />
        <Pressable
          onPress={logOut}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white, paddingTop: 80, paddingHorizontal: 24 },
  title: { fontFamily: fonts.bold, fontSize: 32, letterSpacing: -0.8, color: colors.black },
  message: { fontFamily: fonts.regular, fontSize: 16, color: colors.grey600, marginTop: 8 },
  actions: { marginTop: 32, gap: 12 },
  secondary: {
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.grey100,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.black },
});