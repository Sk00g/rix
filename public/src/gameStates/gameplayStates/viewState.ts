import GameHandler from "../../gameData/gameHandler";
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

    activate() {}

    deactivate() {}

    dispose() {}

    update(delta: number) {}
}
