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

document.addEventListener("DOMContentLoaded", async () => {
  // Verificar si el usuario está autenticado
  checkAuthentication();

  // Cargar información del perfil
  loadProfileData();

  // Configurar el event listener para la subida de imágenes
  setupImageUpload();
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

// Función para cargar los datos del perfil
async function loadProfileData() {
  try {
    const response = await fetch(`${API_BASE_URL}/user_info/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener la información del usuario");
    }

    const userData = await response.json();
    updateProfileUI(userData);
  } catch (error) {
    console.error("Error al cargar datos del perfil:", error);
    showErrorMessage(
      "No se pudo cargar la información del perfil. Por favor, intenta de nuevo más tarde."
    );
  }
}

// Función para actualizar la UI con los datos del perfil
function updateProfileUI(userData) {
  // Actualizar campos del perfil
  document.getElementById("profileMatricula").textContent =
    userData.matricula || "";
  document.getElementById("profileNickname").textContent =
    userData.username || "";
  document.getElementById("profileName").textContent = userData.nombre || "";
  document.getElementById("profileLastName1").textContent =
    userData.paterno || "";
  document.getElementById("profileLastName2").textContent =
    userData.materno || "";
  document.getElementById("profileEmail").textContent = userData.email || "";

  // Actualizar imagen de perfil
  const profileImage = document.getElementById("profileImage");
  const userProfileImg = document.getElementById("userProfileImg");

  let imageUrl;
  if (userData.profile_image) {
    imageUrl = userData.profile_image;
    // Guardar la imagen del backend en sessionStorage
    sessionStorage.setItem("userProfileImage", imageUrl);
  } else {
    // Si no hay imagen del backend, obtener una aleatoria (que ya está en sessionStorage)
    imageUrl =
      sessionStorage.getItem("userProfileImage") || getRandomProfileImage();
  }

  if (profileImage) profileImage.src = imageUrl;
  if (userProfileImg) userProfileImg.src = imageUrl;
}

// Función para configurar la subida de imágenes
function setupImageUpload() {
  const uploadButton = document.getElementById("uploadImageBtn");
  const imageInput = document.getElementById("imageUpload");

  if (uploadButton && imageInput) {
    uploadButton.addEventListener("click", () => {
      imageInput.click();
    });

    imageInput.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (file) {
        uploadProfileImage(file);
      }
    });
  }
}

// Función para subir la imagen de perfil al servidor
async function uploadProfileImage(file) {
  try {
    const formData = new FormData();
    formData.append("profile_image", file);

    const csrfToken = await getCSRFToken();

    const response = await fetch(`${API_BASE_URL}/update_profile_image/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrfToken,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error al subir la imagen");
    }

    const data = await response.json();

    // Actualizar la imagen en la UI
    if (data.profile_image) {
      document.getElementById("profileImage").src = data.profile_image;
      document.getElementById("userProfileImg").src = data.profile_image;
    }

    showSuccessMessage("Imagen de perfil actualizada con éxito");
  } catch (error) {
    console.error("Error al subir la imagen:", error);
    showErrorMessage(
      "No se pudo actualizar la imagen de perfil. Por favor, intenta de nuevo."
    );
  }
}

// Función para mostrar mensajes de error
function showErrorMessage(message) {
  alert(message);
}

// Función para mostrar mensajes de éxito
function showSuccessMessage(message) {
  alert(message);
}
