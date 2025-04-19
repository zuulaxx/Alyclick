const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const fs = require("fs");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// === CONFIG ===
const SCORE_FILE = ".data/score.json"; // Fichier contenant score et niveaux des améliorations

// === SCORE ET AMÉLIORATIONS ===
let score = 0;
let afkLevel = 0;
let upgradeClickLevel = 0;
let autoClickerLevel = 0;
let tempBoostActive = false;
let lastBoostTime = 0;

const serverStartTime = Date.now(); // Gardé uniquement en mémoire (pas stocké dans le fichier)

// Charger le score et les améliorations depuis le fichier
if (fs.existsSync(SCORE_FILE)) {
  try {
    const data = fs.readFileSync(SCORE_FILE);
    const json = JSON.parse(data);
    score = json.score || 0;
    afkLevel = json.afkLevel || 0;
    upgradeClickLevel = json.upgradeClickLevel || 0;
    autoClickerLevel = json.autoClickerLevel || 0;
    console.log("✅ Score et améliorations chargés");
  } catch (err) {
    console.error("⚠️ Erreur lecture", err);
  }
}

// Sauvegarder score et niveaux d'améliorations
function saveScore() {
  const data = {
    score,
    afkLevel,
    upgradeClickLevel,
    autoClickerLevel
  };

  fs.writeFile(SCORE_FILE, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("❌ Erreur sauvegarde score :", err);
    } else {
      console.log("💾 Score et améliorations sauvegardés :", score);
    }
  });
}

// === STATIC FILES ===
app.use(express.static("public"));

// === API POUR AFFICHER LE SCORE ===
app.get("/api/score", (req, res) => {
  res.json({ score, afkLevel, upgradeClickLevel, autoClickerLevel });
});

// === PING POUR GARDER EN VIE ===
app.get("/ping", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send("pong");
});

// === PING PROXY POUR CONTOURNER LE 403 ===
app.get("/proxy-ping", async (req, res) => {
  try {
    const response = await axios.get("https://alyclick.glitch.me/ping", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/plain",
      },
    });
    if (response.data.includes("pong")) {
      res.setHeader("Content-Type", "text/plain");
      res.status(200).send("pong");
    } else {
      res.status(500).send("Invalid response");
    }
  } catch (error) {
    console.error("❌ Erreur proxy:", error.message);
    res.status(500).send("Erreur proxy");
  }
});

// === SOCKET.IO ===
let playerCount = 0;

io.on("connection", (socket) => {
  console.log("👤 Nouveau joueur connecté");

  playerCount++;
  io.emit("playerCount", playerCount);
  socket.emit("scoreUpdate", score);
  socket.emit("serverStartTime", serverStartTime); // Toujours envoyé aux clients si besoin

  // Envoi des améliorations au joueur
  socket.emit("afkLevel", afkLevel);
  socket.emit("upgradeClickLevel", upgradeClickLevel);
  socket.emit("autoClickerLevel", autoClickerLevel);
  
  // Heartbeat initial
  socket.emit("heartbeat", "ok g");

  socket.on("click", () => {
    // Calcul du score avec les améliorations
    const pointsEarned = 1 + upgradeClickLevel; // Points par clic + amélioration Upgrade Click
    score += pointsEarned;
    io.emit("scoreUpdate", score);
    saveScore(); // Sauvegarde du score
  });

  // Augmenter les points avec AFK Boost
  setInterval(() => {
    if (afkLevel === 1) {
      score += 1; // AFK Level 1 : 1 point toutes les 5 secondes
    } else if (afkLevel === 2) {
      score += 1; // AFK Level 2 : 1 point toutes les 1 seconde
    } else if (afkLevel === 3) {
      score += 2; // AFK Level 3 : 2 points toutes les 1 seconde
    }
    io.emit("scoreUpdate", score);
    saveScore(); // Sauvegarde après chaque point gagné
  }, afkLevel === 1 ? 5000 : afkLevel === 2 ? 1000 : 500); // Temps entre les points (5s, 1s, 0.5s)

  // Gérer le boost temporaire
  if (tempBoostActive) {
    setTimeout(() => {
      tempBoostActive = false;
      console.log("🚫 Boost temporaire terminé");
    }, 30000); // Le boost dure 30s
  }

  socket.on("buyAfkBoost", () => {
    if (score >= 10) { // Exemple de coût
      score -= 10;
      afkLevel = 1;
      io.emit("scoreUpdate", score);
      io.emit("afkLevel", afkLevel);
      saveScore();
    }
  });

  socket.on("buyUpgradeClick", () => {
    if (score >= 15) { // Exemple de coût
      score -= 15;
      upgradeClickLevel = Math.min(upgradeClickLevel + 1, 3); // Limiter au level 3
      io.emit("scoreUpdate", score);
      io.emit("upgradeClickLevel", upgradeClickLevel);
      saveScore();
    }
  });

  socket.on("buyAutoClicker", () => {
    if (score >= 20) { // Exemple de coût
      score -= 20;
      autoClickerLevel = Math.min(autoClickerLevel + 1, 3); // Limiter au level 3
      io.emit("scoreUpdate", score);
      io.emit("autoClickerLevel", autoClickerLevel);
      saveScore();
    }
  });

  socket.on("buyTempBoost", () => {
    if (score >= 30 && !tempBoostActive) { // Exemple de coût
      score -= 30;
      tempBoostActive = true;
      io.emit("scoreUpdate", score);
      console.log("🚀 Boost temporaire activé");
    }
  });

  socket.on("disconnect", () => {
    playerCount--;
    io.emit("playerCount", playerCount);
    console.log("❌ Joueur déconnecté");
  });
});

// === BONUS DE SCORE ===
setInterval(() => {
  io.emit("heartbeat", "ok g");
  score++; // Bonus passif
  io.emit("scoreUpdate", score);
  saveScore();
  console.log("📡 Bonus de +1");
}, 10000); // 1 point toutes les 10 secondes

// === LANCEMENT DU SERVEUR ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
