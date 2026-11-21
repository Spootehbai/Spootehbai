
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Linking,
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
import AnimatedTabButton from "../components/AnimatedTabButton.jsx";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../data/AuthContext";

import {
  clearListeningHistory,
  getHomeState,
  loadHomeState,
  subscribeToHomeState,
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
import {
  didCatalogLoadFail,
  getAllSongs,
  loadCatalog,
} from "../data/catalog";
import {
  fetchDeezerGenreTracks,
  fetchDeezerHomeData,
} from "../data/apiSongs";
import {
  loadSavedSongs,
  subscribeToSavedSongs,
  toggleSavedSong,
} from "../data/savedSongs";
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
  if (playlist.deezerUrl) {
    openDeezerLink(playlist.deezerUrl, "playlist");
    return;
  }

  router.push({
    pathname: "/playlists/[id]",
    params: { id: playlist.id },
  });
}

function openDeezerLink(url, contentType) {
  if (!url) {
    return;
  }

  Linking.openURL(url).catch((error) => {
    Alert.alert(
      `Could not open ${contentType}`,
      error instanceof Error ? error.message : "Try again later."
    );
  });
}

function SongRow({
  song,
  rank,
  showAlbum = false,
  trailing,
  isSaved,
  onToggleSaved,
  onAddToPlaylist,
  onRemoveFromPlaylist,
}) {
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
      {onToggleSaved ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isSaved
              ? `Remove ${song.title} from your library`
              : `Add ${song.title} to your library`
          }
          onPress={() => onToggleSaved(song.id)}
          style={({ pressed }) => [
            styles.savedSongButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isSaved ? "#00FF66" : "#AAAAAA"}
          />
        </Pressable>
      ) : null}
      {onAddToPlaylist ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${song.title} to a playlist`}
          onPress={() => onAddToPlaylist(song)}
          style={({ pressed }) => [
            styles.savedSongButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="ellipsis-horizontal" size={23} color="#AAAAAA" />
        </Pressable>
      ) : null}
      {onRemoveFromPlaylist ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${song.title} from playlist`}
          onPress={() => onRemoveFromPlaylist(song.id)}
          style={({ pressed }) => [
            styles.savedSongButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="ellipsis-horizontal" size={23} color="#AAAAAA" />
        </Pressable>
      ) : null}
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

