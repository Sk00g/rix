import { PanelColor, PanelSize } from "./../sengine/suie/core";
import { Lobby } from "./../../../model/lobby";
import { GameState } from "./../../../model/gameplay";
import { MapData } from "./../../../model/mapData";
import { logService, LogLevel } from "../logService";
import SUIE from "../sengine/suie/suie";
import * as PIXI from "pixi.js";
import { RegionLayer } from "../regionLayer";
import TileMap from "../tilemap";
import Keyboard from "pixi.js-keyboard";
import Mouse from "pixi.js-mouse";
import graphics from "../gameData/graphics";
import DeployState from "./gameplayStates/deployState";
import OrderState from "./gameplayStates/orderState";
import GameHandler, { GameStateEvent } from "../gameData/gameHandler";
import AppContext from "../appContext";
import StateManagerBase, { IGameState } from "./stateManagerBase";
import { GameplayStateType } from "./model";
import theme from "../lobby/theme";
import App from "../lobby/app";
import Panel from "../sengine/suie/panel";
import { StringFromRGB } from "../sengine/utils";
import UnitAvatar from "../sengine/unitAvatar";
import Label from "../sengine/suie/label";
import ViewState from "./gameplayStates/viewState";
import { PlayerStatus } from "../../../model/enums";

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

/*
- on initial game state load, go to deploy state if current user has not submitted, if we have, then go to view state
- view state should show commands for that turn that are 'waiting'
- make logins keep the original logger inererer
- continent bonuses are not working

while in view state, listen for event from handler that says that new round has been executed
-> on this event, update visuals to new game state (should actually switch to conductor state)
-> switch to deploy phase again
*/

export default class GameStateManager extends StateManagerBase {
    _stateStack: IGameState[];
    _tileMap: TileMap;
    _regionVisuals: RegionLayer;
    _handler: GameHandler;
    _lobby: Lobby;
    _items: { [key: string]: PIXI.DisplayObject } = {};

    hud: Panel = new SUIE.Panel(new PIXI.Rectangle(1079, 0, 320, 900));
    stateType: GameplayStateType;

    constructor(mapData: MapData, gameState: GameState, lobby: Lobby) {
        super();

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
        this._lobby = lobby;
        this._handler = new GameHandler(mapData, gameState, this._regionVisuals);

        logService(LogLevel.DEBUG, "settings initial state to DEPLOY", LOG_TAG);
        // Initial state of GAMEPLAY will normally be view only
        // this.resetState(GameplayStateType.VIEW_ONLY, this._handler);

        // Setup HUD that exists across all states
        this._setupHud();

        // For testing will go straight to other phase
        this.resetState(GameplayStateType.DEPLOY);
        // this.resetState(GameplayStateType.ORDER, this._handler);

        // Setup HUD to respond to events
        this._handler.on(GameStateEvent.PlayerCompletedTurn, (player: string) => {
            (this._items[`${player}Status`] as Label).text = "READY";
            (this._items[`${player}Status`] as PIXI.Text).style.fill = theme.colors.green;
        });
        this._handler.on(GameStateEvent.ArmySizeChanged, (region: string) => this._updateHudStats());
    }

    _updateHudStats() {
        (this._items.armyLabel as Label).text = `Total Army:  ${this._handler.getPlayerArmySize(AppContext.player)}`;
        (this._items.densityLabel as Label).text = `Army Density: ${this._handler
            .getPlayerDensity(AppContext.player)
            .toFixed(2)}`;
    }

    _setupHud() {
        const state = this._handler.currentState;
        const regions = this._handler.allRegions;

        this.hud.addMember(new SUIE.Label(this._lobby.tag, [250, 10], 10, theme.colors.fontWhite));
        this.hud.addMember(new SUIE.Label(this._handler.mapData.name, [10, 10], 10, theme.colors.fontMain));

        this._items.roundLabel = new SUIE.Label(
            `Round ${this._handler.currentState.turnHistory.length + 1}`,
            [10, 30],
            10,
            theme.colors.fontMain
        );
        this.hud.addMember(this._items.roundLabel);

        this._items.stateLabel = new SUIE.Label(`Loading...`, [120, 30], 10, theme.colors.fontWhite);
        this.hud.addMember(this._items.stateLabel);

        this._items.regionLabel = new SUIE.Label(
            `My Regions:  ${regions.filter((reg) => reg.owner.username === AppContext.player.username).length}`,
            [10, 70],
            10
        );
        this.hud.addMember(this._items.regionLabel);

        this._items.armyLabel = new SUIE.Label(
            `Total Army:  ${this._handler.getPlayerArmySize(AppContext.player)}`,
            [10, 90],
            10
        );
        this.hud.addMember(this._items.armyLabel);

        this._items.densityLabel = new SUIE.Label(
            `Army Density: ${this._handler.getPlayerDensity(AppContext.player).toFixed(2)}`,
            [10, 110],
            10
        );
        this.hud.addMember(this._items.densityLabel);

        this._items.reinforcementLabel = new SUIE.Label(
            `Next Reinforcements: ${this._handler.getReinforcementCount(AppContext.player)}`,
            [10, 130],
            10
        );
        this.hud.addMember(this._items.reinforcementLabel);

        // Setup player statuses
        let starty = 700;
        for (let player of state.players) {
            this._items[player.username] = new SUIE.Label(player.username, [10, starty], 12, theme.colors.fontWhite);
            this.hud.addMember(this._items[player.username]);
            const avatar = new UnitAvatar(
                this.hud,
                graphics.avatar[player.avatar],
                player.color,
                new PIXI.Rectangle(0, 2, 26, 36)
            );
            const textWidth = this._items[player.username].getLocalBounds().width;
            this._items[player.username].getLocalBounds();
            avatar.setPosition([textWidth + 40, starty]);
            this.hud.addMember(avatar.sprite);
            for (let i = 0; i < 6; i++) {
                this.hud.addMember(
                    new SUIE.Label("|||", [textWidth + 60 + i * 3, starty], 16, `#${player.color.toString(16)}`)
                );
            }
            this._items[`${player.username}Status`] = new SUIE.Label(
                player.username in state.pendingCommandSets ? "READY" : "WAITING",
                [textWidth + 130, starty + 2],
                10,
                player.username in state.pendingCommandSets ? theme.colors.green : theme.colors.fontGray
            );
            this.hud.addMember(this._items[`${player.username}Status`]);

            starty += 40;
        }

        AppContext.stage.addChild(this.hud);
    }

    // Factory pattern for generating new gameplay state objects
    _generateState(type: GameplayStateType): IGameState {
        switch (type) {
            case GameplayStateType.DEPLOY:
                (this._items.stateLabel as Label).text = "Deploy Phase";
                return new DeployState(this, this._handler);
            case GameplayStateType.ORDER:
                (this._items.stateLabel as Label).text = "Order Phase";
                return new OrderState(this, this._handler);
            case GameplayStateType.VIEW_ONLY:
                (this._items.stateLabel as Label).text = "Map View";
                return new ViewState(this, this._handler);
            default:
                throw new Error(`Cannot generate state of type ${type}`);
        }
    }

    update(delta) {
        // Before calling child classes, update necessary game graphics
        this._regionVisuals.update(delta, [Mouse.posLocalX, Mouse.posLocalY]);
        this._handler.update(delta);

        if (this._stateStack.length > 0) this.getActiveState().update(delta);
    }
}
