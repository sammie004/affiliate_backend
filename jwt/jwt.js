const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null; // Token invalid or expired
  }
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]; // Authorization: Bearer <token>
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Unauthorized - Invalid token" });
        }

        req.user = decoded; // ✅ decoded contains { id: userId, username, ... }
        next();
    });
};
module.exports = { generateToken, verifyToken, authenticateToken };
