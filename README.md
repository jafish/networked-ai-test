# Networked Multiplayer Game

A real-time networked multiplayer game with synchronized physics using Node.js, Socket.io, Matter.js, and p5.js.

## Features

- **Real-time multiplayer**: Multiple players can join and play simultaneously
- **Synchronized physics**: Server-authoritative physics using Matter.js
- **Smooth rendering**: Client-side rendering with p5.js
- **Player movement**: WASD or Arrow keys to move
- **Collision detection**: Physics-based collisions between players and walls

## Technologies Used

- **Backend**: Node.js with Express
- **Real-time communication**: Socket.io
- **Physics engine**: Matter.js (server-side)
- **Graphics**: p5.js (client-side)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Game

Start the server:
```bash
npm start
```

The server will start on port 3000. Open your browser and navigate to:
```
http://localhost:3000
```

To test multiplayer functionality, open multiple browser windows/tabs to the same URL.

## How to Play

- Use **WASD** or **Arrow Keys** to move your player
- Your player is highlighted with a glow effect
- Each player has a unique color
- Players can collide with each other and bounce off walls

## Architecture

### Server (`server.js`)
- Manages game state and physics simulation using Matter.js
- Handles player connections/disconnections via Socket.io
- Runs physics updates at 60 FPS
- Broadcasts game state to all connected clients

### Client (`public/game.js`)
- Renders the game using p5.js
- Captures player input
- Sends input to server
- Updates player positions based on server state

## Game Loop

1. Client sends input to server
2. Server applies forces to player physics bodies
3. Server updates Matter.js physics engine
4. Server broadcasts updated positions to all clients
5. Clients render the updated game state