import { RegionVisual, RegionVisualEvent } from "../../gameVisuals/regionLayer";
import { IGameState } from "./../stateManagerBase";
import * as PIXI from "pixi.js";
import * as V from "../../vector";
import Mouse from "pixi.js-mouse";
import Keyboard from "pixi.js-keyboard";
import AppContext from "../../appContext";
import RegionPathMarker from "../../sengine/regionPathMarker";
import SUIE from "../../sengine/suie/suie";
import StateManagerBase from "../stateManagerBase";
import UnitAvatar from "../../sengine/unitAvatar";
import graphics from "../../gameData/graphics";
import { GameplayStateType, IOrder } from "../model";
import GameHandler from "../../gameData/gameDataHandler";
import Region from "../../gameData/region";
import Panel from "../../sengine/suie/panel";
import GameStateManager from "../gameStateManager";
import theme from "../../lobby/theme";

const HOVER_FILL = 0x3030f0;
const OUTLINE_COLOR = 0xa0c0ff;
const ATTACK_ARROW_COLOR = 0xff6060;
const MOVE_ARROW_COLOR = 0x60ff60;

// Shared state among internal states
let _origin: Region;
let _target: Region;
let _orderCount: number;
let _selectedRegion: Region;

class OrderEdit implements IGameState {
    _parent: OrderState;
    _handler: GameHandler;
    _orderAvatar: UnitAvatar;
    _orderMarker: RegionPathMarker;
    _editPanel: any;

    // This is set to true when we pass the graphics to the parent state to keep displaying
    // This is just a convenience thing to avoid re-creating the avatar and path in parent state
    // when the order is placed, it prevents the this.deactivate() method from killing them
    _preserveGraphics = false;

    stateType = GameplayStateType.OrderEdit;

    constructor(parentState: OrderState, handler: GameHandler) {
        this._parent = parentState;
        this._handler = handler;

        _orderCount = 1;
    }

    dispose: () => void;

    _handleButton(type: string) {
        const originTempSize = this._parent.getRegionTempAmount(_origin);
        switch (type) {
            case "delete":
                this._parent.popState();
                _origin.avatar.setCounter(originTempSize);
                return;
            case "minus":
                _orderCount = Math.max(1, _orderCount - 1);
                break;
            case "plus":
                _orderCount = Math.min(originTempSize - 1, _orderCount + 1);
                break;
            case "max":
                _orderCount = originTempSize - 1;
                break;
            case "check":
                this._preserveGraphics = true;
                this._parent.registerOrder(_origin, _target, _orderCount, this._orderAvatar, this._orderMarker);
                this._parent.resetState(GameplayStateType.PreSelect);
                return;
        }
        this._orderAvatar.setCounter(_orderCount);
        _origin.avatar.setCounter(originTempSize - _orderCount);
    }

    _createEditPanel() {
        // HUD position is dependent on direction of movement
        let hudPos = this._orderAvatar.getPosition();
        let originCenter = _origin.visual.getUnitCenter();
        let targetCenter = _target.visual.getUnitCenter();
        let diff = V.subtract(originCenter, targetCenter);
        if (Math.abs(diff[0]) > Math.abs(diff[1])) {
            hudPos[0] -= 60;
            hudPos[1] += 20;
        } else {
            hudPos[0] += 20;
            hudPos[1] -= 20;
        }

        // Create interactive GUI to edit the numbers
        this._editPanel = new PIXI.Container();
        this._editPanel.position.set(hudPos[0], hudPos[1]);
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

    activate() {
        this._handler.clearVisualStyles();
        _origin.avatar.setCounter(this._parent.getRegionTempAmount(_origin) - _orderCount);
        _origin.visual.setStyle({ fillColor: HOVER_FILL, fillAlpha: 0.2 });
        _target.visual.setStyle({ fillColor: HOVER_FILL, fillAlpha: 0.2 });

        // Create marker path between regions
        let pathColor = _origin.owner === _target.owner ? MOVE_ARROW_COLOR : ATTACK_ARROW_COLOR;
        this._orderMarker = new RegionPathMarker(AppContext.stage, _origin.visual, _target.visual, pathColor);
        this._orderMarker.setAlpha(0.75);

        // Create avatar to represent 'moving troops'
        this._orderAvatar = new UnitAvatar(AppContext.stage, graphics.avatar[_origin.owner.avatar], 0x99999c);
        this._orderAvatar.sprite.alpha = 0.75;
        this._orderAvatar.sprite.scale.set(1.2, 1.2);
        this._orderAvatar.setCounter(_orderCount);
        this._orderAvatar.playWalkAnimation(true);

        // Place avatar at halfway point between two regions
        let originCenter = _origin.visual.getUnitCenter();
        let targetCenter = _target.visual.getUnitCenter();
        let difference = V.subtract(targetCenter, originCenter);
        let direction = V.normalize(difference);
        let newPos = V.add(originCenter, V.multiply(direction, V.norm(difference) / 2));
        this._orderAvatar.setPosition([newPos[0], newPos[1]]);
        this._orderAvatar.facePoint(_target.visual.getUnitCenter());

        // Create panel to edit amount of troops moved
        this._createEditPanel();
    }

    deactivate() {
        this._handler.clearVisualStyles();
        if (!this._preserveGraphics) {
            if (this._orderAvatar) this._orderAvatar.destroy();
            if (this._orderMarker) this._orderMarker.destroy();
        }

        let kids = [...this._editPanel.children];
        for (let child of kids) child.destroy();
        this._editPanel.destroy();
    }

    update(delta: number) {
        if (this._orderAvatar) this._orderAvatar.update(delta);
    }
}

class TargetSelect implements IGameState {
    _parent: OrderState;
    _handler: GameHandler;
    _pathMarker: RegionPathMarker;
    _hoveredRegion?: Region;

