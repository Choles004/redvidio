class Series {
    constructor(data = {}) {
        this.id = data.id || Date.now();
        this.title = data.title || '';
        this.description = data.description || '';
        this.coverImage = data.coverImage || '';
        this.episodes = data.episodes || [];
        this.stats = {
            views: data.stats?.views || 0,
            likes: data.stats?.likes || 0,
            dislikes: data.stats?.dislikes || 0
        };
        this.comments = data.comments || [];
        this.tags = data.tags || [];
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    addEpisode(episode) {
        this.episodes.push({
            ...episode,
            id: Date.now(),
            stats: { views: 0, likes: 0, dislikes: 0 },
            comments: [],
            createdAt: new Date().toISOString()
        });
        this.updatedAt = new Date().toISOString();
    }

    updateStats(type, episodeId = null) {
        if (episodeId) {
            const episode = this.episodes.find(ep => ep.id === episodeId);
            if (episode) {
                episode.stats[type] = (episode.stats[type] || 0) + 1;
            }
        } else {
            this.stats[type] = (this.stats[type] || 0) + 1;
        }
        this.updatedAt = new Date().toISOString();
    }

    addComment(comment, episodeId = null) {
        const newComment = {
            id: Date.now(),
            text: comment,
            createdAt: new Date().toISOString()
        };

        if (episodeId) {
            const episode = this.episodes.find(ep => ep.id === episodeId);
            if (episode) {
                if (!episode.comments) episode.comments = [];
                episode.comments.push(newComment);
            }
        } else {
            this.comments.push(newComment);
        }
        this.updatedAt = new Date().toISOString();
    }
}