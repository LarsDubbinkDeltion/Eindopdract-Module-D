const express = require("express");
const cors = require("cors");
const session = require("express-session")
const bcrypt = require("bcrypt")
const sqlite3 = require("sqlite3")

const db = new sqlite3.Database("./data/database.db")

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(255) DEFAULT 'user'
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        datetime INTEGER NOT NULL,
        meet_name VARCHAR(255)
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS user_cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand VARCHAR(255),
        model VARCHAR(255),
        user_id INTEGER NOT NULL,
        license_plate VARCHAR(255) UNIQUE,
        horse_power INTEGER NOT NULL,
        top_speed INTEGER NOT NULL,
        kilometers INTEGER NOT NULL
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS joined_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_car_id INTEGER NOT NULL    
    )
`)

const app = express();

app.use(express.json())

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false
}))

app.use(cors());

app.get("/", (req, res) => {
    res.send("Backend working");
});

app.post("/register", async (req, res) => {
    const { email, username, password } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    db.run(
        "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
        [email, username, hashedPassword],
        (err) => {
            if (err) {
                console.log(err)

                res.json({
                    success: false
                })

                return
            }
            
            res.json({
                success: true
            })
        }
    )
})

app.post("/login", (req, res) => {
    const { username, password } = req.body

    db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, user) => {
            if (err) {
                res.json({ success: false })
                return
            }

            if (!user) {
                res.json({
                    success: false,
                    message: "User not found!"
                })

                return
            }

            const match = await bcrypt.compare(password, user.password)

            if (!match) {
                res.json({
                    success: false,
                    message: "Wrong username or password!"
                })

                return
            }

            req.session.user = {
                id: user.id,
                username: user.username
            }

            res.json({
                success: true,
                message: "Login successful"
            })
        }
    )
})

app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({
            success: true
        })
    })
})

app.post("/me", (req, res) => {
    if (!req.session.user) {
        res.json({
            loggedIn: false
        })
        return
    }

    res.json({
        loggedIn: true,
        user: req.session.user,
        userId: req.session.user.id
    })
})

app.post("/newmeet", (req, res) => {
    const meetName = req.body.meetName
    const hostId = req.body.hostId

    const lon = req.body.lon
    const lat = req.body.lat

    const datetime = req.body.datetime

    db.run(
        "INSERT INTO meetings (meet_name, datetime, longitude, latitude, admin_id) VALUES (?, ?, ?, ?, ?)",
        [meetName, datetime, lon, lat, hostId],
        (err) => {
            if (err) {
                console.log(err)
                
                res.json({
                    success: false
                })

                return
            }

            res.json({
                success: true
            })
        }
    )
})

app.get("/meets/:amount", (req, res) => {
    const amount = req.params.amount

    db.all(
        `
        SELECT
            meetings.*,
            COUNT(joined_users.id) AS joined_count
        FROM meetings
        LEFT JOIN joined_users
            ON meetings.id = joined_users.meeting_id
        GROUP BY meetings.id
        ORDER BY joined_count DESC
        LIMIT ?
        `,
        [amount],
        (err, rows) => {
            if (err) {
                console.log(err)

                res.status(500).json({
                    success: false
                })

                return
            }

            res.json({
                success: true,
                meetings: rows
            })
        }
    )
})

app.listen(3000, () => {
    console.log("Server running on port 3000");
});