const WebSocket = require('ws');
const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
  host: 'database-1.cnw6moiseb92.eu-north-1.rds.amazonaws.com',
  user: 'sesilu1234',
  password: 'Emilborel1234',
  database: 'chess_game_1',
  waitForConnections: true,
  connectionLimit: 10, // Limit number of connections in the pool
  queueLimit: 0
});

// Promisify the pool for async/await support
const promisePool = pool.promise();

const wss = new WebSocket.Server({ port: 8080 });


let games = [];           // Store ongoing games
let clients = [];         // Store all connected clients

wss.on('connection', (ws) => {
  // Add the new client to the clients list
  clients.push(ws);
  console.log('Client connected. Total clients:', clients.length);

  

    
 

  // Handle messages (moves)
  ws.on('message', async (data) => {
    try {
        const message = JSON.parse(data); 
        const payload = message.payload;// Assuming the data is in JSON format
        
        switch (message.type) {
            
            case 'create_game':



           
            const now = new Date();
            const isoString = now.toISOString();
            const time = isoString.replace('T', ' ').substring(0, 19);
           
           
            
                // Handle action1
                const sql = 'INSERT INTO games ((id, player1, color1, player2, color2, date_of_connection) VALUES (?, ?, ?, ?, ?, ?)';

                try {
                    const [rows] = await promisePool.query(sql, [message.id, message.player1, message.color1, message.player2, message.color2, time]);
                    console.log('Game inserted successfully with ID:', rows.id);
                } catch (error) {
                    console.error('Error inserting game:', error);
                }
        
                games.push({id: message.id, player1: message.player1, color1: message.color1, player2: message.player2, color2: message.color2  });
                clients.push({id: message.id, player1: ws, player2: undefined});

                break;

            case 'join_game':
                // Handle action2
                
                const game = games.find(games => games.id == payload.id)
                

                if (game) {
                    
                    const client = clients.find(client => client.id == payload.id);

                    client.player2 = ws;
                    
                    sendJSON1 = {id: game.id, player1: game.player1, color1: game.color1, player2: game.player2, color2: game.color2, round: 1}

                    sendJSON2 = {id: game.id, player1: game.player2, color1: game.color2, player2: game.player1, color2: game.color1, round: 2}

                    client.player1.send(JSON.stringify({ type: 'start_game', payload: sendJSON1 }));

                    client.player2.send(JSON.stringify({ type: 'start_game', payload: sendJSON2 }));


                    }
                    




                
                else {
                    
                    ws.send(JSON.stringify({ type: 'message', message: 'No such game found.' }));
            
            
            }




                break;

            case 'move':

            const otherPlayer = clients.find(client => client.id == message.id)

            sendJSON = {id: payload.id, moveA: payload.moveA, moveB: payload.moveB, turn: payload.turn, pawn_promotion: payload.pawn_promotion, castling: payload.castling}

                
            if (otherPlayer.player1 === ws) {otherPlayer.player1.send(JSON.stringify({ type:'move', sendJSON }));}

            else {otherPlayer.player2.send(JSON.stringify({ type: 'move', sendJSON }));}

                break;

            
            
            
            
                default:
                console.log('Unknown action:', message.type);
                break;
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
});

 
 
 
 
 
 
 
 
 
 
 
 
 
 
  ws.on('close', () => {
    // Handle player disconnection
    const game = games.find(g => g.players.includes(ws));
    if (game) {
      // Notify the remaining player that their opponent disconnected
      const otherPlayer = game.players.find(player => player !== ws);
      if (otherPlayer) {
        otherPlayer.send(JSON.stringify({ type: 'message', message: 'Your opponent has disconnected. You win!' }));
      }


      games = games.filter(g => g !== game);
    }

    // Remove the client from the clients list
    clients = clients.filter(client => client !== ws);
    console.log('Client disconnected. Total clients:', clients.length);

    // If the disconnected player was waiting, clear waitingPlayer
    if (waitingPlayer === ws) {
      waitingPlayer = null;
    }
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