    stateType = GameplayStateType.TargetSelect;

    readonly FILL_ALPHA = 0.4;
    readonly OUTLINE_ALPHA = 0;

    constructor(parentState: OrderState, handler: GameHandler) {
        this._parent = parentState;
        this._handler = handler;
    }

    dispose: () => void;

    _handleRegionClick(regionVisual: RegionVisual) {
        let region = this._handler.getRegion(regionVisual.name);

        if (region === _selectedRegion) this._parent.popState();
        else {
            _origin = _selectedRegion;
            if (region) _target = region;
            this._parent.pushState(GameplayStateType.OrderEdit);
        }
    }

    _handleRegionEnter(regionVisual: RegionVisual) {
        let region = this._handler.getRegion(regionVisual.name);
        if (!region) throw new Error("Regions are screwed somehow");

        if (!this._handler.isRegionBorder(_selectedRegion, region)) return;

        this._hoveredRegion = region;

        if (this._pathMarker) this._pathMarker.destroy();

        let pathColor = region.owner.username === AppContext.player.username ? MOVE_ARROW_COLOR : ATTACK_ARROW_COLOR;
        this._pathMarker = new RegionPathMarker(AppContext.stage, _selectedRegion.visual, regionVisual, pathColor);
        region.avatar.playWalkAnimation();
        regionVisual.setStyle({ fillAlpha: 0.2, fillColor: HOVER_FILL });
    }

    _handleRegionExit(regionVisual: RegionVisual) {
        this._hoveredRegion = undefined;
        if (this._pathMarker) this._pathMarker.destroy();
        let region = this._handler.getRegion(regionVisual.name);
        if (region !== _selectedRegion) {
            region?.avatar.stopAnimation();
            regionVisual.resetStyle();
        }
    }

    activate() {
        _selectedRegion.visual.setStyle({
            outlineAlpha: this.OUTLINE_ALPHA,
            fillAlpha: this.FILL_ALPHA,
        });
        _selectedRegion.avatar.morph(1.6, 0.04);
        _selectedRegion.avatar.playWalkAnimation(true);

        this._handler.onVisual(RegionVisualEvent.MouseEnter, (r) => this._handleRegionEnter(r), this);
        this._handler.onVisual(RegionVisualEvent.MouseExit, (r) => this._handleRegionExit(r), this);
        this._handler.onVisual(RegionVisualEvent.LeftClick, (r) => this._handleRegionClick(r), this);
    }

    deactivate() {
        if (this._pathMarker) this._pathMarker.destroy();
        if (this._hoveredRegion) this._hoveredRegion.avatar.stopAnimation();
        _selectedRegion.visual.resetStyle();
        _selectedRegion.avatar.stopAnimation();
        _selectedRegion.avatar.morph(1.5, 0.04);
        this._handler.unsubscribeAllVisual(this);
    }

    update() {}
}

class PreSelectState implements IGameState {
    _parent: OrderState;
    _handler: GameHandler;

    stateType = GameplayStateType.PreSelect;

    constructor(parent: OrderState, handler: GameHandler) {
        this._parent = parent;
        this._handler = handler;
    }

    dispose: () => void;

