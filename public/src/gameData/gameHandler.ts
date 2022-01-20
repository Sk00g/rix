import { Player } from "../../../model/lobby";
import apiService from "../apiService";
import { RegionLayer } from "../regionLayer";
import { CommandSet, GameState, PlayerCommand, PlayerDeployment } from "../../../model/gameplay";
import AppContext from "../appContext";
import Keyboard from "pixi.js-keyboard";
import Region from "./region";
import { logService, LogLevel } from "../logService";
import { MapData } from "../../../model/mapData";

/*
IN MEMORY class / object to represent the current game state and provide helper functions for 
accessing the units / regions / tiles etc. as the game progresses. This object is generally 
initialized by interpreting the gameState.json data retrieved from the server
*/

const LOG_TAG = "GAME";

export enum GameStateEvent {
    PlayerCompletedTurn = "PlayerCompletedTurn",
    ArmySizeChanged = "ArmySizeChanged",
}

export default class GameHandler {
    _originalState: GameState;
    _interval: any;
    _registeredHandlers: { [event: string]: Array<(data: any) => void> } = {
        [GameStateEvent.PlayerCompletedTurn]: [],
        [GameStateEvent.ArmySizeChanged]: [],
    };

    regionVisualLayer: RegionLayer;
    mapData: MapData;
    allRegions: Region[];
    currentState: GameState;
    deployments: PlayerDeployment[] = [];
    commands: PlayerCommand[] = [];

    constructor(mapData: MapData, gameState: GameState, regionVisuals: RegionLayer) {
        this._originalState = { ...gameState };
        this.currentState = gameState;
        this.regionVisualLayer = regionVisuals;
        this.mapData = mapData;

        // Shaping the state data into updateable and easily accessible objects
        this._setupRegions();

        // Start polling for game state updates
        this._interval = setInterval(() => this._pollGameState(), 5000);

        // ----- DEBUG TOOLS -----
        Keyboard.events.on("released", (keyCode, event) => {
            let alt = Keyboard.isKeyDown("AltLeft") || Keyboard.isKeyDown("AltRight");
            let shift = Keyboard.isKeyDown("ShiftLeft") || Keyboard.isKeyDown("ShiftRight");

            switch (keyCode) {
                case "KeyR":
                    if (alt && shift) this.allRegions.forEach((region) => console.log(`${region}`));
                    break;
                case "KeyP":
                    if (alt && shift) this.currentState.players.forEach((player) => console.log(`${player}`));
                    break;
            }
        });
        // -----------------------
    }

    _setupRegions() {
        const currentMapState =
            this.currentState.turnHistory?.[this.currentState.turnHistory.length - 1]?.endingMapState ??
            this.currentState.initialRegionState;
        this.allRegions = Object.keys(currentMapState).map((regionName) => {
            let newRegion = new Region();
            newRegion.name = regionName;

            // Circular relationship where players have regions, and each region has owner
            const owner = this.currentState.players.find((p) => p.username === currentMapState[regionName].owner);
            if (!owner) throw new Error("Impossible for a region to not have an owner!");
            newRegion.owner = owner;

            // Special way of adding ownership, use in constructor only
            if (!newRegion.owner.regions) newRegion.owner.regions = [];
            newRegion.owner.regions.push(newRegion);

            // Directly from gameState data
            newRegion.size = currentMapState[regionName].size;

            // Use mapData to store a raw data object with continent details
            newRegion.continent = this.mapData.continents.find((cont) => cont.regionNames.includes(regionName));

            // All things graphical or interactive are handled by this 'visual' (RegionLayer)
            newRegion.visual = this.regionVisualLayer.get(regionName);

            // Render the first avatar now that we have a populated region class
            newRegion.renderAvatar();

            return newRegion;
        });
    }

    async _pollGameState() {
        const previousState = { ...this.currentState };
        const previousMap =
            previousState.turnHistory[previousState.turnHistory.length - 1]?.endingMapState ??
            previousState.initialRegionState;
        this.currentState = await apiService.getGameState(String(this.currentState._id));

        for (let playerName in this.currentState.pendingCommandSets)
            if (!(playerName in previousState.pendingCommandSets))
                this._raiseEvent(GameStateEvent.PlayerCompletedTurn, playerName);

        for (let region of this.allRegions) {
            if (previousMap[region.name].size !== region.size)
                this._raiseEvent(GameStateEvent.ArmySizeChanged, region.name);
        }
    }

