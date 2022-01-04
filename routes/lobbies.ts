import express from "express";
import { ObjectId } from "mongodb";

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
    let lobbies = await db
        .collection("lobbies")
        .find({ _id: ObjectId(req.params.id) })
        .toArray();
    res.json(lobbies[0] || []);
});

router.put("/:id/players", async (req, res) => {
    let db = req.app.get("db");
    let lobby = (
        await db
            .collection("lobbies")
            .find({ _id: ObjectId(req.params.id) })
            .toArray()
    )[0];

    let playerMatch = lobby.players.find((item) => item.id === req.body.id);
    if (playerMatch) {
        // Update existing player status
        playerMatch.status = req.body.status;
        playerMatch.avatar = req.body.avatar;
        playerMatch.color = req.body.color;
    } else {
        // Add new player to the array
        lobby.players.push(req.body);
    }
    let result = await db
        .collection("lobbies")
        .updateOne({ _id: ObjectId(req.params.id) }, { $set: { players: lobby.players } });

    res.json({ updatedId: lobby._id || null });
});

router.post("/", async (req, res) => {
    let data = req.body;
    let db = req.app.get("db");

    // Ensure our tag is unique
    let match = [0];
    let tag: string = _generateTag();
    while (match.length > 0) {
        tag = _generateTag();
        match = await db.collection("lobbies").find({ tag: tag }).toArray();
    }

    let response = await db.collection("lobbies").insertOne({
        dateCreated: new Date(),
        createdById: data.createdById,
        players: data.players,
        gameSettings: data.gameSettings,
        mapName: data.mapName,
        tag: tag,
    });
    res.json({ insertedId: response.insertedId || null });
});

export default router;
