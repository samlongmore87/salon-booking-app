import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors, fonts } from "../../../constants/theme";
import { haptic } from "../../../lib/haptics";

export default function OwnerTabs() {
  return (
    <Tabs
      screenListeners={{ tabPress: () => haptic.select() }} // soft tick when switching tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.black,
        tabBarInactiveTintColor: colors.grey600,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.grey200 },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Ionicons name="options-outline" color={color as string} size={size} />,
        }}
      />
    </Tabs>
  );
}