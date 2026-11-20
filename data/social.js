import AsyncStorage from "@react-native-async-storage/async-storage";
import { songs } from "./songs";

const FOLLOWED_USERS_KEY = (uid) => `@spootehbai/followed-users/${uid}`;

// Suggested listener profiles stay local until the app has a user backend.
export const suggestedUsers = [
  {
    id: "bai-beats",
    username: "@baibeats",
    displayName: "Bai Beats",
    bio: "Vispop and late-night playlists.",
    image: songs[0].image,
  },
  {
    id: "mika-mix",
    username: "@mikamix",
    displayName: "Mika Mix",
    bio: "Finding a soundtrack for every day.",
    image: songs[1].image,
  },
  {
    id: "renelong",
    username: "@renelong",
    displayName: "Renelong",
    bio: "Folk-pop and acoustic favorites.",
    image: songs[2].image,
  },
];

const listeners = new Set();
let followedUserIds = [];
let loadPromise = null;
let followedUserId = null;

function publishFollowedUsers() {
  const snapshot = [...followedUserIds];
  listeners.forEach((listener) => listener(snapshot));
}

export function getFollowedUserIds() {
  return [...followedUserIds];
}

export function subscribeToFollowedUsers(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function loadFollowedUsers(userId) {
  if (!userId) {
    return Promise.reject(new Error("Log in to load followed users."));
  }
  if (followedUserId !== userId) {
    followedUserId = userId;
    followedUserIds = [];
    loadPromise = null;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      const savedIds = await AsyncStorage.getItem(FOLLOWED_USERS_KEY(userId));
      if (savedIds) {
        let parsedIds;
        try {
          parsedIds = JSON.parse(savedIds);
        } catch {
          throw new Error("Saved followed users are not valid JSON.");
        }
        if (!Array.isArray(parsedIds)) {
          throw new Error("Saved followed users have an invalid format.");
        }
        const validIds = new Set(suggestedUsers.map((user) => user.id));
        followedUserIds = [...new Set(
          parsedIds.filter((id) => typeof id === "string" && validIds.has(id))
        )];
      }

      publishFollowedUsers();
      return getFollowedUserIds();
    })().catch((error) => {
      loadPromise = null;
      throw error;
    });
  }
  return loadPromise;
}

export async function toggleFollowUser(targetUserId, accountId) {
  if (!suggestedUsers.some((user) => user.id === targetUserId)) {
    throw new Error("This user is not available to follow.");
  }

  await loadFollowedUsers(accountId);
  const isFollowing = followedUserIds.includes(targetUserId);
  const nextIds = isFollowing
    ? followedUserIds.filter((id) => id !== targetUserId)
    : [...followedUserIds, targetUserId];

  try {
    if (!accountId || accountId !== followedUserId) {
      throw new Error("Follow list has no active account.");
    }
    await AsyncStorage.setItem(
      FOLLOWED_USERS_KEY(accountId),
      JSON.stringify(nextIds)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not save your follows: ${message}`);
  }

  followedUserIds = nextIds;
  publishFollowedUsers();
  return getFollowedUserIds();
}

export async function clearFollowedUsers(accountId) {
  if (accountId) {
    await AsyncStorage.removeItem(FOLLOWED_USERS_KEY(accountId));
  }
  followedUserIds = [];
  followedUserId = null;
  loadPromise = null;
  publishFollowedUsers();
}
