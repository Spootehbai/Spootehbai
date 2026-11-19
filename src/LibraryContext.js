import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

const LibraryContext = createContext(null);

const STORAGE_KEY = "@spootehbai/music-library/v1";

const initialLibrary = {
    likedSongs: [],
    savedAlbums: [],
    followedArtists: [],
    playlists: [],
    recentPlays: []
};

export function LibraryProvider({ children }) {
    const [library, setLibrary] = useState(initialLibrary);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let active = true;

        async function loadLibrary() {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);

                if (saved && active) {
                    const parsed = JSON.parse(saved);

                    if (parsed && typeof parsed === "object") {
                        const restored = {};

                        Object.keys(initialLibrary).forEach((key) => {
                            if (Array.isArray(parsed[key])) {
                                restored[key] = parsed[key];
                            } else {
                                restored[key] = [];
                            }
                        });

                        setLibrary(restored);
                    }
                }
            } catch (error) {
                console.warn("Failed to load library:", error);
            } finally {
                if (active) {
                    setReady(true);
                }
            }
        }

        loadLibrary();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!ready) {
            return;
        }

        async function saveLibrary() {
            try {
                await AsyncStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(library)
                );
            } catch (error) {
                console.warn("Failed to save library:", error);
            }
        }

        saveLibrary();
    }, [library, ready]);

    function toggleItem(collection, item) {
        if (!ready || !item || item.id == null) {
            return;
        }

        const id = String(item.id);

        setLibrary((previous) => {
            const exists = previous[collection].some(
                (entry) => String(entry.id) === id
            );

            let updated;

            if (exists) {
                updated = previous[collection].filter(
                    (entry) => String(entry.id) !== id
                );
            } else {
                updated = [{
                        ...item,
                        id: id,
                        addedAt: new Date().toISOString()
                    },
                    ...previous[collection]
                ];
            }

            return {
                ...previous,
                [collection]: updated
            };
        });
    }

    function toggleLikedSong(song) {
        toggleItem("likedSongs", song);
    }

    function isLiked(id) {
        return library.likedSongs.some(
            (song) => String(song.id) === String(id)
        );
    }

    function toggleSavedAlbum(album) {
        toggleItem("savedAlbums", album);
    }

    function isAlbumSaved(id) {
        return library.savedAlbums.some(
            (album) => String(album.id) === String(id)
        );
    }

    function toggleFollowArtist(artist) {
        toggleItem("followedArtists", artist);
    }

    function isFollowing(id) {
        return library.followedArtists.some(
            (artist) => String(artist.id) === String(id)
        );
    }

    function addPlaylist(playlist) {
        if (!ready || !playlist || playlist.id == null) {
            return;
        }

        const id = String(playlist.id);

        setLibrary((previous) => {
            const exists = previous.playlists.some(
                (entry) => String(entry.id) === id
            );

            if (exists) {
                return previous;
            }

            return {
                ...previous,
                playlists: [{
                        ...playlist,
                        id: id,
                        pinned: false,
                        addedAt: new Date().toISOString()
                    },
                    ...previous.playlists
                ]
            };
        });
    }

    function togglePinPlaylist(id) {
        if (!ready) return;

        setLibrary((previous) => ({
            ...previous,
            playlists: previous.playlists.map((playlist) => {
                if (String(playlist.id) === String(id)) {
                    return {
                        ...playlist,
                        pinned: !playlist.pinned
                    };
                }

                return playlist;
            })
        }));
    }

    function recordPlay(song) {
        if (!ready || !song || song.id == null) {
            return;
        }

        const id = String(song.id);

        setLibrary((previous) => {
            const history = previous.recentPlays.filter(
                (item) => String(item.id) !== id
            );

            return {
                ...previous,
                recentPlays: [{
                        ...song,
                        id: id,
                        playedAt: new Date().toISOString()
                    },
                    ...history
                ].slice(0, 100)
            };
        });
    }

    const value = {
        ...library,
        ready,
        toggleLikedSong,
        isLiked,
        toggleSavedAlbum,
        isAlbumSaved,
        toggleFollowArtist,
        isFollowing,
        addPlaylist,
        togglePinPlaylist,
        recordPlay
    };

    return React.createElement(
        LibraryContext.Provider, { value: value },
        children
    );
}

export function useLibrary() {
    const context = useContext(LibraryContext);

    if (context === null) {
        throw new Error(
            "useLibrary must be used inside LibraryProvider"
        );
    }

    return context;
}