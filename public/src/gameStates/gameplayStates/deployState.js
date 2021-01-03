import StateManagerBase from "../stateManagerBase";

export const DeployStateType = Object.freeze({
    REGION_SELECT: "REGION_SELECT",
    EDIT_AMOUNT: "EDIT_AMOUNT",
    CONFIRM: "CONFIRM",
});

// Will remove these from this file if they get too big
class RegionSelectState {
    constructor(gameData) {}

    activate() {
        console.log("setting up activate");
        this._gameData.regionVisuals.on("mouseEnter", (region) => {
            console.log(`Entered region ${region.name}`);
        });
    }
}
class EditAmountState {
    constructor(gameData) {
        console.log("creating edit amount state");
    }
}
class ConfirmState {
    constructor(gameData) {
        console.log("creating confirm state");
    }
}

export default class DeployState extends StateManagerBase {
    constructor(gameData) {
        super();

        this._gameData = gameData;

        // Setup HUD according to deployment state

        this.resetState(DeployStateType.REGION_SELECT);
    }

    _generateState(type) {
        switch (type) {
            case DeployStateType.REGION_SELECT:
                return new RegionSelectState(this._gameData);
            case DeployStateType.EDIT_AMOUNT:
                return new EditAmountState(this._gameData);
            case DeployStateType.CONFIRM:
                return new ConfirmState(this._gameData);
        }
    }

    activate() {}

    deactivate() {}

    dispose() {}

    update(delta) {}
}
