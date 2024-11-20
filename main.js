// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar la aplicación
  const storage = new Storage();
  window.ui = new UI(storage); // Hacer ui accesible globalmente para los event handlers
});
