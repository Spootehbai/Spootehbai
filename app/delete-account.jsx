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
import { clearListeningHistory } from "../data/home";
import { clearProfileState } from "../data/profile";
import { clearFollowedUsers } from "../data/social";

export default function DeleteAccountScreen() {
  const { account, deleteAccount, verifyCurrentPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const confirmDeletion = () => {
    Alert.alert(
      "Delete this local account?",
      "This permanently removes the account, profile, follows, and listening history from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: deleteLocalAccount,
        },
      ]
    );
  };

  const deleteLocalAccount = async () => {
    if (!account?.uid) {
      setError("Log in before deleting your account.");
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await verifyCurrentPassword(password);
      await Promise.all([
        clearListeningHistory(account.uid),
        clearProfileState(account.uid),
        clearFollowedUsers(account.uid),
      ]);
      await deleteAccount(password);
      Alert.alert("Account deleted", "Your local account has been removed.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the account."
      );
    } finally {
      setIsDeleting(false);
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
        <Text style={styles.title}>Delete account</Text>
        <Text style={styles.subtitle}>
          This removes your local account and clears its saved Spootehbai history
          and preferences. Enter your password to continue.
        </Text>
        <TextInput
          accessibilityLabel="Current password"
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="Current password"
          placeholderTextColor="#858585"
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={isDeleting || !password}
          onPress={confirmDeletion}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.deleteButtonText}>
            {isDeleting ? "Deleting..." : "Delete account"}
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
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#B32626",
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 14,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.75,
  },
});
