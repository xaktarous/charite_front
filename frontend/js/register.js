document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('register-form');

    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        resetValidation(passwordInput, 'password-error');
        resetValidation(confirmPasswordInput, 'confirm-password-error');

        let hasError = false;

        if (!validateEmail(email)) {
            alert('Veuillez entrer une adresse email valide');
            return;
        }

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

        try {
            const response = await fetch('http://localhost:8000/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            if (response.ok) {
                const data = await response.json();
                alert('Inscription réussie !');
                window.location.href = 'login.html';
            } else {
                const errorData = await response.json();
                alert('Erreur: ' + JSON.stringify(errorData));
            }

        } catch (error) {
            alert('Une erreur est survenue. Vérifiez votre connexion ou l\'API.');
            console.error(error);
        }
    });

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function isStrongPassword(password) {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongRegex.test(password);
    }

    function showError(input, errorId, message) {
        document.getElementById(errorId).textContent = message;
        input.classList.remove('input-valid');
        input.classList.add('input-error');
    }

    function showValid(input) {
        input.classList.remove('input-error');
        input.classList.add('input-valid');
    }

    function resetValidation(input, errorId) {
        document.getElementById(errorId).textContent = '';
        input.classList.remove('input-error', 'input-valid');
    }
});
