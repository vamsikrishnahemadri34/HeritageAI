import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../../src/theme";
import { getMyProfile, logout, User } from "../../src/services/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/(auth)");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.heading}>Your Profile</Text>

      {user ? (
        <View style={styles.card}>
          <Text variant="titleLarge" style={styles.name}>{user.full_name}</Text>
          <Text style={styles.detail}>{user.email}</Text>
          <Text style={styles.detail}>Account ID: {user.id}</Text>
          <Text style={styles.active}>Account active</Text>

          <Button mode="contained" buttonColor={colors.danger} onPress={handleLogout}>
            Logout
          </Button>
        </View>
      ) : (
        <Button mode="contained" onPress={() => router.replace("/(auth)")}>
          Login
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  heading: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontWeight: "700",
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 26,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 18,
  },
  name: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontWeight: "700",
    fontSize: 25,
  },
  detail: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  active: {
    color: colors.success,
    fontWeight: "600",
    backgroundColor: "#E8EFE8",
    overflow: "hidden",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
