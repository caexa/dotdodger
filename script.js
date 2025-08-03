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
let gameOver = false;
let spawnRate = 90;
let frame = 0;

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function drawRect({ x, y, width, height, color }) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawText(text, x, y, size = "20px") {
  ctx.fillStyle = "white";
  ctx.font = `${size} sans-serif`;
  ctx.fillText(text, x, y);
}

function spawnDot() {
  dots.push({
    x: Math.random() * 360,
    y: -10,
    radius: 10,
    speed: 2 + Math.random() * score / 50,
    color: "red",
  });
}

function update() {
  if (gameOver) return;

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
    }

    // Remove off-screen
    if (d.y > 600) {
      dots.splice(i, 1);
      score++;
      if (score % 10 === 0 && spawnRate > 30) spawnRate -= 5;
    }
  }

  // Draw score
  drawText(`Score: ${score}`, 10, 30);

  if (!gameOver) requestAnimationFrame(update);
  else drawGameOver();
}

function drawGameOver() {
  drawText("Game Over", 140, 300, "32px");
  drawText("Click to Restart", 115, 340);
  canvas.addEventListener("click", restartGame, { once: true });
}

function restartGame() {
  player.x = 180;
  dots = [];
  score = 0;
  spawnRate = 90;
  frame = 0;
  gameOver = false;
  update();
}

update();
