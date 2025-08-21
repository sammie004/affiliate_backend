const { generateToken } = require("../jwt/jwt");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../connection/connection");


// authentication of token

// ---------- Signup ----------
const signup = (req, res) => {
    const { full_name, password, username, commission_plan } = req.body;

    const incomingRef = req.query.ref || req.body.referral_code || req.body.referred_by || null;

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
        const referralLink = `${baseUrl}/api/signup?ref=${referralCode}`;

        if (incomingRef) {
            const findRef = 'SELECT id FROM users WHERE referral_code = ?';
            db.query(findRef, [incomingRef], (e2, refRows) => {
                if (e2) return res.status(500).json({ message: "Database error", error: e2 });

                if (refRows.length) {
                    const referrerId = refRows[0].id;
                    insertUser({ referredBy: incomingRef, referrerId });
                } else {
                    insertUser({ referredBy: null });
                }
            });
        } else {
            insertUser({ referredBy: null });
        }

        function insertUser({ referredBy, referrerId }) {
            const insert = `
                INSERT INTO users (full_name, username, password, commission_plan, referral_code, referral_link, referred_by, click_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            `;
            db.query(
                insert,
                [full_name, username, hashed, commission_plan, referralCode, referralLink, referredBy],
                (e3, result) => {
                    if (e3) return res.status(500).json({ message: "Database error", error: e3 });

                    // Increment click_count for the referrer
                    if (referrerId) {
                        db.query(`UPDATE users SET click_count = click_count + 1 WHERE id = ?`, [referrerId]);
                    }

                    const token = generateToken({ id: result.insertId, username });
                    return res.status(201).json({
                        message: "User created successfully",
                        token,
                        referralCode,
                        referral_link: referralLink
                    });
                }
            );
        }
    });
};
// ---------- Login ----------
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
        res.status(200).json({
            message: "Login successful",
            token,
            referralCode: user.referral_code,
            referral_link: user.referral_link,
            click_count: user.click_count,
            user_id: user.id
        });
    });
};

// ------------admin login route--------
const adminSignUp = (req, res) => {
    const {username,password} = req.body
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }
    const check_query = `select * from admin where username = ?`
    db.query(check_query, [username], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (result.length > 0) {
            return res.status(400).json({ message: "Username already exists" });
        }
        const hashed = bcrypt.hashSync(password, 10);
        const insert_query = `insert into admin (username,password) values (?,?)`
        db.query(insert_query, [username, hashed], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database error", error: err });
            }
            res.status(201).json({ message: "Admin created successfully" });
        })
    })

}
// -----------Admin route to handle admin login----------
const adminLogin = (req,res) =>{
    const {username,password} = req.body
    if(!username||!password){
        return res.status(400).json({ message: "Username and password are required" });
    }
    const check_query = `select * from admin where username = ?`
    db.query(check_query,[username],(err,results)=>{
        if(err){
            return res.status(500).json({ message: "Database error", error: err });
        }
        if(results.length === 0){
            return res.status(400).json({ message: "Invalid username or password" });
        }
        const admin = results[0];
        const isPasswordValid = bcrypt.compareSync(password, admin.password);
        if(!isPasswordValid){
            return res.status(400).json({ message: "Invalid username or password" });
        }
        const token = generateToken({ id: admin.id, username: admin.username });
        res.status(200).json({
            message: "Login successful",
            token
        });
    })
}
// -----------Admin route to fetch all the users ---------------
const admin = (req,res)=>{
    const query = `select * from users`
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.status(200).json({ users: results });
    })
}

// -----------route for users to request withdrawal--------------
const RequestWithdrawal = (req,res) => {
    const {amount} = req.body
    const userId = req.user.id; // Assuming user ID is stored in req.user after authentication
    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
    }
    const query = `INSERT INTO withdrawals (user_id, amount) VALUES (?, ?)`;
    db.query(query, [userId, amount], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.status(201).json({ message: "Withdrawal request created successfully", withdrawalId: result.insertId });
    });
}
// -----------route to handle viewing of all withdrawal requests by admin--------------
const GetAllWithdrawals = (req, res) => {
    const query = `SELECT w.*, u.username, u.full_name 
                   FROM withdrawals w 
                   JOIN users u ON w.user_id = u.id 
                   ORDER BY w.requested_at DESC`;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        res.status(200).json({ withdrawals: results });
    });
};
// ----------route to handle approval of requests by an admin--------------
const ApproveWithdrawal = (req, res) => {
    const { withdrawal_id } = req.params;
    const query = `UPDATE withdrawals SET status = 'approved' WHERE withdrawal_id = ?`;
    
    db.query(query, [withdrawal_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Withdrawal request not found" });
        
        res.status(200).json({ message: "Withdrawal request approved successfully" });
    });
}
// ----------route to handle rejection of requests by an admin--------------
const RejectWithdrawal = (req, res) => {
    const { withdrawal_id } = req.params;
    const query = `UPDATE withdrawals SET status = 'rejected' WHERE withdrawal_id = ?`;
    
    db.query(query, [withdrawal_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Withdrawal request not found" });
        
        res.status(200).json({ message: "Withdrawal request rejected successfully" });
    });
}

// -------------route to handle removal of users-----------------
const removeUser = (req,res) =>{
    const {id} = req.params
    const check_query = `
    set foreign_key_checks = 0;
    delete from users where id = ?;
    set foreign_key_checks = 1;
    `
    db.query(check_query,[id],(err,results)=>{
        if(err){
            console.log(`an error occurred`,err)
            return res.status(500).json({message:`internal server error`})
        }
        if(results.length === 0){
            console.log(`this user does not exist in the database`)
            return res.status(404).json({message:`this user does not exist`})
        }
        else{
            const del_query = `delete from users where id = ?`
            db.query(del_query,[id],(err,results)=>{
                if(err){
                    console.log(`an error occurred while trying to delete user,\nPlease try again`)
                }else{
                    console.log(`user has been deleted successfully`,results)
                    return res.status(200).json({message:`user deleted successfully`})
                }
            })
        }
    })
}
module.exports = { signup, login, admin,RequestWithdrawal,GetAllWithdrawals,ApproveWithdrawal,RejectWithdrawal,adminSignUp,adminLogin,removeUser };
