/* script.js - Cerebro futurista con gestión de tareas, XP, habilidades y archivos */

// Claves y URLs para conectar con Google Drive (documentos de estadísticas)
const GEMINI_API_KEY = 'AIzaSyClb0MndbsAdLSfygl3zdrwYvNfXgL_n5Q';
const DOCUMENTOS = {
  personaje: 'https://docs.google.com/document/d/1akM5h7FH0Rnns-AzqMe2aIKYSjBVeM03BYE1RHwh4fs/export?format=txt',
  actualizado: 'https://docs.google.com/document/d/15bIuLeiO0yecgG0mKlxbFKMdQZ0YaN4CU8QpDEaaQAQ/export?format=txt'
};

// Variables globales
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let abilities = JSON.parse(localStorage.getItem('abilities')) || [];
let stats = {};

// Inicialización de la aplicación
async function inicializar() {
  await cargarMiInfo();  // Carga tu información personal desde "Personaje.txt"
  await cargarDatos();   // Carga estadísticas desde Google Drive
  cargarTareas();
  cargarHabilidades();
  actualizarUI();
  setInterval(verificarTareas, 60000); // Revisa tareas cada minuto
}

// Carga la información personal desde "Personaje.txt"
async function cargarMiInfo() {
  try {
    const response = await fetch('Personaje.txt');
    if (!response.ok) {
      throw new Error('No se pudo cargar Personaje.txt');
    }
    const text = await response.text();
    document.getElementById('character-info').innerText = text;
  } catch (error) {
    console.error('Error cargando mi información:', error);
    document.getElementById('character-info').innerText = 'Información personal no disponible.';
  }
}

// Carga datos desde Google Drive y actualiza las estadísticas
async function cargarDatos() {
  try {
    const [respPersonaje, respActualizado] = await Promise.all([
      fetch(DOCUMENTOS.personaje).then(r => r.text()),
      fetch(DOCUMENTOS.actualizado).then(r => r.text())
    ]);
    
    const contenido = respPersonaje + '\n' + respActualizado;
    stats = extraerEstadisticas(contenido);
    actualizarNiveles();
    generarAnalisisIA();
  } catch (error) {
    console.error('Error cargando datos:', error);
  }
}

// Extrae estadísticas del texto usando regex
function extraerEstadisticas(texto) {
  const statsExtraidas = {};
  const regex = /- (\w+).*?: (\d+)\//g;
  let coincidencia;
  while ((coincidencia = regex.exec(texto)) !== null) {
    const stat = coincidencia[1].toLowerCase();
    const valor = parseInt(coincidencia[2]);
    statsExtraidas[stat] = valor;
  }
  return statsExtraidas;
}

// Actualiza las barras de estadísticas, niveles y XP en la UI
function actualizarNiveles() {
  Object.entries(stats).forEach(([stat, valor]) => {
    const barra = document.getElementById(`stat-${stat}`);
    if (barra) {
      barra.style.width = `${valor}%`;
    }
    const nivelElem = document.getElementById(`level-${stat}`);
    if (nivelElem) {
      nivelElem.textContent = Math.floor(valor / 10);
    }
    const xpElem = document.getElementById(`xp-${stat}`);
    if (xpElem) {
      xpElem.textContent = `${valor} / 100 XP`;
    }
  });
}

// Llama a la API Gemini para generar un análisis y lo muestra
async function generarAnalisisIA() {
  try {
    const prompt = `Analiza este personaje RPG y genera un resumen en formato JSON con: nivel_general, puntos_fuertes, recomendaciones. Datos: ${JSON.stringify(stats)}`;
    const respuesta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });
    const data = await respuesta.json();
    const textoIA = data.candidates[0].content.parts[0].text;
    const analisis = JSON.parse(textoIA);
    mostrarAnalisis(analisis);
  } catch (error) {
    console.error('Error en IA:', error);
  }
}

// Muestra el análisis de la IA en la interfaz
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
  if (headerNivel) {
    headerNivel.textContent = `Nivel: ${nivel_general}`;
  }
}

