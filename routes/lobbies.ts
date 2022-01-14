import { Lobby, LobbyValidator, Player, PlayerValidator } from "./../model/lobby";
import express from "express";
import { ObjectId } from "mongodb";
import { PlayerStatus } from "../model/enums";
import initializeGame from "../stateManagement/gameStateFactory";

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

// Create a new game lobby
router.post("/", async (req, res) => {
    let data: Lobby = req.body;
    let db = req.app.get("db");

    // Validate the incoming account post request
    var result = LobbyValidator.validate(data);
    if (result.error) {
        res.status(400).send(result.error.details?.[0].message ?? "Lobby validation failed");
        return;
    }

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

// Update existing or add new player
router.put("/:id/players", async (req, res) => {
    let db = req.app.get("db");
    let lobby: Lobby = (
        await db
            .collection("lobbies")
            .find({ _id: ObjectId(req.params.id) })
            .toArray()
    )[0];
    if (!lobby) return res.status(404).send(`Lobby ID ${req.params.id} not found`);

    // Validate the incoming account post request
    let player: Player = req.body;
    let result = PlayerValidator.validate(player);
    if (result.error) {
        res.status(400).send(result.error.details?.[0].message ?? "Player validation failed");
        return;
    }

    let playerMatch = lobby.players.find((item: Player) => item.accountId === player.accountId);
    if (playerMatch) {
        // Update existing player status
        playerMatch.status = player.status;
        playerMatch.avatar = player.avatar;
        playerMatch.color = player.color;
        playerMatch.alive = player.alive;
    } else {
        // Add new player to the array
        lobby.players.push(player);
    }
    result = await db
        .collection("lobbies")
        .updateOne({ _id: ObjectId(req.params.id) }, { $set: { players: lobby.players } });

    // Check if this update means the game is ready to launch
    const waitingPlayers = lobby.players.filter((p) => p.status === PlayerStatus.Waiting);
    if (waitingPlayers.length === 0 && lobby.players.length >= 2) {
        var insertedId = await initializeGame(db, lobby);
        console.log("initialized game", insertedId);
    }

    res.json({ updatedId: lobby._id || null });
});

// Remove player from lobby
router.delete("/:id/players/:playerId", async (req, res) => {
    let db = req.app.get("db");
    let lobby = (
        await db
            .collection("lobbies")
            .find({ _id: ObjectId(req.params.id) })
            .toArray()
    )[0];
    if (!lobby) return res.status(404).send(`Lobby ID ${req.params.id} not found`);

    let player = lobby.players.find((item: Player) => item.accountId === req.params.playerId);
    if (!player) return res.status(404).send(`Player ID ${req.params.playerId} not found`);

    lobby.players.splice(lobby.players.indexOf(player), 1);

    let result = await db
        .collection("lobbies")
        .updateOne({ _id: ObjectId(req.params.id) }, { $set: { players: lobby.players } });
    res.json({ updatedId: lobby._id || null });
});

export default router;
