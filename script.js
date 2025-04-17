document.addEventListener('DOMContentLoaded', function () {
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
    const serverTimeDisplay = document.getElementById("server-time"); // Pour l'affichage du temps du serveur

    let lastPing = Date.now(); // Pour détecter l’inactivité du serveur
    let serverStartTime = null; // Temps de démarrage du serveur récupéré depuis le backend

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

    // Récupère le temps de démarrage du serveur
    socket.on("serverStartTime", (startTime) => {
      serverStartTime = startTime; // Enregistre le temps de démarrage du serveur
    });

    // Vérifie toutes les 5s si le serveur est toujours là
    setInterval(() => {
      const now = Date.now();
      if (now - lastPing > 10000) {
        if (statusText) {
          statusText.textContent = "En veille";
          statusText.style.color = "red";
        }
      }
    }, 5000);

    // Fonction pour formater le temps écoulé
    function formatTime(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const months = Math.floor(days / 30); // approximation
      const years = Math.floor(months / 12); // approximation

      let timeString = `En ligne depuis `;

      if (years > 0) timeString += `${years} an${years > 1 ? 's' : ''} `;
      if (months > 0) timeString += `${months % 12} mois `;
      if (days > 0) timeString += `${days % 30} jour${days > 1 ? 's' : ''} `;
      if (hours > 0) timeString += `${hours % 24} heure${hours > 1 ? 's' : ''} `;
      if (minutes > 0) timeString += `${minutes % 60} minute${minutes > 1 ? 's' : ''} `;
      timeString += `${seconds % 60} seconde${seconds > 1 ? 's' : ''}`;

      return timeString;
    }

    // Mise à jour du temps passé en ligne
    setInterval(() => {
      if (serverStartTime) {
        const timeElapsed = Date.now() - serverStartTime;
        console.log(`Temps écoulé en ms : ${timeElapsed}`); // Log pour vérifier la différence
        if (serverTimeDisplay) {
          serverTimeDisplay.textContent = formatTime(timeElapsed);
        }
      }
    }, 1000); // Actualisation toutes les secondes
  }
});
