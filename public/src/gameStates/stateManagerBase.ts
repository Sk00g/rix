import { GameState } from "../../../model/gameplay";
import GameHandler from "../gameData/gameHandler";
import { logService, LogLevel } from "../logService";
import { GameplayStateType } from "./model";

export interface IGameState {
    update: (delta: number) => void;
    deactivate: () => void;
    activate: () => void;
    dispose: () => void;
    stateType: GameplayStateType;
}

export default class StateManagerBase {
    _stateStack: IGameState[];

    constructor() {
        this._stateStack = [];
    }

    // Must override as this base class is unaware of specific states
    _generateState(type: GameplayStateType): IGameState {
        throw new Error("Must override this function in the child class!");
    }

    // Gets the currently activate state (on top of stack)
    getActiveState(): IGameState {
        return this._stateStack[this._stateStack.length - 1];
    }

    // Remove all states from the stack and reset to only the given state
    resetState(stateType: GameplayStateType) {
        while (this.getActiveState()) this.popState();

        this.pushState(stateType);
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
    pushState(stateType: GameplayStateType) {
        let currentState = this.getActiveState();
        if (currentState && currentState.deactivate) currentState.deactivate();

        let newState = this._generateState(stateType);
        newState.stateType = stateType;
        if (newState.activate) newState.activate();
        logService(LogLevel.DEBUG, `adding new state ${stateType} to stack`, "STATE");
        this._stateStack.push(newState);
    }
}
