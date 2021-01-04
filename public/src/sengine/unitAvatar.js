import * as PIXI from "pixi.js";
import * as V from "../vector.js";
import * as utils from "./utils.js";
import assetLoader from "../assetLoader.js";
import Label from "./suie/label.js";
import graphics from "../game_data/graphics.js";

const WALK_ANIM_INTERVAL = 11.5;
const ATTACK_ANIM_INTERVAL = 20;
const SCALE = 1.5;
const COUNTER_SCALE = 1.75;
const MIN_MOVE_DISTANCE = 2;
const WALK_SPEED = 2;
const SHAKE_INCREMENT_MAX = 3;

/*
This class is coupled tightly to FinalBossBlue's free character (overworld) tilesheet assets that 
Go in order of down, left, right, up, with the resting or 'stand' animation in the middle
*/

class UnitAvatar {
    constructor(stage, path, nationColor, startRect = new PIXI.Rectangle(0, 2, 26, 36)) {
        this._stage = stage;

        // Copy texture so we can change frame only for this unit
        this._texture = assetLoader.loadTexture(path);

        // Default start frame is facing down stand
        this._direction = "down";
        this._currentFrame = 1;

        // Keep track of active animation properties
        this._animation = null;
        this._looping = false;
        this._animationElapsed = 0;

        // Walk animation properties
        this._targetPosition = null;

        // Slide animation properties
        this._slideTarget = null;
        this._slideSpeed = 1;

        // Shake animation properties
        this._shakeMagnitude = null;
        this._shakeDirection = "right";
        this._shakeOrigin = null;
        this._shakeIncrements = 0;

        // Morph number animation properties
        this._morphNumberTarget = null;
        this._morphNumberSpeed = 0;
        this._morphPreviousSize = [0, 0];

        // Blend number animation properties
        this._blendNumberTarget = null;
        this._blendNumberSpeeds = null;
        this._blendNumberIncrementsRemaining = 0;

        // Fade avatar animation properties
        this._fadeTarget = null;
        this._fadeSpeed = 0;

        // Morph avatar animation properties
        this._morphTarget = null;
        this._morphSpeed = 0;

        let x = startRect.x;
        let y = startRect.y;
        this._position = [x, y];
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
        let counterTexture = assetLoader.loadTexture(graphics.interface.button_frame_white);
        this._counterSprite = new PIXI.Sprite(counterTexture);
        this._counterSprite.tint = nationColor;
        this._counterSprite.scale.set(COUNTER_SCALE, COUNTER_SCALE);
        this._counterLabel = new Label(1, [0, 0], 12, "#ffffff");

        stage.addChild(this.sprite);
        stage.addChild(this._counterSprite);
        stage.addChild(this._counterLabel);
    }

    destroy() {
        this._stage.removeChild(this.sprite);
        this._stage.removeChild(this._counterSprite);
        this._stage.removeChild(this._counterLabel);
    }

    setCounterVisibility(flag) {
        this._counterSprite.visible = flag;
        this._counterLabel.visible = flag;
    }

    getCounter() {
        return this._counter;
    }

    setCounter(newAmount, skipAnimation = false) {
        this._counter = newAmount;
        this._counterLabel.text = newAmount;
        // Perhaps add animation logic in here for changing amount?
    }

    slide(newPosition, speed) {
        this._slideTarget = newPosition;
        this._slideSpeed = speed;
    }

    shake(magnitude) {
        this._shakeMagnitude = magnitude;
        this._shakeDirection = "right";
        this._shakeOrigin = this.getPosition();
        this._shakeIncrements = 0;
    }

    morph(newScale, speed) {
        this._morphTarget = newScale;
        this._morphSpeed = speed;
    }

    morphNumber(newScale, speed) {
        this._morphNumberTarget = newScale;
        this._morphNumberSpeed = speed;
        this._morphPreviousSize = [this._counterLabel.width, this._counterLabel.height];
    }

    blendNumberColor(newColor, increments) {
        this._blendNumberTarget = newColor;
        this._blendNumberIncrementsRemaining = increments;
        let targetColors = utils.RGBFromString(newColor);
        let currentColors = utils.RGBFromString(this._counterLabel.style.fill);

        // Store speeds for R / G / B values separately based on increment
        this._blendNumberSpeeds = {};
        for (let key in targetColors)
            this._blendNumberSpeeds[key] = Math.round(
                (targetColors[key] - currentColors[key]) / increments
            );
    }

    fade(newAlpha, speed) {
        this._fadeTarget = newAlpha;
        this._fadeSpeed = speed;
    }

    playDeathAnimation() {
        this.shake(4);
        setTimeout(() => this.fade(0.01, 0.01), 500);
    }

    playWalkAnimation(loop = true) {
        this._animation = "walk";
        this._looping = loop;
        this._animationElapsed = 0;

        // First frame of walk animation is always 0
        this._currentFrame = 0;
    }

    playAttackAnimation(loop = false) {
        this._animation = "attack";
        this._looping = loop;
        this._animationElapsed = 0;

        this._currentFrame = 0;
    }

    stopAnimation() {
        this._animation = null;
        this._looping = false;
        this._currentFrame = 1;
    }

