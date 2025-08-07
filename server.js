const express = require('express');
const bodyParser = require('body-parser');
const { readDB, writeDB } = require('./db');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const ADMIN_USERNAME = 'Odi01';
const ADMIN_PASSWORD = 'Odi01';

function checkAdminAuth(req, res, next) {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ role: 'admin' });
  }

  if (db.users[username] && db.users[username].password === password) {
    return res.json({ role: 'user' });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/create-user', checkAdminAuth, (req, res) => {
  const { newUsername, newPassword } = req.body;
  const db = readDB();

  if (db.users[newUsername]) {
    return res.status(400).json({ error: 'User already exists' });
  }
  db.users[newUsername] = {
    password: newPassword,
    points: 0,
    bets: []
  };
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/admin/delete-user', checkAdminAuth, (req, res) => {
  const { usernameToDelete } = req.body;
  const db = readDB();

  if (!db.users[usernameToDelete]) {
    return res.status(400).json({ error: 'User not found' });
  }
  delete db.users[usernameToDelete];
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/admin/adjust-points', checkAdminAuth, (req, res) => {
  const { usernameToAdjust, amount } = req.body;
  const db = readDB();

  if (!db.users[usernameToAdjust]) {
    return res.status(400).json({ error: 'User not found' });
  }
  db.users[usernameToAdjust].points += amount;
  if (db.users[usernameToAdjust].points < 0) db.users[usernameToAdjust].points = 0;
  writeDB(db);
  res.json({ success: true, newPoints: db.users[usernameToAdjust].points });
});

app.post('/api/admin/add-game', checkAdminAuth, (req, res) => {
  const { matchName, team1, team2, oddsTeam1, oddsTeam2, oddsDraw } = req.body;
  const db = readDB();

  const newGame = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    matchName,
    team1,
    team2,
    outcome: null,
    outcomeSetAt: null
  };
  db.games.push(newGame);
  writeDB(db);
  res.json({ success: true, game: newGame });
});

app.post('/api/admin/set-outcome', checkAdminAuth, (req, res) => {
  const { gameId, outcome } = req.body;
  const db = readDB();

  const game = db.games.find(g => g.id === gameId);
  if (!game) return res.status(400).json({ error: 'Game not found' });

  if (!['team1', 'team2', 'draw'].includes(outcome)) {
    return res.status(400).json({ error: 'Invalid outcome' });
  }

  game.outcome = outcome;
  game.outcomeSetAt = new Date().toISOString(); // Set outcome timestamp

  for (const username in db.users) {
    const user = db.users[username];
    user.bets.forEach(bet => {
      if (bet.gameId === gameId && bet.status === 'pending') {
        if (bet.choice === outcome) {
          bet.status = 'won';
          bet.wonAmount = bet.amount * bet.odds;
          user.points += bet.wonAmount;
        } else {
          bet.status = 'lost';
          bet.wonAmount = 0;
        }
      }
    });
  }

  writeDB(db);
  res.json({ success: true });
});

app.post('/api/admin/user-bets', checkAdminAuth, (req, res) => {
  const db = readDB();
  res.json({ usersBets: db.users });
});

app.get('/api/games', (req, res) => {
  const db = readDB();
  res.json({ games: db.games });
});

app.post('/api/user/place-bet', (req, res) => {
  const { username, password, gameId, choice, amount } = req.body;
  const db = readDB();

  if (!db.users[username] || db.users[username].password !== password) {
    return res.status(401).json({ error: 'Invalid user credentials' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  const user = db.users[username];
  if (user.points < amount) {
    return res.status(400).json({ error: 'Not enough points' });
  }

  const game = db.games.find(g => g.id === gameId);
  if (!game) {
    return res.status(400).json({ error: 'Game not found' });
  }
  if (game.outcome !== null) {
    return res.status(400).json({ error: 'Betting closed for this game' });
  }

  let odds;
  if (choice === 'team1') odds = game.oddsTeam1;
  else if (choice === 'team2') odds = game.oddsTeam2;
  else if (choice === 'draw') odds = game.oddsDraw;
  else return res.status(400).json({ error: 'Invalid choice' });

  user.points -= amount;
  user.bets.push({
    gameId,
    choice,
    amount,
    odds,
    status: 'pending',
    wonAmount: 0,
    timestamp: new Date().toISOString()
  });
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/user/data', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();

  if (!db.users[username] || db.users[username].password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const user = db.users[username];
  res.json({
    points: user.points,
    bets: user.bets
  });
});

// Clean up games with outcome set more than 5 minutes ago
setInterval(() => {
  const db = readDB();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  const gamesToDelete = db.games.filter(game => {
    return game.outcome && game.outcomeSetAt &&
           now - new Date(game.outcomeSetAt).getTime() > fiveMinutes;
  });

  if (gamesToDelete.length > 0) {
    db.games = db.games.filter(game => !gamesToDelete.includes(game));
    writeDB(db);
    console.log(`[Cleanup] Deleted ${gamesToDelete.length} old games`);
  }
}, 60 * 1000); // Check every minute


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


