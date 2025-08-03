const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const player = {
  x: 180,
  y: 560,
  width: 40,
  height: 20,
  speed: 5,
  color: "white",
};

let keys = {};
let dots = [];
let score = 0;
let highScores = JSON.parse(localStorage.getItem("dotdodger_scores") || "[]");
let gameOver = false;
let paused = false;
let spawnRate = 90;
let frame = 0;

// Controls
document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === "p") {
    paused = !paused;
    if (!paused) update();
  }

  if (gameOver && e.key === "Enter") {
    restartGame();
  }
});

document.addEventListener("keyup", e => keys[e.key] = false);

function drawRect({ x, y, width, height, color }) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawText(text, x, y, size = "20px", color = "white") {
  ctx.fillStyle = color;
  ctx.font = `${size} sans-serif`;
  ctx.fillText(text, x, y);
}

function spawnDot() {
  dots.push({
    x: Math.random() * 380,
    y: -10,
    radius: 10,
    speed: 2 + Math.random() * (score / 40),
    color: "red",
  });
}

function update() {
  if (gameOver || paused) return;

  frame++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move player
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += player.speed;

  // Draw player
  drawRect(player);

  // Spawn dots
  if (frame % spawnRate === 0) spawnDot();

  // Update dots
  for (let i = dots.length - 1; i >= 0; i--) {
    const d = dots[i];
    d.y += d.speed;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fillStyle = d.color;
    ctx.fill();

    // Collision
    if (
      d.y + d.radius > player.y &&
      d.x > player.x &&
      d.x < player.x + player.width
    ) {
      gameOver = true;
      saveScore(score);
    }

    if (d.y > 600) {
      dots.splice(i, 1);
      score++;
      if (score % 10 === 0 && spawnRate > 30) spawnRate -= 5;
    }
  }

  drawText(`Score: ${score}`, 10, 30);

  if (paused) {
    drawText("Paused", 160, 280, "30px", "yellow");
    drawText("Press P to Resume", 100, 320, "18px", "gray");
  }

  if (!gameOver) requestAnimationFrame(update);
  else drawGameOver();
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawText("Game Over", 130, 200, "32px");
  drawText(`Score: ${score}`, 160, 240, "24px");
  drawText("Press Enter to Play Again", 80, 280, "18px");
  drawText("Leaderboard:", 130, 320, "20px", "orange");

  const scores = getLeaderboard();
  scores.forEach((s, i) => {
    drawText(`${i + 1}. ${s}`, 150, 350 + i * 20, "16px");
  });
}

function restartGame() {
  player.x = 180;
  dots = [];
  score = 0;
  spawnRate = 90;
  frame = 0;
  gameOver = false;
  paused = false;
  update();
}

function saveScore(newScore) {
  highScores.push(newScore);
  highScores.sort((a, b) => b - a);
  highScores = highScores.slice(0, 5);
  localStorage.setItem("dotdodger_scores", JSON.stringify(highScores));
}

function getLeaderboard() {
  return highScores;
}

update();
