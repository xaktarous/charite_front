document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const sidebarLinks = sidebar.querySelectorAll("a");

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });

  // Fermer la sidebar quand on clique sur un lien
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      sidebar.classList.remove("active");
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");
  const isStaff = localStorage.getItem("is_staff");
  if (!token) return (window.location.href = "login.html");
  if (isTokenExpired()) {
    return this.location.href = "login.html";
  }
  if (isStaff !== "true") {
    alert("Vous n'avez pas l'accès à cette page.");
    return (window.location.href = "index.html");
  }
  chargerProfilUtilisateur(token);
  chargerStatistiques(token);
  afficherArticles(token);

  setupFormulaireArticle(token);
  setupNavigation();
  Profil(token);
  mettreAJourProfil(token);
  setupLogout();
});

// — Statistiques —
function chargerStatistiques(token) {
  fetch("https://charite-production.up.railway.app/stats/", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((d) => {
      document.getElementById("total-posts").textContent = d.total_articles;
      document.getElementById("total-comments").textContent =
        d.total_commentaires;
    })
    .catch(console.error);
}

// — Profil en haut —
function chargerProfilUtilisateur(token) {
  fetch("https://charite-production.up.railway.app/profile/", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      const name = data.username || "Utilisateur";
      const img = data.image
        ? data.image.startsWith("http")
          ? data.image
          :data.image
        : "default-avatar.png";
      document.getElementById("user-name").textContent = name;
      document.getElementById("user-avatar").src = img;
    })
    .catch(console.error);
}

// — Articles & Commentaires —
let nextPageUrl = null;
let prevPageUrl = null;
let baseUrl = "https://charite-production.up.railway.app/articles/";
let currentSearch = ""; // Recherche active

async function afficherArticles(token, url = null) {
  try {
    let finalUrl = url || `${baseUrl}?page=1`;

    const urlObj = new URL(finalUrl);

    // Ajoute ou supprime le paramètre search
    if (currentSearch) {
      urlObj.searchParams.set("search", currentSearch);
    } else {
      urlObj.searchParams.delete("search");
    }

    finalUrl = urlObj.toString();

    const response = await fetch(finalUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    const articles = data.results ?? [];

    // 🔁 Pagination info
    const parsedUrl = new URL(finalUrl);
    currentPage = parseInt(parsedUrl.searchParams.get("page")) || 1;

    const totalCount = data.count || articles.length;
    const pageSize = 5;
    totalPages = Math.ceil(totalCount / pageSize);

    const container = document.getElementById("articles-container");
    container.innerHTML = "";

    for (const art of articles) {
      const imageUrl = art.image
        ? art.image.startsWith("https")
          ? art.image
          : art.image
        : null;

      const card = document.createElement("div");
      card.className = "article-card";

      card.innerHTML = `
        <div class="article-header">
          <h3>${art.title}</h3>
          <div class="article-actions">
            <button class="btn-toggle">Voir commentaires</button>
            <button class="btn-edit" data-id="${art.id}">✏️</button>
            <button class="btn-delete" data-id="${art.id}">🗑️</button>
          </div>
        </div>
        <div class="article-body">${art.content}</div>
        <ul class="comment-list" id="comments-${art.id}"></ul>
        <div class="add-comment">
          <input type="text" id="input-${art.id}" placeholder="Ajouter un commentaire…">
          <button class="btn-add" data-id="${art.id}">➕</button>
        </div>
      `;

      container.appendChild(card);

      // Charger les commentaires
      const comments = await fetch(
        `https://charite-production.up.railway.app/articles/${art.id}/comments/`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then((r) => (r.ok ? r.json() : []));

      const list = card.querySelector(`#comments-${art.id}`);
      comments.forEach((c) => {
        const li = document.createElement("li");
        li.className = "comment-item";
        li.innerHTML = `
          <span>${c.content || ""}</span>
          <button data-id="${c.id}" data-article="${art.id}">❌</button>
        `;
        list.appendChild(li);
      });

      setupArticleListeners(card, art.id, token);
    }

    afficherBoutonsPagination(token);
  } catch (error) {
    console.error("❌ Erreur lors du chargement des articles :", error);
  }
}

function afficherBoutonsPagination(token) {
  const container = document.getElementById("pagination-buttons");
  container.innerHTML = "";

  if (totalPages <= 1) return;

  const wrapper = document.createElement("div");
  wrapper.className = "pagination-wrapper";

  const ul = document.createElement("ul");
  ul.className = "custom-pagination";

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const li = document.createElement("li");
    li.className = `custom-page-item ${i === currentPage ? "active" : ""}`;

    const btn = document.createElement("button");
    btn.className = "custom-page-link";
    btn.textContent = i;

    btn.addEventListener("click", () => {
      if (i !== currentPage) {
        afficherArticles(token, `${baseUrl}?page=${i}`);
      }
    });

    li.appendChild(btn);
    ul.appendChild(li);
  }

  wrapper.appendChild(ul);
  container.appendChild(wrapper);
}

document.getElementById("searchBtn").addEventListener("click", () => {
  currentSearch = document.getElementById("searchInput").value.trim();
  afficherArticles(currentSearch); // Recharge les articles avec la recherche
});

document.getElementById("searchInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("searchBtn").click();
  }
});

