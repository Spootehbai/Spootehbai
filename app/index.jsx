
import React from "react";
import { router } from "expo-router";

import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "../components/AppButton.jsx";

import { spacing } from "../constants/theme";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/spootehbai-brand-logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Spootehbai logo"
        />

        <Text style={styles.title}>
          Spootehbai
        </Text>

        <Text style={styles.subtitle}>
          Bali e diskubre lang imong mga paborito nga kanta.
        </Text>

        <View style={styles.buttonWrapper}>
          <AppButton
            title="Sugdi Na"
            onPress={() => router.replace("/login")}
          />
        </View>
      </View>

      <Text style={styles.footer}>
        Good music, bai.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: 70,
    paddingBottom: 30,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 220,
    height: 220,
    marginBottom: 24,
    borderRadius: 20,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    color: "#A9A9A9",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 30,
  },

  buttonWrapper: {
    width: "100%",
    maxWidth: 320,
  },

  footer: {
    color: "#6F6F6F",
    textAlign: "center",
    fontSize: 14,
  },
});