    _isRegionValid(region: Region) {
        return region.owner.username === AppContext.player.username && this._parent.getRegionTempAmount(region) > 1;
    }

    activate() {
        this._handler.onVisual(
            RegionVisualEvent.MouseEnter,
            (regionVisual) => {
                this._handler.clearVisualStyles();
                let region = this._handler.getRegion(regionVisual.name);
                if (region && this._isRegionValid(region)) {
                    region.avatar.playWalkAnimation();
                    regionVisual.setStyle({ fillAlpha: 0.2, fillColor: HOVER_FILL });
                }
            },
            this
        );

        this._handler.onVisual(
            RegionVisualEvent.MouseExit,
            (regionVisual: RegionVisual) => {
                this._handler.clearVisualStyles();
                let region = this._handler.getRegion(regionVisual.name);
                if (region && this._isRegionValid(region)) region.avatar.stopAnimation();
            },
            this
        );

        this._handler.onVisual(
            RegionVisualEvent.LeftClick,
            (regionVisual: RegionVisual) => {
                let region = this._handler.getRegion(regionVisual.name);
                if (region && this._isRegionValid(region)) {
                    regionVisual.resetStyle();
                    _selectedRegion = region;
                    this._parent.pushState(GameplayStateType.TargetSelect);
                }
            },
            this
        );

        Keyboard.events.on("released", "orderPreSelectState", (keyCode) => {
            if (keyCode === "Enter") this._parent.pushState(GameplayStateType.OrderConfirm);
        });
    }

    deactivate() {
        this._handler.unsubscribeAllVisual(this);
        Keyboard.events.remove("released", "orderPreSelectState");
    }

    update() {}
}

class ConfirmState implements IGameState {
    _parent: OrderState;
    _confirmPanel: Panel;

    stateType = GameplayStateType.OrderConfirm;

    constructor(parentState: OrderState, handler: GameHandler) {
        this._parent = parentState;

        this._confirmPanel = new SUIE.Panel(new PIXI.Rectangle(500, 350, 200, 100));
        this._confirmPanel.addChild(new SUIE.Label("Submit orders?", [10, 30], 10));
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
        Keyboard.events.on("released", "orderConfirmState", (keyCode) => {
            if (keyCode === "Enter") this._confirmAction();
        });
    }

    deactivate() {
        Keyboard.events.remove("released", "orderConfirmState");
        this._confirmPanel.destroy();
    }
}

export default class OrderState extends StateManagerBase implements IGameState {
    _parent: GameStateManager;
    _handler: GameHandler;
    _pendingCommands: { [regionName: string]: IOrder[] };
    _hud = new PIXI.Container();
    _regionText: any;

    // Graphical flag to avoid twitching numbers during finalize
    _finalReset = false;

    stateType = GameplayStateType.ORDER;

    readonly DEFAULT_AVATAR_ALPHA = 0.75;
    readonly DEFAULT_MARKER_ALPHA = 0.75;
    readonly HOVER_AVATAR_ALPHA = 1.0;
    readonly HOVER_MARKER_ALPHA = 1.0;

    constructor(manager: GameStateManager, handler: GameHandler) {
        super();

        this._parent = manager;
        this._handler = handler;
        this._pendingCommands = {};

        this.resetState(GameplayStateType.PreSelect);

        this._hud.position.set(10, 170);
        this._regionText = new SUIE.Label("----", [0, 0], 10);
        this._hud.addChild(this._regionText);

        manager.hud.addMember(this._hud);

        // Subscribe to hover events for HUD update
        handler.onVisual(
            RegionVisualEvent.MouseEnter,
            (region: RegionVisual) => {
                this._regionText.text = region.name;
            },
            this
        );
    }

    unregisterOrder(regionName: string, order: IOrder) {
        order.avatar.destroy();
        order.marker.destroy();
        this._pendingCommands[regionName].splice(this._pendingCommands[regionName].indexOf(order), 1);
        const origin = this._handler.getRegion(regionName);
        if (origin) this._updateRegionCounter(origin);
    }

    registerOrder(origin: Region, target: Region, amount: number, avatar: UnitAvatar, marker: RegionPathMarker) {
        // Hit box for selecting and edit / delete
        let center = avatar.getPosition();
        let hitbox = [
            V.add(center, [-20, -20]),
            V.add(center, [20, -20]),
            V.add(center, [20, 20]),
            V.add(center, [-20, 20]),
        ];

        if (!(origin.name in this._pendingCommands)) this._pendingCommands[origin.name] = [];
        this._pendingCommands[origin.name].push({
            hitbox: hitbox,
            origin: origin,
            target: target,
            avatar: avatar,
            amount: amount,
            marker: marker,
        });

        this._updateRegionCounter(origin);
    }

