import * as PIXI from "pixi.js";
import * as V from "../../vector.js";
import Mouse from "pixi.js-mouse";
import Keyboard from "pixi.js-keyboard";
import AppContext from "../../appContext";
import RegionPathMarker from "../../sengine/regionPathMarker";
import SUIE from "../../sengine/suie/suie";
import StateManagerBase from "../stateManagerBase";
import UnitAvatar from "../../sengine/unitAvatar";
import graphics from "../../game_data/graphics";

const HOVER_FILL = 0x3030f0;
const OUTLINE_COLOR = 0xa0c0ff;
const ATTACK_ARROW_COLOR = 0xff6060;
const MOVE_ARROW_COLOR = 0x60ff60;

class OrderEdit {
    constructor(parentState, gameData, initData) {
        this.parentState = parentState;
        this.game = gameData;
        this.origin = initData.origin;
        this.target = initData.target;
        this.orderCount = initData.count || this.origin.avatar.getCounter() - 1;

        this._orderAvatar = null;
        this._orderMarker = null;
        this._editPanel = null;

        // This is set to true when we pass the graphics to the parent state to keep displaying
        // This is just a convenience thing to avoid re-creating the avatar and path in parent state
        // when the order is placed, it prevents the this.dispose() method from killing them
        this._preserveGraphics = false;
    }

    _handleButton(type) {
        switch (type) {
            case "delete":
                this.parentState.popState();
                return;
            case "minus":
                this.orderCount = Math.max(1, this.orderCount - 1);
                break;
            case "plus":
                this.orderCount = Math.min(
                    this.parentState.getRegionDisplayCounter(this.origin) - 1,
                    this.orderCount + 1
                );
                break;
            case "max":
                this.orderCount = this.parentState.getRegionDisplayCounter(this.origin) - 1;
                break;
            case "check":
                this._preserveGraphics = true;
                this.parentState.registerOrder(
                    this.origin,
                    this.target,
                    this._orderAvatar.getCounter(),
                    this._orderAvatar,
                    this._orderMarker
                );
                this.parentState.resetState("PRE_SELECT");
                return;
        }
        this._orderAvatar.setCounter(this.orderCount);
        this.origin.avatar.setCounter(
            this.parentState.getRegionDisplayCounter(this.origin) - this.orderCount
        );
    }

