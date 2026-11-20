import AsyncStorage from "@react-native-async-storage/async-storage";
import { songs } from "./songs";

const LEGACY_HOME_STATE_KEY = "@spootehbai/home-state";
const HOME_STATE_KEY = (uid) => `${LEGACY_HOME_STATE_KEY}/${uid}`;
const songsById = new Map(songs.map((song) => [song.id, song]));
const homeStateListeners = new Set();
// Keep recent tracks and resume positions across app launches.
let homeState = {
  recentSongIds: [],
  continueListening: [],
};
let homeStateLoadPromise = null;
let homeStateUserId = null;

function getSongById(id) {
  const song = songsById.get(id);

  if (!song) {
    throw new Error(`Unknown song ID in home data: ${id}`);
  }

  return song;
}

export function getSongsByIds(ids) {
  return ids.map(getSongById);
}

export function getHomeState() {
  return {
    recentlyPlayed: getSongsByIds(homeState.recentSongIds),
    continueListening: homeState.continueListening.map((item) => ({
      ...item,
      progress: item.currentTime / item.duration,
      song: getSongById(item.songId),
    })),
  };
}

function publishHomeState() {
  const snapshot = getHomeState();
  homeStateListeners.forEach((listener) => listener(snapshot));
}

export function subscribeToHomeState(listener) {
  homeStateListeners.add(listener);
  return () => homeStateListeners.delete(listener);
}

export function loadHomeState(userId) {
  if (!userId) {
    return Promise.reject(new Error("Log in to load listening history."));
  }

  if (homeStateUserId !== userId) {
    homeStateUserId = userId;
    homeStateLoadPromise = null;
    homeState = {
      recentSongIds: [],
      continueListening: [],
    };
  }

  if (!homeStateLoadPromise) {
    homeStateLoadPromise = (async () => {
      const stateKey = HOME_STATE_KEY(userId);
      const savedState = await AsyncStorage.getItem(stateKey);
      const legacyState = savedState
        ? null
        : await AsyncStorage.getItem(LEGACY_HOME_STATE_KEY);
      const stateToLoad = savedState || legacyState;

      if (stateToLoad) {
        let parsedState;
        try {
          parsedState = JSON.parse(stateToLoad);
        } catch {
          throw new Error("Saved listening history is not valid JSON.");
        }

        if (
          !parsedState ||
          !Array.isArray(parsedState.recentSongIds) ||
          !Array.isArray(parsedState.continueListening)
        ) {
          throw new Error("Saved listening history has an invalid format.");
        }

        homeState = {
          recentSongIds: [...new Set(
            parsedState.recentSongIds.filter(
              (id) => typeof id === "string" && songsById.has(id)
            )
          )].slice(0, 5),
          continueListening: parsedState.continueListening
            .filter((item) =>
              item &&
              typeof item.songId === "string" &&
              songsById.has(item.songId) &&
              Number.isFinite(item.currentTime) &&
              Number.isFinite(item.duration) &&
              item.duration > 0 &&
              item.currentTime > 0 &&
              item.currentTime < item.duration
            )
            .slice(0, 5),
        };
      }

      if (legacyState) {
        await AsyncStorage.setItem(stateKey, legacyState);
        await AsyncStorage.removeItem(LEGACY_HOME_STATE_KEY);
      }

      publishHomeState();
      return getHomeState();
    })().catch((error) => {
      homeStateLoadPromise = null;
      throw error;
    });
  }

  return homeStateLoadPromise;
}

async function persistHomeState(userId) {
  try {
    if (!userId || userId !== homeStateUserId) {
      throw new Error("Listening history has no active account.");
    }
    await AsyncStorage.setItem(
      HOME_STATE_KEY(userId),
      JSON.stringify(homeState)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not save listening history: ${message}`);
  }
}

function moveSongToRecent(songId) {
  homeState.recentSongIds = [
    songId,
    ...homeState.recentSongIds.filter((recentId) => recentId !== songId),
  ].slice(0, 5);
}

export async function recordPlaybackStarted(songId, userId) {
  getSongById(songId);
  await loadHomeState(userId);
  moveSongToRecent(songId);
  publishHomeState();
  await persistHomeState(userId);
}

export async function savePlaybackProgress(songId, currentTime, duration, userId) {
  getSongById(songId);

  if (
    !Number.isFinite(currentTime) ||
    !Number.isFinite(duration) ||
    currentTime < 0 ||
    duration <= 0
  ) {
    throw new Error("Cannot save invalid playback progress.");
  }

  await loadHomeState(userId);
  moveSongToRecent(songId);

  if (currentTime >= duration - 1) {
    homeState.continueListening = homeState.continueListening.filter(
      (item) => item.songId !== songId
    );
  } else if (currentTime > 0) {
    homeState.continueListening = [
      { songId, currentTime, duration },
      ...homeState.continueListening.filter((item) => item.songId !== songId),
    ].slice(0, 5);
  }

  publishHomeState();
  await persistHomeState(userId);
}

export async function clearListeningHistory(userId) {
  await loadHomeState(userId);
  const previousState = homeState;
  homeState = {
    recentSongIds: [],
    continueListening: [],
  };
  publishHomeState();

  try {
    await AsyncStorage.removeItem(LEGACY_HOME_STATE_KEY);
    await persistHomeState(userId);
  } catch (error) {
    homeState = previousState;
    publishHomeState();
    throw error;
  }
}

export const madeForYouPlaylist = {
  id: "made-for-you",
  title: "Your Daily Mix",
  description: "A personal mix from your playlist.",
  songIds: songs.map((song) => song.id),
  image: songs[0]?.image,
};

// Curated groups are mock playlists until the project has playlist metadata.
const playlistSeeds = [
  {
    id: "local-favorites",
    title: "Local Favorites",
    description: "Homegrown songs to keep on repeat.",
    songIds: ["1", "2", "3"],
  },
  {
    id: "soft-moments",
    title: "Soft Moments",
    description: "Easy listening for a slower day.",
    songIds: ["2", "4", "5"],
  },
];

export const recommendedPlaylists = playlistSeeds.map((playlist) => ({
  ...playlist,
  songs: getSongsByIds(playlist.songIds),
  image: getSongById(playlist.songIds[0]).image,
}));

// Mock release picks stay explicit until the catalog has release-date metadata.
export const newReleases = getSongsByIds(["5", "4", "3"]);

// Tags are mock assignments until genre and mood metadata is added to songs.
export const genreMoods = [
  { id: "vispop", label: "Vispop", songIds: ["1", "2", "3"] },
  { id: "love", label: "Love", songIds: ["1", "4", "5"] },
  { id: "chill", label: "Chill", songIds: ["2", "3", "5"] },
  { id: "acoustic", label: "Acoustic", songIds: ["2", "4", "5"] },
];

export const trendingSongs = songs.map((song, index) => ({
  ...song,
  rank: index + 1,
}));

// Use each artist's available track artwork until portrait images are added.
const artistsByName = new Map();
songs.forEach((song) => {
  if (!artistsByName.has(song.artist)) {
    artistsByName.set(song.artist, {
      id: song.id,
      name: song.artist,
      image: song.image,
    });
  }
});

export const popularArtists = [...artistsByName.values()];
