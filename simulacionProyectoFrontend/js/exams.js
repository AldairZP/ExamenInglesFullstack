document.addEventListener("DOMContentLoaded", () => {
  // Verificar si el usuario está autenticado
  checkAuthentication();

  // Obtener intentos disponibles de exámenes
  fetchAvailableExams();

  // Añadir event listeners a los botones
  document
    .getElementById("startPracticeExam")
    .addEventListener("click", () => startExam("prueba"));
  document
    .getElementById("startFinalExam")
    .addEventListener("click", () => startExam("final"));
  document
    .getElementById("viewResults")
    .addEventListener("click", viewExamResults);
});

// Función para verificar si el usuario está autenticado
function checkAuthentication() {
  fetch(`${API_BASE_URL}/user_info/`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        // Redirigir al login si no está autenticado
        window.location.href = "login-signup.html";
        throw new Error("Usuario no autenticado");
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error al verificar autenticación:", error);
    });
}

// Función para obtener intentos disponibles de exámenes
function fetchAvailableExams() {
  fetch(`${API_BASE_URL}/available_exams/`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al obtener intentos disponibles");
      }
      return response.json();
    })
    .then((data) => {
      // Actualizar el número de intentos en la UI
      updateAvailableExams(data);
    })
    .catch((error) => {
      console.error("Error al obtener intentos disponibles:", error);
      // Mostrar mensaje de error al usuario
      showErrorMessage(
        "No se pudieron cargar los intentos disponibles. Por favor, intenta de nuevo más tarde."
      );
    });
}

// Función para actualizar la UI con los intentos disponibles
function updateAvailableExams(data) {
  const practiceAttemptsElement = document.getElementById("practiceAttempts");
  const finalAttemptsElement = document.getElementById("finalAttempts");

  // Actualizar intentos de examen de práctica
  if (practiceAttemptsElement && data.avaible_exams_prueba !== undefined) {
    practiceAttemptsElement.textContent = data.avaible_exams_prueba;

    // Deshabilitar botón si no hay intentos disponibles
    const practiceButton = document.getElementById("startPracticeExam");
    if (practiceButton) {
      practiceButton.disabled = data.avaible_exams_prueba <= 0;
    }
  }

  // Actualizar intentos de examen final
  if (finalAttemptsElement && data.avaible_exams_final !== undefined) {
    finalAttemptsElement.textContent = data.avaible_exams_final;

    // Deshabilitar botón si no hay intentos disponibles
    const finalButton = document.getElementById("startFinalExam");
    if (finalButton) {
      finalButton.disabled = data.avaible_exams_final <= 0;
    }
  }
}

// Función para iniciar un examen
function startExam(tipo) {
  // Simplemente redirigir a la página correspondiente según el tipo de examen
  if (tipo === "prueba") {
    window.location.href = "exam-prueba.html";
  } else if (tipo === "final") {
    window.location.href = "exam-final.html";
  }
}

// Función para ver resultados de exámenes
function viewExamResults() {
  window.location.href = "results.html";
}

// Función para mostrar mensajes de error
function showErrorMessage(message) {
  // Implementar según el diseño de la UI
  alert(message);
}
