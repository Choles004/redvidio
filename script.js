// Configuración y variables globales
let series = JSON.parse(localStorage.getItem('series')) || [];
const PASSWORD = '1234';

// Referencias DOM principales
const addSeriesBtn = document.getElementById('addSeriesBtn');
const seriesModal = document.getElementById('seriesModal');
const deleteModal = document.getElementById('deleteModal');
const seriesGrid = document.getElementById('seriesGrid');
const searchInput = document.querySelector('.search-bar input');

// Event Listeners iniciales
document.addEventListener('DOMContentLoaded', () => {
    renderSeries();
    setupEventListeners();
    setupSearchFunctionality();
});

// Configuración de todos los event listeners
function setupEventListeners() {
    addSeriesBtn.addEventListener('click', () => {
        seriesModal.style.display = 'block';
        resetFormAndPreview();
    });

    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
            resetFormAndPreview();
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            resetFormAndPreview();
        }
    });

    document.getElementById('submitPassword').addEventListener('click', () => {
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput.value === PASSWORD) {
            document.getElementById('passwordCheck').classList.add('hidden');
            document.getElementById('seriesForm').classList.remove('hidden');
        } else {
            alert('Contraseña incorrecta');
            passwordInput.value = '';
        }
    });

    const coverInput = document.getElementById('seriesCoverFile');
    const coverPreview = document.getElementById('coverPreview');
    const titleInput = document.getElementById('seriesTitle');

    coverInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            const imageUrl = await handleImageUpload(e.target.files[0]);
            coverPreview.src = imageUrl;
            coverPreview.style.display = 'block';
        }
    });

    titleInput.addEventListener('input', async () => {
        if (coverInput.files && coverInput.files[0]) {
            const imageUrl = await handleImageUpload(coverInput.files[0]);
            coverPreview.src = imageUrl;
        }
    });

    document.getElementById('seriesForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addNewSeries();
    });
}

// Función para búsqueda dinámica
function setupSearchFunctionality() {
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const seriesCards = seriesGrid.querySelectorAll('.series-card');
        seriesCards.forEach(card => {
            const title = card.querySelector('.series-title').textContent.toLowerCase();
            const description = card.querySelector('.series-description').textContent.toLowerCase();
            card.style.display = (title.includes(searchTerm) || description.includes(searchTerm)) ? '' : 'none';
        });
    });
}

// Función para manejar la carga y procesamiento de imágenes
function handleImageUpload(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);

                const title = document.getElementById('seriesTitle').value;
                if (title) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(0, img.height - 60, img.width, 60);

                    ctx.font = 'bold 30px Roboto';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(title, img.width / 2, img.height - 30);
                }

                resolve(canvas.toDataURL('image/jpeg,png', 0.8));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Función para agregar nueva serie
// Funciones auxiliares
async function createFolderWithFiles(folderName, series) {
    try {
        // Crear carpeta en el servidor
        await fetch(`/api/folders/${folderName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(series)
        });

        // Subir archivos a la carpeta
        const coverFile = document.getElementById('seriesCoverFile').files[0];
        const formData = new FormData();
        formData.append('cover', coverFile);
        await fetch(`/api/folders/${folderName}/cover`, {
            method: 'POST',
            body: formData
        });

        // Actualizar información de la serie
        series.cover = `/api/folders/${folderName}/cover`;
        saveSeries();
        renderSeries();
        showNotification('Serie agregada exitosamente', 'success');
    } catch (error) {
        showNotification('Error al agregar la serie', 'error');
        console.error('Error al crear la carpeta y archivos:', error);
    }
}

async function addNewSeries() {
    const title = document.getElementById('seriesTitle').value;
    const description = document.getElementById('seriesDescription').value;
    const keywords = document.getElementById('seriesKeywords').value.split(',').map(k => k.trim());
    const coverUrl = document.getElementById('coverPreview').src;
    const newSeries = {
        id: Date.now(),
        title,
        description,
        cover: coverUrl,
        keywords,
        episodes: []
    };

    series.push(newSeries);
    saveSeries();
    renderSeries();
    seriesModal.style.display = 'none';
    resetFormAndPreview();

    const folderName = `nueva_serie/${newSeries.id}`;
    await createFolderWithFiles(folderName, newSeries);
}

// Resto del código...