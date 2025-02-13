"use strict";

/***************************************
 * CONFIGURACIÓN GLOBAL
 ***************************************/
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const API_KEY = 'AIzaSyClb0MndbsAdLSfygl3zdrwYvNfXgL_n5Q';
const STATS_BASE = ['fuerza', 'agilidad', 'inteligencia', 'resistencia', 'carisma', 'sabiduria'];

/**
 * Calcula el nivel de una estadística según XP:
 * - Nivel 2: 300 XP
 * - Nivel 3: 800 XP
 * - Nivel 4: 1500 XP
 * - Nivel 5: 2500 XP
 */
function obtenerNivelEstadistica(xp) {
  if (xp >= 2500) return 5;
  else if (xp >= 1500) return 4;
  else if (xp >= 800) return 3;
  else if (xp >= 300) return 2;
  else return 1;
}

/**
 * Retorna la fecha de mañana en formato "YYYY-MM-DD"
 */
function obtenerFechaMañana() {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return manana.toISOString().split("T")[0];
}

/***************************************
 * OBJETO PRINCIPAL DEL USUARIO
 ***************************************/
let currentUser = {
  nombre: 'Sistema', // Se actualizará según informe
  nivel: 1,
  xp: 0,
  stats: {},
  habilidades: [],
  tareas: [],
  historia: '',
  elicis: {
    curacion: 0,
    fortalecimiento: { activo: false, expiracion: null }
  },
  misionesIAVencidas: 0
};

// Inicializar estadísticas base
STATS_BASE.forEach(stat => {
  currentUser.stats[stat] = { valor: 10, xp: 0, nivel: 1 };
});

// Variable para identificar la tarea en edición
let tareaEnEdicion = null;

/***************************************
 * INICIALIZACIÓN AL CARGAR EL DOCUMENTO
 ***************************************/
document.addEventListener("DOMContentLoaded", async () => {
  cargarDatosUsuario();
  inicializarEventos();
  if (currentUser.historia) {
    await analizarHistoriaConIA();
  }
  actualizarUI();
  verificarMisionesEspeciales();
});

/***************************************
 * EVENTOS DEL DOM
 ***************************************/
function inicializarEventos() {
  // Cambio de foto de perfil
  const photoFile = document.getElementById("photoFile");
  if (photoFile) {
    photoFile.addEventListener("change", event => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const profilePhoto = document.getElementById("profilePhoto");
          if (profilePhoto) profilePhoto.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Importar informe/historia
  const infoFile = document.getElementById("infoFile");
  if (infoFile) {
    infoFile.addEventListener("change", event => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
          currentUser.historia = e.target.result;
          guardarDatosUsuario();
          await analizarHistoriaConIA();
          actualizarUI();
        };
        reader.readAsText(file);
      }
    });
  }

  // Crear tarea manual (ingresada por el usuario)
  const addTaskBtn = document.getElementById("addTaskBtn");
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => {
      const taskName = document.getElementById("taskInput").value.trim();
      const taskDate = document.getElementById("taskDate").value;
      const taskTime = document.getElementById("taskTime").value; // opcional
      const taskTimer = document.getElementById("taskTimer").value; // opcional
      const taskDifficulty = document.getElementById("taskDifficulty").value;
      if (taskName && taskDate && taskDifficulty) {
        crearTareaManual({
          nombre: taskName,
          fecha: taskDate,
          hora: taskTime || null,
          temporizador: taskTimer ? parseInt(taskTimer) : null,
          dificultad: taskDifficulty,
          creadoPor: "usuario",
          estado: "pendiente"
        });
        // Limpiar campos
        document.getElementById("taskInput").value = "";
        document.getElementById("taskTime").value = "";
        document.getElementById("taskTimer").value = "";
      } else {
        mostrarNotificacion("Completa todos los campos obligatorios de la tarea.");
      }
    });
  }

  // Chatbot: envío de mensajes con Enter
  const iaInput = document.getElementById("iaInput");
  if (iaInput) {
    iaInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        const mensaje = iaInput.value.trim();
        if (mensaje) {
          // Si el mensaje indica una fecha (por ejemplo, "mañana" o "hoy"), se genera una tarea
          if (mensaje.toLowerCase().includes("mañana") || mensaje.toLowerCase().includes("hoy")) {
            const tareaData = await generarTareaIA(mensaje);
            if (tareaData) {
              crearTareaDesdeIA(tareaData);
              mostrarNotificacion("Tarea agregada desde el chatbot.");
              iaInput.value = "";
              return;
            }
          }
          await manejarConsultaIA(mensaje);
          iaInput.value = "";
        }
      }
    });
  }
}

