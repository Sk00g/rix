import { GameplayStateType } from "./../model";
import { IGameState } from "./../stateManagerBase";
import { RegionVisual } from "./../../regionLayer";
import * as PIXI from "pixi.js";
import SUIE from "../../sengine/suie/suie";
import AppContext from "../../appContext";
import UnitAvatar from "../../sengine/unitAvatar";
import graphics from "../../gameData/graphics";
import Keyboard from "pixi.js-keyboard";
import GameHandler from "../../gameData/gameHandler";
import StateManagerBase from "../stateManagerBase";
import Region from "../../gameData/region";
import theme from "../../lobby/theme";
import GameStateManager from "../gameStateManager";

const HOVER_FILL = 0x3030f0;

// Weird way of implementing shared state...
let _selectedRegion: Region;

// Will remove these from this file if they get too big
class RegionSelectState implements IGameState {
    _parent: DeployState;
    _handler: GameHandler;

    stateType = GameplayStateType.RegionSelect;

    constructor(parentState: DeployState, gameHandler: GameHandler) {
        this._parent = parentState;
        this._handler = gameHandler;
    }

    update: (delta: number) => void;
    dispose: () => void;

    activate() {
        this._handler.regionVisualLayer.on(
            "mouseEnter",
            (regionVisual: RegionVisual) => {
                this._handler.regionVisualLayer.clearAllStyles();
                let region = this._handler.getRegion(regionVisual.name);
                if (region?.owner.username === AppContext.player.username) {
                    region.avatar.playWalkAnimation();
                    regionVisual.setStyle({ fillAlpha: 0.2, fillColor: HOVER_FILL });
                }
            },
            this
        );

        this._handler.regionVisualLayer.on(
            "mouseExit",
            (regionVisual: RegionVisual) => {
                this._handler.regionVisualLayer.clearAllStyles();
                let region = this._handler.getRegion(regionVisual.name);
                if (region?.owner.username === AppContext.player.username) region.avatar.stopAnimation();
            },
            this
        );

        this._handler.regionVisualLayer.on(
            "leftClick",
            (regionVisual: RegionVisual) => {
                let region = this._handler.getRegion(regionVisual.name);
                if (region?.owner.username === AppContext.player.username) {
                    _selectedRegion = region;
                    this._parent.pushState(GameplayStateType.EditAmount);
                }
            },
            this
        );

        Keyboard.events.on("released", "deployState", (keyCode) => {
            if (keyCode === "Enter") this._parent.pushState(GameplayStateType.Confirm);
        });
    }

    deactivate() {
        this._handler.regionVisualLayer.unsubscribeAll(this);
        Keyboard.events.remove("released", "deployState");
    }
}

class EditAmountState implements IGameState {
    _parent: DeployState;
    _handler: GameHandler;
    _deployAvatar: UnitAvatar;
    _editPanel: any;

    stateType = GameplayStateType.EditAmount;

    constructor(parentState: DeployState, handler: GameHandler) {
        this._parent = parentState;
        this._handler = handler;
    }

    dispose: () => void;

    animateEntry(amount: number) {
        let unitCenter = _selectedRegion.visual.getUnitCenter();

        this._deployAvatar = new UnitAvatar(AppContext.stage, graphics.avatar[_selectedRegion.owner.avatar], 0x99999c);
        this._deployAvatar.sprite.alpha = 0;
        this._deployAvatar.sprite.scale.set(1.2, 1.2);
        this._deployAvatar.setPosition([unitCenter[0] - 80, unitCenter[1] + 8]);
        this._deployAvatar.setCounter(amount);

        this._deployAvatar.walk([unitCenter[0] - 25, unitCenter[1] + 8]);
        this._deployAvatar.fade(0.75, 0.04);
    }

