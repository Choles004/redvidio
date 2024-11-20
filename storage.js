class Storage {
  constructor() {
    this.storageKey = 'redvidio-data';
    // Initialize storage if empty
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({ series: [] }));
    }
  }

  async getData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return JSON.parse(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      return { series: [] };
    }
  }

  async saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  async getAllSeries() {
    const data = await this.getData();
    return data.series;
  }

  async addSeries(series) {
    const data = await this.getData();
    data.series.push(series);
    await this.saveData(data);
  }

  async updateSeries(updatedSeries) {
    const data = await this.getData();
    const index = data.series.findIndex(s => s.id === updatedSeries.id);
    if (index !== -1) {
      data.series[index] = updatedSeries;
      await this.saveData(data);
    }
  }

  async deleteSeries(id) {
    const data = await this.getData();
    data.series = data.series.filter(s => s.id !== id);
    await this.saveData(data);
  }

  async searchSeries(query) {
    const data = await this.getData();
    const lowercaseQuery = query.toLowerCase();
    return data.series.filter(series => 
      series.title.toLowerCase().includes(lowercaseQuery) ||
      series.description.toLowerCase().includes(lowercaseQuery) ||
      series.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
    );
  }
}
