const express = require("express");
const ObjectId = require("mongodb").ObjectID;

const router = express.Router();

router.get("/", async (req, res) => {
    let db = req.app.get("db");
    let accounts = await db.collection("accounts").find().toArray();
    res.json(accounts);
});

router.get("/:id", async (req, res) => {
    let db = req.app.get("db");
    console.log(req.params.id);
    let accounts = await db
        .collection("accounts")
        .find({ _id: ObjectId(req.params.id) })
        .toArray();
    res.json(accounts[0] || []);
});

router.post("/", async (req, res) => {
    let data = req.body;
    let db = req.app.get("db");

    let match = await db.collection("accounts").find({ username: data.username }).toArray();
    if (match.length > 0) {
        res.status(400).send(`Username '${data.username}' already exists`);
    } else {
        let response = await db.collection("accounts").insertOne({
            username: data.username,
            gameHistory: [],
            lobbies: [],
            games: [],
            elo: 1000,
            lastLogin: new Date(),
        });
        res.json({ insertedId: response.insertedId || null });
    }
});

module.exports = router;