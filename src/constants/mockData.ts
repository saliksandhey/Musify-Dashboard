import type { Artist, Album, Song, Playlist, User } from "@/types";

export const mockUsers: User[] = [
  { id: "u1", name: "Salik Sandhey", email: "admin@musify.com", avatar_url: "https://i.pravatar.cc/150?img=11", role: "admin", status: "active", created_at: "2024-01-15T08:00:00Z" },
  { id: "u2", name: "Aarav Sharma", email: "aarav@example.com", avatar_url: "https://i.pravatar.cc/150?img=12", role: "user", status: "active", created_at: "2024-02-10T14:30:00Z" },
  { id: "u3", name: "Priya Patel", email: "priya@example.com", avatar_url: "https://i.pravatar.cc/150?img=5", role: "user", status: "banned", created_at: "2024-03-22T09:15:00Z" },
  { id: "u4", name: "Rahul Verma", email: "rahul@example.com", avatar_url: "https://i.pravatar.cc/150?img=33", role: "user", status: "active", created_at: "2024-04-05T18:45:00Z" },
  { id: "u5", name: "Sneha Reddy", email: "sneha@example.com", avatar_url: "https://i.pravatar.cc/150?img=44", role: "admin", status: "active", created_at: "2024-05-12T11:20:00Z" },
];

export const mockArtists: Artist[] = [
  { id: "a1", name: "Luna Velvet", image_url: "https://i.pravatar.cc/150?img=47", verified: true, monthly_listeners: 28400000 },
  { id: "a2", name: "Axel Storm", image_url: "https://i.pravatar.cc/150?img=8", verified: true, monthly_listeners: 15200000 },
  { id: "a3", name: "Nadia Soleil", image_url: "https://i.pravatar.cc/150?img=45", verified: false, monthly_listeners: 5800000 },
  { id: "a4", name: "Marcus Reed", image_url: "https://i.pravatar.cc/150?img=12", verified: true, monthly_listeners: 42000000 },
  { id: "a5", name: "DJ Quantum", image_url: "https://i.pravatar.cc/150?img=20", verified: true, monthly_listeners: 33600000 },
];

export const mockAlbums: Album[] = [
  { id: "al1", title: "Midnight Echoes", artist_id: "a1", artist_name: "Luna Velvet", cover_url: "https://picsum.photos/seed/album1/200/200", release_year: 2024 },
  { id: "al2", title: "Electric Storm", artist_id: "a2", artist_name: "Axel Storm", cover_url: "https://picsum.photos/seed/album2/200/200", release_year: 2023 },
  { id: "al3", title: "Neon Dreams", artist_id: "a3", artist_name: "Nadia Soleil", cover_url: "https://picsum.photos/seed/album3/200/200", release_year: 2024 },
  { id: "al4", title: "Soul Revival", artist_id: "a4", artist_name: "Marcus Reed", cover_url: "https://picsum.photos/seed/album4/200/200", release_year: 2024 },
  { id: "al5", title: "Pulse Protocol", artist_id: "a5", artist_name: "DJ Quantum", cover_url: "https://picsum.photos/seed/album8/200/200", release_year: 2024 },
];

export const mockSongs: Song[] = [
  { id: "s1", title: "Velvet Skies", artist_id: "a1", artist_name: "Luna Velvet", album_id: "al1", album_name: "Midnight Echoes", cover_url: "https://picsum.photos/seed/song1/200/200", audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: 213 },
  { id: "s2", title: "Thunder Road", artist_id: "a2", artist_name: "Axel Storm", album_id: "al2", album_name: "Electric Storm", cover_url: "https://picsum.photos/seed/song2/200/200", audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", duration: 245 },
  { id: "s3", title: "Neon Pulse", artist_id: "a3", artist_name: "Nadia Soleil", album_id: "al3", album_name: "Neon Dreams", cover_url: "https://picsum.photos/seed/song3/200/200", audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", duration: 187 },
  { id: "s4", title: "Soul Deep", artist_id: "a4", artist_name: "Marcus Reed", album_id: "al4", album_name: "Soul Revival", cover_url: "https://picsum.photos/seed/song4/200/200", audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", duration: 298 },
  { id: "s5", title: "Quantum Drop", artist_id: "a5", artist_name: "DJ Quantum", album_id: "al5", album_name: "Pulse Protocol", cover_url: "https://picsum.photos/seed/song8/200/200", audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", duration: 312 },
];

export const mockPlaylists: Playlist[] = [
  { id: "p1", title: "Global Top 50", creator: "Musify Editorial", cover_url: "https://picsum.photos/seed/pl1/200/200", songs_count: 5 },
  { id: "p2", title: "New Music Friday", creator: "Musify Editorial", cover_url: "https://picsum.photos/seed/pl2/200/200", songs_count: 3 },
  { id: "p3", title: "Late Night Drive", creator: "Musify Editorial", cover_url: "https://picsum.photos/seed/pl4/200/200", songs_count: 4 },
];