function setupArticleListeners(card, articleId, token) {
  const toggleBtn = card.querySelector(".btn-toggle");
  const list = card.querySelector(".comment-list");
  const editBtn = card.querySelector(".btn-edit");
  const delArtBtn = card.querySelector(".btn-delete");
  const addBtn = card.querySelector(".btn-add");
  const input = card.querySelector(`#input-${articleId}`);

  toggleBtn.addEventListener("click", () => {
    const shown = list.style.display === "block";
    list.style.display = shown ? "none" : "block";
    toggleBtn.textContent = shown ? "Voir commentaires" : "Cacher commentaires";
  });

  // delete comment
  list.querySelectorAll("button").forEach((btn) =>
    btn.addEventListener("click", () => {
      fetch(
        `https://charite-production.up.railway.app/articles/${articleId}/comments/${btn.dataset.id}/`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      ).then((r) => r.ok && afficherArticles(token));
    })
  );

  // add comment
  addBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;
    fetch(`https://charite-production.up.railway.app/articles/${articleId}/comments/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: text }),
    }).then((r) => r.ok && afficherArticles(token));
  });

  // delete article
  delArtBtn.addEventListener("click", () => {
    if (!confirm("Supprimer cet article ?")) return;
    fetch(`https://charite-production.up.railway.app/articles/${articleId}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.ok && afficherArticles(token));
  });

  // edit article
  // edit article
  editBtn.addEventListener("click", async () => {
    const res = await fetch(`https://charite-production.up.railway.app/articles/${articleId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const art = await res.json();

      // 📝 Remplir les champs texte
      document.getElementById("title").value = art.title;
      document.getElementById("content").value = art.content;
      document.getElementById("postForm").dataset.editId = articleId;

      // 🖼️ Afficher l’image existante
      const preview = document.getElementById("image-preview");
      preview.innerHTML = ""; // reset

      if (art.image) {
        const img = document.createElement("img");
        img.src = art.image.startsWith("https")
          ? art.image
          : art.image;
        img.style.maxWidth = "150px";
        img.style.borderRadius = "8px";
        img.style.marginTop = "10px";
        preview.appendChild(img);
      }

      // 🎯 Prévisualisation si on sélectionne une nouvelle image
      const imageInput = document.getElementById("image");
      imageInput.addEventListener("change", () => {
        preview.innerHTML = ""; // reset

        if (imageInput.files && imageInput.files[0]) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const newImg = document.createElement("img");
            newImg.src = e.target.result;
            newImg.style.maxWidth = "150px";
            newImg.style.borderRadius = "8px";
            newImg.style.marginTop = "10px";
            preview.appendChild(newImg);
          };
          reader.readAsDataURL(imageInput.files[0]);
        }
      });

      // Afficher le formulaire
      document.getElementById("create-post-section").style.display = "block";
      document.getElementById("articles-section").style.display = "none";
      document.getElementById("form-title").textContent = "Modifier l'article";
    }
  });
}
function setupFormulaireArticle(token) {
  const form = document.getElementById("postForm");
  const imgInput = document.getElementById("image");
  const preview = document.getElementById("image-preview");

  // Aperçu instantané si on sélectionne une image
  imgInput.addEventListener("change", () => {
    preview.innerHTML = "";
    const file = imgInput.files[0];
    if (file) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.style.maxWidth = "150px";
      img.style.borderRadius = "8px";
      img.style.marginTop = "10px";
      preview.appendChild(img);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const editId = form.dataset.editId;
    const url = editId
      ? `https://charite-production.up.railway.app/articles/${editId}/`
      : "https://charite-production.up.railway.app/articles/";
    const method = editId ? "PUT" : "POST";

    const title = form.querySelector('[name="title"]').value;
    const content = form.querySelector('[name="content"]').value;
    const file = imgInput.files[0];

    let fetchOptions = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    if (file) {
      // Cas avec image → FormData
      const fd = new FormData();
      fd.append("title", title);
      fd.append("content", content);
      fd.append("image", file);
      fetchOptions.body = fd;
      // Ne PAS mettre Content-Type ici
    } else {
      // Cas sans image → JSON
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify({ title, content });
    }

    try {
      const res = await fetch(url, fetchOptions);

      if (!res.ok) {
        const err = await (file
          ? res.text() // FormData erreurs
          : res.json()); // JSON erreurs
        console.error("Erreur serveur :", err);
        alert("Erreur lors de l’envoi : " + (err.error || err));
        return;
      }

      // Succès : reset + rafraîchir
      form.reset();
      delete form.dataset.editId;
      preview.innerHTML = "";
      document.getElementById("form-title").textContent =
        "Créer un nouvel article";
      document.getElementById("create-post-section").style.display = "none";
      document.getElementById("articles-section").style.display = "block";
      afficherArticles(token);
    } catch (networkErr) {
      console.error("Erreur réseau :", networkErr);
      alert("Erreur réseau, vérifiez votre connexion.");
    }
  });

  // Nouvel article
  document.getElementById("new-post-btn").addEventListener("click", () => {
    form.reset();
    delete form.dataset.editId;
    preview.innerHTML = "";
    document.getElementById("form-title").textContent =
      "Créer un nouvel article";
    document.getElementById("create-post-section").style.display = "block";
    document.getElementById("articles-section").style.display = "none";
  });

  // Annuler / Retour
  ["cancelEdit", "back-to-list"].forEach((id) => {
    document.getElementById(id).addEventListener("click", () => {
      form.reset();
      delete form.dataset.editId;
      preview.innerHTML = "";
      document.getElementById("create-post-section").style.display = "none";
      document.getElementById("articles-section").style.display = "block";
    });
  });
}