// Carga las tareas desde localStorage y muestra solo las pendientes (no completadas)
function cargarTareas() {
  const taskList = document.getElementById('taskList');
  const tareasPendientes = tasks.filter(tarea => !tarea.completada);
  taskList.innerHTML = tareasPendientes.map((tarea, index) => `
    <li>
      <div class="tarea-info">
        <h4>${tarea.nombre}</h4>
        <p>📅 ${tarea.fecha} | ${tarea.completada ? '✅ Completada' : '🟡 En progreso'}</p>
      </div>
      <div class="tarea-acciones">
        <button class="complete-btn" onclick="toggleCompletada(${index}, '${tarea.nombre}')">
          ✔️ Completar
        </button>
        <button class="edit-btn" onclick="editarTarea(${index})">✏️ Editar</button>
        <button class="delete-btn" onclick="eliminarTarea(${index})">🗑️ Eliminar</button>
      </div>
    </li>
  `).join('');
}

// Guarda las tareas en localStorage
function guardarTareas() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Carga y muestra las habilidades
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
  abilitiesList.innerHTML = abilities.map(ability => `
    <li>
      <strong>${ability.category}</strong> - Nivel: ${ability.level} (XP: ${ability.xp})
    </li>
  `).join('');
}

// Actualiza XP en una estadística y refresca la UI
function actualizarXP(stat, xpDelta) {
  if (typeof stats[stat] === 'undefined') {
    stats[stat] = 0;
  }
  stats[stat] += xpDelta;
  if (stats[stat] < 0) stats[stat] = 0;
  actualizarNiveles();
}

// Verifica y desbloquea/actualiza habilidades según tareas completadas
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

// Alterna el estado de una tarea y actualiza XP/habilidades  
// (si se completa, se deja de mostrar en la UI, pero se conserva en tasks)
window.toggleCompletada = function(index, nombre) {
  // Buscamos la tarea en el array original (teniendo en cuenta que en la UI se filtraron)
  const tareaIndex = tasks.findIndex(t => t.nombre === nombre && !t.completada);
  if (tareaIndex === -1) return;
  const task = tasks[tareaIndex];
  task.completada = true;
  guardarTareas();
  // Actualizamos la UI: se ocultará al recargar tareas pendientes
  cargarTareas();
  
  const categoria = task.stat || "inteligencia";
  // Si se completa la tarea, suma XP y verifica la habilidad
  actualizarXP(categoria, +10);
  verificarDesbloqueoHabilidad(categoria);
};

window.editarTarea = function(index) {
  const nuevoNombre = prompt('Editar tarea:', tasks[index].nombre);
  if (nuevoNombre) {
    tasks[index].nombre = nuevoNombre;
    guardarTareas();
    cargarTareas();
  }
};

window.eliminarTarea = function(index) {
  if (confirm('¿Eliminar esta tarea?')) {
    tasks.splice(index, 1);
    guardarTareas();
    cargarTareas();
  }
};

document.getElementById('addTaskBtn').addEventListener('click', () => {
  const nombre = document.getElementById('taskInput').value.trim();
  const fecha = document.getElementById('taskDate').value;
  if (nombre && fecha) {
    tasks.push({
      nombre: nombre,
      fecha: fecha,
      completada: false,
      stat: "inteligencia"  // Por defecto se asigna esta categoría
    });
    guardarTareas();
    cargarTareas();
  }
});

// Envía la consulta del usuario al ChatBot con IA
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
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
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
      respuestaIA.tareas.forEach(tarea => {
        if (tarea.nombre && tarea.fecha) {
          tasks.push({
            nombre: tarea.nombre,
            fecha: tarea.fecha,
            completada: false,
            stat: tarea.stat || "inteligencia"
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

// Agrega un mensaje al chat
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
  // Más actualizaciones si son necesarias
}

// Funciones para exportar datos a archivos de texto
function exportarTareas() {
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tareas.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function exportarMiInfo() {
  const data = document.getElementById('character-info').innerText;
  const blob = new Blob([data], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'informacion.txt'; // Ahora se descarga como informacion.txt
  a.click();
  URL.revokeObjectURL(url);
}

// Inicializa la aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', inicializar);