    _handleButton(button: string) {
        switch (button) {
            case "delete":
                this._parent.popState();
                break;
            case "minus":
                this._deployAvatar.setCounter(Math.max(1, this._deployAvatar.getCounter() - 1));
                break;
            case "plus":
                this._deployAvatar.setCounter(
                    Math.min(this._parent.availableArmies, this._deployAvatar.getCounter() + 1)
                );
                break;
            case "max":
                this._deployAvatar.setCounter(this._parent.availableArmies);
                break;
            case "check":
                this._parent.registerDeployment(_selectedRegion, this._deployAvatar.getCounter());
                this._parent.popState();
                break;
        }
    }

    activate() {
        this._handler.regionVisualLayer.clearAllStyles();
        _selectedRegion.visual.setStyle({ fillColor: 0xffffff, fillAlpha: 0.2 });

        let currentAmount = this._parent.getDeployment(_selectedRegion);
        if (!currentAmount) {
            this.animateEntry(1);
        } else {
            this.animateEntry(currentAmount);
            this._parent.unregisterDeployment(_selectedRegion);
        }

        // Create interactive GUI to edit the numbers
        let unitPoint = _selectedRegion.visual.getUnitCenter();
        this._editPanel = new PIXI.Container();
        this._editPanel.position.set(unitPoint[0] - 80, unitPoint[1] + 30);
        AppContext.stage.addChild(this._editPanel);

        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.DELETE,
                [0, 0],
                () => this._handleButton("delete"),
                SUIE.PanelColor.Orange,
                2.0
            )
        );
        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.MINUS,
                [32, 0],
                () => this._handleButton("minus"),
                SUIE.PanelColor.Orange,
                2.0
            )
        );
        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.PLUS,
                [this._editPanel.getChildAt(0).width * 2, 0],
                () => this._handleButton("plus"),
                SUIE.PanelColor.Orange,
                2.0
            )
        );
        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.MAX,
                [this._editPanel.getChildAt(0).width * 3, 0],
                () => this._handleButton("max"),
                SUIE.PanelColor.Orange,
                2.0
            )
        );
        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.CHECK,
                [this._editPanel.getChildAt(0).width * 4, 0],
                () => this._handleButton("check"),
                SUIE.PanelColor.Orange,
                2.0
            )
        );
    }

    deactivate() {
        if (this._deployAvatar) this._deployAvatar.destroy();
        this._handler.regionVisualLayer.clearAllStyles();

        let kids = [...this._editPanel.children];
        for (let child of kids) child.destroy();
        this._editPanel.destroy();

        _selectedRegion.avatar.stopAnimation();
    }

    update(delta: number) {
        if (Keyboard.isKeyDown("Escape")) this._parent.popState();

        if (this._deployAvatar) this._deployAvatar.update(delta);
    }
}

class ConfirmState implements IGameState {
    _parent: DeployState;
    _confirmPanel: any;

    stateType = GameplayStateType.Confirm;

    constructor(parent: DeployState, gameData: GameHandler) {
        this._parent = parent;

        this._confirmPanel = new SUIE.Panel(new PIXI.Rectangle(500, 350, 200, 100));
        this._confirmPanel.addChild(new SUIE.Label("Submit deployment?", [10, 30], 10));
        this._confirmPanel.addChild(new SUIE.TextButton("YES", [60, 60], () => this._confirmAction()));
        this._confirmPanel.addChild(new SUIE.TextButton("NO", [100, 60], () => this._parent.popState()));

        AppContext.stage.addChild(this._confirmPanel);
    }

    update: (delta: number) => void;
    dispose: () => void;

    _confirmAction() {
        this._parent.finalize();
    }

    activate() {
        Keyboard.events.on("released", "deployState", (keyCode) => {
            if (keyCode === "Enter") this._confirmAction();
        });
    }

    deactivate() {
        Keyboard.events.remove("released", "deployState");
        this._confirmPanel.destroy();
    }
}

export default class DeployState extends StateManagerBase implements IGameState {
    _manager: GameStateManager;
    _handler: GameHandler;
    _regionAvatars: { [region: string]: UnitAvatar };
    _regionDeployments: { [region: number]: number };
    _hudInfo = new PIXI.Container();
    _availableLabel: any;
    _spentLabel: any;

