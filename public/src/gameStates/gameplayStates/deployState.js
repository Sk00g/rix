import StateManagerBase from "../stateManagerBase";

export const DeployStateType = Object.freeze({
    REGION_SELECT: "REGION_SELECT",
    EDIT_AMOUNT: "EDIT_AMOUNT",
    CONFIRM: "CONFIRM",
});

// Will remove these from this file if they get too big
class RegionSelectState {
    constructor(gameData) {
        this._gameData = gameData;
        this.regionLayer = this._gameData.regionVisuals;
    }

    activate() {
        this._gameData.regionVisuals.on("mouseEnter", (region) => {
            this.regionLayer.clearAllStyles();
            region.setStyle({ fillAlpha: 0.25 });
        });

        this._gameData.regionVisuals.on("mouseExit", (region) => {
            this.regionLayer.clearAllStyles();
        });
    }

    update() {}
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

    update(delta) {
        let currentState = this.getActiveState();
        if (currentState && currentState.update) currentState.update(delta);
    }
}
