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
    const statusText = document.getElementById("status-text");
    const serverTimeDisplay = document.getElementById("server-time");
    const afkLevelDisplay = document.getElementById("afkLevel");
    const upgradeClickLevelDisplay = document.getElementById("upgradeClickLevel");
    const autoClickerLevelDisplay = document.getElementById("autoClickerLevel");
    const tempBoostStatus = document.getElementById("tempBoostStatus");
    const tempBoostButton = document.getElementById("tempBoostButton");
    const tempBoostTimer = document.getElementById("tempBoostTimer");

    // Assurez-vous que les éléments nécessaires existent avant de poursuivre
    if (!tempBoostButton || !scoreDisplay || !investBtn || !playerCountDisplay) {
      console.error("Certains éléments DOM sont manquants !");
      return;
    }

    let lastPing = Date.now();
    let serverStartTime = null;

    let tempBoostCooldown = false;
    let tempBoostActive = false;

    console.log("Tentative de connexion socket...");

    socket.on("connect", () => {
      console.log("✅ Connecté, ID socket :", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Erreur de connexion socket :", err);
    });

    investBtn.addEventListener("click", () => {
      socket.emit("click");
    });

    tempBoostButton.addEventListener("click", () => {
      socket.emit("buyTempBoost");
    });

    socket.on("scoreUpdate", (score) => {
      scoreDisplay.textContent = score;
    });

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

    socket.on("afkLevel", (level) => {
      afkLevelDisplay.textContent = `Niveau AFK: ${level}`;
    });

    socket.on("upgradeClickLevel", (level) => {
      upgradeClickLevelDisplay.textContent = `Niveau Upgrade Click: ${level}`;
    });

    socket.on("autoClickerLevel", (level) => {
      autoClickerLevelDisplay.textContent = `Niveau AutoClicker: ${level}`;
    });

    socket.on("tempBoostActive", (isActive) => {
      tempBoostActive = isActive;
      if (tempBoostActive) {
        tempBoostButton.disabled = true;
        startCountdown(30);
        tempBoostStatus.textContent = "Boost Temporaire Activé !";
        tempBoostStatus.style.color = "lime";
      } else {
        tempBoostButton.disabled = false;
        tempBoostStatus.textContent = "Boost Temporaire Inactif";
        tempBoostStatus.style.color = "red";
      }
    });

    socket.on("tempBoostCooldown", (isCooldown) => {
      tempBoostCooldown = isCooldown;
      if (tempBoostCooldown) {
        tempBoostButton.disabled = true;
        tempBoostStatus.textContent = "Boost Temporaire en cooldown...";
        tempBoostStatus.style.color = "orange";
        startCountdown(60);
      } else {
        tempBoostButton.disabled = false;
        tempBoostStatus.textContent = "Boost Temporaire Inactif";
        tempBoostStatus.style.color = "red";
      }
    });

    socket.on("heartbeat", (msg) => {
      console.log("📡 Heartbeat reçu :", msg);
      lastPing = Date.now();
      if (statusText) {
        statusText.textContent = "Actif";
        statusText.style.color = "lime";
      }
    });

    socket.on("serverStartTime", (startTime) => {
      serverStartTime = startTime;
    });

    setInterval(() => {
      const now = Date.now();
      if (now - lastPing > 10000) {
        if (statusText) {
          statusText.textContent = "En veille";
          statusText.style.color = "red";
        }
      }
    }, 5000);

    function formatTime(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const months = Math.floor(days / 30);
      const years = Math.floor(months / 12);

      let timeString = `En ligne depuis `;

      if (years > 0) timeString += `${years} an${years > 1 ? 's' : ''} `;
      if (months > 0) timeString += `${months % 12} mois `;
      if (days > 0) timeString += `${days % 30} jour${days > 1 ? 's' : ''} `;
      if (hours > 0) timeString += `${hours % 24} heure${hours > 1 ? 's' : ''} `;
      if (minutes > 0) timeString += `${minutes % 60} minute${minutes > 1 ? 's' : ''} `;
      timeString += `${seconds % 60} seconde${seconds > 1 ? 's' : ''}`;

      return timeString;
    }

    setInterval(() => {
      if (serverStartTime) {
        const timeElapsed = Date.now() - serverStartTime;
        if (serverTimeDisplay) {
          serverTimeDisplay.textContent = formatTime(timeElapsed);
        }
      }
    }, 1000);

    function startCountdown(seconds) {
      let remainingTime = seconds;
      tempBoostTimer.textContent = `Temps restant: ${remainingTime}s`;

      const countdownInterval = setInterval(() => {
        remainingTime--;
        tempBoostTimer.textContent = `Temps restant: ${remainingTime}s`;

        if (remainingTime <= 0) {
          clearInterval(countdownInterval);
          tempBoostTimer.textContent = '';
        }
      }, 1000);
    }
  }
});
