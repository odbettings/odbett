// === app.js ===
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const userSection = document.getElementById('user-section');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

const darkModeToggle = document.getElementById('dark-mode-toggle');

let currentUser = null;
let currentRole = null;
let currentPassword = null;

darkModeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark', darkModeToggle.checked);
});

loginBtn.addEventListener('click', async () => {
  loginError.textContent = '';
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    loginError.textContent = 'Please enter username and password';
    return;
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      loginError.textContent = err.error || 'Login failed';
      return;
    }
    const data = await res.json();
    currentUser = username;
    currentPassword = password;
    currentRole = data.role;

    loginSection.classList.add('hidden');
    if (currentRole === 'admin') {
      adminSection.classList.remove('hidden');
      loadAdminGames();
    } else {
      userSection.classList.remove('hidden');
      loadUserData();
      loadGamesForBetting();
    }
  } catch (err) {
    loginError.textContent = 'Network error';
    console.error(err);
  }
});

// Logout buttons
document.getElementById('logout-admin-btn').addEventListener('click', logout);
document.getElementById('logout-user-btn').addEventListener('click', logout);

function logout() {
  currentUser = null;
  currentRole = null;
  currentPassword = null;

  loginSection.classList.remove('hidden');
  adminSection.classList.add('hidden');
  userSection.classList.add('hidden');

  usernameInput.value = '';
  passwordInput.value = '';
  loginError.textContent = '';
}

// -------- ADMIN SECTION --------

document.getElementById('create-user-btn').addEventListener('click', async () => {
  const newUsername = document.getElementById('new-user').value.trim();
  const newPassword = document.getElementById('new-user-pass').value.trim();
  const msg = document.getElementById('create-user-msg');
  msg.textContent = '';

  if (!newUsername || !newPassword) {
    msg.textContent = 'Fill both fields';
    return;
  }

  try {
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser,
        password: currentPassword,
        newUsername,
        newPassword,
      }),
    });
    const data = await res.json();
    msg.textContent = res.ok ? 'User created' : data.error || 'Error creating user';
    if (res.ok) {
      document.getElementById('new-user').value = '';
      document.getElementById('new-user-pass').value = '';
    }
  } catch {
    msg.textContent = 'Network error';
  }
});

document.getElementById('delete-user-btn').addEventListener('click', async () => {
  const usernameToDelete = document.getElementById('del-user').value.trim();
  const msg = document.getElementById('delete-user-msg');
  msg.textContent = '';

  if (!usernameToDelete) {
    msg.textContent = 'Enter username';
    return;
  }

  try {
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser,
        password: currentPassword,
        usernameToDelete,
      }),
    });
    const data = await res.json();
    msg.textContent = res.ok ? 'User deleted' : data.error || 'Error deleting user';
    if (res.ok) document.getElementById('del-user').value = '';
  } catch {
    msg.textContent = 'Network error';
  }
});

document.getElementById('adjust-points-btn').addEventListener('click', async () => {
  const username = document.getElementById('points-user').value.trim();
  const amountStr = document.getElementById('points-amount').value.trim();
  const msg = document.getElementById('adjust-points-msg');
  msg.textContent = '';

  if (!username || amountStr === '') {
    msg.textContent = 'Fill all fields';
    return;
  }

  const amount = Number(amountStr);
  if (isNaN(amount)) {
    msg.textContent = 'Amount must be a number';
    return;
  }

  try {
    const res = await fetch('/api/admin/adjust-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser,
        password: currentPassword,
        usernameToAdjust: username, // FIXED KEY
        amount,
      }),
    });
    const data = await res.json();
    msg.textContent = res.ok
      ? `Points updated. New points: ${data.newPoints}`
      : data.error || 'Error adjusting points';
    if (res.ok) {
      document.getElementById('points-user').value = '';
      document.getElementById('points-amount').value = '';
    }
  } catch {
    msg.textContent = 'Network error';
  }
});

document.getElementById('add-game-btn').addEventListener('click', async () => {
  const matchName = document.getElementById('match-name').value.trim();
  const team1 = document.getElementById('team1').value.trim();
  const team2 = document.getElementById('team2').value.trim();
  const oddsTeam1 = document.getElementById('odds-team1').value.trim();
  const oddsTeam2 = document.getElementById('odds-team2').value.trim();
  const oddsDraw = document.getElementById('odds-draw').value.trim();
  const msg = document.getElementById('add-game-msg');
  msg.textContent = '';

  if (!matchName || !team1 || !team2 || !oddsTeam1 || !oddsTeam2 || !oddsDraw) {
    msg.textContent = 'Fill all fields';
    return;
  }

  try {
    const res = await fetch('/api/admin/add-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser,
        password: currentPassword,
        matchName,
        team1,
        team2,
        oddsTeam1,
        oddsTeam2,
        oddsDraw,
      }),
    });
    const data = await res.json();
    msg.textContent = res.ok ? 'Game added' : data.error || 'Error adding game';
    if (res.ok) {
      clearGameForm();
      loadAdminGames();
    }
  } catch {
    msg.textContent = 'Network error';
  }
});

