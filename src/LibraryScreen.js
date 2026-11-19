import React, { useMemo, useState } from "react";

import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    ScrollView,
    SafeAreaView,
    StyleSheet,
} from "react-native";

import { useLibrary } from "./LibraryContext";

const h = React.createElement;

const GREEN = "#1ED760";

const FILTERS = [
    "All",
    "Songs",
    "Albums",
    "Artists",
    "Playlists",
    "History",
];

const SORTS = [
    "Recently added",
    "Name A-Z",
    "Name Z-A",
];

export default function LibraryScreen({ onOpenItem }) {
    const lib = useLibrary();

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [sortIndex, setSortIndex] = useState(0);
    const [playlistName, setPlaylistName] = useState("");

    const items = useMemo(() => {
        const all = [];

        function add(type, entries) {
            entries.forEach((entry) => {
                all.push({
                    ...entry,
                    type: type,
                    key: type + "-" + String(entry.id),
                });
            });
        }

        if (filter === "All" || filter === "Songs") {
            add("Song", lib.likedSongs);
        }

        if (filter === "All" || filter === "Albums") {
            add("Album", lib.savedAlbums);
        }

        if (filter === "All" || filter === "Artists") {
            add("Artist", lib.followedArtists);
        }

        if (filter === "All" || filter === "Playlists") {
            add("Playlist", lib.playlists);
        }

        if (filter === "History") {
            add("Recently played", lib.recentPlays);
        }

        const query = search.trim().toLowerCase();

        const filtered = all.filter((item) => {
            const text = [
                    item.title,
                    item.name,
                    item.artist,
                    item.album,
                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(query);
        });

        filtered.sort((a, b) => {
            if (Boolean(a.pinned) !== Boolean(b.pinned)) {
                return a.pinned ? -1 : 1;
            }

            const nameA = String(a.title || a.name || "");
            const nameB = String(b.title || b.name || "");

            if (sortIndex === 1) {
                return nameA.localeCompare(nameB);
            }

            if (sortIndex === 2) {
                return nameB.localeCompare(nameA);
            }

            const dateA = a.playedAt || a.addedAt || "";
            const dateB = b.playedAt || b.addedAt || "";

            return dateB.localeCompare(dateA);
        });

        return filtered;
    }, [
        lib.likedSongs,
        lib.savedAlbums,
        lib.followedArtists,
        lib.playlists,
        lib.recentPlays,
        filter,
        search,
        sortIndex,
    ]);

    function createPlaylist() {
        const name = playlistName.trim();

        if (!name || !lib.ready) return;

        lib.addPlaylist({
            id: "playlist-" + Date.now(),
            name: name,
        });

        setPlaylistName("");
        setFilter("Playlists");
    }

    function handleItemAction(item) {
        if (item.type === "Song") {
            lib.toggleLikedSong(item);
        } else if (item.type === "Album") {
            lib.toggleSavedAlbum(item);
        } else if (item.type === "Artist") {
            lib.toggleFollowArtist(item);
        } else if (item.type === "Playlist") {
            lib.togglePinPlaylist(item.id);
        }
    }

    function getIcon(type) {
        if (type === "Song") return "♫";
        if (type === "Album") return "▣";
        if (type === "Artist") return "★";
        if (type === "Playlist") return "≡";
        return "◷";
    }

    function renderItem({ item }) {
        const title = item.title || item.name || "Untitled";

        const subtitle = [
                item.type,
                item.artist || "",
                item.pinned ? "Pinned" : "",
            ]
            .filter(Boolean)
            .join(" - ");

        return h(
            View, { style: styles.listItem },

            h(
                Pressable, {
                    style: styles.itemContent,
                    onPress: () => {
                        if (onOpenItem) onOpenItem(item);
                    },
                },

                h(
                    View, { style: styles.cover },
                    h(
                        Text, { style: styles.coverIcon },
                        getIcon(item.type)
                    )
                ),

                h(
                    View, { style: styles.itemInfo },

                    h(
                        Text, {
                            style: styles.itemTitle,
                            numberOfLines: 1,
                        },
                        title
                    ),

                    h(
                        Text, {
                            style: styles.itemSubtitle,
                            numberOfLines: 1,
                        },
                        subtitle
                    )
                )
            ),

            item.type !== "Recently played" ?
            h(
                Pressable, {
                    style: styles.action,
                    onPress: () => handleItemAction(item),
                },
                h(
                    Text, { style: styles.actionText },
                    item.type === "Playlist" ?
                    item.pinned ?
                    "📌" :
                    "○" :
                    "✓"
                )
            ) :
            null
        );
    }

    const categories = [{
            title: "Liked Songs",
            icon: "♥",
            count: lib.likedSongs.length,
            target: "Songs",
        },
        {
            title: "Recently Played",
            icon: "◷",
            count: lib.recentPlays.length,
            target: "History",
        },
        {
            title: "Saved Albums",
            icon: "▣",
            count: lib.savedAlbums.length,
            target: "Albums",
        },
        {
            title: "Followed Artists",
            icon: "★",
            count: lib.followedArtists.length,
            target: "Artists",
        },
    ];

    function renderCategory(category) {
        return h(
            Pressable, {
                key: category.title,
                style: styles.categoryCard,
                onPress: () => setFilter(category.target),
            },

            h(
                Text, { style: styles.categoryIcon },
                category.icon
            ),

            h(
                Text, { style: styles.categoryTitle },
                category.title
            ),

            h(
                Text, { style: styles.categoryCount },
                category.count + " items"
            )
        );
    }

    function renderFilter(option) {
        const selected = filter === option;

        return h(
            Pressable, {
                key: option,
                onPress: () => setFilter(option),
                style: [
                    styles.chip,
                    selected ? styles.chipActive : null,
                ],
            },
            h(
                Text, {
                    style: [
                        styles.chipText,
                        selected ? styles.chipTextActive : null,
                    ],
                },
                option
            )
        );
    }

    const header = h(
        View,
        null,

        h(
            Text, { style: styles.heading },
            "Your Library"
        ),

        h(TextInput, {
            style: styles.search,
            placeholder: "Search your library...",
            placeholderTextColor: "#999999",
            value: search,
            onChangeText: setSearch,
        }),

        h(
            View, { style: styles.createRow },

            h(TextInput, {
                style: styles.playlistInput,
                placeholder: "New playlist name",
                placeholderTextColor: "#999999",
                value: playlistName,
                onChangeText: setPlaylistName,
            }),

            h(
                Pressable, {
                    style: styles.createButton,
                    onPress: createPlaylist,
                },
                h(
                    Text, { style: styles.createText },
                    "Create"
                )
            )
        ),

        h(
            ScrollView, {
                horizontal: true,
                showsHorizontalScrollIndicator: false,
                style: styles.filterScroll,
            },
            ...FILTERS.map(renderFilter)
        ),

        h(
            Pressable, {
                style: styles.sortButton,
                onPress: () => {
                    setSortIndex((index) => {
                        return (index + 1) % SORTS.length;
                    });
                },
            },
            h(
                Text, { style: styles.sortText },
                "Sort: " + SORTS[sortIndex] + " ↕"
            )
        ),

        filter === "All" && search.trim() === "" ?
        h(
            View, { style: styles.categoryGrid },
            ...categories.map(renderCategory)
        ) :
        null,

        h(
            Text, { style: styles.sectionTitle },
            filter === "All" ?
            "Recently Added & Pinned" :
            filter
        )
    );

    return h(
        SafeAreaView, { style: styles.container },

        h(FlatList, {
            data: items,
            keyExtractor: (item) => item.key,
            renderItem: renderItem,
            ListHeaderComponent: header,
            keyboardShouldPersistTaps: "handled",
            showsVerticalScrollIndicator: false,
            contentContainerStyle: styles.listContent,

            ListEmptyComponent: h(
                Text, { style: styles.empty },
                lib.ready ?
                "Your library is empty. Save some music to get started!" :
                "Loading your library..."
            ),
        })
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
    },

    listContent: {
        padding: 18,
        paddingTop: 35,
        paddingBottom: 90,
    },

    heading: {
        color: "#ffffff",
        fontSize: 30,
        fontWeight: "900",
        marginBottom: 20,
    },

    search: {
        backgroundColor: "#292929",
        color: "#ffffff",
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        marginBottom: 15,
    },

    createRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },

    playlistInput: {
        flex: 1,
        backgroundColor: "#292929",
        color: "#ffffff",
        borderRadius: 10,
        padding: 12,
    },

    createButton: {
        backgroundColor: GREEN,
        borderRadius: 10,
        paddingHorizontal: 18,
        justifyContent: "center",
    },

    createText: {
        color: "#000000",
        fontWeight: "800",
    },

    filterScroll: {
        marginBottom: 10,
        flexGrow: 0,
    },

    chip: {
        backgroundColor: "#292929",
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginRight: 8,
    },

    chipActive: {
        backgroundColor: GREEN,
    },

    chipText: {
        color: "#ffffff",
        fontWeight: "600",
    },

    chipTextActive: {
        color: "#121212",
    },

    sortButton: {
        alignSelf: "flex-end",
        marginVertical: 16,
    },

    sortText: {
        color: "#bbbbbb",
        fontSize: 13,
    },

    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 10,
    },

    categoryCard: {
        backgroundColor: "#282236",
        width: "48%",
        padding: 16,
        minHeight: 125,
        borderRadius: 12,
        justifyContent: "center",
    },

    categoryIcon: {
        color: GREEN,
        fontSize: 25,
        marginBottom: 8,
    },

    categoryTitle: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "700",
    },

    categoryCount: {
        color: "#bbbbbb",
        fontSize: 12,
        marginTop: 5,
    },

    sectionTitle: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "800",
        marginTop: 24,
        marginBottom: 15,
    },

    listItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 12,
    },

    itemContent: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    cover: {
        width: 55,
        height: 55,
        borderRadius: 7,
        backgroundColor: "#363049",
        justifyContent: "center",
        alignItems: "center",
    },

    coverIcon: {
        color: "#ffffff",
        fontSize: 26,
    },

    itemInfo: {
        flex: 1,
    },

    itemTitle: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
    },

    itemSubtitle: {
        color: "#aaaaaa",
        fontSize: 12,
        marginTop: 5,
    },

    action: {
        padding: 10,
    },

    actionText: {
        color: GREEN,
        fontSize: 25,
    },

    empty: {
        color: "#aaaaaa",
        fontSize: 15,
        lineHeight: 24,
        marginTop: 20,
    },
});