    facePoint(point) {
        let diffX = point[0] - this.getPosition()[0];
        let diffY = point[1] - this.getPosition()[1];

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

    getPosition() {
        return [...this._position];
    }

    setPosition(position) {
        this._position = [...position];

        let unitX = position[0] - (this.width / 2) * SCALE;
        let unitY = position[1] - (this.height / 2) * SCALE;
        this.sprite.position.set(unitX, unitY);

        if (!this._shakeMagnitude) {
            // TODO - Make these magical numbers based on this._counterLabel.width/height
            this._counterSprite.position.set(unitX - 15, unitY - 15);
            this._counterLabel.position.set(unitX - 7, unitY - 7);
        }
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

    _updateAnimation(delta) {
        // If we are currently animating, check elapsed for frame increase
        if (this._animation) {
            this._animationElapsed += delta;
            if (this._animation === "walk") {
                if (this._animationElapsed >= WALK_ANIM_INTERVAL) {
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
            } else if (this._animation === "attack") {
                if (this._animationElapsed >= ATTACK_ANIM_INTERVAL) {
                    this._animationElapsed = 0;
                    this._currentFrame = this._currentFrame === 1 ? 0 : 1;

                    if (!this._looping) {
                        this._animating = false;
                        this._currentFrame = 1;
                    }
                }
            }
        }
    }

    _updateWalking(delta) {
        // Update position if walking
        if (this._targetPosition) {
            let difference = V.subtract(this._targetPosition, this.getPosition());
            let distanceLeft = V.norm(difference);

            if (distanceLeft < MIN_MOVE_DISTANCE) {
                this.setPosition(this._targetPosition);
                this._targetPosition = null;
                this.stopAnimation();
            } else {
                let direction = V.normalize(difference);
                let newPosition = V.add(
                    this.getPosition(),
                    V.multiply(direction, delta * WALK_SPEED)
                );
                this.setPosition(newPosition);
            }
        }
    }

    _updateSlide(delta) {
        if (this._slideTarget) {
            let difference = V.subtract(this._slideTarget, this.getPosition());
            let distanceLeft = V.norm(difference);

            if (distanceLeft < this._slideSpeed) {
                this.setPosition(this._slideTarget);
                this._slideTarget = null;
            } else {
                let direction = V.normalize(difference);
                let newPosition = V.add(
                    this.getPosition(),
                    V.multiply(direction, delta * this._slideSpeed)
                );
                this.setPosition(newPosition);
            }
        }
    }

    _updateShake(delta) {
        if (this._shakeMagnitude) {
            let sign = this._shakeDirection === "right" ? 1 : -1;
            let newPosition = [
                this.getPosition()[0] + sign * this._shakeMagnitude * delta,
                this.getPosition()[1],
            ];

            this.setPosition(newPosition);

            this._shakeIncrements++;

            if (this._shakeIncrements === SHAKE_INCREMENT_MAX) {
                this._shakeIncrements = -SHAKE_INCREMENT_MAX;
                if (this._shakeDirection === "right") this._shakeDirection = "left";
                else if (this._shakeDirection === "left") this._shakeDirection = "right";
                this._shakeMagnitude -= 0.5;
            }
        }
    }

    _updateMorphNumber() {
        if (this._morphNumberTarget) {
            let sign = this._morphNumberTarget > this._counterLabel.scale.x ? 1 : -1;
            this._counterLabel.scale.x += sign * this._morphNumberSpeed;
            this._counterLabel.scale.y += sign * this._morphNumberSpeed;

            if (
                Math.abs(this._counterLabel.scale.x - this._morphNumberTarget) <
                this._morphNumberSpeed
            ) {
                this._counterLabel.scale.set(this._morphNumberTarget, this._morphNumberTarget);
                this._morphNumberTarget = null;
            }

            // Center
            let diffX = this._counterLabel.width - this._morphPreviousSize[0];
            let diffY = this._counterLabel.height - this._morphPreviousSize[1];

            this._counterLabel.position.x -= diffX / 2;
            this._counterLabel.position.y -= diffY / 2;

            this._morphPreviousSize = [this._counterLabel.width, this._counterLabel.height];
        }
    }

    _updateBlendNumber() {
        if (this._blendNumberTarget) {
            let colors = utils.RGBFromString(this._counterLabel.style._fill);
            for (let key in colors)
                colors[key] = Math.max(
                    Math.min(255, colors[key] + this._blendNumberSpeeds[key]),
                    0
                );
            this._blendNumberIncrementsRemaining--;

            let style = { ...this._counterLabel.style };
            style.fill =
                this._blendNumberIncrementsRemaining === 0
                    ? this._blendNumberTarget
                    : utils.StringFromRGB(colors);

            this._counterLabel.style = style;

            if (this._blendNumberIncrementsRemaining === 0) {
                this._blendNumberTarget = null;
            }
        }
    }

    _updateFade() {
        if (this._fadeTarget) {
            if (Math.abs(this.sprite.alpha - this._fadeTarget) < this._fadeSpeed) {
                this.sprite.alpha = this._fadeTarget;
                this._fadeTarget = null;
            } else {
                let sign = this._fadeTarget > this.sprite.alpha ? 1 : -1;
                this.sprite.alpha += sign * this._fadeSpeed;
            }
        }
    }

    _updateMorph() {
        if (this._morphTarget) {
            let sign = this._morphTarget > this.sprite.scale.x ? 1 : -1;
            this.sprite.scale.x += sign * this._morphSpeed;
            this.sprite.scale.y += sign * this._morphSpeed;

            if (Math.abs(this.sprite.scale.x - this._morphTarget) < this._morphSpeed) {
                this.sprite.scale.set(this._morphTarget, this._morphTarget);
                this._morphTarget = null;
            }
        }
    }

    update(delta) {
        this._updateAnimation(delta);
        this._updateWalking(delta);
        this._updateSlide(delta);
        this._updateShake(delta);
        this._updateMorph();
        this._updateFade();
        this._updateMorphNumber();
        this._updateBlendNumber();

        // Ensure we are displaying the correct frame
        this._texture.frame = this._frames[this._direction][this._currentFrame];
    }
}

export default UnitAvatar;
