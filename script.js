// script.js - 簡單的 Canvas 忍者遊戲
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width; const H = canvas.height;

  // HUD
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const statusEl = document.getElementById('status');

  // Game state
  let keys = {};
  let score = 0;
  let lives = 3;
  let gameOver = false;

  // Player
  const player = {
    x: 80, y: H - 80, w: 36, h: 48,
    vx: 0, vy: 0, speed: 3.2, jump: -10, grounded: false,
    color: '#0b3b1f'
  };

  // Gravity & ground
  const gravity = 0.5;
  const groundY = H - 40;

  // Shuriken (thrown projectiles)
  const shurikens = [];
  const enemies = [];

  // Utility
  function rectsOverlap(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Input
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if(e.key === 'r' || e.key === 'R') reset();
    // prevent page scrolling on space
    if(e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Throw shuriken
  function throwShuriken(){
    if(gameOver) return;
    const dir = keys['ArrowLeft'] ? -1 : 1;
    shurikens.push({x: player.x + player.w/2, y: player.y + 8, vx: dir * 8, vy: 0, w:12, h:12, life: 120});
  }

  // Spawn enemies periodically
  let enemyTimer = 0;
  function spawnEnemy(){
    const fromRight = Math.random() > 0.5;
    const y = groundY - 36;
    const w = 36, h = 36;
    const x = fromRight ? W - 60 : 60;
    const vx = fromRight ? -1.6 - Math.random() * 1.6 : 1.6 + Math.random() * 1.6;
    enemies.push({x,y,w,h,vx,color:'#8b0000'});
  }

  // Reset
  function reset(){
    score = 0; lives = 3; gameOver = false; shurikens.length = 0; enemies.length = 0; player.x = 80; player.y = H - 80; player.vx = player.vy = 0; statusEl.textContent = '';
  }

  // Update loop
  function update(){
    if(gameOver) return;

    // Controls
    player.vx = 0;
    if(keys['ArrowLeft']) player.vx = -player.speed;
    if(keys['ArrowRight']) player.vx = player.speed;
    if((keys['ArrowUp'] || keys['w'] || keys['W']) && player.grounded){ player.vy = player.jump; player.grounded = false; }
    if(keys[' ']){ // space
      // simple debounce: use a timestamp on player
      if(!player._lastThrow || performance.now() - player._lastThrow > 300){ throwShuriken(); player._lastThrow = performance.now(); }
    }

    // Physics
    player.x += player.vx;
    player.vy += gravity;
    player.y += player.vy;

    // Ground collision
    if(player.y + player.h > groundY){ player.y = groundY - player.h; player.vy = 0; player.grounded = true; }

    // Keep inside canvas
    player.x = Math.max(8, Math.min(W - player.w - 8, player.x));

    // Update shurikens
    for(let i = shurikens.length - 1; i >= 0; i--){
      const s = shurikens[i];
      s.x += s.vx; s.y += s.vy; s.life--;
      if(s.x < -20 || s.x > W + 20 || s.life <= 0) shurikens.splice(i,1);
    }

    // Spawn enemies
    enemyTimer += 1;
    if(enemyTimer > 90){ spawnEnemy(); enemyTimer = 0; }

    // Update enemies
    for(let i = enemies.length - 1; i >= 0; i--){
      const e = enemies[i];
      e.x += e.vx;
      // bounce at edges
      if(e.x < 10){ e.x = 10; e.vx *= -1; }
      if(e.x + e.w > W - 10){ e.x = W - 10 - e.w; e.vx *= -1; }

      // collision with player
      if(rectsOverlap(player, e)){
        // lose life and respawn enemy
        lives -= 1;
        enemies.splice(i,1);
        if(lives <= 0){ gameOver = true; statusEl.textContent = '遊戲結束 - 按 R 重新開始'; }
      }

      // collision with shuriken
      for(let j = shurikens.length -1; j >= 0; j--){
        if(rectsOverlap(shurikens[j], e)){
          // remove both
          shurikens.splice(j,1);
          enemies.splice(i,1);
          score += 10;
          break;
        }
      }
    }

    // Update HUD
    scoreEl.textContent = '得分: ' + score;
    livesEl.textContent = '生命: ' + lives;
  }

  // Draw loop
  function draw(){
    // background
    ctx.clearRect(0,0,W,H);
    // sky gradient
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#aeddff'); g.addColorStop(1,'#7fb3ff');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // ground
    ctx.fillStyle = '#2e2f31';
    ctx.fillRect(0, groundY, W, H - groundY);
    // platform line
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.strokeRect(0, groundY, W, H - groundY);

    // player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // simple head
    ctx.fillStyle = '#f4d1b0';
    ctx.fillRect(player.x + 6, player.y + 4, 24, 12);

    // shurikens
    for(const s of shurikens){
      ctx.save(); ctx.translate(s.x + s.w/2, s.y + s.h/2);
      ctx.rotate(performance.now()/200);
      ctx.fillStyle = '#222';
      ctx.fillRect(-s.w/2, -s.h/2, s.w, s.h);
      ctx.restore();
    }

    // enemies
    for(const e of enemies){
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x, e.y, e.w, e.h);
      // eyes
      ctx.fillStyle = '#fff'; ctx.fillRect(e.x + 6, e.y + 8, 6, 6); ctx.fillRect(e.x + 22, e.y + 8, 6, 6);
      ctx.fillStyle = '#000'; ctx.fillRect(e.x + 8, e.y + 10, 2, 2); ctx.fillRect(e.x + 24, e.y + 10, 2, 2);
    }

    // score text
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(8,8,150,30);
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText('得分: ' + score, 16, 28);
  }

  // Main loop
  function loop(){ update(); draw(); if(!gameOver) requestAnimationFrame(loop); }

  // Start
  reset(); loop();

  // expose a small API
  window.__game = { throwShuriken: throwShuriken };
})();
