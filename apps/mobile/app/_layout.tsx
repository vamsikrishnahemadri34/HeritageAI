import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { PaperProvider, heritageTheme } from "../src/theme/provider";
import { getMyProfile } from "../src/services/auth";
import { colors } from "../src/theme";

export default function RootLayout() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        await getMyProfile();
        if (active) router.replace("/(tabs)");
      } catch {
        if (active) router.replace("/(auth)");
      } finally {
        if (active) setCheckingAuth(false);
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, []);

  return (
    <PaperProvider theme={heritageTheme}>
      <StatusBar style="dark" />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="site/[id]" />
      </Stack>

      {checkingAuth && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});