function clearGameForm() {
  document.getElementById('match-name').value = '';
  document.getElementById('team1').value = '';
  document.getElementById('team2').value = '';
  document.getElementById('odds-team1').value = '';
  document.getElementById('odds-team2').value = '';
  document.getElementById('odds-draw').value = '';
}

async function loadAdminGames() {
  try {
    const res = await fetch('/api/games');
    const data = await res.json();
    const gameSelect = document.getElementById('game-select');
    gameSelect.innerHTML = '';
    data.games.forEach(game => {
      const option = document.createElement('option');
      option.value = game.id;
      option.textContent = `${game.matchName} (${game.team1} vs ${game.team2}) - Outcome: ${game.outcome === null ? 'Pending' : game.outcome}`;
      gameSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to load games', err);
  }
}

document.getElementById('set-outcome-btn').addEventListener('click', async () => {
  const gameId = document.getElementById('game-select').value;
  const outcome = document.getElementById('outcome-select').value;
  const msg = document.getElementById('set-outcome-msg');
  msg.textContent = '';

  if (!gameId) {
    msg.textContent = 'Select a game';
    return;
  }

  try {
    const res = await fetch('/api/admin/set-outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser,
        password: currentPassword,
        gameId,
        outcome,
      }),
    });
    const data = await res.json();
    msg.textContent = res.ok ? 'Outcome set' : data.error || 'Error setting outcome';
    if (res.ok) loadAdminGames();
  } catch {
    msg.textContent = 'Network error';
  }
});

document.getElementById('view-bets-btn').addEventListener('click', async () => {
  const pre = document.getElementById('users-bets');
  pre.textContent = 'Loading...';

  try {
    const res = await fetch('/api/admin/user-bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser,
        password: currentPassword,
      }),
    });
    const data = await res.json();
    pre.textContent = res.ok ? JSON.stringify(data.usersBets, null, 2) : data.error || 'Error fetching bets';
  } catch {
    pre.textContent = 'Network error';
  }
});

// --- USER SECTION ---

async function loadUserData() {
  try {
    const res = await fetch('/api/user/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser, password: currentPassword }),
    });
    const data = await res.json();
    document.getElementById('user-points').textContent = res.ok ? data.points : 'N/A';
  } catch {
    document.getElementById('user-points').textContent = 'Error';
  }
}

async function loadGamesForBetting() {
  const container = document.getElementById('games-container');
  container.innerHTML = 'Loading games...';

  try {
    const res = await fetch('/api/games');
    const data = await res.json();
    if (res.ok || res.status === 200) {
      container.innerHTML = '';
      data.games.forEach(game => {
        if (game.outcome === null) {
          const div = document.createElement('div');
          div.className = 'game-item';
          div.innerHTML = `
            <strong>${game.matchName}</strong> (${game.team1} vs ${game.team2})<br>
            Odds: ${game.team1} = ${game.oddsTeam1}, Draw = ${game.oddsDraw}, ${game.team2} = ${game.oddsTeam2}<br>
            <label>Bet on: 
              <select class="bet-select" data-gameid="${game.id}">
                <option value="">--Select--</option>
                <option value="team1">${game.team1}</option>
                <option value="draw">Draw</option>
                <option value="team2">${game.team2}</option>
              </select>
            </label>
            <label>Points: <input type="number" min="1" max="1000" class="bet-points" data-gameid="${game.id}"></label>
            <button class="place-bet-btn" data-gameid="${game.id}">Place Bet</button>
            <div class="bet-msg" id="bet-msg-${game.id}"></div>
          `;
          container.appendChild(div);
        }
      });

      container.querySelectorAll('.place-bet-btn').forEach(btn => {
        btn.addEventListener('click', placeBetHandler);
      });
    } else {
      container.textContent = 'Failed to load games';
    }
  } catch {
    container.textContent = 'Network error';
  }
}

async function placeBetHandler(e) {
  const gameId = e.target.getAttribute('data-gameid');
  const select = document.querySelector(`.bet-select[data-gameid="${gameId}"]`);
  const pointsInput = document.querySelector(`.bet-points[data-gameid="${gameId}"]`);
  const msgDiv = document.getElementById(`bet-msg-${gameId}`);

  msgDiv.textContent = '';

  const choice = select.value;
  const amount = Number(pointsInput.value);

  if (!choice) {
    msgDiv.textContent = 'Select a bet option';
    return;
  }
  if (!amount || amount <= 0) {
    msgDiv.textContent = 'Enter valid points';
    return;
  }

  try {
    const res = await fetch('/api/user/place-bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser,
        password: currentPassword,
        gameId,
        choice,
        amount,
      }),
    });
    const data = await res.json();
    msgDiv.textContent = res.ok ? 'Bet placed successfully' : data.error || 'Failed to place bet';
    if (res.ok) {
      pointsInput.value = '';
      select.value = '';
      loadUserData();
    }
  } catch {
    msgDiv.textContent = 'Network error';
  }
}
