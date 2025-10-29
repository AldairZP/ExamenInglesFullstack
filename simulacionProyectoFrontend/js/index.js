// Función para verificar si el usuario está autenticado (usa la función de base.js)
async function isUserLoggedIn() {
    const userData = await fetchDataUser();
    return !!userData; // true si está logueado
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('startExamBtn');
    if (button) {
        button.addEventListener('click', async () => {
            const isLoggedIn = await isUserLoggedIn();
            navigateTo(isLoggedIn ? 'exams.html' : 'login-signup.html');
        });
    }
});
