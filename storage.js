class Storage {
    constructor() {
        // Usar localStorage como fallback si GitHub no está configurado
        this.useLocalStorage = true;
        this.STORAGE_KEY = 'redvidio_series';
        
        // Configuración de GitHub (opcional)
        this.GITHUB_API = '';
        this.GITHUB_TOKEN = '';
        
        this.initializeStorage();
    }

    async initializeStorage() {
        if (this.useLocalStorage) {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            }
        } else {
            try {
                const response = await fetch(`${this.GITHUB_API}/contents/data/series.json`, {
                    headers: {
                        'Authorization': `token ${this.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (!response.ok) {
                    this.useLocalStorage = true;
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
                }
            } catch (error) {
                console.error('Fallback to localStorage:', error);
                this.useLocalStorage = true;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            }
        }
    }

    async getAllSeries() {
        if (this.useLocalStorage) {
            const series = localStorage.getItem(this.STORAGE_KEY);
            return JSON.parse(series || '[]');
        }

        try {
            const response = await fetch(`${this.GITHUB_API}/contents/data/series.json`);
            const data = await response.json();
            const content = atob(data.content);
            return JSON.parse(content);
        } catch (error) {
            console.error('Error fetching series:', error);
            return [];
        }
    }

    async addSeries(series) {
        const allSeries = await this.getAllSeries();
        const newSeries = {
            ...series,
            views: 0,
            likes: 0,
            dislikes: 0,
            comments: []
        };
        
        allSeries.push(newSeries);

        if (this.useLocalStorage) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSeries));
            return;
        }

        await this.updateGithubFile(allSeries);
    }

    async updateSeriesStats(seriesId, type) {
        const allSeries = await this.getAllSeries();
        const series = allSeries.find(s => s.id === seriesId);
        
        if (series) {
            switch(type) {
                case 'view':
                    series.views = (series.views || 0) + 1;
                    break;
                case 'like':
                    series.likes = (series.likes || 0) + 1;
                    break;
                case 'dislike':
                    series.dislikes = (series.dislikes || 0) + 1;
                    break;
            }

            if (this.useLocalStorage) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSeries));
                return;
            }

            await this.updateGithubFile(allSeries);
        }
    }

    async addComment(seriesId, comment) {
        const allSeries = await this.getAllSeries();
        const series = allSeries.find(s => s.id === seriesId);
        
        if (series) {
            if (!series.comments) series.comments = [];
            series.comments.push({
                id: Date.now(),
                text: comment,
                date: new Date().toISOString()
            });

            if (this.useLocalStorage) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSeries));
                return;
            }

            await this.updateGithubFile(allSeries);
        }
    }

    async updateGithubFile(content) {
        if (!this.GITHUB_API || !this.GITHUB_TOKEN) return;

        try {
            const currentFile = await fetch(`${this.GITHUB_API}/contents/data/series.json`);
            const fileData = await currentFile.json();
            
            const response = await fetch(`${this.GITHUB_API}/contents/data/series.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Update series data',
                    content: btoa(JSON.stringify(content)),
                    sha: fileData.sha
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update file');
            }
        } catch (error) {
            console.error('Error updating GitHub:', error);
            // Fallback to localStorage
            this.useLocalStorage = true;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(content));
        }
    }
}
