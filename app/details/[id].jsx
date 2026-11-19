
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { songs } from "../../data/songs";
import { Ionicons } from "@expo/vector-icons";
import { useMusic } from "../../context/MusicContext";

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  const [progressWidth, setProgressWidth] = useState(1);
  const [volumeWidth, setVolumeWidth] = useState(1);

  const songId = Array.isArray(id) ? id[0] : id;

  const song = songs.find(
    (item) => item.id === songId
  );
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    volume,
    shuffle,
    repeat,
    playSong,
    togglePlayback,
    next,
    previous,
    seek,
    changeVolume,
    setShuffle,
    cycleRepeat,
    addToQueue,
  } = useMusic();
  const followsPlaybackRef = useRef(currentSong?.id === songId);

  useEffect(() => {
    if (!currentSong) return;
    if (currentSong.id === songId) {
      followsPlaybackRef.current = true;
    } else if (followsPlaybackRef.current) {
      router.setParams({ id: currentSong.id });
    }
  }, [currentSong, songId]);

  const formatTime = (milliseconds) => {
    const seconds = Math.floor((milliseconds || 0) / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };

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

      {currentSong?.id === song.id && (
        <View style={styles.playerCard}>
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${duration ? (position / duration) * 100 : 0}%` },
                ]}
              />
            </View>
            <Pressable
              style={styles.progressTouch}
              onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
              onPress={(event) => {
                seek((event.nativeEvent.locationX / progressWidth) * duration);
              }}
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.transport}>
            <Pressable onPress={() => setShuffle(!shuffle)}>
              <Ionicons name="shuffle" size={24} color={shuffle ? "#00FF66" : "#777"} />
            </Pressable>
            <Pressable hitSlop={12} onPress={previous}>
              <Ionicons name="play-back" size={34} color="#FFF" />
            </Pressable>
            <Pressable style={styles.playButton} onPress={togglePlayback}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={34} color="#000" />
            </Pressable>
            <Pressable hitSlop={12} onPress={next}>
              <Ionicons name="play-forward" size={34} color="#FFF" />
            </Pressable>
            <Pressable onPress={cycleRepeat}>
              <Ionicons
                name={repeat === "song" ? "repeat" : "repeat"}
                size={24}
                color={repeat === "off" ? "#777" : "#00FF66"}
              />
              {repeat === "song" && <View style={styles.repeatDot} />}
            </Pressable>
          </View>

          <View style={styles.volumeRow}>
            <Ionicons name="volume-low" size={20} color="#AAA" />
            <Pressable
              style={styles.volumeTrack}
              onLayout={(event) => setVolumeWidth(event.nativeEvent.layout.width)}
              onPress={(event) => {
                changeVolume(event.nativeEvent.locationX / volumeWidth);
              }}
            >
              <View style={[styles.volumeFill, { width: `${volume * 100}%` }]} />
            </Pressable>
            <Ionicons name="volume-high" size={20} color="#AAA" />
          </View>

          <View style={styles.queueActions}>
            <Pressable
              style={styles.queueButton}
              onPress={() => {
                if (addToQueue(song)) {
                  Alert.alert("Added to Queue", `${song.title} was added to your queue.`);
                } else {
                  Alert.alert("Already in Queue", `${song.title} is already in your queue.`);
                }
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#00FF66" />
              <Text style={styles.queueText}>Add to Queue</Text>
            </Pressable>
            <Pressable
              style={styles.queueButton}
              onPress={() => router.push("/queue")}
            >
              <Ionicons name="list" size={20} color="#00FF66" />
              <Text style={styles.queueText}>View Queue</Text>
            </Pressable>
          </View>
        </View>
      )}

      {currentSong?.id !== song.id && (
        <Pressable
          style={styles.playThisButton}
          onPress={() => {
            playSong(song);
          }}
        >
          <Ionicons name="play" size={22} color="#000" />
          <Text style={styles.playThisText}>Play this song</Text>
        </Pressable>
      )}

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

  playerCard: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  progressWrap: {
    marginBottom: 18,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#333",
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#00FF66",
  },
  progressTouch: {
    height: 24,
    marginTop: -14,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    color: "#999",
    fontSize: 12,
  },
  transport: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#00FF66",
    alignItems: "center",
    justifyContent: "center",
  },
  repeatDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#00FF66",
    alignSelf: "center",
    bottom: -4,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  volumeTrack: {
    flex: 1,
    height: 5,
    marginHorizontal: 10,
    borderRadius: 3,
    backgroundColor: "#333",
  },
  volumeFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#00FF66",
  },
  queueActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  queueButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00FF66",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  queueText: {
    color: "#00FF66",
    fontWeight: "800",
    marginLeft: 6,
  },
  playThisButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#00FF66",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 20,
  },
  playThisText: {
    color: "#000",
    fontWeight: "900",
    marginLeft: 8,
  },
});
