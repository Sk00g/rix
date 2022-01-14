import { GameState } from "./../../../model/gameplay";
import { MapData } from "./../../../model/mapData";
import { logService, LogLevel } from "../logService";
import { RegionLayer } from "../regionLayer";
import UnitAvatar from "../sengine/unitAvatar.js";
import TileMap from "../tilemap";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";
import graphics from "../game_data/graphics";
import DeployState from "./gameplayStates/deployState";
import OrderState from "./gameplayStates/orderState";
import GameHandler from "../game_data/gameHandler";
import AppContext from "../appContext";

export enum GameplayStateType {
    VIEW_ONLY = "VIEW_ONLY",
    REPLAY_TURN = "REPLAY_TURN",
    DEPLOY = "DEPLOY",
    ORDER = "ORDER",
}

/* This class is the state manager for various GamePlayState classes

 All GameplayStateType sub-state classes must implement the following:

    constructor(game_data)  - For state instance creation on resetState and pushState
    function activate()     - Called after constructor, or when becoming the top state
    function deactivate()   - Called when another state is thrown on top
    function dispose()      - Called before removal from stack (deletion)

The current game data will be passed into each state on construction, this can be used to 
build the initial graphics and reactions upon entering a new state

 */
const LOG_TAG = "GAMEPLAY";

export interface IGameState {
    update: (delta: number) => void;
    deactivate: () => void;
    activate: () => void;
    dispose: () => void;
    stateType: GameplayStateType;
}

export default class GameStateManager {
    _stateStack: IGameState[];
    _tileMap: TileMap;
    _regionVisuals: RegionLayer;
    _gameHandler: GameHandler;

    stateType: GameplayStateType;

    constructor(mapData: MapData, gameState: GameState) {
        if (!AppContext.stage) throw new Error("AppContext not set, cannot generate game state");

        // Since this constructor is the entry point for all front-end game display, we need to
        // begin by instantiating all of the graphics objects for gameplay. Only include
        // graphics / objects that will be used all the time or by all sub-states. State-specific
        // graphics should be handled internally by the sub-state itself
        logService(LogLevel.DEBUG, "generating tile and region visuals", LOG_TAG);
        this._tileMap = new TileMap(AppContext.stage, mapData);
        this._regionVisuals = new RegionLayer(AppContext.stage, mapData, 1.0);

        // This object is passed to all sub-states, contains all necessary game state data
        // and many helper functions to simplify interaction with the game board / map
        this._gameHandler = new GameHandler(mapData, gameState, this._regionVisuals);

        logService(LogLevel.DEBUG, "settings initial state to DEPLOY", LOG_TAG);
        // Initial state of GAMEPLAY will normally be view only
        // this.resetState(GameplayStateType.VIEW_ONLY, this._gameHandler);

        // For testing will go straight to other phase
        this.resetState(GameplayStateType.DEPLOY, this._gameHandler);
        // this.resetState(GameplayStateType.ORDER, this._gameHandler);
    }

    // Factory pattern for generating new gameplay state objects
    _generateState(type: GameplayStateType, initData: GameHandler): IGameState {
        switch (type) {
            case GameplayStateType.DEPLOY:
                return new DeployState(this, this._gameHandler, initData);
            case GameplayStateType.ORDER:
                return new OrderState(this, this._gameHandler, initData);
            default:
                throw new Error(`Cannot generate state of type ${type}`);
        }
    }

    // Gets the currently activate state (on top of stack)
    getActiveState(): IGameState {
        return this._stateStack[this._stateStack.length - 1];
    }

    // Pop off the top state from current stack
    popState() {
        // Do nothing if the stack is already empty
        if (!this._stateStack) return;

        let currentState = this._stateStack.pop();
        logService(LogLevel.DEBUG, `removing state ${currentState?.stateType} from stack`);
        if (currentState?.deactivate) currentState.deactivate();
        if (currentState?.dispose) currentState.dispose();

        let nextState = this.getActiveState();
        if (nextState && nextState.activate) nextState.activate();
    }

    // Push a new state on top of the current stack
    pushState(stateType: GameplayStateType, initData: GameHandler) {
        let currentState = this.getActiveState();
        if (currentState && currentState.deactivate) currentState.deactivate();

        let newState = this._generateState(stateType, initData);
        newState.stateType = stateType;
        if (newState.activate) newState.activate();
        logService(LogLevel.DEBUG, `adding new state ${stateType} to stack`, "STATE");
        this._stateStack.push(newState);
    }

    // Remove all states from the stack and reset to only the given state
    resetState(stateType: GameplayStateType, initData: GameHandler) {
        while (this.getActiveState()) this.popState();

        this.pushState(stateType, initData);
    }

    update(delta) {
        // Before calling child classes, update necessary game graphics
        this._regionVisuals.update(delta, [Mouse.posLocalX, Mouse.posLocalY]);
        this._gameHandler.update(delta);

        if (this._stateStack.length > 0) this.getActiveState().update(delta);
    }
}