// — Profil GET/PUT —
function mettreAJourProfil(token) {
  const form = document.getElementById("creatorForm");
  const imageInput = document.getElementById("creatorImage");
  const preview = document.getElementById("creatorImagePreview");

  if (!form) {
    console.error("Formulaire de profil introuvable");
    return;
  }

  // 💡 Prévisualisation de l'image sélectionnée
  imageInput.addEventListener("change", () => {
    preview.innerHTML = ""; // Réinitialiser l'aperçu

    if (imageInput.files && imageInput.files[0]) {
      const reader = new FileReader();

      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "150px";
        img.style.borderRadius = "8px";
        img.style.marginTop = "10px";
        preview.appendChild(img);
      };

      reader.readAsDataURL(imageInput.files[0]);
    }
  });

  // 📨 Gestion de la soumission du formulaire
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nomComplet = document.getElementById("creatorName").value.trim();
    const biography = document.getElementById("creatorDescription").value;

    const formData = new FormData();

    // Séparer prénom et nom
    const [first_name, ...rest] = nomComplet.split(" ");
    const last_name = rest.join(" ");

    formData.append("first_name", first_name || "");
    formData.append("last_name", last_name || "");
    formData.append("description", biography);

    // Ajouter l'image si sélectionnée
    if (imageInput.files.length > 0) {
      console.log("Image sélectionnée :", imageInput.files[0]);
      formData.append("image", imageInput.files[0]);
    }

    fetch("https://charite-production.up.railway.app/profile/", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur lors de la mise à jour du profil");
        }
        return res.json();
      })
      .then((data) => {
        alert("✅ Profil mis à jour avec succès !");
        // recharge le profil avec les nouvelles données
      })
      .catch((err) => console.error("❌ Erreur PUT profil :", err));
  });
}

