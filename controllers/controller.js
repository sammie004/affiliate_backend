const { generateToken } = require("../jwt/jwt");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../connection/connection");

const signup = (req, res) => {
  const { full_name, password, username, commission_plan } = req.body;

  // ref can arrive from redirect (?ref=code) or body (referral_code/referred_by)
  const incomingRef =
    req.query.ref ||
    req.body.referral_code ||
    req.body.referred_by ||
    null;

  if (!full_name || !password || !username || !commission_plan) {
    return res.status(400).json({ message: "Fullname, username, password, and commission_plan are required" });
  }

  const checkUser = 'SELECT id FROM users WHERE username = ?';
  db.query(checkUser, [username], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    if (rows.length > 0) return res.status(400).json({ message: "Username already exists" });

    const hashed = bcrypt.hashSync(password, 10);
    const referralCode = crypto.randomBytes(5).toString("hex");
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const referralLink = `${baseUrl}/ref/${username}/${referralCode}`;

    // If there’s a ref code, verify it belongs to someone
    if (incomingRef) {
      const findRef = 'SELECT id FROM users WHERE referral_code = ?';
      db.query(findRef, [incomingRef], (e2, refRows) => {
        if (e2) return res.status(500).json({ message: "Database error", error: e2 });

        const referredBy = refRows.length ? incomingRef : null;

        insertUser({ referredBy });
      });
    } else {
      insertUser({ referredBy: null });
    }

    function insertUser({ referredBy }) {
      const insert = `
        INSERT INTO users (full_name, username, password, commission_plan, referral_code, referral_link, referred_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        insert,
        [full_name, username, hashed, commission_plan, referralCode, referralLink, referredBy],
        (e3, result) => {
          if (e3) return res.status(500).json({ message: "Database error", error: e3 });

          const token = generateToken({ id: result.insertId, username });
          return res.status(201).json({
            message: "User created successfully",
            token,
            referralCode:referralCode,
            referral_link: referralLink
          });
        }
      );
    }
  });
};
 
const login = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const check_query = `SELECT * FROM users WHERE username = ?`;
    db.query(check_query, [username], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (result.length === 0) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const user = result[0];
        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const token = generateToken({ id: user.id, username: user.username });
        res.status(200).json({ message: "Login successful", token, referralCode: user.referral_code, referral_link: user.referral_link });
    });
};

module.exports = { signup, login };
