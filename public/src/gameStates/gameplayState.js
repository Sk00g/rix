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
import GameData from "../game_data/gameData.js";
import AppContext from "../appContext.js";

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
    constructor(mapData, gameState) {
        super();

        // Since this constructor is the entry point for all front-end game display, we need to
        // begin by instantiating all of the graphics objects for gameplay. Only include
        // graphics / objects that will be used all the time or by all sub-states. State-specific
        // graphics should be handled internally by the sub-state itself
        logService(LogLevel.DEBUG, "generating tile and region visuals", LOG_TAG);
        this._tileMap = new TileMap(AppContext.stage, mapData, 2.0);
        this._regionVisuals = new RegionLayer(AppContext.stage, mapData, 2.0);

        // This object is passed to all sub-states, contains all necessary game state data
        // and many helper functions to simplify interaction with the game board / map
        this._gameData = new GameData(mapData, gameState, this._regionVisuals);

        logService(LogLevel.DEBUG, "settings initial state to DEPLOY", LOG_TAG);
        // Initial state of GAMEPLAY will normally be view only
        // this.resetState(GameplayStateType.VIEW_ONLY, this._gameData);

        // For testing will go straight to other phase
        // this.resetState(GameplayStateType.DEPLOY, this._gameData);
        this.resetState(GameplayStateType.ORDER, this._gameData);
    }

    // Factory pattern for generating new gameplay state objects
    _generateState(type, initData = null) {
        switch (type) {
            case GameplayStateType.DEPLOY:
                return new DeployState(this, this._gameData, initData);
            case GameplayStateType.ORDER:
                return new OrderState(this, this._gameData, initData);
        }
    }

    update(delta) {
        // Before calling child classes, update necessary game graphics
        this._regionVisuals.update(delta, [Mouse.posLocalX, Mouse.posLocalY]);
        this._gameData.update(delta);

        if (this._stateStack.length > 0) this.getActiveState().update(delta);
    }
}
