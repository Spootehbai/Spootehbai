import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMusic } from "../context/MusicContext";

export default function QueueScreen() {
  const { queue, currentIndex, playSong, removeFromQueue } = useMusic();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={30} color="#FFF" />
        </Pressable>
        <Text style={styles.title}>Play Queue</Text>
        <View style={{ width: 30 }} />
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index === currentIndex && styles.activeRow]}>
            <Pressable
              style={styles.songInfo}
              onPress={() => playSong(item)}
            >
              <Image source={item.image} style={styles.artwork} />
              <View style={styles.textInfo}>
                <Text numberOfLines={1} style={styles.songTitle}>{item.title}</Text>
                <Text numberOfLines={1} style={styles.artist}>{item.artist}</Text>
              </View>
            </Pressable>
            <Pressable hitSlop={12} onPress={() => removeFromQueue(index)}>
              {index === currentIndex ? (
                <Ionicons name="musical-notes" size={22} color="#00FF66" />
              ) : (
                <Ionicons name="trash-outline" size={22} color="#777" />
              )}
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          <Pressable style={styles.backButton} onPress={() => router.push("/home")}>
            <Ionicons name="add" size={20} color="#000" />
            <Text style={styles.backText}>Add more songs</Text>
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 54 },
  header: {
    height: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#FFF", fontSize: 20, fontWeight: "900" },
  list: { padding: 20, paddingBottom: 40 },
  row: {
    height: 74,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  activeRow: { backgroundColor: "#122318" },
  songInfo: { flex: 1, flexDirection: "row", alignItems: "center" },
  artwork: { width: 54, height: 54, borderRadius: 8 },
  textInfo: { flex: 1, marginLeft: 12 },
  songTitle: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  artist: { color: "#999", marginTop: 4 },
  backButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#00FF66",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#000", fontWeight: "900", marginLeft: 8 },
});
