import { RegionVisual } from "./../regionLayer";
/*
Concerned only with the visual representation of a path between regions
*/
import * as PIXI from "pixi.js";
import * as V from "../vector.js";
import graphics from "../game_data/graphics.js";
import assetLoader from "../assetLoader.js";

const ARROW_INCREMENT = 28;
const ARROW_SCALE_X = 0.7;
const ARROW_SCALE_Y = 1;
const ORIGIN_OFFSET = [0, 0];

export default class RegionPathMarker {
    _stage: PIXI.Container;
    _arrowContainer: PIXI.Container;
    _isHovering: boolean;
    _texture: PIXI.Texture;

    origin: RegionVisual;
    destination: RegionVisual;
    arrowColor: number;

    constructor(stage: PIXI.Container, origin: RegionVisual, destination: RegionVisual, arrowColor: number = 0x00ff00) {
        this._stage = stage;
        this._arrowContainer = new PIXI.Container();
        this._isHovering = false;
        this._texture = assetLoader.loadTexture(graphics.interface.arrow_gray);

        // Publicly accessible properties
        this.origin = origin;
        this.destination = destination;
        this.arrowColor = arrowColor;

        stage.addChild(this._arrowContainer);
        this._render();
    }

    destroy() {
        this._arrowContainer.destroy();
    }

    setAlpha(newAlpha) {
        this._arrowContainer.alpha = newAlpha;
    }

    _render() {
        this._arrowContainer.removeChildren();

        let difference = V.subtract(this.destination.getUnitCenter(), this.origin.getUnitCenter());
        let distance = V.norm(difference);
        let direction = V.normalize(difference);

        let distanceRemaining = distance;
        let count = 1;
        let origin = V.add(this.origin.getUnitCenter(), ORIGIN_OFFSET);
        while (distanceRemaining > ARROW_INCREMENT * 2) {
            let arrow = new PIXI.Sprite(this._texture);
            arrow.tint = this.arrowColor;
            arrow.scale.set(ARROW_SCALE_X, ARROW_SCALE_Y);
            arrow.anchor.set(0.5, 0.5);
            arrow.rotation = Math.atan2(direction[1], direction[0]);

            let shadow = new PIXI.Sprite(this._texture);
            shadow.tint = 0x000000;
            shadow.anchor.set(0.5, 0.5);
            shadow.alpha = 0.5;
            shadow.scale.set(ARROW_SCALE_X - 0.1, ARROW_SCALE_Y - 0.1);
            shadow.rotation = Math.atan2(direction[1], direction[0]);

            let pos = V.add(origin, V.multiply(direction, ARROW_INCREMENT * count++));
            arrow.position.set(pos[0], pos[1]);
            shadow.position.set(pos[0] + 2, pos[1] + 3);

            this._arrowContainer.addChild(shadow);
            this._arrowContainer.addChild(arrow);

            distanceRemaining -= ARROW_INCREMENT;
        }
    }
}
