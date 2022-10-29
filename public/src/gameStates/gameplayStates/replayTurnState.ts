import * as PIXI from "pixi.js";
import Keyboard from "pixi.js-keyboard";
import { GameStateEvent } from "../../gameData/gameDataHandler";
import * as V from "../../vector";
import SUIE from "../../sengine/suie/suie";
import GameHandler from "../../gameData/gameDataHandler";
import AppContext from "../../appContext";
import GameStateManager from "../gameStateManager";
import { GameplayStateType } from "../model";
import { IGameState } from "../stateManagerBase";
import RegionPathMarker from "../../sengine/regionPathMarker";
import UnitAvatar from "../../sengine/unitAvatar";
import graphics from "../../gameData/graphics";
import { CommandSet } from "../../../../model/gameplay";
import { IconType, PanelColor } from "../../sengine/suie/core";
import Label from "../../sengine/suie/label";
import Conductor from "../../gameVisuals/conductor";

export default class ReplayTurnState implements IGameState {
    _parent: GameStateManager;
    _handler: GameHandler;
    _hudInfo = new PIXI.Container();

    stateType = GameplayStateType.REPLAY_TURN;

    _conductor: Conductor;
    _currentTurnLabel: Label;
    _currentTurn = 0;

    constructor(manager: GameStateManager, handler: GameHandler, conductor: Conductor) {
        this._parent = manager;
        this._handler = handler;
        this._conductor = conductor;
    }

    _setTurn(newTurn: number) {
        if (newTurn === 0 || newTurn >= this._handler.getCurrentRound()) return;

        this._currentTurn = newTurn;
        this._currentTurnLabel.text = `Round ${this._currentTurn}`;
        this._conductor.loadTurn(this._currentTurn);
    }

    async _play() {
        const finished = await this._conductor.next();
        if (finished) this._parent.resetToHomeState();
    }

    _pause() {}

    _setupHUD() {
        this._hudInfo = new PIXI.Container();
        this._hudInfo.position.set(10, 770);

        this._hudInfo.addChild(
            new SUIE.IconButton(IconType.MENU, [0, 90], () => this._parent.resetToHomeState(), PanelColor.Orange, 2)
        );

        let panel = new PIXI.Container();
        panel.position.set(80, 0);
        panel.addChild(
            new SUIE.IconButton(
                IconType.ARROW_LEFT,
                [0, 0],
                () => this._setTurn(this._currentTurn - 1),
                PanelColor.Orange,
                2
            )
        );
        this._currentTurnLabel = new SUIE.Label(`Round ${this._currentTurn}`, [45, 10], 10);
        panel.addChild(this._currentTurnLabel);

        panel.addChild(
            new SUIE.IconButton(
                IconType.ARROW_RIGHT,
                [125, 0],
                () => this._setTurn(this._currentTurn + 1),
                PanelColor.Orange,
                2
            )
        );
        this._hudInfo.addChild(panel);

        panel = new PIXI.Container();
        panel.position.set(80, 40);
        panel.addChild(new SUIE.IconButton(IconType.ARROW_RIGHT, [0, 0], () => this._play(), PanelColor.Orange, 2));
        panel.addChild(new SUIE.IconButton(IconType.PAUSE, [35, 0], () => this._pause(), PanelColor.Orange, 2));

        this._hudInfo.addChild(panel);

        this._parent.hud.addMember(this._hudInfo);
    }

    _initializeDisplay() {
        this._parent.clearVisualStyles();
    }

    activate() {
        this._initializeDisplay();
        this._setupHUD();

        this._setTurn(this._handler.getCurrentRound() - 1);

        Keyboard.events.on("released", "ReplayTurnState", (keyCode) => {
            if (keyCode === "Enter" || keyCode === "NumpadEnter") this._play();
        });
    }

    deactivate() {
        Keyboard.events.remove("released", "ReplayTurnState");
    }

    dispose() {
        this._parent.hud.removeMember(this._hudInfo);
        this._hudInfo.destroy();
        this._conductor.dispose();
    }

    update(delta: number) {
        this._conductor.update(delta);
    }
}
