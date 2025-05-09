document.addEventListener("DOMContentLoaded", function () {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  // Exemple d'utilisation
if (isTokenExpired()) {
  localStorage.removeItem("access_token");
  sessionStorage.removeItem("access_token");
  localStorage.removeItem("expiration_date");
  sessionStorage.removeItem("expiration_date");
  localStorage.removeItem("is_staff");
  sessionStorage.removeItem("is_staff");// Redirige vers la page d'accueil si le token est expiré
}
  const userIconOrText = document.getElementById("userIconOrText");
  const dropdownContent = document.getElementById("dropdownContent");

  if (token) {
    // Requête vers /profile/ pour récupérer les infos utilisateur, dont l'image
    fetch("https://charite-production.up.railway.app/profile/", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Vérifie s'il y a une image de profil
        if (data.image) {
          userIconOrText.innerHTML = `
          <div class="user-icon-container">
            <img src="${data.image}" alt="Profile" class="rounded-circle" style="width: 35px; height: 35px; object-fit: cover;">
          </div>`;
        } else {
          // Sinon, afficher l'icône par défaut
          userIconOrText.innerHTML = `
          <div class="user-icon-container">
            <i class="fas fa-user-circle fa-lg"></i>
          </div>`;
        }

        // Ajouter les liens du menu déroulant
        dropdownContent.innerHTML = `
        <li><a class="dropdown-item" href="profile.html">Profile</a></li>
        <li><a class="dropdown-item" href="#" id="logoutBtn">Déconnexion</a></li>
      `;

        // Gérer la déconnexion
        document
          .getElementById("logoutBtn")
          .addEventListener("click", async function (e) {
            e.preventDefault();
            try {
              const response = await fetch("https://charite-production.up.railway.app/logout/", {
                method: "POST",
                headers: {
                  Authorization: "Bearer " + token,
                  "Content-Type": "application/json",
                },
              });

              if (response.ok) {
                localStorage.removeItem("access_token");
                sessionStorage.removeItem("access_token");
                localStorage.removeItem("expiration_date");
                sessionStorage.removeItem("expiration_date");
                localStorage.removeItem("is_staff");
                sessionStorage.removeItem("is_staff");
                window.location.href = "index.html";
              } else {
                const errorData = await response.json();
                alert("Erreur lors de la déconnexion : " + errorData.error);
              }
            } catch (error) {
              alert("Erreur de connexion au serveur.");
            }
          });
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération du profile :", err);
        // En cas d'erreur, afficher l'icône par défaut
        userIconOrText.innerHTML = `
        <div class="user-icon-container">
          <i class="fas fa-user-circle fa-lg"></i>
        </div>`;
      });
  } else {
    // 🔓 Utilisateur non connecté
    userIconOrText.textContent = "Compte";
    dropdownContent.innerHTML = `
      <li><a class="dropdown-item" href="register.html">Inscription</a></li>
      <li><a class="dropdown-item" href="login.html">Connexion</a></li>
    `;
  }

  fetchArticles();

  fetchCreatorInfo();
});

let currentPage = 1;
let totalPages = 1;

