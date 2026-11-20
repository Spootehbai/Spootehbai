
import { useEffect, useRef, useState } from "react";

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useAuth } from "../../data/AuthContext";

import {
  recordPlaybackStarted,
  savePlaybackProgress,
} from "../../data/home";
import { getSongById } from "../../data/catalog";

export default function DetailsScreen() {
  const { account } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const { id, autoplay, startAt } = useLocalSearchParams();

  const songId = Array.isArray(id) ? id[0] : id;
  const shouldAutoplay = Array.isArray(autoplay)
    ? autoplay[0] === "true"
    : autoplay === "true";
  const requestedStartAt = Number(Array.isArray(startAt) ? startAt[0] : startAt);
  const resumePosition =
    Number.isFinite(requestedStartAt) && requestedStartAt > 0
      ? requestedStartAt
      : 0;

  const song = getSongById(songId);
  const audioSource = song?.audioSource ?? null;
  const player = useAudioPlayer(audioSource, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const autoPlayedSongId = useRef(null);
  const trackedPlayingSongId = useRef(null);
  const pendingResumeSongId = useRef(null);
  const lastSavedPlayback = useRef({ songId: null, currentTime: 0 });
  const latestPlayback = useRef(null);
  const [progressWidth, setProgressWidth] = useState(0);
  const [playerError, setPlayerError] = useState(null);
  const [historyError, setHistoryError] = useState(null);

  latestPlayback.current = {
    songId: song?.id,
    currentTime: status.currentTime,
    duration: status.duration,
    isLoaded: status.isLoaded,
  };

  useEffect(() => {
    let isMounted = true;

    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
    }).catch((error) => {
      if (isMounted) {
        setPlayerError(
          error instanceof Error ? error.message : "Could not configure audio."
        );
      }
    });

    return () => {
      isMounted = false;
      const lastPlayback = latestPlayback.current;
      if (
        account?.uid &&
        lastPlayback?.songId &&
        lastPlayback.isLoaded &&
        lastPlayback.currentTime > 0 &&
        lastPlayback.duration > 0
      ) {
        savePlaybackProgress(
          lastPlayback.songId,
          lastPlayback.currentTime,
          lastPlayback.duration,
          account.uid
        ).catch((error) => console.error(error));
      }
      player.pause();
    };
  }, [player, account?.uid]);

  useEffect(() => {
    setPlayerError(null);
    setHistoryError(null);
    autoPlayedSongId.current = null;
    trackedPlayingSongId.current = null;
    pendingResumeSongId.current = null;
    lastSavedPlayback.current = { songId, currentTime: 0 };
  }, [songId]);

  useEffect(() => {
    if (!shouldAutoplay || !song || !audioSource) {
      return;
    }

    if (autoPlayedSongId.current === song.id) {
      return;
    }

    if (resumePosition > 0) {
      if (!status.isLoaded || status.duration <= 0) {
        return;
      }

      autoPlayedSongId.current = song.id;
      pendingResumeSongId.current = song.id;
      player
        .seekTo(Math.min(resumePosition, status.duration))
        .then(() => {
          pendingResumeSongId.current = null;
          player.play();
        })
        .catch((error) => {
          pendingResumeSongId.current = null;
          setPlayerError(
            error instanceof Error
              ? error.message
              : "Could not resume this song."
          );
        });
      return;
    }

    autoPlayedSongId.current = song.id;
    player.play();
  }, [
    audioSource,
    player,
    resumePosition,
    shouldAutoplay,
    song,
    status.duration,
    status.isLoaded,
  ]);

  useEffect(() => {
    if (
      !song ||
      !audioSource ||
      !account?.uid ||
      !status.playing ||
      trackedPlayingSongId.current === song.id
    ) {
      return;
    }

    trackedPlayingSongId.current = song.id;
    recordPlaybackStarted(song.id, account.uid).catch((error) => {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Could not save listening history."
      );
    });
  }, [account?.uid, audioSource, song, status.playing]);

  // Persist actual playback progress so Continue listening can resume it later.
  useEffect(() => {
    if (
      !song ||
      !audioSource ||
      !account?.uid ||
      !status.isLoaded ||
      status.duration <= 0 ||
      pendingResumeSongId.current === song.id
    ) {
      return;
    }

    const previous = lastSavedPlayback.current;
    const currentTime = status.currentTime;
    const justFinished =
      status.didJustFinish &&
      (previous.songId !== song.id ||
        previous.currentTime < status.duration - 1);
    const shouldSave =
      Math.abs(currentTime - previous.currentTime) >= 5 ||
      (!status.playing && currentTime !== previous.currentTime) ||
      justFinished;

    if (!shouldSave) {
      return;
    }

    const savedTime = justFinished ? status.duration : currentTime;
    lastSavedPlayback.current = { songId: song.id, currentTime: savedTime };
    if (currentTime <= 0 && !status.didJustFinish) {
      return;
    }

    savePlaybackProgress(song.id, savedTime, status.duration, account.uid).catch(
      (error) => {
        setHistoryError(
          error instanceof Error
            ? error.message
            : "Could not save playback progress."
        );
      }
    );
  }, [
    audioSource,
    account?.uid,
    song,
    status.currentTime,
    status.didJustFinish,
    status.duration,
    status.isLoaded,
    status.playing,
  ]);

  const togglePlayback = () => {
    if (!audioSource) {
      return;
    }

    setPlayerError(null);

    if (status.playing) {
      player.pause();
      return;
    }

    if (status.duration > 0 && status.currentTime >= status.duration) {
      player.seekTo(0).then(() => player.play()).catch((error) => {
        setPlayerError(
          error instanceof Error ? error.message : "Could not restart the song."
        );
      });
      return;
    }

    player.play();
  };

  const seekTo = (seconds) => {
    if (!audioSource || !status.isLoaded || status.duration <= 0) {
      return;
    }

    const position = Math.max(0, Math.min(seconds, status.duration));
    player.seekTo(position).catch((error) => {
      setPlayerError(
        error instanceof Error ? error.message : "Could not seek in this song."
      );
    });
  };

  const seekFromProgress = (event) => {
    if (progressWidth <= 0) {
      return;
    }

    const fraction = Math.max(
      0,
      Math.min(event.nativeEvent.locationX / progressWidth, 1)
    );
    seekTo(fraction * status.duration);
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
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.errorState}>
          <View style={styles.errorIcon}>
            <Ionicons name="musical-notes-outline" size={30} color="#00FF66" />
          </View>
          <Text style={styles.errorTitle}>Song not found</Text>
          <Text style={styles.errorDescription}>
            No song matches ID: {songId || "Unknown"}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Back to playlist</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const progress = status.duration > 0
    ? Math.min(status.currentTime / status.duration, 1)
    : 0;
  const playbackError = playerError || status.error;
  const artworkSize = Math.min(screenWidth - 64, 320);
  const canControlPlayback = Boolean(audioSource);
  const canSeek = Boolean(audioSource && status.isLoaded && status.duration > 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBack}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={23} color="#FFFFFF" />
          </Pressable>
          <View style={styles.topBarTitle}>
            <Text style={styles.eyebrow}>NOW PLAYING</Text>
            <Text style={styles.topBarSubtitle}>Track details</Text>
          </View>
          <View style={styles.iconButtonSpacer} />
        </View>

        <View style={styles.artworkStage}>
          <View
            pointerEvents="none"
            style={[
              styles.artworkGlow,
              {
                width: artworkSize * 0.82,
                height: artworkSize * 0.82,
                borderRadius: artworkSize * 0.18,
              },
            ]}
          />
          <Image
            source={song.image}
            style={[
              styles.artwork,
              {
                width: artworkSize,
                height: artworkSize,
                borderRadius: artworkSize * 0.09,
              },
            ]}
          />
        </View>

        <View style={styles.trackHeader}>
          <Text style={styles.trackTitle}>{song.title}</Text>
          <Text style={styles.trackArtist}>{song.artist}</Text>
          <View style={styles.albumChip}>
            <Ionicons name="disc-outline" size={15} color="#00FF66" />
            <Text numberOfLines={1} style={styles.albumChipText}>
              {song.album}
            </Text>
          </View>
        </View>

        <View style={styles.playerCard}>
          <View style={styles.playerStatusRow}>
            <View style={styles.playingIndicator} />
            <Text style={styles.playerStatus}>
              {!audioSource
                ? "Audio unavailable"
                : status.isBuffering
                  ? "Buffering"
                  : status.playing
                    ? "Playing"
                    : status.isLoaded
                      ? "Ready to play"
                      : "Loading track"}
            </Text>
          </View>

          <Pressable
            accessibilityRole="adjustable"
            accessibilityLabel="Song progress"
            accessibilityValue={{
              min: 0,
              max: Math.floor(status.duration),
              now: Math.floor(status.currentTime),
            }}
            disabled={!canSeek}
            onLayout={(event) =>
              setProgressWidth(event.nativeEvent.layout.width)
            }
            onPress={seekFromProgress}
            style={({ pressed }) => [
              styles.progressTrack,
              pressed && canSeek && styles.progressPressed,
            ]}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                { left: `${progress * 100}%` },
              ]}
            />
          </Pressable>

          <View style={styles.timeRow}>
            <Text style={styles.playerTime}>
              {formatTime(status.currentTime)}
            </Text>
            <Text style={styles.playerTime}>
              {formatTime(status.duration)}
            </Text>
          </View>

          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rewind 10 seconds"
              disabled={!canSeek}
              onPress={() => seekTo(status.currentTime - 10)}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="play-back" size={23} color="#D8DED9" />
              <Text style={styles.skipLabel}>10</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={status.playing ? "Pause song" : "Play song"}
              disabled={!canControlPlayback}
              onPress={togglePlayback}
              style={({ pressed }) => [
                styles.playButton,
                !canControlPlayback && styles.playButtonDisabled,
                pressed && canControlPlayback && styles.playButtonPressed,
              ]}
            >
              <Ionicons
                name={status.playing ? "pause" : "play"}
                size={27}
                color={canControlPlayback ? "#001A0A" : "#777777"}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Forward 10 seconds"
              disabled={!canSeek}
              onPress={() => seekTo(status.currentTime + 10)}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="play-forward" size={23} color="#D8DED9" />
              <Text style={styles.skipLabel}>10</Text>
            </Pressable>
          </View>

          {!audioSource ? (
            <Text style={styles.audioHint}>
              Add an audio file under assets/audio and set audioSource in
              data/songs.js to enable playback.
            </Text>
          ) : null}

          {playbackError ? (
            <Text accessibilityRole="alert" style={styles.audioError}>
              {playbackError}
            </Text>
          ) : null}
          {historyError ? (
            <Text accessibilityRole="alert" style={styles.audioError}>
              {historyError}
            </Text>
          ) : null}
        </View>

        <View style={styles.aboutCard}>
          <View style={styles.aboutHeading}>
            <View style={styles.aboutIcon}>
              <Ionicons name="musical-notes" size={17} color="#00FF66" />
            </View>
            <Text style={styles.aboutTitle}>About this track</Text>
          </View>
          <Text style={styles.description}>
            {song.description || "No description is available for this track."}
          </Text>
          <View style={styles.aboutDivider} />
          <View style={styles.albumInfoRow}>
            <Text style={styles.albumInfoLabel}>ALBUM</Text>
            <Text style={styles.albumInfoValue}>{song.album}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = String(safeSeconds % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#070A08",
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#070A08",
  },

  content: {
    paddingBottom: 36,
    paddingHorizontal: 22,
  },

  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    minHeight: 54,
  },

  iconButton: {
    alignItems: "center",
    backgroundColor: "#171D19",
    borderColor: "#27332B",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },

  topBarTitle: {
    alignItems: "center",
  },

  eyebrow: {
    color: "#00FF66",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },

  topBarSubtitle: {
    color: "#D8DED9",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  iconButtonSpacer: {
    height: 44,
    width: 44,
  },

  artworkStage: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
    marginTop: 14,
  },

  artworkGlow: {
    backgroundColor: "rgba(0, 255, 102, 0.13)",
    position: "absolute",
    transform: [{ rotate: "-8deg" }],
  },

  artwork: {
    backgroundColor: "#171D19",
    elevation: 16,
    shadowColor: "#00FF66",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },

  trackHeader: {
    alignItems: "center",
    marginBottom: 22,
  },

  trackTitle: {
    color: "#F5F7F5",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    textAlign: "center",
  },

  trackArtist: {
    color: "#A6AEA8",
    fontSize: 15,
    marginTop: 7,
    textAlign: "center",
  },

  albumChip: {
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#141B16",
    borderColor: "#253329",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    maxWidth: "90%",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  albumChipText: {
    color: "#C2CBC4",
    fontSize: 12,
    marginLeft: 6,
  },

  playerCard: {
    backgroundColor: "#121713",
    borderColor: "#202A23",
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 19,
  },

  playerStatusRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 19,
  },

  playingIndicator: {
    backgroundColor: "#00FF66",
    borderRadius: 4,
    height: 7,
    marginRight: 9,
    width: 7,
  },

  playerStatus: {
    color: "#A6AEA8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  progressTrack: {
    backgroundColor: "#354038",
    borderRadius: 4,
    height: 5,
    justifyContent: "center",
    overflow: "visible",
    position: "relative",
    width: "100%",
  },

  progressPressed: {
    opacity: 0.75,
  },

  progressFill: {
    backgroundColor: "#00FF66",
    borderRadius: 4,
    height: 5,
  },

  progressThumb: {
    backgroundColor: "#F5FFF7",
    borderColor: "#00FF66",
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    marginLeft: -6,
    position: "absolute",
    width: 12,
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  playerTime: {
    color: "#8E9891",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },

  controls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 17,
  },

  skipButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 56,
  },

  skipLabel: {
    color: "#A6AEA8",
    fontSize: 9,
    fontWeight: "700",
    marginTop: -7,
  },

  playButton: {
    alignItems: "center",
    backgroundColor: "#00FF66",
    borderRadius: 34,
    elevation: 6,
    height: 66,
    justifyContent: "center",
    shadowColor: "#00FF66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    width: 66,
  },

  playButtonDisabled: {
    backgroundColor: "#29332B",
    elevation: 0,
    shadowOpacity: 0,
  },

  playButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },

  audioHint: {
    color: "#9DA79F",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    textAlign: "center",
  },

  audioError: {
    color: "#FF8989",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: "center",
  },

  aboutCard: {
    backgroundColor: "#121713",
    borderColor: "#202A23",
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },

  aboutHeading: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12,
  },

  aboutIcon: {
    alignItems: "center",
    backgroundColor: "#1C2A20",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    marginRight: 10,
    width: 32,
  },

  aboutTitle: {
    color: "#F5F7F5",
    fontSize: 15,
    fontWeight: "800",
  },

  description: {
    color: "#A6AEA8",
    fontSize: 13,
    lineHeight: 21,
  },

  aboutDivider: {
    backgroundColor: "#29332B",
    height: 1,
    marginVertical: 15,
  },

  albumInfoRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  albumInfoLabel: {
    color: "#778179",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  albumInfoValue: {
    color: "#D8DED9",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 12,
    textAlign: "right",
  },

  errorState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 28,
  },

  errorIcon: {
    alignItems: "center",
    backgroundColor: "#17221A",
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    marginBottom: 18,
    width: 60,
  },

  errorTitle: {
    color: "#F5F7F5",
    fontSize: 22,
    fontWeight: "900",
  },

  errorDescription: {
    color: "#A6AEA8",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },

  secondaryButton: {
    backgroundColor: "#1A241D",
    borderColor: "#314536",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },

  pressed: {
    opacity: 0.78,
  },

  secondaryButtonText: {
    color: "#D8DED9",
    fontSize: 14,
    fontWeight: "700",
  },
});
