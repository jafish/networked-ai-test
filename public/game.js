// Connect to server
const socket = io();

// Game constants
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;

// Game state
let myId = null;
let players = {};
let inputs = {
  up: false,
  down: false,
  left: false,
  right: false
};

// p5.js setup
function setup() {
  const canvas = createCanvas(WORLD_WIDTH, WORLD_HEIGHT);
  canvas.parent('gameCanvas');
  frameRate(60);
}

// p5.js draw loop
function draw() {
  background(40, 40, 50);

  // Draw grid
  stroke(60, 60, 70);
  strokeWeight(1);
  for (let x = 0; x < WORLD_WIDTH; x += 50) {
    line(x, 0, x, WORLD_HEIGHT);
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 50) {
    line(0, y, WORLD_WIDTH, y);
  }

  // Draw walls
  noStroke();
  fill(80, 80, 90);
  rect(0, 0, WORLD_WIDTH, 10); // Top wall
  rect(0, WORLD_HEIGHT - 10, WORLD_WIDTH, 10); // Bottom wall
  rect(0, 0, 10, WORLD_HEIGHT); // Left wall
  rect(WORLD_WIDTH - 10, 0, 10, WORLD_HEIGHT); // Right wall

  // Draw all players
  Object.values(players).forEach(player => {
    // Draw player
    fill(player.color);
    noStroke();
    
    if (player.id === myId) {
      // Highlight own player with a glow
      fill(player.color);
      circle(player.x, player.y, player.radius * 2.5);
      fill(player.color);
    }
    
    circle(player.x, player.y, player.radius * 2);
    
    // Draw direction indicator
    stroke(255, 255, 255, 150);
    strokeWeight(2);
    const angle = player.angle || 0;
    const lineLength = player.radius + 10;
    line(
      player.x,
      player.y,
      player.x + cos(angle) * lineLength,
      player.y + sin(angle) * lineLength
    );

    // Draw player ID
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(player.id.substring(0, 4), player.x, player.y - player.radius - 15);
  });

  // Send input to server
  sendInput();
}

// Handle keyboard input
function keyPressed() {
  updateInput(keyCode, true);
  return false; // Prevent default behavior
}

function keyReleased() {
  updateInput(keyCode, false);
  return false; // Prevent default behavior
}

function updateInput(code, pressed) {
  // WASD keys
  if (code === 87 || code === UP_ARROW) inputs.up = pressed;
  if (code === 83 || code === DOWN_ARROW) inputs.down = pressed;
  if (code === 65 || code === LEFT_ARROW) inputs.left = pressed;
  if (code === 68 || code === RIGHT_ARROW) inputs.right = pressed;
}

function sendInput() {
  socket.emit('input', inputs);
}

// Socket.io event handlers
socket.on('init', (data) => {
  myId = data.id;
  document.getElementById('playerId').textContent = myId.substring(0, 8);
  
  // Initialize players
  data.players.forEach(player => {
    players[player.id] = player;
  });
  
  updatePlayerCount();
});

socket.on('playerJoined', (player) => {
  players[player.id] = player;
  updatePlayerCount();
  console.log('Player joined:', player.id);
});

socket.on('playerLeft', (playerId) => {
  delete players[playerId];
  updatePlayerCount();
  console.log('Player left:', playerId);
});

socket.on('gameState', (gameState) => {
  gameState.forEach(playerState => {
    if (players[playerState.id]) {
      players[playerState.id].x = playerState.x;
      players[playerState.id].y = playerState.y;
      players[playerState.id].angle = playerState.angle;
    }
  });
});

function updatePlayerCount() {
  document.getElementById('playerCount').textContent = Object.keys(players).length;
}
