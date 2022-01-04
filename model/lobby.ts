import { ObjectId } from "mongodb";
import { PlayerStatus, NationColor } from "./enums";

export interface Lobby {
    _id: ObjectId;
    dateCreated: Date;
    createdById: ObjectId;
    players: Player[];
    gameSettings: {};
    mapName: string;
    tag: string;
}

export interface Player {
    _id: ObjectId;
    accountId: ObjectId;
    status: PlayerStatus;
    avatar?: string;
    username?: string;
    color?: NationColor;
}

export interface Account {
    _id: ObjectId;
    username: string;
    gameHistory: GameOutcome[];
    lobbies: Lobby[];
    elo: number;
    lastLogin: Date;
}

export interface GameOutcome {
    _id: ObjectId;
    mapName: string;
    players: Player[];
    gameSettings: {};
}
