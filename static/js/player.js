class PodcastPlayer {
    constructor() {
        this.initializeStorage();
        this.setupEventListeners();
    }

    initializeStorage() {
        if (!localStorage.getItem('podcastProgress')) {
            localStorage.setItem('podcastProgress', JSON.stringify({}));
        }
    }

    setupEventListeners() {
        const audioPlayer = document.querySelector('audio');
        if (!audioPlayer) return;

        const guid = audioPlayer.dataset.guid;
        const progress = this.getProgress(guid);

        if (progress) {
            audioPlayer.currentTime = progress;
        }

        audioPlayer.addEventListener('timeupdate', () => {
            this.saveProgress(guid, audioPlayer.currentTime);
        });

        audioPlayer.addEventListener('ended', () => {
            this.saveProgress(guid, 0);
        });
    }

    getProgress(guid) {
        const progress = JSON.parse(localStorage.getItem('podcastProgress'));
        return progress[guid] || 0;
    }

    saveProgress(guid, time) {
        const progress = JSON.parse(localStorage.getItem('podcastProgress'));
        progress[guid] = time;
        localStorage.setItem('podcastProgress', JSON.stringify(progress));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PodcastPlayer();
});
