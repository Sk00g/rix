import * as PIXI from "pixi.js";
import assetLoader from "../assetLoader";
import graphics from "../gameData/graphics";
import Label from "../sengine/suie/label";
import UnitAvatar from "../sengine/unitAvatar";

const BOX_COLOR = 0xdddddd;
const BOX_SCALE = 2;

export class DiceCounter {
    _stage: PIXI.Container;
    _value: number;
    _avatar: UnitAvatar;
    _box: PIXI.Sprite;
    _label: Label;

    _rolling: boolean = false;
    _rollNumber: number = 0;

    constructor(stage: PIXI.Container, avatar: UnitAvatar) {
        this._stage = stage;
        this._avatar = avatar;

        let counterTexture = assetLoader.loadTexture(graphics.interface.button_frame_white);
        this._box = new PIXI.Sprite(counterTexture);
        this._box.tint = BOX_COLOR;
        this._box.scale.set(BOX_SCALE, BOX_SCALE);
        this._label = new Label("-", [0, 0], 10, "#ffffff");

        let unitX = avatar.getPosition()[0] - (avatar.width / 2) * 1.5;
        let unitY = avatar.getPosition()[1] - (avatar.height / 2) * 1.5;

        this._box.position.set(unitX + 8, unitY - 30);
        this._label.position.set(unitX + 18, unitY - 21);

        stage.addChild(this._box);
        stage.addChild(this._label);
    }

    private _repositionNumber() {
        let unitX = this._avatar.getPosition()[0] - (this._avatar.width / 2) * 1.5;
        let unitY = this._avatar.getPosition()[1] - (this._avatar.height / 2) * 1.5;
        const displayNumber = this._rolling ? this._rollNumber : this._value;
        this._label.position.set(displayNumber < 10 ? unitX + 18 : unitX + 12, unitY - 21);
    }

    public startRoll() {
        this._rolling = true;
    }

    public setNumber(num: number) {
        this._rolling = false;
        this._value = num;
        this._label.text = num.toString();
        this._repositionNumber();
    }

    public update(delta: number) {
        if (this._rolling) {
            this._rollNumber = Math.floor(Math.random() * 20);
            this._label.text = this._rollNumber.toString();
            this._repositionNumber();
        }
    }

    public destroy() {
        this._box.destroy();
        this._label.destroy();
    }
}
