class UI {
    constructor() {
        this.storage = new Storage();
        this.modals = {
            publish: new Modal('publishModal'),
            episode: new Modal('episodeModal'),
            admin: new Modal('adminModal')
        };
        this.initializeUI();
    }

    initializeUI() {
        this.mainContent = document.getElementById('mainContent');
        this.searchInput = document.getElementById('searchInput');
        this.publishBtn = document.getElementById('publishBtn');
        this.adminBtn = document.getElementById('adminBtn');
        this.logo = document.querySelector('.logo');

        this.setupEventListeners();
        this.loadSeries();
        this.setupTheme();
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.searchInput.addEventListener('focus', () => this.searchInput.classList.add('expanded'));
        this.searchInput.addEventListener('blur', () => {
            if (!this.searchInput.value) {
                this.searchInput.classList.remove('expanded');
            }
        });
        
        this.publishBtn.addEventListener('click', () => this.modals.publish.show());
        this.adminBtn.addEventListener('click', () => this.showAdminPanel());
        this.logo.addEventListener('click', () => this.showHome());

        document.getElementById('publishForm').addEventListener('submit', (e) => this.handlePublish(e));
        document.getElementById('episodeForm').addEventListener('submit', (e) => this.handleAddEpisode(e));

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Object.values(this.modals).forEach(modal => modal.hide());
            }
        });
    }

    setupTheme() {
        const theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    loadSeries() {
        const series = this.storage.getAllSeries();
        this.renderSeriesGrid(series);
    }

    renderSeriesGrid(series) {
        if (series.length === 0) {
            this.mainContent.innerHTML = this.renderEmptyState();
            return;
        }

        this.mainContent.innerHTML = `
            <div class="series-grid">
                ${series.map(serie => this.renderSeriesCard(serie)).join('')}
            </div>
        `;
        lucide.createIcons();
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i data-lucide="video-off" size="48"></i>
                <h2>No hay series disponibles</h2>
                <p>¡Sé el primero en publicar una serie!</p>
                <button onclick="ui.modals.publish.show()" class="btn btn-primary">
                    <i data-lucide="plus"></i> Publicar Serie
                </button>
            </div>
        `;
    }

    renderSeriesCard(serie) {
        return `
            <div class="series-card" onclick="ui.showSeries(${serie.id})">
                <div class="series-image">
                    <img src="${serie.coverImage}" alt="${serie.title}" 
                         onerror="this.src='assets/placeholder.jpg'">
                    <div class="series-overlay">
                        <div class="series-info">
                            <h3>${serie.title}</h3>
                            <p>${serie.description}</p>
                            ${serie.tags.map(tag => `
                                <span class="tag">${tag}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="stats-container">
                        <span class="stat"><i data-lucide="eye"></i>${serie.stats.views}</span>
                        <span class="stat"><i data-lucide="heart"></i>${serie.stats.likes}</span>
                        <span class="stat"><i data-lucide="message-circle"></i>${serie.comments.length}</span>
                    </div>
                    <span class="timestamp">
                        ${this.formatDate(serie.updatedAt)}
                    </span>
                </div>
            </div>
        `;
    }

    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Hoy';
        if (days === 1) return 'Ayer';
        if (days < 7) return `Hace ${days} días`;
        return d.toLocaleDateString();
    }

    showSeries(seriesId) {
        const series = this.storage.getSeries(seriesId);
        if (!series) return;

        this.mainContent.innerHTML = `
            <div class="series-viewer">
                <div class="series-header">
                    <button class="btn" onclick="ui.showHome()">
                        <i data-lucide="arrow-left"></i> Volver
                    </button>
                    <div class="series-title">
                        <h2>${series.title}</h2>
                        <div class="series-meta">
                            ${series.tags.map(tag => `
                                <span class="tag">${tag}</span>
                            `).join('')}
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="ui.modals.episode.show({seriesId: ${series.id}})">
                        <i data-lucide="plus"></i> Agregar Episodio
                    </button>
                </div>

                <div class="episodes-grid">
                    ${series.episodes.map((episode, index) => 
                        this.renderEpisode(episode, series, index)
                    ).join('')}
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    renderEpisode(episode, series, index) {
        return `
            <div class="episode-container">
                <div class="episode-header">
                    <span class="episode-number">#${index + 1}</span>
                    <h3>${episode.title}</h3>
                </div>
                
                <div class="video-container">
                    ${episode.embedCode}
                </div>

                <div class="episode-content">
                    <p>${episode.description}</p>
                    
                    <div class="episode-actions">
                        <div class="stats-container">
                            <button onclick="ui.updateStats(${series.id}, 'views', ${episode.id})" 
                                    class="stat-button">
                                <i data-lucide="eye"></i> ${episode.stats.views}
                            </button>
                            <button onclick="ui.updateStats(${series.id}, 'likes', ${episode.id})" 
                                    class="stat-button">
                                <i data-lucide="heart"></i> ${episode.stats.likes}
                            </button>
                            <button onclick="ui.updateStats(${series.id}, 'dislikes', ${episode.id})" 
                                    class="stat-button">
                                <i data-lucide="thumbs-down"></i> ${episode.stats.dislikes}
                            </button>
                        </div>

                        <button class="btn btn-secondary" onclick="ui.copyEmbedCode(${episode.id})">
                            <i data-lucide="copy"></i> Copiar Código
                        </button>
                    </div>

                    <div class="comments-section">
                        <h4>Comentarios (${episode.comments.length})</h4>
                        <div class="comments-list">
                            ${episode.comments.map(comment => `
                                <div class="comment">
                                    <p>${comment.text}</p>
                                    <span class="timestamp">${this.formatDate(comment.createdAt)}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="comment-form">
                            <textarea placeholder="Escribe un comentario..."></textarea>
                            <button onclick="ui.addComment(${series.id}, ${episode.id})" 
                                    class="btn btn-primary">
                                Comentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    handleSearch() {
        const query = this.searchInput.value;
        const series = this.storage.searchSeries(query);
        this.renderSeriesGrid(series);
    }

    handlePublish(event) {
        event.preventDefault();
        const form = event.target;
        const series = {
            title: form.title.value,
            description: form.description.value,
            coverImage: form.coverImage.value,
            tags: form.tags.value.split(',').map(tag => tag.trim()).filter(Boolean)
        };
        
        this.storage.addSeries(series);
        this.modals.publish.hide();
        Toast.show('Serie publicada exitosamente', 'success');
        this.loadSeries();
        form.reset();
    }

    handleAddEpisode(event) {
        event.preventDefault();
        const form = event.target;
        const context = this.modals.episode.getContext();
        const series = this.storage.getSeries(context.seriesId);
        
        if (series) {
            series.addEpisode({
                title: form.title.value,
                description: form.description.value,
                embedCode: form.embedCode.value
            });
            
            this.storage.updateSeries(series.id, series);
            this.modals.episode.hide();
            Toast.show('Episodio agregado exitosamente', 'success');
            this.showSeries(series.id);
            form.reset();
        }
    }

    updateStats(seriesId, type, episodeId = null) {
        const series = this.storage.getSeries(seriesId);
        if (series) {
            series.updateStats(type, episodeId);
            this.storage.updateSeries(series.id, series);
            this.showSeries(series.id);
        }
    }

    addComment(seriesId, episodeId, text) {
        const series = this.storage.getSeries(seriesId);
        if (series) {
            series.addComment(text, episodeId);
            this.storage.updateSeries(series.id, series);
            this.showSeries(series.id);
            Toast.show('Comentario agregado', 'success');
        }
    }

    copyEmbedCode(episodeId) {
        // Implementation for copying embed code
        Toast.show('Código copiado al portapapeles', 'success');
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
                    <div class="admin-header">
                        <h2>Panel de Administración</h2>
                        <button onclick="ui.showHome()" class="btn">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="admin-stats">
                        <div class="stat-card">
                            <i data-lucide="film"></i>
                            <span class="value">${series.length}</span>
                            <span class="label">Series</span>
                        </div>
                        <div class="stat-card">
                            <i data-lucide="play"></i>
                            <span class="value">${series.reduce((acc, s) => acc + s.episodes.length, 0)}</span>
                            <span class="label">Episodios</span>
                        </div>
                        <div class="stat-card">
                            <i data-lucide="eye"></i>
                            <span class="value">${series.reduce((acc, s) => acc + s.stats.views, 0)}</span>
                            <span class="label">Vistas</span>
                        </div>
                    </div>
                    <div class="admin-series">
                        ${series.map(serie => `
                            <div class="admin-series-item">
                                <img src="${serie.coverImage}" alt="${serie.title}">
                                <div class="series-info">
                                    <h3>${serie.title}</h3>
                                    <p>${serie.episodes.length} episodios</p>
                                </div>
                                <div class="actions">
                                    <button onclick="ui.editSeries(${serie.id})" class="btn btn-secondary">
                                        <i data-lucide="edit"></i>
                                    </button>
                                    <button onclick="ui.deleteSeries(${serie.id})" class="btn btn-danger">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            lucide.createIcons();
        } else {
            Toast.show('Contraseña incorrecta', 'error');
        }
    }

    deleteSeries(seriesId) {
        if (confirm('¿Estás seguro de eliminar esta serie?')) {
            this.storage.deleteSeries(seriesId);
            Toast.show('Serie eliminada', 'success');
            this.showAdminPanel();
        }
    }
}