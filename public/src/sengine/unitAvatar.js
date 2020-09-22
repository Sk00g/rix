import * as PIXI from "pixi.js";

const ANIM_INTERVAL = 11.5;
const SCALE = 1.0;

/*
This class is coupled tightly to FinalBossBlue's free character (overworld) tilesheet assets that 
Go in order of down, left, right, up, with the resting or 'stand' animation in the middle
*/

class UnitAvatar {
    constructor(path, startRect = new PIXI.Rectangle(0, 2, 26, 36)) {
        // Copy texture so we can change frame only for this unit
        this._texture = new PIXI.Texture(PIXI.BaseTexture.from(path));

        // Default start frame is facing down stand
        this._direction = "down";
        this._currentFrame = 1;

        // Keep track of active animation properties
        this._animating = false;
        this._looping = false;
        this._animationElapsed = 0;

        let x = startRect.x;
        let y = startRect.y;
        let width = startRect.width;
        let height = startRect.height;

        this._frames = {
            down: [
                new PIXI.Rectangle(x, y, width, height),
                new PIXI.Rectangle(x + width, y, width, height),
                new PIXI.Rectangle(x + width * 2, y, width, height),
                new PIXI.Rectangle(x + width, y, width, height),
            ],
            left: [
                new PIXI.Rectangle(x, y + height, width, height),
                new PIXI.Rectangle(x + width, y + height, width, height),
                new PIXI.Rectangle(x + width * 2, y + height, width, height),
                new PIXI.Rectangle(x + width, y + height, width, height),
            ],
            right: [
                new PIXI.Rectangle(x, y + height * 2, width, height),
                new PIXI.Rectangle(x + width, y + height * 2, width, height),
                new PIXI.Rectangle(x + width * 2, y + height * 2, width, height),
                new PIXI.Rectangle(x + width, y + height * 2, width, height),
            ],
            up: [
                new PIXI.Rectangle(x, y + height * 3, width, height),
                new PIXI.Rectangle(x + width, y + height * 3, width, height),
                new PIXI.Rectangle(x + width * 2, y + height * 3, width, height),
                new PIXI.Rectangle(x + width, y + height * 3, width, height),
            ],
        };

        this._texture.frame = this._frames[this._direction][this._currentFrame];

        // Publicly accessible sprite
        this.sprite = new PIXI.Sprite(this._texture);
        this.sprite.scale.set(SCALE, SCALE);
    }

    playWalkAnimation(loop = true) {
        this._animating = true;
        this._looping = loop;
        this._animationElapsed = 0;

        // First frame of walk animation is always 0
        this._currentFrame = 0;
    }

    stopAnimation() {
        this._animating = false;
        this._looping = false;
        this._currentFrame = 1;
    }

    setDirection(direction) {
        if (!["down", "right", "left", "up"].includes(direction)) {
            throw new Error(`Invalid direction '{direction}'`);
        }

        this._direction = direction;
    }

    getDirection() {
        return this._direction;
    }

    update(delta) {
        // If we are currently animating, check elapsed for frame increase
        if (this._animating) {
            this._animationElapsed += delta;
            if (this._animationElapsed >= ANIM_INTERVAL) {
                this._animationElapsed = 0;
                this._currentFrame++;
                if (this._currentFrame > 3) {
                    if (this._looping) this._currentFrame = 0;
                    else {
                        this._currentFrame = 1;
                        this._animating = false;
                    }
                }
            }
        }

        // Ensure we are displaying the correct frame
        this._texture.frame = this._frames[this._direction][this._currentFrame];
    }
}

export default UnitAvatar;
