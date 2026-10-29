const games = [
  { id: "blox-fruits", name: "Blox Fruits", category: "Adventure", icon: "⚔️", art: "art-purple" },
  { id: "brookhaven", name: "Brookhaven", category: "Roleplay", icon: "🏡", art: "art-blue" },
  { id: "adopt-me", name: "Adopt Me!", category: "Pets & Trading", icon: "🐾", art: "art-orange" },
  { id: "tower-defense", name: "Tower Defense", category: "Strategy", icon: "🛡️", art: "art-green" },
  { id: "pet-simulator", name: "Pet Simulator", category: "Simulator", icon: "🐶", art: "art-pink" },
  { id: "obby", name: "Obby Challenge", category: "Obby", icon: "🧩", art: "art-cyan" }
];

const STORAGE_KEY = "afkHubProfilesV1";

let profiles = loadProfiles();
let sessionsStarted = 0;
let editingId = null;
let activeSessions = new Set();
let toastTimeout;

function loadProfiles() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveProfiles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  renderProfiles();
  updateStats();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function gameById(id) {
  return games.find(game => game.id === id) || games[0];
}

function renderGameCard(game) {
  return `
    <article class="game-card">
      <div class="game-art ${game.art}">${game.icon}</div>
      <div class="game-info">
        <h3>${escapeHTML(game.name)}</h3>
        <p>${escapeHTML(game.category)}</p>
        <button class="primary-btn" data-create-for="${game.id}">
          Profil erstellen
        </button>
      </div>
    </article>
  `;
}

function renderGames() {
  document.getElementById("featured-games").innerHTML =
    games.slice(0, 3).map(renderGameCard).join("");

  document.getElementById("all-games").innerHTML =
    games.map(renderGameCard).join("");

  document.getElementById("profile-game").innerHTML = games.map(game =>
    `<option value="${game.id}">${escapeHTML(game.name)}</option>`
  ).join("");
}

function updateStats() {
  document.getElementById("game-count").textContent = games.length;
  document.getElementById("profile-count").textContent = profiles.length;
  document.getElementById("session-count").textContent = sessionsStarted;
}

function renderProfiles() {
  const list = document.getElementById("profile-list");
  const empty = document.getElementById("profile-empty");

  if (profiles.length === 0) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  list.innerHTML = profiles.map(profile => {
    const game = gameById(profile.gameId);
    const running = activeSessions.has(profile.id);

    return `
      <article class="profile-card">
        <div>
          <h3>${escapeHTML(profile.name)}</h3>
          <p>${game.icon} ${escapeHTML(game.name)} · ${escapeHTML(actionLabel(profile.action))}</p>
          <p>${running ? "● Demo-Sitzung läuft" : "○ Nicht aktiv"}</p>
        </div>
        <div class="profile-actions">
          <button class="run-btn" data-run="${profile.id}">
            ${running ? "Demo stoppen" : "Demo starten"}
          </button>
          <button data-edit="${profile.id}">Bearbeiten</button>
          <button data-delete="${profile.id}">Löschen</button>
        </div>
      </article>
    `;
  }).join("");
}

function actionLabel(action) {
  const labels = {
    click: "Klicks simulieren",
    walk: "Bewegung simulieren",
    interact: "Interaktionen simulieren",
    idle: "Nur Sitzung anzeigen"
  };

  return labels[action] || labels.idle;
}

function showPage(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === pageId);
  });

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  const titles = {
    dashboard: "Dashboard",
    games: "Spiele",
    profiles: "Profile",
    settings: "Einstellungen"
  };

  document.getElementById("page-title").textContent =
    titles[pageId] || "AFK Hub";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openProfileModal(gameId = games[0].id, profile = null) {
  editingId = profile ? profile.id : null;

  document.getElementById("modal-title").textContent =
    profile ? "Profil bearbeiten" : "Neues Profil";

  document.getElementById("profile-name").value =
    profile ? profile.name : "";

  document.getElementById("profile-game").value =
    profile ? profile.gameId : gameId;

  document.getElementById("profile-action").value =
    profile ? profile.action : "click";

  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("profile-name").focus();
}

function closeProfileModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("profile-form").reset();
  editingId = null;
}

function toggleDemo(profileId) {
  const profile = profiles.find(item => item.id === profileId);
  if (!profile) return;

  if (activeSessions.has(profileId)) {
    activeSessions.delete(profileId);
    showToast(`Demo für "${profile.name}" gestoppt.`);
  } else {
    activeSessions.add(profileId);
    sessionsStarted++;
    showToast(`Demo für "${profile.name}" gestartet.`);
  }

  renderProfiles();
  updateStats();
}

document.addEventListener("click", event => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.page) {
    showPage(target.dataset.page);
  }

  if (target.dataset.goto) {
    showPage(target.dataset.goto);
  }

  if (target.dataset.createFor) {
    openProfileModal(target.dataset.createFor);
  }

  if (target.dataset.run) {
    toggleDemo(target.dataset.run);
  }

  if (target.dataset.edit) {
    const profile = profiles.find(item => item.id === target.dataset.edit);
    if (profile) openProfileModal(profile.gameId, profile);
  }

  if (target.dataset.delete) {
    const profile = profiles.find(item => item.id === target.dataset.delete);
    if (!profile) return;

    if (confirm(`Profil "${profile.name}" wirklich löschen?`)) {
      profiles = profiles.filter(item => item.id !== profile.id);
      activeSessions.delete(profile.id);
      saveProfiles();
      showToast("Profil gelöscht.");
    }
  }
});

document.getElementById("new-profile").addEventListener("click", () => {
  openProfileModal();
});

document.getElementById("empty-create").addEventListener("click", () => {
  openProfileModal();
});

document.getElementById("modal-close").addEventListener("click", closeProfileModal);

document.getElementById("modal").addEventListener("click", event => {
  if (event.target.id === "modal") closeProfileModal();
});

document.getElementById("profile-form").addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("profile-name").value.trim();
  const gameId = document.getElementById("profile-game").value;
  const action = document.getElementById("profile-action").value;

  if (!name) {
    showToast("Bitte gib einen Profilnamen ein.");
    return;
  }

  if (editingId) {
    const profile = profiles.find(item => item.id === editingId);
    if (profile) {
      profile.name = name;
      profile.gameId = gameId;
      profile.action = action;
    }
    showToast("Profil aktualisiert.");
  } else {
    profiles.push({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      gameId,
      action,
      createdAt: new Date().toISOString()
    });
    showToast("Profil erstellt.");
  }

  saveProfiles();
  closeProfileModal();
  showPage("profiles");
});

document.getElementById("export-data").addEventListener("click", () => {
  const file = new Blob(
    [JSON.stringify({ profiles }, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "afk-hub-data.json";
  link.click();
  URL.revokeObjectURL(url);

  showToast("Export wurde erstellt.");
});

document.getElementById("reset-data").addEventListener("click", () => {
  if (!confirm("Alle gespeicherten Profile wirklich löschen?")) return;

  profiles = [];
  activeSessions.clear();
  localStorage.removeItem(STORAGE_KEY);
  saveProfiles();
  showToast("Lokale Daten wurden zurückgesetzt.");
});

renderGames();
renderProfiles();
updateStats();
showPage("dashboard");
