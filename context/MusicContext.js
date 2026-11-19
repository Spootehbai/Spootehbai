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

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const soundRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const queueRef = useRef(queue);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const currentIndexRef = useRef(-1);
  const [currentSong, setCurrentSong] = useState(null);
  const currentSongRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("playlist");
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const volumeRef = useRef(volume);
  const loadedSongIdRef = useRef(null);
  const loadGenerationRef = useRef(0);

  const updateCurrentSong = useCallback((song, index) => {
    currentSongRef.current = song;
    currentIndexRef.current = index;
    setCurrentSong(song);
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const loadSong = useCallback(async (song, shouldPlay = true) => {
    if (!song) return;
    const loadGeneration = ++loadGenerationRef.current;
    loadedSongIdRef.current = null;

    const previousSound = soundRef.current;
    if (previousSound) {
      await previousSound.unloadAsync();
      if (soundRef.current === previousSound) {
        soundRef.current = null;
      }
    }
    if (loadGeneration !== loadGenerationRef.current) return;

    setPosition(0);
    setDuration(song.durationSeconds * 1000);

    if (!song.audioUrl) {
      setIsPlaying(shouldPlay);
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.audioUrl },
        { volume: volumeRef.current, shouldPlay: false },
        null,
        true
      );
      if (loadGeneration !== loadGenerationRef.current) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      loadedSongIdRef.current = song.id;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || loadGeneration !== loadGenerationRef.current) return;
        setPosition(status.positionMillis || 0);
        setDuration(status.durationMillis || song.durationSeconds * 1000);
        setIsPlaying(status.isPlaying);

        if (status.didJustFinish) {
          if (repeatRef.current === "song") {
            sound.replayAsync();
          } else {
            const currentQueue = queueRef.current;
            const currentQueueIndex = currentQueue.findIndex(
              (queuedSong) => queuedSong.id === song.id
            );
            let nextIndex = -1;
            if (shuffleRef.current) {
              const isOnlyQueuedCurrentSong =
                currentQueue.length === 1 && currentQueueIndex === 0;
              if (currentQueueIndex === -1 && currentQueue.length > 0) {
                nextIndex = Math.floor(Math.random() * currentQueue.length);
              } else if (
                currentQueue.length > 0 &&
                (!isOnlyQueuedCurrentSong || repeatRef.current === "playlist")
              ) {
                nextIndex = currentQueueIndex;
                while (currentQueue.length > 1 && nextIndex === currentQueueIndex) {
                  nextIndex = Math.floor(Math.random() * currentQueue.length);
                }
              }
            } else if (currentQueueIndex === -1 && currentQueue.length > 0) {
              nextIndex = 0;
            } else if (currentQueueIndex < currentQueue.length - 1) {
              nextIndex = currentQueueIndex + 1;
            } else if (repeatRef.current === "playlist") {
              nextIndex = currentQueue.length > 0 ? 0 : -1;
            }

            if (nextIndex === -1) {
              setPosition(status.durationMillis || song.durationSeconds * 1000);
              setIsPlaying(false);
              return;
            }

            const nextSong = currentQueue[nextIndex];
            updateCurrentSong(nextSong, nextIndex);
            loadSong(nextSong, true);
          }
        }
      });
      if (shouldPlay) {
        await sound.playAsync();
        if (loadGeneration === loadGenerationRef.current) {
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      if (loadGeneration !== loadGenerationRef.current) return;
      console.warn("Unable to load audio:", error?.message || error);
      soundRef.current = null;
      loadedSongIdRef.current = null;
      setIsPlaying(false);
      setPosition(0);
    }
  }, [updateCurrentSong]);

  const playQueueIndex = useCallback(async (index, shouldPlay = true) => {
    if (index < 0 || index >= queueRef.current.length) return;
    const song = queueRef.current[index];
    updateCurrentSong(song, index);
    await loadSong(song, shouldPlay);
  }, [loadSong, updateCurrentSong]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1,
      interruptionModeAndroid: 1,
      shouldDuckAndroid: true,
    }).catch(() => {});

    return () => {
      loadGenerationRef.current += 1;
      soundRef.current?.unloadAsync();
    };
  }, []);

  const playSong = useCallback(async (song) => {
    if (!song) return;

    const index = queueRef.current.findIndex((item) => item.id === song.id);

    if (
      index === currentIndexRef.current &&
      soundRef.current &&
      loadedSongIdRef.current === song.id
    ) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
      return;
    }
    updateCurrentSong(song, index);
    await loadSong(song, true);
  }, [loadSong, updateCurrentSong]);

  const togglePlayback = useCallback(async () => {
    if (!currentSong) return;

    if (!soundRef.current || loadedSongIdRef.current !== currentSong.id) {
      await loadSong(currentSong, !isPlaying);
      return;
    }
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, [currentSong, isPlaying, loadSong]);

  const next = useCallback(async () => {
    const currentQueue = queueRef.current;
    const current = currentIndexRef.current;
    if (!currentQueue.length) {
      await soundRef.current?.stopAsync();
      setIsPlaying(false);
      setPosition(0);
      return;
    }

    let nextIndex = -1;
    if (shuffleRef.current && currentQueue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * currentQueue.length);
      } while (nextIndex === current);
    } else if (current === -1) {
      nextIndex = 0;
    } else if (current < currentQueue.length - 1) {
      nextIndex = current + 1;
    } else if (repeatRef.current === "playlist") {
      nextIndex = 0;
    }

    if (nextIndex === -1) {
      await soundRef.current?.stopAsync();
      setIsPlaying(false);
      setPosition(0);
    } else {
      await playQueueIndex(nextIndex, true);
    }
  }, [playQueueIndex]);

  const previous = useCallback(async () => {
    const currentQueue = queueRef.current;
    if (!currentQueue.length) return;
    if (position > 3000) {
      await soundRef.current?.setPositionAsync(0);
      setPosition(0);
      return;
    }

    const current = currentIndexRef.current;
    let previousIndex = -1;
    if (current > 0) {
      previousIndex = current - 1;
    } else if (current === 0 && repeatRef.current === "playlist") {
      previousIndex = currentQueue.length - 1;
    }

    if (previousIndex !== -1) {
      await playQueueIndex(previousIndex, true);
    }
  }, [playQueueIndex, position]);

  const seek = useCallback(async (nextPosition) => {
    const safePosition = Math.max(0, Math.min(duration, nextPosition));
    setPosition(safePosition);
    await soundRef.current?.setPositionAsync(safePosition);
  }, [duration]);

  const changeVolume = useCallback(async (nextVolume) => {
    const safeVolume = Math.max(0, Math.min(1, nextVolume));
    setVolume(safeVolume);
    await soundRef.current?.setVolumeAsync(safeVolume);
  }, []);

  const addToQueue = useCallback((song) => {
    if (!song) return false;
    if (queueRef.current.some((item) => item.id === song.id)) return false;

    const nextQueue = [...queueRef.current, song];
    queueRef.current = nextQueue;
    setQueue(nextQueue);
    if (currentSongRef.current?.id === song.id) {
      updateCurrentSong(song, nextQueue.length - 1);
    }
    return true;
  }, [updateCurrentSong]);

  const removeFromQueue = useCallback((index) => {
    const existing = queueRef.current;
    if (index < 0 || index >= existing.length) return;

    const removingCurrent = index === currentIndexRef.current;
    const nextQueue = existing.filter((_, itemIndex) => itemIndex !== index);
    queueRef.current = nextQueue;
    setQueue(nextQueue);

    if (removingCurrent && nextQueue.length > 0) {
      const nextIndex = Math.min(index, nextQueue.length - 1);
      const nextSong = nextQueue[nextIndex];
      updateCurrentSong(nextSong, nextIndex);
      loadSong(nextSong, isPlaying);
      return;
    }

    if (currentIndexRef.current > index) {
      updateCurrentSong(currentSongRef.current, currentIndexRef.current - 1);
    } else if (removingCurrent) {
      loadGenerationRef.current += 1;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
      loadedSongIdRef.current = null;
      updateCurrentSong(null, -1);
      setPosition(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [isPlaying, loadSong, updateCurrentSong]);

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
