import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getSongsByIds,
  madeForYouPlaylist,
  recommendedPlaylists,
} from "../../data/home";

const playlists = [madeForYouPlaylist, ...recommendedPlaylists];

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams();
  const playlistId = Array.isArray(id) ? id[0] : id;
  const playlist = playlists.find((item) => item.id === playlistId);
  const playlistSongs = playlist ? getSongsByIds(playlist.songIds) : [];

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  };

  const openSong = (song, autoplay = false) => {
    router.push({
      pathname: "/details/[id]",
      params: {
        id: song.id,
        ...(autoplay ? { autoplay: "true" } : {}),
      },
    });
  };

  if (!playlist) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.emptyState}>
          <Text style={styles.title}>Playlist not found</Text>
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          style={({ pressed }) => [
            styles.backIcon,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="chevron-back" size={23} color="#FFFFFF" />
        </Pressable>

        <Image source={playlist.image} style={styles.cover} />
        <Text style={styles.eyebrow}>SPOOTEHBAI PLAYLIST</Text>
        <Text style={styles.title}>{playlist.title}</Text>
        <Text style={styles.description}>{playlist.description}</Text>
        <Text style={styles.songCount}>{playlistSongs.length} songs</Text>

        {playlistSongs.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Play ${playlist.title}`}
            onPress={() => openSong(playlistSongs[0], true)}
            style={({ pressed }) => [
              styles.playAllButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="play" size={17} color="#001A0A" />
            <Text style={styles.playAllText}>Play playlist</Text>
          </Pressable>
        ) : (
          <Text style={styles.emptyText}>This playlist has no songs yet.</Text>
        )}

        <View style={styles.trackList}>
          {playlistSongs.map((song, index) => (
            <View key={song.id} style={styles.trackRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${song.title}`}
                onPress={() => openSong(song)}
                style={({ pressed }) => [
                  styles.trackTarget,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.trackNumber}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Image source={song.image} style={styles.trackImage} />
                <View style={styles.trackInfo}>
                  <Text numberOfLines={1} style={styles.trackTitle}>
                    {song.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.trackArtist}>
                    {song.artist}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Play ${song.title}`}
                onPress={() => openSong(song, true)}
                style={({ pressed }) => [
                  styles.trackPlayButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="play" size={15} color="#00FF66" />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  backIcon: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  cover: {
    alignSelf: "center",
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    height: 230,
    marginBottom: 22,
    marginTop: 16,
    width: 230,
  },
  eyebrow: {
    color: "#00FF66",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  description: {
    color: "#AAAAAA",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },
  songCount: {
    color: "#777777",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  playAllButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#00FF66",
    borderRadius: 22,
    flexDirection: "row",
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  playAllText: {
    color: "#001A0A",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
  },
  trackList: {
    marginTop: 28,
  },
  trackRow: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
  },
  trackTarget: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
  },
  trackNumber: {
    color: "#777777",
    fontSize: 11,
    fontWeight: "800",
    marginRight: 10,
    width: 22,
  },
  trackImage: {
    backgroundColor: "#1F1F1F",
    borderRadius: 9,
    height: 48,
    width: 48,
  },
  trackInfo: {
    flex: 1,
    marginHorizontal: 11,
  },
  trackTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  trackArtist: {
    color: "#00FF66",
    fontSize: 11,
    marginTop: 4,
  },
  trackPlayButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    color: "#AAAAAA",
    marginTop: 22,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#00FF66",
    borderRadius: 12,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backButtonText: {
    color: "#001A0A",
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.75,
  },
});
