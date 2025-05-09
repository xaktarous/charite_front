document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const resetCode = urlParams.get('code');
    const form = document.getElementById('reset-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        errorMessage.textContent = '';
        resetValidation(passwordInput);
        resetValidation(confirmPasswordInput);

        let hasError = false;

        if (!isStrongPassword(password)) {
            showError(passwordInput, "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
            hasError = true;
        } else {
            showValid(passwordInput);
        }

        if (password !== confirmPassword) {
            showError(confirmPasswordInput, "Les mots de passe ne correspondent pas.");
            hasError = true;
        } else {
            showValid(confirmPasswordInput);
        }

        if (hasError) return;

        // Envoi au backend
        fetch('https://charite-production.up.railway.app/reset_password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reset_code: resetCode,
                new_password: password
            })
        })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(({ status, body }) => {
            if (status === 200) {
                alert("Mot de passe réinitialisé avec succès !");
                window.location.href = "login.html";
            } else {
                errorMessage.textContent = body.error || "Une erreur est survenue.";
            }
        })
        .catch(err => {
            console.error("Erreur réseau :", err);
            errorMessage.textContent = "Erreur serveur. Veuillez réessayer.";
        });
    });

    // Fonctions utilitaires
    function isStrongPassword(password) {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongRegex.test(password);
    }

    function showError(input, message) {
        const msgDiv = document.getElementById('error-message');
        msgDiv.textContent = message;
        input.classList.remove('input-valid');
        input.classList.add('input-error');
    }

    function showValid(input) {
        input.classList.remove('input-error');
        input.classList.add('input-valid');
    }

    function resetValidation(input) {
        input.classList.remove('input-error', 'input-valid');
    }
});
