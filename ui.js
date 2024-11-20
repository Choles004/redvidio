class UI {
    constructor() {
        this.storage = new Storage();
        this.initializeUI();
    }

    initializeUI() {
        this.mainContent = document.getElementById('mainContent');
        this.searchInput = document.getElementById('searchInput');
        this.publishBtn = document.getElementById('publishBtn');
        this.adminBtn = document.getElementById('adminBtn');
        this.logo = document.querySelector('.logo');

        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.searchInput.addEventListener('focus', () => this.searchInput.classList.add('expanded'));
        this.searchInput.addEventListener('blur', () => this.searchInput.classList.remove('expanded'));
        
        this.publishBtn.addEventListener('click', () => this.showModal('publishModal'));
        this.adminBtn.addEventListener('click', () => this.showAdminPanel());
        this.logo.addEventListener('click', () => this.showHome());

        document.getElementById('publishForm').addEventListener('submit', (e) => this.handlePublish(e));
        document.getElementById('episodeForm').addEventListener('submit', (e) => this.handleAddEpisode(e));

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideModals());
        });

        this.loadSeries();
    }

    loadSeries() {
        const series = this.storage.getAllSeries();
        this.renderSeriesGrid(series);
    }

    renderSeriesGrid(series) {
        this.mainContent.innerHTML = `
            <div class="series-grid">
                ${series.map(serie => this.renderSeriesCard(serie)).join('')}
            </div>
        `;
    }

    renderSeriesCard(serie) {
        return `
            <div class="series-card" onclick="ui.showSeries(${serie.id})">
                <div class="series-image">
                    <img src="${serie.coverImage}" alt="${serie.title}" onerror="this.src='placeholder.png'">
                    <div class="series-overlay">
                        <h3>${serie.title}</h3>
                        <p>${serie.description}</p>
                    </div>
                </div>
                <div class="series-info">
                    <div class="stats-container">
                        <span class="stat"><i data-lucide="eye"></i>${serie.views || 0}</span>
                        <span class="stat"><i data-lucide="heart"></i>${serie.likes || 0}</span>
                        <span class="stat"><i data-lucide="message-circle"></i>${serie.comments?.length || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    showSeries(seriesId) {
        const series = this.storage.getAllSeries().find(s => s.id === seriesId);
        if (!series) return;

        this.mainContent.innerHTML = `
            <div class="series-viewer">
                <div class="series-header">
                    <button class="btn" onclick="ui.showHome()">
                        <i data-lucide="arrow-left"></i> Volver
                    </button>
                    <h2>${series.title}</h2>
                </div>
                ${series.episodes.map(episode => this.renderEpisode(episode, series)).join('')}
                <button class="btn btn-primary" onclick="ui.showModal('episodeModal', ${seriesId})">
                    <i data-lucide="plus"></i> Agregar Episodio
                </button>
            </div>
        `;
        lucide.createIcons();
    }

    renderEpisode(episode, series) {
        return `
            <div class="episode-container">
                <div class="video-container">
                    ${episode.embedCode}
                </div>
                <h3>${episode.title}</h3>
                <p>${episode.description}</p>
                <div class="stats-container">
                    <button onclick="ui.updateStats(${series.id}, 'views')" class="stat-button">
                        <i data-lucide="eye"></i> ${series.views || 0}
                    </button>
                    <button onclick="ui.updateStats(${series.id}, 'likes')" class="stat-button">
                        <i data-lucide="heart"></i> ${series.likes || 0}
                    </button>
                    <button onclick="ui.updateStats(${series.id}, 'dislikes')" class="stat-button">
                        <i data-lucide="thumbs-down"></i> ${series.dislikes || 0}
                    </button>
                </div>
            </div>
        `;
    }

    handleSearch() {
        const query = this.searchInput.value.toLowerCase();
        const series = this.storage.getAllSeries();
        const filtered = series.filter(serie => 
            serie.title.toLowerCase().includes(query) ||
            serie.description.toLowerCase().includes(query)
        );
        this.renderSeriesGrid(filtered);
    }

    showModal(modalId, data = null) {
        const modal = document.getElementById(modalId);
        if (data) {
            modal.dataset.seriesId = data;
        }
        modal.classList.add('active');
    }

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    handlePublish(event) {
        event.preventDefault();
        const form = event.target;
        const series = {
            id: Date.now(),
            title: form.title.value,
            description: form.description.value,
            coverImage: form.coverImage.value,
            episodes: []
        };
        
        this.storage.addSeries(series);
        this.hideModals();
        this.loadSeries();
        form.reset();
    }

    handleAddEpisode(event) {
        event.preventDefault();
        const form = event.target;
        const seriesId = parseInt(form.closest('.modal').dataset.seriesId);
        const series = this.storage.getAllSeries().find(s => s.id === seriesId);
        
        if (series) {
            series.episodes.push({
                id: Date.now(),
                title: form.title.value,
                description: form.description.value,
                embedCode: form.embedCode.value
            });
            this.storage.saveSeries(this.storage.getAllSeries());
            this.hideModals();
            this.showSeries(seriesId);
            form.reset();
        }
    }

    updateStats(seriesId, type) {
        const newValue = this.storage.updateStats(seriesId, type);
        this.showSeries(seriesId);
        return newValue;
    }

    showHome() {
        this.loadSeries();
    }

    showAdminPanel() {
        const password = prompt('Contraseña de administrador:');
        if (password === '1234') {
            const series = this.storage.getAllSeries();
            this.mainContent.innerHTML = `
                <div class="admin-panel">
                    <h2>Panel de Administración</h2>
                    <div class="admin-series">
                        ${series.map(serie => `
                            <div class="admin-series-item">
                                <h3>${serie.title}</h3>
                                <button onclick="ui.deleteSeries(${serie.id})" class="btn btn-danger">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            lucide.createIcons();
        }
    }

    deleteSeries(seriesId) {
        if (confirm('¿Estás seguro de eliminar esta serie?')) {
            this.storage.deleteSeries(seriesId);
            this.showAdminPanel();
        }
    }
}
