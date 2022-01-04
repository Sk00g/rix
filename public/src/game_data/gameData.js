/*
IN MEMORY class / object to represent the current game state and provide helper functions for 
accessing the units / regions / tiles etc. as the game progresses. This object is generally 
initialized by interpreting the gameState.json data retrieved from the server
*/
import AppContext from "../appContext.js";
import Keyboard from "pixi.js-keyboard";
import Player from "./player.js";
import Region from "./region.js";
import { logService, LogLevel } from "../logService.js";

const LOG_TAG = "GAME";

export default class GameData {
    constructor(mapData, gameState, regionVisuals) {
        this._originalState = gameState;

        this.regionVisualLayer = regionVisuals;
        this.mapData = mapData;

        // Store orders from each player until turn execution occurs (TEMP)
        this.pendingOrders = [];

        // Shaping the state data into updateable and easily accessible objects
        this.allPlayers = Object.keys(gameState.players).map(
            (playerName) =>
                new Player(playerName, gameState.players[playerName].avatar, gameState.players[playerName].nationColor)
        );
        this.allRegions = Object.keys(gameState.regionData).map((regionName) => {
            let newRegion = new Region();
            newRegion.name = regionName;

            // Circular relationship where players have regions, and each region has owner
            newRegion.owner = this.allPlayers.find(
                (player) => player.name === gameState.regionData[regionName].ownedBy
            );

            // Special way of adding ownership, use in constructor only
            newRegion.owner.regions.push(newRegion);

            // Directly from gameState data
            newRegion.armySize = gameState.regionData[regionName].armySize;

            // Use mapData to store a raw data object with continent details
            newRegion.continent = mapData.continents.find((cont) => cont.regions.includes(regionName));

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
                    if (alt && shift) this.allPlayers.forEach((player) => console.log(`${player}`));
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

    registerOrder(origin, target, amount) {
        this.pendingOrders.push({ origin, target, amount });
        this.updateArmySize(origin, -amount);
    }

    updateArmySize(region, amount) {
        region.armySize += amount;

        // TODO - different colors for increase vs decrease?

        region.avatar.morphNumber(1.5, 0.1);
        region.avatar.blendNumberColor("#ffd700", 10);

        setTimeout(() => region.avatar.setCounter(region.armySize), 300);

        setTimeout(() => {
            region.avatar.morphNumber(1.0, 0.2);
            region.avatar.blendNumberColor("#ffffff", 15);
        }, 1300);
    }

    getReinforcementCount(player) {
        let count = this.mapData.defaultReinforce;
        count += Math.floor(player.regions.length / this.mapData.generalRegionReinforceIncrement);

        // Continent bonuses
        for (let cont of this.mapData.continents) {
            let hasAllRegions = true;
            for (let name of cont.regions) {
                let region = this.getRegion(name);
                if (region.owner !== player) {
                    hasAllRegions = false;
                    break;
                }
            }
            if (hasAllRegions) count += cont.ownershipValue;
        }

        // Connected empire bonuses
        logService(LogLevel.DEBUG, `Player ${player.name} receives ${count} armies`, LOG_TAG);

        return count;
    }

    // Important to remember borderness is not always mutual
    isRegionBorder(origin, target) {
        if (origin === target) return false;
        let regionData = this.mapData.regions.find((r) => r.name === origin.name);
        return regionData.borderRegions.includes(target.name);
    }

    getRegion(name) {
        return this.allRegions.find((reg) => reg.name === name);
    }

    getPlayer(name) {
        return this.allPlayers.find((player) => player.name === name);
    }

    update(delta) {
        this.allRegions.forEach((region) => region.avatar.update(delta));
    }
}
