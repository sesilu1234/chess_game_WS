import express from 'express';
import mysql from 'mysql2';
import cors from 'cors'; // Import the cors middleware

const app = express();
const port = 3310;

// Use the cors middleware
app.use(cors());

// Use express.json() to parse JSON bodies
app.use(express.json());

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'database-1.cnw6moiseb92.eu-north-1.rds.amazonaws.com',
  user: 'sesilu1234',
  password: 'Emilborel1234',
  database: 'chess_game_1'
});

// Connect to the database
connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database');
});

// Serve static files (HTML, CSS, JavaScript) from the 'public' directory
app.use(express.static('public'));













app.get('/game_moves', (req, res) => {
  const { id, turn_to_look } = req.query;

  const query = 'SELECT * FROM game_moves WHERE id = ? AND turn = ?';

  connection.query(query, [id, turn_to_look], (err, results) => {
      if (err) {
          return res.status(500).send('Database query failed');
      }
     
      
        
          res.json(results); // Send only the first result object
      
  });
});

  
  


  
app.post('/game_moves', (req, res) => {
  const {id, player, moveA, moveB, turn, pawn_promotion, castling} = req.body;
  const now = new Date();
  const isoString = now.toISOString();
  const time = isoString.replace('T', ' ').substring(0, 19);
  const query = 'INSERT INTO game_moves (id, player, moveA, moveB, time, turn, pawn_promotion, castling) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  
  connection.query(query, [id, player, moveA, moveB, time, turn, pawn_promotion, castling], (err, results) => {
    if (err) {
      res.status(500).send('Failed to insert data');
      return;
    }
    res.status(201).send('Data inserted successfully');
  });
});


















/* //EL CREADOR 

app.get('/create_game', (req, res) => {
  const { id } = req.query;

  console.log(id);
  const query = 'SELECT game_started FROM created_games WHERE id = ?';

  connection.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).send('Database query failed');
    }

    res.json(results); // Send only the first result object
  });
}); */




//CREAR GAME

app.post('/create_game', (req, res) => {
  const { id, player1, color1, player2, color2 } = req.body; // Get id, player1, and player2 from the request body
  const now = new Date();
  const isoString = now.toISOString();
  const time = isoString.replace('T', ' ').substring(0, 19);
 console.log(req.body);
 
  // Prepare the SQL query
  const query = 'INSERT INTO created_games (id, player1, color1, player2, color2, date_of_connection) VALUES (?, ?, ?, ?, ?, ?)';
  
  // Execute the SQL query
  connection.query(query, [id, player1, color1, player2, color2, time], (err, results) => {
    if (err) {
      res.status(500).send('Failed to insert data');
      return;
    }
    res.status(201).send('Data inserted successfully');
  });
});










//EL 2 JUGADOR SE UNE A LA PARTIDA


app.get('/check_created', (req, res) => {
  const { id } = req.query;

  console.log(id);
  const checkQuery = 'SELECT CASE WHEN EXISTS (SELECT 1 FROM created_games WHERE id = ?) THEN 1 ELSE 0 END AS result';

  connection.query(checkQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).send('Database query failed');
    }

    const gameExists = results[0].result;

    if (gameExists === 1) {
      // Update game_started to 1
      const updateQuery = 'UPDATE created_games SET game_started = 1 WHERE id = ?';
      connection.query(updateQuery, [id], (updateErr) => {
        if (updateErr) {
          return res.status(500).send('Failed to update game status');
        }

        // Now, fetch player1 and player2
        const fetchPlayersQuery = 'SELECT player1, color1, player2, color2 FROM created_games WHERE id = ?';
        connection.query(fetchPlayersQuery, [id], (fetchErr, playerResults) => {
          if (fetchErr) {
            return res.status(500).send('Failed to fetch player details');
          }

          res.json(playerResults[0]); // Send the player1 and player2 details
        });
      });
    } else {
      return res.status(404).send('No game created with such ID');
    }
  });
});













// EL CREADOR COMPRUEBA REITERADAMENTE SI SE HA UNIDO UN JUGADOR

app.get('/check_joined', (req, res) => {


  


  const { id } = req.query;

  // Validate id to ensure it is a number (or the expected type)
  const checkQuery = 'SELECT game_started FROM created_games WHERE id = ?';

  connection.query(checkQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).send('Database query failed');
    }

    // Ensure results exist and check the value of game_started
    if (results.length > 0) {

      if (results[0].game_started === 1)
      console.log(results);
      res.json({ game_started: results[0].game_started }); // Return only the relevant data
    } else {
      res.status(404).send('Game not found'); // Handle case where no results are found
    }
  });
});



















app.listen(port, () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
