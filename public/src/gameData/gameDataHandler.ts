import { Player } from "../../../model/lobby";
import apiService from "../apiService";
import { RegionLayer, RegionVisual, RegionVisualEvent } from "../gameVisuals/regionLayer";
import { CommandSet, GameState, PlayerCommand, PlayerDeployment } from "../../../model/gameplay";
import AppContext from "../appContext";
import Keyboard from "pixi.js-keyboard";
import Region from "./region";
import { logService, LogLevel } from "../logService";
import { MapData } from "../../../model/mapData";
import { PlayerStatus } from "../../../model/enums";

/*
IN MEMORY class / object to represent the current game state and provide helper functions for 
accessing the units / regions / tiles etc. as the game progresses. This object is generally 
initialized by interpreting the gameState.json data retrieved from the server
*/

const LOG_TAG = "GAME";

export enum GameStateEvent {
    PlayerCompletedTurn = "PlayerCompletedTurn",
    ArmySizeChanged = "ArmySizeChanged",
    NewRoundProcessed = "NewRoundProcessed",
}

export default class GameDataHandler {
    private _interval: any;
    private _registeredHandlers: { [event: string]: Array<(data: any) => void> } = {
        [GameStateEvent.PlayerCompletedTurn]: [],
        [GameStateEvent.ArmySizeChanged]: [],
        [GameStateEvent.NewRoundProcessed]: [],
    };

    private _regionVisualLayer: RegionLayer;
    private _mapData: MapData;
    private _regions: Region[] = [];
    private _currentState: GameState;
    private _deployments: PlayerDeployment[] = [];
    private _commands: PlayerCommand[] = [];

    constructor(mapData: MapData, gameState: GameState, regionVisuals: RegionLayer) {
        this._currentState = gameState;
        this._regionVisualLayer = regionVisuals;
        this._mapData = mapData;

        // Shaping the state data into updateable and easily accessible objects
        this.setupRegions();

        // Start polling for game state updates
        this._interval = setInterval(() => this._pollGameState(), 5000);

        // ----- DEBUG TOOLS -----
        Keyboard.events.on("released", (keyCode, event) => {
            let alt = Keyboard.isKeyDown("AltLeft") || Keyboard.isKeyDown("AltRight");
            let shift = Keyboard.isKeyDown("ShiftLeft") || Keyboard.isKeyDown("ShiftRight");

            switch (keyCode) {
                case "KeyR":
                    if (alt && shift) this._regions.forEach((region) => console.log(`${region}`));
                    break;
                case "KeyP":
                    if (alt && shift) this._currentState.players.forEach((player) => console.log(`${player}`));
                    break;
            }
        });
        // -----------------------
    }

    async finishTurn() {
        const commandSet: CommandSet = {
            username: AppContext.player.username,
            deployments: this._deployments,
            commands: this._commands,
        };
        await apiService.sendCommandSet(String(this._currentState._id), commandSet);

        this._deployments = [];
        this._commands = [];
    }

    /* Event Handling */

    on(event: GameStateEvent, handler: (data: any) => void) {
        this._registeredHandlers[event].push(handler);
    }

    async _pollGameState() {
        const previousState = { ...this._currentState };
        const previousMap =
            previousState.turnHistory[previousState.turnHistory.length - 1]?.endingMapState ??
            previousState.initialRegionState;
        this._currentState = await apiService.getGameState(String(this._currentState._id));

        for (let playerName in this._currentState.pendingCommandSets)
            if (!(playerName in previousState.pendingCommandSets))
                this._raiseEvent(GameStateEvent.PlayerCompletedTurn, playerName);

        for (let region of this._regions) {
            if (previousMap[region.name].size !== region.size)
                this._raiseEvent(GameStateEvent.ArmySizeChanged, region.name);
        }

        if (previousState.turnHistory.length !== this._currentState.turnHistory.length) {
            this._raiseEvent(GameStateEvent.NewRoundProcessed);
        }
    }

    /* Visual Methods */

    onVisual(event: RegionVisualEvent, handler: (region: RegionVisual) => void, objectKey: any) {
        return this._regionVisualLayer.on(event, handler, objectKey);
    }

    unsubscribeAllVisual(objectKey: any) {
        this._regionVisualLayer.unsubscribeAll(objectKey);
    }

    clearVisualStyles() {
        this._regionVisualLayer.clearAllStyles();
    }

    _raiseEvent(type: GameStateEvent, data?: any) {
        const handlers = this._registeredHandlers[type];
        if (!handlers.length) return;

        switch (type) {
            case GameStateEvent.PlayerCompletedTurn:
            case GameStateEvent.ArmySizeChanged:
                break;
            case GameStateEvent.NewRoundProcessed:
                // Re-render all unit avatars with the new state (don't really want to do this here? Cause conductor?)
                this.setupRegions();
                break;
            default:
                throw new Error("Unsupported event type" + type);
        }

        for (let handler of handlers) handler(data);
    }

