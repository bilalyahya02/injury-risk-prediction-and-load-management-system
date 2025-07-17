const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, jwtSecret);
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
