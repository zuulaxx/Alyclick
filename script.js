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

  // Debug : voir si on est bien connecté
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

  // Mise à jour du score en temps réel
  socket.on("scoreUpdate", (score) => {
    scoreDisplay.textContent = score;

    // Petite animation de feedback
    scoreDisplay.classList.add("animated");
    setTimeout(() => {
      scoreDisplay.classList.remove("animated");
    }, 300);
  });

  // Mise à jour du nombre de joueurs connectés
  socket.on("playerCount", (count) => {
    playerCountDisplay.textContent = count;

    const container = document.getElementById("players");

    // Vérifie si l'élément existe avant de manipuler sa classList
    if (container) {
      // Ajout d'une animation à chaque changement
      container.classList.add("animated");
      setTimeout(() => {
        container.classList.remove("animated");
      }, 300);
    } else {
      console.error("L'élément #players est introuvable !");
    }
  });
}
