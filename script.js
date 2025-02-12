/* script.js */
// ¡Oye, mi llave! Aquí viene el cerebro pa’ que la IA te maneje tareas, XP, habilidades y todo el flow.

const GEMINI_API_KEY = 'AIzaSyClb0MndbsAdLSfygl3zdrwYvNfXgL_n5Q';
const DOCUMENTOS = {
  personaje: 'https://docs.google.com/document/d/1akM5h7FH0Rnns-AzqMe2aIKYSjBVeM03BYE1RHwh4fs/export?format=txt',
  actualizado: 'https://docs.google.com/document/d/15bIuLeiO0yecgG0mKlxbFKMdQZ0YaN4CU8QpDEaaQAQ/export?format=txt'
};

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let abilities = JSON.parse(localStorage.getItem('abilities')) || [];
let stats = {};

// Inicialización de la aplicación
async function inicializar() {
  await cargarDatos();
  cargarTareas();
  cargarHabilidades();
  actualizarUI();
  setInterval(verificarTareas, 60000); // Verifica tareas cada minuto
}

// Cargar datos desde Google Drive y actualizar estadísticas
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

// Actualiza la UI de las barras y niveles
function actualizarNiveles() {
  Object.entries(stats).forEach(([stat, valor]) => {
    const elementoBarra = document.getElementById(`stat-${stat}`);
    if (elementoBarra) {
      elementoBarra.style.width = `${valor}%`;
    }
    const elementoNivel = document.getElementById(`level-${stat}`);
    if (elementoNivel) {
      elementoNivel.textContent = Math.floor(valor / 10);
    }
  });
}

// Llama a la API Gemini para generar un análisis y actualizar la ficha
async function generarAnalisisIA() {
  try {
    const prompt = `Analiza este personaje RPG y genera un resumen en formato JSON con: nivel_general, puntos_fuertes, recomendaciones. Datos: ${JSON.stringify(stats)}`;
    const respuesta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
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

// Muestra el análisis generado por la IA
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

// Cargar tareas desde localStorage y mostrarlas en la UI
function cargarTareas() {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = tasks.map((tarea, index) => `
    <li class="${tarea.completada ? 'completada' : ''}">
      <div class="tarea-info">
        <h4>${tarea.nombre}</h4>
        <p>📅 ${tarea.fecha} | ${tarea.completada ? '✅ Completada' : '🟡 En progreso'}</p>
      </div>
      <div class="tarea-acciones">
        <button class="complete-btn" onclick="toggleCompletada(${index})">
          ${tarea.completada ? '↩️ Revertir' : '✔️ Completar'}
        </button>
        <button class="edit-btn" onclick="editarTarea(${index})">✏️ Editar</button>
        <button class="delete-btn" onclick="eliminarTarea(${index})">🗑️ Eliminar</button>
      </div>
    </li>
  `).join('');
}

// Cargar habilidades desde localStorage y mostrarlas
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

// Función para actualizar XP en una estadística
function actualizarXP(stat, xpDelta) {
  if (typeof stats[stat] === 'undefined') {
    stats[stat] = 0;
  }
  stats[stat] += xpDelta;
  if (stats[stat] < 0) stats[stat] = 0;
  actualizarNiveles();
}

// Verifica y desbloquea o actualiza habilidades según tareas completadas
function verificarDesbloqueoHabilidad(categoria) {
  // Cuenta tareas completadas para la categoría (usa tarea.stat o "inteligencia" por defecto)
  const completedCount = tasks.filter(t => t.completada && (t.stat || "inteligencia") === categoria).length;
  let ability = abilities.find(a => a.category === categoria);
  if (!ability && completedCount >= 3) {
    // Desbloquea nueva habilidad
    ability = { category: categoria, level: 1, xp: 0 };
    abilities.push(ability);
    guardarHabilidades();
    mostrarHabilidades();
    agregarMensajeChat('ia', `¡Felicitaciones! Has desbloqueado una nueva habilidad en ${categoria} nivel 1.`);
  } else if (ability) {
    // Aumenta XP en la habilidad; cada 50 XP sube de nivel
    ability.xp += 10;
    if (ability.xp >= 50 * ability.level) {
      ability.level++;
      agregarMensajeChat('ia', `¡Increíble! Tu habilidad en ${categoria} ha subido a nivel ${ability.level}.`);
    }
    guardarHabilidades();
    mostrarHabilidades();
  }
}

// Función para alternar la finalización de una tarea y actualizar XP/habilidades
window.toggleCompletada = function(index) {
  const task = tasks[index];
  const wasCompleted = task.completada;
  task.completada = !task.completada;
  guardarTareas();
  cargarTareas();
  
  // Usa la categoría de la tarea o "inteligencia" por defecto
  const categoria = task.stat || "inteligencia";
  if (!wasCompleted && task.completada) {
    // Tarea completada: suma XP y verifica habilidad
    actualizarXP(categoria, +10);
    verificarDesbloqueoHabilidad(categoria);
  } else if (wasCompleted && !task.completada) {
    // Se revierte la tarea: resta XP
    actualizarXP(categoria, -10);
    let ability = abilities.find(a => a.category === categoria);
    if (ability) {
      ability.xp = Math.max(0, ability.xp - 10);
      guardarHabilidades();
      mostrarHabilidades();
    }
  }
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
    // Puedes incluir opcionalmente una categoría o stat en la tarea
    tasks.push({
      nombre: nombre,
      fecha: fecha,
      completada: false,
      stat: "inteligencia"  // Por defecto, si no se especifica
    });
    guardarTareas();
    cargarTareas();
  }
});

