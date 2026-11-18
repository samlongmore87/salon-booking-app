import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Loading } from "../../../components/ui";
import { callSalon } from "../../../constants/salon";
import { colors, fonts } from "../../../constants/theme";
import { logOut, type Profile, saveProfile, useAuth } from "../../../lib/auth-context";
import { formatPhone, initials } from "../../../lib/format";
import { SHORT_MONTHS } from "../../../lib/schedule";

export default function Account() {
  const { user, profile, refreshProfile } = useAuth();
  // The reminders value being saved right now (null = not saving), so the switch moves straight away
  const [pendingReminders, setPendingReminders] = useState<boolean | null>(null);

  if (!user || !profile) return <Loading />;

  const remindersOn = pendingReminders ?? profile.remindersOn;
  const since = customerSince(profile);

  const toggleReminders = async (value: boolean) => {
    setPendingReminders(value);
    try {
      await saveProfile(user.uid, { remindersOn: value });
      await refreshProfile();
    } catch (e) {
      console.warn("Failed to save reminders setting", e);
      Alert.alert("Couldn't save", "Check your connection and try again.");
    } finally {
      setPendingReminders(null); // show the saved value (or flip back if saving failed)
    }
  };

  const confirmLogOut = () => {
    Alert.alert("Log out?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logOut },
    ]);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{profile.name}</Text>
          {since ? <Text style={styles.muted}>{since}</Text> : null}
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(profile.name)}</Text>
        </View>
      </View>

      <Text style={[styles.section, styles.firstSection]}>Details</Text>
      <View style={[styles.row, styles.divider]}>
        <View style={styles.text}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{profile.email}</Text>
        </View>
      </View>
      <View style={[styles.row, styles.divider]}>
        <View style={styles.text}>
          <Text style={styles.rowLabel}>Phone</Text>
          <Text style={styles.rowValue}>{formatPhone(profile.phone)}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/edit-details")}
          accessibilityRole="button"
          accessibilityLabel="Edit your details"
          style={({ pressed }) => [styles.edit, pressed && styles.dim]}
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Notifications</Text>
      <View style={[styles.row, styles.reminderRow, styles.divider]}>
        <View style={styles.text}>
          <Text style={styles.rowValue}>Appointment reminders</Text>
          <Text style={styles.rowLabel}>The day before, at 18:00</Text>
        </View>
        <Switch
          value={remindersOn}
          onValueChange={toggleReminders}
          disabled={pendingReminders !== null}
          accessibilityLabel="Appointment reminders"
          trackColor={{ false: colors.grey300, true: colors.black }}
          ios_backgroundColor={colors.grey300}
        />
      </View>

      <Text style={styles.section}>Support</Text>
      <Pressable
        onPress={callSalon}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, styles.linkRow, styles.divider, pressed && styles.dim]}
      >
        <Text style={[styles.rowValue, styles.flexText]}>Contact the salon</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.black} />
      </Pressable>
      <Pressable
        onPress={confirmLogOut}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, styles.linkRow, styles.logOutRow, pressed && styles.dim]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.black} />
        <Text style={styles.logOutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

// "Customer since Oct 2026" (nothing while a brand-new profile's date is still saving)
function customerSince(p: Profile) {
  const d = p.createdAt?.toDate();
  return d ? `Customer since ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}` : null;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  screen: { flexGrow: 1, paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  headerText: { flex: 1, gap: 6 },
  title: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: colors.black },
  muted: { fontFamily: fonts.regular, fontSize: 15, color: colors.grey600 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.grey100,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 22, color: colors.black },
  section: {
    marginTop: 28, marginBottom: 4, fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0.8,
    textTransform: "uppercase", color: colors.grey600,
  },
  firstSection: { marginTop: 32 },
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  reminderRow: { minHeight: 72, gap: 16 },
  linkRow: { minHeight: 56 },
  logOutRow: { justifyContent: "flex-start" },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.grey200 },
  text: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.grey600 },
  rowValue: { fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  flexText: { flex: 1 },
  edit: {
    height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.grey100,
    alignItems: "center", justifyContent: "center",
  },
  editText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black },
  logOutText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  dim: { opacity: 0.7 },
});