



// Dependencies
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql2/promise');

// Setup Express and WebSocket server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Database connection setup
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'chess'
});

// WebSocket connections
let games = {};

// Create a game (Player 1)
app.post('/createGame', async (req, res) => {
    const gameId = generateGameId(); // Generate unique game ID
    const player1 = req.body.player1; // Player 1's name or ID

    try {
        await db.query('INSERT INTO games (game_id, player1, status) VALUES (?, ?, ?)', [gameId, player1, 'waiting']);
        res.status(200).send({ gameId });
    } catch (error) {
        res.status(500).send('Error creating game');
    }
});

// Join a game (Player 2)
app.post('/joinGame', async (req, res) => {
    const { gameId, player2 } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM games WHERE game_id = ? AND status = "waiting"', [gameId]);
        
        if (rows.length > 0) {
            await db.query('UPDATE games SET player2 = ?, status = "started" WHERE game_id = ?', [player2, gameId]);

            if (games[gameId]) {
                games[gameId].player2 = player2;
                games[gameId].player1Socket.send(JSON.stringify({ type: 'playerJoined', message: `Player 2 (${player2}) has joined the game.` }));
            }

            res.status(200).send({ message: 'Game joined successfully' });
        } else {
            res.status(404).send('Game not found or already started');
        }
    } catch (error) {
        res.status(500).send('Error joining game');
    }
});

// WebSocket logic
wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        if (data.type === 'createGame') {
            games[data.gameId] = { player1Socket: ws, player2Socket: null };
        } else if (data.type === 'joinGame') {
            if (games[data.gameId]) {
                games[data.gameId].player2Socket = ws;
                games[data.gameId].player1Socket.send(JSON.stringify({ type: 'playerJoined', message: `Player 2 has joined.` }));
            }
        } else if (data.type === 'move') {
            const { gameId, from, to } = data;

            if (games[gameId]) {
                const targetSocket = data.fromPlayer === 'player1' ? games[gameId].player2Socket : games[gameId].player1Socket;
                if (targetSocket) {
                    targetSocket.send(JSON.stringify({ type: 'move', from, to }));
                }
            }
        }
    });

    ws.on('close', () => {
        // Handle socket closing if necessary
    });
});

// Helper function to generate unique game ID
function generateGameId() {
    return Math.random().toString(36).substring(2, 9);
}

// Start the server
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