// Función para enviar consultas al ChatBot con IA
async function enviarConsultaIA() {
  const input = document.getElementById('iaInput');
  const mensaje = input.value.trim();
  if (!mensaje) return;
  
  // Muestra el mensaje del usuario en el chat
  agregarMensajeChat('usuario', mensaje);
  input.value = '';
  
  try {
    // Instruye a la IA para que, si el mensaje indica una actividad,
    // genere una tarea en formato JSON con { "nombre": "tarea", "fecha": "YYYY-MM-DD", "stat": "categoria" }
    const prompt = `El usuario dice: "${mensaje}". Si este mensaje indica que va a realizar una actividad o tarea, clasifícala y genera una tarea en formato JSON con la estructura: { "nombre": "tarea", "fecha": "YYYY-MM-DD", "stat": "categoria opcional" }. Además, responde de forma instructiva y, si es necesario, sugiere nuevas tareas basadas en metas mensuales o anuales. Responde en formato JSON con { "respuesta": "tu respuesta", "tareas": [ ... ] } si aplica.`;
    const respuesta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
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
    
    // Muestra la respuesta de la IA en el chat
    agregarMensajeChat('ia', respuestaIA.respuesta);
    
    // Si la respuesta incluye tareas, agrégalas al gestor
    if (Array.isArray(respuestaIA.tareas) && respuestaIA.tareas.length > 0) {
      respuestaIA.tareas.forEach(tarea => {
        // Asegúrate de que tenga nombre y fecha; opcionalmente una categoría
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

// Función para agregar mensajes al chat
function agregarMensajeChat(remitente, mensaje) {
  const chatBox = document.getElementById('chatBox');
  const mensajeElemento = document.createElement('div');
  mensajeElemento.className = `mensaje ${remitente}`;
  mensajeElemento.textContent = mensaje;
  chatBox.appendChild(mensajeElemento);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Función para verificar tareas (puedes personalizar notificaciones, etc.)
function verificarTareas() {
  console.log('Verificando tareas...');
}

// Actualiza la UI general (si es necesario)
function actualizarUI() {
  // Aquí puedes agregar más actualizaciones si lo requieres
}

// Inicializa la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', inicializar);
