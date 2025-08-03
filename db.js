// === db.js ===
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // If no database file, create a default one
      const defaultData = {
        users: {
          // Admin user is not stored here because admin is hardcoded in server.js
        },
        games: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { users: {}, games: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

module.exports = { readDB, writeDB };
