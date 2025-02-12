/* script.js - Versión actualizada para registrar XP, eliminar tareas completadas y leer Personaje.txt */

// Claves y URLs para conectar con Google Drive (estadísticas)
const GEMINI_API_KEY = 'AIzaSyClb0MndbsAdLSfygl3zdrwYvNfXgL_n5Q';
const DOCUMENTOS = {
  personaje: 'https://docs.google.com/document/d/1akM5h7FH0Rnns-AzqMe2aIKYSjBVeM03BYE1RHwh4fs/export?format=txt',
  actualizado: 'https://docs.google.com/document/d/15bIuLeiO0yecgG0mKlxbFKMdQZ0YaN4CU8QpDEaaQAQ/export?format=txt'
};

// Variables globales
// Se guardan tareas y habilidades en localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let abilities = JSON.parse(localStorage.getItem('abilities')) || [];
// stats se carga de localStorage o se inicia vacío y luego se fusiona con los datos remotos
let stats = JSON.parse(localStorage.getItem('stats')) || {};

// Inicializa la aplicación
async function inicializar() {
  await cargarMiInfo();  // Carga información personal desde "Personaje.txt"
  await cargarDatos();   // Carga estadísticas desde Google Drive y fusiona con las guardadas
  cargarTareas();
  cargarHabilidades();
  actualizarUI();
  setInterval(verificarTareas, 60000); // Revisa tareas cada minuto
}

// Carga la información personal desde "Personaje.txt"
async function cargarMiInfo() {
  try {
    const response = await fetch('Personaje.txt');
    if (!response.ok) throw new Error('No se pudo cargar Personaje.txt');
    const text = await response.text();
    document.getElementById('character-info').innerText = text;
  } catch (error) {
    console.error('Error cargando mi información:', error);
    document.getElementById('character-info').innerText = 'Información personal no disponible.';
  }
}

// Carga datos remotos y fusiona con los stats guardados
async function cargarDatos() {
  try {
    const [respPersonaje, respActualizado] = await Promise.all([
      fetch(DOCUMENTOS.personaje).then(r => r.text()),
      fetch(DOCUMENTOS.actualizado).then(r => r.text())
    ]);
    const contenido = respPersonaje + '\n' + respActualizado;
    const fetchedStats = extraerEstadisticas(contenido);
    // Fusiona: se mantienen los XP locales (prioritarios) si ya fueron modificados
    stats = { ...fetchedStats, ...stats };
    localStorage.setItem('stats', JSON.stringify(stats));
    actualizarNiveles();
    generarAnalisisIA();
  } catch (error) {
    console.error('Error cargando datos:', error);
  }
}

// Extrae estadísticas del texto usando regex (ejemplo: "- Resistencia: 65/100")
function extraerEstadisticas(texto) {
  const statsExtraidas = {};
  const regex = /- (\w+).*?: (\d+)\//g;
  let match;
  while ((match = regex.exec(texto)) !== null) {
    const stat = match[1].toLowerCase();
    const valor = parseInt(match[2]);
    statsExtraidas[stat] = valor;
  }
  return statsExtraidas;
}

// Actualiza la interfaz: barras, niveles y XP
function actualizarNiveles() {
  Object.entries(stats).forEach(([stat, valor]) => {
    const barra = document.getElementById(`stat-${stat}`);
    if (barra) { barra.style.width = `${valor}%`; }
    const nivelElem = document.getElementById(`level-${stat}`);
    if (nivelElem) { nivelElem.textContent = Math.floor(valor / 10); }
    const xpElem = document.getElementById(`xp-${stat}`);
    if (xpElem) { xpElem.textContent = `${valor} / 100 XP`; }
  });
}

// Llama a la API Gemini para generar un análisis y lo muestra
async function generarAnalisisIA() {
  try {
    const prompt = `Analiza este personaje RPG y genera un resumen en formato JSON con: nivel_general, puntos_fuertes, recomendaciones. Datos: ${JSON.stringify(stats)}`;
    const respuesta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await respuesta.json();
    const textoIA = data.candidates[0].content.parts[0].text;
    const analisis = JSON.parse(textoIA);
    mostrarAnalisis(analisis);
  } catch (error) {
    console.error('Error en IA:', error);
  }
}

