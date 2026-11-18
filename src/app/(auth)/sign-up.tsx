import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { ErrorText, PrimaryButton, TextField } from "../../components/ui";
import { colors, fonts } from "../../constants/theme";
import { useAuth } from "../../lib/auth-context";
import { authErrorMessage } from "../../lib/auth-errors";
import { auth, db } from "../../lib/firebase";
import { parseSaPhone } from "../../lib/format";

export default function SignUp() {
  const { refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/login"));

  const onSignUp = async () => {
    setError(null);
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = parseSaPhone(phone); // e.g. "082 123 4567" → "+27821234567"

    if (!cleanName) return setError("Enter your full name.");
    if (!cleanEmail.includes("@")) return setError("Enter a valid email address.");
    if (!cleanPhone) return setError("Enter a valid SA mobile number, e.g. 82 123 4567.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          role: "customer", // the security rules only allow "customer" here
          remindersOn: true,
          createdAt: serverTimestamp(),
        });
      } catch (profileError) {
        // Don't leave a login with no profile behind
        await deleteUser(cred.user);
        throw profileError;
      }
      await refreshProfile(); // the (auth) layout then redirects to Home
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Pressable onPress={goBack} accessibilityLabel="Back" hitSlop={8} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </Pressable>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>It takes less than a minute.</Text>

        <View style={styles.form}>
          <TextField
            label="Full name"
            placeholder="e.g. Lerato Mokoena"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="name"
          />
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
            label="Phone number"
            prefix="+27"
            placeholder="82 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
          <TextField
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />
        </View>

        <View style={styles.flex} />

        <View style={styles.bottom}>
          <ErrorText message={error} />
          <Text style={styles.note}>We only use your number to contact you about your bookings.</Text>
          <PrimaryButton title="Create account" onPress={onSignUp} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  screen: { flexGrow: 1, paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 },
  back: { width: 44, height: 44, justifyContent: "center", marginLeft: -4 },
  title: { marginTop: 12, fontFamily: fonts.bold, fontSize: 32, letterSpacing: -0.8, color: colors.black },
  subtitle: { marginTop: 8, fontFamily: fonts.regular, fontSize: 16, color: colors.grey600 },
  form: { marginTop: 28, gap: 16 },
  bottom: { marginTop: 24, gap: 12 },
  note: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.grey600 },
});