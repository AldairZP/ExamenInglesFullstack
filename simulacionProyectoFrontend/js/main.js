// main.js - Lógica Principal
document.addEventListener('DOMContentLoaded', () => {
  // Estado de la aplicación - utilizando localStorage para mantener persistencia
  const state = {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    practiceAttempts: parseInt(localStorage.getItem('practiceAttempts') || '5'),
    finalAttempts: parseInt(localStorage.getItem('finalAttempts') || '2'),
    examResults: JSON.parse(localStorage.getItem('examResults') || '[]'),
    registeredUsers: JSON.parse(localStorage.getItem('registeredUsers') || '[]')
  };

  // Guardar estado en localStorage
  const saveState = () => {
    localStorage.setItem('isLoggedIn', state.isLoggedIn);
    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    localStorage.setItem('practiceAttempts', state.practiceAttempts);
    localStorage.setItem('finalAttempts', state.finalAttempts);
    localStorage.setItem('examResults', JSON.stringify(state.examResults));
    localStorage.setItem('registeredUsers', JSON.stringify(state.registeredUsers));
  };

  // Elementos DOM común en todas las páginas
  const loginBtn = document.getElementById('loginBtn');
  const userProfile = document.getElementById('userProfile');
  const userName = document.getElementById('userName');
  const profileMenu = document.getElementById('profileMenu');
  const homeLogoBtn = document.getElementById('homeLogoBtn');

  // Funciones de navegación
  const navigateTo = (page) => {
    window.location.href = page;
  };

  // Actualizar UI de autenticación en todas las páginas
  const updateAuthUI = () => {
    if (state.isLoggedIn && state.currentUser) {
      if (loginBtn) loginBtn.classList.add('hidden');
      if (userProfile) {
        userProfile.classList.remove('hidden');
        if (userName) userName.textContent = state.currentUser.nickname;
        if (document.getElementById('userProfileImg')) {
          document.getElementById('userProfileImg').src = state.currentUser.profileImage || 'src/imagenes/sinfoto.png';
        }
      }
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (userProfile) userProfile.classList.add('hidden');
    }
  };

  // Cargar información del perfil si estamos en la página de perfil
  const loadProfileInfo = () => {
    if (window.location.pathname.includes('profile.html') && state.currentUser) {
      document.getElementById('profileMatricula').textContent = state.currentUser.matricula || '';
      document.getElementById('profileNickname').textContent = state.currentUser.nickname || '';
      document.getElementById('profileName').textContent = state.currentUser.name || '';
      document.getElementById('profileLastName1').textContent = state.currentUser.lastName1 || '';
      document.getElementById('profileLastName2').textContent = state.currentUser.lastName2 || '';
      document.getElementById('profileEmail').textContent = state.currentUser.email || '';
      document.getElementById('profileImage').src = state.currentUser.profileImage || 'src/imagenes/sinfoto.png';
    }
  };

  // Actualizar UI de exámenes si estamos en la página de exámenes
  const updateExamUI = () => {
    if (window.location.pathname.includes('exams.html')) {
      const practiceAttemptsSpan = document.getElementById('practiceAttempts');
      const finalAttemptsSpan = document.getElementById('finalAttempts');
      const startPracticeExam = document.getElementById('startPracticeExam');
      const startFinalExam = document.getElementById('startFinalExam');
      
      if (practiceAttemptsSpan) practiceAttemptsSpan.textContent = state.practiceAttempts;
      if (finalAttemptsSpan) finalAttemptsSpan.textContent = state.finalAttempts;
      
      if (startPracticeExam && state.practiceAttempts <= 0) {
        startPracticeExam.disabled = true;
        startPracticeExam.textContent = 'No hay intentos disponibles';
      }
      
      if (startFinalExam && state.finalAttempts <= 0) {
        startFinalExam.disabled = true;
        startFinalExam.textContent = 'No hay intentos disponibles';
      }
    }
  };

  // Cargar resultados si estamos en la página de resultados
  const displayResults = () => {
    if (window.location.pathname.includes('results.html')) {
      const examHistory = document.getElementById('examHistory');
      if (!examHistory) return;
      
      examHistory.innerHTML = '';
      
      state.examResults.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        resultDiv.innerHTML = `
          <p>Tipo: ${result.type === 'practice' ? 'Práctica' : 'Final'}</p>
          <p>Puntuación: ${result.score}</p>
          <p>Fecha: ${result.date}</p>
        `;
        examHistory.appendChild(resultDiv);
      });

      const canvas = document.getElementById('resultsChart');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const practiceScores = state.examResults
          .filter(r => r.type === 'practice')
          .map(r => r.score);
        
        const finalScores = state.examResults
          .filter(r => r.type === 'final')
          .map(r => r.score);

        ctx.fillStyle = '#2563eb';
        practiceScores.forEach((score, i) => {
          ctx.fillRect(i * 60 + 50, 200 - score * 2, 20, score * 2);
        });

        ctx.fillStyle = '#1e40af';
        finalScores.forEach((score, i) => {
          ctx.fillRect(i * 60 + 250, 200 - score * 2, 20, score * 2);
        });
      }
      
      // Actualizar información del estudiante
      if (state.currentUser) {
        if (document.getElementById('resultStudentName')) {
          document.getElementById('resultStudentName').textContent = 
            `${state.currentUser.name} ${state.currentUser.lastName1} ${state.currentUser.lastName2}`;
        }
        if (document.getElementById('resultMatricula')) {
          document.getElementById('resultMatricula').textContent = state.currentUser.matricula;
        }
        if (document.getElementById('resultProfileImage')) {
          document.getElementById('resultProfileImage').src = state.currentUser.profileImage || 'src/imagenes/sinfoto.png';
        }
      }
    }
  };

  // Comprobación de disponibilidad de matrícula
  const checkNicknameAvailability = (matricula) => {
    return !state.registeredUsers.some(user => user.matricula.toLowerCase() === matricula.toLowerCase());
  };

  // Event Listeners para elementos comunes
  if (homeLogoBtn) {
    homeLogoBtn.addEventListener('click', () => {
      navigateTo('index.html');
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      navigateTo('login-signup.html');
    });
  }

  if (userProfile) {
    userProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      if (profileMenu) profileMenu.classList.toggle('hidden');
    });
  }

  document.addEventListener('click', () => {
    if (profileMenu) profileMenu.classList.add('hidden');
  });

  // Event listeners para navegación en el menú de perfil
  if (document.getElementById('viewProfileBtn')) {
    document.getElementById('viewProfileBtn').addEventListener('click', () => {
      navigateTo('profile.html');
    });
  }

  if (document.getElementById('myExamsBtn')) {
    document.getElementById('myExamsBtn').addEventListener('click', () => {
      navigateTo('exams.html');
    });
  }

  if (document.getElementById('myStatsBtn')) {
    document.getElementById('myStatsBtn').addEventListener('click', () => {
      navigateTo('results.html');
    });
  }

  if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', () => {
      state.isLoggedIn = false;
      state.currentUser = null;
      saveState();
      navigateTo('index.html');
    });
  }

  // Event Listeners específicos de página
  
  // Página de inicio
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '/PruebaWeb/') {
    const startExamBtn = document.getElementById('startExamBtn');
    if (startExamBtn) {
      startExamBtn.addEventListener('click', () => {
        if (state.isLoggedIn) {
          navigateTo('exams.html');
        } else {
          navigateTo('login-signup.html');
        }
      });
    }
  }

  // Página de login
  if (window.location.pathname.includes('login-signup.html')) {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const identifier = e.target.elements[0].value; 
        const password = e.target.elements[1].value;

        const user = state.registeredUsers.find(u => 
          (u.email === identifier ) && u.password === password
        );

        if (user) {
          state.isLoggedIn = true;
          state.currentUser = user;
          saveState();
          navigateTo('exams.html');
        } else {
          alert('Credenciales incorrectas');
        }
      });
    }
  }

  // Página de registro
  if (window.location.pathname.includes('login-signup.html')) {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      const matriculaInput = document.getElementById('matricula');
      if (matriculaInput) {
        matriculaInput.addEventListener('input', function() {
          const matricula = this.value;
          const errorElement = document.getElementById('nicknameError');
          
          if (matricula && !checkNicknameAvailability(matricula)) {
            if (errorElement) errorElement.classList.remove('hidden');
            this.setCustomValidity('Matricula ya registrada');
          } else {
            if (errorElement) errorElement.classList.add('hidden');
            this.setCustomValidity('');
          }
        });
      }

      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formElements = e.target.elements;
        const matricula = formElements[0].value;

        if (!checkNicknameAvailability(matricula)) {
          return;
        }

        const newUser = {
          matricula: matricula,
          nickname: formElements[1].value,
          name: formElements[2].value,
          lastName1: formElements[3].value,
          lastName2: formElements[4].value,
          email: formElements[5].value,
          password: formElements[6].value,
          profileImage: 'src/imagenes/sinfoto.png'
        };

        state.registeredUsers.push(newUser);
        state.isLoggedIn = true;
        state.currentUser = newUser;
        saveState();
        navigateTo('exams.html');
      });
    }
  }

  // Página de perfil
  if (window.location.pathname.includes('profile.html')) {
    const uploadButton = document.getElementById('uploadImageBtn');
    const imageInput = document.getElementById('imageUpload');
    
    if (uploadButton && imageInput) {
      uploadButton.addEventListener('click', () => {
        imageInput.click();
      });
      
      imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
            document.getElementById('profileImage').src = e.target.result;
            if (state.currentUser) {
              state.currentUser.profileImage = e.target.result;
              saveState();
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  // Página de exámenes
  if (window.location.pathname.includes('exams.html')) {
    const startPracticeExam = document.getElementById('startPracticeExam');
    const startFinalExam = document.getElementById('startFinalExam');
    const viewResults = document.getElementById('viewResults');
    
    if (startPracticeExam) {
      startPracticeExam.addEventListener('click', () => {
        if (state.practiceAttempts > 0) {
          state.practiceAttempts--;
          saveState();
          navigateTo('exam-practice.html');
        }
      });
    }
    
    if (startFinalExam) {
      startFinalExam.addEventListener('click', () => {
        if (state.finalAttempts > 0) {
          state.finalAttempts--;
          saveState();
          navigateTo('exam-final.html');
        }
      });
    }
    
    if (viewResults) {
      viewResults.addEventListener('click', () => {
        navigateTo('results.html');
      });
    }
  }

  // Página de examen de práctica
  if (window.location.pathname.includes('exam-practice.html')) {
    const submitButton = document.getElementById('submitPracticeExam');
    
    if (submitButton) {
      submitButton.addEventListener('click', () => {
        const score = Math.floor(Math.random() * 100);
        state.examResults.push({
          type: 'practice',
          score: score,
          date: new Date().toLocaleDateString()
        });
        saveState();
        alert(`Has completado el examen de práctica. Puntuación: ${score}`);
        navigateTo('exams.html');
      });
    }
  }

  // Página de examen final
  if (window.location.pathname.includes('exam-final.html')) {
    const submitButton = document.getElementById('submitFinalExam');
    
    if (submitButton) {
      submitButton.addEventListener('click', () => {
        const score = Math.floor(Math.random() * 100);
        state.examResults.push({
          type: 'final',
          score: score,
          date: new Date().toLocaleDateString()
        });
        saveState();
        alert(`Has completado el examen final. Puntuación: ${score}`);
        navigateTo('exams.html');
      });
    }
  }

  // Inicialización
  updateAuthUI();
  loadProfileInfo();
  updateExamUI();
  displayResults();
});