// Muestra el análisis de la IA en el área designada
function mostrarAnalisis({ nivel_general, puntos_fuertes, recomendaciones }) {
  const contenedor = document.getElementById('ia-analysis');
  contenedor.innerHTML = `
    <div class="ia-card">
      <h3>🧠 Análisis IA (Nivel ${nivel_general})</h3>
      <p><strong>Puntos fuertes:</strong> ${puntos_fuertes.join(', ')}</p>
      <p><strong>Recomendaciones:</strong></p>
      <ul>${recomendaciones.map(r => `<li>${r}</li>`).join('')}</ul>
    </div>
  `;
  const headerNivel = document.getElementById('character-level');
  if (headerNivel) { headerNivel.textContent = `Nivel: ${nivel_general}`; }
}

// Carga las tareas desde localStorage y muestra solo las pendientes
function cargarTareas() {
  const taskList = document.getElementById('taskList');
  // Filtramos solo las tareas que NO estén completadas
  const tareasPendientes = tasks.filter(t => !t.completada);
  taskList.innerHTML = tareasPendientes.map(t => `
    <li>
      <div class="tarea-info">
        <h4>${t.nombre}</h4>
        <p>📅 ${t.fecha} | 🟡 En progreso</p>
      </div>
      <div class="tarea-acciones">
        <button class="complete-btn" onclick="toggleCompletada('${t.nombre}')">✔️ Completar</button>
        <button class="edit-btn" onclick="editarTarea('${t.nombre}')">✏️ Editar</button>
        <button class="delete-btn" onclick="eliminarTarea('${t.nombre}')">🗑️ Eliminar</button>
      </div>
    </li>
  `).join('');
}

// Guarda las tareas en localStorage
function guardarTareas() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Carga y muestra las habilidades desde localStorage
function cargarHabilidades() {
  abilities = JSON.parse(localStorage.getItem('abilities')) || [];
  mostrarHabilidades();
}

function guardarHabilidades() {
  localStorage.setItem('abilities', JSON.stringify(abilities));
}

function mostrarHabilidades() {
  const abilitiesList = document.getElementById('abilitiesList');
  if (!abilitiesList) return;
  abilitiesList.innerHTML = abilities.map(a => `
    <li>
      <strong>${a.category}</strong> - Nivel: ${a.level} (XP: ${a.xp})
    </li>
  `).join('');
}

// Actualiza el XP para una estadística, guarda y refresca la UI
function actualizarXP(stat, xpDelta) {
  if (typeof stats[stat] === 'undefined') { stats[stat] = 0; }
  stats[stat] += xpDelta;
  if (stats[stat] < 0) { stats[stat] = 0; }
  localStorage.setItem('stats', JSON.stringify(stats));
  actualizarNiveles();
}

// Verifica y, en caso, desbloquea o actualiza una habilidad según tareas completadas
function verificarDesbloqueoHabilidad(categoria) {
  const completedCount = tasks.filter(t => t.completada && (t.stat || "inteligencia") === categoria).length;
  let ability = abilities.find(a => a.category === categoria);
  if (!ability && completedCount >= 3) {
    ability = { category: categoria, level: 1, xp: 0 };
    abilities.push(ability);
    guardarHabilidades();
    mostrarHabilidades();
    agregarMensajeChat('ia', `¡Felicitaciones! Has desbloqueado una nueva habilidad en ${categoria} nivel 1.`);
  } else if (ability) {
    ability.xp += 10;
    if (ability.xp >= 50 * ability.level) {
      ability.level++;
      agregarMensajeChat('ia', `¡Increíble! Tu habilidad en ${categoria} ha subido a nivel ${ability.level}.`);
    }
    guardarHabilidades();
    mostrarHabilidades();
  }
}

// Función para buscar una tarea por nombre (se asume que es único)
function buscarTarea(nombre) {
  return tasks.find(t => t.nombre === nombre);
}

