
import { useEffect, useState } from "react";

import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  NavigationContainer,
  NavigationIndependentTree,
  DefaultTheme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../data/AuthContext";

import {
  genreMoods,
  clearListeningHistory,
  getHomeState,
  loadHomeState,
  madeForYouPlaylist,
  newReleases,
  popularArtists,
  recommendedPlaylists,
  subscribeToHomeState,
  trendingSongs,
} from "../data/home";
import {
  demoMessages,
  getProfileState,
  loadProfileState,
  profileUpdates,
  saveProfileDetails,
  subscribeToProfile,
  updateProfileSetting,
} from "../data/profile";
import {
  getFollowedUserIds,
  loadFollowedUsers,
  subscribeToFollowedUsers,
  suggestedUsers,
  toggleFollowUser,
} from "../data/social";
import { songs } from "../data/songs";

const Tab = createBottomTabNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#00FF66",
    background: "#000000",
    card: "#111111",
    text: "#FFFFFF",
    border: "#333333",
    notification: "#00FF66",
  },
};

function openSong(song, autoplay = false, startAt = 0) {
  router.push({
    pathname: "/details/[id]",
    params: {
      id: song.id,
      ...(autoplay ? { autoplay: "true" } : {}),
      ...(startAt > 0 ? { startAt: String(startAt) } : {}),
    },
  });
}

function openPlaylist(playlist) {
  router.push({
    pathname: "/playlists/[id]",
    params: { id: playlist.id },
  });
}

