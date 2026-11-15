import { Link } from "expo-router";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { ErrorText, PrimaryButton, TextField } from "../../components/ui";
import { colors, fonts } from "../../constants/theme";
import { authErrorMessage } from "../../lib/auth-errors";
import { auth } from "../../lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // No navigation needed: the (auth) layout redirects once the profile loads
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Enter your email above, then tap Forgot password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Check your email",
        "If an account exists for that email, we've sent a link to reset your password."
      );
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.brandName}>Studio Mono</Text>
        </View>

        <Text style={styles.title}>Book your next appointment in seconds.</Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
          />
          <Pressable onPress={onForgotPassword} style={styles.forgot} hitSlop={8}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>

          <ErrorText message={error} />
          <PrimaryButton title="Log in" onPress={onLogin} loading={loading} />
        </View>

        <View style={styles.flex} />

        <View style={styles.footer}>
          <Text style={styles.muted}>New here?</Text>
          <Link href="/sign-up" style={styles.link}>
            Create account
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  screen: { flexGrow: 1, paddingTop: 80, paddingHorizontal: 24, paddingBottom: 40 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontFamily: fonts.bold, fontSize: 18, color: colors.white },
  brandName: { fontFamily: fonts.bold, fontSize: 20, letterSpacing: -0.4 },
  title: { marginTop: 36, fontFamily: fonts.bold, fontSize: 34, lineHeight: 38, letterSpacing: -1 },
  form: { marginTop: 32, gap: 16 },
  forgot: { alignSelf: "flex-end" },
  link: { fontFamily: fonts.semibold, fontSize: 15, color: colors.black, textDecorationLine: "underline" },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 24 },
  muted: { fontFamily: fonts.regular, fontSize: 15, color: colors.grey600 },
});