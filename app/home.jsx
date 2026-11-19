
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { songs } from "../data/songs";
import { MiniPlayer } from "../components/MiniPlayer";
import { useMusic } from "../context/MusicContext";

export default function HomeScreen() {
  const { playSong } = useMusic();

  const renderSong = ({ item: song }) => (
    <Pressable
      key={song.id}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
      onPress={() =>
        {
          const index = songs.findIndex((item) => item.id === song.id);
          playSong(index);
          router.push({
            pathname: "/details/[id]",
            params: { id: song.id },
          });
        }
      }
    >
      <Image
        source={song.image}
        style={styles.image}
      />

      <View style={styles.info}>
        <Text style={styles.songTitle}>
          {song.title}
        </Text>

        <Text style={styles.artist}>
          {song.artist}
        </Text>

        <Text style={styles.album}>
          {song.album}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={songs}
        keyExtractor={(song) => song.id}
        renderItem={renderSong}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>
              Spootehbai Playlist
            </Text>

            <Text style={styles.subtitle}>
              Pili og kanta aron makita ang mga detalye
            </Text>
          </View>
        }
      />
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  list: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  title: {
    color: "#00FF66",
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 10,
  },

  subtitle: {
    color: "#AAAAAA",
    fontSize: 14,
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#1F1F1F",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  pressed: {
    opacity: 0.7,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },

  info: {
    flex: 1,
  },

  songTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  artist: {
    color: "#00FF66",
    fontSize: 14,
    marginTop: 6,
  },

  album: {
    color: "#AAAAAA",
    fontSize: 12,
    marginTop: 4,
  },
});
