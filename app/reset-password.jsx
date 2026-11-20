import { useState } from "react";

import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "../data/AuthContext";

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const submitReset = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await resetPassword(email, newPassword);
      Alert.alert(
        "Password changed",
        "Your local account password was updated for this app session.",
        [
          { text: "OK", onPress: () => router.replace("/login") },
        ]
      );
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Could not reset the password."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Local accounts only exist during this app session. No reset email is sent.
        </Text>
        <TextInput
          accessibilityLabel="Account email"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#858585"
          style={styles.input}
          value={email}
        />
        <TextInput
          accessibilityLabel="New password"
          autoCapitalize="none"
          onChangeText={setNewPassword}
          placeholder="New password (at least 8 characters)"
          placeholderTextColor="#858585"
          secureTextEntry
          style={styles.input}
          value={newPassword}
        />
        <TextInput
          accessibilityLabel="Confirm new password"
          autoCapitalize="none"
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor="#858585"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={submitReset}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Updating..." : "Update password"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 24,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "#00FF66",
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
  },
  subtitle: {
    color: "#AAAAAA",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 22,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#191919",
    borderColor: "#303030",
    borderRadius: 11,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  error: {
    color: "#FF7777",
    fontSize: 13,
    marginBottom: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#00FF66",
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#001A0A",
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.75,
  },
});
