import Region from "../public/src/gameData/region";
import { ObjectId } from "mongodb";
import { PlayerStatus, NationColor } from "./enums";
import joi from "joi";
import { GameState } from "./gameplay";

export interface Player {
    accountId: ObjectId;
    status: PlayerStatus;
    avatar: string;
    username: string;
    color: NationColor;
    alive: boolean;
    regions?: Region[]; // Used for game data by client, not stored or retrieved from db
}

export const PlayerValidator = joi.object({
    accountId: joi.any(),
    status: joi.allow(...Object.values(PlayerStatus).filter((v) => typeof v === "string")),
    avatar: joi.string(),
    username: joi.string(),
    color: joi.allow(...Object.values(NationColor).filter((v) => typeof v === "string")),
    alive: joi.bool(),
});

export interface Lobby {
    _id: ObjectId;
    dateCreated: Date;
    createdById: ObjectId;
    createdBy?: Account;
    players: Player[];
    gameSettings: any;
    mapName: string;
    tag: string;
}

export const LobbyValidator = joi.object({
    createdById: joi.any(),
    players: joi.array().items(PlayerValidator),
    gameSettings: joi.any(),
    mapName: joi.string(),
});

export interface Account {
    _id?: ObjectId;
    username: string;
    gameHistory: GameOutcome[];
    lobbies: Lobby[];
    games: GameState[];
    elo: number;
    lastLogin: Date;
}

export const AccountValidator = joi.object({
    username: joi.string().alphanum().min(3).max(20),
    gameHistory: joi.array().items(joi.object()),
    lobbies: joi.array().items(joi.object()),
    games: joi.array().items(joi.any()),
    elo: joi.number().min(0),
    lastLogin: joi.date(),
});

export interface GameOutcome {
    _id: ObjectId;
    mapName: string;
    playerNames: string[];
    playerPlacements: [string, number];
    gameSettings: any;
}