// — Profil GET —
function Profil(token) {
  fetch("https://charite-production.up.railway.app/profile/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      const fullName = `${data.first_name} ${data.last_name}`.trim();
      document.getElementById("creatorName").value = fullName;
      document.getElementById("creatorDescription").value =
        data.description || "";

      const preview = document.getElementById("creatorImagePreview");
      preview.innerHTML = "";
      if (data.image) {
        const img = document.createElement("img");
        img.src = data.image.startsWith("https")
          ? data.image
          : data.image;
        img.style.maxWidth = "150px";
        img.style.borderRadius = "8px";
        img.style.marginTop = "10px";
        preview.appendChild(img);
      }
    })
    .catch((error) => {
      console.error("Erreur lors du chargement du profil :", error);
    });
}

function setupNavigation() {
  const navDash = document.getElementById("nav-dashboard");
  const navArtsLi = document.getElementById("nav-articles-li");
  const navProfLi = document.getElementById("nav-profile-li");
  const stats = document.getElementById("stats-section");

  document.getElementById("nav-articles").addEventListener("click", () => {
    stats.style.display = "none";
    document.getElementById("articles-section").style.display = "block";
    document.getElementById("create-post-section").style.display = "none";
    document.getElementById("profile-section").style.display = "none";
    navDash.classList.remove("active");
    navArtsLi.classList.add("active");
    navProfLi.classList.remove("active");
  });

  document.getElementById("nav-profile").addEventListener("click", () => {
    stats.style.display = "none";
    document.getElementById("articles-section").style.display = "none";
    document.getElementById("create-post-section").style.display = "none";
    document.getElementById("profile-section").style.display = "block";
    navDash.classList.remove("active");
    navArtsLi.classList.remove("active");
    navProfLi.classList.add("active");
  });

  navDash.querySelector("a").addEventListener("click", () => {
    stats.style.display = "grid";
    document.getElementById("articles-section").style.display = "block";
    document.getElementById("create-post-section").style.display = "none";
    document.getElementById("profile-section").style.display = "none";
    navDash.classList.add("active");
    navArtsLi.classList.remove("active");
    navProfLi.classList.remove("active");
  });
}

// — Logout avec confirmation —
function setupLogout() {
  document.getElementById("logout").addEventListener("click", async (e) => {
    e.preventDefault();
    if (!confirm("Vous êtes sûr de vouloir vous déconnecter ?")) return;
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    try {
      const res = await fetch("https://charite-production.up.railway.app/logout/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
      
        alert("Déconnecté !");
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
        localStorage.removeItem("expiration_date");
        sessionStorage.removeItem("expiration_date");
        localStorage.removeItem("is_staff");
        sessionStorage.removeItem("is_staff");
        window.location.href = "login.html";
      }
    } catch (err) {
      console.error(err);
      alert("Erreur déconnexion");
    }
  });
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