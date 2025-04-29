document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileForm');
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

  if (isTokenExpired()) {
    return this.location.href = "login.html";
  }

  // === Fonctions utilitaires ===
  function showError(input, errorId, message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    document.getElementById(errorId).textContent = message;
  }

  function showValid(input) {
    input.classList.add('is-valid');
    input.classList.remove('is-invalid');
  }

  function resetValidation(input, errorId) {
    input.classList.remove('is-invalid', 'is-valid');
    document.getElementById(errorId).textContent = '';
  }

  function isStrongPassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
  }

  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function showMessage(message, type = 'success') {
    messageBox.innerHTML = `
      <div class="alert alert-${type}" role="alert">${message}</div>
    `;
  }

  // === 1. Charger les données utilisateur ===
  fetch('http://localhost:8000/profile/', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('username').value = data.username || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('firstName').value = data.first_name || '';
    document.getElementById('lastName').value = data.last_name || '';
  })
  .catch(err => {
    console.error('Erreur lors du chargement du profil :', err);
    alert("Erreur lors du chargement du profil.", 'danger');
  });

  // === 2. Mise à jour utilisateur avec validation ===
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;

    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    resetValidation(passwordInput, 'password-error');
    resetValidation(confirmPasswordInput, 'confirm-password-error');

    let hasError = false;

    if (!validateEmail(email)) {
      showMessage('Veuillez entrer une adresse email valide.', 'danger');
      return;
    }

    if (password !== '') {
      if (!isStrongPassword(password)) {
        showError(passwordInput, 'password-error', "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
        hasError = true;
      } else {
        showValid(passwordInput);
      }

      if (password !== confirmPassword) {
        showError(confirmPasswordInput, 'confirm-password-error', "Les mots de passe ne correspondent pas.");
        hasError = true;
      } else {
        showValid(confirmPasswordInput);
      }

      if (hasError) return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    if (password) formData.append('password', password);

    const imageFile = document.getElementById('profileImage').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const res = await fetch('http://localhost:8000/profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erreur API :", data);
        alert("Erreur lors de la mise à jour : " + JSON.stringify(data), 'danger');
        return;
      }

      alert("Profile mis à jour avec succès !");
    } catch (error) {
      console.error('Erreur de mise à jour :', error);
      alert("Une erreur est survenue lors de la mise à jour.", 'danger');
    }
  });
});



function isTokenExpired() {
  const expirationDateStr = localStorage.getItem("expiration_date");
  if (!expirationDateStr) {
      return true; // Pas de date = expiré
  }

  const expirationDate = new Date(expirationDateStr);
  const now = new Date();

  return now >= expirationDate;
}