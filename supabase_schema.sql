-- Run this script in your Supabase SQL Editor to create tables for Musify Admin

-- Artists Table
CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  country TEXT,
  verified BOOLEAN DEFAULT TRUE,
  songs_count INT DEFAULT 0,
  albums_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATE DEFAULT CURRENT_DATE,
  monthly_listeners BIGINT DEFAULT 0,
  genre TEXT,
  bio TEXT
);

-- Albums Table
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cover TEXT,
  artist_id TEXT,
  artist_name TEXT,
  release_date DATE,
  songs_count INT DEFAULT 0,
  status TEXT DEFAULT 'published',
  genre TEXT,
  total_streams BIGINT DEFAULT 0
);

-- Songs Table
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cover TEXT,
  artist_id TEXT,
  artist_name TEXT,
  album_id TEXT,
  album_name TEXT,
  genre TEXT,
  language TEXT,
  mood TEXT,
  release_date DATE,
  duration INT DEFAULT 0,
  streams BIGINT DEFAULT 0,
  downloads BIGINT DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  status TEXT DEFAULT 'published',
  explicit BOOLEAN DEFAULT FALSE,
  trending BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  songs_count INT DEFAULT 0,
  description TEXT
);

-- Genres Table
CREATE TABLE IF NOT EXISTS genres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  songs_count INT DEFAULT 0,
  artists_count INT DEFAULT 0,
  color TEXT,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Playlists Table
CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cover TEXT,
  description TEXT,
  songs_count INT DEFAULT 0,
  followers BIGINT DEFAULT 0,
  status TEXT DEFAULT 'public',
  created_at DATE DEFAULT CURRENT_DATE,
  curated_by TEXT
);

-- Banners Table
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT,
  button_text TEXT,
  linked_song TEXT,
  linked_album TEXT,
  status TEXT DEFAULT 'active',
  start_date DATE,
  end_date DATE
);