    _raiseEvent(type: GameStateEvent, data: any) {
        const handlers = this._registeredHandlers[type];
        if (!handlers.length) return;

        switch (type) {
            case GameStateEvent.PlayerCompletedTurn:
                for (let handler of handlers) handler(data);
                break;
            case GameStateEvent.ArmySizeChanged:
                for (let handler of handlers) handler(data);
                break;
            default:
                throw new Error("Unsupported event type" + type);
        }
    }

    on(event: GameStateEvent, handler: (data: any) => void) {
        this._registeredHandlers[event].push(handler);
    }

    async finishTurn() {
        console.log("sending command set to server for");
        const commandSet: CommandSet = {
            username: AppContext.player.username,
            deployments: this.deployments,
            commands: this.commands,
        };
        await apiService.sendCommandSet(String(this.currentState._id), commandSet);

        this.deployments = [];
        this.commands = [];
    }

    registerCommand(origin: Region, target: Region, amount: number) {
        this.commands.push({ origin: origin.name, target: target.name, amount });
        this.updateArmySize(origin, -amount);
    }

    registerDeployment(region: Region, amount: number) {
        this.deployments.push({ target: region.name, amount });
        this.updateArmySize(region, amount);
    }

    updateArmySize(region: Region, amount: number) {
        region.size += amount;

        // TODO - different colors for increase vs decrease?

        region.avatar.morphNumber(1.5, 0.1);
        region.avatar.blendNumberColor("#ffd700", 10);

        setTimeout(() => region.avatar.setCounter(region.size), 300);

        setTimeout(() => {
            region.avatar.morphNumber(1.0, 0.2);
            region.avatar.blendNumberColor("#ffffff", 15);
        }, 1300);

        this._raiseEvent(GameStateEvent.ArmySizeChanged, region.name);
    }

    getPlayerArmySize(player: Player): number {
        const regions = this.allRegions.filter((reg) => reg.owner.accountId === player.accountId);
        return regions
            .filter((reg) => reg.owner.username === AppContext.player.username)
            .reduce((prev, cur) => prev + cur.size, 0);
    }

    getPlayerDensity(player: Player): number {
        const regions = this.allRegions.filter((reg) => reg.owner.accountId === player.accountId);
        return this.getPlayerArmySize(player) / regions.length;
    }

    getPlayerPendingCommands(player: Player): CommandSet {
        return {
            username: player.username,
            commands: this.currentState.pendingCommandSets[player.username].commands,
            deployments: this.currentState.pendingCommandSets[player.username].deployments,
        };
    }

    getReinforcementCount(player: Player) {
        const regions = this.allRegions.filter((reg) => reg.owner.accountId === player.accountId);
        if (!regions?.length) return 0;

        let count = this.mapData.defaultReinforce;
        count += Math.floor(regions.length / this.mapData.generalRegionReinforceIncrement);

        // Continent bonuses
        for (let cont of this.mapData.continents) {
            let hasAllRegions = true;
            for (let name of cont.regionNames) {
                let region = this.getRegion(name);
                if (region?.owner !== player) {
                    hasAllRegions = false;
                    break;
                }
            }
            if (hasAllRegions) count += cont.ownershipValue;
        }

        // Connected empire bonuses
        logService(LogLevel.DEBUG, `Player ${player.username} receives ${count} armies`, LOG_TAG);

        return count;
    }

    // Important to remember borderness is not always mutual
    isRegionBorder(origin: Region, target: Region): boolean {
        if (origin.name === target.name) return false;
        let regionData = this.mapData.regions.find((r) => r.name === origin.name);
        return regionData?.borderRegionNames.includes(target.name) ?? false;
    }

    getRegion(name: string): Region | undefined {
        return this.allRegions.find((reg) => reg.name === name);
    }

    getPlayer(name: string): Player | undefined {
        return this.currentState.players.find((player) => player.username === name);
    }

    update(delta: number) {
        this.allRegions.forEach((region) => region.avatar.update(delta));
    }
}