    _createEditPanel() {
        // HUD position is dependent on direction of movement
        let hudPos = this._orderAvatar.getPosition();
        let originCenter = this.origin.visual.getUnitCenter();
        let targetCenter = this.target.visual.getUnitCenter();
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
                SUIE.PanelColor.ORANGE,
                2.0
            )
        );
        this._editPanel.addChild(
            new SUIE.IconButton(
                SUIE.IconType.MINUS,
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

    activate() {
        this.game.regionVisualLayer.clearAllStyles();
        this.origin.avatar.setCounter(
            this.parentState.getRegionDisplayCounter(this.origin) - this.orderCount
        );
        this.origin.visual.setStyle({ fillColor: HOVER_FILL, fillAlpha: 0.2 });
        this.target.visual.setStyle({ fillColor: HOVER_FILL, fillAlpha: 0.2 });

        // Create marker path between regions
        let pathColor =
            this.origin.owner === this.target.owner ? MOVE_ARROW_COLOR : ATTACK_ARROW_COLOR;
        this._orderMarker = new RegionPathMarker(
            AppContext.stage,
            this.origin.visual,
            this.target.visual,
            pathColor
        );
        this._orderMarker.setAlpha(0.75);

        // Create avatar to represent 'moving troops'
        this._orderAvatar = new UnitAvatar(
            AppContext.stage,
            graphics.avatar[this.origin.owner.avatarType],
            0x99999c
        );
        this._orderAvatar.sprite.alpha = 0.75;
        this._orderAvatar.sprite.scale.set(1.2, 1.2);
        this._orderAvatar.setCounter(this.orderCount);
        this._orderAvatar.playWalkAnimation(true);

        // Place avatar at halfway point between two regions
        let originCenter = this.origin.visual.getUnitCenter();
        let targetCenter = this.target.visual.getUnitCenter();
        let difference = V.subtract(targetCenter, originCenter);
        let direction = V.normalize(difference);
        let newPos = V.add(originCenter, V.multiply(direction, V.norm(difference) / 2));
        this._orderAvatar.setPosition([newPos[0], newPos[1]]);
        this._orderAvatar.facePoint(this.target.visual.getUnitCenter());

        // Create panel to edit amount of troops moved
        this._createEditPanel();
    }

    deactivate() {
        this.game.regionVisualLayer.clearAllStyles();
        if (!this._preserveGraphics) {
            if (this._orderAvatar) this._orderAvatar.destroy();
            if (this._orderMarker) this._orderMarker.destroy();
        }

        let kids = [...this._editPanel.children];
        for (let child of kids) child.destroy();
        this._editPanel.destroy();
    }

    update(delta) {
        if (this._orderAvatar) this._orderAvatar.update(delta);
    }
}

class TargetSelect {
    constructor(parentState, gameData, initData) {
        this.parentState = parentState;
        this.game = gameData;
        this.selectedRegion = initData.selectedRegion;

        this._pathMarker = null;
        this._hoveredRegion = null;

        // Constants unique to this state
        this.FILL_ALPHA = 0.4;
        this.OUTLINE_ALPHA = 0;
    }

    _handleRegionClick(regionVisual) {
        let region = this.game.getRegion(regionVisual.name);

        if (region === this.selectedRegion) this.parentState.popState();
        else if (region.owner === this.selectedRegion.owner) {
            this.parentState.pushState("ORDER_EDIT", {
                origin: this.selectedRegion,
                target: region,
            });
        } else if (region.owner !== this.selectedRegion.owner) {
            this.parentState.pushState("ORDER_EDIT", {
                origin: this.selectedRegion,
                target: region,
            });
        }
    }

    _handleRegionEnter(regionVisual) {
        let region = this.game.getRegion(regionVisual.name);

        if (!this.game.isRegionBorder(this.selectedRegion, region)) return;

        this._hoveredRegion = region;

        if (this._pathMarker) this._pathMarker.destroy();

        let pathColor =
            region.owner.name === AppContext.playerName ? MOVE_ARROW_COLOR : ATTACK_ARROW_COLOR;
        this._pathMarker = new RegionPathMarker(
            AppContext.stage,
            this.selectedRegion.visual,
            regionVisual,
            pathColor
        );
        region.avatar.playWalkAnimation();
        regionVisual.setStyle({ fillAlpha: 0.2, fillColor: HOVER_FILL });
    }

    _handleRegionExit(regionVisual) {
        this._hoveredRegion = null;
        if (this._pathMarker) this._pathMarker.destroy();
        let region = this.game.getRegion(regionVisual.name);
        if (region !== this.selectedRegion) {
            region.avatar.stopAnimation();
            regionVisual.resetStyle();
        }
    }

    activate() {
        this.selectedRegion.visual.setStyle({
            outlineAlpha: this.OUTLINE_ALPHA,
            fillAlpha: this.FILL_ALPHA,
        });
        this.selectedRegion.avatar.morph(1.6, 0.04);
        this.selectedRegion.avatar.playWalkAnimation(true);

        this.game.regionVisualLayer.on("mouseEnter", (r) => this._handleRegionEnter(r), this);
        this.game.regionVisualLayer.on("mouseExit", (r) => this._handleRegionExit(r), this);
        this.game.regionVisualLayer.on("leftClick", (r) => this._handleRegionClick(r), this);
    }

    deactivate() {
        if (this._pathMarker) this._pathMarker.destroy();
        if (this._hoveredRegion) this._hoveredRegion.avatar.stopAnimation();
        this.selectedRegion.visual.resetStyle();
        this.selectedRegion.avatar.stopAnimation();
        this.selectedRegion.avatar.morph(1.5, 0.04);
        this.game.regionVisualLayer.unsubscribeAll(this);
    }

    update() {}
}

class PreSelectState {
    constructor(parentState, gameData, initData) {
        this.parentState = parentState;
        this.game = gameData;
    }

    _isRegionValid(region) {
        return region.owner.name === AppContext.playerName && region.avatar.getCounter() > 1;
    }

    activate() {
        this.game.regionVisualLayer.on(
            "mouseEnter",
            (regionVisual) => {
                this.game.regionVisualLayer.clearAllStyles();
                let region = this.game.getRegion(regionVisual.name);
                if (this._isRegionValid(region)) {
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
                if (this._isRegionValid(region)) region.avatar.stopAnimation();
            },
            this
        );

        this.game.regionVisualLayer.on(
            "leftClick",
            (regionVisual) => {
                let region = this.game.getRegion(regionVisual.name);
                if (this._isRegionValid(region)) {
                    regionVisual.resetStyle();
                    this.parentState.pushState("TARGET_SELECT", {
                        selectedRegion: region,
                    });
                }
            },
            this
        );

        Keyboard.events.on("released", "orderPreSelectState", (keyCode) => {
            if (keyCode === "Enter") this.parentState.pushState("CONFIRM");
        });
    }

    deactivate() {
        this.game.regionVisualLayer.unsubscribeAll(this);
        Keyboard.events.remove("released", "orderPreSelectState");
    }

    update() {}
}

class ConfirmState {
    constructor(parentState, gameData) {
        this.parentState = parentState;

        this._confirmPanel = new SUIE.Panel(new PIXI.Rectangle(500, 350, 200, 100));
        this._confirmPanel.addChild(new SUIE.Label("Submit orders?", [10, 30], 10));
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

export default class OrderState extends StateManagerBase {
    constructor(manager, gameData, initData = null) {
        super();

        // CONSTANTS
        this.DEFAULT_AVATAR_ALPHA = 0.75;
        this.DEFAULT_MARKER_ALPHA = 0.75;
        this.HOVER_AVATAR_ALPHA = 1.0;
        this.HOVER_MARKER_ALPHA = 1.0;

        this.parentState = manager;
        this._gameData = gameData;
        this._initData = initData;
        this._registeredOrders = {};

        // Graphical flag to avoid twitching numbers during finalize
        this._finalReset = false;

        this.resetState("PRE_SELECT");

        this._hud = new PIXI.Container();
        this._hud.position.set(1000, 20);
        this._regionText = new SUIE.Label("placeholder", [0, 0], 10);
        this._hud.addChild(this._regionText);
        AppContext.stage.addChild(this._hud);

        // Subscribe to hover events for HUD update
        gameData.regionVisualLayer.on(
            "mouseEnter",
            (region) => {
                this._regionText.text = region.name;
            },
            this
        );
    }

    // Sends order and deploy information to server for processing
    transmitTurn() {
        // websocket info
    }

    // Calculate the correct display counter for a region, based on army size and registered orders
    getRegionDisplayCounter(region) {
        let count = region.armySize;
        if (region.name in this._registeredOrders) {
            for (let order of this._registeredOrders[region.name]) count -= order.amount;
        }
        return count;
    }

    unregisterOrder(key, order) {
        order.origin.avatar.setCounter(this.getRegionDisplayCounter(order.origin));
        order.avatar.destroy();
        order.marker.destroy();
        this._registeredOrders[key].splice(this._registeredOrders[key].indexOf(order), 1);
    }

    registerOrder(origin, target, amount, avatar, marker) {
        // Hit box for selecting and edit / delete
        let center = avatar.getPosition();
        let hitbox = [
            V.add(center, [-20, -20]),
            V.add(center, [20, -20]),
            V.add(center, [20, 20]),
            V.add(center, [-20, 20]),
        ];

        if (!(origin.name in this._registeredOrders)) this._registeredOrders[origin.name] = [];
        this._registeredOrders[origin.name].push({
            hitbox: hitbox,
            origin: origin,
            target: target,
            avatar: avatar,
            amount: amount,
            marker: marker,
        });

        origin.avatar.setCounter(this.getRegionDisplayCounter(origin));
    }

    finalize() {
        for (let key in this._registeredOrders) {
            for (let order of this._registeredOrders[key]) {
                order.marker.destroy();
                order.avatar.sprite.alpha = 1.0;
                order.avatar.setCounterVisibility(false);
                order.avatar.morph(1.5, 0.01);
                order.avatar.fade(0, 0.01);
                order.avatar.walk(order.target.visual.getUnitCenter());
            }
        }

        setTimeout(() => {
            for (let key in this._registeredOrders) {
                for (let order of this._registeredOrders[key])
                    this._gameData.registerOrder(order.origin, order.target, order.amount);
            }
            // This will actually send the data to the server
            this._gameData.finishTurn();
            this._finalReset = true;
            this.parentState.resetState("DEPLOY");
        }, 500);
    }

    popState() {
        super.popState();

        // On every state switch, ensure all avatar counters are displaying correctly
        if (!this._finalReset) {
            for (let region of this._gameData.allRegions)
                region.avatar.setCounter(this.getRegionDisplayCounter(region));
        }
    }

    _generateState(type, initData = null) {
        switch (type) {
            case "PRE_SELECT":
                return new PreSelectState(this, this._gameData, initData);
            case "TARGET_SELECT":
                return new TargetSelect(this, this._gameData, initData);
            case "ORDER_EDIT":
                return new OrderEdit(this, this._gameData, initData);
            case "CONFIRM":
                return new ConfirmState(this, this._gameData, initData);
        }
    }

    activate() {
        Mouse.events.on("released", "orderState", (code) => {
            if (code === 2 && this._stateStack.length > 1) this.popState();

            for (let key in this._registeredOrders) {
                for (let order of this._registeredOrders[key]) {
                    if (V.isPointWithinPolygon([Mouse.posLocalX, Mouse.posLocalY], order.hitbox)) {
                        this.unregisterOrder(key, order);
                        this.pushState("ORDER_EDIT", {
                            origin: order.origin,
                            target: order.target,
                            count: order.avatar.getCounter(),
                        });
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

        for (let key in this._registeredOrders)
            this._registeredOrders[key].forEach((order) => {
                order.avatar.destroy();
                order.marker.destroy();
            });

        while (this.getActiveState()) this.popState();
    }

    dispose() {
        this._gameData.regionVisualLayer.unsubscribeAll(this);
        this._hud.destroy();
    }

    update(delta) {
        for (let key in this._registeredOrders) {
            for (let order of this._registeredOrders[key]) {
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
        for (let key in this._registeredOrders) {
            for (let order of this._registeredOrders[key]) order.avatar.update(delta);
        }
    }
}
