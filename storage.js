class Storage {
    constructor() {
        this.SERIES_KEY = 'redvidio_series';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.SERIES_KEY)) {
            localStorage.setItem(this.SERIES_KEY, JSON.stringify([]));
        }
    }

    getAllSeries() {
        return JSON.parse(localStorage.getItem(this.SERIES_KEY));
    }

    addSeries(series) {
        const allSeries = this.getAllSeries();
        allSeries.push(series);
        localStorage.setItem(this.SERIES_KEY, JSON.stringify(allSeries));
    }

    updateSeries(updatedSeries) {
        const allSeries = this.getAllSeries();
        const index = allSeries.findIndex(s => s.id === updatedSeries.id);
        if (index !== -1) {
            allSeries[index] = updatedSeries;
            localStorage.setItem(this.SERIES_KEY, JSON.stringify(allSeries));
        }
    }

    deleteSeries(seriesId) {
        const allSeries = this.getAllSeries();
        const filtered = allSeries.filter(s => s.id !== seriesId);
        localStorage.setItem(this.SERIES_KEY, JSON.stringify(filtered));
    }

    addEpisode(seriesId, episode) {
        const allSeries = this.getAllSeries();
        const series = allSeries.find(s => s.id === seriesId);
        if (series) {
            series.episodes.push(episode);
            this.updateSeries(series);
        }
    }

    searchSeries(query) {
        const allSeries = this.getAllSeries();
        return allSeries.filter(series => 
            series.title.toLowerCase().includes(query.toLowerCase()) ||
            series.description.toLowerCase().includes(query.toLowerCase()) ||
            series.keywords.some(keyword => 
                keyword.toLowerCase().includes(query.toLowerCase())
            )
        );
    }
}
