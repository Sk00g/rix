import * as PIXI from "pixi.js";
import * as core from "./core";
import Mouse from "pixi.js-mouse";

class IconButton extends PIXI.Container {
    constructor(iconType, position, action, color = core.PanelColor.BLUE, scale = 1.75) {
        super();

        this._uid = core.UID++;
        this._iconType = iconType;
        this._scale = scale;
        this._color = color;
        this._isPressed = false;
        this._action = action;
        this.position.set(...position);

        this._icon = new PIXI.Sprite(
            new PIXI.Texture(
                PIXI.BaseTexture.from(
                    color === core.PanelColor.BLUE ? core.ICON_PATH_BLUE : core.ICON_PATH_BROWN
                ),
                new PIXI.Rectangle(iconType * 16, 0, 16, 16)
            )
        );
        this._icon.scale.set(scale, scale);
        this.addChild(this._icon);

        this._highlight = new PIXI.Graphics();
        this._highlight.beginFill(0xffffff, 0.15);
        this._highlight.drawRect(2, 2, Math.floor(16 * scale) - 4, Math.floor(16 * scale));
        this._highlight.endFill();
        this._highlight.visible = false;
        this.addChild(this._highlight);

        Mouse.events.on("pressed", this._uid, (code, event) => this._mouseDown(code, event));
        Mouse.events.on("released", this._uid, (code, event) => this._mouseUp(code, event));
    }

    _isPointWithin(x, y) {
        let thisX = this.getGlobalPosition().x;
        let thisY = this.getGlobalPosition().y;
        return x < thisX + this.width && x > thisX && y > thisY && y < thisY + this.height;
    }

    _mouseDown(code, event) {
        let x = Math.floor(event.offsetX / core.RESOLUTION_SCALE);
        let y = Math.floor(event.offsetY / core.RESOLUTION_SCALE);
        if (this._isPointWithin(x, y)) {
            this._isPressed = true;
            this._highlight.visible = true;
        }
    }

    _mouseUp(code, event) {
        if (this._isPressed) {
            let x = Math.floor(event.offsetX / core.RESOLUTION_SCALE);
            let y = Math.floor(event.offsetY / core.RESOLUTION_SCALE);

            this._isPressed = false;
            this._highlight.visible = false;
            if (this._isPointWithin(x, y) && this._action) this._action();
        }
    }

    destroy() {
        Mouse.events.remove("pressed", this._uid);
        Mouse.events.remove("released", this._uid);
        super.destroy();
    }
}

export default IconButton;
