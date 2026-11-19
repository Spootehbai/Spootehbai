import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { songs } from "../data/songs";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius } from "../constants/theme";

export default function HomeScreen() {
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    router.replace("/login");
  }

  const renderSong = ({ item: song }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
      onPress={() =>
        router.push({
          pathname: "/details/[id]",
          params: { id: song.id },
        })
      }
    >
      <Image source={song.image} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.songTitle}>{song.title}</Text>
        <Text style={styles.artist}>{song.artist}</Text>
        <Text style={styles.album}>{song.album}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={songs}
        keyExtractor={(song) => String(song.id)}
        renderItem={renderSong}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => router.push("/profile")}
              >
                <Text style={styles.navButtonText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navButton}
                onPress={() => router.push("/users")}
              >
                <Text style={styles.navButtonText}>Friends</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutChip}
                onPress={handleLogout}
              >
                <Text style={styles.logoutChipText}>Log Out</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Spootehbai Playlist</Text>
            <Text style={styles.subtitle}>
              Pili og kanta aron makita ang mga detalye
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  list: {
    paddingTop: spacing.xl + 24,
    paddingHorizontal: spacing.md + 4,
    paddingBottom: spacing.lg + 6,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  navButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.sm,
  },

  navButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  logoutChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 3,
    borderRadius: radius.sm,
  },

  logoutChipText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },

  title: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: "900",
    marginBottom: spacing.sm + 2,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 7,
    borderRadius: radius.md + 3,
    marginBottom: spacing.sm + 7,
    flexDirection: "row",
    alignItems: "center",
  },

  pressed: {
    opacity: 0.7,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: radius.sm + 2,
    marginRight: spacing.sm + 7,
  },

  info: {
    flex: 1,
  },

  songTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },

  artist: {
    color: colors.primary,
    fontSize: 14,
    marginTop: spacing.xs + 2,
  },

  album: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});