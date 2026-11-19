import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMusic } from "../context/MusicContext";

export function MiniPlayer() {
  const { currentSong, isPlaying, togglePlayback, next } = useMusic();
  if (!currentSong) return null;

  return (
    <Pressable
      style={styles.container}
      onPress={() =>
        router.push({
          pathname: "/details/[id]",
          params: { id: currentSong.id },
        })
      }
    >
      <Image source={currentSong.image} style={styles.artwork} />
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.title}>{currentSong.title}</Text>
        <Text numberOfLines={1} style={styles.artist}>{currentSong.artist}</Text>
      </View>
      <Pressable hitSlop={10} onPress={togglePlayback}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={26} color="#000" />
      </Pressable>
      <Pressable hitSlop={10} onPress={next} style={styles.next}>
        <Ionicons name="play-forward" size={23} color="#000" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#00FF66",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginHorizontal: 10,
  },
  title: {
    color: "#000",
    fontSize: 15,
    fontWeight: "900",
  },
  artist: {
    color: "#1A3A24",
    marginTop: 3,
  },
  next: {
    marginLeft: 16,
  },
});
