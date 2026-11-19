import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius } from "../constants/theme";

export default function UsersScreen() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, private_listening")
      .neq("id", user.id)
      .order("username", { ascending: true });

    const { data: myFollows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    setUsers(allProfiles || []);
    setFollowingIds(new Set((myFollows || []).map((f) => f.following_id)));
    setLoading(false);
  }

    async function toggleFollow(targetId) {
    if (!currentUserId) return;

    const isFollowing = followingIds.has(targetId);
    const previousIds = new Set(followingIds);
    const nextIds = new Set(followingIds);

    if (isFollowing) {
        nextIds.delete(targetId);
    } else {
        nextIds.add(targetId);
    }
    setFollowingIds(nextIds);

    const { error } = isFollowing
        ? await supabase
            .from("follows")
            .delete()
            .eq("follower_id", currentUserId)
            .eq("following_id", targetId)
        : await supabase
            .from("follows")
            .insert({ follower_id: currentUserId, following_id: targetId });

    if (error) {
        setFollowingIds(previousIds);
        Alert.alert("Follow Update Failed", error.message);
    }
    }

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Friends</Text>

      <TextInput
        placeholder="Search by username..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: spacing.lg + 6 }}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users found.</Text>
          }
          renderItem={({ item }) => {
            const isFollowing = followingIds.has(item.id);
            return (
              <View style={styles.userCard}>
                <Image
                  source={
                    item.avatar_url
                      ? { uri: item.avatar_url }
                      : require("../assets/spootehbai-logo.jpg")
                  }
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{item.username}</Text>
                  <Text style={styles.status}>
                    {item.private_listening
                      ? "Listening activity hidden"
                      : "Public listener"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowing && styles.followingButton,
                  ]}
                  onPress={() => toggleFollow(item.id)}
                >
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
      <TouchableOpacity
        style={styles.backRow}
        onPress={() => router.back()}
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
        <Text style={styles.backArrow}>&lsaquo;</Text>
        <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginBottom: spacing.sm + 6,
  },
  searchInput: {
    width: "100%",
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    marginBottom: spacing.sm + 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    marginRight: spacing.sm + 4,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  status: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs / 2,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
  },
  followingButton: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  followButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "800",
  },
  followingButtonText: {
    color: colors.primary,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg + 6,
  },
  backLink: {
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.sm + 4,
    fontSize: 15,
    fontWeight: "600",
  },
  backRow: {
  alignSelf: "flex-start",
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.xs,
  marginTop: spacing.sm,
  marginBottom: spacing.sm,
},
backArrow: {
  color: colors.primary,
  fontSize: 24,
  lineHeight: 26,
  fontWeight: "600",
  marginTop: -1,
},
backLink: {
  color: colors.primary,
  fontSize: 15,
  lineHeight: 20,
  fontWeight: "700",
},
});