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
    const hostId = req.session.user.id

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

app.post("/joinevent", (req, res) => {
    const meeting_id = req.body.meeting_id
    const user_id = req.session.user.id
    const user_car_id = req.body.user_car_id

    db.run(
        "INSERT INTO joined_users (meeting_id, user_id, user_car_id) VALUES (?, ?, ?)",
        [meeting_id, user_id, user_car_id],
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

app.post("/addcar", (req, res) => {
    const brand = req.body.brand
    const model = req.body.model

    const user_id = req.session.user.id

    const license_plate = req.body.license_plate

    const horse_power = req.body.horse_power
    const top_speed = req.body.top_speed

    const kilometers = req.body.kilometers

    db.run(
        "INSERT INTO user_cars (brand, model, user_id, license_plate, horse_power, top_speed, kilometers) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [brand, model, user_id, license_plate, horse_power, top_speed, kilometers],
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

app.get("/joinedcars/:meetid", async (req, res) => {
    const meetid = req.params.meetid;

    const sql = `
        SELECT uc.*
        FROM joined_users ju
        JOIN user_cars uc
            ON ju.user_id = uc.user_id
        WHERE ju.meeting_id = ?
    `;

    db.query(sql, [meetid], (err, results) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.json(results);
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});