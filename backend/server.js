const express = require("express");
const cors = require("cors");
const session = require("express-session")

const app = express();

app.use(cors());

app.get("/", (req, res) => {
    res.send("Backend working");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});