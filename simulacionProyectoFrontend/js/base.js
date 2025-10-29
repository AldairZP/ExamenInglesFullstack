// Función para obtener una imagen de perfil aleatoria
function getRandomProfileImage() {
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

  return selectedImage;
}

// URL base de la API (usa localhost para que las cookies funcionen en el mismo "site" si sirves el frontend en http://localhost)
const API_BASE_URL = "http://localhost:8000";
// Exponerla en window por compatibilidad con scripts que no usan módulos
window.API_BASE_URL = API_BASE_URL;

// Función para inicializar la imagen de perfil en todas las páginas
function initializeProfileImage() {
  const profileImages = document.querySelectorAll(
    "#userProfileImg, #profileImage, #resultProfileImage"
  );

  profileImages.forEach((img) => {
    // Solo actualizar si la imagen todavía tiene la imagen por defecto
    if (img && (img.src.includes("sinfoto.png") || img.src === "")) {
      const savedImage = sessionStorage.getItem("userProfileImage");
      if (savedImage) {
        img.src = savedImage;
      } else {
        img.src = getRandomProfileImage();
      }
    }
  });
}

const profileMenu = document.getElementById("profileMenu");
// Definición del estado global de la aplicación
const state = {
  isLoggedIn: false,
  currentUser: null,
};

async function getCSRFToken() {
  const fetchCSRFToken = await fetch(`${API_BASE_URL}/csrf/`, {
    credentials: "include",
  });
  if (fetchCSRFToken.ok) {
    const data = await fetchCSRFToken.json();
    return data.csrfToken;
  } else {
    console.error("Error al obtener el token CSRF:", fetchCSRFToken.statusText);
    return null;
  }
}

async function fetchLogout() {
  try {
    const response = await fetch(`${API_BASE_URL}/logout/`, {
      method: "GET",
      credentials: "include", // Importante para enviar cookies del backend
      headers: {
        "X-CSRFToken": await getCSRFToken(), // Agregar el token CSRF
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      console.log("Logout exitoso");
      state.isLoggedIn = false;
      state.currentUser = null;
      // Limpiar la imagen de perfil guardada
      sessionStorage.removeItem("userProfileImage");
    } else {
      console.error("Error al cerrar sesión:", response.statusText);
    }
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
}

async function fetchDataUser() {
  try {
    console.log("Obteniendo información del usuario...");
    const response = await fetch(`${API_BASE_URL}/user_info/`, {
      method: "GET",
      credentials: "include", // Importante para recibir cookies del backend
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Datos del usuario obtenidos:", data);
      return data;
    } else {
      console.log("Usuario no autenticado, status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener datos de usuario:", error);
    return null;
  }
}

function showUserInfo(data) {
  const buttonLogin = document.getElementById("loginBtn");
  const userProfile = document.getElementById("userProfile");
  const userName = document.getElementById("userName");
  const userProfileImg = document.getElementById("userProfileImg");

  if (buttonLogin) buttonLogin.classList.add("hidden"); // Hide the login button
  if (userProfile) userProfile.classList.remove("hidden"); // Show the user profile section

  // Mostrar el nombre de usuario en el elemento correspondiente
  if (userName) {
    console.log("Datos del usuario:", data);

    // Intentar diferentes formas de obtener el nombre
    let displayName = "Usuario"; // Valor por defecto

    if (data.username) {
      displayName = data.username;
    } else if (data.nombre) {
      // Si no hay username, usar el nombre completo
      displayName = `${data.nombre} ${data.paterno || ""}`.trim();
    } else if (data.name) {
      displayName = data.name;
    }

    userName.textContent = displayName;
    console.log("Nombre mostrado:", displayName);
  }
  // Actualizar imagen de perfil
  if (userProfileImg) {
    if (data.profile_image) {
      userProfileImg.src = data.profile_image;
      // Guardar la imagen del backend en sessionStorage
      sessionStorage.setItem("userProfileImage", data.profile_image);
    } else {
      // Si no hay imagen del backend, usar una aleatoria
      userProfileImg.src = getRandomProfileImage();
    }
  }

  // Actualizar el estado
  state.isLoggedIn = true;
  state.currentUser = data;
}

// Función para gestionar la navegación
function navigateTo(page) {
  window.location.href = page;
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Base.js cargado, verificando autenticación...");

  // Hacer petición al servidor para obtener datos del usuario
  const data = await fetchDataUser();

  if (data) {
    console.log("Usuario autenticado, mostrando información");
    showUserInfo(data);
  } else {
    console.log("Usuario no autenticado");
  }

  // Event listeners para el menú de perfil
  if (profileMenu) {
    // Abrir/cerrar menú al hacer clic en el perfil
    const userProfile = document.getElementById("userProfile");
    if (userProfile) {
      userProfile.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("hidden");
      });
    }

    // Cerrar menú al hacer clic en cualquier otra parte
    document.addEventListener("click", () => {
      profileMenu.classList.add("hidden");
    });
  }
  if (document.getElementById("homeLogoBtn")) {
    document.getElementById("homeLogoBtn").addEventListener("click", () => {
      navigateTo("index.html");
    });
  }

  // Event listeners para los botones del menú
  if (document.getElementById("viewProfileBtn")) {
    document.getElementById("viewProfileBtn").addEventListener("click", () => {
      navigateTo("profile.html");
    });
  }

  if (document.getElementById("myExamsBtn")) {
    document.getElementById("myExamsBtn").addEventListener("click", () => {
      navigateTo("exams.html");
    });
  }

  if (document.getElementById("myStatsBtn")) {
    document.getElementById("myStatsBtn").addEventListener("click", () => {
      navigateTo("results.html");
    });
  }

  if (document.getElementById("logoutBtn")) {
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      // Cerrar sesión
      await fetchLogout();
      navigateTo("index.html");
      // window.location.reload(); // Recargar la página para actualizar UI
    });
  }

  if (document.getElementById("loginBtn")) {
    document.getElementById("loginBtn").addEventListener("click", () => {
      navigateTo("login-signup.html");
    });
  }

  // Inicializar imágenes de perfil
  initializeProfileImage();
});