    // Publicly accessible by sub-states
    availableArmies: number;
    stateType = GameplayStateType.DEPLOY;

    constructor(manager: GameStateManager, handler: GameHandler) {
        super();

        this._manager = manager;
        this._handler = handler;
        this._regionAvatars = {};
        this._regionDeployments = {};

        this.availableArmies = handler.getReinforcementCount(AppContext.player);

        // Setup HUD according to current game state
        this._hudInfo.position.set(10, 170);
        this._availableLabel = new SUIE.Label(
            `Available Army: ${String(this.availableArmies)}`,
            [0, 0],
            10,
            theme.colors.fontMain
        );
        this._hudInfo.addChild(this._availableLabel);

        this._spentLabel = new SUIE.Label(
            `Deployed: ${String(handler.getReinforcementCount(AppContext.player) - this.availableArmies)}`,
            [0, 20],
            10,
            theme.colors.fontMain
        );
        this._hudInfo.addChild(this._spentLabel);

        manager.hud.addMember(this._hudInfo);

        this.resetState(GameplayStateType.RegionSelect);
    }

    _updateHUD() {
        this._availableLabel.text = `Available Army: ${String(this.availableArmies)}`;
        this._spentLabel.text = `Deployed: ${String(
            this._handler.getReinforcementCount(AppContext.player) - this.availableArmies
        )}`;
    }

    _generateState(type: GameplayStateType): IGameState {
        switch (type) {
            case GameplayStateType.RegionSelect:
                return new RegionSelectState(this, this._handler);
            case GameplayStateType.EditAmount:
                return new EditAmountState(this, this._handler);
            case GameplayStateType.Confirm:
                return new ConfirmState(this, this._handler);
            default:
                throw new Error("invalid state");
        }
    }

    unregisterDeployment(region: Region) {
        if (region.name in this._regionDeployments) {
            this.availableArmies += this._regionDeployments[region.name];
            this._updateHUD();
            delete this._regionDeployments[region.name];
            this._regionAvatars[region.name].destroy();
            delete this._regionAvatars[region.name];
        }
    }

    getDeployment = (region: Region): number => this._regionDeployments[region.name];

    registerDeployment(region: Region, amount: number) {
        this.availableArmies -= amount;
        this._regionDeployments[region.name] = amount;
        this._updateHUD();

        let unitCenter = region.visual.getUnitCenter();
        let avatar = new UnitAvatar(AppContext.stage, graphics.avatar[region.owner.avatar], 0x99999c);
        avatar.sprite.alpha = 0.75;
        avatar.sprite.scale.set(1.2, 1.2);
        avatar.setPosition([unitCenter[0] - 25, unitCenter[1] + 8]);
        avatar.setCounter(amount);
        avatar.playWalkAnimation(true);

        this._regionAvatars[region.name] = avatar;
    }

    activate() {}

    finalize() {
        for (let key in this._regionAvatars) {
            let avatar = this._regionAvatars[key];
            avatar.setCounterVisibility(false);
            avatar.walk([avatar.getPosition()[0] + 25, avatar.getPosition()[1]]);
            avatar.fade(1, 0.1);
        }

        setTimeout(() => {
            for (let name in this._regionDeployments) {
                const region = this._handler.getRegion(name);
                if (!region) throw new Error("Invalid region deployment");
                this._handler.registerDeployment(region, this._regionDeployments[name]);
            }
            this._manager.resetState(GameplayStateType.ORDER);
        }, 400);
    }

    deactivate() {
        for (let key in this._regionAvatars) this._regionAvatars[key].destroy();

        while (this.getActiveState()) this.popState();
    }

    dispose() {
        this._manager.hud.removeMember(this._hudInfo);
        this._hudInfo.destroy();
    }

    update(delta: number) {
        let currentState = this.getActiveState();
        if (currentState && currentState.update) currentState.update(delta);
        for (let key in this._regionAvatars) this._regionAvatars[key].update(delta);
    }
}
