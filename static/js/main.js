// Pod Force - Main JavaScript functionality

// Global utilities
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = createToast(message, type);
    toastContainer.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove from DOM after hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1070';
    document.body.appendChild(container);
    return container;
}

function createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    const iconMap = {
        success: 'bi-check-circle-fill text-success',
        error: 'bi-exclamation-triangle-fill text-danger',
        warning: 'bi-exclamation-triangle-fill text-warning',
        info: 'bi-info-circle-fill text-info'
    };
    
    const icon = iconMap[type] || iconMap.info;
    
    toast.innerHTML = `
        <div class="toast-header">
            <i class="bi ${icon} me-2"></i>
            <strong class="me-auto">Pod Force</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    return toast;
}

// Feed refresh functionality
async function refreshFeeds() {
    const refreshBtn = document.querySelector('[onclick="refreshFeeds()"]');
    const originalText = refreshBtn ? refreshBtn.innerHTML : '';
    
    try {
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1 spin"></i>Refreshing...';
            refreshBtn.disabled = true;
        }
        
        const response = await fetch('/api/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            // Reload page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showToast(result.message || 'Failed to refresh feeds', 'error');
        }
    } catch (error) {
        console.error('Error refreshing feeds:', error);
        showToast('Network error while refreshing feeds', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
    }
}

// Enhanced Audio Player Class
class EnhancedAudioPlayer {
    constructor(audioElementId, episodeGuid) {
        this.audio = document.getElementById(audioElementId);
        this.episodeGuid = episodeGuid;
        this.storageKey = `podforce_progress_${episodeGuid}`;
        
        if (!this.audio) {
            console.error('Audio element not found');
            return;
        }
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadSavedProgress();
        
        console.log('Enhanced Audio Player initialized for episode:', episodeGuid);
    }
    
    initializeElements() {
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.rewindBtn = document.getElementById('rewind-btn');
        this.forwardBtn = document.getElementById('forward-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.progressFill = document.getElementById('progress-fill');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalTimeEl = document.getElementById('total-time');
        this.volumeSlider = document.getElementById('volume-slider');
        this.speedSelect = document.getElementById('speed-select');
        
        // Initial state
        this.isPlaying = false;
        this.lastSaveTime = 0;
    }
    
    initializeEventListeners() {
        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.updateTotalTime());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onAudioEnded());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', (e) => this.onAudioError(e));
        
        // Control events
        this.playPauseBtn?.addEventListener('click', () => this.togglePlayPause());
        this.rewindBtn?.addEventListener('click', () => this.rewind());
        this.forwardBtn?.addEventListener('click', () => this.fastForward());
        this.progressBar?.addEventListener('click', (e) => this.seek(e));
        this.volumeSlider?.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.speedSelect?.addEventListener('change', (e) => this.setPlaybackRate(e.target.value));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Save progress periodically
        setInterval(() => this.saveProgress(), 5000);
        
        // Save progress before page unload
        window.addEventListener('beforeunload', () => this.saveProgress());
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    async play() {
        try {
            await this.audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
            showToast('Error playing audio. Please try again.', 'error');
        }
    }
    
    pause() {
        this.audio.pause();
    }
    
    rewind(seconds = 10) {
        const newTime = Math.max(0, this.audio.currentTime - seconds);
        this.audio.currentTime = newTime;
        this.updateProgress();
        
        // Visual feedback
        this.showRewindFeedback(seconds);
    }
    
    fastForward(seconds = 10) {
        const newTime = Math.min(this.audio.duration, this.audio.currentTime + seconds);
        this.audio.currentTime = newTime;
        this.updateProgress();
        
        // Visual feedback
        this.showForwardFeedback(seconds);
    }
    
    showRewindFeedback(seconds) {
        const feedback = document.createElement('div');
        feedback.className = 'position-fixed top-50 start-50 translate-middle bg-dark text-white px-3 py-2 rounded shadow';
        feedback.style.zIndex = '1080';
        feedback.innerHTML = `<i class="bi bi-skip-backward me-1"></i>-${seconds}s`;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }
    
    showForwardFeedback(seconds) {
        const feedback = document.createElement('div');
        feedback.className = 'position-fixed top-50 start-50 translate-middle bg-dark text-white px-3 py-2 rounded shadow';
        feedback.style.zIndex = '1080';
        feedback.innerHTML = `+${seconds}s<i class="bi bi-skip-forward ms-1"></i>`;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }
    
    seek(event) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const newTime = percent * this.audio.duration;
        
        if (!isNaN(newTime)) {
            this.audio.currentTime = newTime;
            this.updateProgress();
        }
    }
    
    setVolume(value) {
        this.audio.volume = value / 100;
        localStorage.setItem('podforce_volume', value);
    }
    
    setPlaybackRate(rate) {
        this.audio.playbackRate = parseFloat(rate);
        localStorage.setItem('podforce_playback_rate', rate);
    }
    
    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = `${percent}%`;
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
            
            // Auto-save progress periodically
            const now = Date.now();
            if (now - this.lastSaveTime > 10000) { // Save every 10 seconds
                this.saveProgress();
                this.lastSaveTime = now;
            }
        }
    }
    
    updateTotalTime() {
        if (this.audio.duration) {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        }
    }
    
    onPlay() {
        this.isPlaying = true;
        const icon = this.playPauseBtn?.querySelector('i');
        if (icon) {
            icon.className = 'bi bi-pause-fill';
        }
        this.playPauseBtn?.classList.add('playing');
    }
    
    onPause() {
        this.isPlaying = false;
        const icon = this.playPauseBtn?.querySelector('i');
        if (icon) {
            icon.className = 'bi bi-play-fill';
        }
        this.playPauseBtn?.classList.remove('playing');
        this.saveProgress();
    }
    
    onAudioEnded() {
        this.isPlaying = false;
        const icon = this.playPauseBtn?.querySelector('i');
        if (icon) {
            icon.className = 'bi bi-play-fill';
        }
        this.playPauseBtn?.classList.remove('playing');
        
        // Mark as completed
        this.saveProgress(true);
        showToast('Episode completed!', 'success');
    }
    
    onAudioError(error) {
        console.error('Audio error:', error);
        showToast('Error loading audio. Please check your connection.', 'error');
    }
    
    handleKeyboard(event) {
        // Only handle shortcuts when not typing in inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.rewind();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.fastForward();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.adjustVolume(10);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.adjustVolume(-10);
                break;
        }
    }
    
    adjustVolume(delta) {
        const currentVolume = this.volumeSlider?.value || 100;
        const newVolume = Math.max(0, Math.min(100, parseInt(currentVolume) + delta));
        
        if (this.volumeSlider) {
            this.volumeSlider.value = newVolume;
            this.setVolume(newVolume);
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    saveProgress(completed = false) {
        const progress = {
            currentTime: this.audio.currentTime,
            duration: this.audio.duration,
            completed: completed,
            lastPlayed: Date.now()
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(progress));
    }
    
    loadSavedProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const progress = JSON.parse(saved);
                
                // Don't restore if completed
                if (!progress.completed && progress.currentTime > 30) {
                    // Wait for metadata to load
                    const loadProgress = () => {
                        this.audio.currentTime = progress.currentTime;
                        this.updateProgress();
                    };
                    
                    if (this.audio.readyState >= 1) {
                        loadProgress();
                    } else {
                        this.audio.addEventListener('loadedmetadata', loadProgress, { once: true });
                    }
                }
            }
            
            // Restore volume
            const savedVolume = localStorage.getItem('podforce_volume');
            if (savedVolume && this.volumeSlider) {
                this.volumeSlider.value = savedVolume;
                this.setVolume(savedVolume);
            }
            
            // Restore playback rate
            const savedRate = localStorage.getItem('podforce_playback_rate');
            if (savedRate && this.speedSelect) {
                this.speedSelect.value = savedRate;
                this.setPlaybackRate(savedRate);
            }
        } catch (error) {
            console.error('Error loading saved progress:', error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS for spinning animation
    const style = document.createElement('style');
    style.textContent = `
        .spin {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Enhance episode cards with hover effects
    const episodeCards = document.querySelectorAll('.episode-card');
    episodeCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Auto-focus search if present
    const searchInput = document.querySelector('#search-input');
    if (searchInput) {
        searchInput.focus();
    }
    
    console.log('Pod Force main JavaScript initialized');
});