import { useState } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { colors } from "../../src/theme";
import { login, register } from "../../src/services/auth";

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    if (mode === "register" && name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "register") {
        await register(name.trim(), email.trim(), password);
      }

      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineLarge" style={styles.brand}>HeritageAI</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Discover. Preserve. Connect with history.
        </Text>

        <View style={styles.card}>
          <Text variant="headlineSmall" style={styles.heading}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </Text>

          <SegmentedButtons
            value={mode}
            onValueChange={setMode}
            buttons={[
              { value: "login", label: "Login" },
              { value: "register", label: "Register" },
            ]}
          />

          {mode === "register" && (
            <TextInput
              label="Full name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoCapitalize="words"
            />
          )}

          <TextInput
            label="Email address"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Button mode="contained" onPress={submit} buttonColor={colors.primary}>
              {mode === "login" ? "Login" : "Create account"}
            </Button>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 26,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 14,
  },
  brand: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontWeight: "700",
    fontSize: 40,
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: 22,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 20,
  },
  heading: {
    color: colors.primary,
    fontFamily: "Georgia",
    fontWeight: "700",
  },
  error: {
    color: colors.danger,
    lineHeight: 21,
  },
});
