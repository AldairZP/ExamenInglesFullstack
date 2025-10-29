document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('.form-box.login');
  const registerForm = document.querySelector('.form-box.register');
  const forgotForm = document.querySelector('.form-box.forgot');

  document.querySelector('.switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
  });

  document.querySelector('.switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    forgotForm.classList.remove('active');
    loginForm.classList.add('active');
  });

  document.querySelector('.switch-to-forgot').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    forgotForm.classList.add('active');
  });
});
