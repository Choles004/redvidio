document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const compressButton = document.getElementById('compressButton');
    const progressSection = document.getElementById('progress-section');
    const fileInputSection = document.getElementById('file-input-section'); // Añadida referencia faltante
    const progressBar = document.getElementById('progress');
    const progressText = document.getElementById('progressText');
    const downloadSection = document.getElementById('download-section');
    const downloadLink = document.getElementById('downloadLink');

    compressButton.addEventListener('click', async () => {
        const files = fileInput.files;

        if (files.length === 0) {
            alert('Por favor, selecciona al menos un archivo para comprimir.');
            return;
        }

        // Mostrar la sección de progreso y ocultar las otras
        progressSection.classList.remove('hidden');
        downloadSection.classList.add('hidden');
        fileInputSection.classList.add('hidden');

        let zip = new JSZip();
        let totalFiles = files.length;
        let processedFiles = 0;
        let totalSize = 0;
        let processedSize = 0;

        // Calcular el tamaño total de todos los archivos
        for (let file of files) {
            totalSize += file.size;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const currentProcessed = processedSize + event.loaded;
                    const progressPercent = (currentProcessed / totalSize) * 100;
                    updateProgressBar(progressPercent);
                }
            };

            reader.onload = async (event) => {
                zip.file(file.name, event.target.result);
                processedFiles++;
                processedSize += file.size;

                if (processedFiles === totalFiles) {
                    updateProgressBar(95); // Indicar que estamos generando el ZIP
                    try {
                        const blob = await zip.generateAsync({ 
                            type: "blob",
                            compression: "DEFLATE",
                            compressionOptions: {
                                level: 6 // Nivel de compresión moderado
                            }
                        }, (metadata) => {
                            // Actualizar progreso durante la generación del ZIP
                            updateProgressBar(95 + (metadata.percent * 0.05));
                        });

                        const zipFilename = `comprimido_${new Date().toISOString().slice(0,10)}.zip`;
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.download = zipFilename;

                        progressSection.classList.add('hidden');
                        downloadSection.classList.remove('hidden');
                        fileInputSection.classList.remove('hidden');
                        updateProgressBar(100);
                    } catch (error) {
                        console.error("Error al generar el archivo ZIP:", error);
                        alert("Ocurrió un error al comprimir los archivos.");
                        resetInterface();
                    }
                }
            };

            reader.onerror = () => {
                console.error("Error al leer el archivo", file.name);
                alert(`Error al leer el archivo: ${file.name}`);
                processedFiles++;
                if (processedFiles === totalFiles) {
                    resetInterface();
                }
            };

            reader.readAsArrayBuffer(file);
        }
    });

    function updateProgressBar(percentage) {
        const roundedPercentage = Math.min(100, Math.round(percentage));
        progressBar.style.width = `${roundedPercentage}%`;
        progressText.textContent = `${roundedPercentage}%`;
    }

    function resetInterface() {
        progressSection.classList.add('hidden');
        fileInputSection.classList.remove('hidden');
        downloadSection.classList.add('hidden');
        updateProgressBar(0);
    }
});
