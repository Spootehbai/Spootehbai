import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_SONGS_KEY = (uid) => `@spootehbai/saved-songs/${uid}`;
const savedSongsListeners = new Set();
let savedSongIds = [];
let savedSongsLoadPromise = null;
let savedSongsUserId = null;

function publishSavedSongs() {
  const snapshot = [...savedSongIds];
  savedSongsListeners.forEach((listener) => listener(snapshot));
}

export function getSavedSongIds() {
  return [...savedSongIds];
}

export function subscribeToSavedSongs(listener) {
  savedSongsListeners.add(listener);
  return () => savedSongsListeners.delete(listener);
}

export function loadSavedSongs(userId) {
  if (!userId) {
    return Promise.reject(new Error("Log in to load your saved songs."));
  }

  if (savedSongsUserId !== userId) {
    savedSongsUserId = userId;
    savedSongsLoadPromise = null;
    savedSongIds = [];
  }

  if (!savedSongsLoadPromise) {
    const loadPromise = (async () => {
      const savedSongs = await AsyncStorage.getItem(SAVED_SONGS_KEY(userId));
      if (savedSongsUserId !== userId) {
        return [];
      }

      if (savedSongs) {
        let parsedSongIds;
        try {
          parsedSongIds = JSON.parse(savedSongs);
        } catch {
          throw new Error("Saved songs are not valid JSON.");
        }

        if (!Array.isArray(parsedSongIds)) {
          throw new Error("Saved songs have an invalid format.");
        }

        savedSongIds = [...new Set(
          parsedSongIds.filter((id) => typeof id === "string")
        )];
      }

      publishSavedSongs();
      return getSavedSongIds();
    })();

    savedSongsLoadPromise = loadPromise.catch((error) => {
      if (savedSongsUserId === userId) {
        savedSongsLoadPromise = null;
      }
      throw error;
    });
  }

  return savedSongsLoadPromise;
}

export async function toggleSavedSong(songId, userId) {
  if (typeof songId !== "string" || !songId) {
    throw new Error("A valid song is required.");
  }

  await loadSavedSongs(userId);
  if (savedSongsUserId !== userId) {
    throw new Error("Your saved-song library has no active account.");
  }

  const nextSongIds = savedSongIds.includes(songId)
    ? savedSongIds.filter((savedSongId) => savedSongId !== songId)
    : [...savedSongIds, songId];

  try {
    await AsyncStorage.setItem(
      SAVED_SONGS_KEY(userId),
      JSON.stringify(nextSongIds)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not update your library: ${message}`);
  }

  if (savedSongsUserId !== userId) {
    return nextSongIds;
  }

  savedSongIds = nextSongIds;
  publishSavedSongs();
  return getSavedSongIds();
}