// Marca una tarea como completada, suma el XP y actualiza la UI
function toggleCompletada(nombre) {
  const tarea = buscarTarea(nombre);
  if (!tarea) return;
  // Marca la tarea como completada
  tarea.completada = true;
  guardarTareas();
  // Solo se muestran las tareas pendientes, así que al recargar no aparecerá
  cargarTareas();
  // Suma XP a la estadística asociada (por defecto "inteligencia")
  const categoria = tarea.stat || "inteligencia";
  actualizarXP(categoria, +10);
  verificarDesbloqueoHabilidad(categoria);
}

// Edita una tarea buscándola por nombre
function editarTarea(nombre) {
  const tarea = buscarTarea(nombre);
  if (!tarea) return;
  const nuevoNombre = prompt('Editar tarea:', tarea.nombre);
  if (nuevoNombre) {
    tarea.nombre = nuevoNombre;
    guardarTareas();
    cargarTareas();
  }
}

// Elimina una tarea (se filtran todas las que coincidan con el nombre)
function eliminarTarea(nombre) {
  tasks = tasks.filter(t => t.nombre !== nombre);
  guardarTareas();
  cargarTareas();
}

// Agrega una nueva tarea (se asume categoría por defecto "inteligencia")
document.getElementById('addTaskBtn').addEventListener('click', () => {
  const nombre = document.getElementById('taskInput').value.trim();
  const fecha = document.getElementById('taskDate').value;
  if (nombre && fecha) {
    tasks.push({
      nombre: nombre,
      fecha: fecha,
      completada: false,
      stat: "inteligencia"
    });
    guardarTareas();
    cargarTareas();
  }
});

// Envía la consulta al ChatBot con IA (la respuesta puede incluir nuevas tareas)
async function enviarConsultaIA() {
  const input = document.getElementById('iaInput');
  const mensaje = input.value.trim();
  if (!mensaje) return;
  agregarMensajeChat('usuario', mensaje);
  input.value = '';
  try {
    const prompt = `El usuario dice: "${mensaje}". Si este mensaje indica que va a realizar una actividad o tarea, clasifícala y genera una tarea en formato JSON con la estructura: { "nombre": "tarea", "fecha": "YYYY-MM-DD", "stat": "categoria opcional" }. Además, responde de forma instructiva y, si es necesario, sugiere nuevas tareas basadas en metas mensuales o anuales. Responde en formato JSON con { "respuesta": "tu respuesta", "tareas": [ ... ] } si aplica.`;
    const respuesta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await respuesta.json();
    const textoRespuesta = data.candidates[0].content.parts[0].text;
    let respuestaIA;
    try {
      respuestaIA = JSON.parse(textoRespuesta);
    } catch (e) {
      respuestaIA = { respuesta: textoRespuesta, tareas: [] };
    }
    agregarMensajeChat('ia', respuestaIA.respuesta);
    if (Array.isArray(respuestaIA.tareas) && respuestaIA.tareas.length > 0) {
      respuestaIA.tareas.forEach(nuevaTarea => {
        if (nuevaTarea.nombre && nuevaTarea.fecha) {
          tasks.push({
            nombre: nuevaTarea.nombre,
            fecha: nuevaTarea.fecha,
            completada: false,
            stat: nuevaTarea.stat || "inteligencia"
          });
        }
      });
      guardarTareas();
      cargarTareas();
    }
  } catch (error) {
    console.error('Error en consulta IA:', error);
    agregarMensajeChat('ia', 'Hubo un error procesando tu consulta.');
  }
}

// Agrega un mensaje al chat y ajusta el scroll
function agregarMensajeChat(remitente, mensaje) {
  const chatBox = document.getElementById('chatBox');
  const mensajeElemento = document.createElement('div');
  mensajeElemento.className = `mensaje ${remitente}`;
  mensajeElemento.textContent = mensaje;
  chatBox.appendChild(mensajeElemento);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Función para verificar tareas (puedes personalizar notificaciones)
function verificarTareas() {
  console.log('Verificando tareas...');
}

// Actualiza la UI general (otros ajustes si se requieren)
function actualizarUI() {
  // Aquí puedes colocar otros cambios si son necesarios
}

// Funciones para exportar datos a archivos de texto (se activan manualmente)
function exportarTareas() {
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tareas.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function exportarMiInfo() {
  const data = document.getElementById('character-info').innerText;
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'informacion.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// Inicializa la aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', inicializar);
