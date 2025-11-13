const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Matter = require('matter-js');

// Serve static files
app.use(express.static('public'));

// Matter.js setup
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;

const engine = Engine.create();
const world = engine.world;
world.gravity.y = 0; // Top-down game, no gravity

// Game state
const players = {};
const PLAYER_RADIUS = 20;
const MOVE_SPEED = 5;
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;

// Create walls
const walls = [
  Bodies.rectangle(WORLD_WIDTH / 2, 0, WORLD_WIDTH, 20, { isStatic: true, label: 'wall' }),
  Bodies.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT, WORLD_WIDTH, 20, { isStatic: true, label: 'wall' }),
  Bodies.rectangle(0, WORLD_HEIGHT / 2, 20, WORLD_HEIGHT, { isStatic: true, label: 'wall' }),
  Bodies.rectangle(WORLD_WIDTH, WORLD_HEIGHT / 2, 20, WORLD_HEIGHT, { isStatic: true, label: 'wall' })
];

World.add(world, walls);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create new player
  const player = {
    id: socket.id,
    x: Math.random() * (WORLD_WIDTH - 100) + 50,
    y: Math.random() * (WORLD_HEIGHT - 100) + 50,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    radius: PLAYER_RADIUS,
    inputs: { up: false, down: false, left: false, right: false }
  };

  // Create physics body for player
  player.body = Bodies.circle(player.x, player.y, PLAYER_RADIUS, {
    friction: 0.1,
    frictionAir: 0.1,
    label: 'player',
    restitution: 0.8
  });
  World.add(world, player.body);

  players[socket.id] = player;

  // Send current players to new player
  socket.emit('init', {
    id: socket.id,
    players: Object.values(players).map(p => ({
      id: p.id,
      x: p.body.position.x,
      y: p.body.position.y,
      color: p.color,
      radius: p.radius
    }))
  });

  // Broadcast new player to all other players
  socket.broadcast.emit('playerJoined', {
    id: player.id,
    x: player.x,
    y: player.y,
    color: player.color,
    radius: player.radius
  });

  // Handle player input
  socket.on('input', (inputs) => {
    if (players[socket.id]) {
      players[socket.id].inputs = inputs;
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    if (players[socket.id]) {
      World.remove(world, players[socket.id].body);
      delete players[socket.id];
      io.emit('playerLeft', socket.id);
    }
  });
});

// Game loop - update physics and broadcast state
const FPS = 60;
const FRAME_TIME = 1000 / FPS;

setInterval(() => {
  // Apply forces based on player inputs
  Object.values(players).forEach(player => {
    const force = { x: 0, y: 0 };
    
    if (player.inputs.up) force.y -= MOVE_SPEED;
    if (player.inputs.down) force.y += MOVE_SPEED;
    if (player.inputs.left) force.x -= MOVE_SPEED;
    if (player.inputs.right) force.x += MOVE_SPEED;

    // Normalize diagonal movement
    if (force.x !== 0 && force.y !== 0) {
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      force.x = (force.x / magnitude) * MOVE_SPEED;
      force.y = (force.y / magnitude) * MOVE_SPEED;
    }

    Body.applyForce(player.body, player.body.position, {
      x: force.x * 0.001,
      y: force.y * 0.001
    });
  });

  // Update physics
  Engine.update(engine, FRAME_TIME);

  // Broadcast game state to all clients
  const gameState = Object.values(players).map(player => ({
    id: player.id,
    x: player.body.position.x,
    y: player.body.position.y,
    angle: player.body.angle,
    velocityX: player.body.velocity.x,
    velocityY: player.body.velocity.y
  }));

  io.emit('gameState', gameState);
}, FRAME_TIME);

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
