import GameHandler from "../../gameData/gameHandler";
import AppContext from "../../appContext";
import GameStateManager from "../gameStateManager";
import { GameplayStateType } from "../model";
import { IGameState } from "../stateManagerBase";

export default class ViewState implements IGameState {
    _parent: GameStateManager;
    _handler: GameHandler;

    stateType = GameplayStateType.VIEW_ONLY;

    constructor(manager: GameStateManager, handler: GameHandler) {
        this._parent = manager;
        this._handler = handler;
    }

    activate() {
        this._handler.regionVisualLayer.clearAllStyles();

        const { commands, deployments } = this._handler.getPlayerPendingCommands(AppContext.player);
        
        // Reset all region counters
        for (let region of this._handler.allRegions) {
            const deployAmount = deployments.find(dep => dep.target === region.name)?.amount ?? 0;
            region.avatar.setCounter(region.size + deployAmount);
        }

        for (let command of commands) {
        // // Create marker path between regions
        // let pathColor = _origin.owner === _target.owner ? MOVE_ARROW_COLOR : ATTACK_ARROW_COLOR;
        // this._orderMarker = new RegionPathMarker(AppContext.stage, _origin.visual, _target.visual, pathColor);
        // this._orderMarker.setAlpha(0.75);

        // // Create avatar to represent 'moving troops'
        // this._orderAvatar = new UnitAvatar(AppContext.stage, graphics.avatar[_origin.owner.avatar], 0x99999c);
        // this._orderAvatar.sprite.alpha = 0.75;
        // this._orderAvatar.sprite.scale.set(1.2, 1.2);
        // this._orderAvatar.setCounter(_orderCount);
        // this._orderAvatar.playWalkAnimation(true);

        // // Place avatar at halfway point between two regions
        // let originCenter = _origin.visual.getUnitCenter();
        // let targetCenter = _target.visual.getUnitCenter();
        // let difference = V.subtract(targetCenter, originCenter);
        // let direction = V.normalize(difference);
        // let newPos = V.add(originCenter, V.multiply(direction, V.norm(difference) / 2));
        // this._orderAvatar.setPosition([newPos[0], newPos[1]]);
        // this._orderAvatar.facePoint(_target.visual.getUnitCenter());
        }
    }

    deactivate() {}

    dispose() {}

    update(delta: number) {}
}

