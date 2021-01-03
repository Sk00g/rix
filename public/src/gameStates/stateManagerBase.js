import { logService, LogLevel } from "../logService.js";

export default class StateManagerBase {
    constructor() {
        this._stateStack = [];
    }

    // Must override as this base class is unaware of specific states
    _generateState(type) {
        throw new Error("Must override this function in the child class!");
    }

    // Gets the currently activate state (on top of stack)
    getActiveState() {
        return this._stateStack[this._stateStack.length - 1];
    }

    // Remove all states from the stack and reset to only the given state
    resetState(stateType) {
        while (this.getActiveState()) this.popState();

        this.pushState(stateType);
    }

    // Pop off the top state from current stack
    popState() {
        // Do nothing if the stack is already empty
        if (!this._stateStack) return;

        let currentState = this._stateStack.pop();
        logService(LogLevel.DEBUG, `removing state ${currentState.stateType} from stack`);
        if (currentState.hasOwnProperty("deactivate")) currentState.deactivate();
        if (currentState.hasOwnProperty("dispose")) currentState.dispose();

        let nextState = this.getActiveState();
        if (nextState && nextState.hasOwnProperty("activate")) nextState.activate();
    }

    // Push a new state on top of the current stack
    pushState(stateType) {
        let currentState = this.getActiveState();
        if (currentState && currentState.hasOwnProperty("deactivate")) currentState.deactivate();

        let newState = this._generateState(stateType);
        newState.stateType = stateType;
        console.log(newState);
        if (newState.activate) newState.activate();
        logService(LogLevel.DEBUG, `adding new state ${stateType} to stack`, "STATE");
        this._stateStack.push(newState);
    }
}
