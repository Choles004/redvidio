class Storage {
    constructor() {
        this.storageKey = 'redvidio-series';
    }

    getAllSeries() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    saveSeries(series) {
        localStorage.setItem(this.storageKey, JSON.stringify(series));
    }

    addSeries(series) {
        const allSeries = this.getAllSeries();
        const newSeries = {
            ...series,
            views: 0,
            likes: 0,
            dislikes: 0,
            comments: []
        };
        allSeries.push(newSeries);
        this.saveSeries(allSeries);
        return newSeries;
    }

    updateStats(seriesId, type) {
        const allSeries = this.getAllSeries();
        const series = allSeries.find(s => s.id === seriesId);
        if (series) {
            series[type] = (parseInt(series[type]) || 0) + 1;
            this.saveSeries(allSeries);
            return series[type];
        }
        return 0;
    }

    addComment(seriesId, comment) {
        const allSeries = this.getAllSeries();
        const series = allSeries.find(s => s.id === seriesId);
        if (series) {
            if (!series.comments) series.comments = [];
            const newComment = {
                id: Date.now(),
                text: comment,
                timestamp: new Date().toISOString()
            };
            series.comments.push(newComment);
            this.saveSeries(allSeries);
            return newComment;
        }
        return null;
    }

    deleteSeries(seriesId) {
        const allSeries = this.getAllSeries();
        const filteredSeries = allSeries.filter(s => s.id !== seriesId);
        this.saveSeries(filteredSeries);
    }
}
