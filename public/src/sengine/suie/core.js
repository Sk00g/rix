export const SOURCE_PATH = "graphics/ui/source/source.png";
export const ICON_PATH_BROWN = "graphics/ui/source/Set1.png";
export const ICON_PATH_BLUE = "graphics/ui/source/Set2.png";
export const RESOLUTION_SCALE = 1.0;

let _UID = 100;
export function generateUID() {
    return _UID++;
}

export const PanelColor = Object.freeze({
    BLUE: "blue",
    ORANGE: "orange",
});

export const PanelSize = Object.freeze({
    LARGE: "large",
    SMALL: "small",
});

export const IconType = Object.freeze({
    BLANK: 0,
    ARROW_RIGHT: 4,
    ARROW_LEFT: 5,
    ARROW_DOWN: 6,
    ARROW_UP: 7,
    RESET: 9,
    MAX: 12,
    PLUS: 23,
    MINUS: 24,
    CHECK: 27,
    DELETE: 28,
});
