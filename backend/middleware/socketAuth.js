const jwt = require('jsonwebtoken');

const socketAuth = (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;
