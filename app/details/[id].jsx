
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { songs } from "../../data/songs";

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();

  const songId = Array.isArray(id) ? id[0] : id;

  const song = songs.find(
    (item) => item.id === songId
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  };

  if (!song) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Song Not Found
        </Text>

        <Text style={styles.description}>
          No song matches ID: {songId || "Unknown"}
        </Text>

        <Pressable
          style={styles.button}
          onPress={goBack}
        >
          <Text style={styles.buttonText}>
            Back to Playlist
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Song Details
      </Text>

      <Image
        source={song.image}
        style={styles.image}
      />

      <Text style={styles.songTitle}>
        {song.title}
      </Text>

      <Text style={styles.artist}>
        {song.artist}
      </Text>

      <View style={styles.card}>
        <Text style={styles.text}>
          ID: {song.id}
        </Text>

        <Text style={styles.text}>
          Title: {song.title}
        </Text>

        <Text style={styles.text}>
          Artist: {song.artist}
        </Text>

        <Text style={styles.text}>
          Album: {song.album}
        </Text>

        <Text style={styles.label}>
          Description:
        </Text>

        <Text style={styles.description}>
          {song.description}
        </Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={goBack}
      >
        <Text style={styles.buttonText}>
          ← Back to Playlist
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },

  title: {
    color: "#00FF66",
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 25,
  },

  
image: {
  width: 200,
  height: 200,
  borderRadius: 15,
  marginBottom: 20,
  alignSelf: "center",
  resizeMode: "cover",
},


  songTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
  },

  artist: {
    color: "#00FF66",
    fontSize: 16,
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#1F1F1F",
    padding: 20,
    borderRadius: 15,
  },

  text: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 12,
  },

  label: {
    color: "#00FF66",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 8,
  },

  description: {
    color: "#AAAAAA",
    fontSize: 15,
    lineHeight: 23,
  },

  button: {
    backgroundColor: "#00FF66",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
  },

  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "900",
  },
});