async function fetchArticles(page = 1) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/articles/?page=${page}`);
    const data = await res.json();
    const articles = data.results || [];
    const container = document.getElementById("blog-posts");
    container.innerHTML = "";
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    totalPages = Math.ceil(data.count / 5); // <- adapte si page_size différent
    currentPage = page;

    if (articles.length === 0) {
      // S'il n'y a aucun article, cacher la pagination
      document.getElementById("pagination").innerHTML = "";
      container.innerHTML = '<p class="text-center">Aucun article trouvé.</p>';
      return;
    }

    // Injecte les articles
    articles.forEach((art) => {
      const hasImage = art.image && art.image !== "";
      const imageUrl = hasImage
        ? art.image.startsWith("http")
          ? art.image
          : `http://127.0.0.1:8000${art.image}`
        : null;

      const card = document.createElement("div");
      card.className = "card social-post shadow-sm mb-5";

      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${art.title}</h5>
        </div>
        ${
          hasImage
            ? `<img src="${imageUrl}" class="card-img-top post-img" alt="Image de l'article">`
            : ""
        }
        <div class="card-body">
          <p class="card-text">${art.content}</p>
          <div class="comment-section">
            <div class="d-flex gap-2 align-items-center">
              <input type="text" class="form-control comment-input" placeholder="Ajouter un commentaire…" data-id="${
                art.id
              }">
              <button class="btn btn-primary btn-send" data-id="${
                art.id
              }">Envoyer</button>
              <button class="btn btn-outline-secondary btn-toggle-comments" data-id="${
                art.id
              }">Voir commentaires</button>
            </div>
            <ul class="comment-list d-none" id="comments-${art.id}"></ul>
          </div>
        </div>
      `;
      container.appendChild(card);

      // Commentaires
      const btnToggle = card.querySelector(".btn-toggle-comments");
      const commentList = card.querySelector(`#comments-${art.id}`);

      btnToggle.addEventListener("click", async () => {
        if (commentList.classList.contains("d-none")) {
          if (token) {
            const comments = await fetch(
              `http://127.0.0.1:8000/articles/${art.id}/comments/`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            ).then((r) => (r.ok ? r.json() : []));

            commentList.innerHTML = "";
            comments.forEach((c) => {
              const profilePic = c.user?.image
                ? c.user.image.startsWith("http")
                  ? c.user.image
                  : `http://127.0.0.1:8000${c.user.image}`
                : "https://t4.ftcdn.net/jpg/02/29/75/83/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg";

              const li = document.createElement("li");
              li.innerHTML = `
                <img src="${profilePic}" alt="avatar">
                <div>
                  <strong>${c.user?.username || "Utilisateur"}</strong><br>
                  <span>${c.content}</span>
                </div>
              `;
              commentList.appendChild(li);
            });
          } else {
            alert("Connectez-vous pour voir les commentaires.");
            return;
          }

          commentList.classList.remove("d-none");
          btnToggle.textContent = "Cacher les commentaires";
        } else {
          commentList.classList.add("d-none");
          btnToggle.textContent = "Voir commentaires";
        }
      });

      card.querySelector(".btn-send").addEventListener("click", async () => {
        const input = card.querySelector(".comment-input");
        const content = input.value.trim();

        if (!token) return alert("Vous devez être connecté.");
        if (content) {
          await fetch(`http://127.0.0.1:8000/articles/${art.id}/comments/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
          });
          input.value = "";
        }
      });
    });

    afficherBoutonsPagination();
  } catch (error) {
    console.error("Erreur fetchArticles :", error);
  }
}

function afficherBoutonsPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const btnPrev = document.createElement("button");
  btnPrev.className = "btn btn-outline-primary";
  btnPrev.textContent = "← Précédent";
  btnPrev.disabled = currentPage === 1;
  btnPrev.onclick = () => fetchArticles(currentPage - 1);
  pagination.appendChild(btnPrev);

  const pageInfo = document.createElement("span");
  pageInfo.className = "mx-3 align-self-center";
  pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
  pagination.appendChild(pageInfo);

  const btnNext = document.createElement("button");
  btnNext.className = "btn btn-outline-primary";
  btnNext.textContent = "Suivant →";
  btnNext.disabled = currentPage === totalPages;
  btnNext.onclick = () => fetchArticles(currentPage + 1);
  pagination.appendChild(btnNext);
}

async function fetchCreatorInfo() {
  try {
    const res = await fetch("http://127.0.0.1:8000/creator/");
    const data = await res.json();

    const imageUrl = data.image?.startsWith("http")
      ? data.image
      : `http://127.0.0.1:8000${data.image}`;

    const container = document.getElementById("creator-info");
    container.innerHTML = `
      <div class="card p-3 text-center creator-card">
        <img src="${imageUrl}" alt="Photo du créateur" class="creator-img mx-auto mb-3">
        <h5 class="mb-1">${data.first_name} ${data.last_name}</h5>
        <p class="text-muted mb-0">${
          data.description || "Aucune description disponible."
        }</p>
      </div>
    `;
  } catch (err) {
    console.error("Erreur lors du fetch des infos créateur :", err);
  }
}


function isTokenExpired() {
  const expirationDateStr = localStorage.getItem("expiration_date");
  if (!expirationDateStr) {
      return true; // Pas de date = expiré
  }

  const expirationDate = new Date(expirationDateStr);
  const now = new Date();

  return now >= expirationDate;
}


