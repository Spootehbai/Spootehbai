import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Audio } from "expo-av";
import { songs } from "../data/songs";

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const soundRef = useRef(null);
  const [queue, setQueue] = useState(songs);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("playlist");

  const currentSong = queue[currentIndex] || null;

  const loadSong = useCallback(async (index, shouldPlay = true) => {
    if (!queue[index]) return;

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setPosition(0);
    setDuration(queue[index].durationSeconds * 1000);

    if (!queue[index].audioUrl) {
      setIsPlaying(shouldPlay);
      return;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: queue[index].audioUrl },
      { volume, shouldPlay },
      true
    );
    soundRef.current = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || queue[index].durationSeconds * 1000);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        if (repeat === "song") {
          sound.replayAsync();
        } else {
          setCurrentIndex((previous) => {
            if (shuffle) {
              return previous >= queue.length - 1
                ? 0
                : Math.floor(Math.random() * queue.length);
            }
            return previous < queue.length - 1 ? previous + 1 : 0;
          });
        }
      }
    });
  }, [queue, repeat, shuffle, volume]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1,
      interruptionModeAndroid: 1,
      shouldDuckAndroid: true,
    }).catch(() => {});

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (queue[currentIndex]?.audioUrl) {
      loadSong(currentIndex, isPlaying);
    }
  }, [currentIndex]);

  const playSong = useCallback(async (index) => {
    if (index === currentIndex && soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
      return;
    }
    setCurrentIndex(index);
    await loadSong(index, true);
  }, [currentIndex, loadSong]);

  const togglePlayback = useCallback(async () => {
    if (!currentSong) return;

    if (!soundRef.current) {
      await loadSong(currentIndex, !isPlaying);
      return;
    }
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, [currentIndex, currentSong, isPlaying, loadSong]);

  const next = useCallback(async () => {
    if (!queue.length) return;
    const nextIndex = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIndex);
  }, [currentIndex, queue.length, shuffle]);

  const previous = useCallback(async () => {
    if (!queue.length) return;
    if (position > 3000) {
      await soundRef.current?.setPositionAsync(0);
      setPosition(0);
      return;
    }
    setCurrentIndex((currentIndex - 1 + queue.length) % queue.length);
  }, [currentIndex, queue.length, position]);

  const seek = useCallback(async (nextPosition) => {
    setPosition(nextPosition);
    await soundRef.current?.setPositionAsync(nextPosition);
  }, []);

  const changeVolume = useCallback(async (nextVolume) => {
    const safeVolume = Math.max(0, Math.min(1, nextVolume));
    setVolume(safeVolume);
    await soundRef.current?.setVolumeAsync(safeVolume);
  }, []);

  const addToQueue = useCallback((song) => {
    setQueue((existing) =>
      existing.some((item) => item.id === song.id)
        ? existing
        : [...existing, song]
    );
  }, []);

  const removeFromQueue = useCallback((index) => {
    setQueue((existing) => {
      if (existing.length <= 1) return existing;
      const removed = existing[index];
      if (removed?.id === currentSong?.id) {
        setCurrentIndex((existingIndex) =>
          existingIndex >= existing.length - 1 ? 0 : existingIndex
        );
      } else if (index < currentIndex) {
        setCurrentIndex((existingIndex) => existingIndex - 1);
      }
      return existing.filter((_, itemIndex) => itemIndex !== index);
    });
  }, [currentIndex, currentSong]);

  const cycleRepeat = useCallback(() => {
    setRepeat((mode) =>
      mode === "off" ? "playlist" : mode === "playlist" ? "song" : "off"
    );
  }, []);

  const value = useMemo(() => ({
    queue,
    currentIndex,
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
    removeFromQueue,
  }), [
    queue, currentIndex, currentSong, isPlaying, position, duration,
    volume, shuffle, repeat, playSong, togglePlayback, next, previous,
    seek, changeVolume, cycleRepeat, addToQueue, removeFromQueue,
  ]);

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used inside MusicProvider");
  return context;
}
