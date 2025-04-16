const socket = io("https://alyclick.glitch.me");

const scoreDisplay = document.getElementById("score");
const clickBtn = document.getElementById("clickBtn");

// Quand le bouton est cliqué, on envoie un "click" au serveur
clickBtn.addEventListener("click", () => {
  socket.emit("click");
});

// Quand le serveur envoie une mise à jour du score
socket.on("scoreUpdate", (score) => {
  scoreDisplay.textContent = score;
});
