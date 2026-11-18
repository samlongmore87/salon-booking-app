import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { ErrorText, PrimaryButton, TextField } from "../../components/ui";
import { colors, fonts } from "../../constants/theme";
import { saveProfile, useAuth } from "../../lib/auth-context";
import { localPhone, parseSaPhone } from "../../lib/format";

export default function EditDetails() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile ? localPhone(profile.phone) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // false once this screen closes, so a save that finishes later doesn't navigate or update it
  const isOpen = useRef(true);
  useEffect(() => {
    isOpen.current = true;
    return () => {
      isOpen.current = false;
    };
  }, []);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/account"));

  const onSave = async () => {
    if (!user || !profile) return;
    setError(null);
    const cleanName = name.trim();
    const cleanPhone = parseSaPhone(phone);

    if (!cleanName) return setError("Enter your full name.");
    if (!cleanPhone) return setError("Enter a valid SA mobile number, e.g. 82 123 4567.");
    if (cleanName === profile.name && cleanPhone === profile.phone) return goBack(); // nothing changed

    setSaving(true);
    try {
      await saveProfile(user.uid, { name: cleanName, phone: cleanPhone });
      await refreshProfile(); // so Home and Account show the new details straight away
      if (isOpen.current) goBack(); // the customer may already have left this screen
    } catch (e) {
      console.warn("Failed to save details", e);
      if (!isOpen.current) return;
      setError("We couldn't save your details. Check your connection and try again.");
      setSaving(false);
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

        <Text style={styles.title}>Edit details</Text>
        <Text style={styles.subtitle}>Your email can&apos;t be changed.</Text>

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
            label="Phone number"
            prefix="+27"
            placeholder="82 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
        </View>

        <View style={styles.flex} />

        <View style={styles.bottom}>
          <ErrorText message={error} />
          <PrimaryButton title="Save" onPress={onSave} loading={saving} />
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
});