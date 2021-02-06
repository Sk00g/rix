const express = require("express");
const ObjectId = require("mongodb").ObjectID;

const router = express.Router();

// Ex/ APC9
function _generateTag() {
    const tagLength = 4;
    const asciiMax = 90; // Z
    const asciiMin = 65; // A
    let tag = "";

    for (let i = 0; i < tagLength; i++)
        tag += String.fromCharCode(Math.floor(Math.random() * (asciiMax - asciiMin)) + asciiMin);

    return tag;
}

router.get("/", async (req, res) => {
    let db = req.app.get("db");
    let lobbies = await db.collection("lobbies").find().toArray();
    res.json(lobbies);
});

router.get("/:id", async (req, res) => {
    let db = req.app.get("db");
    console.log(req.params.id);
    let lobbies = await db
        .collection("lobbies")
        .find({ _id: ObjectId(req.params.id) })
        .toArray();
    res.json(lobbies[0] || []);
});

router.post("/", async (req, res) => {
    let data = req.body;
    let db = req.app.get("db");

    // Ensure our tag is unique
    let match = [0];
    let tag = null;
    while (match.length > 0) {
        tag = _generateTag();
        match = await db.collection("lobbies").find({ tag: tag }).toArray();
    }

    let response = await db.collection("lobbies").insertOne({
        dateCreated: new Date(),
        createdById: data.createdById,
        playerIds: [],
        gameSettings: data.gameSettings,
        mapName: data.mapName,
        tag: tag,
    });
    res.json({ insertedId: response.insertedId || null });
});

module.exports = router;
