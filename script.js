// Empêcher l'exécution multiple du script
if (window.hasRunAlyclick) {
  console.log("🔁 Script déjà chargé, annulation...");
} else {
  window.hasRunAlyclick = true;

  // Connexion au serveur Glitch avec transport WebSocket forcé
  const socket = io("https://alyclick.glitch.me", {
    transports: ["websocket"]
  });

  // DOM Elements
  const scoreDisplay = document.getElementById("score");
  const investBtn = document.getElementById("invest");
  const playerCountDisplay = document.getElementById("playerCount");
  const statusText = document.getElementById("status-text"); // Pour l'état du serveur

  let lastPing = Date.now(); // Pour détecter l’inactivité du serveur

  console.log("Tentative de connexion socket...");

  socket.on("connect", () => {
    console.log("✅ Connecté, ID socket :", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Erreur de connexion socket :", err);
  });

  // Quand un joueur clique sur "Investir"
  investBtn.addEventListener("click", () => {
    socket.emit("click");
  });

  // Mise à jour du score
  socket.on("scoreUpdate", (score) => {
    scoreDisplay.textContent = score;

    // Petite anim
    scoreDisplay.classList.add("animated");
    setTimeout(() => {
      scoreDisplay.classList.remove("animated");
    }, 300);
  });

  // Mise à jour du nombre de joueurs connectés
  socket.on("playerCount", (count) => {
    playerCountDisplay.textContent = count;

    const container = document.getElementById("players");
    if (container) {
      container.classList.add("animated");
      setTimeout(() => {
        container.classList.remove("animated");
      }, 300);
    } else {
      console.error("L'élément #players est introuvable !");
    }
  });

  // Heartbeat toutes les minutes = serveur actif
  socket.on("heartbeat", (msg) => {
    console.log("📡 Heartbeat reçu :", msg);
    lastPing = Date.now();
    if (statusText) {
      statusText.textContent = "Actif";
      statusText.style.color = "lime";
    }
  });

  // Vérifie toutes les 5s si le serveur est toujours là
  setInterval(() => {
    const now = Date.now();
    if (now - lastPing > 70000) {
      if (statusText) {
        statusText.textContent = "En veille";
        statusText.style.color = "red";
      }
    }
  }, 5000);
}
