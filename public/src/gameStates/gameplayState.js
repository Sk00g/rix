import { logService, LogLevel } from "../logService.js";
import RegionLayer from "../regionLayer.js";
import UnitAvatar from "../sengine/unitAvatar.js";
import TileMap from "../tilemap.js";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";
import graphics from "../game_data/graphics.js";
import { NationColor } from "../sengine/utils.js";
import StateManagerBase from "./stateManagerBase.js";
import DeployState from "./gameplayStates/deployState.js";
import OrderState from "./gameplayStates/orderState.js";

export const GameplayStateType = Object.freeze({
    VIEW_ONLY: "VIEW_ONLY",
    REPLAY_TURN: "REPLAY_TURN",
    DEPLOY: "DEPLOY",
    ORDER: "ORDER",
});

/* This class is the state manager for various GamePlayState classes
 * In the future it will also extend a more general GameState class

 All GameplayStateType sub-state classes must implement the following:

    constructor(game_data)  - For state instance creation on resetState and pushState
    function activate()     - Called after constructor, or when becoming the top state
    function deactivate()   - Called when another state is thrown on top
    function dispose()      - Called before removal from stack (deletion)

The current game data will be passed into each state on construction, this can be used to 
build the initial graphics and reactions upon entering a new state

 */
const LOG_TAG = "GAMEPLAY";

export class GameplayState extends StateManagerBase {
    constructor(stage, mapData, gameState) {
        super();

        // Since this constructor is the entry point for all front-end game display, we need to
        // begin by instantiating all of the graphics objects for gameplay. Only include
        // graphics / objects that will be used all the time or by all sub-states. State-specific
        // graphics should be handled internally by the sub-state itself
        logService(LogLevel.DEBUG, "generating tile and region visuals", LOG_TAG);
        this._stage = stage;
        this._tileMap = new TileMap(stage, mapData, 2.0);
        this._regionVisuals = new RegionLayer(stage, mapData, 2.0);
        this._gameState = { ...gameState };

        this._regionAvatars = [];
        logService(LogLevel.DEBUG, "generating unit avatars", LOG_TAG);
        for (let regionName in this._gameState.regionData) {
            let rdata = this._gameState.regionData[regionName];
            let ownerInfo = this._gameState.players[rdata.ownedBy];
            let rvisual = this._regionVisuals.get(regionName);

            let avatar = new UnitAvatar(
                stage,
                graphics.avatar[ownerInfo.avatar],
                NationColor[ownerInfo.nationColor]
            );
            avatar.setPosition(rvisual.getUnitCenter());
            avatar.setCounter(rdata.armySize);
            avatar.setDirection("down");
            avatar.playWalkAnimation(true);

            this._regionAvatars.push(avatar);
        }

        this._gameData = {
            stage: stage,
            tileMap: this._tileMap,
            regionVisuals: this._regionVisuals,
            avatars: this._regionAvatars,
        };

        logService(LogLevel.DEBUG, "settings initial state to DEPLOY", LOG_TAG);
        // Initial state of GAMEPLAY will normally be view only
        // this.resetState(GameplayStateType.VIEW_ONLY, this._gameData);

        // For testing will go straight to deployment phase
        this.resetState(GameplayStateType.DEPLOY, this._gameData);
    }

    // Factory pattern for generating new gameplay state objects
    _generateState(type) {
        switch (type) {
            case GameplayStateType.DEPLOY:
                return new DeployState(this._gameData);
            case GameplayStateType.ORDER:
                return new OrderState(this._gameData);
        }
    }

    update(delta) {
        // Before calling child classes, update necessary game graphics
        for (let i = 0; i < this._regionAvatars.length; i++) this._regionAvatars[i].update(delta);
        this._regionVisuals.update(delta, [Mouse.posLocalX, Mouse.posLocalY]);

        if (this._stateStack) this.getActiveState().update(delta);
    }
}
