const { generateToken } = require("../jwt/jwt");
const bcrypt = require("bcrypt");
const db = require("../connection/connection");

const signup = (req,res) =>{
    const { fullname, password, username, commission_plan} = req.body
    if(!fullname || !password || !username || !commission_plan) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const check_query = 'select * from users where username = ?'
    db.query(check_query, [username], (err, result) => {
        if(err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if(result.length > 0) {
            return res.status(400).json({ message: "Username already exists" });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        const insert_query = 'insert into users (fullname, username, password, commission_plan) values (?, ?, ?, ?)';
        
        db.query(insert_query, [fullname, username, hashedPassword, commission_plan], (err, result) => {
            if(err) {
                return res.status(500).json({ message: "Database error", error: err });
            }
            const token = generateToken({ id: result.insertId, username });
            res.status(201).json({ message: "User created successfully", token });
        });
    });
}
const login = (req, res) => {
    const {username,password} = req.body
    if(!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }
    const check_query = `select * from users where username = ?`
    db.query(check_query, [username], (err, result) => {
        if(err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if(result.length === 0) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        
        const user = result[0];
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        
        if(!isPasswordValid) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        
        const token = generateToken({ id: user.id, username: user.username });
        res.status(200).json({ message: "Login successful", token });
    });
}
module.exports = { 
    signup,
    login
};