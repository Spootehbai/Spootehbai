import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius } from "../constants/theme";

const BIO_MAX_LENGTH = 160;

export default function EditProfileScreen() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [localImageUri, setLocalImageUri] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isActive) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url")
        .eq("id", user.id)
        .single();

      if (!isActive) return;

      if (error) {
        Alert.alert("Load Error", error.message);
      }

      if (data) {
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || null);
      }
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Allow photo library access to change your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
    }
  }

  async function saveProfile() {
    const cleanName = username.trim();
    const cleanBio = bio.trim();

    if (!cleanName) {
      Alert.alert("Invalid Name", "Display name cannot be empty.");
      return;
    }

    if (!userId) {
      Alert.alert("Not Signed In", "Please log in again before saving.");
      return;
    }

    setSaving(true);
    let finalAvatarUrl = avatarUrl;

    try {
      if (localImageUri) {
        const ext = localImageUri.split(".").pop()?.split("?")[0] || "jpg";
        const filePath = `${userId}/${Date.now()}.${ext}`;
        const response = await fetch(localImageUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, blob, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        finalAvatarUrl = publicData.publicUrl;
      }

      const { data: updatedRow, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            username: cleanName,
            bio: cleanBio,
            avatar_url: finalAvatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("id, username, bio, avatar_url, updated_at")
        .single();

      if (error) throw error;

      setUsername(updatedRow.username);
      setBio(updatedRow.bio || "");
      setAvatarUrl(updatedRow.avatar_url);
      setLocalImageUri(null);

      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Update Failed", err.message);
    } finally {
      setSaving(false);
    }
  }

  const displayImage = localImageUri || avatarUrl;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Edit Profile</Text>

        <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrapper}>
          <Image
            source={
              displayImage
                ? { uri: displayImage }
                : require("../assets/spootehbai-logo.jpg")
            }
            style={styles.avatar}
          />
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            placeholder="Display Name"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Bio</Text>
            <Text style={styles.counter}>
              {bio.length}/{BIO_MAX_LENGTH}
            </Text>
          </View>
          <TextInput
            placeholder="Write a short bio..."
            placeholderTextColor={colors.textMuted}
            value={bio}
            onChangeText={setBio}
            maxLength={BIO_MAX_LENGTH}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[styles.input, styles.bioInput]}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={saveProfile}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelLink}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing.lg,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  changePhotoText: {
    color: colors.primary,
    marginTop: spacing.sm + 2,
    fontSize: 14,
    fontWeight: "700",
  },
  fieldGroup: {
    width: "100%",
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs + 2,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: spacing.xs + 2,
  },
  counter: {
    color: colors.textMuted,
    fontSize: 12,
  },
  input: {
    width: "100%",
    height: 55,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  bioInput: {
    height: 92,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm + 4,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "800",
  },
  cancelLink: {
    color: colors.textSecondary,
    marginTop: spacing.md + 2,
    fontSize: 14,
  },
});