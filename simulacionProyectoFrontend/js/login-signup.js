async function fetchCSRFToken() {
  const response = await fetch(`${API_BASE_URL}/csrf/`, {
    credentials: "include", // Importante para recibir cookies del backend
  });
  const data = await response.json();
  console.log("Token CSRF:", data.csrfToken);
  return data.csrfToken;
}
async function submitForm(event) {
  event.preventDefault();
  const csrfToken = await fetchCSRFToken();

  // Convertir los datos del formulario en un objeto JSON
  const formData = new FormData(event.target);
  const formObject = Object.fromEntries(formData.entries()); // Convierte FormData en JSON

  // Convertir a minúsculas todos los campos excepto username y contraseña
  const fieldsToKeepOriginal = ["username", "contraseña"];
  Object.keys(formObject).forEach((key) => {
    if (!fieldsToKeepOriginal.includes(key)) {
      formObject[key] = formObject[key].toLowerCase();
    }
  });

  // Asignar una imagen de perfil aleatoria
  const profileImages = [
    "https://i.imgur.com/KqW2OTQ_d.webp?maxwidth=760&fidelity=grand",
    "https://i.imgur.com/Xw7fvhF_d.webp?maxwidth=760&fidelity=grand",
    "https://i.imgur.com/pTkv30n_d.webp?maxwidth=760&fidelity=grand",
    "https://i.imgur.com/1KsedPW_d.webp?maxwidth=760&fidelity=grand",
  ];

  // Verificar si ya existe una imagen en sessionStorage para mantener consistencia
  let selectedImage = sessionStorage.getItem("userProfileImage");
  if (!selectedImage) {
    // Si no existe, seleccionar una aleatoria y guardarla
    const randomIndex = Math.floor(Math.random() * profileImages.length);
    selectedImage = profileImages[randomIndex];
    sessionStorage.setItem("userProfileImage", selectedImage);
  }

  formObject.profile_image = selectedImage;

  console.log(JSON.stringify(formObject));

  try {
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: "POST",
      credentials: "include", // Importante para enviar cookies
      headers: {
        "X-CSRFToken": csrfToken, // Agregar el token CSRF
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject), // Enviar como JSON
    });

    const data = await response.json();

    if (!response.ok) {
      // Mostrar solo el mensaje de error sin texto adicional
      if (data.error && data.error.includes("ya existe")) {
        showModal("Este usuario ya está registrado", true);
      } else {
        showModal(data.error || "Error desconocido", true);
      }
    } else {
      // Registro exitoso
      console.log("Usuario creado:", data);
      showModal("¡Usuario registrado correctamente!", false);
      // La redirección se maneja en el modal
    }
  } catch (error) {
    console.error("Error:", error);
    showModal("Error de conexión", true);
  }
}

async function submitLoginForm(event) {
  event.preventDefault();
  const csrfToken = await fetchCSRFToken();

  // Convertir los datos del formulario en un objeto JSON
  const formData = new FormData(event.target);
  const formObject = Object.fromEntries(formData.entries()); // Convierte FormData en JSON

  // Convertir el email a minúsculas
  if (formObject.email) {
    formObject.email = formObject.email.toLowerCase();
  }

  console.log(JSON.stringify(formObject));

  try {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: "POST",
      credentials: "include", // Importante para enviar cookies
      headers: {
        "X-CSRFToken": csrfToken, // Agregar el token CSRF
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject), // Enviar como JSON
    });

    const data = await response.json();

    if (!response.ok) {
      // Mostrar solo el mensaje de error sin texto adicional
      showModal(data.error || "Credenciales incorrectas", true);
    } else {
      // Login exitoso
      console.log("Usuario autenticado:", data);
      window.location.href = "index.html";
      // showModal("¡Inicio de sesión exitoso!", false);
      // La redirección se maneja en el modal
    }
  } catch (error) {
    console.error("Error:", error);
    showModal("Error de conexión", true);
  }
}

// Función para mostrar un modal con mensaje personalizado
function showModal(message, isError = false) {
  // Crear elementos del modal
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.style.position = "fixed";
  modalOverlay.style.top = "0";
  modalOverlay.style.left = "0";
  modalOverlay.style.width = "100%";
  modalOverlay.style.height = "100%";
  modalOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  modalOverlay.style.display = "flex";
  modalOverlay.style.justifyContent = "center";
  modalOverlay.style.alignItems = "center";
  modalOverlay.style.zIndex = "1000";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalContent.style.backgroundColor = "white";
  modalContent.style.padding = "20px";
  modalContent.style.borderRadius = "5px";
  modalContent.style.maxWidth = "400px";
  modalContent.style.textAlign = "center";
  modalContent.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";

  const messageElement = document.createElement("p");
  messageElement.textContent = message;
  messageElement.style.margin = "0 0 20px 0";
  messageElement.style.color = isError ? "#dc3545" : "#28a745";
  messageElement.style.fontWeight = "bold";

  const closeButton = document.createElement("button");
  closeButton.textContent = "Aceptar";
  closeButton.style.padding = "8px 16px";
  closeButton.style.backgroundColor = isError ? "#dc3545" : "#28a745";
  closeButton.style.color = "white";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "4px";
  closeButton.style.cursor = "pointer";

  closeButton.onclick = function () {
    document.body.removeChild(modalOverlay);
    // Si no es un error, redirigir a la página principal
    if (!isError) {
      window.location.href = "index.html";
    }
  };

  modalContent.appendChild(messageElement);
  modalContent.appendChild(closeButton);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);
}

const container = document.querySelector(".container");
const registerBtn = document.querySelector(".register-btn");
const loginBtn = document.querySelector(".login-btn");

registerBtn.addEventListener("click", () => {
  container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
  container.classList.remove("active");
});
