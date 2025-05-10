document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const errorMessage = document.getElementById("error-message");

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember").checked;

    errorMessage.textContent = "";

    if (!username || !password) {
      errorMessage.textContent = "Veuillez remplir tous les champs";
      return;
    }

    try {
      // Envoyer la requête à ton endpoint 'login/'
      const response = await fetch("https://charite-production.up.railway.app/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sauvegarder le token
        const now= new Date();
        const expiresIn = data.expires_in * 1000; // Convertir en millisecondes
        const expirationDate = new Date(now.getTime() + expiresIn);
        if (remember) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("is_staff", data.is_staff);
          localStorage.setItem("expiration_date", expirationDate.toISOString()); 
        } else {
          sessionStorage.setItem("access_token", data.access_token);
          sessionStorage.setItem("is_staff", data.is_staff);
          sessionStorage.setItem("expiration_date", expirationDate.toISOString());
        }

        // Sauvegarder le nom d'utilisateur
        if (remember) {
          localStorage.setItem("username", username);
        }

        // Rediriger vers l’accueil
        if (data.is_staff) {
          window.location.href = "dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      } else {
        errorMessage.textContent = "username ou mot de passe incorrect";
      }
    } catch (error) {
      console.error("Erreur:", error);
      errorMessage.textContent = "Erreur de connexion au serveur";
    }
  });

  const savedUsername = localStorage.getItem("username");
  if (savedUsername) {
    document.getElementById("username").value = savedUsername;
    document.getElementById("remember").checked = true;
  }
});