function useCatalogSongs() {
  const [catalogSongs, setCatalogSongs] = useState(getAllSongs);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadCatalog()
      .then(() => {
        if (isMounted) {
          setCatalogSongs(getAllSongs());
          setLoadFailed(didCatalogLoadFail());
        }
      })
      .catch((error) => {
        console.error("Could not load the song catalog:", error);
        if (isMounted) {
          setCatalogSongs(getAllSongs());
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { catalogSongs, loading, loadFailed };
}

function useSavedSongs() {
  const { account } = useAuth();
  const [savedState, setSavedState] = useState({ userId: null, songIds: [] });
  const [loading, setLoading] = useState(Boolean(account?.uid));
  const [loadError, setLoadError] = useState(null);
  const savedSongIds =
    savedState.userId === account?.uid ? savedState.songIds : [];

  useEffect(() => {
    let isMounted = true;

    if (!account?.uid) {
      setSavedState({ userId: null, songIds: [] });
      setLoading(false);
      setLoadError(null);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);
    setLoadError(null);
    setSavedState({ userId: account.uid, songIds: [] });
    const unsubscribe = subscribeToSavedSongs((nextSongIds) => {
      if (isMounted) {
        setSavedState({ userId: account.uid, songIds: nextSongIds });
      }
    });

    loadSavedSongs(account.uid)
      .then((nextSongIds) => {
        if (isMounted) {
          setSavedState({ userId: account.uid, songIds: nextSongIds });
        }
      })
      .catch((error) => {
        console.error("Could not load saved songs:", error);
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load your saved songs."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [account?.uid]);

  const toggleSong = async (songId) => {
    if (!account?.uid) {
      Alert.alert("Log in required", "Log in to save songs to your library.");
      return;
    }

    try {
      await toggleSavedSong(songId, account.uid);
    } catch (error) {
      Alert.alert(
        "Library update failed",
        error instanceof Error ? error.message : "Could not update your library."
      );
    }
  };

  return {
    account,
    savedSongIds,
    loading,
    loadError,
    toggleSong,
  };
}

function HomeTab() {
  const { account } = useAuth();
  const [listeningHistory, setListeningHistory] = useState(getHomeState);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [deezerData, setDeezerData] = useState(null);
  const [deezerLoading, setDeezerLoading] = useState(true);
  const [deezerError, setDeezerError] = useState(null);
  const [activeGenreId, setActiveGenreId] = useState(null);
  const [genreTracks, setGenreTracks] = useState([]);
  const [genreTracksLoading, setGenreTracksLoading] = useState(false);
  const [genreTracksError, setGenreTracksError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetchDeezerHomeData()
      .then((data) => {
        if (isMounted) {
          setDeezerData(data);
          setDeezerError(
            data.failedSections.length > 0
              ? "Some Deezer Home sections could not be loaded."
              : null
          );
        }
      })
      .catch((error) => {
        console.error("Could not load Deezer Home data:", error);
        if (isMounted) {
          setDeezerError(
            error instanceof Error
              ? error.message
              : "Could not load Deezer Home data."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setDeezerLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      deezerData?.genres.length &&
      !deezerData.genres.some((genre) => genre.id === activeGenreId)
    ) {
      setActiveGenreId(deezerData.genres[0].id);
    }
  }, [activeGenreId, deezerData]);

  useEffect(() => {
    if (!activeGenreId) {
      setGenreTracks([]);
      return;
    }

    let isMounted = true;
    setGenreTracksLoading(true);
    setGenreTracksError(null);

    fetchDeezerGenreTracks(activeGenreId)
      .then((tracks) => {
        if (isMounted) {
          setGenreTracks(tracks);
        }
      })
      .catch((error) => {
        console.error("Could not load Deezer genre tracks:", error);
        if (isMounted) {
          setGenreTracks([]);
          setGenreTracksError(
            error instanceof Error
              ? error.message
              : "Could not load tracks for this genre."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setGenreTracksLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeGenreId]);

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

  const recentSongs = listeningHistory.recentlyPlayed;
  const continueListening = listeningHistory.continueListening;
  const trendingSongs = deezerData?.trendingSongs || [];
  const chartedAlbums = deezerData?.chartedAlbums || [];
  const deezerPlaylists = deezerData?.playlists || [];
  const popularArtists = deezerData?.popularArtists || [];
  const genres = deezerData?.genres || [];
  const featuredPlaylist = deezerPlaylists[0];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>SPOOTEHBAI</Text>
        <Text style={styles.title}>Good music, bai.</Text>
        <Text style={styles.subtitle}>Your playlist starts here.</Text>
        {deezerLoading ? (
          <ActivityIndicator
            color="#00FF66"
            size="small"
            style={styles.homeApiLoading}
          />
        ) : null}
        {deezerError ? (
          <Text style={[styles.catalogWarning, styles.homeApiWarning]}>
            {deezerError}
          </Text>
        ) : null}

        <View style={styles.section}>
          <SectionHeading title="Featured playlist" action="Deezer charts" />
          {featuredPlaylist ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open playlist ${featuredPlaylist.title}`}
              onPress={() => openPlaylist(featuredPlaylist)}
              style={({ pressed }) => [
                styles.dailyMixCard,
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={featuredPlaylist.image}
                style={styles.dailyMixImage}
              />
              <View style={styles.dailyMixInfo}>
                <Text style={styles.dailyMixEyebrow}>FEATURED ON DEEZER</Text>
                <Text numberOfLines={1} style={styles.dailyMixTitle}>
                  {featuredPlaylist.title}
                </Text>
                <Text numberOfLines={2} style={styles.dailyMixDescription}>
                  {featuredPlaylist.description}
                </Text>
                <View style={styles.dailyMixAction}>
                  <Ionicons name="open-outline" size={13} color="#001A0A" />
                  <Text style={styles.dailyMixActionText}>Open playlist</Text>
                </View>
              </View>
            </Pressable>
          ) : (
            <Text style={styles.emptyHomeText}>
              {deezerLoading
                ? "Loading Deezer playlists..."
                : "No featured playlist is available right now."}
            </Text>
          )}
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
                  accessibilityLabel={`Play preview of ${song.title}`}
                  accessibilityHint="Opens the player and starts playback if a preview is available."
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
          {!deezerLoading && trendingSongs.length === 0 ? (
            <Text style={styles.emptyHomeText}>
              Trending songs are unavailable right now.
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeading title="Trending albums" action="Deezer charts" />
          <FlatList
            data={chartedAlbums}
            horizontal
            keyExtractor={(album) => album.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item: album }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${album.title} on Deezer`}
                onPress={() => openDeezerLink(album.deezerUrl, "album")}
                style={({ pressed }) => [
                  styles.releaseCard,
                  pressed && styles.pressed,
                ]}
              >
                <View>
                  <Image source={album.image} style={styles.releaseImage} />
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>CHART</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.recentTitle}>
                  {album.title}
                </Text>
                <Text numberOfLines={1} style={styles.recentArtist}>
                  {album.artist}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyHomeText}>
                {deezerLoading
                  ? "Loading Deezer albums..."
                  : "Chart albums are unavailable right now."}
              </Text>
            }
          />
        </View>

        <View style={styles.section}>
          <SectionHeading title="Popular playlists" action="Deezer charts" />
          <FlatList
            data={deezerPlaylists.slice(1)}
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
                    <Text style={styles.playlistEyebrow}>DEEZER CHART</Text>
                    <Text numberOfLines={1} style={styles.playlistTitle}>
                      {playlist.title}
                    </Text>
                    <Text numberOfLines={2} style={styles.playlistDescription}>
                      {playlist.description}
                    </Text>
                    <Text style={styles.playlistCount}>
                      {playlist.songCount} songs
                    </Text>
                  </View>
                </ImageBackground>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyHomeText}>
                {deezerLoading
                  ? "Loading Deezer playlists..."
                  : "Chart playlists are unavailable right now."}
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${artist.name} on Deezer`}
                onPress={() => openDeezerLink(artist.deezerUrl, "artist")}
                style={({ pressed }) => [
                  styles.artistCard,
                  pressed && styles.pressed,
                ]}
              >
                <Image source={artist.image} style={styles.artistImage} />
                <Text numberOfLines={2} style={styles.artistName}>
                  {artist.name}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyHomeText}>
                {deezerLoading
                  ? "Loading Deezer artists..."
                  : "Popular artists are unavailable right now."}
              </Text>
            }
          />
        </View>

        <View style={styles.section}>
          <SectionHeading title="Genres" action="Deezer" />
          <FlatList
            data={genres}
            horizontal
            keyExtractor={(genre) => genre.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodList}
            renderItem={({ item: genre }) => {
              const isSelected = genre.id === activeGenreId;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setActiveGenreId(genre.id)}
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
                    {genre.label}
                  </Text>
                </Pressable>
              );
            }}
          />
          <View style={styles.moodSongs}>
            {genreTracksLoading ? (
              <ActivityIndicator color="#00FF66" size="small" />
            ) : null}
            {genreTracks.map((song) => (
              <SongRow key={song.id} song={song} />
            ))}
            {!genreTracksLoading && genreTracks.length === 0 ? (
              <Text style={styles.emptyHomeText}>
                {genreTracksError ||
                  (deezerLoading
                    ? "Loading Deezer genres..."
                    : "No tracks are available for this genre.")}
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
  const { catalogSongs, loading, loadFailed } = useCatalogSongs();
  const savedSongs = useSavedSongs();
  const savedSongIdSet = new Set(savedSongs.savedSongIds);
  const filteredSongs = catalogSongs.filter((song) =>
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
        {loading ? (
          <View style={styles.catalogLoading}>
            <ActivityIndicator color="#00FF66" />
          </View>
        ) : (
          <>
            {loadFailed ? (
              <Text style={styles.catalogWarning}>
                Showing bundled songs only
              </Text>
            ) : null}
            <FlatList
              data={filteredSongs}
              keyExtractor={(song) => song.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item: song }) => (
                <SongRow
                  key={song.id}
                  song={song}
                  showAlbum
                  isSaved={savedSongIdSet.has(song.id)}
                  onToggleSaved={savedSongs.toggleSong}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No songs found.</Text>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function LibraryTab() {
  const { catalogSongs, loading, loadFailed } = useCatalogSongs();
  const savedSongs = useSavedSongs();
  const accountId = savedSongs.account?.uid;
  const [libraryView, setLibraryView] = useState("all");
  const [playlists, setPlaylists] = useState([]);
  const [playlistOwner, setPlaylistOwner] = useState(null);
  const [playlistLoading, setPlaylistLoading] = useState(true);
  const [playlistError, setPlaylistError] = useState(null);
  const [playlistName, setPlaylistName] = useState("");
  const [createVisible, setCreateVisible] = useState(false);
  const [addSong, setAddSong] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [playlistSaving, setPlaylistSaving] = useState(false);
  const [playlistMenu, setPlaylistMenu] = useState(null);
  const [renamePlaylist, setRenamePlaylist] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [addSongsVisible, setAddSongsVisible] = useState(false);
  const [songSearch, setSongSearch] = useState("");
  const [songAction, setSongAction] = useState(null);

  const storageKey = accountId ? `spootehbai:playlists:${accountId}` : null;

  useEffect(() => {
    let active = true;
    setPlaylistLoading(true);
    setPlaylistOwner(null);
    setPlaylists([]);
    setActivePlaylistId(null);
    setPlaylistError(null);

    if (!storageKey) {
      setPlaylistLoading(false);
      return () => { active = false; };
    }

    AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (!active) return;
        const parsed = value ? JSON.parse(value) : [];
        setPlaylists(Array.isArray(parsed) ? parsed : []);
        setPlaylistOwner(storageKey);
      })
      .catch((error) => {
        if (active) {
          setPlaylistError("Could not load your playlists on this device.");
          console.error("Playlist loading failed:", error);
        }
      })
      .finally(() => {
        if (active) setPlaylistLoading(false);
      });

    return () => { active = false; };
  }, [storageKey]);

  const playlistsReady = Boolean(storageKey && playlistOwner === storageKey && !playlistLoading);
  const selectedPlaylist = playlists.find((playlist) => playlist.id === activePlaylistId);
  const savedSongIdSet = new Set(savedSongs.savedSongIds);
  const displayedSongs =
    libraryView === "saved"
      ? catalogSongs.filter((song) => savedSongIdSet.has(song.id))
      : libraryView === "playlist" && selectedPlaylist
        ? catalogSongs.filter((song) => selectedPlaylist.songIds.includes(song.id))
        : catalogSongs;
  const isListLoading = loading || (libraryView === "saved" && savedSongs.loading);

  // Save first, then update the visible list, so failed writes do not appear successful.
  const savePlaylists = async (nextPlaylists) => {
    if (!playlistsReady || playlistSaving) return false;
    setPlaylistSaving(true);
    setPlaylistError(null);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextPlaylists));
      setPlaylists(nextPlaylists);
      return true;
    } catch (error) {
      console.error("Playlist saving failed:", error);
      setPlaylistError("Could not save playlist changes. Please try again.");
      Alert.alert("Couldn't save", "Your playlist changes couldn't be saved on this device.");
      return false;
    } finally {
      setPlaylistSaving(false);
    }
  };

  const createPlaylist = async () => {
    const name = playlistName.trim();
    if (!name) {
      Alert.alert("Playlist name needed", "Enter a name for your playlist.");
      return;
    }
    if (name.length > 50) {
      Alert.alert("Name too long", "Use 50 characters or fewer.");
      return;
    }
    const newPlaylist = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      name,
      songIds: [],
    };
    if (await savePlaylists([...playlists, newPlaylist])) {
      setPlaylistName("");
      setCreateVisible(false);
      setActivePlaylistId(newPlaylist.id);
      setLibraryView("playlist");
    }
  };

  const addToPlaylist = async (playlistId) => {
    if (!addSong) return;
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return;
    if (playlist.songIds.includes(addSong.id)) {
      Alert.alert("Already added", `This song is already in ${playlist.name}.`);
      return;
    }
    const nextPlaylists = playlists.map((item) =>
      item.id === playlistId
        ? { ...item, songIds: [...item.songIds, addSong.id] }
        : item
    );
    if (await savePlaylists(nextPlaylists)) {
      setAddSong(null);
      Alert.alert("Song added", `Added to ${playlist.name}.`);
    }
  };

  const addSongToCurrentPlaylist = async (song) => {
    if (!selectedPlaylist || playlistSaving) return;
    if (selectedPlaylist.songIds.includes(song.id)) return;
    await savePlaylists(playlists.map((item) =>
      item.id === selectedPlaylist.id
        ? { ...item, songIds: [...item.songIds, song.id] }
        : item
    ));
  };

  const savePlaylistName = async () => {
    const name = renameText.trim();
    if (!renamePlaylist || !name) {
      Alert.alert("Playlist name needed", "Enter a name for your playlist.");
      return;
    }
    if (name.length > 50) return;
    if (await savePlaylists(playlists.map((item) =>
      item.id === renamePlaylist.id ? { ...item, name } : item
    ))) {
      setRenamePlaylist(null);
    }
  };

  const removeFromPlaylist = (songId) => {
    if (!selectedPlaylist) return;
    Alert.alert("Remove song?", `Remove this song from ${selectedPlaylist.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        onPress: () => savePlaylists(playlists.map((item) =>
          item.id === selectedPlaylist.id
            ? { ...item, songIds: item.songIds.filter((id) => id !== songId) }
            : item
        )),
      },
    ]);
  };

  const deletePlaylist = (playlist) => {
    Alert.alert(
      "Delete playlist?",
      `Delete "${playlist.name}"? Your songs will remain in the song catalog and Saved Songs.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (await savePlaylists(playlists.filter((item) => item.id !== playlist.id))) {
              if (activePlaylistId === playlist.id) {
                setActivePlaylistId(null);
                setLibraryView("playlists");
              }
            }
          },
        },
      ]
    );
  };

  const tabs = [
    { id: "all", title: "All songs" },
    { id: "saved", title: `Saved (${savedSongs.savedSongIds.length})` },
    { id: "playlists", title: `Playlists (${playlists.length})` },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.pageContent}>
        <Text style={styles.title}>Your library</Text>
        <Text style={styles.subtitle}>Browse, save, and organize your music.</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.libraryFilters}
          style={styles.libraryFilterScroll}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected: libraryView === tab.id || (tab.id === "playlists" && libraryView === "playlist") }}
              onPress={() => { setLibraryView(tab.id); setActivePlaylistId(null); }}
              style={[
                styles.libraryFilter,
                (libraryView === tab.id || (tab.id === "playlists" && libraryView === "playlist")) && styles.libraryFilterSelected,
              ]}
            >
              <Text style={[
                styles.libraryFilterText,
                (libraryView === tab.id || (tab.id === "playlists" && libraryView === "playlist")) && styles.libraryFilterTextSelected,
              ]}>{tab.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {savedSongs.loadError ? (
          <Text accessibilityRole="alert" style={styles.libraryError}>{savedSongs.loadError}</Text>
        ) : null}
        {playlistError ? (
          <Text accessibilityRole="alert" style={styles.libraryError}>{playlistError}</Text>
        ) : null}

        {(libraryView === "playlists" || libraryView === "playlist") ? (
          <View style={{ flex: 1 }}>
            <View style={styles.playlistToolbar}>
              {libraryView === "playlist" ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to playlists"
                  onPress={() => { setActivePlaylistId(null); setLibraryView("playlists"); }}
                  style={styles.playlistBackButton}
                >
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                  <Text style={styles.playlistBackText}>Playlists</Text>
                </Pressable>
              ) : (
                <Text style={styles.playlistHeading}>My playlists</Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create playlist"
                disabled={!playlistsReady || playlistSaving}
                onPress={() => setCreateVisible(true)}
                style={[styles.createPlaylistButton, (!playlistsReady || playlistSaving) && styles.pressed]}
              >
                <Ionicons name="add" size={18} color="#001A0A" />
                <Text style={styles.createPlaylistText}>Create playlist</Text>
              </Pressable>
            </View>
            {playlistLoading ? (
              <ActivityIndicator color="#00FF66" style={{ marginTop: 25 }} />
            ) : !accountId ? (
              <Text style={styles.emptyText}>Log in to create playlists.</Text>
            ) : libraryView === "playlist" && selectedPlaylist ? (
              <>
                <View style={styles.playlistDetailsHeader}>
                  <Text style={styles.playlistDetailsTitle}>{selectedPlaylist.name}</Text>
                  <Text style={styles.playlistDetailsCount}>{selectedPlaylist.songIds.length} songs</Text>
                  <View style={styles.spotifyPlaylistActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Add songs to this playlist"
                      onPress={() => { setSongSearch(""); setAddSongsVisible(true); }}
                      style={styles.spotifyAddSongsButton}
                    >
                      <Ionicons name="add-circle-outline" size={22} color="#001A0A" />
                      <Text style={styles.createPlaylistText}>Add songs</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Playlist options"
                      onPress={() => setPlaylistMenu(selectedPlaylist)}
                      style={styles.spotifyDotsButton}
                    >
                      <Ionicons name="ellipsis-horizontal" size={26} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
                <FlatList
                  data={displayedSongs}
                  keyExtractor={(song) => song.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: song }) => (
                    <SongRow
                      song={song}
                      showAlbum
                      onRemoveFromPlaylist={(songId) => setSongAction({ song, inPlaylist: true })}
                    />
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>No songs yet. Open All songs and tap + to add songs.</Text>}
                />
              </>
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(playlist) => playlist.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: playlist }) => (
                  <View style={styles.playlistItem}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open playlist ${playlist.name}`}
                      onPress={() => { setActivePlaylistId(playlist.id); setLibraryView("playlist"); }}
                      style={styles.playlistOpenButton}
                    >
                      <View style={styles.playlistItemIcon}>
                        <Ionicons name="musical-notes" size={21} color="#00FF66" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={styles.playlistItemTitle}>{playlist.name}</Text>
                        <Text style={styles.playlistItemSubtitle}>{playlist.songIds.length} songs</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={19} color="#888888" />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Options for ${playlist.name}`}
                      onPress={() => setPlaylistMenu(playlist)}
                      style={styles.playlistItemDelete}
                    >
                      <Ionicons name="ellipsis-horizontal" size={23} color="#FFFFFF" />
                    </Pressable>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No playlists yet. Tap Create to make your first playlist.</Text>}
              />
            )}
          </View>
        ) : isListLoading ? (
          <View style={styles.catalogLoading}><ActivityIndicator color="#00FF66" /></View>
        ) : (
          <>
            {loadFailed ? <Text style={styles.catalogWarning}>Showing bundled songs only</Text> : null}
            <FlatList
              data={displayedSongs}
              keyExtractor={(song) => song.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: song }) => (
                <SongRow
                  song={song}
                  showAlbum
                  isSaved={savedSongIdSet.has(song.id)}
                  onToggleSaved={savedSongs.toggleSong}
                  onAddToPlaylist={() => {
                    if (!playlistsReady) {
                      Alert.alert("Playlists unavailable", "Please log in and allow your playlists to load.");
                      return;
                    }
                    setSongAction({ song, inPlaylist: false });
                  }}
                />
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>
                {libraryView === "saved"
                  ? "No saved songs yet. Tap the bookmark on a song to add it."
                  : "No songs found."}
              </Text>}
            />
          </>
        )}
      </View>

      {/* Spotify-style playlist action menu */}
      <Modal visible={Boolean(playlistMenu)} transparent animationType="fade"
        onRequestClose={() => setPlaylistMenu(null)}>
        <View style={styles.spotifySheetOverlay}>
          <Pressable style={styles.spotifySheetDismiss} onPress={() => setPlaylistMenu(null)} />
          <View style={styles.spotifySheet}>
            <Text numberOfLines={1} style={styles.spotifySheetTitle}>{playlistMenu?.name}</Text>
            <Pressable style={styles.spotifySheetAction} onPress={() => {
              setRenameText(playlistMenu?.name || "");
              setRenamePlaylist(playlistMenu);
              setPlaylistMenu(null);
            }}>
              <Ionicons name="pencil-outline" size={21} color="#FFFFFF" />
              <Text style={styles.spotifySheetActionText}>Rename playlist</Text>
            </Pressable>
            <Pressable style={styles.spotifySheetAction} onPress={() => {
              const item = playlistMenu;
              setPlaylistMenu(null);
              if (item) deletePlaylist(item);
            }}>
              <Ionicons name="trash-outline" size={21} color="#FF7777" />
              <Text style={[styles.spotifySheetActionText, { color: "#FF7777" }]}>Delete playlist</Text>
            </Pressable>
            <Pressable style={styles.spotifySheetCancel} onPress={() => setPlaylistMenu(null)}>
              <Text style={styles.playlistCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Rename playlist without modifying its saved song IDs */}
      <Modal visible={Boolean(renamePlaylist)} transparent animationType="fade"
        onRequestClose={() => setRenamePlaylist(null)}>
        <View style={styles.playlistModalOverlay}>
          <View style={styles.playlistModalCard}>
            <Text style={styles.playlistModalTitle}>Rename playlist</Text>
            <TextInput value={renameText} onChangeText={setRenameText} autoFocus
              selectTextOnFocus maxLength={50} style={styles.playlistNameInput}
              placeholder="Playlist name" placeholderTextColor="#777777" />
            <View style={styles.playlistModalActions}>
              <Pressable style={styles.playlistCancelButton} onPress={() => setRenamePlaylist(null)}>
                <Text style={styles.playlistCancelText}>Cancel</Text>
              </Pressable>
              <Pressable disabled={playlistSaving} style={styles.playlistConfirmButton} onPress={savePlaylistName}>
                <Text style={styles.playlistConfirmText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Browse the catalog from inside a playlist, like Add to this playlist */}
      <Modal visible={addSongsVisible} transparent animationType="slide"
        onRequestClose={() => setAddSongsVisible(false)}>
        <SafeAreaView style={styles.spotifyAddSongsScreen}>
          <View style={styles.spotifyAddSongsHeader}>
            <Pressable onPress={() => setAddSongsVisible(false)} accessibilityLabel="Close add songs">
              <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.spotifyAddSongsTitle}>Add to this playlist</Text>
            <Pressable onPress={() => setAddSongsVisible(false)}>
              <Text style={{ color: "#00FF66", fontWeight: "800" }}>Done</Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.searchInput, { marginHorizontal: 16, marginTop: 8 }]}
            value={songSearch} onChangeText={setSongSearch}
            placeholder="Search songs or artists" placeholderTextColor="#777777"
            autoCapitalize="none" />
          <FlatList data={catalogSongs.filter((song) =>
            `${song.title} ${song.artist}`.toLowerCase().includes(songSearch.trim().toLowerCase())
          )} keyExtractor={(song) => song.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: song }) => {
              const added = Boolean(selectedPlaylist?.songIds.includes(song.id));
              return (
                <View style={styles.spotifySearchSongRow}>
                  <Image source={song.image} style={styles.spotifySearchSongImage} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.songTitle}>{song.title}</Text>
                    <Text numberOfLines={1} style={styles.recentArtist}>{song.artist}</Text>
                  </View>
                  <Pressable disabled={added || playlistSaving} accessibilityLabel={added ? "Already in playlist" : `Add ${song.title}`}
                    onPress={() => addSongToCurrentPlaylist(song)} style={styles.spotifyDotsButton}>
                    <Ionicons name={added ? "checkmark-circle" : "add-circle-outline"}
                      size={27} color={added ? "#00FF66" : "#FFFFFF"} />
                  </Pressable>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>No matching songs found.</Text>} />
        </SafeAreaView>
      </Modal>

      {/* Context actions on individual songs */}
      <Modal visible={Boolean(songAction)} transparent animationType="fade"
        onRequestClose={() => setSongAction(null)}>
        <View style={styles.spotifySheetOverlay}>
          <Pressable style={styles.spotifySheetDismiss} onPress={() => setSongAction(null)} />
          <View style={styles.spotifySheet}>
            <Text numberOfLines={1} style={styles.spotifySheetTitle}>{songAction?.song.title}</Text>
            {songAction?.inPlaylist ? (
              <Pressable style={styles.spotifySheetAction} onPress={() => {
                const songId = songAction.song.id;
                setSongAction(null);
                removeFromPlaylist(songId);
              }}>
                <Ionicons name="remove-circle-outline" size={22} color="#FFFFFF" />
                <Text style={styles.spotifySheetActionText}>Remove from this playlist</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.spotifySheetAction} onPress={() => {
                const song = songAction.song;
                setSongAction(null);
                setAddSong(song);
              }}>
                <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
                <Text style={styles.spotifySheetActionText}>Add to playlist</Text>
              </Pressable>
            )}
            <Pressable style={styles.spotifySheetCancel} onPress={() => setSongAction(null)}>
              <Text style={styles.playlistCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={createVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateVisible(false)}
      >
        <View style={styles.playlistModalOverlay}>
          <View style={styles.playlistModalCard}>
            <Text style={styles.playlistModalTitle}>Create playlist</Text>
            <Text style={styles.playlistModalHint}>Give your new playlist a name.</Text>
            <TextInput
              accessibilityLabel="New playlist name"
              value={playlistName}
              onChangeText={setPlaylistName}
              placeholder="e.g. My favorites"
              placeholderTextColor="#777777"
              maxLength={50}
              autoFocus
              style={styles.playlistNameInput}
            />
            <View style={styles.playlistModalActions}>
              <Pressable onPress={() => { setCreateVisible(false); setPlaylistName(""); }} style={styles.playlistCancelButton}>
                <Text style={styles.playlistCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={playlistSaving || !playlistsReady}
                onPress={createPlaylist}
                style={styles.playlistConfirmButton}
              >
                <Text style={styles.playlistConfirmText}>{playlistSaving ? "Saving..." : "Create"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(addSong)}
        transparent
        animationType="fade"
        onRequestClose={() => setAddSong(null)}
      >
        <View style={styles.playlistModalOverlay}>
          <View style={styles.playlistModalCard}>
            <Text style={styles.playlistModalTitle}>Add to playlist</Text>
            <Text style={styles.playlistModalHint} numberOfLines={2}>
              {addSong ? `${addSong.title} · ${addSong.artist}` : ""}
            </Text>
            <ScrollView style={{ maxHeight: 270 }}>
              {playlists.map((playlist) => (
                <Pressable
                  key={playlist.id}
                  accessibilityRole="button"
                  disabled={playlistSaving}
                  onPress={() => addToPlaylist(playlist.id)}
                  style={styles.playlistPickerRow}
                >
                  <Ionicons name="musical-notes" size={19} color="#00FF66" />
                  <Text numberOfLines={1} style={styles.playlistPickerText}>{playlist.name}</Text>
                  {addSong && playlist.songIds.includes(addSong.id) ? (
                    <Ionicons name="checkmark" size={19} color="#00FF66" />
                  ) : (
                    <Ionicons name="add" size={19} color="#AAAAAA" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            {playlists.length === 0 ? (
              <Text style={styles.playlistModalHint}>No playlists yet. Close this menu, then tap Create playlist in Your Library.</Text>
            ) : null}
            <Pressable onPress={() => setAddSong(null)} style={styles.playlistCancelButton}>
              <Text style={styles.playlistCancelText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
            tabBarButton: (props) => <AnimatedTabButton {...props} />,
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
  spotifyPlaylistActions: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 12 },
  spotifyAddSongsButton: { flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#00FF66", borderRadius: 24, paddingHorizontal: 18, paddingVertical: 11 },
  spotifyDotsButton: { padding: 10, alignItems: "center", justifyContent: "center" },
  spotifySheetOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.58)" },
  spotifySheetDismiss: { flex: 1 },
  spotifySheet: { backgroundColor: "#202020", borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 22, paddingTop: 22, paddingBottom: 35 },
  spotifySheetTitle: { color: "#FFFFFF", fontWeight: "800", fontSize: 18, marginBottom: 12 },
  spotifySheetAction: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 17 },
  spotifySheetActionText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  spotifySheetCancel: { paddingVertical: 16, alignItems: "center", marginTop: 10,
    borderTopWidth: 1, borderTopColor: "#353535" },
  spotifyAddSongsScreen: { flex: 1, backgroundColor: "#0B0B0B" },
  spotifyAddSongsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  spotifyAddSongsTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  spotifySearchSongRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  spotifySearchSongImage: { width: 52, height: 52, borderRadius: 7, backgroundColor: "#222222" },
  playlistToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 14,
  },
  playlistHeading: { color: "#FFFFFF", fontSize: 19, fontWeight: "800" },
  createPlaylistButton: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#00FF66", paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 20,
  },
  createPlaylistText: { color: "#001A0A", fontSize: 13, fontWeight: "800" },
  playlistBackButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  playlistBackText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  playlistItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#151515",
    borderRadius: 12, marginBottom: 10,
  },
  playlistOpenButton: { flex: 1, flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  playlistItemIcon: {
    height: 43, width: 43, borderRadius: 9, backgroundColor: "#223328",
    alignItems: "center", justifyContent: "center",
  },
  playlistItemTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  playlistItemSubtitle: { color: "#999999", fontSize: 12, marginTop: 4 },
  playlistItemDelete: { paddingHorizontal: 16, paddingVertical: 18 },
  playlistDetailsHeader: { marginBottom: 14, gap: 7 },
  playlistDetailsTitle: { color: "#FFFFFF", fontSize: 23, fontWeight: "900" },
  playlistDetailsCount: { color: "#999999", fontSize: 13 },
  playlistDeleteButton: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 8 },
  playlistDeleteText: { color: "#FF7777", fontSize: 13, fontWeight: "700" },
  playlistModalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center", paddingHorizontal: 25,
  },
  playlistModalCard: { backgroundColor: "#1A1A1A", borderRadius: 18, padding: 22, gap: 14 },
  playlistModalTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "800" },
  playlistModalHint: { color: "#AAAAAA", fontSize: 13, lineHeight: 19 },
  playlistNameInput: {
    color: "#FFFFFF", backgroundColor: "#2A2A2A", borderRadius: 11,
    borderWidth: 1, borderColor: "#444444", padding: 13, fontSize: 16,
  },
  playlistModalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  playlistCancelButton: { paddingVertical: 11, paddingHorizontal: 15, alignItems: "center" },
  playlistCancelText: { color: "#CCCCCC", fontWeight: "700" },
  playlistConfirmButton: { backgroundColor: "#00FF66", paddingVertical: 11, paddingHorizontal: 21, borderRadius: 10 },
  playlistConfirmText: { color: "#001A0A", fontWeight: "800" },
  playlistPickerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomColor: "#333333", borderBottomWidth: 1,
  },
  playlistPickerText: { flex: 1, color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
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
  libraryFilterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 60,
    marginTop: 18,
    marginBottom: 14,
  },
  libraryFilters: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingRight: 12,
  },
  libraryFilter: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderColor: "#333333",
    borderRadius: 22,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  libraryFilterSelected: {
    backgroundColor: "#00FF66",
    borderColor: "#00FF66",
  },
  libraryFilterText: {
    color: "#AAAAAA",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  libraryFilterTextSelected: {
    color: "#001A0A",
  },
  libraryError: {
    color: "#FF8A8A",
    fontSize: 12,
    marginBottom: 10,
  },
  catalogLoading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  catalogWarning: {
    color: "#AAAAAA",
    fontSize: 12,
    marginBottom: 10,
  },
  homeApiLoading: {
    marginTop: 16,
  },
  homeApiWarning: {
    marginHorizontal: 20,
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
  savedSongButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginLeft: 4,
    width: 36,
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
