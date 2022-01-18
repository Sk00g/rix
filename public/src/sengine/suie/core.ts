import * as PIXI from "pixi.js";
export const SOURCE_PATH = "graphics/ui/source/source.png";
export const ICON_PATH_BROWN = "graphics/ui/source/Set1.png";
export const ICON_PATH_BLUE = "graphics/ui/source/Set2.png";
export const RESOLUTION_SCALE = 1.0;

export class SUIEBase extends PIXI.Container {
    _uid: number;

    constructor() {
        super();

        this._uid = generateUID();
    }
}

let _UID = 100;
export function generateUID() {
    return _UID++;
}

export enum PanelColor {
    Blue = "blue",
    Orange = "orange",
}

export enum PanelSize {
    Large = "large",
    Small = "small",
}

export enum Border {
    tl = "tl",
    t = "t",
    tr = "tr",
    r = "r",
    br = "br",
    b = "b",
    bl = "bl",
    l = "l",
    m = "m",
}

export enum IconType {
    BLANK = 0,
    ARROW_RIGHT = 4,
    ARROW_LEFT = 5,
    ARROW_DOWN = 6,
    ARROW_UP = 7,
    RESET = 9,
    MAX = 12,
    PLUS = 23,
    MINUS = 24,
    CHECK = 27,
    DELETE = 28,
}
