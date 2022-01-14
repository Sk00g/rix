import { CommandSet, GameState, GenerateCommandSetValidator } from "./../model/gameplay";
import { ObjectId } from "mongodb";
import express from "express";
import { formatDatetime } from "../public/src/sengine/utils";
import { executeNextTurn } from "../stateManagement/gameExecutor";

const router = express.Router();

// GET specific game state
router.get("/:id", async (req, res) => {
    let db = req.app.get("db");
    let gameState = await db.collection("gameStates").findOne({ _id: ObjectId(req.params.id) });
    if (!gameState) return res.status(404).send(`GameState ID ${req.params.id} not found`);
    res.json(gameState);
});

// GET simple game state to see if the next round has been executed
router.get("/:id/ping", async (req, res) => {
    let db = req.app.get("db");
    let gameState: GameState = await db.collection("gameStates").findOne({ _id: ObjectId(req.params.id) });

    let values = {
        currentRound: gameState.turnHistory.length + 1,
        submissions: gameState.players.map((player) => {
            const sentTime = gameState.pendingCommandSets?.[player.username]?.submittedAt;
            return { [player.username]: sentTime ?? null };
        }),
    };

    res.json(values);
});

// PUT turn deployments and commands
router.put("/:id/commands", async (req, res) => {
    let db = req.app.get("db");

    let gameState: GameState = await db.collection("gameStates").findOne({ _id: ObjectId(req.params.id) });
    if (!gameState) return res.status(404).send(`GameState ID ${req.params.id} not found`);

    let data: CommandSet = req.body;

    // Validate the incoming request body
    var result = GenerateCommandSetValidator(gameState).validate(data);
    if (result.error) {
        res.status(400).send(result.error.details?.[0].message ?? "CommandSet validation failed");
        return;
    }

    if (data.username in gameState.pendingCommandSets)
        return res.status(400).send(`GameState already has this rounds command set for ${data.username}`);

    gameState.pendingCommandSets[data.username] = {
        submittedAt: formatDatetime(new Date()),
        deployments: data.deployments,
        commands: data.commands,
    };

    result = await db
        .collection("gameStates")
        .updateOne({ _id: ObjectId(req.params.id) }, { $set: { pendingCommandSets: gameState.pendingCommandSets } });

    // Execute turn if all players' command sets have been submitted
    if (Object.keys(gameState.pendingCommandSets).length === gameState.players.length)
        await executeNextTurn(db, gameState);

    res.json({ updatedId: gameState._id || null });
});

router.get("/:id/test", async (req, res) => {
    let db = req.app.get("db");

    let gameState: GameState = await db.collection("gameStates").findOne({ _id: ObjectId(req.params.id) });
    if (!gameState) return res.status(404).send(`GameState ID ${req.params.id} not found`);

    // Execute turn if all players' command sets have been submitted
    if (Object.keys(gameState.pendingCommandSets).length === gameState.players.length)
        await executeNextTurn(db, gameState);

    res.json({ updatedId: gameState._id || null });
});

export default router;
