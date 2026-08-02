const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

/**
 * authenticate middleware
 *
 * Reads the JWT from the httpOnly cookie named "token",
 * verifies it, and attaches the decoded payload to req.user.
 * Returns 401 if the token is missing or invalid.
 */
const authenticate = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
};

module.exports = authenticate;
