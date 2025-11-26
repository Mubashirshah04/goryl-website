// Firebase Cloud Function for Music API
// Handles Audius + Mixkit + Pixabay API calls server-side

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Music API endpoints
const MUSIC_APIS = {
  AUDIUS: 'https://api.audius.co/v1',
  MIXKIT: 'https://mixkit.co/api/v1',
  PIXABAY: 'https://pixabay.com/api'
};

// Fetch trending songs from Audius
async function fetchAudiusTrending() {
  try {
    console.log('🎵 Fetching trending from Audius...');
    const response = await fetch(`${MUSIC_APIS.AUDIUS}/tracks/trending?limit=20`);
    
    if (!response.ok) {
      throw new Error('Audius API failed');
    }
    
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(track => ({
        id: `audius_${track.id}`,
        name: track.title,
        artist: track.user.name,
        duration: `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`,
        category: 'Trending',
        url: track.stream_url,
        thumbnail: track.artwork?.url || '🎵',
        source: 'Audius'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Audius API error:', error);
    return [];
  }
}

// Fetch trending songs from Mixkit
async function fetchMixkitTrending() {
  try {
    console.log('🎵 Fetching trending from Mixkit...');
    const response = await fetch(`${MUSIC_APIS.MIXKIT}/music/trending`);
    
    if (!response.ok) {
      throw new Error('Mixkit API failed');
    }
    
    const data = await response.json();
    
    if (data.music && Array.isArray(data.music)) {
      return data.music.map(track => ({
        id: `mixkit_${track.id}`,
        name: track.title,
        artist: track.artist || 'Mixkit',
        duration: track.duration || '0:30',
        category: 'Trending',
        url: track.url,
        thumbnail: track.thumbnail || '🎵',
        source: 'Mixkit'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Mixkit API error:', error);
    return [];
  }
}

// Fetch trending songs from Pixabay
async function fetchPixabayTrending() {
  try {
    console.log('🎵 Fetching trending from Pixabay...');
    const response = await fetch(`${MUSIC_APIS.PIXABAY}/music/trending`);
    
    if (!response.ok) {
      throw new Error('Pixabay API failed');
    }
    
    const data = await response.json();
    
    if (data.music && Array.isArray(data.music)) {
      return data.music.map(track => ({
        id: `pixabay_${track.id}`,
        name: track.title,
        artist: track.artist || 'Pixabay',
        duration: track.duration || '0:30',
        category: 'Trending',
        url: track.url,
        thumbnail: track.thumbnail || '🎵',
        source: 'Pixabay'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Pixabay API error:', error);
    return [];
  }
}

// Search songs across all APIs
async function searchSongs(query) {
  try {
    console.log('🔍 Searching songs for:', query);
    
    const searchPromises = [
      // Audius search
      fetch(`${MUSIC_APIS.AUDIUS}/tracks/search?query=${encodeURIComponent(query)}&limit=10`)
        .then(r => r.ok ? r.json() : { data: [] })
        .then(data => data.data ? data.data.map(track => ({
          id: `audius_search_${track.id}`,
          name: track.title,
          artist: track.user.name,
          duration: `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`,
          category: 'Search Result',
          url: track.stream_url,
          thumbnail: track.artwork?.url || '🎵',
          source: 'Audius'
        })) : [])
        .catch(() => []),
      
      // Mixkit search
      fetch(`${MUSIC_APIS.MIXKIT}/music/search?q=${encodeURIComponent(query)}`)
        .then(r => r.ok ? r.json() : { music: [] })
        .then(data => data.music ? data.music.map(track => ({
          id: `mixkit_search_${track.id}`,
          name: track.title,
          artist: track.artist || 'Mixkit',
          duration: track.duration || '0:30',
          category: 'Search Result',
          url: track.url,
          thumbnail: track.thumbnail || '🎵',
          source: 'Mixkit'
        })) : [])
        .catch(() => []),
      
      // Pixabay search
      fetch(`${MUSIC_APIS.PIXABAY}/music/search?q=${encodeURIComponent(query)}`)
        .then(r => r.ok ? r.json() : { music: [] })
        .then(data => data.music ? data.music.map(track => ({
          id: `pixabay_search_${track.id}`,
          name: track.title,
          artist: track.artist || 'Pixabay',
          duration: track.duration || '0:30',
          category: 'Search Result',
          url: track.url,
          thumbnail: track.thumbnail || '🎵',
          source: 'Pixabay'
        })) : [])
        .catch(() => [])
    ];
    
    const [audiusResults, mixkitResults, pixabayResults] = await Promise.all(searchPromises);
    
    return [...audiusResults, ...mixkitResults, ...pixabayResults];
  } catch (error) {
    console.error('Error searching songs:', error);
    return [];
  }
}

// Cloud Function: Get trending songs
exports.getTrendingSongs = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    console.log('🎵 Fetching trending songs from all APIs...');
    
    // Fetch from all three APIs in parallel
    const [audiusSongs, mixkitSongs, pixabaySongs] = await Promise.all([
      fetchAudiusTrending(),
      fetchMixkitTrending(),
      fetchPixabayTrending()
    ]);
    
    // Combine all results
    const allSongs = [...audiusSongs, ...mixkitSongs, ...pixabaySongs];
    
    console.log(`✅ Fetched ${allSongs.length} songs total:`, {
      audius: audiusSongs.length,
      mixkit: mixkitSongs.length,
      pixabay: pixabaySongs.length
    });
    
    res.json({
      success: true,
      songs: allSongs,
      count: allSongs.length,
      sources: {
        audius: audiusSongs.length,
        mixkit: mixkitSongs.length,
        pixabay: pixabaySongs.length
      }
    });
  } catch (error) {
    console.error('Error fetching trending songs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      songs: []
    });
  }
});

// Cloud Function: Search songs
exports.searchMusic = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const query = req.query.q || req.body.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
        songs: []
      });
    }
    
    console.log('🔍 Searching songs for:', query);
    
    const searchResults = await searchSongs(query);
    
    console.log(`✅ Found ${searchResults.length} songs matching "${query}"`);
    
    res.json({
      success: true,
      songs: searchResults,
      count: searchResults.length,
      query: query
    });
  } catch (error) {
    console.error('Error searching songs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      songs: []
    });
  }
});

