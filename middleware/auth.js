const jwt = require('jsonwebtoken');
const { isTokenBlacklisted } = require('./tokenBlacklist');

module.exports = async function (req, res, next) {
  const token = req.header('Authorization');
  
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Check if the token is blacklisted
  const isBlacklisted = await isTokenBlacklisted(token);
  
  if (isBlacklisted) {
    return res.status(403).json({ msg: 'Token is invalid (logged out)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode token
    req.user = decoded;  // Attach user info (including role) to request
    next(); // Continue to the next middleware or route handler
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};