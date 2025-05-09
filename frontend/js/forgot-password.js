let userEmail = ""; // Stocke l'email pour le renvoi
let countdownInterval; // Pour contrôler le timer

// Fonction pour lancer le compte à rebours
function startCountdown(durationInSeconds = 120) {
  const countdownDisplay = document.getElementById("countdown");
  const codeError = document.getElementById("code-error");
  let timeLeft = durationInSeconds;

  clearInterval(countdownInterval); // reset du timer si un autre tourne
  codeError.innerText = ""; // Effacer les erreurs précédentes

  countdownInterval = setInterval(() => {
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");
    countdownDisplay.textContent = `${minutes}:${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      countdownDisplay.textContent = "00:00";
      document.querySelector(
        "#code-form button[type='submit']"
      ).disabled = true;

      // Afficher clairement le message d'erreur
      codeError.innerText =
        "Le code de réinitialisation a expiré. Veuillez demander un nouveau code.";
      codeError.classList.add("error-message");
    }

    timeLeft--;
  }, 1000);
}

// Étape 1 - Envoi de l'email
document.getElementById("email-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const emailInput = document.getElementById("email");
  const email = emailInput.value.trim();
  const emailError = document.getElementById("email-error");

  emailError.innerText = "";

  fetch("https://charite-production.up.railway.app/forget_password/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email }),
  })
    .then((res) =>
      res.json().then((data) => ({ status: res.status, body: data }))
    )
    .then(({ status, body }) => {
      if (status === 200) {
        userEmail = email; // on sauvegarde l'email
        document.getElementById("step-email").classList.remove("active");
        document.getElementById("step-code").classList.add("active");
        document.querySelector(
          "#code-form button[type='submit']"
        ).disabled = false;
        startCountdown(); // Lancer le compte à rebours
      } else {
        emailError.innerText = body.email || "cet email n'existe pas.";
      }
    })
    .catch(() => {
      emailError.innerText = "Erreur serveur.";
    });
});

// Étape 2 - Vérification du code
document.getElementById("code-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const inputs = document.querySelectorAll(".code-input");
  const codeError = document.getElementById("code-error");

  let reset_code = "";
  inputs.forEach((input) => (reset_code += input.value.toUpperCase()));

  if (reset_code.length !== 6) {
    codeError.innerText = "Veuillez entrer le code complet.";
    return;
  }

  fetch("https://charite-production.up.railway.app/verify_reset_code/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reset_code: reset_code }),
  })
    .then(async (res) => {
      const body = await res.json();

      if (res.ok) {
        clearInterval(countdownInterval);
        window.location.href = `reset-password.html?code=${reset_code}`;
      } else {
        console.log("Erreur côté backend :", body.error);

        // Vérifier si l'erreur est liée à l'expiration du code
        if (body.error && body.error.includes("expiré")) {
          document.getElementById("countdown").textContent = "00:00";
          const codeError = document.getElementById("code-error");
          codeError.innerText =
            "Le code de réinitialisation a expiré. Veuillez demander un nouveau code.";
          codeError.classList.add("error-message");
        } else {
          document.getElementById("code-error").innerText =
            body.error || "Code invalide. Veuillez vérifier et réessayer.";
        }
      }
    })
    .catch((err) => {
      console.error("Erreur réseau ou serveur :", err);
      document.getElementById("code-error").innerText =
        "Erreur serveur. Veuillez réessayer plus tard.";
    });
});

// UX : passer automatiquement au champ suivant
document.querySelectorAll(".code-input").forEach((input, index, inputs) => {
  input.addEventListener("input", () => {
    input.value = input.value.toUpperCase();
    if (input.value.length === 1 && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && input.value === "" && index > 0) {
      inputs[index - 1].focus();
    }
  });
});

// Bouton "Renvoyer le code"
document.getElementById("resend-code").addEventListener("click", function () {
  if (!userEmail) {
    alert("Aucune adresse email trouvée !");
    return;
  }

  fetch("https://charite-production.up.railway.app/forget_password/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: userEmail }),
  })
    .then((res) =>
      res.json().then((data) => ({ status: res.status, body: data }))
    )
    .then(({ status, body }) => {
      if (status === 200) {
        alert("Nouveau code envoyé !");
        document.querySelector(
          "#code-form button[type='submit']"
        ).disabled = false;
        startCountdown(); // Re-lancer le compte à rebours
      } else {
        alert("Erreur lors de l'envoi du code.");
      }
    })
    .catch(() => {
      alert("Erreur serveur.");
    });
});
