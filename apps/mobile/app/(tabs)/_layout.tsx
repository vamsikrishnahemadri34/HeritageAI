import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../src/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 76,
          paddingTop: 9,
          paddingBottom: 10,
          elevation: 8,
          shadowColor: "#203A30",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.2,
          marginTop: 3,
        },
        tabBarIconStyle: {
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" color={typeof color === "string" ? color : colors.primary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarLabel: "Explore",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="compass-outline" color={typeof color === "string" ? color : colors.primary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scanner",
          tabBarLabel: "Scanner",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="scan-helper" color={typeof color === "string" ? color : colors.primary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Chat",
          tabBarLabel: "AI Chat",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat-processing-outline" color={typeof color === "string" ? color : colors.primary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" color={typeof color === "string" ? color : colors.primary} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

