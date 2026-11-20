import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius } from "../constants/theme";

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function syncProfile() {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!isActive) return;

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const {
          data: followerRows,
          count: followers,
          error: followersError,
        } = await supabase
          .from("follows")
          .select("follower_id", { count: "exact" })
          .eq("following_id", user.id);

        const {
          data: followingRows,
          count: following,
          error: followingError,
        } = await supabase
          .from("follows")
          .select("following_id", { count: "exact" })
          .eq("follower_id", user.id);

        if (!isActive) return;

        if (followersError || followingError) {
          Alert.alert(
            "Follow Count Error",
            (followersError || followingError).message
          );
        }

        const resolvedFollowers =
          typeof followers === "number" ? followers : followerRows?.length ?? 0;
        const resolvedFollowing =
          typeof following === "number" ? following : followingRows?.length ?? 0;

        setProfile(
          profileData || {
            username: user.user_metadata?.username || "Listener",
            email: user.email,
            bio: "",
            private_listening: false,
          }
        );
        setFollowersCount(resolvedFollowers);
        setFollowingCount(resolvedFollowing);
        setLoading(false);
      }

      syncProfile();

      return () => {
        isActive = false;
      };
    }, [])
  );

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    router.replace("/login");
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/home")}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backChevron}>&lsaquo;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image
          source={
            profile?.avatar_url
              ? { uri: profile.avatar_url }
              : require("../assets/spootehbai-logo.jpg")
          }
          style={styles.avatar}
        />

        <Text style={styles.username}>{profile?.username}</Text>
        <Text style={styles.email}>{profile?.email}</Text>

        {Boolean(profile?.bio?.trim()) && (
          <Text style={styles.bio}>{profile.bio.trim()}</Text>
        )}

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {profile?.private_listening
              ? "Private Listening Active"
              : "Sharing Listening Activity"}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/edit-profile")}
        >
          <Text style={styles.primaryButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/users")}
        >
          <Text style={styles.secondaryButtonText}>Find & Follow Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.secondaryButtonText}>Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: spacing.xs,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "400",
    lineHeight: 28,
    marginTop: -2,
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing.xl,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  username: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  email: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  bio: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
    marginTop: spacing.sm + 2,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.xl,
    marginTop: spacing.sm + 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.xl,
    marginVertical: spacing.lg,
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  primaryButton: {
    width: "100%",
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm + 2,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    width: "100%",
    height: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm + 2,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  logoutButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "700",
  },
});