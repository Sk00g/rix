import { IconType, PanelColor } from "./../sengine/suie/core";
import { Lobby } from "./../../../model/lobby";
import { GameState } from "./../../../model/gameplay";
import { MapData } from "./../../../model/mapData";
import { logService, LogLevel } from "../logService";
import SUIE from "../sengine/suie/suie";
import * as PIXI from "pixi.js";
import { RegionLayer } from "../gameVisuals/regionLayer";
import TileMap from "../gameVisuals/tilemap";
import Mouse from "pixi.js-mouse";
import graphics from "../gameData/graphics";
import DeployState from "./gameplayStates/deployState";
import OrderState from "./gameplayStates/orderState";
import GameHandler, { GameStateEvent } from "../gameData/gameDataHandler";
import AppContext from "../appContext";
import StateManagerBase, { IGameState } from "./stateManagerBase";
import { GameplayStateType } from "./model";
import theme from "../lobby/theme";
import Panel from "../sengine/suie/panel";
import UnitAvatar from "../sengine/unitAvatar";
import Label from "../sengine/suie/label";
import ViewState from "./gameplayStates/viewState";
import { exitGame } from "../gameEntry";
import ReplayTurnState from "./gameplayStates/replayTurnState";
import Conductor from "../gameVisuals/conductor";

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
- design basic conductor stuff
- add min button or slider
- bug where view state is not showing the correct values for command origin territories on load
- bug still exists where if you take over a territory before it's command completes, it's command will think 
        it's from the attacking player, instead of the actual original

CLEANUP:
- event handlers for game handler should have the off method, will need unique key and such
- game events are a bit sloppy... maybe it should just trigger whenever major areas of state change instead of trying
to be specific, like react hooks for redux instead of typed events
*/

export default class GameStateManager extends StateManagerBase {
    _stateStack: IGameState[];
    _tileMap: TileMap;
    private _regionVisuals: RegionLayer;
    _handler: GameHandler;
    _conductor: Conductor;
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

        // Conductor is used primarily by playback state, but operates separate from the actual GameHandler, as
        // it affects the map graphically, but does not update any actual game state or data outside itself
        this._conductor = new Conductor(this._handler, gameState, this._regionVisuals);

        // Setup HUD that exists across all states
        this._setupHud();

        this.resetToHomeState();
        // this.resetState(GameplayStateType.REPLAY_TURN);

        // Setup HUD to respond to events
        this._handler.on(GameStateEvent.PlayerCompletedTurn, (player: string) => {
            (this._items[`${player}Status`] as Label).text = "READY";
            (this._items[`${player}Status`] as PIXI.Text).style.fill = theme.colors.green;
        });
        this._handler.on(GameStateEvent.ArmySizeChanged, (region: string) => this._updateHudStats());
        this._handler.on(GameStateEvent.NewRoundProcessed, () => {
            for (let player of this._handler.getAllPlayers()) {
                (this._items[`${player.username}Status`] as Label).text = "WAITING";
                (this._items[`${player.username}Status`] as PIXI.Text).style.fill = theme.colors.fontGray;
            }
        });
    }

    /** Return to either VIEW or DEPLOY state, depending on if current user's commands have been submitted */
    public resetToHomeState() {
        const set = this._handler.getPlayerCommandSets(AppContext.player);
        if (set?.commands.length || set?.deployments.length) {
            logService(LogLevel.DEBUG, "resetting state to VIEW", LOG_TAG);
            this.resetState(GameplayStateType.VIEW_ONLY);
        } else {
            logService(LogLevel.DEBUG, "resetting state to DEPLOY", LOG_TAG);
            this.resetState(GameplayStateType.DEPLOY);
        }
    }

    public clearVisualStyles() {
        this._regionVisuals.clearAllStyles();
    }

    _updateHudStats() {
        (this._items.armyLabel as Label).text = `Total Army:  ${this._handler.getPlayerArmySize(AppContext.player)}`;
        (this._items.densityLabel as Label).text = `Army Density: ${this._handler
            .getPlayerDensity(AppContext.player)
            .toFixed(2)}`;
    }

    _setupActionBar() {
        const container = new PIXI.Container();
        container.position.set(10, 860);

        container.addChild(new SUIE.IconButton(IconType.HOME, [270, 0], () => exitGame(), PanelColor.Orange, 2));
        container.addChild(
            new SUIE.IconButton(
                IconType.REFRESH,
                [235, 0],
                () => this.resetState(GameplayStateType.REPLAY_TURN),
                PanelColor.Orange,
                2
            )
        );

        this.hud.addMember(container);
    }

    _setupHud() {
        this.hud.addMember(new SUIE.Label(this._lobby.tag, [250, 10], 10, theme.colors.fontWhite));
        this.hud.addMember(new SUIE.Label(this._handler.getMapName(), [10, 10], 10, theme.colors.fontMain));

        this._items.roundLabel = new SUIE.Label(
            `Round ${this._handler.getCurrentRound()}`,
            [10, 30],
            10,
            theme.colors.fontMain
        );
        this.hud.addMember(this._items.roundLabel);

        this._items.stateLabel = new SUIE.Label(`Loading...`, [120, 30], 10, theme.colors.fontWhite);
        this.hud.addMember(this._items.stateLabel);

        this._items.regionLabel = new SUIE.Label(
            `My Regions:  ${this._handler.getPlayerRegions(AppContext.player).length}`,
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
        let starty = 600;
        for (let player of this._handler.getAllPlayers()) {
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
                this._handler.hasPlayerSubmitted(player) ? "READY" : "WAITING",
                [textWidth + 130, starty + 2],
                10,
                this._handler.hasPlayerSubmitted(player) ? theme.colors.green : theme.colors.fontGray
            );
            this.hud.addMember(this._items[`${player.username}Status`]);

            starty += 40;
        }

        this._setupActionBar();

        AppContext.stage.addChild(this.hud);
    }

    // Factory pattern for generating new gameplay state objects
    _generateState(type: GameplayStateType): IGameState {
        switch (type) {
            case GameplayStateType.REPLAY_TURN:
                (this._items.stateLabel as Label).text = "Turn Playback";
                return new ReplayTurnState(this, this._handler, this._conductor);
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
