import { songs as bundledSongs } from "./songs";
import {
  didRemoteSongsFetchFail,
  fetchRemoteSongsMapped,
} from "./apiSongs";

let remoteSongs = [];
let loaded = false;
let loadPromise = null;
let loadFailed = false;

export function loadCatalog() {
  if (loaded) {
    return Promise.resolve();
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      remoteSongs = await fetchRemoteSongsMapped();
      loadFailed = didRemoteSongsFetchFail();
      loaded = true;
    })().finally(() => {
      loadPromise = null;
    });
  }

  return loadPromise;
}

export function getAllSongs() {
  const seenIds = new Set(bundledSongs.map((song) => String(song.id)));
  const uniqueRemoteSongs = remoteSongs.filter((song) => {
    if (seenIds.has(song.id)) {
      return false;
    }

    seenIds.add(song.id);
    return true;
  });

  return [...bundledSongs, ...uniqueRemoteSongs];
}

export function getSongById(id) {
  const songId = String(id);
  return (
    bundledSongs.find((song) => String(song.id) === songId) ||
    remoteSongs.find((song) => song.id === songId) ||
    null
  );
}

export function didCatalogLoadFail() {
  return loadFailed;
}
