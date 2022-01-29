import { GameStateEvent } from "../../gameData/gameDataHandler";
import * as V from "../../vector";
import GameHandler from "../../gameData/gameDataHandler";
import AppContext from "../../appContext";
import GameStateManager from "../gameStateManager";
import { GameplayStateType } from "../model";
import { IGameState } from "../stateManagerBase";
import RegionPathMarker from "../../sengine/regionPathMarker";
import UnitAvatar from "../../sengine/unitAvatar";
import graphics from "../../gameData/graphics";
import { CommandSet } from "../../../../model/gameplay";

const HOVER_FILL = 0x3030f0;
const OUTLINE_COLOR = 0xa0c0ff;
const ATTACK_ARROW_COLOR = 0xff6060;
const MOVE_ARROW_COLOR = 0x60ff60;

export default class ViewState implements IGameState {
    _parent: GameStateManager;
    _handler: GameHandler;
    _orderMarkers: RegionPathMarker[] = [];
    _orderAvatars: UnitAvatar[] = [];

    stateType = GameplayStateType.VIEW_ONLY;

    constructor(manager: GameStateManager, handler: GameHandler) {
        this._parent = manager;
        this._handler = handler;
    }

    _displayPendingCommands(set: CommandSet) {
        const { deployments, commands } = set;

        for (let command of commands) {
            const origin = this._handler.getRegion(command.origin);
            const target = this._handler.getRegion(command.target);

            if (!origin || !target) continue;

            // Create marker path between regions
            let pathColor = origin.owner === target.owner ? MOVE_ARROW_COLOR : ATTACK_ARROW_COLOR;
            const marker = new RegionPathMarker(AppContext.stage, origin.visual, target.visual, pathColor);
            marker.setAlpha(0.75);

            // Create avatar to represent 'moving troops'
            const avatar = new UnitAvatar(AppContext.stage, graphics.avatar[origin.owner.avatar], 0x99999c);
            avatar.sprite.alpha = 0.75;
            avatar.sprite.scale.set(1.2, 1.2);
            avatar.setCounter(command.amount);
            avatar.playWalkAnimation(true);

            // Place avatar at halfway point between two regions
            let originCenter = origin.visual.getUnitCenter();
            let targetCenter = target.visual.getUnitCenter();
            let difference = V.subtract(targetCenter, originCenter);
            let direction = V.normalize(difference);
            let newPos = V.add(originCenter, V.multiply(direction, V.norm(difference) / 2));
            avatar.setPosition([newPos[0], newPos[1]]);
            avatar.facePoint(target.visual.getUnitCenter());

            this._orderMarkers.push(marker);
            this._orderAvatars.push(avatar);
        }
    }

    _initializeDisplay() {
        this._parent.clearVisualStyles();

        // Show pending command movement and deployments
        const set = this._handler.getPlayerCommandSets(AppContext.player);
        if (set) this._displayPendingCommands(set);
    }

    _handleNewRound() {
        for (let marker of this._orderMarkers) marker.destroy();
        for (let avatar of this._orderAvatars) avatar.destroy();

        this._initializeDisplay();
        this._parent.resetState(GameplayStateType.DEPLOY);
    }

    activate() {
        this._initializeDisplay();

        // Subscribe to a new round
        this._handler.on(GameStateEvent.NewRoundProcessed, () => this._handleNewRound());
    }

    deactivate() {
        for (let marker of this._orderMarkers) marker.destroy();
        for (let avatar of this._orderAvatars) avatar.destroy();
    }

    dispose() {}

    update(delta: number) {
        for (let avatar of this._orderAvatars) avatar.update(delta);
    }
}
