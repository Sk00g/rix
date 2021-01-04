import * as PIXI from "pixi.js";
import SUIE from "../../sengine/suie/suie.js";
import StateManagerBase from "../stateManagerBase";
import AppContext from "../../appContext.js";
import UnitAvatar from "../../sengine/unitAvatar";
import graphics from "../../game_data/graphics";
import Keyboard from "pixi.js-keyboard";

export const DeployStateType = Object.freeze({
    REGION_SELECT: "REGION_SELECT",
    EDIT_AMOUNT: "EDIT_AMOUNT",
    CONFIRM: "CONFIRM",
});

const HOVER_FILL = 0x3030f0;

// Will remove these from this file if they get too big
class RegionSelectState {
    constructor(parentState, gameData) {
        this.parentState = parentState;
        this.game = gameData;
    }

    activate() {
        this.game.regionVisualLayer.on(
            "mouseEnter",
            (regionVisual) => {
                this.game.regionVisualLayer.clearAllStyles();
                let region = this.game.getRegion(regionVisual.name);
                if (region.owner.name === AppContext.playerName) {
                    region.avatar.playWalkAnimation();
                    regionVisual.setStyle({ fillAlpha: 0.2, fillColor: HOVER_FILL });
                }
            },
            this
        );

        this.game.regionVisualLayer.on(
            "mouseExit",
            (regionVisual) => {
                this.game.regionVisualLayer.clearAllStyles();
                let region = this.game.getRegion(regionVisual.name);
                if (region.owner.name === AppContext.playerName) region.avatar.stopAnimation();
            },
            this
        );

        this.game.regionVisualLayer.on(
            "leftClick",
            (regionVisual) => {
                let region = this.game.getRegion(regionVisual.name);
                if (region.owner.name === AppContext.playerName)
                    this.parentState.pushState(DeployStateType.EDIT_AMOUNT, {
                        selectedRegion: region,
                    });
            },
            this
        );

        Keyboard.events.on("released", "deployState", (keyCode) => {
            if (keyCode === "Enter") this.parentState.pushState(DeployStateType.CONFIRM);
        });
    }

    deactivate() {
        this.game.regionVisualLayer.unsubscribeAll(this);
        Keyboard.events.remove("released", "deployState");
    }
}

class EditAmountState {
    constructor(parentState, gameData, initData) {
        this.parentState = parentState;
        this.game = gameData;
        this.selectedRegion = initData.selectedRegion;

        this._deployAvatar = null;
        this._editPanel = null;
    }

    animateEntry() {
        let unitCenter = this.selectedRegion.visual.getUnitCenter();

        this._deployAvatar = new UnitAvatar(
            AppContext.stage,
            graphics.avatar[this.selectedRegion.owner.avatarType],
            0x99999c
        );
        this._deployAvatar.sprite.alpha = 0;
        this._deployAvatar.sprite.scale.set(1.2, 1.2);
        this._deployAvatar.setPosition([unitCenter[0] - 80, unitCenter[1] + 8]);
        this._deployAvatar.setCounter(1);

        this._deployAvatar.walk([unitCenter[0] - 25, unitCenter[1] + 8]);
        this._deployAvatar.fade(0.75, 0.04);
    }

    _handleButton(button) {
        switch (button) {
            case "delete":
                this.parentState.popState();
                break;
            case "minus":
                this._deployAvatar.setCounter(Math.max(1, this._deployAvatar.getCounter() - 1));
                break;
            case "plus":
                this._deployAvatar.setCounter(
                    Math.min(this.parentState.availableArmies, this._deployAvatar.getCounter() + 1)
                );
                break;
            case "max":
                this._deployAvatar.setCounter(this.parentState.availableArmies);
                break;
            case "check":
                this.parentState.registerDeployment(
                    this.selectedRegion,
                    this._deployAvatar.getCounter()
                );
                this.parentState.popState();
                break;
        }
    }