function SongRow({ song, rank, showAlbum = false, trailing }) {
  return (
    <View style={styles.songRow}>
      {rank ? <Text style={styles.rank}>{rank}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${song.title} details`}
        onPress={() => openSong(song)}
        style={({ pressed }) => [
          styles.songTapTarget,
          pressed && styles.pressed,
        ]}
      >
        <Image source={song.image} style={styles.rowImage} />
        <View style={styles.songInfo}>
          <Text numberOfLines={1} style={styles.songTitle}>
            {song.title}
          </Text>
          <Text numberOfLines={1} style={styles.songArtist}>
            {song.artist}
          </Text>
          {showAlbum ? (
            <Text numberOfLines={1} style={styles.album}>
              {song.album}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {trailing}
    </View>
  );
}

function SectionHeading({ title, action }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

function HomeTab() {
  const { account } = useAuth();
  const [listeningHistory, setListeningHistory] = useState(getHomeState);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [activeMoodId, setActiveMoodId] = useState(genreMoods[0]?.id);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToHomeState((nextHistory) => {
      if (isMounted) {
        setListeningHistory(nextHistory);
      }
    });

    loadHomeState(account?.uid)
      .then((loadedHistory) => {
        if (isMounted) {
          setListeningHistory(loadedHistory);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : "Could not load listening history."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setHistoryLoading(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [account?.uid]);

  const activeMood = genreMoods.find((mood) => mood.id === activeMoodId);
  const recentSongs = listeningHistory.recentlyPlayed;
  const continueListening = listeningHistory.continueListening;
  const moodSongs = activeMood
    ? activeMood.songIds
        .map((id) => songs.find((song) => song.id === id))
        .filter(Boolean)
    : [];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>SPOOTEHBAI</Text>
        <Text style={styles.title}>Good music, bai.</Text>
        <Text style={styles.subtitle}>Your playlist starts here.</Text>

        <View style={styles.section}>
          <SectionHeading title="Made for you" action="Daily mix" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${madeForYouPlaylist.title}`}
            onPress={() => openPlaylist(madeForYouPlaylist)}
            style={({ pressed }) => [
              styles.dailyMixCard,
              pressed && styles.pressed,
            ]}
          >
            <Image source={madeForYouPlaylist.image} style={styles.dailyMixImage} />
            <View style={styles.dailyMixInfo}>
              <Text style={styles.dailyMixEyebrow}>YOUR PERSONAL MIX</Text>
              <Text numberOfLines={1} style={styles.dailyMixTitle}>
                {madeForYouPlaylist.title}
              </Text>
              <Text numberOfLines={2} style={styles.dailyMixDescription}>
                {madeForYouPlaylist.description}
              </Text>
              <View style={styles.dailyMixAction}>
                <Ionicons name="play" size={13} color="#001A0A" />
                <Text style={styles.dailyMixActionText}>Explore mix</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <SectionHeading title="Recently played" action="Your history" />
          <FlatList
            data={recentSongs}
            horizontal
            keyExtractor={(song) => song.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item: song }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${song.title} details`}
                onPress={() => openSong(song)}
                style={({ pressed }) => [
                  styles.recentCard,
                  pressed && styles.pressed,
                ]}
              >
                <Image source={song.image} style={styles.recentImage} />
                <Text numberOfLines={1} style={styles.recentTitle}>
                  {song.title}
                </Text>
                <Text numberOfLines={1} style={styles.recentArtist}>
                  {song.artist}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.historyEmptyState}>
                {historyLoading ? (
                  <ActivityIndicator color="#00FF66" size="small" />
                ) : null}
                <Text style={styles.emptyHomeText}>
                  {historyError
                    ? `Listening history unavailable: ${historyError}`
                    : historyLoading
                      ? "Loading listening history..."
                      : "Play a song and it will show up here."}
                </Text>
              </View>
            }
          />
        </View>

        <View style={styles.section}>
          <SectionHeading title="Continue listening" action="Resume" />
          <FlatList
            data={continueListening}
            horizontal
            keyExtractor={(item) => item.song.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Continue ${item.song.title}`}
                onPress={() => openSong(item.song, true, item.currentTime)}
                style={({ pressed }) => [
                  styles.continueCard,
                  pressed && styles.pressed,
                ]}
              >
                <Image source={item.song.image} style={styles.continueImage} />
                <View style={styles.continueInfo}>
                  <Text numberOfLines={1} style={styles.recentTitle}>
                    {item.song.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.recentArtist}>
                    {item.song.artist}
                  </Text>
                  <View style={styles.continueProgressTrack}>
                    <View
                      style={[
                        styles.continueProgressFill,
                        { width: `${item.progress * 100}%` },
                      ]}
                    />
                  </View>
                </View>
                <Ionicons name="play-circle" size={30} color="#00FF66" />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyHomeText}>
                {historyError
                  ? `Continue listening unavailable: ${historyError}`
                  : historyLoading
                    ? "Loading listening history..."
                    : "Play a song and it will appear here."}
              </Text>
            }
          />
        </View>

        <View style={styles.section}>
          <SectionHeading title="Trending songs" action="Top tracks" />
          {trendingSongs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              rank={song.rank}
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${song.title}`}
                  accessibilityHint="Opens the player and starts playback if audio is available."
                  onPress={() => openSong(song, true)}
                  style={({ pressed }) => [
                    styles.playButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="play" size={16} color="#000000" />
                </Pressable>
              }
            />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeading title="New releases" action="Recently added" />
          <FlatList
            data={newReleases}
            horizontal
            keyExtractor={(song) => song.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item: song }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${song.title}`}
                onPress={() => openSong(song)}
                style={({ pressed }) => [
                  styles.releaseCard,
                  pressed && styles.pressed,
                ]}
              >
                <View>
                  <Image source={song.image} style={styles.releaseImage} />
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.recentTitle}>
                  {song.title}
                </Text>
                <Text numberOfLines={1} style={styles.recentArtist}>
                  {song.artist}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyHomeText}>
                New songs will appear here.
              </Text>
            }
          />
        </View>

        <View style={styles.section}>
          <SectionHeading title="Recommended playlists" action="For your mood" />
          <FlatList
            data={recommendedPlaylists}
            horizontal
            keyExtractor={(playlist) => playlist.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item: playlist }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open playlist ${playlist.title}`}
                onPress={() => openPlaylist(playlist)}
                style={({ pressed }) => [
                  styles.playlistCard,
                  pressed && styles.pressed,
                ]}
              >
                <ImageBackground
                  source={playlist.image}
                  imageStyle={styles.playlistBackgroundImage}
                  style={styles.playlistBackground}
                >
                  <View style={styles.playlistOverlay}>
                    <Text style={styles.playlistEyebrow}>SPOOTEHBAI MIX</Text>
                    <Text numberOfLines={1} style={styles.playlistTitle}>
                      {playlist.title}
                    </Text>
                    <Text numberOfLines={2} style={styles.playlistDescription}>
                      {playlist.description}
                    </Text>
                    <Text style={styles.playlistCount}>
                      {playlist.songs.length} songs
                    </Text>
                  </View>
                </ImageBackground>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyHomeText}>
                Playlists will appear here.
              </Text>
            }
          />
        </View>

        <View style={styles.section}>
          <SectionHeading title="Popular artists" action="Artists" />
          <FlatList
            data={popularArtists}
            horizontal
            keyExtractor={(artist) => artist.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item: artist }) => (
              <View style={styles.artistCard}>
                <Image source={artist.image} style={styles.artistImage} />
                <Text numberOfLines={2} style={styles.artistName}>
                  {artist.name}
                </Text>
              </View>
            )}
          />
        </View>

        <View style={styles.section}>
          <SectionHeading title="Genres and moods" action="Explore" />
          <FlatList
            data={genreMoods}
            horizontal
            keyExtractor={(mood) => mood.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodList}
            renderItem={({ item: mood }) => {
              const isSelected = mood.id === activeMoodId;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setActiveMoodId(mood.id)}
                  style={[
                    styles.moodChip,
                    isSelected && styles.moodChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.moodChipText,
                      isSelected && styles.moodChipTextSelected,
                    ]}
                  >
                    {mood.label}
                  </Text>
                </Pressable>
              );
            }}
          />
          <View style={styles.moodSongs}>
            {moodSongs.map((song) => (
              <SongRow key={song.id} song={song} />
            ))}
            {moodSongs.length === 0 ? (
              <Text style={styles.emptyHomeText}>
                No songs are tagged with this mood yet.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SearchTab() {
  const [query, setQuery] = useState("");
  const filteredSongs = songs.filter((song) =>
    `${song.title} ${song.artist} ${song.album}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.pageContent}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          accessibilityLabel="Search songs"
          placeholder="Songs, artists, albums"
          placeholderTextColor="#777777"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        <FlatList
          data={filteredSongs}
          keyExtractor={(song) => song.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item: song }) => (
            <SongRow key={song.id} song={song} showAlbum />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No songs found.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function LibraryTab() {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.pageContent}>
        <Text style={styles.title}>Your library</Text>
        <Text style={styles.subtitle}>All songs in your playlist</Text>
        <FlatList
          data={songs}
          keyExtractor={(song) => song.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: song }) => (
            <SongRow key={song.id} song={song} showAlbum />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function ProfileTab() {
  const {
    account,
    logoutAccount,
    updateCurrentAccountDisplayName,
  } = useAuth();
  const [profile, setProfile] = useState(getProfileState);
  const [draftProfile, setDraftProfile] = useState(getProfileState);
  const [recentSongs, setRecentSongs] = useState(
    () => getHomeState().recentlyPlayed
  );
  const [followedUserIds, setFollowedUserIds] = useState(getFollowedUserIds);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [followError, setFollowError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribeProfile = subscribeToProfile((nextProfile) => {
      if (isMounted) {
        setProfile(nextProfile);
      }
    });
    const unsubscribeHistory = subscribeToHomeState((nextHistory) => {
      if (isMounted) {
        setRecentSongs(nextHistory.recentlyPlayed);
      }
    });
    const unsubscribeFollowedUsers = subscribeToFollowedUsers((ids) => {
      if (isMounted) {
        setFollowedUserIds(ids);
      }
    });

    loadProfileState(account?.uid, account?.displayName)
      .then((loadedProfile) => {
        if (isMounted) {
          setProfile(loadedProfile);
          setDraftProfile(loadedProfile);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setProfileError(
            error instanceof Error ? error.message : "Could not load profile."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setProfileLoading(false);
        }
      });

    loadHomeState(account?.uid)
      .then((loadedHistory) => {
        if (isMounted) {
          setRecentSongs(loadedHistory.recentlyPlayed);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : "Could not load listening history."
          );
        }
      });

    loadFollowedUsers(account?.uid).catch((error) => {
      if (isMounted) {
        setFollowError(
          error instanceof Error ? error.message : "Could not load follows."
        );
      }
    });

    return () => {
      isMounted = false;
      unsubscribeProfile();
      unsubscribeHistory();
      unsubscribeFollowedUsers();
    };
  }, [account?.uid]);

  const updateDraft = (field, value) => {
    setDraftProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
    setProfileNotice(null);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileNotice(null);

    try {
      const savedProfile = await saveProfileDetails(account?.uid, draftProfile);
      updateCurrentAccountDisplayName(savedProfile.displayName);
      setProfile(savedProfile);
      setDraftProfile(savedProfile);
      setProfileNotice("Your profile was saved on this device.");
      setIsEditing(false);
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Could not save your profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const openProfileEditor = () => {
    setDraftProfile(profile);
    setProfileError(null);
    setProfileNotice(null);
    setIsEditing(true);
  };

  const closeProfileEditor = () => {
    setDraftProfile(profile);
    setProfileError(null);
    setIsEditing(false);
  };

  const changeSetting = async (setting, value) => {
    setProfileError(null);

    try {
      const updatedProfile = await updateProfileSetting(
        account?.uid,
        setting,
        value
      );
      setProfile(updatedProfile);
      setDraftProfile((currentProfile) => ({
        ...currentProfile,
        settings: updatedProfile.settings,
      }));
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Could not update this setting."
      );
    }
  };

  const chooseProfilePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photo permission needed",
          "Allow photo-library access to choose a profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        updateDraft("avatarUri", result.assets[0].uri);
      }
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Could not choose a photo."
      );
    }
  };

  const changeFollow = async (userId) => {
    setFollowError(null);
    try {
      const updatedIds = await toggleFollowUser(userId, account?.uid);
      setFollowedUserIds(updatedIds);
    } catch (error) {
      setFollowError(
        error instanceof Error ? error.message : "Could not update follow."
      );
    }
  };

  const confirmLogout = () => {
    Alert.alert("Log out?", "You can log back in with this device account.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        onPress: async () => {
          try {
            await logoutAccount();
            router.replace("/login");
          } catch (error) {
            Alert.alert(
              "Could not log out",
              error instanceof Error ? error.message : "Please try again."
            );
          }
        },
      },
    ]);
  };

  const confirmClearHistory = () => {
    Alert.alert(
      "Clear listening history?",
      "This removes Recently played and Continue listening from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear history",
          style: "destructive",
          onPress: async () => {
            try {
              await clearListeningHistory(account?.uid);
            } catch (error) {
              Alert.alert(
                "Could not clear history",
                error instanceof Error
                  ? error.message
                  : "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const inviteFriends = async () => {
    try {
      await Share.share({
        title: "Join me on Spootehbai",
        message:
          "Join me on Spootehbai and let's share the music we love.",
      });
    } catch (error) {
      Alert.alert(
        "Could not share invite",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  const initials = profile.displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.profilePage}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHero}>
          <View style={styles.profileAvatar}>
            {profile.avatarUri ? (
              <Image
                source={{ uri: profile.avatarUri }}
                style={styles.profileAvatarImage}
              />
            ) : (
              <Text style={styles.profileAvatarText}>{initials || "S"}</Text>
            )}
          </View>
          <View style={styles.profileHeroInfo}>
            <Text style={styles.profileEyebrow}>YOUR SPOOTEHBAI</Text>
            <Text numberOfLines={1} style={styles.profileName}>
              {profile.displayName}
            </Text>
            <Text numberOfLines={1} style={styles.profileUsername}>
              {profile.username}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            disabled={profileLoading}
            onPress={openProfileEditor}
            style={({ pressed }) => [
              styles.editProfileButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="create-outline" size={16} color="#00FF66" />
            <Text style={styles.editProfileButtonText}>
              {profileLoading ? "Loading" : "Edit"}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.profileIntro}>
          Your music space, listening history, and preferences.
        </Text>
        {profileNotice ? (
          <Text style={styles.profileSuccess}>{profileNotice}</Text>
        ) : null}
        {profileError && !isEditing ? (
          <Text accessibilityRole="alert" style={styles.profileError}>
            {profileError}
          </Text>
        ) : null}

        <Modal
          animationType="slide"
          onRequestClose={closeProfileEditor}
          transparent
          visible={isEditing}
        >
          <View style={styles.profileModalBackdrop}>
            <SafeAreaView
              edges={["top", "bottom"]}
              style={styles.profileModal}
            >
              <ScrollView
                contentContainerStyle={styles.profileModalContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.profileModalHeader}>
                  <View>
                    <Text style={styles.profileEyebrow}>YOUR SPOOTEHBAI</Text>
                    <Text style={styles.profilePanelTitle}>Edit profile</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel editing profile"
                    onPress={closeProfileEditor}
                    style={styles.profileModalClose}
                  >
                    <Ionicons name="close" size={22} color="#FFFFFF" />
                  </Pressable>
                </View>
                <View style={styles.profilePanel}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={chooseProfilePhoto}
                    style={({ pressed }) => [
                      styles.profilePhotoButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    {draftProfile.avatarUri ? (
                      <Image
                        source={{ uri: draftProfile.avatarUri }}
                        style={styles.profilePhotoPreview}
                      />
                    ) : (
                      <View style={styles.profilePhotoPlaceholder}>
                        <Ionicons
                          name="camera-outline"
                          size={20}
                          color="#00FF66"
                        />
                      </View>
                    )}
                    <View style={styles.profilePhotoCopy}>
                      <Text style={styles.profileInfoTitle}>
                        Change profile photo
                      </Text>
                      <Text style={styles.profileInfoDescription}>
                        Choose a square image from your photos.
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color="#777777" />
                  </Pressable>
                  <Text style={styles.profileFieldLabel}>DISPLAY NAME</Text>
                  <TextInput
                    accessibilityLabel="Profile display name"
                    autoCapitalize="words"
                    maxLength={40}
                    onChangeText={(value) => updateDraft("displayName", value)}
                    placeholder="Your name"
                    placeholderTextColor="#777777"
                    style={styles.profileInput}
                    value={draftProfile.displayName}
                  />
                  <Text style={styles.profileFieldLabel}>USERNAME</Text>
                  <TextInput
                    accessibilityLabel="Profile username"
                    autoCapitalize="none"
                    maxLength={25}
                    onChangeText={(value) => updateDraft("username", value)}
                    placeholder="@username"
                    placeholderTextColor="#777777"
                    style={styles.profileInput}
                    value={draftProfile.username}
                  />
                  <Text style={styles.profileFieldLabel}>BIO</Text>
                  <TextInput
                    accessibilityLabel="Profile bio"
                    maxLength={120}
                    multiline
                    onChangeText={(value) => updateDraft("bio", value)}
                    placeholder="Tell people what you love listening to"
                    placeholderTextColor="#777777"
                    style={[styles.profileInput, styles.profileBioInput]}
                    value={draftProfile.bio}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={profileSaving || profileLoading}
                    onPress={saveProfile}
                    style={({ pressed }) => [
                      styles.profileSaveButton,
                      (pressed || profileSaving) && styles.pressed,
                    ]}
                  >
                    <Text style={styles.profileSaveButtonText}>
                      {profileSaving ? "Saving..." : "Save profile"}
                    </Text>
                  </Pressable>
                  {profileError ? (
                    <Text accessibilityRole="alert" style={styles.profileError}>
                      {profileError}
                    </Text>
                  ) : null}
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>

        <View style={styles.profileSection}>
          <SectionHeading title="Your recents" action="Listening history" />
          {profile.settings.showListeningActivity ? (
            <FlatList
              data={recentSongs}
              horizontal
              keyExtractor={(song) => song.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item: song }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${song.title}`}
                  onPress={() => openSong(song)}
                  style={({ pressed }) => [
                    styles.recentCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image source={song.image} style={styles.recentImage} />
                  <Text numberOfLines={1} style={styles.recentTitle}>
                    {song.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.recentArtist}>
                    {song.artist}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyHomeText}>
                  {historyError ||
                    "Play a song and it will appear in your recents."}
                </Text>
              }
            />
          ) : (
            <Text style={styles.profileMutedText}>
              Listening activity is hidden on your profile.
            </Text>
          )}
        </View>

        <View style={styles.profileSection}>
          <SectionHeading title="Your updates" action="Spootehbai" />
          {profileUpdates.map((update) => (
            <View key={update.id} style={styles.profileInfoRow}>
              <View style={styles.profileInfoIcon}>
                <Ionicons name={update.icon} size={19} color="#00FF66" />
              </View>
              <View style={styles.profileInfoBody}>
                <View style={styles.profileInfoTitleRow}>
                  <Text style={styles.profileInfoTitle}>{update.title}</Text>
                  <Text style={styles.profileInfoTime}>{update.time}</Text>
                </View>
                <Text style={styles.profileInfoDescription}>
                  {update.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.profileSection}>
          <SectionHeading title="Discover people" action="Suggested" />
          {suggestedUsers.map((suggestedUser) => {
            const isFollowing = followedUserIds.includes(suggestedUser.id);
            return (
              <View key={suggestedUser.id} style={styles.socialUserRow}>
                <Image
                  source={suggestedUser.image}
                  style={styles.socialUserImage}
                />
                <View style={styles.profileInfoBody}>
                  <Text style={styles.profileInfoTitle}>
                    {suggestedUser.displayName}
                  </Text>
                  <Text style={styles.profileInfoDescription}>
                    {suggestedUser.username} · {suggestedUser.bio}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    isFollowing
                      ? `Unfollow ${suggestedUser.displayName}`
                      : `Follow ${suggestedUser.displayName}`
                  }
                  onPress={() => changeFollow(suggestedUser.id)}
                  style={({ pressed }) => [
                    styles.followButton,
                    isFollowing && styles.followingButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
          {followError ? (
            <Text accessibilityRole="alert" style={styles.profileError}>
              {followError}
            </Text>
          ) : null}
        </View>

        <View style={styles.profileSection}>
          <SectionHeading title="Messages" action="Demo inbox" />
          {demoMessages.map((message) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Read message from ${message.sender}`}
              key={message.id}
              onPress={() =>
                Alert.alert(message.sender, message.body, [{ text: "Done" }])
              }
              style={({ pressed }) => [
                styles.messageRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.messageIcon}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={19}
                  color="#00FF66"
                />
              </View>
              <View style={styles.profileInfoBody}>
                <View style={styles.profileInfoTitleRow}>
                  <Text style={styles.profileInfoTitle}>{message.sender}</Text>
                  <Text style={styles.profileInfoTime}>{message.time}</Text>
                </View>
                <Text numberOfLines={2} style={styles.profileInfoDescription}>
                  {message.preview}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#777777" />
            </Pressable>
          ))}
          <Text style={styles.profileFootnote}>
            Sample inbox content; chat delivery is not connected yet.
          </Text>
        </View>

        <View style={styles.profileSection}>
          <SectionHeading title="Account settings" action="Local account" />
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIcon}>
              <Ionicons name="mail-outline" size={19} color="#00FF66" />
            </View>
            <View style={styles.profileInfoBody}>
              <Text style={styles.profileInfoTitle}>Email address</Text>
              <Text style={styles.profileInfoDescription}>
                {account?.email || "No local account"}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/change-password")}
            style={({ pressed }) => [
              styles.accountActionRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="key-outline" size={19} color="#00FF66" />
            <Text style={styles.accountActionText}>Change password</Text>
            <Ionicons name="chevron-forward" size={17} color="#777777" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={confirmLogout}
            style={({ pressed }) => [
              styles.accountActionRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={19} color="#D9D9D9" />
            <Text style={styles.accountActionText}>Log out</Text>
            <Ionicons name="chevron-forward" size={17} color="#777777" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/delete-account")}
            style={({ pressed }) => [
              styles.accountActionRow,
              styles.deleteAccountRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="trash-outline" size={19} color="#FF7777" />
            <Text style={styles.deleteAccountText}>Delete account</Text>
            <Ionicons name="chevron-forward" size={17} color="#777777" />
          </Pressable>
        </View>

        <View style={styles.profileSection}>
          <SectionHeading title="Settings & privacy" action="On this device" />
          <ProfileSettingRow
            title="Private profile"
            description="Keep your profile private when sharing is added."
            value={profile.settings.privateProfile}
            onValueChange={(value) => changeSetting("privateProfile", value)}
          />
          <ProfileSettingRow
            title="Show listening activity"
            description="Display your recent tracks in Your recents."
            value={profile.settings.showListeningActivity}
            onValueChange={(value) =>
              changeSetting("showListeningActivity", value)
            }
          />
          <ProfileSettingRow
            title="App notifications"
            description="Save your preference for Spootehbai updates."
            value={profile.settings.notifications}
            onValueChange={(value) => changeSetting("notifications", value)}
          />
          <ProfileSettingRow
            title="Allow messages"
            description="Save your preference for future messaging."
            value={profile.settings.allowMessages}
            onValueChange={(value) => changeSetting("allowMessages", value)}
          />
          <Pressable
            accessibilityRole="button"
            onPress={confirmClearHistory}
            style={({ pressed }) => [
              styles.clearHistoryButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="trash-outline" size={18} color="#FF7777" />
            <Text style={styles.clearHistoryText}>Clear listening history</Text>
          </Pressable>
          <Text style={styles.profileFootnote}>
            Profile and privacy choices are stored locally. Online account,
            notification, and messaging services are not connected yet.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={inviteFriends}
          style={({ pressed }) => [
            styles.inviteCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.inviteIcon}>
            <Ionicons name="person-add" size={20} color="#001A0A" />
          </View>
          <View style={styles.inviteCopy}>
            <Text style={styles.inviteTitle}>Invite friends</Text>
            <Text style={styles.inviteDescription}>
              Share Spootehbai and enjoy music together.
            </Text>
          </View>
          <Ionicons name="share-outline" size={20} color="#001A0A" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileSettingRow({ title, description, value, onValueChange }) {
  return (
    <View style={styles.profileSettingRow}>
      <View style={styles.profileSettingCopy}>
        <Text style={styles.profileInfoTitle}>{title}</Text>
        <Text style={styles.profileInfoDescription}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        onValueChange={onValueChange}
        thumbColor={value ? "#00FF66" : "#BBBBBB"}
        trackColor={{ false: "#383838", true: "#176333" }}
        value={value}
      />
    </View>
  );
}

const tabIcons = {
  Home: ["home", "home-outline"],
  Search: ["search", "search-outline"],
  Library: ["library", "library-outline"],
  Profile: ["person", "person-outline"],
};

export default function HomeScreen() {
  const { account } = useAuth();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setHasSession(Boolean(account));
    setSessionChecked(true);
    if (!account) {
      router.replace("/login");
    }
  }, [account]);

  if (!sessionChecked || !hasSession) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ActivityIndicator color="#00FF66" />
      </SafeAreaView>
    );
  }

  return (
    // This route is already inside Expo Router, so keep its tab navigator independent.
    <NavigationIndependentTree>
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: "#00FF66",
            tabBarInactiveTintColor: "#777777",
            tabBarLabelStyle: styles.tabLabel,
            tabBarStyle: styles.tabBar,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={tabIcons[route.name][focused ? 0 : 1]}
                size={size}
                color={color}
              />
            ),
          })}
        >
          <Tab.Screen name="Home" component={HomeTab} />
          <Tab.Screen name="Search" component={SearchTab} />
          <Tab.Screen name="Library" component={LibraryTab} />
          <Tab.Screen name="Profile" component={ProfileTab} />
        </Tab.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  homeContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  pageContent: {
    flex: 1,
    padding: 20,
  },
  eyebrow: {
    color: "#00FF66",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginHorizontal: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    marginHorizontal: 20,
    marginTop: 8,
  },
  subtitle: {
    color: "#AAAAAA",
    fontSize: 14,
    lineHeight: 21,
    marginHorizontal: 20,
    marginTop: 6,
  },
  section: {
    marginTop: 28,
  },
  dailyMixCard: {
    alignItems: "center",
    backgroundColor: "#111A13",
    borderColor: "#203528",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    minHeight: 128,
    padding: 12,
  },
  dailyMixImage: {
    backgroundColor: "#1F1F1F",
    borderRadius: 13,
    height: 100,
    width: 100,
  },
  dailyMixInfo: {
    flex: 1,
    marginLeft: 14,
  },
  dailyMixEyebrow: {
    color: "#00FF66",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  dailyMixTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 6,
  },
  dailyMixDescription: {
    color: "#AAAAAA",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  dailyMixAction: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#00FF66",
    borderRadius: 14,
    flexDirection: "row",
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dailyMixActionText: {
    color: "#001A0A",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 5,
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    marginHorizontal: 20,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },
  sectionAction: {
    color: "#00FF66",
    fontSize: 12,
    fontWeight: "700",
  },
  horizontalList: {
    paddingHorizontal: 20,
  },
  recentCard: {
    marginRight: 14,
    width: 136,
  },
  recentImage: {
    backgroundColor: "#1F1F1F",
    borderRadius: 14,
    height: 136,
    width: 136,
  },
  recentTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 9,
  },
  recentArtist: {
    color: "#AAAAAA",
    fontSize: 12,
    marginTop: 3,
  },
  emptyHomeText: {
    color: "#888888",
    fontSize: 13,
    marginHorizontal: 20,
    paddingVertical: 18,
  },
  historyEmptyState: {
    alignItems: "center",
    flexDirection: "row",
  },
  continueCard: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 15,
    flexDirection: "row",
    marginRight: 12,
    padding: 10,
    width: 270,
  },
  continueImage: {
    backgroundColor: "#1F1F1F",
    borderRadius: 10,
    height: 70,
    width: 70,
  },
  continueInfo: {
    flex: 1,
    marginHorizontal: 10,
  },
  continueProgressTrack: {
    backgroundColor: "#333333",
    borderRadius: 2,
    height: 4,
    marginTop: 9,
    overflow: "hidden",
  },
  continueProgressFill: {
    backgroundColor: "#00FF66",
    height: "100%",
  },
  releaseCard: {
    marginRight: 14,
    width: 136,
  },
  releaseImage: {
    backgroundColor: "#1F1F1F",
    borderRadius: 14,
    height: 136,
    width: 136,
  },
  newBadge: {
    backgroundColor: "#00FF66",
    borderRadius: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: "absolute",
    top: 8,
  },
  newBadgeText: {
    color: "#001A0A",
    fontSize: 9,
    fontWeight: "900",
  },
  playlistCard: {
    borderRadius: 16,
    height: 164,
    marginRight: 14,
    overflow: "hidden",
    width: 248,
  },
  playlistBackground: {
    flex: 1,
  },
  playlistBackgroundImage: {
    borderRadius: 16,
  },
  playlistOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    flex: 1,
    justifyContent: "flex-end",
    padding: 14,
  },
  playlistEyebrow: {
    color: "#00FF66",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  playlistTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 5,
  },
  playlistDescription: {
    color: "#DDDDDD",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  playlistCount: {
    color: "#AAAAAA",
    fontSize: 10,
    marginTop: 6,
  },
  moodList: {
    paddingHorizontal: 20,
  },
  moodChip: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  moodChipSelected: {
    backgroundColor: "#003D1A",
    borderColor: "#00FF66",
  },
  moodChipText: {
    color: "#AAAAAA",
    fontSize: 12,
    fontWeight: "700",
  },
  moodChipTextSelected: {
    color: "#00FF66",
  },
  moodSongs: {
    marginTop: 14,
  },
  songRow: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 10,
    marginHorizontal: 20,
    minHeight: 76,
    padding: 10,
  },
  songTapTarget: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
  },
  rank: {
    color: "#00FF66",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    width: 24,
  },
  rowImage: {
    backgroundColor: "#1F1F1F",
    borderRadius: 10,
    height: 54,
    marginLeft: 8,
    width: 54,
  },
  songInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  songTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  songArtist: {
    color: "#00FF66",
    fontSize: 12,
    marginTop: 4,
  },
  album: {
    color: "#777777",
    fontSize: 11,
    marginTop: 3,
  },
  playButton: {
    alignItems: "center",
    backgroundColor: "#00FF66",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  artistCard: {
    alignItems: "center",
    marginRight: 18,
    width: 88,
  },
  artistImage: {
    backgroundColor: "#1F1F1F",
    borderColor: "#252525",
    borderRadius: 42,
    borderWidth: 2,
    height: 78,
    width: 78,
  },
  artistName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  searchInput: {
    backgroundColor: "#1F1F1F",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 18,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  emptyText: {
    color: "#AAAAAA",
    fontSize: 14,
    marginTop: 20,
    textAlign: "center",
  },
  profilePage: {
    paddingBottom: 36,
    paddingTop: 18,
  },
  profileHero: {
    alignItems: "center",
    flexDirection: "row",
    marginHorizontal: 20,
  },
  profileAvatar: {
    alignItems: "center",
    backgroundColor: "#12351F",
    borderColor: "#00FF66",
    borderRadius: 34,
    borderWidth: 1,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  profileAvatarText: {
    color: "#00FF66",
    fontSize: 22,
    fontWeight: "900",
  },
  profileAvatarImage: {
    borderRadius: 34,
    height: "100%",
    width: "100%",
  },
  profileHeroInfo: {
    flex: 1,
    marginLeft: 14,
  },
  editProfileButton: {
    alignItems: "center",
    backgroundColor: "#14251A",
    borderColor: "#245333",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  editProfileButtonText: {
    color: "#00FF66",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 5,
  },
  profileEyebrow: {
    color: "#00FF66",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  profileName: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 4,
  },
  profileUsername: {
    color: "#AAAAAA",
    fontSize: 13,
    marginTop: 3,
  },
  profileIntro: {
    color: "#999999",
    fontSize: 13,
    marginHorizontal: 20,
    marginTop: 14,
  },
  profilePanel: {
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 17,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 22,
    padding: 15,
  },
  profilePanelHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  profilePanelTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  profilePhotoButton: {
    alignItems: "center",
    backgroundColor: "#191919",
    borderRadius: 12,
    flexDirection: "row",
    marginBottom: 8,
    padding: 10,
  },
  profilePhotoPreview: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  profilePhotoPlaceholder: {
    alignItems: "center",
    backgroundColor: "#1A2B20",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  profilePhotoCopy: {
    flex: 1,
    marginHorizontal: 10,
  },
  profileFieldLabel: {
    color: "#999999",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 7,
    marginTop: 12,
  },
  profileInput: {
    backgroundColor: "#191919",
    borderColor: "#303030",
    borderRadius: 10,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  profileBioInput: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  profileSaveButton: {
    alignItems: "center",
    backgroundColor: "#00FF66",
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 12,
  },
  profileSaveButtonText: {
    color: "#001A0A",
    fontSize: 13,
    fontWeight: "900",
  },
  profileSuccess: {
    color: "#00FF66",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  profileError: {
    color: "#FF7777",
    fontSize: 12,
    marginTop: 10,
  },
  profileModalBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    flex: 1,
    justifyContent: "flex-end",
  },
  profileModal: {
    backgroundColor: "#090B09",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "92%",
  },
  profileModalContent: {
    paddingBottom: 24,
    paddingTop: 20,
  },
  profileModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
  },
  profileModalClose: {
    alignItems: "center",
    backgroundColor: "#202020",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  profileSection: {
    marginTop: 28,
  },
  profileMutedText: {
    color: "#888888",
    fontSize: 13,
    marginHorizontal: 20,
    paddingVertical: 14,
  },
  profileInfoRow: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 9,
    padding: 12,
  },
  profileInfoIcon: {
    alignItems: "center",
    backgroundColor: "#1A2B20",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  profileInfoBody: {
    flex: 1,
    marginLeft: 11,
  },
  profileInfoTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profileInfoTitle: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  profileInfoTime: {
    color: "#777777",
    fontSize: 10,
    marginLeft: 8,
  },
  profileInfoDescription: {
    color: "#AAAAAA",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  messageRow: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 9,
    padding: 12,
  },
  messageIcon: {
    alignItems: "center",
    backgroundColor: "#1A2B20",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  profileFootnote: {
    color: "#777777",
    fontSize: 10,
    lineHeight: 15,
    marginHorizontal: 20,
    marginTop: 5,
  },
  socialUserRow: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 9,
    padding: 11,
  },
  socialUserImage: {
    backgroundColor: "#1F1F1F",
    borderRadius: 25,
    height: 50,
    width: 50,
  },
  followButton: {
    alignItems: "center",
    backgroundColor: "#00FF66",
    borderRadius: 16,
    marginLeft: 8,
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  followingButton: {
    backgroundColor: "#222222",
    borderColor: "#444444",
    borderWidth: 1,
  },
  followButtonText: {
    color: "#001A0A",
    fontSize: 10,
    fontWeight: "900",
  },
  followingButtonText: {
    color: "#FFFFFF",
  },
  profileSettingRow: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  profileSettingCopy: {
    flex: 1,
    marginRight: 8,
  },
  clearHistoryButton: {
    alignItems: "center",
    backgroundColor: "#241414",
    borderRadius: 12,
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 8,
    padding: 13,
  },
  clearHistoryText: {
    color: "#FF7777",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 9,
  },
  accountActionRow: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 9,
    padding: 13,
  },
  accountActionText: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 11,
  },
  deleteAccountRow: {
    backgroundColor: "#241414",
  },
  deleteAccountText: {
    color: "#FF7777",
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 11,
  },
  inviteCard: {
    alignItems: "center",
    backgroundColor: "#00FF66",
    borderRadius: 16,
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 28,
    padding: 15,
  },
  inviteIcon: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  inviteCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  inviteTitle: {
    color: "#001A0A",
    fontSize: 14,
    fontWeight: "900",
  },
  inviteDescription: {
    color: "#174A2A",
    fontSize: 11,
    marginTop: 3,
  },
  tabBar: {
    backgroundColor: "#111111",
    borderTopColor: "#252525",
    height: 62,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
  },
});
