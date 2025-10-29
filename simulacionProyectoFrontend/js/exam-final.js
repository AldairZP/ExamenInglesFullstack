// Duración del temporizador en minutos
const duracionEnMinutos = 1;

let countdownEl = document.getElementById("countdown");
let intervalo; // Para poder detener y reiniciar el temporizador

// Variables para el control de preguntas
let currentExam = null; // ID del examen actual
let questionIds = []; // Array con los IDs de las preguntas
let currentQuestionIndex = 0; // Índice de la pregunta actual
let userAnswers = {}; // Almacena las respuestas del usuario

async function fetchCSRFToken() {
  const response = await fetch(`${API_BASE_URL}/csrf/`, {
    credentials: "include", // Importante para recibir cookies del backend
  });
  const data = await response.json();
  console.log("Token CSRF:", data.csrfToken);
  return data.csrfToken;
}

async function crearExamen() {
  try {
    const csrfToken = await fetchCSRFToken();

    const response = await fetch(`${API_BASE_URL}/get_exam_questions/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrfToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tipo_examen: "final" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Retorna { examen: id, preguntas: [id1, id2, ...] }
  } catch (error) {
    console.error("Error al crear examen:", error);
    return null;
  }
}

async function fetchQuestionData(examId, questionId) {
  try {
    const csrfToken = await fetchCSRFToken();

    const response = await fetch(`${API_BASE_URL}/get_questions_answers/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrfToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        examen: examId,
        pregunta: questionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error al obtener pregunta: ${response.status}`);
    }

    const data = await response.json();
    return data.pregunta;
  } catch (error) {
    console.error("Error al obtener datos de la pregunta:", error);
    return null;
  }
}

async function submitAnswer(examId, questionId, answerId) {
  try {
    const csrfToken = await fetchCSRFToken();

    const response = await fetch(`${API_BASE_URL}/update_exam_answer/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrfToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        examen: examId,
        pregunta: questionId,
        respuesta: answerId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error al enviar respuesta: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al enviar respuesta:", error);
    return null;
  }
}

// Obtener información del examen
async function fetchExamInfo(examId) {
  try {
    const csrfToken = await fetchCSRFToken();

    const response = await fetch(`${API_BASE_URL}/exam_info/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrfToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        examen: examId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Error al obtener información del examen: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error al obtener información del examen:", error);
    return null;
  }
}

// Función para iniciar o reiniciar el temporizador
function iniciarTemporizador() {
  // Asegurar que tengamos referencia al elemento del temporizador
  countdownEl = document.getElementById("countdown");
  if (!countdownEl) return; // Si no existe el elemento, salimos

  const tiempoFinal = new Date().getTime() + duracionEnMinutos * 60 * 1000;

  // Detenemos cualquier temporizador anterior
  clearInterval(intervalo);

  // Función interna para actualizar la cuenta regresiva
  function actualizarTemporizador() {
    const ahora = new Date().getTime();
    const diferencia = tiempoFinal - ahora;

    if (diferencia <= 0) {
      countdownEl.textContent = "¡Tiempo terminado!";
      clearInterval(intervalo);

      // Opcional: autoentregar examen
      const submitBtn = document.getElementById("submitFinalExam");
      if (submitBtn) submitBtn.click();

      return;
    }

    const minutos = Math.floor(diferencia / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    countdownEl.textContent = `${minutos.toString().padStart(2, "0")}:${segundos
      .toString()
      .padStart(2, "0")}`;
  }

  // Comenzamos el intervalo y actualizamos inmediatamente
  intervalo = setInterval(actualizarTemporizador, 1000);
  actualizarTemporizador();
}

// Mostrar la pregunta actual y sus opciones de respuesta
async function displayCurrentQuestion() {
  if (!currentExam || questionIds.length === 0) {
    console.error("No hay examen o preguntas disponibles");
    return;
  }

  const questionId = questionIds[currentQuestionIndex];
  const questionData = await fetchQuestionData(currentExam, questionId);

  if (!questionData) {
    console.error("Error al obtener datos de la pregunta");
    return;
  }

  const questionContainer = document.getElementById("finalQuestions");
  // Crear HTML de la pregunta
  let questionHTML = `
        <div class="question" data-question-id="${questionData.id}">
            <h3 class="question-text">${questionData.descripcion}</h3>
    `;

  // Añadir imagen si existe
  if (questionData.imagen) {
    questionHTML += `<img src="${questionData.imagen}" alt="Imagen de la pregunta" class="question-image">`;
  }

  questionHTML += `
            <div class="answers-container">
    `; // Añadir cada opción de respuesta
  questionData.respuestas.forEach((answer, index) => {
    const isSelected = userAnswers[questionId] === answer.id;
    const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
    questionHTML += `
            <label class="answer-option ${
              isSelected ? "selected" : ""
            }" for="answer-${answer.id}">
                <input type="radio" 
                       id="answer-${answer.id}" 
                       name="question-${questionData.id}" 
                       value="${answer.id}"
                       ${isSelected ? "checked" : ""}>
                <strong>${optionLetter})</strong> ${answer.descripcion}
            </label>
        `;
  });

  questionHTML += `
            </div>
            <div class="question-counter">
                Pregunta ${currentQuestionIndex + 1} de ${questionIds.length}
            </div>
        </div>
    `;
  questionContainer.innerHTML = questionHTML;

  // Añadir event listeners a los radio buttons y labels
  const radioButtons = questionContainer.querySelectorAll(
    'input[type="radio"]'
  );
  const answerOptions = questionContainer.querySelectorAll(".answer-option");

  radioButtons.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      userAnswers[questionId] = parseInt(event.target.value);

      // Actualizar clases selected
      answerOptions.forEach((option) => {
        option.classList.remove("selected");
      });
      event.target.closest(".answer-option").classList.add("selected");
    });
  });

  // Event listeners para hacer clicable toda el área
  answerOptions.forEach((option) => {
    option.addEventListener("click", (event) => {
      const radio = option.querySelector('input[type="radio"]');
      if (radio && !radio.checked) {
        radio.checked = true;
        radio.dispatchEvent(new Event("change"));
      }
    });
  });

  // Actualizar texto del botón según si es la última pregunta
  const submitButton = document.getElementById("submitFinalExam");
  if (submitButton) {
    submitButton.textContent =
      currentQuestionIndex < questionIds.length - 1
        ? "Siguiente"
        : "Finalizar Examen";
  }
}

// Manejar el avance a la siguiente pregunta
async function goToNextQuestion() {
  // Guardar respuesta actual si existe
  if (currentExam && questionIds.length > 0) {
    const currentQuestionId = questionIds[currentQuestionIndex];
    const selectedAnswerId = userAnswers[currentQuestionId];

    if (selectedAnswerId) {
      await submitAnswer(currentExam, currentQuestionId, selectedAnswerId);
    }
  }

  // Verificar si es la última pregunta
  if (currentQuestionIndex >= questionIds.length - 1) {
    // Mostrar resultados o mensaje de finalización
    await showExamResults();
    return;
  }

  // Avanzar a la siguiente pregunta
  currentQuestionIndex++;
  await displayCurrentQuestion();

  // Reiniciar el temporizador para la nueva pregunta
  iniciarTemporizador();
}

// Inicializar el examen
async function initializeExam() {
  // Resetear estado
  currentQuestionIndex = 0;
  userAnswers = {};

  // Crear nuevo examen
  const examData = await crearExamen();

  if (!examData) {
    console.error("Error al crear el examen");
    return;
  }

  currentExam = examData.examen;
  questionIds = examData.preguntas;

  console.log(
    `Examen creado con ID: ${currentExam}. Preguntas: ${questionIds.length}`
  );

  // Mostrar la primera pregunta
  await displayCurrentQuestion();

  // Iniciar el temporizador
  iniciarTemporizador();
}

// Mostrar resultados del examen
async function showExamResults() {
  // Ocultar preguntas y mostrar sección de resultados
  document.getElementById("finalQuestions").style.display = "none";
  document.getElementById("submitFinalExam").style.display = "none";

  // Ocultar el temporizador
  const timerBox = document.querySelector(".timer-box");
  if (timerBox) {
    timerBox.style.display = "none";
  }

  const resultsElement = document.getElementById("finalResults");
  resultsElement.classList.remove("hidden");

  // Detener el temporizador
  clearInterval(intervalo);

  // Obtener información del examen
  const examInfo = await fetchExamInfo(currentExam);

  if (examInfo) {
    // Mostrar calificación en el círculo
    const scoreElement = resultsElement.querySelector(".score-number");
    if (scoreElement) {
      scoreElement.textContent = `${examInfo.calificacion}%`;
    }

    // Mostrar etiqueta de aprobado/reprobado
    const labelElement = resultsElement.querySelector(".score-label");
    if (labelElement) {
      labelElement.textContent = examInfo.aprobado ? "APROBADO" : "REPROBADO";
      labelElement.style.color = examInfo.aprobado ? "green" : "red";
    }
    if (examInfo.tipo_examen) {
      examInfo.tipo_examen = "Final";
    } else {
      examInfo.tipo_examen = "Prueba";
    }
    // Agregar información adicional
    const infoHTML = `
            <div class="exam-info-results">
                <h3>Detalles del Examen</h3>
                <p>Tipo de examen: ${examInfo.tipo_examen}</p>
                <p>Nivel: ${examInfo.nivel}</p>
                <p>Calificación: ${examInfo.calificacion}%</p>
                <p>Estado: ${examInfo.aprobado ? "Aprobado" : "Reprobado"}</p>
            </div>
            <button id="exitExamBtn" class="exit-exam-button">Volver a Exámenes</button>
        `;

    resultsElement.insertAdjacentHTML("beforeend", infoHTML);

    // Agregar evento al botón de salir
    document.getElementById("exitExamBtn").addEventListener("click", () => {
      window.location.href = "exams.html";
    });
  } else {
    resultsElement.insertAdjacentHTML(
      "beforeend",
      `
            <div class="exam-error">
                <p>Error al obtener los resultados del examen.</p>
                <button id="exitExamBtn" class="exit-exam-button">Volver a Exámenes</button>
            </div>
        `
    );

    document.getElementById("exitExamBtn").addEventListener("click", () => {
      window.location.href = "exams.html";
    });
  }

  console.log("Examen finalizado. Total de preguntas: " + questionIds.length);
  console.log("Respuestas enviadas: " + Object.keys(userAnswers).length);
}

// Función para prevenir recarga accidental
function setupPageReloadWarning() {
  window.addEventListener("beforeunload", function (e) {
    // Verificar si el examen ya terminó (se muestran los resultados)
    const resultsElement = document.getElementById("finalResults");
    if (resultsElement && !resultsElement.classList.contains("hidden")) {
      // No mostrar advertencia si los resultados están visibles
      return;
    }

    // Solo mostrar advertencia si el examen está en progreso
    e.preventDefault();
    const message =
      "Si recargas la página, el examen se enviará en su estado actual. ¿Estás seguro?";
    e.returnValue = message;
    return message; // Para compatibilidad con navegadores antiguos
  });
}

document.addEventListener("DOMContentLoaded", async (event) => {
  console.log("Iniciando examen final...");

  // Activar advertencia de recarga
  setupPageReloadWarning();

  // Inicializar el examen al cargar la página
  await initializeExam();

  // Añadir event listener al botón de siguiente/enviar
  const submitButton = document.getElementById("submitFinalExam");
  if (submitButton) {
    submitButton.addEventListener("click", goToNextQuestion);
    console.log("Event listener añadido al botón");
  } else {
    console.error("No se encontró el botón de envío");
  }
});
