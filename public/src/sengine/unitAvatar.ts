import { Direction, Animation, Point } from "./model";
import * as PIXI from "pixi.js";
import * as V from "../vector";
import * as utils from "./utils";
import assetLoader from "../assetLoader";
import Label from "./suie/label";
import graphics from "../gameData/graphics";
import { NationColor } from "../../../model/enums";

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
    _stage: PIXI.Container;
    _texture: PIXI.Texture;
    _position: Point;
    _frames: {
        [Direction.Left]: PIXI.Rectangle[];
        [Direction.Right]: PIXI.Rectangle[];
        [Direction.Up]: PIXI.Rectangle[];
        [Direction.Down]: PIXI.Rectangle[];
    };
    _counterSprite: PIXI.Sprite;
    _counterLabel: Label;
    _counter = 0;

    // Default start frame is facing down stand
    _direction = Direction.Down;
    _currentFrame = 1;

    // Keep track of active animation properties
    _animation: Animation = Animation.Stand;
    _animating = false;
    _looping = false;
    _forceLoop = false;
    _animationElapsed = 0;

    // Walk animation properties
    _targetPosition?: Point;

    // Slide animation properties
    _slideTarget?: Point;
    _slideSpeed = 1;

    // Shake animation properties
    _shakeMagnitude?: number;
    _shakeDirection: Direction = Direction.Right;
    _shakeOrigin?: Point;
    _shakeIncrements = 0;

    // Morph number animation properties
    _morphNumberTarget?: number = undefined;
    _morphNumberSpeed = 0;
    _morphPreviousSize = [0, 0];

    // Blend number animation properties
    _blendNumberTarget?: number;
    _blendNumberSpeeds: any = null;
    _blendNumberIncrementsRemaining = 0;

    // Fade avatar animation properties
    _fadeTarget?: number;
    _fadeSpeed = 0;

    // Morph avatar animation properties
    _morphTarget?: number;
    _morphSpeed = 0;

    // Public properties
    width = 0;
    height = 0;
    sprite: PIXI.Sprite;

    constructor(
        stage: PIXI.Container,
        path: string,
        nationColor: NationColor,
        startRect = new PIXI.Rectangle(0, 2, 26, 36)
    ) {
        this._stage = stage;

        // Copy texture so we can change frame only for this unit
        this._texture = assetLoader.loadTexture(path);

        let x = startRect.x;
        let y = startRect.y;
        this._position = [x, y];
        this.width = startRect.width;
        this.height = startRect.height;

        this._frames = {
            [Direction.Down]: [
                new PIXI.Rectangle(x, y, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y, this.width, this.height),
                new PIXI.Rectangle(x + this.width * 2, y, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y, this.width, this.height),
            ],
            [Direction.Left]: [
                new PIXI.Rectangle(x, y + this.height, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y + this.height, this.width, this.height),
                new PIXI.Rectangle(x + this.width * 2, y + this.height, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y + this.height, this.width, this.height),
            ],
            [Direction.Right]: [
                new PIXI.Rectangle(x, y + this.height * 2, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y + this.height * 2, this.width, this.height),
                new PIXI.Rectangle(x + this.width * 2, y + this.height * 2, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y + this.height * 2, this.width, this.height),
            ],
            [Direction.Up]: [
                new PIXI.Rectangle(x, y + this.height * 3, this.width, this.height),
                new PIXI.Rectangle(x + this.width, y + this.height * 3, this.width, this.height),
                new PIXI.Rectangle(x + this.width * 2, y + this.height * 3, this.width, this.height),
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
        this._counterLabel = new Label("1", [0, 0], 10, "#ffffff");

        stage.addChild(this.sprite);
        stage.addChild(this._counterSprite);
        stage.addChild(this._counterLabel);
    }

    destroy() {
        this._stage.removeChild(this.sprite);
        this._stage.removeChild(this._counterSprite);
        this._stage.removeChild(this._counterLabel);
    }

    setCounterVisibility(flag: boolean) {
        this._counterSprite.visible = flag;
        this._counterLabel.visible = flag;
    }

    getCounter(): number {
        return this._counter;
    }

    setCounter(newAmount: number) {
        this._counter = newAmount;
        this._counterLabel.text = String(newAmount);
        this._resetCounterPosition();
    }

    slide(newPosition: Point, speed: number) {
        this._slideTarget = newPosition;
        this._slideSpeed = speed;
    }

    shake(magnitude: number) {
        this._shakeMagnitude = magnitude;
        this._shakeDirection = Direction.Right;
        this._shakeOrigin = this.getPosition();
        this._shakeIncrements = 0;
    }

    morph(newScale: number, speed: number) {
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
            this._blendNumberSpeeds[key] = Math.round((targetColors[key] - currentColors[key]) / increments);
    }

    fade(newAlpha: number, speed: number) {
        this._fadeTarget = newAlpha;
        this._fadeSpeed = speed;
    }

    playDeathAnimation() {
        this.shake(4);
        setTimeout(() => this.fade(0.01, 0.01), 500);
    }

    // Called externally for permanent walking
    playWalkAnimation(permanent = false) {
        this._animation = Animation.Walk;
        if (permanent) this._forceLoop = true;
        else this._looping = true;
        this._animationElapsed = 0;

        // First frame of walk animation is always 0
        this._currentFrame = 0;
    }

    // Private method for walk animation caused by walk command
    _innerWalkAnimation() {
        this._animation = Animation.Walk;
        this._looping = true;
        this._animationElapsed = 0;

        // First frame of walk animation is always 0
        this._currentFrame = 0;
    }

    playAttackAnimation(loop = false) {
        this._animation = Animation.Attack;
        this._looping = loop;
        this._animationElapsed = 0;

        this._currentFrame = 0;
    }

    stopAnimation() {
        if (this._forceLoop) return;
        this._animation = Animation.Stand;
        this._looping = false;
        this._currentFrame = 1;
    }

    facePoint(point) {
        let diffX = point[0] - this.getPosition()[0];
        let diffY = point[1] - this.getPosition()[1];

        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX < 0) {
                this.setDirection(Direction.Left);
            } else if (diffX > 0) {
                this.setDirection(Direction.Right);
            }
        } else {
            if (diffY < 0) {
                this.setDirection(Direction.Up);
            } else if (diffY > 0) {
                this.setDirection(Direction.Down);
            }
        }
    }

    // Returns milliseconds
    calculateWalkDuration(newPosition: Point): number {
        const dist = V.distanceBetween(this.getPosition(), newPosition);
        return Math.floor(dist * 9);
    }

    walk(newPosition: Point) {
        this._targetPosition = newPosition;
        this.playWalkAnimation();
        this.facePoint(newPosition);
    }

    getPosition(): Point {
        return [...this._position];
    }

    setPosition(position: Point) {
        this._position = [...position];

        let unitX = position[0] - (this.width / 2) * SCALE;
        let unitY = position[1] - (this.height / 2) * SCALE;
        this.sprite.position.set(unitX, unitY);

        if (!this._shakeMagnitude) {
            this._resetCounterPosition();
        }
    }

    setDirection(direction: Direction) {
        if (![Direction.Down, Direction.Right, Direction.Left, Direction.Up].includes(direction)) {
            throw new Error(`Invalid direction '{direction}'`);
        }

        this._direction = direction;
    }

    getDirection() {
        return this._direction;
    }

    _resetCounterPosition() {
        let unitX = this._position[0] - (this.width / 2) * SCALE;
        let unitY = this._position[1] - (this.height / 2) * SCALE;

        this._counterSprite.position.set(unitX - 15, unitY - 15);
        this._counterLabel.position.set(this._counter < 10 ? unitX - 6 : unitX - 12, unitY - 7);
    }

    _updateAnimation(delta) {
        // If we are currently animating, check elapsed for frame increase
        if (this._animation) {
            this._animationElapsed += delta;
            if (this._animation === Animation.Walk) {
                if (this._animationElapsed >= WALK_ANIM_INTERVAL) {
                    this._animationElapsed = 0;
                    this._currentFrame++;
                    if (this._currentFrame > 3) {
                        this._currentFrame = 0;
                    }
                }
            } else if (this._animation === Animation.Attack) {
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
                this._targetPosition = undefined;
                this.stopAnimation();
            } else {
                let direction = V.normalize(difference);
                let newPosition = V.add(this.getPosition(), V.multiply(direction, delta * WALK_SPEED));
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
                this._slideTarget = undefined;
            } else {
                let direction = V.normalize(difference);
                let newPosition = V.add(this.getPosition(), V.multiply(direction, delta * this._slideSpeed));
                this.setPosition(newPosition);
            }
        }
    }

    _updateShake(delta) {
        if (this._shakeMagnitude) {
            let sign = this._shakeDirection === Direction.Right ? 1 : -1;
            let newPosition: Point = [
                this.getPosition()[0] + sign * this._shakeMagnitude * delta,
                this.getPosition()[1],
            ];

            this.setPosition(newPosition);

            this._shakeIncrements++;

            if (this._shakeIncrements === SHAKE_INCREMENT_MAX) {
                this._shakeIncrements = -SHAKE_INCREMENT_MAX;
                if (this._shakeDirection === Direction.Right) this._shakeDirection = Direction.Left;
                else if (this._shakeDirection === Direction.Left) this._shakeDirection = Direction.Right;
                this._shakeMagnitude -= 0.5;
            }
        }
    }

    _updateMorphNumber() {
        if (this._morphNumberTarget) {
            let sign = this._morphNumberTarget > this._counterLabel.scale.x ? 1 : -1;
            this._counterLabel.scale.x += sign * this._morphNumberSpeed;
            this._counterLabel.scale.y += sign * this._morphNumberSpeed;

            if (Math.abs(this._counterLabel.scale.x - this._morphNumberTarget) < this._morphNumberSpeed) {
                this._counterLabel.scale.set(this._morphNumberTarget, this._morphNumberTarget);
                this._morphNumberTarget = undefined;
            }

            this._morphPreviousSize = [this._counterLabel.width, this._counterLabel.height];
        }
    }

    _updateBlendNumber() {
        if (this._blendNumberTarget) {
            let colors = utils.RGBFromString(this._counterLabel.style._fill);
            for (let key in colors)
                colors[key] = Math.max(Math.min(255, colors[key] + this._blendNumberSpeeds[key]), 0);
            this._blendNumberIncrementsRemaining--;

            let style = { ...this._counterLabel.style };
            style.fill =
                this._blendNumberIncrementsRemaining === 0 ? this._blendNumberTarget : utils.StringFromRGB(colors);

            this._counterLabel.style = style;

            if (this._blendNumberIncrementsRemaining === 0) {
                this._blendNumberTarget = undefined;
            }
        }
    }

    _updateFade() {
        if (this._fadeTarget) {
            if (Math.abs(this.sprite.alpha - this._fadeTarget) < this._fadeSpeed) {
                this.sprite.alpha = this._fadeTarget;
                this._fadeTarget = undefined;
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
                this._morphTarget = undefined;
            }
        }
    }

    update(delta: number) {
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
