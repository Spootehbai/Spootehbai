import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius } from "../constants/theme";

export default function SettingsScreen() {
  const [userId, setUserId] = useState(null);
  const [privateListening, setPrivateListening] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("private_listening")
        .eq("id", user.id)
        .single();

      if (!active) return;

      if (!error && data) {
        setPrivateListening(Boolean(data.private_listening));
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  async function toggleListeningPrivacy(nextValue) {
    if (!userId || savingPrivacy) return;

    const previousValue = privateListening;
    setPrivateListening(nextValue);
    setSavingPrivacy(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        private_listening: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSavingPrivacy(false);

    if (error) {
      setPrivateListening(previousValue);
      Alert.alert("Error", error.message || "Could not update listening privacy.");
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      Alert.alert(
        "Weak Password",
        "New password must be at least 6 characters."
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);

    if (error) {
      Alert.alert("Password Error", error.message);
      return;
    }

    setNewPassword("");
    setConfirmNewPassword("");
    Alert.alert("Success", "Your password has been updated.");
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "This permanently deletes your Spootehbai account, profile, and followers. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc("delete_own_account");
            if (error) {
              Alert.alert("Delete Failed", error.message);
              return;
            }
            await supabase.auth.signOut();
            router.replace("/register");
          },
        },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Account Settings</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.sectionTitle}>Private Listening Session</Text>
            <Text style={styles.helperText}>
              {privateListening
                ? "Private mode is on — your listening activity is hidden from followers and activity feeds."
                : "Hide what you're currently playing from followers and activity feeds."}
            </Text>
          </View>
          <Switch
            value={privateListening}
            onValueChange={toggleListeningPrivacy}
            disabled={savingPrivacy}
            trackColor={{ false: colors.border, true: colors.primaryDark }}
            thumbColor={privateListening ? colors.primary : colors.white}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <TextInput
          placeholder="New Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
        />
        <TextInput
          placeholder="Confirm New Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleChangePassword}
          disabled={updatingPassword}
        >
          <Text style={styles.buttonText}>
            {updatingPassword ? "Updating..." : "Update Password"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <Text style={styles.helperText}>
          Permanently erase your account and all associated data.
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={confirmDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.backRow}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLink}>Go Back</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl + 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing.md + 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dangerCard: {
    borderColor: colors.danger,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: {
    flex: 1,
    paddingRight: spacing.sm + 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing.xs + 2,
  },
  dangerTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing.xs + 2,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm + 4,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 6,
    color: colors.text,
    marginBottom: spacing.sm + 2,
  },
  button: {
    width: "100%",
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  buttonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "800",
  },
  deleteButton: {
    width: "100%",
    height: 46,
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  backButton: {
    alignSelf: "center",
    marginTop: spacing.sm + 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  backArrow: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 1,
  },
  backLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
});