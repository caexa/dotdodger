window.onload = () => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  
  const player = {
    x: 180,
    y: 560,
    width: 40,
    height: 20,
    speed: 5,
    color: "white",
    dashCooldown: 0,
    hasShield: false,
  };
  
  let keys = {};
  let dots = [];
  let powerUps = [];
  let score = 0;
  let highScores = JSON.parse(localStorage.getItem("dotdodger_scores") || "[]");
  let gameOver = false;
  let paused = false;
  let spawnRate = 90;
  let frame = 0;
  let slowTime = 0;
  
  document.addEventListener("keydown", e => {
    keys[e.key] = true;
  
    if (e.key === "p") {
      paused = !paused;
      if (!paused) update();
    }
  
    if (e.key === " " && player.dashCooldown <= 0) {
      player.x += keys["ArrowLeft"] ? -80 : keys["ArrowRight"] ? 80 : 0;
      player.dashCooldown = 300;
    }
  
    if (gameOver && e.key === "Enter") restartGame();
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
  
  function drawCooldownBar() {
    if (player.dashCooldown > 0) {
      ctx.fillStyle = "gray";
      ctx.fillRect(300, 10, 80, 10);
      ctx.fillStyle = "cyan";
      ctx.fillRect(300, 10, 80 * (1 - player.dashCooldown / 300), 10);
      drawText("Dash", 300, 35, "12px");
    }
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
  
  function spawnPowerUp() {
    if (Math.random() < 0.05) {
      const types = ["shield", "score", "slow"];
      const type = types[Math.floor(Math.random() * types.length)];
      powerUps.push({
        x: Math.random() * 380,
        y: -10,
        radius: 8,
        type,
        speed: 2,
      });
    }
  }
  
  function update() {
    if (gameOver || paused) return;
  
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Background tint for Panic Mode
    if (score >= 50) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawText("PANIC MODE!", 140, 60, "20px", "orange");
    }
  
    // Movement
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += player.speed;
  
    // Cooldowns
    if (player.dashCooldown > 0) player.dashCooldown--;
    if (slowTime > 0) slowTime--;
  
    // Draw player
    drawRect(player);
  
    // PowerUps
    if (frame % 200 === 0) spawnPowerUp();
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle =
        p.type === "shield" ? "cyan" :
        p.type === "score" ? "gold" :
        p.type === "slow" ? "purple" : "white";
      ctx.fill();
  
      // Collision
      if (
        p.y + p.radius > player.y &&
        p.x > player.x &&
        p.x < player.x + player.width
      ) {
        if (p.type === "shield") player.hasShield = true;
        if (p.type === "score") score += 10;
        if (p.type === "slow") slowTime = 180;
        powerUps.splice(i, 1);
      }
  
      // Remove off-screen
      if (p.y > 600) powerUps.splice(i, 1);
    }
  
    // Dots
    if (frame % spawnRate === 0) spawnDot();
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      d.y += slowTime > 0 ? d.speed * 0.5 : d.speed;
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
        if (player.hasShield) {
          player.hasShield = false;
          dots.splice(i, 1);
          continue;
        }
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
    if (player.hasShield) drawText("Shield", 10, 50, "16px", "cyan");
    drawCooldownBar();
  
    if (!gameOver) requestAnimationFrame(update);
    else drawGameOver();
  }
  
  function drawGameOver() {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
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
    player.hasShield = false;
    dots = [];
    powerUps = [];
    score = 0;
    spawnRate = 90;
    frame = 0;
    gameOver = false;
    paused = false;
    player.dashCooldown = 0;
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
};
