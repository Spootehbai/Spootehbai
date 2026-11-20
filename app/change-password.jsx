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

export default function ChangePasswordScreen() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const submitChange = async () => {
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert("Password updated", "Your local account password was changed.", [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Could not change the password."
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
        <Text style={styles.title}>Change password</Text>
        <Text style={styles.subtitle}>
          Confirm your current password to update this local account.
        </Text>
        <TextInput
          accessibilityLabel="Current password"
          autoCapitalize="none"
          onChangeText={setCurrentPassword}
          placeholder="Current password"
          placeholderTextColor="#858585"
          secureTextEntry
          style={styles.input}
          value={currentPassword}
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
          onPress={submitChange}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Saving..." : "Update password"}
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
