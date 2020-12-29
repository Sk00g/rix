import * as PIXI from "pixi.js";
import Label from "./suie/label.js";

const ANIM_INTERVAL = 11.5;
const SCALE = 1.0;
const COUNTER_SCALE = 1.5;
const COUNTER_PATH = "graphics/ui/source/16x16/Set1/Set1-1.png";

/*
This class is coupled tightly to FinalBossBlue's free character (overworld) tilesheet assets that 
Go in order of down, left, right, up, with the resting or 'stand' animation in the middle
*/

class UnitAvatar {
    constructor(stage, path, startRect = new PIXI.Rectangle(0, 2, 26, 36)) {
        // Copy texture so we can change frame only for this unit
        this._texture = new PIXI.Texture(PIXI.BaseTexture.from(path));

        // Default start frame is facing down stand
        this._direction = "down";
        this._currentFrame = 1;

        // Keep track of active animation properties
        this._animating = false;
        this._looping = false;
        this._animationElapsed = 0;

        // Walk animation properties
        this._targetPosition = null;

        let x = startRect.x;
        let y = startRect.y;
        this.width = startRect.width;
        this.height = startRect.height;

        this._frames = {
            down: [
                new PIXI.Rectangle(x, y, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y, this.width, this.height),
                new PIXI.Rectangle(x + this.width * 2, y, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y, this.width, this.height),
            ],
            left: [
                new PIXI.Rectangle(x, y + this.height, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y + this.height, this.width, this.height),
                new PIXI.Rectangle(x + this.width * 2, y + this.height, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y + this.height, this.width, this.height),
            ],
            right: [
                new PIXI.Rectangle(x, y + this.height * 2, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y + this.height * 2, this.width, this.height),
                new PIXI.Rectangle(
                    x + this.width * 2,
                    y + this.height * 2,
                    this.width,
                    this.height
                ),
                new PIXI.Rectangle(x + this.width, y + this.height * 2, this.width, this.height),
            ],
            up: [
                new PIXI.Rectangle(x, y + this.height * 3, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y + this.height * 3, this.width, this.height),
                new PIXI.Rectangle(
                    x + this.width * 2,
                    y + this.height * 3,
                    this.width,
                    this.height
                ),
                new PIXI.Rectangle(x + this.width, y + this.height * 3, this.width, this.height),
            ],
        };

        this._texture.frame = this._frames[this._direction][this._currentFrame];

        // Publicly accessible sprite
        this.sprite = new PIXI.Sprite(this._texture);
        this.sprite.scale.set(SCALE, SCALE);

        // Create the amount counter
        let counterTexture = new PIXI.Texture(PIXI.BaseTexture.from(COUNTER_PATH));
        this._counterSprite = new PIXI.Sprite(counterTexture);
        this._counterSprite.scale.set(COUNTER_SCALE, COUNTER_SCALE);
        this._counterLabel = new Label(Math.floor(Math.random() * 6), [0, 0], 8, "#ffffff");

        stage.addChild(this.sprite);
        stage.addChild(this._counterSprite);
        stage.addChild(this._counterLabel);
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

    facePoint(point) {
        let diffX = point[0] - this.sprite.position.x;
        let diffY = point[1] - this.sprite.position.y;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX < 0) {
                this.setDirection("left");
            } else if (diffX > 0) {
                this.setDirection("right");
            }
        } else {
            if (diffY < 0) {
                this.setDirection("up");
            } else if (diffY > 0) {
                this.setDirection("down");
            }
        }
    }

    walk(newPosition) {
        this._targetPosition = newPosition;
        this.playWalkAnimation();
        this.facePoint(newPosition);
    }

    setPosition(position) {
        let unitX = position[0] - this.width / 2;
        let unitY = position[1] - this.height / 2;
        this.sprite.position.set(unitX, unitY);
        this._counterSprite.position.set(unitX - 15, unitY - 15);
        this._counterLabel.position.set(unitX - 7, unitY - 7);
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

        // Update position if walking
        // spos = start.get_position()
        // epos = end.get_position()
        // return math.sqrt((spos[0] - epos[0]) * (spos[0] - epos[0]) + (spos[1] - epos[1]) * (spos[1] - epos[1]))
        if (this._targetPosition) {
            // direction
            // distacne ->  delta * WALK_SPEED
            // apply direction * distance to position vector
        }

        // Ensure we are displaying the correct frame
        this._texture.frame = this._frames[this._direction][this._currentFrame];
    }
}

export default UnitAvatar;
