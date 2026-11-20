import AsyncStorage from "@react-native-async-storage/async-storage";

const LEGACY_PROFILE_STORAGE_KEY = "@spootehbai/profile";
const PROFILE_STORAGE_KEY = (uid) => `${LEGACY_PROFILE_STORAGE_KEY}/${uid}`;

export const defaultProfile = {
  displayName: "Music Lover",
  username: "@musiclover",
  bio: "Always looking for a new favorite song.",
  avatarUri: null,
  settings: {
    privateProfile: false,
    showListeningActivity: true,
    notifications: true,
    allowMessages: true,
  },
};

const profileListeners = new Set();
let profileState = {
  ...defaultProfile,
  settings: { ...defaultProfile.settings },
};
let profileLoadPromise = null;
let profileUserId = null;

export const profileUpdates = [
  {
    id: "welcome",
    title: "Welcome to Spootehbai",
    description: "Your music profile is ready. Add a bio and share your favorite tracks.",
    time: "Welcome",
    icon: "sparkles-outline",
  },
  {
    id: "privacy",
    title: "Your profile, your choice",
    description: "Use Settings & Privacy to manage your local profile preferences.",
    time: "Tip",
    icon: "shield-checkmark-outline",
  },
];

export const demoMessages = [
  {
    id: "hello",
    sender: "Spootehbai",
    preview: "Welcome! Start listening and build your music profile.",
    body: "Welcome to Spootehbai. Your recent tracks and profile preferences stay on this device.",
    time: "Today",
  },
  {
    id: "share",
    sender: "Spootehbai",
    preview: "Invite a friend to share your music journey.",
    body: "Use Invite friends to share Spootehbai with someone who loves music.",
    time: "Today",
  },
];

function getProfileSnapshot() {
  return {
    ...profileState,
    settings: { ...profileState.settings },
  };
}

function publishProfile() {
  const snapshot = getProfileSnapshot();
  profileListeners.forEach((listener) => listener(snapshot));
}

export function getProfileState() {
  return getProfileSnapshot();
}

export function subscribeToProfile(listener) {
  profileListeners.add(listener);
  return () => profileListeners.delete(listener);
}

export function loadProfileState(userId, displayName = defaultProfile.displayName) {
  if (!userId) {
    return Promise.reject(new Error("Log in to load your profile."));
  }

  if (profileUserId !== userId) {
    profileUserId = userId;
    profileLoadPromise = null;
    profileState = {
      ...defaultProfile,
      displayName: displayName || defaultProfile.displayName,
      username: displayName
        ? `@${displayName.replace(/^@/, "")}`
        : defaultProfile.username,
      settings: { ...defaultProfile.settings },
    };
  }

  if (!profileLoadPromise) {
    profileLoadPromise = (async () => {
      const savedProfile = await AsyncStorage.getItem(
        PROFILE_STORAGE_KEY(userId)
      );

      if (savedProfile) {
        let parsedProfile;
        try {
          parsedProfile = JSON.parse(savedProfile);
        } catch {
          throw new Error("Saved profile is not valid JSON.");
        }

        if (
          !parsedProfile ||
          typeof parsedProfile !== "object" ||
          Array.isArray(parsedProfile)
        ) {
          throw new Error("Saved profile has an invalid format.");
        }

        profileState = {
          displayName:
            typeof parsedProfile.displayName === "string"
              ? parsedProfile.displayName
            : displayName || defaultProfile.displayName,
          username:
            typeof parsedProfile.username === "string"
              ? parsedProfile.username
              : defaultProfile.username,
          bio:
            typeof parsedProfile.bio === "string"
              ? parsedProfile.bio
              : defaultProfile.bio,
          avatarUri:
            typeof parsedProfile.avatarUri === "string"
              ? parsedProfile.avatarUri
              : null,
          settings: Object.fromEntries(
            Object.keys(defaultProfile.settings).map((key) => [
              key,
              typeof parsedProfile.settings?.[key] === "boolean"
                ? parsedProfile.settings[key]
                : defaultProfile.settings[key],
            ])
          ),
        };
      }

      publishProfile();
      return getProfileSnapshot();
    })().catch((error) => {
      profileLoadPromise = null;
      throw error;
    });
  }

  return profileLoadPromise;
}

async function saveProfileState(userId, nextState) {
  if (!userId) {
    throw new Error("Log in to save your profile.");
  }

  try {
    await AsyncStorage.setItem(
      PROFILE_STORAGE_KEY(userId),
      JSON.stringify(nextState)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not save your profile: ${message}`);
  }

  profileState = nextState;
  publishProfile();
  return getProfileSnapshot();
}

export async function saveProfileDetails(userId, details) {
  await loadProfileState(userId, details.displayName);

  const displayName = details.displayName.trim();
  const enteredUsername = details.username.trim();
  const bio = details.bio.trim();

  if (!displayName || !enteredUsername) {
    throw new Error("Display name and username are required.");
  }

  const username = enteredUsername.startsWith("@")
    ? enteredUsername
    : `@${enteredUsername}`;
  const avatarUri =
    typeof details.avatarUri === "string" || details.avatarUri === null
      ? details.avatarUri
      : profileState.avatarUri;

  return saveProfileState(userId, {
    ...profileState,
    displayName,
    username,
    bio,
    avatarUri,
  });
}

export async function updateProfileSetting(userId, setting, value) {
  if (
    !Object.prototype.hasOwnProperty.call(defaultProfile.settings, setting) ||
    typeof value !== "boolean"
  ) {
    throw new Error("Invalid profile setting.");
  }

  await loadProfileState(userId);

  return saveProfileState(userId, {
    ...profileState,
    settings: {
      ...profileState.settings,
      [setting]: value,
    },
  });
}

export async function clearProfileState(userId) {
  const keysToRemove = [LEGACY_PROFILE_STORAGE_KEY];
  if (userId) {
    keysToRemove.push(PROFILE_STORAGE_KEY(userId));
  }
  await AsyncStorage.multiRemove(keysToRemove);
  profileState = {
    ...defaultProfile,
    settings: { ...defaultProfile.settings },
  };
  profileUserId = null;
  profileLoadPromise = null;
  publishProfile();
}
