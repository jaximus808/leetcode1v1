const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing from Authorization header' });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '1d' });
}

module.exports = { authenticateToken, generateToken };