/***************************************
 * COMUNICACIÓN CON LA IA
 ***************************************/
async function analizarConIA(prompt) {
  try {
    const response = await fetch(`${GEMINI_API}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) {
      const text = await response.text();
      console.error("Error en respuesta IA:", text);
      return null;
    }
    const data = await response.json();
    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0
    ) {
      return data.candidates[0].content.parts[0].text;
    }
    return null;
  } catch (error) {
    console.error("Error en analizarConIA:", error);
    mostrarNotificacion("Error en la comunicación con la IA");
    return null;
  }
}

/**
 * Analiza la historia y actualiza estadísticas, habilidades y nombre
 */
async function analizarHistoriaConIA() {
  if (!currentUser.historia) return;
  const prompt = `
Analiza la siguiente historia de personaje y genera un JSON con:
- stats_base: objeto con claves (fuerza, agilidad, inteligencia, resistencia, carisma, sabiduria) y valores numéricos.
- habilidades: array de 3 habilidades, cada una con nombre, descripcion, stat_principal y tipo.
- titulo_nivel: cadena con un título especial para el personaje.
Responde SOLO con el JSON sin texto adicional.
  `;
  const respuesta = await analizarConIA(prompt + "\n" + currentUser.historia);
  if (respuesta) {
    try {
      const data = JSON.parse(respuesta);
      if (data.stats_base) {
        STATS_BASE.forEach(stat => {
          currentUser.stats[stat] = { valor: data.stats_base[stat] || 10, xp: 0, nivel: 1 };
        });
      }
      if (data.habilidades) {
        currentUser.habilidades = data.habilidades.map(h => ({
          ...h,
          nivel: 1,
          xp: 0,
          xp_requerido: 100
        }));
      }
      if (data.titulo_nivel) {
        currentUser.nombre = data.titulo_nivel;
        document.getElementById("headerTitle").innerText = data.titulo_nivel;
        document.title = data.titulo_nivel;
      }
      guardarDatosUsuario();
    } catch (e) {
      console.error("Error parseando JSON de IA:", e);
    }
  }
}

/**
 * Maneja la consulta del chatbot.
 * Detecta comandos especiales (meta/objetivo, habilidad, curar, fortalecer) y, si el mensaje sugiere una tarea, delega en generarTareaIA.
 */
async function manejarConsultaIA(mensaje) {
  const msgLower = mensaje.toLowerCase();
  if (msgLower.includes("meta") || msgLower.includes("objetivo")) {
    const misionData = await generarMisionObjetivo(mensaje);
    if (misionData) {
      misionData.especial = true;
      misionData.creadoPor = "IA";
      misionData.estado = "pendiente";
      crearTareaDesdeIA(misionData);
      mostrarNotificacion("¡Misión especial asignada! Cumple tu meta para recibir recompensas.");
      return;
    }
  }
  if (msgLower.includes("habilidad")) {
    const habilidadData = await generarHabilidadIA(mensaje);
    if (habilidadData) {
      agregarHabilidad(habilidadData);
      return;
    }
  }
  if (msgLower.includes("curar")) {
    aplicarEliciCuracion();
    return;
  }
  if (msgLower.includes("fortalecer")) {
    aplicarEliciFortalecimiento();
    return;
  }
  // Diálogo normal: responde de forma conversacional
  const prompt = `Actúa como asistente de juego y dialoga de forma natural respondiendo: "${mensaje}"`;
  const respuesta = await analizarConIA(prompt);
  if (respuesta) {
    agregarMensajeChat("ia", respuesta);
  }
}

/**
 * Genera misión especial a partir del mensaje.
 */
async function generarMisionObjetivo(mensaje) {
  const prompt = `
A partir del siguiente mensaje sobre objetivos: "${mensaje}"
Crea una misión especial en formato JSON con los campos:
- nombre (string)
- descripcion (string)
- dificultad (easy, medium o hard)
- stats_afectados (array de objetos: { stat: string, xp: number })
- tiempo_estimado (horas, number)
- fecha (fecha límite, YYYY-MM-DD)
Responde SOLO con el JSON sin texto adicional.
  `;
  const respuesta = await analizarConIA(prompt);
  if (respuesta) {
    try {
      return JSON.parse(respuesta);
    } catch (e) {
      console.error("Error parseando JSON de misión:", e);
      return null;
    }
  }
  return null;
}

/**
 * Genera una tarea a partir del mensaje.
 * Se utiliza para comandos que incluyen indicaciones temporales ("mañana", "hoy").
 */
async function generarTareaIA(mensaje) {
  const prompt = `
A partir del siguiente mensaje: "${mensaje}"
Crea una tarea en formato JSON con los siguientes campos:
- nombre (string)
- descripcion (string)
- fecha (YYYY-MM-DD). Si no se especifica, utiliza la fecha de mañana (${obtenerFechaMañana()}).
- dificultad (easy, medium o hard)
Responde SOLO con el JSON sin texto adicional.
  `;
  let respuesta = await analizarConIA(prompt);
  if (respuesta) {
    try {
      return JSON.parse(respuesta);
    } catch (e) {
      console.error("Error parseando JSON de tarea:", e);
      // Fallback: retorna tarea predeterminada
      return {
        nombre: mensaje,
        descripcion: "",
        fecha: obtenerFechaMañana(),
        dificultad: "easy"
      };
    }
  }
  // Fallback si no hay respuesta de la IA
  return {
    nombre: mensaje,
    descripcion: "",
    fecha: obtenerFechaMañana(),
    dificultad: "easy"
  };
}

/***************************************
 * GESTIÓN DE HABILIDADES
 ***************************************/
function agregarHabilidad(habilidadData) {
  const nuevaHabilidad = {
    ...habilidadData,
    nivel: 1,
    xp: 0,
    xp_requerido: 100
  };
  currentUser.habilidades.push(nuevaHabilidad);
  guardarDatosUsuario();
  actualizarUI();
  mostrarNotificacion(`Habilidad agregada: ${nuevaHabilidad.nombre}`);
}

/***************************************
 * GESTIÓN DE TAREAS
 ***************************************/
function crearTareaManual(data) {
  const nuevaTarea = {
    id: Date.now(),
    nombre: data.nombre,
    fecha: data.fecha,
    hora: data.hora || null,
    temporizador: data.temporizador || null,
    dificultad: data.dificultad,
    creadoPor: data.creadoPor,
    estado: data.estado,
    stats_afectados: data.stats_afectados || [],
    xp_total: data.stats_afectados ? data.stats_afectados.reduce((sum, item) => sum + item.xp, 0) : 0,
    fecha_creacion: new Date().toISOString(),
    especial: data.especial || false
  };
  currentUser.tareas.push(nuevaTarea);
  guardarDatosUsuario();
  actualizarTareasUI();
  mostrarNotificacion(`Tarea creada: ${nuevaTarea.nombre}`);
}

function crearTareaDesdeIA(data) {
  const nuevaTarea = {
    id: Date.now(),
    nombre: data.nombre,
    fecha: data.fecha,
    hora: data.hora || null,
    temporizador: data.temporizador || null,
    dificultad: data.dificultad,
    descripcion: data.descripcion || "",
    creadoPor: "IA",
    estado: "pendiente",
    stats_afectados: data.stats_afectados || [],
    xp_total: data.stats_afectados ? data.stats_afectados.reduce((sum, item) => sum + item.xp, 0) : 0,
    fecha_creacion: new Date().toISOString(),
    especial: true
  };
  currentUser.tareas.push(nuevaTarea);
  guardarDatosUsuario();
  actualizarTareasUI();
  mostrarNotificacion(`Tarea creada: ${nuevaTarea.nombre}`);
}

function actualizarTareasUI() {
  // Separa tareas de usuario y tareas de IA
  const userTaskList = document.getElementById("taskList");
  const iaTaskList = document.getElementById("iaTaskList");
  
  const userTasks = currentUser.tareas.filter(t => t.creadoPor === "usuario");
  const iaTasks = currentUser.tareas.filter(t => t.creadoPor === "IA");
  
  if (userTaskList) {
    userTaskList.innerHTML = userTasks.map(tarea => {
      // Validar fecha
      if (!tarea.fecha || isNaN(new Date(tarea.fecha).getTime())) {
        return `<li id="task-${tarea.id}" class="task-item error">
                  <span><strong>${tarea.nombre}</strong> - <em>Fecha incompleta o inválida. Por favor completa la fecha.</em></span>
                </li>`;
      }
      const fechaLimite = new Date(tarea.fecha);
      const tresDiasDespues = new Date(fechaLimite.getTime() + (3 * 24 * 60 * 60 * 1000));
      if (new Date() > tresDiasDespues && tarea.estado === "pendiente") {
        currentUser.xp = Math.max(0, currentUser.xp - 100);
        if (tarea.creadoPor === "IA" && tarea.especial) {
          currentUser.misionesIAVencidas++;
        }
        tarea.estado = "vencida";
      }
      let botones = "";
      if (tarea.estado === "pendiente" || tarea.estado === "vencida") {
        botones += `<button onclick="marcarComoTerminado(${tarea.id})">Terminado</button>`;
        botones += `<button onclick="marcarComoNoTerminado(${tarea.id})">No Terminado</button>`;
        if (tarea.creadoPor === "usuario") {
          botones += `<button onclick="abrirModalEdicion(${tarea.id})">Editar</button>`;
        }
      }
      // Mostrar hora y temporizador si existen
      const horaStr = tarea.hora ? ` | Hora: ${tarea.hora}` : "";
      const timerStr = tarea.temporizador ? ` | Temporizador: ${tarea.temporizador} min` : "";
      return `<li id="task-${tarea.id}" class="task-item">
                <span><strong>${tarea.nombre}</strong> - ${tarea.fecha}${horaStr}${timerStr} - ${tarea.dificultad} (${tarea.estado})</span>
                <div class="task-buttons">${botones}</div>
              </li>`;
    }).join("");
  }
  
  if (iaTaskList) {
    iaTaskList.innerHTML = iaTasks.map(tarea => {
      // Validar fecha
      if (!tarea.fecha || isNaN(new Date(tarea.fecha).getTime())) {
        return `<li id="task-${tarea.id}" class="task-item error">
                  <span><strong>${tarea.nombre}</strong> - <em>Fecha incompleta o inválida.</em></span>
                </li>`;
      }
      const fechaLimite = new Date(tarea.fecha);
      const tresDiasDespues = new Date(fechaLimite.getTime() + (3 * 24 * 60 * 60 * 1000));
      if (new Date() > tresDiasDespues && tarea.estado === "pendiente") {
        currentUser.xp = Math.max(0, currentUser.xp - 100);
        if (tarea.creadoPor === "IA" && tarea.especial) {
          currentUser.misionesIAVencidas++;
        }
        tarea.estado = "vencida";
      }
      let botones = "";
      if (tarea.estado === "pendiente" || tarea.estado === "vencida") {
        botones += `<button onclick="marcarComoTerminado(${tarea.id})">Terminado</button>`;
        botones += `<button onclick="marcarComoNoTerminado(${tarea.id})">No Terminado</button>`;
      }
      const horaStr = tarea.hora ? ` | Hora: ${tarea.hora}` : "";
      const timerStr = tarea.temporizador ? ` | Temporizador: ${tarea.temporizador} min` : "";
      return `<li id="task-${tarea.id}" class="task-item">
                <span><strong>${tarea.nombre}</strong> - ${tarea.fecha}${horaStr}${timerStr} - ${tarea.dificultad} (${tarea.estado})</span>
                <div class="task-buttons">${botones}</div>
              </li>`;
    }).join("");
  }
  guardarDatosUsuario();
  verificarMisionesEspeciales();
}

function marcarComoTerminado(id) {
  const index = currentUser.tareas.findIndex(t => t.id === id);
  if (index !== -1) {
    const tarea = currentUser.tareas[index];
    let multiplicador = 1;
    if (currentUser.elicis.fortalecimiento.activo &&
        new Date() < new Date(currentUser.elicis.fortalecimiento.expiracion)) {
      multiplicador = 1.1;
    }
    if (Array.isArray(tarea.stats_afectados)) {
      tarea.stats_afectados.forEach(({ stat, xp }) => {
        const xpAdicional = Math.floor(xp * multiplicador);
        if (currentUser.stats[stat]) {
          currentUser.stats[stat].xp += xpAdicional;
          currentUser.stats[stat].nivel = obtenerNivelEstadistica(currentUser.stats[stat].xp);
        }
      });
    }
    currentUser.xp += (tarea.xp_total || 0) * multiplicador;
    if (tarea.creadoPor === "IA" && tarea.especial && currentUser.misionesIAVencidas > 0) {
      currentUser.misionesIAVencidas--;
    }
    // Elimina la tarea al completarla
    currentUser.tareas.splice(index, 1);
    guardarDatosUsuario();
    actualizarTareasUI();
  }
}

function marcarComoNoTerminado(id) {
  const index = currentUser.tareas.findIndex(t => t.id === id);
  if (index !== -1) {
    // Al marcar como no terminado, se resta XP y se elimina la tarea
    currentUser.xp = Math.max(0, currentUser.xp - 50);
    currentUser.tareas.splice(index, 1);
    guardarDatosUsuario();
    actualizarTareasUI();
  }
}

// Funciones para edición de tareas
function abrirModalEdicion(tareaId) {
  const tarea = currentUser.tareas.find(t => t.id === tareaId);
  if (tarea && tarea.creadoPor === "usuario") {
    tareaEnEdicion = tarea.id;
    document.getElementById("editTaskName").value = tarea.nombre;
    document.getElementById("editTaskDate").value = tarea.fecha;
    document.getElementById("editTaskTime").value = tarea.hora || "";
    document.getElementById("editTaskTimer").value = tarea.temporizador || "";
    document.getElementById("editTaskDifficulty").value = tarea.dificultad;
    toggleModal("editModal");
  }
}

function guardarCambiosTarea() {
  if (tareaEnEdicion) {
    const tarea = currentUser.tareas.find(t => t.id === tareaEnEdicion);
    if (tarea) {
      tarea.nombre = document.getElementById("editTaskName").value;
      tarea.fecha = document.getElementById("editTaskDate").value;
      tarea.hora = document.getElementById("editTaskTime").value || null;
      tarea.temporizador = document.getElementById("editTaskTimer").value ? parseInt(document.getElementById("editTaskTimer").value) : null;
      tarea.dificultad = document.getElementById("editTaskDifficulty").value;
      guardarDatosUsuario();
      actualizarTareasUI();
      mostrarNotificacion("Tarea actualizada.");
    }
    tareaEnEdicion = null;
    toggleModal("editModal");
  }
}

/***************************************
 * RECOMPENSAS – ELICIS
 ***************************************/
function aplicarEliciCuracion() {
  const xpRequerido = [100, 300, 800, 1500, 2500];
  const umbralActual = xpRequerido[currentUser.nivel - 1] || 100;
  if (currentUser.xp < umbralActual * 0.5) {
    currentUser.xp += 10;
    guardarDatosUsuario();
    actualizarUI();
    mostrarNotificacion("Elíci de curación aplicado: +10 XP");
  } else {
    mostrarNotificacion("El XP es suficiente, no es necesario curar.");
  }
}

function aplicarEliciFortalecimiento() {
  currentUser.elicis.fortalecimiento.activo = true;
  const dosDiasEnMs = 2 * 24 * 60 * 60 * 1000;
  currentUser.elicis.fortalecimiento.expiracion = new Date(Date.now() + dosDiasEnMs);
  guardarDatosUsuario();
  actualizarUI();
  mostrarNotificacion("Elíci de fortalecimiento activado: +10% XP en habilidades por 2 días");
}

function aplicarEliciFortalecimiento() {
  currentUser.elicis.fortalecimiento.activo = true;
  const dosDiasEnMs = 2 * 24 * 60 * 60 * 1000;
  currentUser.elicis.fortalecimiento.expiracion = new Date(Date.now() + dosDiasEnMs);
  guardarDatosUsuario();
  actualizarUI();
  mostrarNotificacion("Elíci de fortalecimiento activado: +10% XP en habilidades por 2 días");
}

/***************************************
 * VERIFICACIÓN DE MISIONES ESPECIALES
 ***************************************/
function verificarMisionesEspeciales() {
  const body = document.body;
  if (currentUser.misionesIAVencidas >= 3) {
    body.classList.remove("neon-blue");
    body.classList.add("neon-red");
    mostrarNotificacion("¡Atención! Tienes misiones especiales vencidas. Cumple las misiones para evitar perder niveles.");
  } else {
    body.classList.remove("neon-red");
    body.classList.add("neon-blue");
  }
}

/***************************************
 * ACTUALIZACIÓN DE LA INTERFAZ (UI)
 ***************************************/
function actualizarUI() {
  actualizarInfoPersonaje();
  actualizarStatsUI();
  actualizarAbilitiesUI();
  actualizarElicisUI();
  actualizarTareasUI();
}

/**
 * Actualiza la información del personaje
 */
function actualizarInfoPersonaje() {
  const infoDiv = document.getElementById("character-info");
  if (infoDiv) {
    infoDiv.innerHTML = `<h2>${currentUser.nombre}</h2>
                         <p>Nivel: ${currentUser.nivel} | XP: ${currentUser.xp}</p>`;
  }
}

/**
 * Actualiza la visualización de las estadísticas
 */
function actualizarStatsUI() {
  const statsContainer = document.getElementById("statsContainer");
  if (statsContainer) {
    statsContainer.innerHTML = STATS_BASE.map(stat => {
      const s = currentUser.stats[stat];
      let xpActual = s.xp;
      let umbral;
      if (s.nivel === 1) umbral = 300;
      else if (s.nivel === 2) umbral = 800;
      else if (s.nivel === 3) umbral = 1500;
      else if (s.nivel === 4) umbral = 2500;
      else umbral = 1;
      let progreso = s.nivel < 5 ? Math.min(100, (xpActual / umbral) * 100) : 100;
      return `<div class="stat-block">
                <h4>${stat.toUpperCase()} (Nv. ${s.nivel})</h4>
                <div class="stat-bar">
                  <div class="stat-fill" style="width: ${progreso}%"></div>
                </div>
                <p>XP: ${s.xp || 0} / ${umbral}</p>
              </div>`;
    }).join("");
  }
}

/**
 * Actualiza la visualización de las habilidades
 */
function actualizarAbilitiesUI() {
  const abilitiesContainer = document.getElementById("abilitiesContainer");
  if (abilitiesContainer) {
    if (currentUser.habilidades.length === 0) {
      abilitiesContainer.innerHTML = "<p>No hay habilidades disponibles.</p>";
    } else {
      abilitiesContainer.innerHTML = currentUser.habilidades.map(hab => {
        return `<div class="ability-card">
                  <h4>${hab.nombre} (Nv. ${hab.nivel})</h4>
                  <p>${hab.descripcion}</p>
                  <p>Tipo: ${hab.tipo} | Costo: ${hab.costo_energia || 0}</p>
                  <p>XP: ${hab.xp || 0} / ${hab.xp_requerido || 100}</p>
                </div>`;
      }).join("");
    }
  }
}

/**
 * Actualiza la visualización de los elicis
 */
function actualizarElicisUI() {
  const elicisContainer = document.getElementById("elicisContainer");
  if (elicisContainer) {
    elicisContainer.innerHTML = `
      <div class="elicis-box">
        <h4>Curación</h4>
        <p>+10 XP (si XP bajo)</p>
      </div>
      <div class="elicis-box">
        <h4>Fortalecimiento</h4>
        <p>+10% XP en habilidades por 2 días</p>
      </div>
    `;
  }
}

/***************************************
 * LOCALSTORAGE
 ***************************************/
function cargarDatosUsuario() {
  const datos = localStorage.getItem("rpgUsuario");
  if (datos) {
    try {
      currentUser = JSON.parse(datos);
    } catch (e) {
      console.error("Error al cargar datos de usuario:", e);
    }
  }
}

function guardarDatosUsuario() {
  localStorage.setItem("rpgUsuario", JSON.stringify(currentUser));
}

/***************************************
 * MENSAJES Y NOTIFICACIONES
 ***************************************/
function agregarMensajeChat(emisor, mensaje) {
  const chatBox = document.getElementById("chatBox");
  if (chatBox) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${emisor}`;
    msgDiv.innerText = mensaje;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

function mostrarNotificacion(mensaje) {
  alert(mensaje);
}

/***************************************
 * BOTÓN DEL CHAT (HTML onclick)
 ***************************************/
function enviarConsultaIA() {
  const iaInput = document.getElementById("iaInput");
  if (iaInput) {
    const mensaje = iaInput.value.trim();
    if (mensaje) {
      manejarConsultaIA(mensaje);
      iaInput.value = "";
    }
  }
}

/***************************************
 * MODALES
 ***************************************/
function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.toggle("active");
  }
}

/***************************************
 * Exponer funciones globalmente
 ***************************************/
window.enviarConsultaIA = enviarConsultaIA;
window.toggleModal = toggleModal;
window.guardarCambiosTarea = guardarCambiosTarea;
window.marcarComoTerminado = marcarComoTerminado;
window.marcarComoNoTerminado = marcarComoNoTerminado;
window.abrirModalEdicion = abrirModalEdicion;