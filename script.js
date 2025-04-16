const socket = io("https://alyclick.glitch.me");

const scoreDisplay = document.getElementById("score");
const clickBtn = document.getElementById("clickBtn");
const playerCountDisplay = document.getElementById("playerCount");

clickBtn.addEventListener("click", () => {
  socket.emit("click");
});

socket.on("scoreUpdate", (score) => {
  scoreDisplay.textContent = score;
});

socket.on("playerCount", (count) => {
  playerCountDisplay.textContent = count;

  const container = document.getElementById("players");
  container.classList.add("animated");

  setTimeout(() => {
    container.classList.remove("animated");
  }, 300);
});
