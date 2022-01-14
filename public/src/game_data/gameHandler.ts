import { Player } from "../../../model/lobby";
import { RegionVisual, RegionLayer } from "../regionLayer";
import { GameState, PlayerCommand, PlayerDeployment } from "../../../model/gameplay";
/*
IN MEMORY class / object to represent the current game state and provide helper functions for 
accessing the units / regions / tiles etc. as the game progresses. This object is generally 
initialized by interpreting the gameState.json data retrieved from the server
*/

import AppContext from "../appContext.js";
import Keyboard from "pixi.js-keyboard";
import Region from "./region.js";
import { logService, LogLevel } from "../logService.js";
import { MapData } from "../../../model/mapData.js";

const LOG_TAG = "GAME";

export default class GameHandler {
    _originalState: GameState;
    regionVisualLayer: RegionLayer;
    mapData: MapData;
    allRegions: Region[];
    currentState: GameState;
    deployments: PlayerDeployment[];
    commands: PlayerCommand[];

    constructor(mapData: MapData, gameState: GameState, regionVisuals: RegionLayer) {
        this._originalState = { ...gameState };

        this.currentState = gameState;
        this.regionVisualLayer = regionVisuals;
        this.mapData = mapData;

        // Shaping the state data into updateable and easily accessible objects
        const currentMapState = gameState.turnHistory[gameState.turnHistory.length - 1].endingMapState;
        this.allRegions = Object.keys(currentMapState).map((regionName) => {
            let newRegion = new Region();
            newRegion.name = regionName;

            // Circular relationship where players have regions, and each region has owner
            const owner = gameState.players.find((p) => p.username === currentMapState[regionName].owner);
            if (!owner) throw new Error("Impossible for a region to not have an owner!");
            newRegion.owner = owner;

            // Special way of adding ownership, use in constructor only
            if (!newRegion.owner.regions) newRegion.owner.regions = [];
            newRegion.owner.regions.push(newRegion);

            // Directly from gameState data
            newRegion.size = currentMapState[regionName].size;

            // Use mapData to store a raw data object with continent details
            newRegion.continent = mapData.continents.find((cont) => cont.regionNames.includes(regionName));

            // All things graphical or interactive are handled by this 'visual' (RegionLayer)
            newRegion.visual = regionVisuals.get(regionName);

            // Render the first avatar now that we have a populated region class
            newRegion.renderAvatar();

            return newRegion;
        });

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

    // DEBUG HACKS!!! KILL ME LATER!!
    finishTurn() {
        if (AppContext.playerName === "Sk00g") AppContext.playerName = "JKase";
        else if (AppContext.playerName === "JKase") AppContext.playerName = "Sk00g";
    }

    registerCommand(origin: Region, target: Region, amount: number) {
        this.commands.push({ origin: origin.name, target: target.name, amount });
        this.updateArmySize(origin, -amount);
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
    }

    getReinforcementCount(player: Player) {
        if (!player.regions?.length) return 0;

        let count = this.mapData.defaultReinforce;
        count += Math.floor(player.regions.length / this.mapData.generalRegionReinforceIncrement);

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
