class UI {
    constructor(storage) {
        this.storage = storage;
        this.initializeUI();
    }

    initializeUI() {
        // Inicializar iconos de Lucide
        lucide.createIcons();

        // Referencias DOM
        this.seriesGrid = document.getElementById('seriesGrid');
        this.searchInput = document.getElementById('searchInput');
        this.publishBtn = document.getElementById('publishBtn');
        this.adminBtn = document.getElementById('adminBtn');
        this.publishModal = document.getElementById('publishModal');
        this.episodeModal = document.getElementById('episodeModal');
        this.adminModal = document.getElementById('adminModal');

        // Event Listeners
        this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        this.publishBtn.addEventListener('click', () => this.toggleModal(this.publishModal));
        this.adminBtn.addEventListener('click', () => this.showAdminPanel());

        document.querySelectorAll('.close-btn, .close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
            });
        });

        document.getElementById('publishForm').addEventListener('submit', this.handlePublish.bind(this));
        document.getElementById('episodeForm').addEventListener('submit', this.handleAddEpisode.bind(this));

        // Cargar series iniciales
        this.renderSeriesGrid(this.storage.getAllSeries());
    }

    toggleModal(modal) {
        modal.classList.toggle('active');
    }

    handleSearch(e) {
        const query = e.target.value;
        const filteredSeries = this.storage.searchSeries(query);
        this.renderSeriesGrid(filteredSeries);
    }

    handlePublish(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newSeries = {
            id: Date.now(),
            title: formData.get('title'),
            description: formData.get('description'),
            coverImage: formData.get('coverImage'),
            keywords: formData.get('keywords').split(',').map(k => k.trim()),
            views: "0",
            likes: "0",
            comments: "0",
            episodes: [],
            creatorPassword: formData.get('password'),
            adminPassword: '1234'
        };

        this.storage.addSeries(newSeries);
        this.renderSeriesGrid(this.storage.getAllSeries());
        this.toggleModal(this.publishModal);
        e.target.reset();
    }

    handleAddEpisode(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const seriesId = parseInt(formData.get('seriesId'));
        const series = this.storage.getAllSeries().find(s => s.id === seriesId);

        if (!series) return;

        if (formData.get('password') !== series.creatorPassword && 
            formData.get('password') !== series.adminPassword) {
            alert('Contraseña incorrecta');
            return;
        }

        const newEpisode = {
            id: Date.now(),
            title: formData.get('title'),
            description: formData.get('description'),
            thumbnailUrl: formData.get('thumbnailUrl'),
            embedCode: formData.get('embedCode'),
            shareUrl: `${window.location.origin}/series/${seriesId}/episode/${series.episodes.length + 1}`
        };

        this.storage.addEpisode(seriesId, newEpisode);
        this.showSeries(series);
        this.toggleModal(this.episodeModal);
        e.target.reset();
    }

    renderSeriesGrid(series) {
        this.seriesGrid.innerHTML = series.map(serie => `
            <div class="series-card" onclick="ui.showSeries(${JSON.stringify(serie).replace(/"/g, '&quot;')})">
                <div class="series-image">
                    <img src="${serie.coverImage}" alt="${serie.title}">
                    <div class="series-overlay">
                        <h3>${serie.title}</h3>
                        <p>${serie.description}</p>
                    </div>
                </div>
                <div class="series-info">
                    <div class="series-stats">
                        <span class="stat">
                            <i data-lucide="eye"></i>
                            ${serie.views}
                        </span>
                        <div class="stat-group">
                            <span class="stat">
                                <i data-lucide="heart"></i>
                                ${serie.likes}
                            </span>
                            <span class="stat">
                                <i data-lucide="message-circle"></i>
                                ${serie.comments}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        lucide.createIcons();
    }

    showSeries(series) {
        this.seriesGrid.innerHTML = `
            <div class="episode-viewer">
                <div class="episode-header">
                    <button class="btn btn-secondary" onclick="ui.renderSeriesGrid(ui.storage.getAllSeries())">
                        <i data-lucide="arrow-left"></i>
                        Volver
                    </button>
                    <button class="btn btn-primary" onclick="ui.showAddEpisodeModal(${series.id})">
                        <i data-lucide="plus"></i>
                        Agregar Episodio
                    </button>
                </div>
                
                <h2 class="text-xl font-bold mb-4">${series.title}</h2>
                
                ${series.episodes.map((episode, index) => `
                    <div class="episode-container">
                        <div class="episode-embed">
                            ${episode.embedCode}
                        </div>
                        <div class="episode-description">
                            <h3 class="font-bold">${episode.title}</h3>
                            <p>${episode.description}</p>
                        </div>
                        <div class="share-section">
                            <h4 class="font-bold">Compartir</h4>
                            <input type="text" class="share-input" readonly value="${episode.shareUrl}" onclick="this.select()">
                            <input type="text" class="share-input" readonly value="${episode.embedCode}" onclick="this.select()">
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        lucide.createIcons();
    }

    showAddEpisodeModal(seriesId) {
        const episodeForm = document.getElementById('episodeForm');
        episodeForm.querySelector('[name="seriesId"]').value = seriesId;
        this.toggleModal(this.episodeModal);
    }

    showAdminPanel() {
        const password = prompt('Ingrese la contraseña de administrador:');
        if (password !== '1234') {
            alert('Contraseña incorrecta');
            return;
        }

        const adminContent = document.getElementById('adminContent');
        const series = this.storage.getAllSeries();
        
        adminContent.innerHTML = `
            <div class="admin-series-list">
                ${series.map(series => `
                    <div class="admin-series-item">
                        <div>
                            <h3>${series.title}</h3>
                            <p>${series.episodes.length} episodios</p>
                        </div>
                        <div>
                            <button onclick="ui.deleteSeries(${series.id})" class="btn btn-secondary">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        lucide.createIcons();
        this.toggleModal(this.adminModal);
    }

    deleteSeries(seriesId) {
        if (confirm('¿Está seguro de eliminar esta serie?')) {
            this.storage.deleteSeries(seriesId);
            this.showAdminPanel();
        }
    }
}
