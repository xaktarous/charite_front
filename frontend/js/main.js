// === Configuration ===
const API_BASE_URL = 'https://charite-production.up.railway.app';
const DEFAULT_AVATAR = 'https://t4.ftcdn.net/jpg/02/29/75/83/360_F_229758328_7x8jwCwjtBMmC6rgFzLFhZoEpLobB6L8.jpg';

// === État global ===
let currentPage = 1;
let totalPages = 1;
const commentCache = new Map();

// === Utils ===
const getToken = () => localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

const isTokenExpired = () => {
  const expiration = localStorage.getItem("expiration_date");
  return !expiration || new Date() >= new Date(expiration);
};

const clearTokenData = () => {
  ["access_token", "expiration_date", "is_staff"].forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

const getImageUrl = (path) => path ? (path.startsWith("https") ? path : `${API_BASE_URL}${path}`) : DEFAULT_AVATAR;

// === Auth / Profile ===
async function fetchUserProfile(token) {
  const res = await fetch(`${API_BASE_URL}/profile/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function handleProfileUI(token) {
  const userIcon = document.getElementById("userIconOrText");
  const dropdown = document.getElementById("dropdownContent");
  try {
    const data = await fetchUserProfile(token);
    userIcon.innerHTML = data.image ? `<div class="user-icon-container"><img src="${data.image}" alt="Profile" class="rounded-circle" style="width:35px;height:35px;object-fit:cover;" loading="lazy"></div>` : `<div class="user-icon-container"><i class="fas fa-user-circle fa-lg"></i></div>`;
    dropdown.innerHTML = `<li><a class="dropdown-item" href="profile.html">Profile</a></li><li><a class="dropdown-item" href="#" id="logoutBtn">Déconnexion</a></li>`;
    setupLogout();
  } catch (e) {
    userIcon.innerHTML = `<div class="user-icon-container"><i class="fas fa-user-circle fa-lg"></i></div>`;
  }
}

function setupLogout() {
  const btn = document.getElementById("logoutBtn");
  btn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/logout/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        clearTokenData();
        window.location.href = "index.html";
      }
    } catch (err) {
      alert("Erreur de connexion au serveur.");
    }
  });
}

// === Articles ===
async function fetchArticles(page = 1) {
  const res = await fetch(`${API_BASE_URL}/articles/?page=${page}`);
  const data = await res.json();
  totalPages = Math.ceil(data.count / 5);
  currentPage = page;
  renderArticles(data.results || []);
  renderPagination();
}

function renderArticles(articles) {
  const container = document.getElementById("blog-posts");
  container.innerHTML = articles.length ? "" : '<p class="text-center">Aucun article trouvé.</p>';
  articles.forEach(art => {
    const image = art.image ? getImageUrl(art.image) : "";
    const card = createArticleCard(art, image);
    container.appendChild(card);
    setupCommentHandlers(card, art.id);
  });
}

function createArticleCard(art, image) {
  const card = document.createElement("div");
  card.className = "card social-post shadow-sm mb-5";
  card.innerHTML = `
    <div class="card-body"><h5 class="card-title">${art.title}</h5></div>
    ${image ? `<img src="${image}" class="card-img-top post-img" alt="Image de l'article" loading="lazy">` : ""}
    <div class="card-body">
      <p class="card-text">${art.content}</p>
      <div class="comment-section">
        <div class="d-flex gap-2 align-items-center">
          <input type="text" class="form-control comment-input" placeholder="Ajouter un commentaire…" data-id="${art.id}">
          <button class="btn btn-primary btn-send" data-id="${art.id}">Envoyer</button>
          <button class="btn btn-outline-secondary btn-toggle-comments" data-id="${art.id}">Voir commentaires</button>
        </div>
        <ul class="comment-list d-none" id="comments-${art.id}"></ul>
      </div>
    </div>`;
  return card;
}

function renderPagination() {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  pagination.append(
    createPaginationButton("← Précédent", currentPage > 1, () => fetchArticles(currentPage - 1)),
    document.createTextNode(` Page ${currentPage} / ${totalPages} `),
    createPaginationButton("Suivant →", currentPage < totalPages, () => fetchArticles(currentPage + 1))
  );
}

function createPaginationButton(text, enabled, onClick) {
  const btn = document.createElement("button");
  btn.className = `btn btn-outline-primary ${enabled ? '' : 'disabled'}`;
  btn.textContent = text;
  btn.disabled = !enabled;
  btn.onclick = onClick;
  return btn;
}

// === Commentaires ===
function setupCommentHandlers(card, articleId) {
  const token = getToken();
  const btnToggle = card.querySelector(".btn-toggle-comments");
  const btnSend = card.querySelector(".btn-send");
  const commentList = card.querySelector(`#comments-${articleId}`);
  const input = card.querySelector(".comment-input");

  btnToggle.addEventListener("click", () => toggleComments(articleId, commentList, btnToggle, token));
  btnSend.addEventListener("click", async () => {
    const content = input.value.trim();
    if (!token) return alert("Connectez-vous.");
    if (content) {
      await postComment(articleId, content, token);
      input.value = "";
      commentCache.delete(articleId);
      toggleComments(articleId, commentList, btnToggle, token);
    }
  });
}

async function postComment(articleId, content, token) {
  await fetch(`${API_BASE_URL}/articles/${articleId}/comments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content })
  });
}

async function toggleComments(articleId, commentList, btn, token) {
  if (commentList.classList.contains("d-none")) {
    if (!token) return alert("Connectez-vous pour voir les commentaires.");
    let comments = commentCache.get(articleId);
    if (!comments) {
      const res = await fetch(`${API_BASE_URL}/articles/${articleId}/comments/`, { headers: { Authorization: `Bearer ${token}` } });
      comments = await res.json();
      commentCache.set(articleId, comments);
    }
    commentList.innerHTML = comments.map(c => `
      <li><img src="${getImageUrl(c.user?.image)}" alt="avatar" loading="lazy">
      <div><strong>${c.user?.username || "Utilisateur"}</strong><br><span>${c.content}</span></div></li>`).join("");
    commentList.classList.remove("d-none");
    btn.textContent = "Cacher les commentaires";
  } else {
    commentList.classList.add("d-none");
    btn.textContent = "Voir commentaires";
  }
}

// === Créateur ===
async function fetchCreatorInfo() {
  try {
    const res = await fetch(`${API_BASE_URL}/creator/`);
    const data = await res.json();
    const image = getImageUrl(data.image);
    const container = document.getElementById("creator-info");
    container.innerHTML = `<div class="card p-3 text-center creator-card">
      <img src="${image}" alt="Photo du créateur" class="creator-img mx-auto mb-3" loading="lazy">
      <h5 class="mb-1">${data.first_name} ${data.last_name}</h5>
      <p class="text-muted mb-0">${data.description || "Aucune description disponible."}</p></div>`;
  } catch (e) {
    console.error("Erreur infos créateur:", e);
  }
}

// === Initialisation ===
document.addEventListener("DOMContentLoaded", () => {
  if (isTokenExpired()) clearTokenData();
  const token = getToken();
  token ? handleProfileUI(token) : handleUnauthenticatedUI();
  fetchArticles();
  fetchCreatorInfo();
});

function handleUnauthenticatedUI() {
  document.getElementById("userIconOrText").textContent = "Compte";
  document.getElementById("dropdownContent").innerHTML = `
    <li><a class="dropdown-item" href="register.html">Inscription</a></li>
    <li><a class="dropdown-item" href="login.html">Connexion</a></li>`;
}

