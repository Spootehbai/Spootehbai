import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { AppButton } from "../components/AppButton.jsx";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius } from "../constants/theme";

export default function WelcomeScreen() {
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (session) {
        router.replace("/home");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (checkingSession) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/spootehbai-logo.jpg")}
          style={styles.cover}
        />

        <Text style={styles.title}>Playlist sa mga Bai</Text>

        <Text style={styles.subtitle}>
          Bali e diskubre lang imong mga paborito nga kanta.
        </Text>

        <AppButton
          title="Sugdi Na(Log in)"
          onPress={() => router.push("/login")}
        />

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.registerText}>Buhat og account (Register)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Music Playlist App</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
    padding: spacing.xl,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cover: {
    width: 120,
    height: 120,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: spacing.xl,
  },
  registerBtn: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  registerText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    color: colors.textMuted,
    textAlign: "center",
  },
});