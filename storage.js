class Storage {
    constructor() {
        this.storageKey = 'redvidio-series';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    getAllSeries() {
        const data = localStorage.getItem(this.storageKey);
        const series = JSON.parse(data);
        return series.map(s => new Series(s)).sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
    }

    getSeries(id) {
        const series = this.getAllSeries();
        return series.find(s => s.id === id);
    }

    saveSeries(series) {
        localStorage.setItem(this.storageKey, JSON.stringify(series));
    }

    addSeries(data) {
        const series = this.getAllSeries();
        const newSeries = new Series(data);
        series.push(newSeries);
        this.saveSeries(series);
        return newSeries;
    }

    updateSeries(id, data) {
        const series = this.getAllSeries();
        const index = series.findIndex(s => s.id === id);
        if (index !== -1) {
            series[index] = new Series({ ...series[index], ...data });
            this.saveSeries(series);
            return series[index];
        }
        return null;
    }

    deleteSeries(id) {
        const series = this.getAllSeries();
        const filtered = series.filter(s => s.id !== id);
        this.saveSeries(filtered);
    }

    searchSeries(query) {
        const series = this.getAllSeries();
        const searchTerms = query.toLowerCase().split(' ');
        
        return series.filter(serie => {
            const searchText = `${serie.title} ${serie.description} ${serie.tags.join(' ')}`.toLowerCase();
            return searchTerms.every(term => searchText.includes(term));
        });
    }
}