    /* Command / Deployment Methods */

    getPlayerCommandSets(player: Player): CommandSet | null {
        const set = this._currentState.pendingCommandSets[player.username];
        return {
            username: player.username,
            commands: set?.commands ?? this._commands,
            deployments: set?.deployments ?? [],
        };
    }

    registerCommand(player: string, origin: Region, target: Region, amount: number) {
        this._commands.push({ origin: origin.name, target: target.name, amount, player });
    }

    registerDeployment(region: Region, amount: number, skipAnimation = false) {
        this._deployments.push({ target: region.name, amount });
        this._updateArmySize(region, amount, skipAnimation);
    }

    _updateArmySize(region: Region, amount: number, skipAnimation = false) {
        region.size += amount;
        this._raiseEvent(GameStateEvent.ArmySizeChanged, region.name);

        if (skipAnimation) {
            region.avatar.setCounter(region.size);
        } else {
            region.avatar.morphNumber(1.3, 0.1);
            region.avatar.blendNumberColor("#ffd700", 10);

            setTimeout(() => region.avatar.setCounter(region.size), 300);

            setTimeout(() => {
                region.avatar.morphNumber(1.0, 0.2);
                region.avatar.blendNumberColor("#ffffff", 15);
            }, 1000);
        }
    }

    /* Region Methods */

    isRegionBorder(origin: Region, target: Region): boolean {
        if (origin.name === target.name) return false;
        let regionData = this._mapData.regions.find((r) => r.name === origin.name);
        return regionData?.borderRegionNames.includes(target.name) ?? false;
    }

    getRegion(name: string): Region {
        const region = this._regions.find((reg) => reg.name === name);
        if (!region) throw new Error(`Impossible state detected, region doesn't exist ${name}`);
        return region;
    }

    getPlayerRegions(player: Player): Region[] {
        return this._regions.filter((reg) => reg.owner.accountId === player.accountId);
    }

    setupRegions() {
        for (let region of this._regions) region.destroy();

        const currentMapState =
            this._currentState.turnHistory?.[this._currentState.turnHistory.length - 1]?.endingMapState ??
            this._currentState.initialRegionState;
        this._regions = Object.keys(currentMapState).map((regionName) => {
            let newRegion = new Region();
            newRegion.name = regionName;

            // Circular relationship where players have regions, and each region has owner
            const owner = this._currentState.players.find((p) => p.username === currentMapState[regionName].owner);
            if (!owner) throw new Error("Impossible for a region to not have an owner!");
            newRegion.owner = owner;

            // Special way of adding ownership, use in constructor only
            if (!newRegion.owner.regions) newRegion.owner.regions = [];
            newRegion.owner.regions.push(newRegion);

            // Directly from gameState data
            newRegion.size = currentMapState[regionName].size;

            // Use mapData to store a raw data object with continent details
            newRegion.continent = this._mapData.continents.find((cont) => cont.regionNames.includes(regionName));

            // All things graphical or interactive are handled by this 'visual' (RegionLayer)
            newRegion.visual = this._regionVisualLayer.get(regionName);

            // Render the first avatar now that we have a populated region class
            newRegion.renderAvatar();

            return newRegion;
        });
    }

    /* Army + Player Methods */

    getReinforcementCount(player: Player) {
        const regions = this._regions.filter((reg) => reg.owner.accountId === player.accountId);
        if (!regions?.length) return 0;

        let count = this._mapData.defaultReinforce;
        count += Math.floor(regions.length / this._mapData.generalRegionReinforceIncrement);

        // Continent bonuses
        for (let cont of this._mapData.continents) {
            let hasAllRegions = true;
            for (let name of cont.regionNames) {
                let region = this.getRegion(name);
                if (region?.owner.username !== player.username) {
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

    getPlayerArmySize(player: Player): number {
        const regions = this._regions.filter((reg) => reg.owner.accountId === player.accountId);
        return regions
            .filter((reg) => reg.owner.username === AppContext.player.username)
            .reduce((prev, cur) => prev + cur.size, 0);
    }

    getPlayerDensity(player: Player): number {
        const regions = this._regions.filter((reg) => reg.owner.accountId === player.accountId);
        return this.getPlayerArmySize(player) / regions.length;
    }

    getPlayer(name: string): Player | undefined {
        return this._currentState.players.find((player) => player.username === name);
    }

    getAllPlayers(): Player[] {
        return this._currentState.players;
    }

    hasPlayerSubmitted(player: Player) {
        return player.username in this._currentState.pendingCommandSets;
    }

    /* Map / Round Methods */

    getRegions(): Region[] {
        return this._regions;
    }

    getMapName(): string {
        return this._currentState.mapName;
    }

    getCurrentRound(): number {
        return this._currentState.turnHistory.length + 1;
    }

    update(delta: number) {
        this._regions.forEach((region) => region.avatar.update(delta));
    }
}