    // Returns the region's size and adjusts for pending commands
    getRegionTempAmount(region: Region): number {
        let tempAmount = region.size;
        const regionCommands = this._pendingCommands[region.name];
        if (regionCommands) for (let cmd of regionCommands) tempAmount -= cmd.amount;
        return tempAmount;
    }

    // This function updates command origin regions to show reduced counters based on the 'pending' orders that
    // would (will) take away from each region
    _updateRegionCounter(region: Region) {
        region.avatar.setCounter(this.getRegionTempAmount(region));
    }

    finalize() {
        // for (let key in this._pendingCommands) {
        //     for (let order of this._pendingCommands[key]) {
        //         order.marker.destroy();
        //         order.avatar.sprite.alpha = 1.0;
        //         order.avatar.setCounterVisibility(false);
        //         order.avatar.morph(1.5, 0.01);
        //         order.avatar.fade(0, 0.01);
        //         order.avatar.walk(order.target.visual.getUnitCenter());
        //     }
        // }

        setTimeout(() => {
            for (let key in this._pendingCommands) {
                for (let order of this._pendingCommands[key])
                    this._handler.registerCommand(AppContext.player.username, order.origin, order.target, order.amount);
            }
            this._finalReset = true;
            this._parent.resetState(GameplayStateType.VIEW_ONLY);

            // This will actually send the data to the server
            this._handler.finishTurn();
        }, 500);
    }

    popState() {
        super.popState();

        // On every state switch, ensure all avatar counters are displaying correctly
        // if (!this._finalReset) this._updateRegionCounter();
    }

    _generateState(type: GameplayStateType): IGameState {
        switch (type) {
            case GameplayStateType.PreSelect:
                return new PreSelectState(this, this._handler);
            case GameplayStateType.TargetSelect:
                return new TargetSelect(this, this._handler);
            case GameplayStateType.OrderEdit:
                return new OrderEdit(this, this._handler);
            case GameplayStateType.OrderConfirm:
                return new ConfirmState(this, this._handler);
            default:
                throw new Error("invalid state");
        }
    }

    activate() {
        Mouse.events.on("released", "orderState", (code) => {
            if (code === 2 && this._stateStack.length > 1) this.popState();

            if (this.getActiveState().stateType === GameplayStateType.OrderEdit) return;

            for (let key in this._pendingCommands) {
                for (let order of this._pendingCommands[key]) {
                    if (V.isPointWithinPolygon([Mouse.posLocalX, Mouse.posLocalY], order.hitbox)) {
                        this.unregisterOrder(key, order);
                        _orderCount = order.amount;
                        _origin = order.origin;
                        _target = order.target;
                        this.pushState(GameplayStateType.OrderEdit);
                    }
                }
            }
        });
        Keyboard.events.on("released", "orderState", (keyCode) => {
            if (keyCode === "Escape" && this._stateStack.length > 1) this.popState();
        });
    }

    deactivate() {
        Mouse.events.remove("released", "orderState");
        Keyboard.events.remove("released", "orderState");

        for (let key in this._pendingCommands)
            this._pendingCommands[key].forEach((order) => {
                order.avatar.destroy();
                order.marker.destroy();
            });

        while (this.getActiveState()) this.popState();
    }

    dispose() {
        this._handler.unsubscribeAllVisual(this);
        this._parent.hud.removeMember(this._hud);
        this._hud.destroy();
    }

    update(delta: number) {
        for (let key in this._pendingCommands) {
            for (let order of this._pendingCommands[key]) {
                if (V.isPointWithinPolygon([Mouse.posLocalX, Mouse.posLocalY], order.hitbox)) {
                    order.avatar.sprite.alpha = this.HOVER_AVATAR_ALPHA;
                    order.marker.setAlpha(this.HOVER_MARKER_ALPHA);
                } else {
                    order.avatar.sprite.alpha = this.DEFAULT_AVATAR_ALPHA;
                    order.marker.setAlpha(this.DEFAULT_MARKER_ALPHA);
                }
            }
        }

        let currentState = this.getActiveState();
        if (currentState && currentState.update) currentState.update(delta);
        for (let key in this._pendingCommands) {
            for (let order of this._pendingCommands[key]) order.avatar.update(delta);
        }
    }
}
