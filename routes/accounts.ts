import { Account, AccountValidator } from "./../model/lobby";
import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
    let db = req.app.get("db");
    let accounts = await db.collection("accounts").find().toArray();
    res.json(accounts);
});

router.get("/byUsername", async (req, res) => {
    let db = req.app.get("db");
    let accounts = await db.collection("accounts").find({ username: req.query.username }).toArray();
    res.json(accounts[0] || null);
});

router.get("/:id", async (req, res) => {
    let db = req.app.get("db");

    let accounts = await db
        .collection("accounts")
        .find({ _id: ObjectId(req.params.id) })
        .toArray();
    res.json(accounts[0] || null);
});

router.put("/", async (req, res) => {
    let data: Account = req.body;

    // Validate the incoming account post request
    var result = AccountValidator.validate(data);
    if (result.error) {
        res.status(400).send(result.error.details?.[0].message ?? "Account validation failed");
        return;
    }

    let db = req.app.get("db");
    let response = await db.collection("accounts").updateOne({ _id: ObjectId(data._id) }, { $set: { elo: data.elo } });
    res.json({ updatedId: response.matchedCount ? data._id : null });
});

router.post("/", async (req, res) => {
    let data: Account = req.body;

    // Validate the incoming account post request
    var result = AccountValidator.validate(data);
    console.log(result);

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
            lastLogin: null,
        });
        res.json({ insertedId: response.insertedId || null });
    }
});

export default router;
