let remoteSongsFetchFailed = false;

const DEEZER_API_URL = "https://api.deezer.com";
const DEEZER_REQUESTS = [
  { path: "/chart/0/tracks", limit: 25 },
  { path: "/search", query: "pop", limit: 25 },
  { path: "/search", query: "SB19", limit: 10, artist: "sb19" },
  { path: "/search", query: "Ben&Ben", limit: 10, artist: "benben" },
  { path: "/search", query: "BINI", limit: 10, artist: "bini" },
  {
    path: "/search",
    query: "Moira Dela Torre",
    limit: 10,
    artist: "moiradelatorre",
  },
  { path: "/search", query: "Cup of Joe", limit: 10, artist: "cupofjoe" },
];

async function fetchDeezerList(path, queryParams = {}) {
  const params = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  const res = await fetch(`${DEEZER_API_URL}${path}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Deezer request failed (${res.status})`);
  }

  const response = await res.json();
  if (!Array.isArray(response.data)) {
    throw new Error("Invalid response from Deezer");
  }

  return response.data;
}

export async function fetchRemoteSongs() {
  remoteSongsFetchFailed = false;

  try {
    const responses = await Promise.all(
      DEEZER_REQUESTS.map(async (request) => {
        const queryParams = { limit: request.limit };
        if (request.query) {
          queryParams.q = request.query;
        }

        try {
          const tracks = await fetchDeezerList(request.path, queryParams);
          return tracks.filter((track) => {
            if (!track.preview) {
              return false;
            }

            if (!request.artist) {
              return true;
            }

            const artistName = (track.artist?.name || "")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            return artistName.includes(request.artist);
          });
        } catch (error) {
          console.warn(
            `Could not load Deezer results for ${request.query || "charts"}:`,
            error
          );
          return null;
        }
      })
    );

    const successfulResponses = responses.filter(Array.isArray);
    const tracks = successfulResponses.reduce(
      (allTracks, response) => allTracks.concat(response),
      []
    );
    if (successfulResponses.length === 0 || tracks.length === 0) {
      throw new Error("No playable tracks returned by Deezer");
    }

    return tracks;
  } catch (error) {
    remoteSongsFetchFailed = true;
    console.warn("Could not load remote songs from Deezer:", error);
    return [];
  }
}

function mapDeezerTrack(track) {
  return {
    id: String(track.id),
    title: track.title,
    artist: track.artist?.name || "Unknown artist",
    album: track.album?.title || "",
    image: {
      uri:
        track.album?.cover_medium ||
        track.album?.cover ||
        track.artist?.picture_medium,
    },
    audioSource: { uri: track.preview },
    description: "",
    deezerUrl: track.link,
  };
}

export function mapRemoteSongToAppSong(remote) {
  return mapDeezerTrack(remote);
}

export async function fetchRemoteSongsMapped() {
  const remoteSongs = await fetchRemoteSongs();

  try {
    return remoteSongs.map(mapRemoteSongToAppSong);
  } catch (error) {
    remoteSongsFetchFailed = true;
    console.warn("Could not map remote songs:", error);
    return [];
  }
}

export function didRemoteSongsFetchFail() {
  return remoteSongsFetchFailed;
}

export async function fetchDeezerHomeData() {
  const sections = [
    ["trendingSongs", "/chart/0/tracks", { limit: 10 }],
    ["chartedAlbums", "/chart/0/albums", { limit: 10 }],
    ["playlists", "/chart/0/playlists", { limit: 10 }],
    ["popularArtists", "/chart/0/artists", { limit: 10 }],
    ["genres", "/genre", { limit: 100 }],
  ];

  const responses = await Promise.all(
    sections.map(async ([section, path, params]) => {
      try {
        return [section, await fetchDeezerList(path, params)];
      } catch (error) {
        console.warn(`Could not load Deezer ${section}:`, error);
        return [section, []];
      }
    })
  );
  const data = {};
  const failedSections = [];
  responses.forEach(([section, items]) => {
    data[section] = items;
    if (items.length === 0) {
      failedSections.push(section);
    }
  });

  if (failedSections.length === sections.length) {
    throw new Error("Could not load Deezer Home data.");
  }

  return {
    trendingSongs: data.trendingSongs
      .filter((track) => track.preview)
      .map((track, index) => ({ ...mapDeezerTrack(track), rank: index + 1 })),
    chartedAlbums: data.chartedAlbums.map((album) => ({
      id: String(album.id),
      title: album.title,
      artist: album.artist?.name || "Unknown artist",
      image: { uri: album.cover_medium || album.cover },
      deezerUrl: album.link,
    })),
    playlists: data.playlists.map((playlist) => ({
      id: String(playlist.id),
      title: playlist.title,
      description: playlist.user?.name
        ? `Playlist by ${playlist.user.name}`
        : "From Deezer charts",
      songCount: playlist.nb_tracks,
      image: { uri: playlist.picture_medium || playlist.picture },
      deezerUrl: playlist.link,
    })),
    popularArtists: data.popularArtists.map((artist) => ({
      id: String(artist.id),
      name: artist.name,
      image: { uri: artist.picture_medium || artist.picture },
      deezerUrl: artist.link,
    })),
    genres: data.genres
      .filter((genre) => String(genre.id) !== "0")
      .map((genre) => ({
        id: String(genre.id),
        label: genre.name,
        image: { uri: genre.picture_medium || genre.picture },
      })),
    failedSections,
  };
}

export async function fetchDeezerGenreTracks(genreId) {
  if (!/^\d+$/.test(String(genreId))) {
    throw new Error("A valid Deezer genre is required.");
  }

  const tracks = await fetchDeezerList(`/chart/${genreId}/tracks`, {
    limit: 10,
  });
  return tracks
    .filter((track) => track.preview)
    .map((track, index) => ({ ...mapDeezerTrack(track), rank: index + 1 }));
}
