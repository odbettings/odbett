// /api/login.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (username === 'Odi01' && password === 'Odi01') {
    return res.status(200).json({ role: 'admin' });
  }
  
  // For demonstration, treat any other username/password as regular user
  if (username && password) {
    return res.status(200).json({ role: 'user' });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
}
