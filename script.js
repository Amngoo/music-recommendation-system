// Add API configuration
const API_KEY = '2'; // Free test API key
const API_BASE_URL = 'https://theaudiodb.com/api/v1/json/2';

// Add new functions for API calls
async function searchArtist(artistName) {
    try {
        const response = await fetch(`${API_BASE_URL}/search.php?s=${encodeURIComponent(artistName)}`);
        const data = await response.json();
        debug('Artist search results:', data);
        return data.artists?.[0] || null;
    } catch (error) {
        console.error('Error searching artist:', error);
        return null;
    }
}

async function searchAlbums(artistName) {
    try {
        const response = await fetch(`${API_BASE_URL}/searchalbum.php?s=${encodeURIComponent(artistName)}`);
        const data = await response.json();
        debug('Album search results:', data);
        return data.album || [];
    } catch (error) {
        console.error('Error searching albums:', error);
        return [];
    }
}

async function searchTracks(artistName, trackName) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/searchtrack.php?s=${encodeURIComponent(artistName)}&t=${encodeURIComponent(trackName)}`
        );
        const data = await response.json();
        debug('Track search results:', data);
        return data.track || [];
    } catch (error) {
        console.error('Error searching tracks:', error);
        return [];
    }
}

// Update the songs object to include artist info
const songs = {
    party: [
        { 
            title: "Yellow",
            artist: "Coldplay",
            url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
            duration: "3:45"
        }
    ],
    happy: [
        { 
            title: "Happy Test Song", 
            url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_2a19d1d817.mp3", // Example fallback URL
            duration: "3:30"
        }
    ],
    sad: [
        { 
            title: "Emotional Test Song", 
            url: "https://cdn.pixabay.com/download/audio/2021/11/25/audio_4b0d6d2376.mp3", // Example fallback URL
            duration: "4:15"
        }
    ],
    rap: [
        { 
            title: "Rap Test Song", 
            url: "https://cdn.pixabay.com/download/audio/2022/08/04/audio_2dde668d05.mp3", // Example fallback URL
            duration: "2:55"
        }
    ]
};

let currentSongIndex = 0;
let isPlaying = false;
let currentMoodCategory = '';

// Initialize the player
async function initPlayer() {
    setupEventListeners();
}

// Add debug function
function debug(message, data = '') {
    console.log(`Debug: ${message}`, data);
}

// Update setupEventListeners with debug messages
function setupEventListeners() {
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const volumeControl = document.getElementById('volume');
    const progressBar = document.querySelector('.progress-bar');
    
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    volumeControl.addEventListener('input', updateVolume);
    progressBar.addEventListener('click', seek);
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', playNext);

    // Add category button listeners
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', () => {
            const mood = button.dataset.mood;
            debug('Mood selected:', mood);
            currentMoodCategory = mood;
            updatePlaylist(mood);
            document.getElementById('current-mood').textContent = 
                `Current Mood: ${mood.charAt(0).toUpperCase() + mood.slice(1)}`;
        });
    });

    // Add search form listener
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const artist = document.getElementById('search-artist').value;
            const track = document.getElementById('search-track').value;
            const mood = document.getElementById('search-mood').value;
            await searchAndAddSong(artist, track, mood);
        });
    }
}

// Update updatePlaylist function with verification
function updatePlaylist(mood) {
    const playlist = document.getElementById('playlist');
    playlist.innerHTML = '';
    debug('Updating playlist for mood:', mood);

    if (!songs[mood]) {
        console.error(`No songs found for mood: ${mood}`);
        playlist.innerHTML = '<div class="error-message">No songs available for this mood</div>';
        return;
    }

    if (songs[mood].length === 0) {
        playlist.innerHTML = '<div class="error-message">Playlist is empty</div>';
        return;
    }

    songs[mood].forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.classList.add('song-item');
        songElement.innerHTML = `
            <div class="song-info-container">
                <i class="fas fa-music"></i>
                <span class="song-title">${song.title}</span>
            </div>
            <span class="song-duration">${song.duration || '--:--'}</span>
        `;
        songElement.addEventListener('click', () => {
            debug('Song clicked:', song);
            playSong(song, index);
        });
        playlist.appendChild(songElement);
    });
}

function togglePlay() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        document.querySelector('#play-btn i').classList.replace('fa-play', 'fa-pause');
    } else {
        audioPlayer.pause();
        document.querySelector('#play-btn i').classList.replace('fa-pause', 'fa-play');
    }
}

function updateProgress() {
    const progress = document.getElementById('progress');
    const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progress.style.width = percentage + '%';
}

function seek(e) {
    const progressBar = document.querySelector('.progress-bar');
    const percent = e.offsetX / progressBar.offsetWidth;
    audioPlayer.currentTime = percent * audioPlayer.duration;
}

function updateVolume(e) {
    audioPlayer.volume = e.target.value;
}

function playPrevious() {
    if (currentSongIndex > 0) {
        currentSongIndex--;
        playSong(songs[currentMoodCategory][currentSongIndex], currentSongIndex);
    }
}

function playNext() {
    if (currentSongIndex < songs[currentMoodCategory].length - 1) {
        currentSongIndex++;
        playSong(songs[currentMoodCategory][currentSongIndex], currentSongIndex);
    }
}

// Update playSong function to handle external URLs
function playSong(song, index) {
    const audioPlayer = document.getElementById('audio-player');
    const currentSong = document.getElementById('current-song');
    const artistInfo = document.getElementById('artist-info');

    try {
        debug('Attempting to play song:', song);
        
        // Use the URL directly since we're using external URLs
        audioPlayer.src = song.url;
        currentSong.textContent = song.title;
        if (artistInfo) {
            artistInfo.textContent = song.artist || 'Unknown Artist';
        }
        currentSongIndex = index;

        // Play the song
        audioPlayer.play()
            .then(() => {
                debug('Song playing successfully');
                document.querySelector('#play-btn i').classList.replace('fa-play', 'fa-pause');
            })
            .catch(error => {
                console.error('Error playing song:', error);
                alert(`Cannot play "${song.title}". Please check your internet connection.`);
            });

        updateActiveTrack(index);
    } catch (error) {
        console.error('Error in playSong:', error);
    }
}

// Add function to update active track
function updateActiveTrack(index) {
    document.querySelectorAll('.song-item').forEach((item, i) => {
        if (i === index) {
            item.classList.add('active-song');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            item.classList.remove('active-song');
        }
    });
}

// Add search functionality
async function searchAndAddSong(artistName, trackName, mood) {
    try {
        const tracks = await searchTracks(artistName, trackName);
        if (tracks.length > 0) {
            const track = tracks[0];
            const newSong = {
                title: track.strTrack,
                artist: track.strArtist,
                url: track.strMusicVid || track.strTrackThumb, // Note: This is just thumbnail/video URL
                duration: track.intDuration ? formatDuration(track.intDuration) : '--:--'
            };

            if (!songs[mood]) {
                songs[mood] = [];
            }
            songs[mood].push(newSong);
            updatePlaylist(mood);
            debug('Added new song:', newSong);
        }
    } catch (error) {
        console.error('Error adding song:', error);
    }
}

// Add utility function for duration formatting
function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
}

// Add error handling for audio player
document.getElementById('audio-player').addEventListener('error', (e) => {
    console.error('Audio Player Error:', e);
    alert('Error loading audio file. Please check if the file exists and is in the correct format.');
});

// Add initialization debug
window.addEventListener('load', () => {
    debug('Application started');
    debug('Available songs:', songs);
});

// Initialize the player when the page loads
initPlayer();
