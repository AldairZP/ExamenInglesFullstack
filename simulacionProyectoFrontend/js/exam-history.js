document.addEventListener("DOMContentLoaded", () => {
  // Obtener parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get("examId");

  if (!examId) {
    showError("No se especificó un ID de examen válido");
    return;
  }

  // Inicializar la página
  checkAuthentication()
    .then(() => loadExamHistory(examId))
    .catch((error) => {
      console.error("Error de inicialización:", error);
      showError("Error al cargar el historial del examen");
    });

  // Configurar botón de regreso
  document.getElementById("backToResultsBtn").addEventListener("click", () => {
    window.location.href = "results.html";
  });
});

// Función para verificar autenticación
async function checkAuthentication() {
  try {
    const response = await fetch(`${API_BASE_URL}/user_info/`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      window.location.href = "login-signup.html";
      throw new Error("Usuario no autenticado");
    }

    return await response.json();
  } catch (error) {
    console.error("Error de autenticación:", error);
    throw error;
  }
}

// Función para cargar el historial del examen
async function loadExamHistory(examId) {
  try {
    showLoading();

    // Primero obtener el token CSRF
    const csrfResponse = await fetch(`${API_BASE_URL}/csrf/`, {
      method: "GET",
      credentials: "include",
    });
    const csrfData = await csrfResponse.json();

    const response = await fetch(`${API_BASE_URL}/exam_history/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfData.csrfToken,
      },
      body: JSON.stringify({
        examen: parseInt(examId),
      }),
    });

    if (!response.ok) {
      throw new Error(`Error al obtener historial: ${response.status}`);
    }

    const historyData = await response.json();

    if (historyData && historyData.examen) {
      displayExamInfo(historyData.examen);
      displayQuestions(historyData.historial || []);
      displaySummary(historyData.resumen || {});
    } else {
      throw new Error("Datos del examen no válidos");
    }
  } catch (error) {
    console.error("Error al cargar historial:", error);
    showError("No se pudo cargar el historial del examen: " + error.message);
  }
}

// Función para mostrar información del examen
function displayExamInfo(examData) {
  // Actualizar título
  const examTitle = document.getElementById("examTitle");
  const examType = examData.tipo_examen === "final" ? "Final" : "Práctica";
  examTitle.textContent = `Examen ${examType} - ${examData.nivel || "N/A"}`;

  // Actualizar fecha
  const examDate = document.getElementById("examDate");
  const date = new Date(examData.fecha);
  examDate.textContent = date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Actualizar puntuación
  const examScore = document.getElementById("examScore");
  examScore.textContent = `${Math.round(examData.calificacion)}%`;

  // Actualizar estado
  const examStatus = document.getElementById("examStatus");
  examStatus.textContent = examData.aprobado ? "Aprobado" : "No Aprobado";
  examStatus.className = `exam-status ${
    examData.aprobado ? "approved" : "failed"
  }`;
}

// Función para mostrar las preguntas
function displayQuestions(historial) {
  const questionsContainer = document.getElementById("questionsHistory");

  if (!historial || historial.length === 0) {
    questionsContainer.innerHTML =
      '<div class="error-message">No se encontraron preguntas para este examen</div>';
    return;
  }

  questionsContainer.innerHTML = historial
    .map((item, index) => {
      const question = item.pregunta;
      const userAnswer = item.respuesta_usuario;
      const correctAnswer = item.respuesta_correcta;
      const isCorrect = item.es_correcta;

      return `
            <div class="question-item">
                <div class="question-header">
                    <span class="question-number">Pregunta ${index + 1}</span>
                    <span class="question-result ${
                      !userAnswer
                        ? "not-answered"
                        : isCorrect
                        ? "correct"
                        : "incorrect"
                    }">
                        ${
                          !userAnswer
                            ? "Sin contestar"
                            : isCorrect
                            ? "Correcta"
                            : "Incorrecta"
                        }
                    </span>
                </div>
                
                <div class="question-text">${question.descripcion}</div>
                
                ${
                  question.imagen
                    ? `<img src="${question.imagen}" alt="Imagen de la pregunta" class="question-image">`
                    : ""
                }
                
                <div class="answers-container">
                    ${generateAnswerOptionsFromAPI(item)}
                </div>
                
                ${
                  item.tiempo_respuesta
                    ? `
                    <div class="response-time">
                        <small>Tiempo de respuesta: ${Math.round(
                          item.tiempo_respuesta
                        )} segundos</small>
                    </div>
                `
                    : ""
                }
            </div>
        `;
    })
    .join("");
}

// Función para generar las opciones de respuesta desde la estructura de la API
function generateAnswerOptionsFromAPI(item) {
  const options = item.opciones_respuesta || [];
  const userAnswerId = item.respuesta_usuario
    ? item.respuesta_usuario.id
    : null;
  const isCorrect = item.es_correcta;

  return options
    .map((option, index) => {
      let className = "answer-option default";
      const optionLetter = String.fromCharCode(65 + index); // A, B, C, D

      // Solo marcar la respuesta que seleccionó el usuario
      if (userAnswerId === option.id) {
        if (isCorrect) {
          className = "answer-option user-answer-correct";
        } else {
          className = "answer-option user-answer-incorrect";
        }
      }

      return `
            <div class="${className}">
                <strong>${optionLetter})</strong> ${option.descripcion}
            </div>
        `;
    })
    .join("");
}

// Función para mostrar el resumen de estadísticas
function displaySummary(resumen) {
  // Si no hay resumen, usar valores por defecto
  const total = resumen.total_preguntas || 0;
  const correct = resumen.respuestas_correctas || 0;
  const incorrect = resumen.respuestas_incorrectas || 0;
  const unanswered = resumen.sin_responder || 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Actualizar elementos de estadísticas
  document.getElementById("totalQuestions").textContent = total;
  document.getElementById("correctAnswers").textContent = correct;
  document.getElementById("incorrectAnswers").textContent = incorrect;
  document.getElementById("accuracyPercentage").textContent = `${accuracy}%`;

  // Actualizar las etiquetas para reflejar la información correcta
  document.querySelector(".stat-item:nth-child(2) .stat-label").textContent =
    "Respuestas Correctas:";
  document.querySelector(".stat-item:nth-child(3) .stat-label").textContent =
    "Respuestas Incorrectas:";
  document.querySelector(".stat-item:nth-child(4) .stat-label").textContent =
    "Porcentaje de Acierto:";

  // Si hay preguntas sin responder, agregar estadística adicional
  if (unanswered > 0) {
    const statsGrid = document.querySelector(".stats-grid");
    const unansweredStat = document.createElement("div");
    unansweredStat.className = "stat-item";
    unansweredStat.innerHTML = `
            <span class="stat-label">Sin Responder:</span>
            <span class="stat-value">${unanswered}</span>
        `;
    statsGrid.appendChild(unansweredStat);
  }
}

// Función para mostrar estado de carga
function showLoading() {
  const questionsContainer = document.getElementById("questionsHistory");
  questionsContainer.innerHTML =
    '<div class="loading">Cargando historial del examen...</div>';
}

// Función para mostrar errores
function showError(message) {
  const questionsContainer = document.getElementById("questionsHistory");
  questionsContainer.innerHTML = `<div class="error-message">${message}</div>`;

  // También actualizar otros elementos
  document.getElementById("examTitle").textContent = "Error al cargar examen";
  document.getElementById("examDate").textContent = "-";
  document.getElementById("examScore").textContent = "-";
  document.getElementById("examStatus").textContent = "Error";
}