    activate() {
        this.game.regionVisualLayer.clearAllStyles();
        this.selectedRegion.visual.setStyle({ fillColor: 0xffffff, fillAlpha: 0.2 });

        // Default deploy amount is hardcoded to 1 for now... user config later?
        this.animateEntry();

        // Create interactive GUI to edit the numbers
        let unitPoint = this.selectedRegion.visual.getUnitCenter();
        this._editPanel = new PIXI.Container();
        this._editPanel.position.set(unitPoint[0] - 80, unitPoint[1] + 30);
        AppContext.stage.addChild(this._editPanel);

        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.DELETE,
                [0, 0],
                () => this._handleButton("delete"),
                SUIE.PanelColor.ORANGE,
                2.0
            )
        );
        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.MINUS,
                // [this._editPanel.getChildAt(0).width, 0],
                [32, 0],
                () => this._handleButton("minus"),
                SUIE.PanelColor.ORANGE,
                2.0
            )
        );
        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.PLUS,
                [this._editPanel.getChildAt(0).width * 2, 0],
                () => this._handleButton("plus"),
                SUIE.PanelColor.ORANGE,
                2.0
            )
        );
        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.MAX,
                [this._editPanel.getChildAt(0).width * 3, 0],
                () => this._handleButton("max"),
                SUIE.PanelColor.ORANGE,
                2.0
            )
        );
        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.CHECK,
                [this._editPanel.getChildAt(0).width * 4, 0],
                () => this._handleButton("check"),
                SUIE.PanelColor.ORANGE,
                2.0
            )
        );
    }

    deactivate() {
        if (this._deployAvatar) this._deployAvatar.destroy();
        this.game.regionVisualLayer.clearAllStyles();

        let kids = [...this._editPanel.children];
        for (let child of kids) child.destroy();
        this._editPanel.destroy();

        this.selectedRegion.avatar.stopAnimation();
    }

    update(delta) {
        if (Keyboard.isKeyDown("Escape")) this.parentState.popState();

        if (this._deployAvatar) this._deployAvatar.update(delta);
    }
}

class ConfirmState {
    constructor(parentState, gameData) {
        this.parentState = parentState;

        this._confirmPanel = new SUIE.Panel(new PIXI.Rectangle(500, 350, 200, 100));
        this._confirmPanel.addChild(new SUIE.Label("Submit deployment?", [10, 30], 10));
        this._confirmPanel.addChild(
            new SUIE.TextButton("YES", [60, 60], () => this._confirmAction())
        );
        this._confirmPanel.addChild(
            new SUIE.TextButton("NO", [100, 60], () => this.parentState.popState())
        );

        AppContext.stage.addChild(this._confirmPanel);
    }

    _confirmAction() {
        this.parentState.finalize();
    }

    activate() {}

    deactivate() {
        this._confirmPanel.destroy();
    }
}

export default class DeployState extends StateManagerBase {
    constructor(manager, gameData, initData = null) {
        super();

        this.parentState = manager;
        this._gameData = gameData;
        this._registerAvatars = [];
        this._registeredDeployments = {};

        // Publicly accessible by sub-states
        this.availableArmies = gameData.getReinforcementCount(
            gameData.getPlayer(AppContext.playerName)
        );

        // Setup HUD according to current game state
        this._hudInfo = new PIXI.Container();
        this._hudInfo.position.set(1000, 20);
        this._reinforcementCounter = new SUIE.Label(this.availableArmies, [0, 0], 12);
        this._hudInfo.addChild(this._reinforcementCounter);

        AppContext.stage.addChild(this._hudInfo);

        this.resetState(DeployStateType.REGION_SELECT);
    }

    _generateState(type, initData = null) {
        switch (type) {
            case DeployStateType.REGION_SELECT:
                return new RegionSelectState(this, this._gameData, initData);
            case DeployStateType.EDIT_AMOUNT:
                return new EditAmountState(this, this._gameData, initData);
            case DeployStateType.CONFIRM:
                return new ConfirmState(this, this._gameData, initData);
        }
    }

    unregisterDeployment() {}

    registerDeployment(region, amount) {
        this.availableArmies -= amount;
        this._registeredDeployments[region.name] = amount;
        this._reinforcementCounter.text = this.availableArmies;

        let unitCenter = region.visual.getUnitCenter();
        let avatar = new UnitAvatar(
            AppContext.stage,
            graphics.avatar[region.owner.avatarType],
            0x99999c
        );
        avatar.sprite.alpha = 0.75;
        avatar.sprite.scale.set(1.2, 1.2);
        avatar.setPosition([unitCenter[0] - 25, unitCenter[1] + 8]);
        avatar.setCounter(amount);
        avatar.playWalkAnimation(true);

        this._registerAvatars.push(avatar);
    }

    activate() {}

    finalize() {
        for (let avatar of this._registerAvatars) {
            avatar.setCounterVisibility(false);
            avatar.walk([avatar.getPosition()[0] + 25, avatar.getPosition()[1]]);
            avatar.fade(1, 0.1);
        }

        setTimeout(() => {
            for (let name in this._registeredDeployments)
                this._gameData.updateArmySize(
                    this._gameData.getRegion(name),
                    this._registeredDeployments[name]
                );
            this.parentState.resetState("ORDER");
        }, 400);
    }

    deactivate() {
        this._hudInfo.destroy();
        for (let avatar of this._registerAvatars) avatar.destroy();

        while (this.getActiveState()) this.popState();
    }

    update(delta) {
        let currentState = this.getActiveState();
        if (currentState && currentState.update) currentState.update(delta);
        for (let avatar of this._registerAvatars) avatar.update(delta);
    }
}
