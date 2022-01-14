import joi from "joi";
import { Player } from "./lobby";

export type MapState = { [regionName: string]: { owner: string; size: number } };

export interface PlayerDeployment {
    target: string; // Region name
    amount: number;
}

export interface PlayerCommand {
    origin: string; // Region name
    target: string; // Region name
    amount: number;
}

export interface CommandSet {
    username: string;
    deployments: PlayerDeployment[];
    commands: PlayerCommand[];
}

export const GenerateCommandSetValidator = (game: GameState) =>
    joi.object({
        username: joi.string(),
        deployments: joi.array().items(
            joi.object({
                target: joi.allow(...Object.keys(game.initialRegionState)),
                amount: joi.number().min(1),
            })
        ),
        commands: joi.array().items(
            joi.object({
                origin: joi.allow(...Object.keys(game.initialRegionState)),
                target: joi.allow(...Object.keys(game.initialRegionState)),
                amount: joi.number().min(1),
            })
        ),
    });

export interface GameStatePing {
    currentRound: number;
    submissions: [{ [player: string]: string }];
}

export interface GameState {
    _id?: string;
    lobbyId: string;
    dateStarted: string;
    mapName: string;
    players: Player[];
    turnHistory: GameRound[];
    initialRegionState: MapState;

    // Commands that have been posted from the client but not yet applied (ie. waiting for other players)
    pendingCommandSets: {
        [playerName: string]: { submittedAt: string; deployments: PlayerDeployment[]; commands: PlayerCommand[] };
    };
}

export interface CombatRoll {
    player: string; // Player name
    target: string; // Region name
    value: number;
}

export interface GameRound {
    executedAt: string;
    roundNumber: number;
    deployments: PlayerDeployment[];
    commands: PlayerCommand[];
    rolls: CombatRoll[];
    endingMapState: MapState;
}
